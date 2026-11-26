const { createServer } = require("node:http");
const { createReadStream } = require("node:fs");
const { stat } = require("node:fs/promises");
const { resolve, relative, sep } = require("node:path");
const { randomBytes, randomUUID } = require("node:crypto");
const { players: seats, getBoard, matchDurationMs, wrongPopLockMs } = require("./gameplay-rules.js");

const rooms = new Map();
const connections = new Map();
const reconnectMs = 60_000;
const launchDelayMs = 2500;
const rootFiles = new Set(["index.html", "tailwind.css", "styles.css", "gameplay.css", "gameplay-rules.js",
  "gameplay.js", "multiplayer.js", "app.js"]);
const servedFolders = new Set(["pages", "sounds", "component_board"]);
const mime = {
  html: "text/html; charset=utf-8", css: "text/css; charset=utf-8", js: "text/javascript; charset=utf-8",
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", mp3: "audio/mpeg",
};

const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    if (request.method === "GET" && pathname === "/multiplayer/events") {
      openStream(response);
      return;
    }
    if (request.method === "POST" && pathname.startsWith("/multiplayer/input/")) {
      await receiveInput(request, response, pathname.split("/").at(-1));
      return;
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { Allow: "GET, HEAD" }).end();
      return;
    }
    if (pathname === "/api/multiplayer") {
      response.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" })
        .end(request.method === "HEAD" ? undefined : '{"protocol":2}');
      return;
    }

    const file = resolve(__dirname, "." + (pathname === "/" ? "/index.html" : pathname));
    const parts = relative(__dirname, file).split(sep);
    const type = mime[file.split(".").at(-1).toLowerCase()];
    if (parts[0] === ".." || !type ||
        !(parts.length === 1 ? rootFiles.has(parts[0]) : servedFolders.has(parts[0]))) {
      response.writeHead(404).end();
      return;
    }
    const info = await stat(file);
    if (!info.isFile()) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, {
      "Content-Type": type,
      "Content-Length": info.size,
      "Cache-Control": parts.length === 1 ? "no-cache" : "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    });
    if (request.method === "HEAD") response.end();
    else createReadStream(file).on("error", () => response.destroy()).pipe(response);
  } catch {
    if (!response.headersSent) response.writeHead(404);
    response.end();
  }
});

function openStream(response) {
  const channel = randomUUID();
  const socket = {
    response,
    close(code) {
      if (code === 4001) send(socket, { type: "error", message: "Room opened in another tab.", fatal: true });
      response.end();
    },
  };
  connections.set(channel, socket);
  const joinDeadline = setTimeout(() => { if (!socket.player) socket.close(); }, 10_000);
  response.once("close", () => {
    clearTimeout(joinDeadline);
    connections.delete(channel);
    disconnect(socket);
  });
  response.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "X-Accel-Buffering": "no",
  });
  send(socket, { type: "channel", channel });
}

async function receiveInput(request, response, channel) {
  const origin = request.headers.origin;
  if (origin && new URL(origin).host !== request.headers.host) {
    response.writeHead(403).end();
    return;
  }
  const socket = connections.get(channel);
  if (!socket || socket.response.writableEnded) {
    response.writeHead(410).end();
    return;
  }
  const chunks = [];
  let length = 0;
  for await (const chunk of request) {
    length += chunk.length;
    if (length > 2048) {
      response.writeHead(413).end();
      return;
    }
    chunks.push(chunk);
  }
  if (connections.get(channel) !== socket || socket.response.writableEnded) {
    response.writeHead(410).end();
    return;
  }
  let message;
  try {
    message = JSON.parse(Buffer.concat(chunks).toString());
  } catch {
    response.writeHead(400).end();
    return;
  }
  if (message && typeof message === "object") handleInput(socket, message);
  response.writeHead(204).end();
}

function send(socket, data) {
  if (socket && !socket.response.writableEnded && !socket.response.destroyed) {
    if (socket.response.writableLength > 64_000) socket.response.destroy();
    else socket.response.write(`data: ${JSON.stringify(data)}\n\n`);
  }
}

