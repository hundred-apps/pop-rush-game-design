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

const modeConfigKey = "pop-rush-mode-config";
const defaultModeConfig = {
  mode: "classic",
  rushSeconds: 45,
  levels: { memory: 1, sequence: 1, color_hunt: 1 },
};

function loadModeConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(modeConfigKey));
    if (!saved || typeof saved !== "object") return structuredClone(defaultModeConfig);
    return {
      mode: popRules.modeOrder.includes(saved.mode) ? saved.mode : "classic",
      rushSeconds: [30, 45, 60].includes(saved.rushSeconds) ? saved.rushSeconds : 45,
      levels: {
        memory: Math.max(1, Math.min(100, Number(saved.levels?.memory) || 1)),
        sequence: Math.max(1, Math.min(100, Number(saved.levels?.sequence) || 1)),
        color_hunt: Math.max(1, Math.min(100, Number(saved.levels?.color_hunt) || 1)),
      },
    };
  } catch {
    return structuredClone(defaultModeConfig);
  }
}

const modeConfig = loadModeConfig();
function saveModeConfig() {
  try { localStorage.setItem(modeConfigKey, JSON.stringify(modeConfig)); } catch {}
}

function getSelectedGameMode() { return modeConfig.mode; }
function setSelectedGameMode(modeId) {
  if (!popRules.modeOrder.includes(modeId)) return;
  modeConfig.mode = modeId;
  saveModeConfig();
}
function getSelectedRushSeconds() { return modeConfig.rushSeconds; }
function setSelectedRushSeconds(sec) {
  if (![30, 45, 60].includes(sec)) return;
  modeConfig.rushSeconds = sec;
  saveModeConfig();
}
function getModeLevel(modeId) {
  return modeConfig.levels[modeId] ?? 1;
}
function setModeLevel(modeId, lv) {
  if (!(modeId in modeConfig.levels)) return;
  modeConfig.levels[modeId] = Math.max(1, Math.min(100, Number(lv) || 1));
  saveModeConfig();
}

const { players: gameplayPlayers, matchDurationMs, wrongPopLockMs, frenzyMaxLives } = popRules;
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
const gameplayRuleBubble = gameplayRule.querySelector(".gameplay-rule-bubble");
const gameplayRuleText = document.querySelector("#gameplay-rule-text");
const gameplayLivesEl = document.querySelector("#gameplay-lives");
const gameplayCountdown = document.querySelector("#gameplay-countdown");
const gameplayCountdownMode = document.querySelector("#gameplay-countdown-mode");
const gameplayCountdownValue = document.querySelector("#gameplay-countdown-value");
const gameplayPenalty = document.querySelector("#gameplay-penalty");
const gameplayBoardStatus = document.querySelector("#gameplay-board-status");
const gameplayOnlineStatus = document.querySelector("#gameplay-online-status");
const gameplayGrid = document.querySelector("#gameplay-bubbles");
const popRushActions = document.querySelector("#gameplay-rush-actions");
const popRushStatusText = document.querySelector("#gameplay-rush-status span");
const powerValue = document.querySelector("#gameplay-power-value");
const powerTrack = document.querySelector("#gameplay-power-track");
const popRushButton = document.querySelector("#gameplay-pop-rush");
const popRushSlot = popRushButton.parentElement;
const popRushLabel = document.querySelector("#gameplay-rush-label");
const shakeHint = document.querySelector("#gameplay-shake-hint");
const enableShakeButton = document.querySelector("#gameplay-enable-shake");
const gameplayResults = document.querySelector("#gameplay-results");
const gameplayResultsSummary = document.querySelector("#gameplay-results-summary");
const gameplayResultsOrder = document.querySelector("#gameplay-results-order");
const resultsPodium = document.querySelector("#gameplay-results-podium");
const resultsPlaceTemplate = document.querySelector("#results-place-template");
const resultsRowTemplate = document.querySelector("#results-row-template");
const resultPops = document.querySelector("#results-pops");
const resultProgress = document.querySelector("#results-progress");
const resultRank = document.querySelector("#results-rank");
const nextModeButton = document.querySelector("#gameplay-next-mode");
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

// Extended multi-mode state
let activeMode = "classic";
let activeModeLevel = 1;
let activeSessionIndex = 0;
let activeStages = [];
let activeTargets = new Set();
let activeSpillOrder = [];
let spillActive = false;
let spillTimers = [];
let activeColorPair = null;
let frenzyLives = frenzyMaxLives;
let rushDurationMs = matchDurationMs;
let humanScore = 0;
let humanTotalCleared = 0;
let transitionToNextMode = null;
let nextModeHandler = null;
let countdownActive = false;
let countdownTimers = [];
let onlinePlayShown = false;
let onlinePlayBannerUntil = 0;
let onlineSpillKey = "";
let onlineTransitionBanner = "";

const motionEvent = window.isSecureContext ? window.DeviceMotionEvent : undefined;
let shakeAllowed = Boolean(motionEvent && typeof motionEvent.requestPermission !== "function");
let shakePulse = null;
let gravityBaseline = null;

