const boards = popRules.boards;
let equippedBoard = boards[1];
try {
  const savedBoard = localStorage.getItem("pop-rush-board");
  if (savedBoard) equippedBoard = popRules.getBoard(savedBoard);
} catch {}
let activeBoard = equippedBoard;

function equipBoard(board) {
  equippedBoard = board;
  try { localStorage.setItem("pop-rush-board", board.id); } catch {}
}

function applyBoardTheme(element, board) {
  element.dataset.boardTheme = board.id;
}

function applyBubbleLayout(element, spec) {
  if (!spec) return;
  if (spec.shape === "paw-pad") {
    element.classList.add("gameplay-bubble--paw-pad");
    element.style.setProperty("--pad-left", `${spec.left}%`);
    element.style.setProperty("--pad-top", `${spec.top}%`);
    element.style.setProperty("--pad-width", `${spec.width}%`);
    element.style.setProperty("--pad-height", `${spec.height}%`);
    return;
  }
  element.style.setProperty("--cell-x", `${spec.x}%`);
  element.style.setProperty("--cell-y", `${spec.y}%`);
  element.style.setProperty("--cell-size", `${spec.d}%`);
}

const { players: gameplayPlayers, matchDurationMs, wrongPopLockMs } = popRules;
const shakeThreshold = 11;
const shakeMinIntervalMs = 55;
const shakeMaxIntervalMs = 500;
const rankLabels = ["1st", "2nd", "3rd", "4th"];

const gameplayTitle = document.querySelector("#gameplay-title");
const gameplayScreen = document.querySelector("#gameplay");
const gameplayTime = document.querySelector("#gameplay-time");
const gameplayScores = document.querySelector("#gameplay-scores");
const scoreCardTemplate = document.querySelector("#gameplay-player-card");
const gameplayRule = document.querySelector("#gameplay-rule");
const gameplayPenalty = document.querySelector("#gameplay-penalty");
const gameplayBoardStatus = document.querySelector("#gameplay-board-status");
const gameplayOnlineStatus = document.querySelector("#gameplay-online-status");
const gameplayGrid = document.querySelector("#gameplay-bubbles");
const popRushActions = document.querySelector("#gameplay-rush-actions");
const popRushButton = document.querySelector("#gameplay-pop-rush");
const popRushSlot = popRushButton.parentElement;
const popRushLabel = document.querySelector("#gameplay-rush-label");
const shakeHint = document.querySelector("#gameplay-shake-hint");
const enableShakeButton = document.querySelector("#gameplay-enable-shake");
const powerValue = document.querySelector("#gameplay-power-value");
const powerTrack = document.querySelector("#gameplay-power-track");
const gameplayResults = document.querySelector("#gameplay-results");
const gameplayResultsSummary = document.querySelector("#gameplay-results-summary");
const gameplayResultsOrder = document.querySelector("#gameplay-results-order");
const resultsPodium = document.querySelector("#gameplay-results-podium");
const resultsPlaceTemplate = document.querySelector("#results-place-template");
const resultsRowTemplate = document.querySelector("#results-row-template");
const resultPops = document.querySelector("#results-pops");
const resultProgress = document.querySelector("#results-progress");
const resultRank = document.querySelector("#results-rank");
const reduceBubbleMotion = matchMedia("(prefers-reduced-motion: reduce)");
const popHapticDurationMs = 18;
const queuedInputSounds = [];
let queuedPopHaptics = 0;

function createGameplayAudioContext() {
  if (location.protocol === "file:" || !window.AudioContext) return null;
  try {
    return new AudioContext({ latencyHint: "interactive" });
  } catch {
    return null;
  }
}

const gameplayAudioContext = createGameplayAudioContext();

function prepareGameplaySound(path, start, volume, voiceCount) {
  const sound = { path, start, volume, voiceCount, voices: [new Audio(path)], nextVoice: 0, buffer: null };
  if (gameplayAudioContext) {
    sound.output = gameplayAudioContext.createGain();
    sound.output.gain.value = volume;
    sound.output.connect(gameplayAudioContext.destination);
    fetch(path)
      .then((response) => {
        if (!response.ok) throw new Error(`Could not load ${path}.`);
        return response.arrayBuffer();
      })
      .then((data) => gameplayAudioContext.decodeAudioData(data))
      .then((buffer) => { sound.buffer = buffer; })
      .catch(() => {
        // Use the media player fallback if the sound buffer cannot be loaded.
      });
  }
  return sound;
}