function sendError(socket, message, fatal = false) {
  send(socket, { type: "error", message, fatal });
  if (fatal) socket.close(1008);
}

function scorePlayer({ seat, play }) {
  return {
    seat,
    cleared: play?.cleared ?? 0,
    targetCount: play?.targetCount ?? getBoard().targetCount,
    reachedAt: play?.reachedAt ?? 0,
  };
}

function broadcast(room) {
  const match = room.match;
  const joined = [...room.players.values()];
  const players = joined.map(({ seat, socket, ready }) => ({ seat, connected: Boolean(socket), ready }));
  const state = {
    type: "state", code: room.code, mode: room.mode, host: room.host,
    phase: match?.phase ?? "lobby", matchId: match?.id ?? null,
    startsAt: match?.startsAt ?? null, endsAt: match?.endsAt ?? null,
    finishedAt: match?.finishedAt ?? null, winner: match?.winner ?? null,
    players, scores: match?.scores ?? joined.filter(({ play }) => play).map(scorePlayer),
    serverNow: Date.now(),
  };
  for (const player of joined) {
    if (!player.socket) continue;
    send(player.socket, { ...state, you: player.seat, token: player.token, self: player.play ?? null });
  }
}

function createRoom(mode) {
  let code;
  do code = randomBytes(3).toString("hex").toUpperCase(); while (rooms.has(code));
  const room = { code, mode, host: null, players: new Map(), match: null };
  rooms.set(code, room);
  return room;
}

function moveHost(room) {
  if (room.players.get(room.host)?.socket) return;
  room.host = [...room.players.values()].find((player) => player.socket)?.seat ?? null;
}

function removePlayer(room, player) {
  clearTimeout(player.expiry);
  room.players.delete(player.seat);
  moveHost(room);
  if (!room.players.size) {
    clearTimeout(room.match?.timer);
    rooms.delete(room.code);
  }
}

function attach(socket, room, player) {
  clearTimeout(player.expiry);
  if (player.socket) player.socket.close(4001, "Session resumed");
  socket.room = room;
  socket.player = player;
  player.socket = socket;
  moveHost(room);
  broadcast(room);
}

function join(socket, message) {
  const { mode, code, token, boardId } = message;
  if (mode !== "ranked" && mode !== "private") {
    sendError(socket, "Choose Quick Match or Private Room.", true);
    return;
  }
  if (code) {
    const room = rooms.get(code);
    const existing = room && typeof token === "string" &&
      [...room.players.values()].find((player) => player.token === token);
    if (existing) {
      if (room.match?.phase !== "playing" && typeof boardId === "string" && boardId) {
        existing.boardId = getBoard(boardId).id;
      }
      attach(socket, room, existing);
      return;
    }
    if (token || room?.mode !== "private" || mode !== "private" ||
        room.match?.phase === "playing" || room.players.size >= seats.length) {
      sendError(socket, token ? "Your room session expired. Rejoin from Home." : "This private room is closed, full, or already playing.", true);
      return;
    }
    addPlayer(socket, room, boardId);
    return;
  }
  const available = mode === "ranked" && [...rooms.values()].find((room) =>
    room.mode === "ranked" && !room.match && room.players.size < seats.length);
  addPlayer(socket, available || createRoom(mode), boardId);
}

function addPlayer(socket, room, boardId) {
  const seat = seats.findIndex((_, index) => !room.players.has(index));
  const player = { seat, token: randomUUID(), socket: null, ready: false, boardId: getBoard(boardId).id, play: null };
  room.players.set(seat, player);
  attach(socket, room, player);
}

function finish(room, winner) {
  if (room.match?.phase !== "playing") return;
  clearTimeout(room.match.timer);
  room.match.phase = "finished";
  room.match.winner = winner;
  room.match.finishedAt = Math.min(Date.now(), room.match.endsAt);
  room.match.scores = [...room.players.values()].map(scorePlayer);
  broadcast(room);
}

