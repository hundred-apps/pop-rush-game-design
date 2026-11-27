const { createServer } = require("node:http");
const { createReadStream } = require("node:fs");
const { stat } = require("node:fs/promises");
const { resolve, relative, sep } = require("node:path");
const { randomBytes, randomUUID } = require("node:crypto");
const { createFrenzyRecords } = require("./frenzy-records.cjs");
const { createLiveEvents } = require("./live-events.cjs");
const {
  players: seats,
  getBoard,
  modeOrder,
  modes,
  createLevelSession,
  getGameLevel,
  normalizeGameLevel,
  sessionDuration,
  memorySpillDuration,
  getFrenzyTier,
  moveDecoyColors,
  getPlayerLevel,
  allowedPlayerLoadout,
  weekendBonus,
  pickClassicColorPair,
  createRunState,
  scoreCorrect,
  resetSessionScoring,
  scoreWrong,
  skillDefinitions,
  normalizeLoadout,
  createBotLoadout,
  botLevels,
  botDelay,
  chooseBotSkill,
  canCastSkill,
  castSkill,
  landAttack,
  attackWarningMs,
  attackGraceMs,
} = require("./gameplay-rules.js");

const rooms = new Map();
const dataDirectory = process.env.POPRUSH_DATA_DIR || resolve(__dirname, ".poprush-data");
const frenzyRecords = createFrenzyRecords(dataDirectory);
const liveEvents = createLiveEvents(dataDirectory);
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
        .end(request.method === "HEAD" ? undefined : '{"protocol":3}');
      return;
    }
    if (pathname === "/api/frenzy") {
      response.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" })
        .end(request.method === "HEAD" ? undefined : JSON.stringify(frenzyRecords.list()));
      return;
    }
    if (pathname === "/api/live-events") {
      const profile = request.headers["x-pop-profile"];
      const id = typeof profile === "string" && /^[a-f0-9]{32}$/.test(profile) ? profile : null;
      response.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" })
        .end(request.method === "HEAD" ? undefined : JSON.stringify(liveEvents.snapshot(id)));
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

function playerIdentity(player) {
  const character = seats.find((entry) => entry.character === player.character) ?? seats[player.seat];
  return { character: character.character, name: player.name || character.name,
    level: player.bot ? character.level : getPlayerLevel(player.xp).level, frame: player.frame, title: player.title };
}

function scorePlayer(player) {
  const { seat, play } = player;
  return {
    seat,
    ...playerIdentity(player),
    cleared: play?.cleared ?? 0,
    totalCleared: play?.totalCleared ?? play?.cleared ?? 0,
    score: play?.score ?? 0,
    targetCount: play?.targetCount ?? getBoard().targetCount,
    reachedAt: play?.reachedAt ?? 0,
    lives: play?.lives ?? null,
    alive: play?.alive ?? true,
    forfeit: Boolean(play?.forfeit),
  };
}

function broadcast(room) {
  const match = room.match;
  const joined = [...room.players.values()];
  const crowned = match?.phase === "playing" ? null : frenzyRecords.crowned();
  const players = joined.map((player) => ({
    ...playerIdentity(player), seat: player.seat, connected: Boolean(player.socket || player.bot), ready: player.ready,
    bot: player.bot, weeklyCrown: crowned?.has(player.profileId) ?? false,
  }));
  const state = {
    type: "state", code: room.code, mode: room.mode, host: room.host,
    gameMode: match?.gameMode ?? room.gameMode,
    modeLevel: match?.modeLevel ?? room.modeLevel,
    round: match?.round ?? 0,
    phase: match?.phase ?? "lobby", matchId: match?.id ?? null,
    startsAt: match?.startsAt ?? null,
    finishedAt: match?.finishedAt ?? null, winner: match?.winner ?? null,
    players, scores: match?.scores ?? joined.filter(({ play }) => play).map(scorePlayer),
    serverNow: Date.now(), prepareUntil: room.prepareUntil ?? null,
  };
  for (const player of joined) {
    if (!player.socket) continue;
    send(player.socket, { ...state, you: player.seat, token: player.token, self: player.play });
  }
}

function createRoom(mode) {
  let code;
  do code = randomBytes(3).toString("hex").toUpperCase(); while (rooms.has(code));
  const room = { code, mode, gameMode: "classic", modeLevel: 1, host: null, players: new Map(), match: null };
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
    clearInterval(room.match?.timer);
    clearTimeout(room.queueTimer);
    clearTimeout(room.prepareTimer);
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
  if (!["private", "queue", "ranked"].includes(mode)) {
    sendError(socket, "Choose Quick Match or Private Room.", true);
    return;
  }
  const xp = Number.isSafeInteger(message.xp) && message.xp >= 0 ? message.xp : 0;
  const playerLevel = getPlayerLevel(xp).level;
  if (playerLevel < (mode === "ranked" ? 15 : 4)) {
    sendError(socket, mode === "ranked" ? "Ranked unlocks at Player Lv.15." : "Multiplayer unlocks at Player Lv.4.", true);
    return;
  }
  message.xp = xp;
  const profile = message.profileId;
  message.profileId = typeof profile === "string" && /^[a-f0-9]{32}$/.test(profile) ? profile : null;
  if (mode === "ranked" && !message.profileId) {
    sendError(socket, "Ranked requires browser storage for your player profile.", true);
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
    addPlayer(socket, room, boardId, message);
    return;
  }
  const requested = modeOrder.includes(message.gameMode) ? message.gameMode : "classic";
  const gameMode = playerLevel >= modes[requested].unlockLevel ? requested : "classic";
  const modeLevel = normalizeGameLevel(gameMode, message.modeLevel);
  const capacity = mode === "ranked" ? 2 : seats.length;
  const rankTier = mode === "ranked" ? liveEvents.rank(message.profileId) : null;
  const available = mode !== "private" && [...rooms.values()].find((room) =>
    room.mode === mode && room.gameMode === gameMode && room.modeLevel === modeLevel &&
      room.rankTier === rankTier && !room.match && !room.prepareUntil && room.players.size < capacity &&
      (mode !== "ranked" || ![...room.players.values()].some((player) => player.profileId === message.profileId)));
  const room = available || createRoom(mode);
  if (mode !== "private" && !available) Object.assign(room, { gameMode, modeLevel, rankTier });
  addPlayer(socket, room, boardId, message);
}

function addPlayer(socket, room, boardId, message) {
  const seat = seats.findIndex((_, index) => !room.players.has(index));
  const player = { seat, token: randomUUID(), socket: null, ready: false, boardId: getBoard(boardId).id, skillBudget: 0, play: null };
  if (typeof message.profileId === "string" && /^[a-f0-9]{32}$/.test(message.profileId)) player.profileId = message.profileId;
  player.name = typeof message.nickname === "string" ? message.nickname.trim().slice(0, 20) : "";
  player.character = message.character;
  player.xp = message.xp;
  const { frame, title } = message.cosmetics ?? {};
  player.frame = ["rookie", "lightning", "brainiac"].includes(frame) ? frame : null;
  player.title = ["Pop Master", "Untouchable", "Frenzy Maniac"].includes(title) ? title : null;
  room.players.set(seat, player);
  attach(socket, room, player);
  if (room.mode === "private") return;
  if (room.players.size === (room.mode === "ranked" ? 2 : seats.length)) preparePublicRoom(room);
  else if (room.mode === "queue" && !room.queueTimer) {
    room.queueTimer = setTimeout(() => preparePublicRoom(room), 12_000);
    room.queueTimer.unref();
  }
}

function preparePublicRoom(room) {
  clearTimeout(room.queueTimer);
  for (const member of [...room.players.values()]) if (!member.socket) removePlayer(room, member);
  if (!room.players.size) return;
  for (let seat = 0; room.mode === "queue" && seat < seats.length; seat += 1) {
    if (room.players.has(seat)) continue;
    room.players.set(seat, {
      seat, bot: true, ready: true, boardId: getBoard().id, skillBudget: Infinity,
      difficulty: "Medium", loadout: createBotLoadout("Medium"),
    });
  }
  room.prepareUntil = Date.now() + 15_000;
  room.prepareTimer = setTimeout(() => start(room, null), 15_000);
  room.prepareTimer.unref();
  broadcast(room);
}

function topScoreSeat(players) {
  const ranked = [...players].sort((a, b) =>
    Number(Boolean(a.play?.forfeit)) - Number(Boolean(b.play?.forfeit)) ||
    (b.play?.score ?? 0) - (a.play?.score ?? 0) ||
    (b.play?.cleared ?? 0) - (a.play?.cleared ?? 0) ||
    (a.play?.reachedAt ?? 0) - (b.play?.reachedAt ?? 0),
  );
  return ranked[0]?.seat ?? null;
}

function finish(room, winner) {
  if (room.match?.phase !== "playing") return;
  clearInterval(room.match.timer);
  const resolvedWinner = winner ?? topScoreSeat(room.players.values());
  room.match.phase = "finished";
  room.match.winner = resolvedWinner;
  room.match.finishedAt = Date.now();
  liveEvents.record([...room.players.values()].filter((member) => member.play).map((member) => ({
    ...playerIdentity(member), seat: member.seat, bot: member.bot, profileId: member.profileId, pops: member.play.totalCleared,
  })), resolvedWinner, room.mode === "ranked", room.match.finishedAt);
  if (room.match.gameMode === "frenzy") {
    for (const member of room.players.values()) {
      if (!member.bot && member.play) {
        const { name, character } = playerIdentity(member);
        frenzyRecords.submit(member.profileId, name, character, member.play.bestStreak, member.play.score);
      }
    }
  }
  room.match.scores = [...room.players.values()].map(scorePlayer);
  broadcast(room);
}

function createPlayerSession(match, board, startAt) {
  const session = createLevelSession(match.gameMode, match.modeLevel, board.cellCount, match.classicColorPair);
  const preview = match.gameMode === "memory" ? memorySpillDuration(match.modeLevel, session.spillOrder.length) : 0;
  const playFrom = startAt + preview;
  return { ...session, sessionStartedAt: startAt, playFrom,
    deadline: playFrom + sessionDuration(match.gameMode, match.modeLevel, board.cellCount) };
}

function start(room, player) {
  const isPublic = room.mode !== "private";
  if (isPublic && (!room.prepareUntil || room.match)) return;
  if (!isPublic && (room.match?.phase === "playing" || room.host !== player.seat)) {
    sendError(player.socket, "Only the host can start a new match.");
    return;
  }
  const joined = [...room.players.values()].filter((member) => member.socket || member.bot);
  if (isPublic && !joined.some((member) => member.socket)) {
    rooms.delete(room.code);
    return;
  }
  if (room.mode === "ranked" && joined.length !== 2) {
    room.prepareUntil = null;
    broadcast(room);
    return;
  }
  if (!isPublic && (joined.length < 2 || !joined.every((member) => member.ready))) {
    sendError(player.socket, "At least two players must join and be ready.");
    return;
  }
  for (const member of [...room.players.values()]) {
    if (!member.socket && !member.bot) removePlayer(room, member);
  }
  const gameMode = room.gameMode;
  if (joined.some((member) => !member.bot && getPlayerLevel(member.xp).level < modes[gameMode].unlockLevel)) {
    if (player?.socket) sendError(player.socket, "A player has not unlocked this mode.");
    return;
  }
  const modeLevel = normalizeGameLevel(gameMode, room.modeLevel);
  const startsAt = Date.now() + launchDelayMs + 550;
  const match = { id: randomUUID(), phase: "playing", round: 0, gameMode, modeLevel, startsAt, winner: null,
    classicColorPair: gameMode === "classic" ? pickClassicColorPair() : null };
  room.match = match;
  clearTimeout(room.prepareTimer);
  for (const member of joined) {
    const board = getBoard(member.boardId);
    const session = createPlayerSession(match, board, startsAt);
    member.ready = false;
    member.play = {
      boardId: board.id, ...session, ...createRunState(gameMode),
      stage: 0, cleared: 0, totalCleared: 0,
      loadout: member.bot ? member.loadout : allowedPlayerLoadout(member.loadout, true, member.xp),
      skillUpgrades: member.skillUpgrades,
      booster: member.booster ?? null, xpBoost: member.xpBoostUntil > startsAt,
      completed: false, alive: true, weekend: weekendBonus(gameMode, true, startsAt),
      targetCount: session.stageCount * (gameMode === "sequence" ? board.cellCount : session.targets.length),
      reachedAt: 0, lockUntil: 0, coinsSpent: 0, ack: 0,
    };
    if (member.booster === "shield_start") member.play.effects.shieldUntil = session.playFrom + 3000;
    member.booster = null;
    if (member.bot) {
      member.brain = { difficulty: member.difficulty, run: member.play, skills: member.play.loadout };
      member.brain.nextPop = session.playFrom + botDelay(botLevels[member.difficulty].delay);
    }
  }
  match.timer = setInterval(() => tickRoom(room), 50);
  match.timer.unref();
  broadcast(room);
}

function finishPlayerSession(current, board, match, now) {
  const missed = match.gameMode === "sequence" && current.targets.length
    ? board.cellCount - current.pushed.length : current.targets.length;
  if (missed) scoreWrong(current, missed, now);
  resetSessionScoring(current, match.gameMode, !missed);
  if (current.lives === 0 || current.stage + 1 >= current.stageCount) {
    current.completed = current.lives !== 0;
    current.alive = false;
    current.finishedAt = now;
    return;
  }
  Object.assign(current, createPlayerSession(match, board, now));
  current.stage += 1;
}

function expirePlayer(current, match, now) {
  if (match.gameMode === "frenzy") {
    scoreWrong(current, 1, now);
    if (!current.lives) {
      current.alive = false;
      current.finishedAt = now;
    } else current.deadline = now + getFrenzyTier(current.streak).durationMs;
  } else finishPlayerSession(current, getBoard(current.boardId), match, now);
}

function tickRoom(room) {
  const { match } = room;
  const now = Date.now();
  if (match.phase !== "playing" || now < match.startsAt) return;
  let changed = false;
  for (const player of room.players.values()) {
    const run = player.play;
    if (!run.alive || now < run.deadline) continue;
    expirePlayer(run, match, now);
    changed = true;
  }
  if (![...room.players.values()].some((player) => player.play.alive)) {
    finish(room, null);
    return;
  }
  if (changed) broadcast(room);
  tickPublicBots(room, now);
}

function tickPublicBots(room, now) {
  const { match } = room;
  for (const bot of room.players.values()) {
    if (!bot.bot || !bot.play.alive || now < bot.play.playFrom) continue;
    const run = bot.play;
    const brain = bot.brain;
    const config = botLevels[brain.difficulty];
    const dispatch = (type, data = {}) => play(room, bot, {
      ...data, type, matchId: match.id, seq: run.ack + 1, stage: run.stage,
    });
    const blocked = run.effects.paralyzeUntil > now;
    const skill = chooseBotSkill(brain, now, { mode: match.gameMode, targets: run.targets.length,
      rivals: [...room.players.values()].some((member) => member !== bot && member.play.alive) });
    if (skill && (!blocked || skill === "cleanse")) {
      dispatch("skill", { skill });
      continue;
    }
    if (blocked || now < brain.nextPop) continue;
    brain.nextPop = now + botDelay(config.delay);
    if (!run.targets.length && match.gameMode !== "frenzy") {
      dispatch("rush");
      continue;
    }
    const board = getBoard(run.boardId);
    const occupied = new Set([...run.targets, ...run.pushed]);
    const decoy = Array.from({ length: board.cellCount }, (_, index) => index).find((index) => !occupied.has(index));
    const mistake = Math.random() >= config.accuracy || (match.gameMode === "frenzy" && run.streak >= config.maxStreak);
    const cell = mistake && decoy !== undefined ? decoy : run.targets[Math.floor(Math.random() * run.targets.length)];
    if (cell !== undefined) dispatch("pop", { cell });
  }
}

function popMatchTarget(current, board, gameMode, cell, now, startsAt) {
  current.targets.splice(current.targets.indexOf(cell), 1);
  current.cleared += 1;
  current.totalCleared = (current.totalCleared ?? 0) + 1;
  scoreCorrect(current, gameMode, now, cell);
  if (gameMode === "frenzy") current.deadline = now + getFrenzyTier(current.streak).durationMs;
  current.reachedAt = now - startsAt;

  if (gameMode === "frenzy") {
    current.pushed = [cell];
    current.wrongPushed = [];
  } else current.pushed.push(cell);
  if (gameMode !== "sequence" && gameMode !== "frenzy") return;

  const occupied = new Set([...current.targets, ...current.pushed]);
  const offPool = Array.from({ length: board.cellCount }, (_, index) => index)
    .filter((index) => !occupied.has(index));
  if (offPool.length) {
    const next = offPool[Math.floor(Math.random() * offPool.length)];
    current.targets.push(next);
    if (gameMode === "sequence") current.appearedAt[next] = now;
  }
}

function scheduleAttack(room, target, skill, now) {
  const match = room.match;
  const run = target.play;
  const incoming = { skill, at: now + attackWarningMs };
  run.incoming = incoming;
  const timer = setTimeout(() => {
    if (room.match !== match || match.phase !== "playing" || run.incoming !== incoming || !run.alive) return;
    delete run.incoming;
    const board = getBoard(run.boardId);
    const result = landAttack(run, skill, Date.now(), board.cellCount, run.targets, run.pushed);
    if (result.blocked) run.blockedAt = Date.now();
    if (result.targets) {
      if (match.gameMode === "color_hunt") {
        moveDecoyColors(run.decoyColors, run.targets, result.targets);
      }
      run.targets = result.targets;
      if (match.gameMode === "memory") {
        const time = Date.now();
        const remaining = Math.max(0, run.deadline - Math.max(time, run.playFrom));
        run.spillOrder = [...result.targets];
        run.sessionStartedAt = time;
        run.playFrom = time + memorySpillDuration(match.modeLevel, result.targets.length);
        run.deadline = run.playFrom + remaining;
      }
    }
    broadcast(room);
  }, attackWarningMs);
  timer.unref();
}

function useMatchSkill(room, player, board, gameMode, skill, now, topUp) {
  const current = player.play;
  if (!current.loadout.includes(skill)) return;
  const { kind, coins } = skillDefinitions[skill];
  const lacksCoins = current.coinsSpent + coins > player.skillBudget;
  if (lacksCoins && (!topUp || !(player.skillGems >= 5))) return;
  const rivals = kind === "attack"
    ? [...room.players.values()]
        .filter((member) => member !== player && (member.socket || member.bot) && member.play?.alive &&
          !member.play.incoming && !(member.play.lastAttackedAt + attackGraceMs > now))
        .sort((a, b) => b.play.score - a.play.score)
    : [];
  const rival = player.difficulty === "Medium" ? rivals[Math.floor(Math.random() * rivals.length)] : rivals[0];
  if (!canCastSkill(current, skill, now, { mode: gameMode, targets: current.targets.length, rivals: Boolean(rival) })) return;
  if (lacksCoins) {
    player.skillBudget += 250;
    player.skillGems -= 5;
  }
  current.coinsSpent += coins;
  castSkill(current, skill, now);
  if (rival) scheduleAttack(room, rival, skill, now);
  if (skill === "blast") {
    const limit = Math.min(3, availableBotStreak(player, gameMode));
    for (let hits = 0; hits < limit && current.targets.length; hits += 1) {
      popMatchTarget(current, board, gameMode, current.targets[0], now, room.match.startsAt);
    }
  }
}

function availableBotStreak(player, mode) {
  return player.bot && mode === "frenzy" ? botLevels[player.difficulty].maxStreak - player.play.streak : Infinity;
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
      current.stage !== message.stage || now < current.playFrom || now < current.lockUntil) {
    broadcast(room);
    return;
  }
  if (now >= current.deadline) {
    const before = current.deadline;
    tickRoom(room);
    if (current.alive && current.deadline === before) broadcast(room);
    return;
  }

  const board = getBoard(current.boardId);
  const gameMode = match.gameMode ?? "classic";
  if (current.effects.paralyzeUntil > now &&
      !(message.type === "skill" && (message.skill === "cleanse" || message.skill === "shield"))) {
    broadcast(room);
    return;
  }
  if (message.type === "skill") {
    useMatchSkill(room, player, board, gameMode, message.skill, now, message.topUp === true);
  } else if (message.type === "rush" && gameMode !== "frenzy") {
    finishPlayerSession(current, board, match, now);
  } else if (message.type === "pop" && Number.isInteger(message.cell) &&
      message.cell >= 0 && message.cell < board.cellCount && !current.pushed.includes(message.cell)) {
    if (current.effects.magnet) {
      delete current.effects.magnet;
      const limit = Math.max(0, availableBotStreak(player, gameMode));
      for (const cell of current.targets.slice(0, limit)) popMatchTarget(current, board, gameMode, cell, now, match.startsAt);
    } else if (current.targets.includes(message.cell)) {
      popMatchTarget(current, board, gameMode, message.cell, now, match.startsAt);
    } else {
      current.pushed.push(message.cell);
      current.wrongPushed.push(message.cell);
      scoreWrong(current, 1, now);
      if (gameMode === "frenzy") current.deadline = now + getFrenzyTier(current.streak).durationMs;
      if (current.lives === 0) current.alive = false;
    }
  }

  if (!current.alive) current.finishedAt = now;
  if (![...room.players.values()].some((member) => member.play?.alive)) {
    finish(room, null);
    return;
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
      if (Number.isSafeInteger(message.coins) && message.coins >= 0) player.skillBudget = message.coins;
      if (Number.isSafeInteger(message.gems) && message.gems >= 0) player.skillGems = message.gems;
      player.loadout = normalizeLoadout(message.loadout, true);
      player.skillUpgrades = { shield: message.upgrades?.shield === 2 && getPlayerLevel(player.xp).level >= 3 ? 2 : 1 };
      player.booster = ["double_score", "shield_start"].includes(message.booster) ? message.booster : null;
      player.xpBoostUntil = Number.isSafeInteger(message.xpBoostUntil) ? message.xpBoostUntil : 0;
      broadcast(room);
      if (room.mode !== "private" && room.prepareUntil && [...room.players.values()].every((member) => member.ready)) start(room, player);
    } else if (message.type === "board" && room.match?.phase !== "playing" && typeof message.boardId === "string") {
      player.boardId = getBoard(message.boardId).id;
      broadcast(room);
    } else if (message.type === "config" && room.mode === "private" && room.match?.phase !== "playing" && room.host === player.seat) {
      if (modeOrder.includes(message.gameMode) && getPlayerLevel(player.xp).level >= modes[message.gameMode].unlockLevel) {
        room.gameMode = message.gameMode;
      }
      room.modeLevel = normalizeGameLevel(room.gameMode, message.modeLevel ?? room.modeLevel);
      broadcast(room);
    } else if (message.type === "start" && room.mode === "private") {
      start(room, player);
    } else if (message.type === "pop" || message.type === "rush" || message.type === "skill") {
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
    } else if (player.left && playing) {
      player.play.alive = false;
      player.play.forfeit = true;
      player.play.finishedAt ??= Date.now();
      finishAbandonedRoom(room);
    } else {
      player.expiry = setTimeout(() => {
        if (room.match?.phase === "playing") {
          player.play.alive = false;
          player.play.forfeit = true;
          player.play.finishedAt ??= Date.now();
          finishAbandonedRoom(room);
          broadcast(room);
          return;
        }
        removePlayer(room, player);
        broadcast(room);
      }, reconnectMs);
    }
    moveHost(room);
    broadcast(room);
}

function finishAbandonedRoom(room) {
  if (![...room.players.values()].some((member) => !member.bot && member.play?.alive)) {
    if (room.mode !== "private" && ![...room.players.values()].some((member) => member.socket)) {
      clearInterval(room.match.timer);
      rooms.delete(room.code);
    } else if (![...room.players.values()].some((member) => member.play?.alive)) {
      finish(room, null);
    }
  }
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