const popSound = prepareGameplaySound("sounds/gun-shoot.mp3", 0, 0.32, 8);
const reloadSound = prepareGameplaySound("sounds/reload-sound.mp3", 0.026, 0.5, 2);
const incorrectSound = prepareGameplaySound("sounds/incorrect.mp3", 0, 0.5, 1);

const bubbleRiseFrames = [
  { transform: "scale(0.9)" },
  { transform: "scale(1.025)", offset: 0.65 },
  { transform: "none" },
];

let gameplayStartedAt = null;
let gameplayFrame = null;
let stageIndex = 0;
let stageCleared = 0;
let wrongPopTimer = null;
let onlineGameplay = null;
const motionEvent = window.isSecureContext ? window.DeviceMotionEvent : undefined;
let shakeAllowed = Boolean(motionEvent && typeof motionEvent.requestPermission !== "function");
let shakePulse = null;
let gravityBaseline = null;

const gameplayPlayerStates = gameplayPlayers.map((player) => {
  const card = scoreCardTemplate.content.firstElementChild.cloneNode(true);
  const portrait = card.querySelector(".gameplay-portrait");
  card.title = `${player.name} · Lv.${player.level}`;
  portrait.src = `pages/gameplay/player_card/${encodeURIComponent(player.character)}.png`;
  portrait.alt = `${player.character} portrait`;
  card.querySelector(".gameplay-name").textContent = player.name;
  card.querySelector(".gameplay-level").textContent = `Level ${player.level}`;
  return {
    ...player,
    card,
    rankLabel: card.querySelector(".gameplay-rank-label"),
    crown: card.querySelector(".gameplay-crown"),
    percent: card.querySelector(".gameplay-score-percent"),
    cleared: 0,
    targetCount: popRules.targetCount,
    reachedAt: 0,
  };
});
let [gameplayHuman, ...gameplayOpponents] = gameplayPlayerStates;
let temporaryCharacterSeat = 0;

function selectedCharacterSeat() {
  try {
    const id = localStorage.getItem("pop-rush-character");
    const seat = gameplayPlayers.findIndex(({ character }) => character === id);
    return seat < 0 ? temporaryCharacterSeat : seat;
  } catch {
    return temporaryCharacterSeat;
  }
}

function saveSelectedCharacter(seat) {
  temporaryCharacterSeat = seat;
  try { localStorage.setItem("pop-rush-character", gameplayPlayers[seat].character); } catch {}
}

function progressPercent(cleared, total) {
  return Math.floor(cleared * 100 / total);
}

function renderGameplayScores() {
  const players = onlineGameplay
    ? onlineGameplay.state.scores.map(({ seat }) => gameplayPlayerStates[seat])
    : gameplayPlayerStates;
  for (const player of gameplayPlayerStates) {
    if (!players.includes(player)) player.card.remove();
  }
  const ranked = [...players].sort(
    (a, b) => (b.cleared * a.targetCount) - (a.cleared * b.targetCount) || a.reachedAt - b.reachedAt
  );
  ranked.forEach((player, index) => {
    const isLeader = index === 0;
    player.card.classList.toggle("gameplay-score--leader", isLeader);
    player.rankLabel.textContent = rankLabels[index];
    player.rankLabel.classList.toggle("sr-only", isLeader);
    player.crown.hidden = !isLeader;
    player.percent.textContent = `${progressPercent(player.cleared, player.targetCount)}%`;
    if (gameplayScores.children[index] !== player.card) {
      gameplayScores.insertBefore(player.card, gameplayScores.children[index] ?? null);
    }
  });
  return ranked;
}

function renderGameplayTime(elapsed) {
  const tenths = Math.max(0, Math.ceil((matchDurationMs - elapsed) / 100));
  const minutes = String(Math.floor(tenths / 600)).padStart(2, "0");
  const seconds = String(Math.floor(tenths / 10) % 60).padStart(2, "0");
  const text = `${minutes}:${seconds}.${tenths % 10}`;
  if (gameplayTime.textContent !== text) gameplayTime.textContent = text;
}