function start(room, player) {
  if (room.match?.phase === "playing" || room.host !== player.seat) {
    sendError(player.socket, "Only the host can start a new match.");
    return;
  }
  const joined = [...room.players.values()].filter((member) => member.socket);
  if (joined.length < 2 || !joined.every((member) => member.ready)) {
    sendError(player.socket, "At least two players must join and be ready.");
    return;
  }
  for (const member of [...room.players.values()]) {
    if (!member.socket) removePlayer(room, member);
  }
  const startsAt = Date.now() + launchDelayMs;
  const endsAt = startsAt + matchDurationMs;
  const timer = setTimeout(() => finish(room, null), launchDelayMs + matchDurationMs);
  room.match = { id: randomUUID(), phase: "playing", startsAt, endsAt, timer, winner: null };
  for (const member of joined) {
    const board = getBoard(member.boardId);
    member.ready = false;
    member.play = { boardId: board.id, targetCount: board.targetCount, stage: 0, popped: [], cleared: 0, reachedAt: 0, lockUntil: 0, ack: 0 };
  }
  broadcast(room);
}

function play(room, player, message) {
  const match = room.match;
  const current = player.play;
  if (!current || match?.id !== message.matchId || !Number.isSafeInteger(message.seq) ||
      message.seq <= current.ack) return;

  current.ack = message.seq;
  const now = Date.now();
  if (match.phase !== "playing" || now < match.startsAt || current.stage !== message.stage || now < current.lockUntil) {
    broadcast(room);
    return;
  }
  if (now >= match.endsAt) {
    finish(room, null);
    return;
  }

  const board = getBoard(current.boardId);
  const targets = board.stages[current.stage];
  const cleared = current.popped.length === targets.length;
  if (message.type === "rush" && cleared && current.stage < board.stages.length - 1) {
    current.stage += 1;
    current.popped = [];
  } else if (message.type === "pop" && !cleared && Number.isInteger(message.cell) && message.cell >= 0 && message.cell < board.cellCount) {
    if (!targets.includes(message.cell) || current.popped.includes(message.cell)) {
      current.lockUntil = now + wrongPopLockMs;
    } else {
      current.popped.push(message.cell);
      current.cleared += 1;
      current.reachedAt = now - match.startsAt;
      if (current.cleared === board.targetCount) {
        finish(room, player.seat);
        return;
      }
    }
  }
  broadcast(room);
}

function handleInput(socket, message) {
    const { room, player } = socket;
    if (!player) {
      if (message.type === "join") join(socket, message);
      return;
    }
    if (player.socket !== socket) return;
    if (message.type === "leave") {
      player.left = true;
      socket.close();
    } else if (message.type === "ready" && room.match?.phase !== "playing" && typeof message.ready === "boolean") {
      player.ready = message.ready;
      broadcast(room);
    } else if (message.type === "board" && room.match?.phase !== "playing" && typeof message.boardId === "string") {
      player.boardId = getBoard(message.boardId).id;
      broadcast(room);
    } else if (message.type === "start") {
      start(room, player);
    } else if (message.type === "pop" || message.type === "rush") {
      play(room, player, message);
    }
}

function disconnect(socket) {
    const { room, player } = socket;
    if (!player || player.socket !== socket) return;
    player.socket = null;
    player.ready = false;
    const playing = room.match?.phase === "playing";
    if (player.left && !playing) {
      removePlayer(room, player);
    } else {
      player.expiry = setTimeout(() => {
        if (room.match?.phase === "playing") return;
        removePlayer(room, player);
        broadcast(room);
      }, reconnectMs);
    }
    moveHost(room);
    broadcast(room);
}

const heartbeat = setInterval(() => {
  for (const { response } of connections.values()) {
    if (response.writableLength > 64_000) response.destroy();
    else if (!response.writableEnded) response.write(": heartbeat\n\n");
  }
}, 15_000);
heartbeat.unref();

const port = Number(process.env.PORT || 8000);
const host = process.env.HOST || "0.0.0.0";
server.listen(port, host, () => process.stdout.write(`Pop Rush multiplayer listening on port ${server.address().port}\n`));
