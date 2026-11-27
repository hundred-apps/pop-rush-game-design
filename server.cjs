const { createServer } = require("node:http");
const { createReadStream } = require("node:fs");
const { stat } = require("node:fs/promises");
const { resolve, relative, sep } = require("node:path");
const { randomBytes, randomUUID } = require("node:crypto");
const {
  players: seats,
  getBoard,
  modeOrder,
  modes,
  getNextMode,
  createClassicStages,
  createSessionTargets,
  pickClassicColorPair,
  pickColorHuntPair,
  frenzyMaxLives,
  matchDurationMs,
  wrongPopLockMs,
} = require("./gameplay-rules.js");

const rooms = new Map();
const connections = new Map();
const reconnectMs = 60_000;
const launchDelayMs = 2500;
const rootFiles = new Set(["index.html", "tailwind.css", "styles.css", "gameplay.css", "panels.css", "gameplay-rules.js",
  "gameplay.js", "multiplayer.js", "panels.js", "app.js"]);
const servedFolders = new Set(["pages", "sounds"]);
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
    totalCleared: play?.totalCleared ?? play?.cleared ?? 0,
    score: play?.score ?? 0,
    targetCount: play?.targetCount ?? getBoard().targetCount,
    reachedAt: play?.reachedAt ?? 0,
    lives: play?.lives ?? null,
    alive: play?.alive ?? true,
  };
}

function broadcast(room) {
  const match = room.match;
  const joined = [...room.players.values()];
  const players = joined.map(({ seat, socket, ready }) => ({ seat, connected: Boolean(socket), ready }));
  const state = {
    type: "state", code: room.code, mode: room.mode, host: room.host,
    gameMode: match?.gameMode ?? room.gameMode,
    rushSeconds: match?.rushSeconds ?? room.rushSeconds,
    modeLevel: match?.modeLevel ?? room.modeLevel,
    round: match?.round ?? 0,
    phase: match?.phase ?? "lobby", matchId: match?.id ?? null,
    startsAt: match?.startsAt ?? null, endsAt: match?.endsAt ?? null,
    finishedAt: match?.finishedAt ?? null, winner: match?.winner ?? null,
    players, scores: match?.scores ?? joined.filter(({ play }) => play).map(scorePlayer),
    serverNow: Date.now(),
  };
  for (const player of joined) {
    if (!player.socket) continue;
    const playState = player.play ? { ...player.play, stages: undefined } : null;
    send(player.socket, { ...state, you: player.seat, token: player.token, self: playState });
  }
}