function renderPopPower() {
  const percent = progressPercent(stageCleared, activeBoard.stages[stageIndex].length);
  powerValue.textContent = `${percent}%`;
  powerTrack.setAttribute("aria-valuenow", percent);
  powerTrack.firstElementChild.style.setProperty("--power", `${percent}%`);
}

function focusNextGameplayBubble() {
  const next = gameplayCells.find(({ bubble }) =>
    !bubble.disabled && !bubble.classList.contains("gameplay-bubble--white") &&
    bubble.getAttribute("aria-pressed") === "true"
  );
  next?.bubble.focus({ preventScroll: true });
}

function unlockGameplayAudio() {
  if (gameplayAudioContext && gameplayAudioContext.state !== "running") {
    gameplayAudioContext.resume().catch(() => {});
  }
}

function playGameplaySound(sound) {
  if (sound.buffer) {
    unlockGameplayAudio();
    const source = gameplayAudioContext.createBufferSource();
    source.buffer = sound.buffer;
    source.connect(sound.output);
    source.start(0, sound.start);
    return;
  }

  const voice = sound.voices[sound.nextVoice] ??= new Audio(sound.path);
  sound.nextVoice = (sound.nextVoice + 1) % sound.voiceCount;
  voice.volume = sound.volume;
  voice.currentTime = sound.start;
  voice.play().catch(() => {
    // Media playback can be blocked by the browser without stopping the game.
  });
}

function playQueuedInputFeedback() {
  if ((!queuedInputSounds.length && !queuedPopHaptics) || navigator.userActivation?.isActive === false) return;
  const sounds = queuedInputSounds.splice(0);
  const hapticCount = queuedPopHaptics;
  queuedPopHaptics = 0;
  for (const sound of sounds) playGameplaySound(sound);
  for (let index = 0; index < hapticCount; index += 1) navigator.vibrate(popHapticDurationMs);
}

window.addEventListener("pointerup", playQueuedInputFeedback, true);
window.addEventListener("touchend", playQueuedInputFeedback, true);
document.querySelector("#play-match").addEventListener("click", unlockGameplayAudio);

function playGameplayInputSound(sound, event) {
  const audioReady = sound.buffer && gameplayAudioContext?.state === "running";
  if (event.type === "touchstart" && !audioReady && !navigator.userActivation?.isActive) {
    // Touch activation can first become available when the finger lifts.
    queuedInputSounds.push(sound);
  } else {
    playGameplaySound(sound);
  }
}

function playPopFeedback(event) {
  playGameplayInputSound(popSound, event);
  if (typeof navigator.vibrate !== "function") return;
  if (event.type === "touchstart" && !navigator.userActivation?.hasBeenActive) {
    queuedPopHaptics += 1;
  } else {
    navigator.vibrate(popHapticDurationMs);
  }
}

function setGameplayBoardDisabled(disabled) {
  for (const { bubble } of gameplayCells) bubble.disabled = disabled;
}

function setWrongPopFeedback(locked) {
  gameplayPenalty.hidden = !locked;
  gameplayRule.hidden = locked;
  gameplayScreen.classList.toggle("gameplay--wrong-pop", locked);
  gameplayBoardStatus.textContent = locked ? "Wrong pop. Board locked for one second." : "";
}

function lockGameplayBoard(restoreFocus) {
  setGameplayBoardDisabled(true);
  setWrongPopFeedback(true);
  wrongPopTimer = setTimeout(() => {
    wrongPopTimer = null;
    if (!updateGameplayMatch(performance.now())) return;
    setWrongPopFeedback(false);
    setGameplayBoardDisabled(false);
    if (restoreFocus && document.activeElement === document.body) focusNextGameplayBubble();
  }, wrongPopLockMs);
}

function setPopRushReadyState(ready, { label = "Pop Rush", showBanner = false, moveFocus = false } = {}) {
  const wasReady = !popRushButton.disabled;
  popRushButton.disabled = !ready;
  popRushButton.dataset.mode = label === "Results" ? "results" : "rush";
  popRushSlot.dataset.ready = String(ready);
  if (popRushLabel.textContent !== label) popRushLabel.textContent = label;
  popRushActions.hidden = !showBanner;
  if (moveFocus && ready && !wasReady) popRushButton.focus({ preventScroll: true });
}