const gameplayPlayerStates = gameplayPlayers.map((player) => {
  const card = scoreCardTemplate.content.firstElementChild.cloneNode(true);
  const portrait = card.querySelector(".gameplay-portrait");
  card.title = `${player.name} · Lv.${player.level}`;
  card.dataset.character = player.character;
  portrait.src = `pages/gameplay/player_card/${encodeURIComponent(player.character)}.png`;
  portrait.alt = `${player.character} portrait`;
  card.querySelector(".gameplay-leader-portrait").src = `pages/match_results/characters/${encodeURIComponent(player.character)}.png`;
  card.querySelector(".gameplay-name").textContent = player.name;
  card.querySelector(".gameplay-level").textContent = `Level ${player.level}`;
  return {
    ...player,
    card,
    rankLabel: card.querySelector(".gameplay-rank-label"),
    crown: card.querySelector(".gameplay-crown"),
    percent: card.querySelector(".gameplay-score-percent"),
    cleared: 0,
    totalCleared: 0,
    score: 0,
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
  if (!total) return 0;
  return Math.min(100, Math.floor(cleared * 100 / total));
}

function isScoreMode(mode) {
  return mode === "rush" || mode === "frenzy";
}

function renderGameplayScores() {
  const players = onlineGameplay
    ? onlineGameplay.state.scores.map(({ seat }) => gameplayPlayerStates[seat])
    : gameplayPlayerStates;
  for (const player of gameplayPlayerStates) {
    if (!players.includes(player)) player.card.remove();
  }
  const scoreMode = isScoreMode(activeMode);
  const ranked = [...players].sort((a, b) => {
    if (scoreMode) return b.score - a.score || b.cleared - a.cleared || a.reachedAt - b.reachedAt;
    return (b.cleared * a.targetCount) - (a.cleared * b.targetCount) || a.reachedAt - b.reachedAt;
  });
  ranked.forEach((player, index) => {
    const isLeader = index === 0;
    player.card.classList.toggle("gameplay-score--leader", isLeader);
    player.rankLabel.textContent = rankLabels[index];
    player.crown.hidden = !isLeader;
    player.percent.textContent = scoreMode
      ? player.score.toLocaleString("en-US")
      : `${progressPercent(player.cleared, player.targetCount)}%`;
    if (gameplayScores.children[index] !== player.card) {
      gameplayScores.insertBefore(player.card, gameplayScores.children[index] ?? null);
    }
  });
  return ranked;
}

function renderGameplayTime(elapsed) {
  let displayMs = elapsed;
  if (activeMode === "classic") {
    displayMs = Math.max(0, matchDurationMs - elapsed);
  } else if (activeMode === "rush") {
    displayMs = Math.max(0, rushDurationMs - elapsed);
  }
  const tenths = Math.max(0, Math.ceil(displayMs / 100));
  const minutes = String(Math.floor(tenths / 600)).padStart(2, "0");
  const seconds = String(Math.floor(tenths / 10) % 60).padStart(2, "0");
  const text = `${minutes}:${seconds}.${tenths % 10}`;
  if (gameplayTime.textContent !== text) gameplayTime.textContent = text;
}

function renderPopPower() {
  const targetCount = activeMode === "sequence" ? activeBoard.cellCount : stageCleared + activeTargets.size;
  const percent = activeMode === "frenzy"
    ? (stageCleared === 0 ? 0 : ((stageCleared - 1) % 10 + 1) * 10)
    : progressPercent(stageCleared, targetCount);
  powerValue.textContent = `${percent}%`;
  powerTrack.setAttribute("aria-valuenow", percent);
  powerTrack.style.setProperty("--power", `${percent}%`);
}

function renderFrenzyLives() {
  if (activeMode !== "frenzy") {
    gameplayLivesEl.hidden = true;
    gameplayLivesEl.replaceChildren();
    return;
  }
  gameplayLivesEl.hidden = false;
  gameplayLivesEl.setAttribute("aria-label", `${frenzyLives} of ${frenzyMaxLives} lives left`);
  gameplayLivesEl.replaceChildren(
    ...Array.from({ length: frenzyMaxLives }, (_, i) => {
      const heart = document.createElement("span");
      heart.className = i < frenzyLives ? "gameplay-heart" : "gameplay-heart gameplay-heart--lost";
      heart.textContent = "♥";
      heart.setAttribute("aria-hidden", "true");
      return heart;
    }),
  );
}

function setRulePrompt(htmlText, colorId = "green") {
  gameplayRuleText.innerHTML = htmlText;
  gameplayRuleText.classList.toggle("sr-only", activeMode !== "memory");
  gameplayRule.dataset.targetColor = colorId;
  gameplayRuleBubble.dataset.bubbleColor = colorId;
}

function setClassicTargetPrompt() {
  const target = activeColorPair?.targetColor;
  setRulePrompt(`Pop only <strong>${target?.label ?? "GREEN"}!</strong>`, target?.id ?? "green");
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

function setWrongPopFeedback(locked, customMessage = "Wrong pop · Board locked") {
  gameplayPenalty.textContent = customMessage;
  gameplayPenalty.hidden = !locked;
  gameplayRule.hidden = locked;
  gameplayScreen.classList.toggle("gameplay--wrong-pop", locked);
  gameplayBoardStatus.textContent = locked ? customMessage : "";
}

function lockGameplayBoard(restoreFocus, customMs = wrongPopLockMs, msg = "Wrong pop · Board locked") {
  if (wrongPopTimer !== null) clearTimeout(wrongPopTimer);
  setGameplayBoardDisabled(true);
  setWrongPopFeedback(true, msg);
  wrongPopTimer = setTimeout(() => {
    wrongPopTimer = null;
    if (gameplayStartedAt === null || spillActive) return;
    setWrongPopFeedback(false);
    setGameplayBoardDisabled(false);
    if (restoreFocus && document.activeElement === document.body) focusNextGameplayBubble();
  }, customMs);
}

function setPopRushReadyState(ready, { label = "Pop Rush", statusHtml = "Tap <strong>Pop Rush!</strong>", showBanner = false, moveFocus = false, enabled = ready || gameplayStartedAt !== null } = {}) {
  const wasReady = popRushSlot.dataset.ready === "true";
  popRushButton.disabled = !enabled;
  popRushButton.dataset.mode = label === "Results" ? "results" : "rush";
  popRushSlot.dataset.ready = String(ready);
  if (popRushLabel.textContent !== label) popRushLabel.textContent = label;
  if (popRushStatusText) popRushStatusText.innerHTML = statusHtml;
  popRushActions.hidden = !showBanner;
  if (moveFocus && ready && !wasReady) popRushButton.focus({ preventScroll: true });
}

function showReadyPopRush(moveFocus = true, options = {}) {
  setGameplayBoardDisabled(true);
  gameplayRule.hidden = true;
  enableShakeButton.hidden = typeof motionEvent?.requestPermission !== "function" || enableShakeButton.disabled;
  setPopRushReadyState(true, { label: "Pop Rush", showBanner: true, moveFocus, ...options });
}

function formatModeBanner(modeId, isNext = false) {
  const meta = popRules.getMode(modeId);
  let label = meta.name;
  if (modeId === "rush") {
    const sec = onlineGameplay ? (onlineGameplay.state.rushSeconds ?? 45) : modeConfig.rushSeconds;
    label = `Rush (${sec}s)`;
  } else if (meta.maxLevel > 1) {
    const lv = onlineGameplay ? (onlineGameplay.state.modeLevel ?? 1) : getModeLevel(modeId);
    label = `${meta.name} Lv.${lv}`;
  }
  return isNext ? `NEXT: ${label}` : label;
}

function clearGameplayCountdown() {
  for (const id of countdownTimers) clearTimeout(id);
  countdownTimers = [];
  countdownActive = false;
  if (gameplayCountdown) gameplayCountdown.hidden = true;
  if (gameplayCountdownMode) {
    gameplayCountdownMode.hidden = true;
    gameplayCountdownMode.textContent = "";
  }
  if (gameplayCountdownValue) {
    gameplayCountdownValue.classList.remove("is-popping");
    delete gameplayCountdownValue.dataset.step;
  }
}

function showCountdownStep(text, stepKey, bannerText = "") {
  if (!gameplayCountdown || !gameplayCountdownValue) return;
  gameplayCountdown.hidden = false;
  if (gameplayCountdownMode) {
    const label = bannerText || formatModeBanner(activeMode, false);
    gameplayCountdownMode.textContent = label;
    gameplayCountdownMode.hidden = !label;
  }
  gameplayCountdownValue.textContent = text;
  gameplayCountdownValue.dataset.step = stepKey;
  if (!reduceBubbleMotion.matches) {
    gameplayCountdownValue.classList.remove("is-popping");
    void gameplayCountdownValue.offsetWidth;
    gameplayCountdownValue.classList.add("is-popping");
  }
}

function runGameplayCountdown(onComplete, bannerText = "") {
  clearGameplayCountdown();
  countdownActive = true;
  setGameplayBoardDisabled(true);
  const steps = [
    { at: 0, text: "3", key: "3" },
    { at: 750, text: "2", key: "2" },
    { at: 1500, text: "1", key: "1" },
    { at: 2250, text: "PLAY!", key: "play" },
  ];
  for (const step of steps) {
    countdownTimers.push(
      setTimeout(() => {
        showCountdownStep(step.text, step.key, bannerText);
      }, step.at),
    );
  }
  countdownTimers.push(
    setTimeout(() => {
      clearGameplayCountdown();
      onComplete();
    }, 2850),
  );
}

function clearSpillTimers() {
  for (const id of spillTimers) clearTimeout(id);
  spillTimers = [];
  spillActive = false;
  for (const cell of gameplayCells) cell.bubble.classList.remove("gameplay-bubble--spill-on");
}

function applyCellVisual(cell, { raise = false } = {}) {
  const isPushed = cell.state === "pushed";
  const isTarget = cell.state === "on";
  const marked = activeMode === "memory" ? isPushed : (isTarget || isPushed);
  const color = marked ? activeColorPair?.targetColor : activeColorPair?.offColor;
  const tone = color?.label ?? (marked ? "Green" : "White");
  cell.bubble.classList.toggle("gameplay-bubble--white", !marked && !color);
  if (color) cell.bubble.dataset.bubbleColor = color.id;
  else delete cell.bubble.dataset.bubbleColor;
  cell.bubble.setAttribute(
    "aria-label",
    cell.shape === "paw-pad"
      ? `${tone} center paw bubble`
      : `${tone} bubble, row ${cell.row}, column ${cell.column}`,
  );
  const pressed = isPushed ? "false" : "true";
  const wasDown = cell.bubble.getAttribute("aria-pressed") === "false";
  cell.bubble.setAttribute("aria-pressed", pressed);
  if (raise && wasDown && pressed === "true" && !reduceBubbleMotion.matches) {
    cell.riseAnimation?.cancel();
    cell.riseAnimation = cell.face.animate?.(bubbleRiseFrames, { duration: 230, easing: "ease-out" });
  }
}

function startMemorySpill() {
  clearSpillTimers();
  spillActive = true;
  setPopRushReadyState(false, { enabled: false });
  setGameplayBoardDisabled(true);
  setRulePrompt(`Watch! <strong>Memorize (${activeSpillOrder.length})</strong>`, "green");
  const { onMs, offMs } = popRules.getMemorySpillTiming(activeModeLevel);
  let cursor = 260;

  for (const idx of activeSpillOrder) {
    const cell = gameplayCells[idx];
    if (!cell) continue;
    spillTimers.push(
      setTimeout(() => {
        if (gameplayStartedAt === null) return;
        cell.bubble.classList.add("gameplay-bubble--spill-on");
      }, cursor),
    );
    cursor += onMs;
    spillTimers.push(
      setTimeout(() => {
        if (gameplayStartedAt === null) return;
        cell.bubble.classList.remove("gameplay-bubble--spill-on");
      }, cursor),
    );
    cursor += offMs;
  }

  spillTimers.push(
    setTimeout(() => {
      if (gameplayStartedAt === null) return;
      spillActive = false;
      setPopRushReadyState(false);
      setGameplayBoardDisabled(false);
      setRulePrompt(`Pop <strong>${activeTargets.size}</strong> remembered!`, "green");
      gameplayBoardStatus.textContent = "Spill finished. Pop the remembered bubbles.";
    }, cursor + 80),
  );
}

function handleClassicOrRushClear(now) {
  if (activeMode === "classic") {
    if (stageIndex < activeStages.length - 1) {
      showReadyPopRush();
    } else {
      transitionToNextMode = "memory";
      showReadyPopRush(true, {
        label: "Next Mode",
        statusHtml: "Classic Clear! Tap <strong>Pop Rush</strong> &rarr; Memory",
      });
    }
    return;
  }
  if (activeMode === "rush") {
    humanScore += 50;
    gameplayHuman.score = humanScore;
    renderGameplayScores();
    showReadyPopRush(true, {
      label: "Pop Rush",
      statusHtml: `Wave ${stageIndex + 1} Clear! Tap <strong>Pop Rush!</strong>`,
    });
  }
}

function advanceMultiSessionMode(modeId, labelPrefix) {
  const modeMeta = popRules.getMode(modeId);
  if (activeSessionIndex < modeMeta.sessionsPerLevel - 1) {
    showReadyPopRush(true, {
      label: "Next",
      statusHtml: `Session ${activeSessionIndex + 1}/10 Clear! Tap <strong>Pop Rush</strong>`,
    });
    return;
  }
  // Level completed (10/10 sessions) -> unlock next level and chain to next mode
  const prevLevel = activeModeLevel;
  if (prevLevel < modeMeta.maxLevel) setModeLevel(modeId, prevLevel + 1);
  const nextMode = popRules.getNextMode(modeId);
  if (nextMode) {
    transitionToNextMode = nextMode;
    humanScore += 100;
    gameplayHuman.score = humanScore;
    renderGameplayScores();
    showReadyPopRush(true, {
      label: "Next Mode",
      statusHtml: `${modeMeta.shortName} Clear! Tap <strong>Pop Rush</strong> &rarr; ${popRules.getMode(nextMode).shortName}`,
    });
    return;
  }
  finishGameplayMatch(gameplayHuman, `${modeMeta.name} Level ${prevLevel} Complete!`);
}

function applyWrongPopPenalty(now, event) {
  playGameplayInputSound(incorrectSound, event);
  const frenzy = activeMode === "frenzy";
  const lockMs = frenzy ? 380 : wrongPopLockMs;
  if (onlineGameplay) {
    onlineGameplay.lockUntil = onlineGameplayClock(now) + lockMs;
    updateOnlineGameplay(now);
    return;
  }

  if (frenzy) {
    frenzyLives = Math.max(0, frenzyLives - 1);
    renderFrenzyLives();
    if (frenzyLives <= 0) {
      finishGameplayMatch(null, "Out of lives in Frenzy!");
      return;
    }
  }
  const message = frenzy ? `Wrong pop · ${frenzyLives} lives left` : undefined;
  lockGameplayBoard(event.type === "click" && event.detail === 0, lockMs, message);
}

function popGameplayBubble(cell, event) {
  const now = performance.now();
  if (cell.bubble.disabled || spillActive || countdownActive || !updateGameplayMatch(now)) return;
  if (onlineGameplay && !sendOnlineGameplayInput("pop", { cell: cell.index })) return;

  if (onlineGameplay) {
    const isValidOnline =
      activeMode === "memory"
        ? activeTargets.has(cell.index) && cell.state !== "pushed"
        : cell.state === "on" && activeTargets.has(cell.index);
    if (!isValidOnline) {
      applyWrongPopPenalty(now, event);
      return;
    }
    cell.riseAnimation?.cancel();
    cell.state = "pushed";
    activeTargets.delete(cell.index);
    applyCellVisual(cell);
    playPopFeedback(event);
    stageCleared += 1;
    renderPopPower();
    if (activeTargets.size === 0 && activeMode !== "sequence" && activeMode !== "frenzy") {
      setGameplayBoardDisabled(true);
      const stageCount = onlineGameplay.state.self?.stageCount ?? 1;
      if (activeMode === "rush" || stageIndex < stageCount - 1) showReadyPopRush();
    } else if (event.type === "click" && event.detail === 0 && activeMode !== "memory") {
      focusNextGameplayBubble();
    }
    return;
  }

  // Evaluate local target hit based on activeMode
  const isValidTarget =
    activeMode === "memory"
      ? activeTargets.has(cell.index) && cell.state !== "pushed"
      : cell.state === "on" && activeTargets.has(cell.index);

  if (!isValidTarget) {
    applyWrongPopPenalty(now, event);
    return;
  }

  // Correct pop!
  playPopFeedback(event);
  cell.riseAnimation?.cancel();
  cell.state = "pushed";
  activeTargets.delete(cell.index);
  applyCellVisual(cell);
  stageCleared += 1;
  renderPopPower();
  humanScore += 10;
  humanTotalCleared += 1;
  gameplayHuman.cleared += 1;
  gameplayHuman.totalCleared = humanTotalCleared;
  gameplayHuman.score = humanScore;
  gameplayHuman.reachedAt = now - gameplayStartedAt;

  if (activeMode === "sequence") {
    const offCells = gameplayCells.filter((c) => c.state === "off");
    if (offCells.length > 0) {
      const picked = offCells[Math.floor(Math.random() * offCells.length)];
      picked.state = "on";
      activeTargets.add(picked.index);
      applyCellVisual(picked, { raise: true });
    }
    renderGameplayScores();
    if (activeTargets.size === 0) {
      setGameplayBoardDisabled(true);
      advanceMultiSessionMode("sequence", "Sequence");
    }
    return;
  }

  if (activeMode === "frenzy") {
    // Revert all OTHER PUSHED bubbles back to OFF, then promote 1 random OFF bubble to ON
    for (const c of gameplayCells) {
      if (c.index !== cell.index && c.state === "pushed") {
        c.state = "off";
        applyCellVisual(c, { raise: true });
      }
    }
    const offCells = gameplayCells.filter((c) => c.state === "off");
    if (offCells.length > 0) {
      const picked = offCells[Math.floor(Math.random() * offCells.length)];
      picked.state = "on";
      activeTargets.add(picked.index);
      applyCellVisual(picked, { raise: true });
    }
    renderGameplayScores();
    return;
  }

  renderGameplayScores();

  if (activeTargets.size === 0) {
    setGameplayBoardDisabled(true);
    if (activeMode === "classic" || activeMode === "rush") {
      handleClassicOrRushClear(now);
    } else if (activeMode === "memory") {
      advanceMultiSessionMode("memory", "Memory");
    } else if (activeMode === "color_hunt") {
      advanceMultiSessionMode("color_hunt", "Color Hunt");
    }
  } else if (event.type === "click" && event.detail === 0 && activeMode !== "memory") {
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
      state: "off",
      row: spec?.row ?? Math.floor(index / 4) + 1,
      column: spec?.column ?? index % 4 + 1,
      shape: spec?.shape ?? "circle",
    };
    bubble.addEventListener("touchstart", (event) => {
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

function setupSessionState(raiseBubbles = false, { deferStart = false } = {}) {
  clearSpillTimers();
  transitionToNextMode = null;
  buildGameplayCells(activeBoard);
  applyBoardTheme(gameplayGrid.parentElement, activeBoard);
  gameplayScreen.querySelector("#gameplay-board-name").textContent = activeBoard.name;
  stageCleared = 0;
  renderPopPower();
  shakePulse = null;
  gravityBaseline = null;
  setPopRushReadyState(false, { label: "Pop Rush", showBanner: false });
  setWrongPopFeedback(false);
  renderFrenzyLives();

  if (onlineGameplay) {
    const targets = activeStages[stageIndex] ?? activeBoard.stages[stageIndex];
    activeTargets = new Set(targets);
    gameplayTitle.textContent = `Stage ${stageIndex + 1}/${activeStages.length}`;
    setClassicTargetPrompt();
    setGameplayBoardDisabled(deferStart);
    for (const cell of gameplayCells) {
      cell.state = targets.includes(cell.index) ? "on" : "off";
      applyCellVisual(cell, { raise: raiseBubbles });
    }
    return;
  }

  if (activeMode === "classic") {
    const targets = activeStages[stageIndex];
    activeTargets = new Set(targets);
    gameplayTitle.textContent = `Stage ${stageIndex + 1}/${activeStages.length}`;
    setClassicTargetPrompt();
    setGameplayBoardDisabled(deferStart);
    for (const cell of gameplayCells) {
      cell.state = activeTargets.has(cell.index) ? "on" : "off";
      applyCellVisual(cell, { raise: raiseBubbles });
    }
  } else if (activeMode === "rush") {
    const targets = activeStages[stageIndex] ?? popRules.createClassicStages(activeBoard)[0];
    activeStages[stageIndex] = targets;
    activeTargets = new Set(targets);
    gameplayTitle.textContent = `Rush · Wave ${stageIndex + 1}`;
    setRulePrompt("Pop only <strong>GREEN!</strong>", "green");
    setGameplayBoardDisabled(deferStart);
    for (const cell of gameplayCells) {
      cell.state = activeTargets.has(cell.index) ? "on" : "off";
      applyCellVisual(cell, { raise: raiseBubbles });
    }
  } else if (activeMode === "memory") {
    activeSpillOrder = popRules.createSessionTargets(activeBoard.cellCount, 0.30);
    activeTargets = new Set(activeSpillOrder);
    gameplayTitle.textContent = `Memory Lv.${activeModeLevel} · ${activeSessionIndex + 1}/10`;
    for (const cell of gameplayCells) {
      cell.state = "off";
      applyCellVisual(cell, { raise: raiseBubbles });
    }
    if (deferStart) {
      setGameplayBoardDisabled(true);
      setRulePrompt("Get ready to <strong>memorize!</strong>", "green");
    } else {
      startMemorySpill();
    }
    return;
  } else if (activeMode === "sequence") {
    const targets = popRules.createSessionTargets(activeBoard.cellCount, 0.50);
    activeTargets = new Set(targets);
    gameplayTitle.textContent = `Sequence Lv.${activeModeLevel} · ${activeSessionIndex + 1}/10`;
    setRulePrompt("Pop <strong>GREEN!</strong> Watch refill", "green");
    setGameplayBoardDisabled(deferStart);
    for (const cell of gameplayCells) {
      cell.state = activeTargets.has(cell.index) ? "on" : "off";
      applyCellVisual(cell, { raise: raiseBubbles });
    }
  } else if (activeMode === "color_hunt") {
    const targets = popRules.createSessionTargets(activeBoard.cellCount, 0.50);
    activeColorPair = popRules.pickColorHuntPair();
    activeTargets = new Set(targets);
    gameplayTitle.textContent = `Color Lv.${activeModeLevel} · ${activeSessionIndex + 1}/10`;
    setRulePrompt(`Pop only <strong>${activeColorPair.targetColor.label}!</strong>`, activeColorPair.targetColor.id);
    setGameplayBoardDisabled(deferStart);
    for (const cell of gameplayCells) {
      cell.state = activeTargets.has(cell.index) ? "on" : "off";
      applyCellVisual(cell, { raise: raiseBubbles });
    }
  } else if (activeMode === "frenzy") {
    const targets = popRules.createSessionTargets(activeBoard.cellCount, 0.50);
    activeTargets = new Set(targets);
    gameplayTitle.textContent = "Frenzy Mode";
    setRulePrompt("Pop <strong>GREEN!</strong>", "green");
    setGameplayBoardDisabled(deferStart);
    for (const cell of gameplayCells) {
      cell.state = activeTargets.has(cell.index) ? "on" : "off";
      applyCellVisual(cell, { raise: raiseBubbles });
    }
  }

}

function getExpectedTargetCountForMode(modeId) {
  if (modeId === "classic") return activeBoard.targetCount;
  if (modeId === "memory") return Math.max(1, Math.round(activeBoard.cellCount * 0.30)) * 10;
  if (modeId === "sequence") return activeBoard.cellCount * 10;
  if (modeId === "color_hunt") return Math.max(1, Math.round(activeBoard.cellCount * 0.50)) * 10;
  return activeBoard.targetCount;
}

function switchGameplayMode(modeId, resetClock = true, { preserveTotals = false, isTransition = false } = {}) {
  if (gameplayFrame !== null) {
    cancelAnimationFrame(gameplayFrame);
    gameplayFrame = null;
  }
  gameplayStartedAt = null;
  activeMode = popRules.modeOrder.includes(modeId) ? modeId : "classic";
  activeColorPair = activeMode === "classic" ? popRules.pickClassicColorPair() : null;
  activeModeLevel = getModeLevel(activeMode);
  activeSessionIndex = 0;
  stageIndex = 0;
  transitionToNextMode = null;
  frenzyLives = frenzyMaxLives;
  rushDurationMs = modeConfig.rushSeconds * 1000;
  activeStages = activeMode === "classic" || activeMode === "rush" ? popRules.createClassicStages(activeBoard) : [];

  const modeTargetTotal = getExpectedTargetCountForMode(activeMode);
  for (const player of gameplayPlayerStates) {
    player.cleared = 0;
    if (!preserveTotals) {
      player.score = 0;
      player.totalCleared = 0;
    }
    player.reachedAt = 0;
    player.targetCount = modeTargetTotal;
  }
  if (!preserveTotals) {
    humanScore = 0;
    humanTotalCleared = 0;
  } else {
    humanScore += 100;
    gameplayHuman.score = humanScore;
  }
  setupSessionState(true, { deferStart: true });
  renderGameplayScores();
  renderGameplayTime(0);

  runGameplayCountdown(() => {
    gameplayStartedAt = resetClock ? performance.now() : (gameplayStartedAt ?? performance.now());
    if (activeMode === "memory") startMemorySpill();
    else {
      setPopRushReadyState(false);
      setGameplayBoardDisabled(false);
    }
    gameplayFrame = requestAnimationFrame(tickGameplayMatch);
  }, formatModeBanner(activeMode, isTransition));
}

function startGameplayMatch(overrideMode = null) {
  stopGameplayMatch();
  onlineGameplay = null;
  activeBoard = equippedBoard;
  gameplayHuman = gameplayPlayerStates[selectedCharacterSeat()];
  gameplayOpponents = gameplayPlayerStates.filter((player) => player !== gameplayHuman);
  gameplayResultsOrder.replaceChildren();
  switchGameplayMode(overrideMode ?? modeConfig.mode, true, { preserveTotals: false, isTransition: false });
}

function onlineGameplayClock(now) {
  return onlineGameplay.state.serverNow + now - onlineGameplay.receivedAt;
}

function sendOnlineGameplayInput(type, data = {}) {
  const { state, sentSeq } = onlineGameplay;
  if (!multiplayer.send(type, { ...data, matchId: state.matchId, round: state.round ?? 0, stage: stageIndex, seq: sentSeq + 1 })) return false;
  onlineGameplay.sentSeq += 1;
  return true;
}

function applyOnlineSessionHeader() {
  buildGameplayCells(activeBoard);
  applyBoardTheme(gameplayGrid.parentElement, activeBoard);
  gameplayScreen.querySelector("#gameplay-board-name").textContent = activeBoard.name;
  renderFrenzyLives();
  if (activeMode === "classic") {
    gameplayTitle.textContent = `Stage ${stageIndex + 1}/4`;
    setClassicTargetPrompt();
  } else if (activeMode === "rush") {
    gameplayTitle.textContent = `Rush · Wave ${stageIndex + 1}`;
    setRulePrompt("Pop only <strong>GREEN!</strong>", "green");
  } else if (activeMode === "memory") {
    gameplayTitle.textContent = `Memory Lv.${activeModeLevel} · ${stageIndex + 1}/10`;
    if (spillActive) setRulePrompt(`Watch! <strong>Memorize (${activeSpillOrder.length})</strong>`, "green");
    else if (onlinePlayShown && performance.now() >= onlinePlayBannerUntil) {
      setRulePrompt(`Pop <strong>${activeTargets.size}</strong> remembered!`, "green");
    } else {
      setRulePrompt("Get ready to <strong>memorize!</strong>", "green");
    }
  } else if (activeMode === "sequence") {
    gameplayTitle.textContent = `Sequence Lv.${activeModeLevel} · ${stageIndex + 1}/10`;
    setRulePrompt("Pop <strong>GREEN!</strong> Watch refill", "green");
  } else if (activeMode === "color_hunt") {
    const label = activeColorPair?.targetColor.label ?? "GREEN";
    const id = activeColorPair?.targetColor.id ?? "green";
    gameplayTitle.textContent = `Color Lv.${activeModeLevel} · ${stageIndex + 1}/10`;
    setRulePrompt(`Pop only <strong>${label}!</strong>`, id);
  } else if (activeMode === "frenzy") {
    gameplayTitle.textContent = "Frenzy Mode";
    setRulePrompt("Pop <strong>GREEN!</strong>", "green");
  }
}

function updateOnlineGameplay(now) {
  const { state, connected, lockUntil } = onlineGameplay;
  const serverNow = onlineGameplayClock(now);
  const elapsed = Math.max(0, serverNow - state.startsAt);
  renderGameplayTime(elapsed);
  const readyIn = Math.ceil((state.startsAt - serverNow) / 1000);
  const selfPlay = state.self;
  let message = "";
  if (!connected) {
    message = "Reconnecting to the match…";
    clearGameplayCountdown();
  } else if (readyIn > 0) {
    const step = String(Math.min(3, readyIn));
    if (gameplayCountdownValue.dataset.step !== step) showCountdownStep(step, step, onlineTransitionBanner);
    onlinePlayShown = false;
  } else {
    if (!onlinePlayShown && serverNow < state.startsAt + 550) {
      onlinePlayShown = true;
      onlinePlayBannerUntil = now + 550;
      showCountdownStep("PLAY!", "play", onlineTransitionBanner);
    } else if (onlinePlayShown && now >= onlinePlayBannerUntil && !gameplayCountdown.hidden) {
      clearGameplayCountdown();
    }
    if (serverNow >= state.endsAt) message = "Waiting for results…";
    else if (selfPlay && !selfPlay.alive) message = "Out of lives · Watching others…";
  }

  const preStart = connected && (readyIn > 0 || (onlinePlayShown && now < onlinePlayBannerUntil));
  if (!preStart && connected && activeMode === "memory" && !message) {
    const key = `${state.matchId}:${stageIndex}`;
    if (onlineSpillKey !== key && activeSpillOrder.length > 0) {
      onlineSpillKey = key;
      startMemorySpill();
    }
  }

  const locked = !message && !preStart && !spillActive && serverNow < lockUntil;
  const stageCount = selfPlay?.stageCount ?? 1;
  const cleared = (selfPlay?.targets?.length ?? 1) === 0;
  const canRush = activeMode === "rush" || (stageCount > 1 && stageIndex < stageCount - 1);
  const rushAvailable = !message && !preStart && !spillActive && selfPlay?.stage === stageIndex;
  const showRush = rushAvailable && !locked && cleared && canRush;
  if (locked !== !gameplayPenalty.hidden) {
    setWrongPopFeedback(locked, activeMode === "frenzy" ? `Wrong pop · ${frenzyLives} lives left` : "Wrong pop · Board locked");
  }
  if (gameplayOnlineStatus.textContent !== message) gameplayOnlineStatus.textContent = message;
  gameplayOnlineStatus.hidden = !message;
  if (showRush && popRushSlot.dataset.ready !== "true") {
    showReadyPopRush(false, activeMode === "rush"
      ? { statusHtml: `Wave ${stageIndex + 1} Clear! Tap <strong>Pop Rush!</strong>` }
      : activeMode === "memory" || activeMode === "sequence" || activeMode === "color_hunt"
        ? { label: "Next", statusHtml: `Session ${stageIndex + 1}/10 Clear! Tap <strong>Pop Rush</strong>` }
        : {});
  }
  if (!showRush) setPopRushReadyState(false, { enabled: rushAvailable });
  gameplayRule.hidden = Boolean(message || (preStart && activeMode !== "memory") || locked || cleared);
  const disabled = !rushAvailable || locked || cleared;
  if (gameplayCells[0]?.bubble.disabled !== disabled) setGameplayBoardDisabled(disabled);
  return !disabled || showRush;
}

function startOnlineGameplay(state) {
  stopGameplayMatch();
  gameplayResultsOrder.replaceChildren();
  onlinePlayShown = false;
  onlinePlayBannerUntil = 0;
  onlineSpillKey = "";
  onlineGameplay = { state, round: state.round ?? 0, receivedAt: performance.now(), sentSeq: state.self.ack, connected: true, lockUntil: 0 };
  activeMode = state.gameMode ?? "classic";
  activeModeLevel = state.modeLevel ?? 1;
  rushDurationMs = (state.rushSeconds ?? 45) * 1000;
  onlineTransitionBanner = formatModeBanner(activeMode, (state.round ?? 0) > 0);
  activeBoard = popRules.getBoard(state.self.boardId);
  stageIndex = state.self.stage;
  activeSessionIndex = stageIndex;
  activeTargets = new Set(state.self.targets ?? []);
  activeColorPair = state.self.colorPair ?? null;
  activeSpillOrder = state.self.spillOrder ?? [];
  frenzyLives = state.self.lives ?? frenzyMaxLives;
  applyOnlineSessionHeader();
  gameplayStartedAt = performance.now();
  syncOnlineGameplay(state);
  if (gameplayStartedAt !== null) gameplayFrame = requestAnimationFrame(tickGameplayMatch);
}

function syncOnlineGameplay(state) {
  if (!onlineGameplay || onlineGameplay.state.matchId !== state.matchId || gameplayStartedAt === null) return;
  if (!onlineGameplay.connected) onlineGameplay.sentSeq = state.self.ack;
  const roundChanged = (state.round ?? 0) !== onlineGameplay.round;
  onlineGameplay.round = state.round ?? 0;
  onlineGameplay.state = state;
  onlineGameplay.receivedAt = performance.now();
  onlineGameplay.connected = true;

  activeMode = state.gameMode ?? activeMode;
  activeModeLevel = state.modeLevel ?? activeModeLevel;
  rushDurationMs = (state.rushSeconds ?? 45) * 1000;
  if (roundChanged) {
    onlinePlayShown = false;
    onlinePlayBannerUntil = 0;
    onlineSpillKey = "";
    clearSpillTimers();
    clearGameplayCountdown();
    setPopRushReadyState(false, { label: "Pop Rush", showBanner: false });
    onlineTransitionBanner = formatModeBanner(activeMode, true);
  }
  if (state.self.boardId) activeBoard = popRules.getBoard(state.self.boardId);
  for (const player of state.scores) {
    Object.assign(gameplayPlayerStates[player.seat], {
      cleared: player.cleared,
      totalCleared: player.totalCleared ?? player.cleared,
      score: player.score ?? 0,
      targetCount: player.targetCount ?? activeBoard.targetCount,
      reachedAt: player.reachedAt,
    });
  }
  renderGameplayScores();
  if (roundChanged || state.self.ack >= onlineGameplay.sentSeq || state.phase === "finished") {
    const stageChanged = roundChanged || stageIndex !== state.self.stage || gameplayGrid.dataset.builtBoard !== activeBoard.id;
    stageIndex = state.self.stage;
    activeSessionIndex = stageIndex;
    activeTargets = new Set(state.self.targets ?? []);
    activeColorPair = state.self.colorPair ?? null;
    activeSpillOrder = state.self.spillOrder ?? [];
    frenzyLives = state.self.lives ?? frenzyMaxLives;
    onlineGameplay.lockUntil = state.self.lockUntil;

    if (stageChanged) {
      clearSpillTimers();
      setPopRushReadyState(false, { label: "Pop Rush", showBanner: false });
    }
    applyOnlineSessionHeader();

    const pushedSet = new Set(state.self.pushed ?? []);
    for (const cell of gameplayCells) {
      const prevState = cell.state;
      const nextState = pushedSet.has(cell.index) ? "pushed" : activeTargets.has(cell.index) ? "on" : "off";
      cell.state = nextState;
      const shouldRaise = !stageChanged && (
        (prevState === "pushed" && nextState !== "pushed") ||
        ((activeMode === "sequence" || activeMode === "frenzy") && prevState === "off" && nextState === "on")
      );
      applyCellVisual(cell, { raise: shouldRaise });
    }

    stageCleared = activeMode === "frenzy" ? state.self.cleared : pushedSet.size;
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
  clearSpillTimers();
  clearGameplayCountdown();
  gameplayFrame = null;
  gameplayStartedAt = null;
  wrongPopTimer = null;
  gameplayOnlineStatus.hidden = true;
  gameplayLivesEl.hidden = true;
  setPopRushReadyState(false, { label: "Pop Rush", showBanner: false });
  setWrongPopFeedback(false);
  if (gameplayResults.open) gameplayResults.close();
}

function updateGameplayMatch(now) {
  if (gameplayStartedAt === null) return false;
  if (onlineGameplay) return updateOnlineGameplay(now);
  const elapsed = Math.max(0, now - gameplayStartedAt);

  if (activeMode === "classic" || activeMode === "rush") {
    const limitMs = activeMode === "rush" ? rushDurationMs : matchDurationMs;
    const activeTime = Math.min(elapsed, limitMs);
    renderGameplayTime(activeTime);

    let scoresChanged = false;
    for (const [index, bot] of gameplayOpponents.entries()) {
      const baseInterval = gameplayPlayers[index + 1].botIntervalMs * (popRules.targetCount / activeBoard.targetCount);
      if (activeMode === "rush") {
        const cleared = Math.floor(activeTime / baseInterval);
        const botScore = cleared * 10 + Math.floor(cleared / 7) * 50;
        if (bot.cleared === cleared) continue;
        bot.cleared = cleared;
        bot.score = botScore;
        bot.reachedAt = cleared * baseInterval;
        scoresChanged = true;
      } else {
        const cleared = Math.min(activeBoard.targetCount, Math.floor(activeTime / baseInterval));
        if (bot.cleared === cleared) continue;
        bot.cleared = cleared;
        bot.reachedAt = cleared * baseInterval;
        scoresChanged = true;
      }
    }
    if (scoresChanged) {
      const [leader] = renderGameplayScores();
      if (activeMode === "classic" && leader.cleared === leader.targetCount && leader !== gameplayHuman) {
        switchGameplayMode("memory", true, { preserveTotals: true, isTransition: true });
        return false;
      }
    }

    if (elapsed >= limitMs) {
      const nextId = popRules.getNextMode(activeMode);
      if (nextId) {
        switchGameplayMode(nextId, true, { preserveTotals: true, isTransition: true });
        return false;
      }
      finishGameplayMatch(null, activeMode === "rush" ? `${modeConfig.rushSeconds}s Rush complete!` : "Time is up.");
      return false;
    }
    return true;
  }

  // Memory, Sequence, Color Hunt, Frenzy count-up elapsed clock
  renderGameplayTime(elapsed);
  let scoresChanged = false;
  for (const [index, bot] of gameplayOpponents.entries()) {
    const interval = gameplayPlayers[index + 1].botIntervalMs * 1.1;
    const rawCleared = Math.floor(elapsed / interval);
    if (activeMode === "frenzy") {
      // Bots play alongside in Frenzy up to score comparison
      const botScore = rawCleared * 10;
      if (bot.cleared === rawCleared) continue;
      bot.cleared = rawCleared;
      bot.score = botScore;
      bot.reachedAt = rawCleared * interval;
      scoresChanged = true;
    } else {
      const cleared = Math.min(bot.targetCount, rawCleared);
      if (bot.cleared === cleared) continue;
      bot.cleared = cleared;
      bot.reachedAt = cleared * interval;
      scoresChanged = true;
    }
  }
  if (scoresChanged) renderGameplayScores();
  return true;
}

function tickGameplayMatch(now) {
  const playing = updateGameplayMatch(now);
  if (playing || (onlineGameplay && gameplayStartedAt !== null)) {
    gameplayFrame = requestAnimationFrame(tickGameplayMatch);
  }
}

function finishGameplayMatch(finisher, customReason = null) {
  const finishMode = activeMode;
  const isScore = isScoreMode(finishMode);
  stopGameplayMatch();
  const ranked = renderGameplayScores();
  const human = onlineGameplay ? gameplayPlayerStates[onlineGameplay.state.you] : gameplayHuman;
  const playerRank = rankLabels[ranked.indexOf(human)];
  const totalPops = Math.max(human.totalCleared ?? 0, human.cleared);
  const isMarathon = totalPops > human.cleared || finishMode === "frenzy";
  const progress = progressPercent(human.cleared, human.targetCount);
  const modeMeta = popRules.getMode(finishMode);
  const reason = customReason ?? (finisher ? `${finisher.name} won ${isMarathon ? "Pop Rush Marathon" : modeMeta.name}!` : "All modes complete.");
  gameplayResultsSummary.textContent = `${reason} You placed ${playerRank}${isScore || isMarathon ? ` with ${human.score} points.` : ` with ${progress}% progress.`}`;
  resultPops.textContent = isScore || isMarathon ? `${totalPops}` : `${human.cleared}/${human.targetCount}`;
  resultProgress.textContent = isScore || isMarathon ? `${human.score} pts` : `${progress}%`;
  resultRank.textContent = playerRank;

  const nextId = !onlineGameplay ? popRules.getNextMode(finishMode) : null;
  if (nextId) {
    const nextMeta = popRules.getMode(nextId);
    nextModeButton.hidden = false;
    nextModeButton.textContent = `Next Mode: ${nextMeta.shortName}`;
    nextModeHandler = () => {
      setSelectedGameMode(nextId);
      startGameplayMatch(nextId);
      gameplayTitle.focus({ preventScroll: true });
    };
  } else {
    nextModeButton.hidden = true;
    nextModeHandler = null;
  }

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
    entry.querySelector(".results-player-score strong").textContent = isScore
      ? `${player.score} pts`
      : `${progressPercent(player.cleared, player.targetCount)}%`;
    return entry;
  }));
  setGameplayBoardDisabled(true);
  gameplayRule.hidden = true;
  shakeHint.hidden = true;
  enableShakeButton.hidden = true;
  setPopRushReadyState(true, { label: "Results", showBanner: false });
  gameplayResults.dataset.animating = "true";
  gameplayResults.showModal();
}

/**
 * Attaches spatial 3D pointer tilt and glare tracking to elevated Match Result glass panels.
 * Runs only on fine pointers when reduced motion is off.
 * @param {HTMLElement | null} card
 */
function attachResultsTilt(card) {
  if (!card) return;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let frameId = 0;
  let pendingX = 0;
  let pendingY = 0;

  const resetTilt = () => {
    if (frameId) {
      cancelAnimationFrame(frameId);
      frameId = 0;
    }
    card.style.removeProperty("--tilt-x");
    card.style.removeProperty("--tilt-y");
    card.style.removeProperty("--glare-x");
    card.style.removeProperty("--glare-y");
  };

  card.addEventListener("pointermove", (event) => {
    if (!finePointer.matches || reducedMotion.matches) return;
    const rect = card.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pendingX = (event.clientX - rect.left) / rect.width;
    pendingY = (event.clientY - rect.top) / rect.height;
    if (frameId) return;
    frameId = requestAnimationFrame(() => {
      frameId = 0;
      const rotY = ((pendingX - 0.5) * 6).toFixed(2);
      const rotX = ((0.5 - pendingY) * 5).toFixed(2);
      card.style.setProperty("--tilt-x", `${rotX}deg`);
      card.style.setProperty("--tilt-y", `${rotY}deg`);
      card.style.setProperty("--glare-x", `${(pendingX * 100).toFixed(1)}%`);
      card.style.setProperty("--glare-y", `${(pendingY * 100).toFixed(1)}%`);
    });
  });

  card.addEventListener("pointerleave", resetTilt);
  card.addEventListener("pointercancel", resetTilt);
}

attachResultsTilt(gameplayResultsOrder);
attachResultsTilt(document.querySelector(".results-stats"));

gameplayResults.addEventListener("animationend", (event) => {
  if (event.animationName === "mrRowIn" || event.animationName === "mrStatIn") {
    event.target.style.willChange = "auto";
  }
  if (event.target === document.querySelector(".results-stats > li:last-child")) {
    delete gameplayResults.dataset.animating;
  }
});

nextModeButton.addEventListener("click", () => {
  if (nextModeHandler) nextModeHandler();
});

document.querySelector("#gameplay-results-back").addEventListener("click", (event) => {
  event.preventDefault();
  navigate("#home");
});

function isPopRushReady() {
  if (gameplayStartedAt === null || spillActive || countdownActive) return false;
  if (onlineGameplay) {
    const selfPlay = onlineGameplay.state.self;
    if (!selfPlay || !selfPlay.alive || selfPlay.stage !== stageIndex) return false;
    if (activeTargets.size > 0 || (activeMode === "sequence" && selfPlay.targets?.length > 0)) return false;
    if (activeMode === "rush") return true;
    const stageCount = selfPlay.stageCount ?? 1;
    return stageIndex < stageCount - 1;
  }
  if (transitionToNextMode) return true;
  if (activeMode === "classic") {
    return stageIndex < activeStages.length - 1 && activeTargets.size === 0;
  }
  if (activeMode === "rush") {
    return activeTargets.size === 0;
  }
  if (activeMode === "memory" || activeMode === "sequence" || activeMode === "color_hunt") {
    return activeTargets.size === 0 && activeSessionIndex < 9;
  }
  return false;
}

function advanceGameplayStage(restoreFocus = false) {
  if (!isPopRushReady() || !updateGameplayMatch(performance.now())) return;
  if (onlineGameplay && !sendOnlineGameplayInput("rush")) return;
  playGameplaySound(reloadSound);

  if (transitionToNextMode) {
    switchGameplayMode(transitionToNextMode, true, { preserveTotals: true, isTransition: true });
    if (restoreFocus) focusNextGameplayBubble();
    return;
  }

  if (onlineGameplay) {
    stageIndex += 1;
    activeSessionIndex = stageIndex;
    clearSpillTimers();
    setPopRushReadyState(false, { enabled: false });
    setGameplayBoardDisabled(true);
    return;
  }

  if (activeMode === "classic" || activeMode === "rush") {
    stageIndex += 1;
  } else {
    activeSessionIndex += 1;
  }
  setupSessionState(true);
  if (restoreFocus && activeMode !== "memory") focusNextGameplayBubble();
}

popRushButton.addEventListener("click", (event) => {
  if (countdownActive) return;
  if (gameplayStartedAt === null) {
    if (gameplayResultsOrder.childElementCount && !gameplayResults.open) gameplayResults.showModal();
    return;
  }
  if (isPopRushReady()) {
    advanceGameplayStage(event.detail === 0);
    return;
  }
  const now = performance.now();
  if (spillActive || wrongPopTimer !== null || !activeTargets.size || !updateGameplayMatch(now)) return;
  if (onlineGameplay && !sendOnlineGameplayInput("rush")) return;
  applyWrongPopPenalty(now, event);
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
  startGameplayMatch(activeMode);
  gameplayTitle.focus({ preventScroll: true });
});