function createRoom(mode) {
  let code;
  do code = randomBytes(3).toString("hex").toUpperCase(); while (rooms.has(code));
  const room = { code, mode, gameMode: "classic", rushSeconds: 45, modeLevel: 1, host: null, players: new Map(), match: null };
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

function topScoreSeat(players) {
  const ranked = [...players].sort((a, b) =>
    (b.play?.score ?? 0) - (a.play?.score ?? 0) ||
    (b.play?.cleared ?? 0) - (a.play?.cleared ?? 0) ||
    (a.play?.reachedAt ?? 0) - (b.play?.reachedAt ?? 0),
  );
  return ranked[0]?.seat ?? null;
}

function finish(room, winner) {
  if (room.match?.phase !== "playing") return;
  clearTimeout(room.match.timer);
  const gameMode = room.match.gameMode;
  const resolvedWinner =
    winner === null && (gameMode === "rush" || gameMode === "frenzy")
      ? topScoreSeat(room.players.values())
      : winner;
  room.match.phase = "finished";
  room.match.winner = resolvedWinner;
  room.match.finishedAt = Math.min(Date.now(), room.match.endsAt);
  room.match.scores = [...room.players.values()].map(scorePlayer);
  broadcast(room);
}

function expectedTargetCount(board, gameMode) {
  if (gameMode === "classic") return board.targetCount;
  if (gameMode === "memory") return Math.max(1, Math.round(board.cellCount * 0.30)) * 10;
  if (gameMode === "sequence") return board.cellCount * 10;
  if (gameMode === "color_hunt") return Math.max(1, Math.round(board.cellCount * 0.50)) * 10;
  return board.targetCount;
}

function createModeSession(board, gameMode, stageIdx, prebuiltStages) {
  if (gameMode === "classic") {
    return {
      targets: [...(prebuiltStages?.[stageIdx] ?? board.stages[stageIdx])],
      pushed: [],
      spillOrder: null,
      stageCount: prebuiltStages?.length ?? board.stages.length,
    };
  }
  if (gameMode === "rush") {
    return {
      targets: createClassicStages(board)[0],
      pushed: [],
      colorPair: null,
      spillOrder: null,
      stageCount: null,
    };
  }
  if (gameMode === "memory") {
    const spillOrder = createSessionTargets(board.cellCount, 0.30);
    return {
      targets: [...spillOrder],
      pushed: [],
      colorPair: null,
      spillOrder,
      stageCount: 10,
    };
  }
  if (gameMode === "sequence") {
    return {
      targets: createSessionTargets(board.cellCount, 0.50),
      pushed: [],
      colorPair: null,
      spillOrder: null,
      stageCount: 10,
    };
  }
  if (gameMode === "color_hunt") {
    return {
      targets: createSessionTargets(board.cellCount, 0.50),
      pushed: [],
      colorPair: pickColorHuntPair(),
      spillOrder: null,
      stageCount: 10,
    };
  }
  return {
    targets: createSessionTargets(board.cellCount, 0.50),
    pushed: [],
    colorPair: null,
    spillOrder: null,
    stageCount: 1,
  };
}

function getRoundDurationMs(gameMode, rushSeconds) {
  if (gameMode === "classic") return matchDurationMs;
  if (gameMode === "rush") return rushSeconds * 1000;
  return 600_000;
}

function advanceRoomMode(room, roundWinnerSeat = null) {
  const match = room.match;
  if (match?.phase !== "playing") return;
  const nextMode = getNextMode(match.gameMode);
  if (!nextMode) {
    finish(room, topScoreSeat(room.players.values()));
    return;
  }
  if (roundWinnerSeat !== null) {
    const roundWinner = room.players.get(roundWinnerSeat);
    if (roundWinner?.play) roundWinner.play.score += 100;
  }
  clearTimeout(match.timer);
  const rushSeconds = match.rushSeconds ?? 45;
  const durationMs = getRoundDurationMs(nextMode, rushSeconds);
  const startsAt = Date.now() + launchDelayMs;
  const endsAt = startsAt + durationMs;
  match.round += 1;
  match.gameMode = nextMode;
  match.durationMs = durationMs;
  match.startsAt = startsAt;
  match.endsAt = endsAt;
  match.timer = setTimeout(
    () => (getNextMode(nextMode) ? advanceRoomMode(room, null) : finish(room, null)),
    launchDelayMs + durationMs,
  );
  for (const member of room.players.values()) {
    const board = getBoard(member.boardId);
    const stages = nextMode === "classic" ? createClassicStages(board) : null;
    const session = createModeSession(board, nextMode, 0, stages);
    const prev = member.play;
    member.play = {
      boardId: board.id,
      stages,
      ...session,
      stage: 0,
      cleared: 0,
      totalCleared: prev?.totalCleared ?? prev?.cleared ?? 0,
      score: prev?.score ?? 0,
      lives: nextMode === "frenzy" ? frenzyMaxLives : null,
      alive: true,
      targetCount: expectedTargetCount(board, nextMode),
      reachedAt: 0,
      lockUntil: 0,
      ack: prev?.ack ?? 0,
    };
  }
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
  const gameMode = room.gameMode ?? "classic";
  const rushSeconds = room.rushSeconds ?? 45;
  const modeLevel = room.modeLevel ?? 1;
  const durationMs = getRoundDurationMs(gameMode, rushSeconds);
  const startsAt = Date.now() + launchDelayMs;
  const endsAt = startsAt + durationMs;
  const timer = setTimeout(
    () => (getNextMode(gameMode) ? advanceRoomMode(room, null) : finish(room, null)),
    launchDelayMs + durationMs,
  );
  room.match = { id: randomUUID(), phase: "playing", round: 0, gameMode, rushSeconds, modeLevel, durationMs, startsAt, endsAt, timer, winner: null };
  const classicColorPair = gameMode === "classic" ? pickClassicColorPair() : null;
  for (const member of joined) {
    const board = getBoard(member.boardId);
    const stages = gameMode === "classic" ? createClassicStages(board) : null;
    const session = createModeSession(board, gameMode, 0, stages);
    member.ready = false;
    member.play = {
      boardId: board.id,
      stages,
      colorPair: classicColorPair,
      ...session,
      stage: 0,
      cleared: 0,
      totalCleared: 0,
      score: 0,
      lives: gameMode === "frenzy" ? frenzyMaxLives : null,
      alive: true,
      targetCount: expectedTargetCount(board, gameMode),
      reachedAt: 0,
      lockUntil: 0,
      ack: 0,
    };
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
  const staleRound = message.round !== undefined && message.round !== match.round;
  if (match.phase !== "playing" || !current.alive || staleRound || now < match.startsAt ||
      current.stage !== message.stage || now < current.lockUntil) {
    broadcast(room);
    return;
  }
  if (now >= match.endsAt) {
    if (getNextMode(match.gameMode)) advanceRoomMode(room, null);
    else finish(room, null);
    return;
  }

  const board = getBoard(current.boardId);
  const gameMode = match.gameMode ?? "classic";
  const cleared = current.targets.length === 0;

  if (message.type === "rush" && cleared) {
    if (gameMode === "rush") {
      current.score += 50;
      current.stage += 1;
      Object.assign(current, createModeSession(board, "rush", current.stage));
    } else if (current.stageCount && current.stage < current.stageCount - 1) {
      current.stage += 1;
      Object.assign(current, createModeSession(board, gameMode, current.stage, current.stages));
    }
  } else if (!cleared && (message.type === "rush" ||
      (message.type === "pop" && Number.isInteger(message.cell) && message.cell >= 0 && message.cell < board.cellCount))) {
    const targetIdx = message.type === "rush" ? -1 : current.targets.indexOf(message.cell);
    if (targetIdx < 0) {
      if (gameMode === "frenzy") {
        current.lives = Math.max(0, (current.lives ?? frenzyMaxLives) - 1);
        if (current.lives <= 0) {
          current.alive = false;
          const allOut = [...room.players.values()].every((m) => !m.socket || !m.play?.alive);
          if (allOut) {
            finish(room, topScoreSeat(room.players.values()));
            return;
          }
        } else {
          current.lockUntil = now + 380;
        }
      } else {
        current.lockUntil = now + wrongPopLockMs;
      }
    } else {
      current.targets.splice(targetIdx, 1);
      current.cleared += 1;
      current.totalCleared = (current.totalCleared ?? 0) + 1;
      current.score += 10;
      current.reachedAt = now - match.startsAt;

      if (gameMode === "sequence") {
        current.pushed.push(message.cell);
        const occupied = new Set([...current.targets, ...current.pushed]);
        const offPool = [];
        for (let i = 0; i < board.cellCount; i += 1) {
          if (!occupied.has(i)) offPool.push(i);
        }
        if (offPool.length > 0) {
          current.targets.push(offPool[Math.floor(Math.random() * offPool.length)]);
        }
      } else if (gameMode === "frenzy") {
        current.pushed = [message.cell];
        const busy = new Set([message.cell, ...current.targets]);
        const offPool = [];
        for (let i = 0; i < board.cellCount; i += 1) {
          if (!busy.has(i)) offPool.push(i);
        }
        if (offPool.length > 0) {
          current.targets.push(offPool[Math.floor(Math.random() * offPool.length)]);
        }
      } else {
        current.pushed.push(message.cell);
      }

      if (gameMode !== "rush" && gameMode !== "frenzy" &&
          current.targets.length === 0 && current.stage === current.stageCount - 1) {
        advanceRoomMode(room, player.seat);
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
    } else if (message.type === "config" && room.match?.phase !== "playing" && room.host === player.seat) {
      if (typeof message.gameMode === "string" && modeOrder.includes(message.gameMode)) {
        room.gameMode = message.gameMode;
      }
      if ([30, 45, 60].includes(message.rushSeconds)) {
        room.rushSeconds = message.rushSeconds;
      }
      if (Number.isInteger(message.modeLevel)) {
        const maxLv = modes[room.gameMode]?.maxLevel ?? 100;
        room.modeLevel = Math.max(1, Math.min(maxLv, message.modeLevel));
      }
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