function showReadyPopRush(moveFocus = true) {
  setGameplayBoardDisabled(true);
  gameplayRule.hidden = true;
  enableShakeButton.hidden = typeof motionEvent?.requestPermission !== "function" || enableShakeButton.disabled;
  setPopRushReadyState(true, { label: "Pop Rush", showBanner: true, moveFocus });
}

function popGameplayBubble(cell, event) {
  const now = performance.now();
  if (cell.bubble.disabled || !updateGameplayMatch(now)) return;
  if (onlineGameplay && !sendOnlineGameplayInput("pop", { cell: cell.index })) return;

  if (cell.bubble.classList.contains("gameplay-bubble--white") || cell.bubble.getAttribute("aria-pressed") === "false") {
    if (onlineGameplay) {
      onlineGameplay.lockUntil = onlineGameplayClock(now) + wrongPopLockMs;
      updateOnlineGameplay(now);
    } else {
      lockGameplayBoard(event.type === "click" && event.detail === 0);
    }
    playGameplayInputSound(incorrectSound, event);
    return;
  }

  cell.riseAnimation?.cancel();
  cell.bubble.setAttribute("aria-pressed", "false");
  playPopFeedback(event);
  stageCleared += 1;
  renderPopPower();
  if (!onlineGameplay) {
    gameplayHuman.cleared += 1;
    gameplayHuman.reachedAt = now - gameplayStartedAt;
    renderGameplayScores();
  }

  if (!onlineGameplay && gameplayHuman.cleared === activeBoard.targetCount) {
    finishGameplayMatch(gameplayHuman);
  } else if (stageCleared === activeBoard.stages[stageIndex].length) {
    setGameplayBoardDisabled(true);
    if (stageIndex < activeBoard.stages.length - 1) showReadyPopRush();
  } else if (event.type === "click" && event.detail === 0) {
    focusNextGameplayBubble();
  }
}

let gameplayCells = [];

function buildGameplayCells(board) {
  if (gameplayGrid.dataset.builtBoard === board.id) return;
  gameplayGrid.dataset.builtBoard = board.id;
  gameplayGrid.dataset.boardLayout = board.layout;
  gameplayGrid.setAttribute("aria-label", `${board.ariaShape} bubble board`);

  gameplayCells = Array.from({ length: board.cellCount }, (_, index) => {
    const bubble = document.createElement("button");
    const face = document.createElement("span");
    const compress = document.createElement("span");
    const spec = board.cells?.[index];
    bubble.type = "button";
    bubble.className = "gameplay-bubble";
    face.className = "gameplay-bubble-face";
    face.setAttribute("aria-hidden", "true");
    compress.className = "gameplay-bubble-compress";
    face.append(compress);
    bubble.append(face);
    applyBubbleLayout(bubble, spec);

    const cell = {
      bubble,
      face,
      index,
      row: spec?.row ?? Math.floor(index / 4) + 1,
      column: spec?.column ?? index % 4 + 1,
      shape: spec?.shape ?? "circle",
    };
    bubble.addEventListener("touchstart", (event) => {
      // Cancel the touch event itself so the browser doesn't generate a second click.
      if (event.cancelable) event.preventDefault();
      if (event.defaultPrevented) popGameplayBubble(cell, event);
    }, { passive: false });
    bubble.addEventListener("click", (event) => {
      popGameplayBubble(cell, event);
    });
    return cell;
  });

  gameplayGrid.replaceChildren(...gameplayCells.map(({ bubble }) => bubble));
}

buildGameplayCells(equippedBoard);

function showGameplayStage(raiseBubbles = false) {
  buildGameplayCells(activeBoard);
  applyBoardTheme(gameplayGrid.parentElement, activeBoard);
  gameplayScreen.querySelector("#gameplay-board-name").textContent = activeBoard.name;
  stageCleared = 0;
  shakePulse = null;
  gravityBaseline = null;
  setGameplayBoardDisabled(false);
  const stages = activeBoard.stages;
  const targets = stages[stageIndex];
  gameplayTitle.textContent = `Stage ${stageIndex + 1}/${stages.length}`;
  for (const [index, cell] of gameplayCells.entries()) {
    const wasDown = cell.bubble.getAttribute("aria-pressed") === "false";
    const isTarget = targets.includes(index);
    const tone = isTarget ? "Green" : "White";
    cell.riseAnimation?.cancel();
    cell.bubble.classList.toggle("gameplay-bubble--white", !isTarget);
    cell.bubble.setAttribute(
      "aria-label",
      cell.shape === "paw-pad"
        ? `${tone} center paw bubble`
        : `${tone} bubble, row ${cell.row}, column ${cell.column}`,
    );
    cell.bubble.setAttribute("aria-pressed", "true");
    if (raiseBubbles && wasDown && !reduceBubbleMotion.matches) {
      cell.riseAnimation = cell.face.animate?.(bubbleRiseFrames, { duration: 230, easing: "ease-out" });
    }
  }
  setPopRushReadyState(false, { label: "Pop Rush", showBanner: false });
  setWrongPopFeedback(false);
  renderPopPower();
}

function startGameplayMatch() {
  stopGameplayMatch();
  onlineGameplay = null;
  activeBoard = equippedBoard;
  gameplayHuman = gameplayPlayerStates[selectedCharacterSeat()];
  gameplayOpponents = gameplayPlayerStates.filter((player) => player !== gameplayHuman);
  gameplayResultsOrder.replaceChildren();
  for (const player of gameplayPlayerStates) {
    player.cleared = 0;
    player.reachedAt = 0;
    player.targetCount = activeBoard.targetCount;
  }
  stageIndex = 0;
  showGameplayStage();
  renderGameplayScores();
  renderGameplayTime(0);
  gameplayStartedAt = performance.now();
  gameplayFrame = requestAnimationFrame(tickGameplayMatch);
}

function onlineGameplayClock(now) {
  return onlineGameplay.state.serverNow + now - onlineGameplay.receivedAt;
}

function sendOnlineGameplayInput(type, data = {}) {
  const { state, sentSeq } = onlineGameplay;
  if (!multiplayer.send(type, { ...data, matchId: state.matchId, stage: stageIndex, seq: sentSeq + 1 })) return false;
  onlineGameplay.sentSeq += 1;
  return true;
}

function updateOnlineGameplay(now) {
  const { state, connected, lockUntil } = onlineGameplay;
  const serverNow = onlineGameplayClock(now);
  renderGameplayTime(Math.max(0, Math.min(serverNow - state.startsAt, matchDurationMs)));
  const readyIn = Math.ceil((state.startsAt - serverNow) / 1000);
  let message = "";
  if (!connected) message = "Reconnecting to the match…";
  else if (readyIn > 0) message = `Get ready · ${readyIn}`;
  else if (serverNow >= state.endsAt) message = "Waiting for results…";

  const stages = activeBoard.stages;
  const locked = !message && serverNow < lockUntil;
  const cleared = stageCleared === stages[stageIndex].length;
  const showRush = !locked && !message && cleared && stageIndex < stages.length - 1;
  if (locked !== !gameplayPenalty.hidden) setWrongPopFeedback(locked);
  if (gameplayOnlineStatus.textContent !== message) gameplayOnlineStatus.textContent = message;
  gameplayOnlineStatus.hidden = !message;
  if (showRush && popRushButton.disabled) showReadyPopRush(false);
  if (!showRush) setPopRushReadyState(false, { label: "Pop Rush", showBanner: false });
  gameplayRule.hidden = Boolean(message || locked || cleared);
  const disabled = Boolean(message || locked || cleared);
  if (gameplayCells[0]?.bubble.disabled !== disabled) setGameplayBoardDisabled(disabled);
  return !disabled || showRush;
}

function startOnlineGameplay(state) {
  stopGameplayMatch();
  gameplayResultsOrder.replaceChildren();
  onlineGameplay = { state, receivedAt: performance.now(), sentSeq: state.self.ack, connected: true, lockUntil: 0 };
  activeBoard = popRules.getBoard(state.self.boardId);
  stageIndex = state.self.stage;
  showGameplayStage();
  gameplayStartedAt = performance.now();
  syncOnlineGameplay(state);
  if (gameplayStartedAt !== null) gameplayFrame = requestAnimationFrame(tickGameplayMatch);
}

function syncOnlineGameplay(state) {
  if (!onlineGameplay || onlineGameplay.state.matchId !== state.matchId || gameplayStartedAt === null) return;
  if (!onlineGameplay.connected) onlineGameplay.sentSeq = state.self.ack;
  onlineGameplay.state = state;
  onlineGameplay.receivedAt = performance.now();
  onlineGameplay.connected = true;

  if (state.self.boardId) {
    activeBoard = popRules.getBoard(state.self.boardId);
  }
  for (const player of state.scores) {
    Object.assign(gameplayPlayerStates[player.seat], {
      cleared: player.cleared,
      targetCount: player.targetCount ?? activeBoard.targetCount,
      reachedAt: player.reachedAt,
    });
  }
  renderGameplayScores();
  if (state.self.ack >= onlineGameplay.sentSeq || state.phase === "finished") {
    if (stageIndex !== state.self.stage || gameplayGrid.dataset.builtBoard !== activeBoard.id) {
      stageIndex = state.self.stage;
      showGameplayStage();
    }
    onlineGameplay.lockUntil = state.self.lockUntil;
    stageCleared = state.self.popped.length;
    for (const cell of gameplayCells) {
      const pressed = String(!state.self.popped.includes(cell.index));
      if (cell.bubble.getAttribute("aria-pressed") !== pressed) cell.bubble.setAttribute("aria-pressed", pressed);
    }
    renderPopPower();
  }

  if (state.phase === "finished") {
    renderGameplayTime(state.finishedAt - state.startsAt);
    finishGameplayMatch(state.winner === null ? null : gameplayPlayerStates[state.winner]);
  } else {
    updateOnlineGameplay(performance.now());
  }
}

function pauseOnlineGameplay() {
  if (!onlineGameplay || gameplayStartedAt === null) return;
  onlineGameplay.connected = false;
  updateOnlineGameplay(performance.now());
}

function stopGameplayMatch() {
  if (gameplayFrame !== null) cancelAnimationFrame(gameplayFrame);
  if (wrongPopTimer !== null) clearTimeout(wrongPopTimer);
  gameplayFrame = null;
  gameplayStartedAt = null;
  wrongPopTimer = null;
  gameplayOnlineStatus.hidden = true;
  setPopRushReadyState(false, { label: "Pop Rush", showBanner: false });
  setWrongPopFeedback(false);
  if (gameplayResults.open) gameplayResults.close();
}

function updateGameplayMatch(now) {
  if (gameplayStartedAt === null) return false;
  if (onlineGameplay) return updateOnlineGameplay(now);
  const elapsed = Math.max(0, now - gameplayStartedAt);
  const activeTime = Math.min(elapsed, matchDurationMs);
  renderGameplayTime(activeTime);

  let scoresChanged = false;
  for (const [index, bot] of gameplayOpponents.entries()) {
    const interval = gameplayPlayers[index + 1].botIntervalMs * (popRules.targetCount / activeBoard.targetCount);
    const cleared = Math.min(activeBoard.targetCount, Math.floor(activeTime / interval));
    if (bot.cleared === cleared) continue;
    bot.cleared = cleared;
    bot.reachedAt = cleared * interval;
    scoresChanged = true;
  }
  if (scoresChanged) {
    const [leader] = renderGameplayScores();
    if (leader.cleared === leader.targetCount) {
      finishGameplayMatch(leader);
      return false;
    }
  }

  if (elapsed >= matchDurationMs) {
    finishGameplayMatch();
    return false;
  }
  return true;
}

function tickGameplayMatch(now) {
  const playing = updateGameplayMatch(now);
  if (playing || (onlineGameplay && gameplayStartedAt !== null)) {
    gameplayFrame = requestAnimationFrame(tickGameplayMatch);
  }
}

function finishGameplayMatch(finisher) {
  stopGameplayMatch();
  const ranked = renderGameplayScores();
  const human = onlineGameplay ? gameplayPlayerStates[onlineGameplay.state.you] : gameplayHuman;
  const playerRank = rankLabels[ranked.indexOf(human)];
  const progress = progressPercent(human.cleared, human.targetCount);
  const reason = finisher ? `${finisher.name} cleared all ${activeBoard.stages.length} stages.` : "Time is up.";
  gameplayResultsSummary.textContent = `${reason} You placed ${playerRank} with ${progress}% progress.`;
  resultPops.textContent = `${human.cleared}/${human.targetCount}`;
  resultProgress.textContent = `${progress}%`;
  resultRank.textContent = playerRank;
  resultsPodium.replaceChildren(...ranked.slice(0, 3).map((player, index) => {
    const place = resultsPlaceTemplate.content.firstElementChild.cloneNode(true);
    place.dataset.rank = index + 1;
    place.querySelector("img").src = `pages/match_results/characters/${encodeURIComponent(player.character)}.png`;
    place.querySelector(".results-place-number").textContent = index + 1;
    return place;
  }));
  gameplayResultsOrder.replaceChildren(...ranked.map((player, index) => {
    const entry = resultsRowTemplate.content.firstElementChild.cloneNode(true);
    entry.dataset.rank = index + 1;
    entry.toggleAttribute("data-you", player === human);
    entry.querySelector(".results-row-rank").textContent = index + 1;
    entry.querySelector("img").src = player.card.querySelector("img").src;
    entry.querySelector(".results-player-name").textContent = player.name;
    entry.querySelector(".results-player-score strong").textContent = `${progressPercent(player.cleared, player.targetCount)}%`;
    return entry;
  }));
  setGameplayBoardDisabled(true);
  gameplayRule.hidden = true;
  shakeHint.hidden = true;
  enableShakeButton.hidden = true;
  setPopRushReadyState(true, { label: "Results", showBanner: false });
  gameplayResults.showModal();
}

document.querySelector("#gameplay-results-back").addEventListener("click", (event) => {
  event.preventDefault();
  navigate("#home");
});

function isPopRushReady() {
  return gameplayStartedAt !== null && stageIndex < activeBoard.stages.length - 1 &&
    stageCleared === activeBoard.stages[stageIndex].length;
}

function advanceGameplayStage(restoreFocus = false) {
  if (!isPopRushReady() || !updateGameplayMatch(performance.now())) return;
  if (onlineGameplay && !sendOnlineGameplayInput("rush")) return;
  playGameplaySound(reloadSound);
  stageIndex += 1;
  showGameplayStage(true);
  if (restoreFocus) focusNextGameplayBubble();
}

popRushButton.addEventListener("click", (event) => {
  if (gameplayStartedAt === null) {
    if (gameplayResultsOrder.childElementCount && !gameplayResults.open) gameplayResults.showModal();
    return;
  }
  advanceGameplayStage(event.detail === 0);
});

function motionVector(sample) {
  if (!sample) return null;
  const vector = [sample.x, sample.y, sample.z];
  return vector.every(Number.isFinite) ? vector : null;
}

function handleGameplayShake(event) {
  if (!shakeAllowed || !isPopRushReady()) return;
  let acceleration = motionVector(event.acceleration);
  if (!acceleration) {
    const withGravity = motionVector(event.accelerationIncludingGravity);
    if (!withGravity) return;
    // Smooth the gravity estimate when the browser only reports combined acceleration.
    gravityBaseline ??= withGravity;
    acceleration = withGravity.map((value, axis) => value - gravityBaseline[axis]);
    gravityBaseline = gravityBaseline.map((value, axis) => value + acceleration[axis] * 0.15);
  }
  shakeHint.hidden = false;

  const strength = Math.hypot(...acceleration);
  if (strength < shakeThreshold) return;
  const now = performance.now();
  if (!shakePulse || now - shakePulse.at > shakeMaxIntervalMs) {
    shakePulse = { acceleration, strength, at: now };
    return;
  }
  const direction = acceleration.reduce((dot, value, axis) => dot + value * shakePulse.acceleration[axis], 0);
  if (now - shakePulse.at >= shakeMinIntervalMs && direction < -0.5 * strength * shakePulse.strength) {
    advanceGameplayStage();
  }
}

if (motionEvent) window.addEventListener("devicemotion", handleGameplayShake);
enableShakeButton.addEventListener("click", async () => {
  enableShakeButton.disabled = true;
  try {
    shakeAllowed = await motionEvent.requestPermission() === "granted";
  } catch {
    shakeAllowed = false;
  }
  enableShakeButton.hidden = true;
  if (isPopRushReady()) {
    popRushButton.focus({ preventScroll: true });
    gameplayBoardStatus.textContent = shakeAllowed ? "Shake enabled." : "Tap Pop Rush to continue.";
  }
});

document.querySelector("#gameplay-play-again").addEventListener("click", () => {
  if (onlineGameplay) {
    navigate(document.querySelector("#gameplay-back").hash);
    return;
  }
  startGameplayMatch();
  gameplayTitle.focus({ preventScroll: true });
});
