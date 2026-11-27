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
  element.dataset.boardFinish = popPanels.getCosmetic("boardFinish") ?? "";
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
  soloSkills: [...popRules.defaultLoadout],
  lobbySkills: [...popRules.defaultLoadout],
  botCount: 3,
  botSettings: [],
  resetControl: "tap",
  levels: { classic: 1, memory: 1, rush: 1, sequence: 1, color_hunt: 1 },
};

function loadModeConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(modeConfigKey));
    if (!saved || typeof saved !== "object") return structuredClone(defaultModeConfig);
    return {
      mode: popRules.modeOrder.includes(saved.mode) ? saved.mode : "classic",
      soloSkills: popRules.normalizeLoadout(saved.soloSkills, false),
      lobbySkills: popRules.normalizeLoadout(saved.lobbySkills, true),
      botCount: Number.isInteger(saved.botCount) ? Math.max(0, Math.min(3, saved.botCount)) : 3,
      botSettings: Array.isArray(saved.botSettings) ? saved.botSettings : [],
      resetControl: ["tap", "swipe", "motion"].includes(saved.resetControl) ? saved.resetControl : "tap",
      levels: Object.fromEntries(Object.keys(defaultModeConfig.levels).map((mode) =>
        [mode, popRules.normalizeGameLevel(mode, saved.levels?.[mode])])),
    };
  } catch {
    return structuredClone(defaultModeConfig);
  }
}

const modeConfig = loadModeConfig();
let lobbySkills = [...modeConfig.lobbySkills];

function getDeckSkills(inLobby) {
  return popRules.allowedPlayerLoadout(inLobby ? lobbySkills : modeConfig.soloSkills, inLobby, popPanels.getXp());
}

function setDeckSkills(ids, inLobby, remember = false) {
  if (inLobby) {
    lobbySkills = popRules.allowedPlayerLoadout(ids, true, popPanels.getXp());
    if (!remember) return;
    modeConfig.lobbySkills = [...lobbySkills];
  } else modeConfig.soloSkills = popRules.allowedPlayerLoadout(ids, false, popPanels.getXp());
  saveModeConfig();
}
function saveModeConfig() {
  try { localStorage.setItem(modeConfigKey, JSON.stringify(modeConfig)); } catch {}
}

function getSelectedGameMode() {
  return popPanels.modeUnlocked(modeConfig.mode) ? modeConfig.mode : "classic";
}
function setSelectedGameMode(modeId) {
  if (!popRules.modeOrder.includes(modeId) || !popPanels.modeUnlocked(modeId)) return;
  modeConfig.mode = modeId;
  saveModeConfig();
}
function getModeLevel(modeId) {
  return modeConfig.levels[modeId] ?? 1;
}
function setModeLevel(modeId, lv) {
  if (!(modeId in modeConfig.levels)) return;
  modeConfig.levels[modeId] = popRules.normalizeGameLevel(modeId, lv);
  saveModeConfig();
}

const { players: gameplayPlayers, frenzyMaxLives, skillDefinitions } = popRules;
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
const skillDock = document.querySelector(".gameplay-abilities");
const energyLabel = document.querySelector("#gameplay-energy");
const topUpOffer = document.querySelector("#gameplay-top-up");
const frenzyMarker = document.querySelector("#gameplay-frenzy-marker");
const streakLabel = document.querySelector("#gameplay-streak");
const warningLabel = document.querySelector("#gameplay-attack-warning");
let skillButtons = [];
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
const coinSound = prepareGameplaySound("sounds/coin-drop.mp3", 0.04, 0.65, 2);

const bubbleRiseFrames = [
  { transform: "scale(0.9)" },
  { transform: "scale(1.025)", offset: 0.65 },
  { transform: "none" },
];

let gameplayStartedAt = null;
let gameplayFrame = null;
let stageIndex = 0;
let botRuntimes = [];
let lastWarning = null;
let wrongPopTimer = null;
let onlineGameplay = null;
let frenzyRivals = [];
let previousFlowCell = null;

// Extended multi-mode state
let activeMode = "classic";
let activeModeLevel = 1;
let sessionDeadline = null;
let decoyColors = {};
let frenzyAnnouncementUntil = 0;
let activeTargets = new Set();
let activeSpillOrder = [];
let spillActive = false;
let spillTimers = [];
let activeColorPair = null;
let run = popRules.createRunState("classic");
let completedLevel = false;
let humanTotalCleared = 0;
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

function setGameplayIdentity(player, { name, character, level }) {
  if (!name || (player.name === name && player.character === character && player.level === level)) return;
  Object.assign(player, { name, character, level });
  player.card.title = `${name} · Lv.${level}`;
  player.card.dataset.character = character;
  const portrait = player.card.querySelector(".gameplay-portrait");
  portrait.src = `pages/gameplay/player_card/${character}.png`;
  portrait.alt = `${character} portrait`;
  player.card.querySelector(".gameplay-leader-portrait").src = `pages/match_results/characters/${character}.png`;
  player.card.querySelector(".gameplay-name").textContent = name;
  player.card.querySelector(".gameplay-level").textContent = `Level ${level}`;
}

function saveSelectedCharacter(seat) {
  temporaryCharacterSeat = seat;
  try { localStorage.setItem("pop-rush-character", gameplayPlayers[seat].character); } catch {}
}

function renderGameplayScores() {
  const players = onlineGameplay
    ? onlineGameplay.state.scores.map(({ seat }) => gameplayPlayerStates[seat])
    : [gameplayHuman, ...gameplayOpponents];
  for (const player of gameplayPlayerStates) {
    if (!players.includes(player)) player.card.remove();
  }
  const ranked = [...players].sort((a, b) => Number(Boolean(a.forfeit)) - Number(Boolean(b.forfeit)) ||
    b.score - a.score || b.cleared - a.cleared || a.reachedAt - b.reachedAt);
  ranked.forEach((player, index) => {
    const isLeader = index === 0;
    player.card.classList.toggle("gameplay-score--leader", isLeader);
    player.rankLabel.textContent = rankLabels[index];
    player.crown.hidden = !isLeader;
    player.percent.textContent = player.score.toLocaleString("en-US");
    if (gameplayScores.children[index] !== player.card) {
      gameplayScores.insertBefore(player.card, gameplayScores.children[index] ?? null);
    }
  });
  return ranked;
}

function renderGameplayTime(displayMs) {
  const tenths = Math.max(0, Math.ceil(displayMs / 100));
  const minutes = String(Math.floor(tenths / 600)).padStart(2, "0");
  const seconds = String(Math.floor(tenths / 10) % 60).padStart(2, "0");
  const text = `${minutes}:${seconds}.${tenths % 10}`;
  if (gameplayTime.textContent !== text) gameplayTime.textContent = text;
}

function renderSkillDock(ids) {
  skillDock.replaceChildren();
  skillButtons = ids.map((id) => {
    const skill = skillDefinitions[id];
    const slot = document.createElement("li");
    slot.className = "gameplay-ability";
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.gameplaySkill = id;
    button.setAttribute("aria-label", `${skill.name}, ${skill.coins} coins`);
    if (skill.icon) {
      const icon = new Image();
      icon.src = `pages/gameplay/dock/${skill.icon}`;
      icon.alt = "";
      button.append(icon);
    } else {
      const icon = document.createElement("span");
      icon.className = "gameplay-skill-symbol";
      icon.textContent = skill.symbol;
      icon.setAttribute("aria-hidden", "true");
      button.append(icon);
    }
    const price = document.createElement("span");
    price.className = "gameplay-skill-price";
    price.textContent = skill.coins;
    price.setAttribute("aria-hidden", "true");
    const name = document.createElement("span");
    name.className = "gameplay-skill-name";
    name.textContent = skill.name;
    button.append(name, price);
    slot.append(button);
    skillDock.append(slot);
    button.addEventListener("click", useGameplaySkill);
    return button;
  });
  refreshGameplaySkills(false);
}

function refreshGameplaySkills(playing, now = performance.now()) {
  const time = onlineGameplay ? onlineGameplayClock(now) : now;
  const active = (playing || run.effects.paralyzeUntil > time) && gameplayStartedAt !== null &&
    !countdownActive && !spillActive && !onlineGameplay?.pendingSkill && !onlineGameplay?.pendingReset;
  const rivals = onlineGameplay
    ? onlineGameplay.state.scores.some((p) => p.seat !== onlineGameplay.state.you && p.alive)
    : botRuntimes.length > 0;
  for (const button of skillButtons) {
    const skill = button.dataset.gameplaySkill;
    const blocked = run.effects.paralyzeUntil > time && skill !== "cleanse" && skill !== "shield";
    const available = active && !blocked && popRules.canCastSkill(run, skill, time, {
      mode: activeMode, targets: activeTargets.size, rivals,
    });
    const affordable = popPanels.getCoins() >= skillDefinitions[skill].coins;
    const disabled = !available;
    if (button.disabled !== disabled) button.disabled = disabled;
    button.toggleAttribute("data-insufficient", available && !affordable);
  }
  const energyText = `Energy ${run.energy}%`;
  if (energyLabel.textContent !== energyText) energyLabel.textContent = energyText;
  const best = Math.max(run.bestStreak, popPanels.getModeRecord("frenzy")?.bestStreak ?? 0);
  const tier = popRules.getFrenzyTier(run.streak);
  const streakText = activeMode === "sequence" ? `Flow ×${run.flow}` :
    (now < frenzyAnnouncementUntil && tier.label ? tier.label :
      `Streak ${run.streak} · ×${tier.multiplier + Number(run.effects.frenzyBoostUntil > time)}`);
  if (streakLabel.textContent !== streakText) streakLabel.textContent = streakText;
  streakLabel.hidden = activeMode !== "frenzy" && !(activeMode === "sequence" && run.flow);
  updateFrenzyMarker(best);
}

function loadFrenzyRivals() {
  frenzyRivals = [];
  if (activeMode !== "frenzy") return;
  multiplayer.frenzyRecords().then((data) => {
    if (activeMode !== "frenzy" || !data) return;
    frenzyRivals = [...data.weekly].reverse();
  });
}

function updateFrenzyMarker(best) {
  frenzyMarker.hidden = activeMode !== "frenzy" || gameplayStartedAt === null;
  if (frenzyMarker.hidden) return;
  const name = popPanels.getNickname();
  const rival = frenzyRivals.find((entry) => entry.streak > run.streak && entry.name !== name);
  const goal = Math.max(best, rival?.streak ?? 0, 1);
  const label = rival ? `${rival.name} · ${rival.streak - run.streak} pops ahead` : `Personal best · ${best}`;
  const text = frenzyMarker.querySelector("span");
  if (text.textContent !== label) text.textContent = label;
  frenzyMarker.style.setProperty("--ghost-progress", `${Math.min(100, run.streak * 100 / goal)}%`);
  frenzyMarker.style.setProperty("--ghost-best", `${Math.min(100, best * 100 / goal)}%`);
  const portrait = frenzyMarker.querySelector("img");
  portrait.hidden = !rival;
  if (rival) {
    const src = `pages/gameplay/player_card/${rival.character}.png`;
    if (portrait.getAttribute("src") !== src) portrait.src = src;
  }
}

function castLocalSkill(skill, event, now) {
  if (skillDefinitions[skill].kind === "attack") {
    const rival = botRuntimes.filter((bot) => !bot.run.incoming && !(bot.run.lastAttackedAt + popRules.attackGraceMs > now))
      .sort((a, b) => b.player.score - a.player.score)[0];
    if (!rival) return false;
    rival.run.incoming = { skill, at: now + popRules.attackWarningMs };
  }
  popRules.castSkill(run, skill, now);
  if (skill === "blast") {
    for (let hits = 0; hits < 3 && activeTargets.size; hits += 1) {
      popGameplayBubble(gameplayCells[activeTargets.values().next().value], event, true);
    }
  }
  renderGameplayLives();
  return true;
}

function useGameplaySkill(event) {
  const button = event.currentTarget;
  const skill = button.dataset.gameplaySkill;
  const now = performance.now();
  if (button.disabled || gameplayStartedAt === null || countdownActive || spillActive) return;
  unlockGameplayAudio();
  if (popPanels.getCoins() < skillDefinitions[skill].coins) {
    topUpOffer.dataset.skill = skill;
    topUpOffer.textContent = popPanels.getGems() >= 5 ? "Exchange 5 Gems → 250 Coins & cast" : "5 Gems needed to exchange";
    topUpOffer.disabled = popPanels.getGems() < 5;
    topUpOffer.hidden = false;
    return;
  }
  activateGameplaySkill(skill, event, now);
}

function activateGameplaySkill(skill, event, now, topUp = false) {
  topUpOffer.hidden = true;
  if (onlineGameplay) {
    if (onlineGameplay.pendingSkill || !sendOnlineGameplayInput("skill", { skill, topUp })) return;
    onlineGameplay.pendingSkill = onlineGameplay.sentSeq;
    if (topUp) onlineGameplay.pendingTopUp = run.coinsSpent;
    refreshGameplaySkills(false);
    return;
  }
  if (!castLocalSkill(skill, event, now)) return;
  if (topUp) popPanels.exchangeCoins(5, 250);
  popPanels.spendCoins(skillDefinitions[skill].coins);
  playGameplayInputSound(coinSound, event);
  refreshGameplaySkills(true);
}

topUpOffer.addEventListener("click", (event) => {
  const skill = topUpOffer.dataset.skill;
  const now = performance.now();
  refreshGameplaySkills(updateGameplayMatch(now), now);
  const button = skillButtons.find((entry) => entry.dataset.gameplaySkill === skill);
  if (!button?.disabled && button && popPanels.getGems() >= 5) {
    activateGameplaySkill(skill, event, now, button.hasAttribute("data-insufficient"));
  } else topUpOffer.hidden = true;
});

function updateSkillVisuals(now) {
  const effects = run.effects;
  gameplayGrid.toggleAttribute("data-fog", effects.fogUntil > now);
  gameplayGrid.toggleAttribute("data-reverse", effects.reverseUntil > now);
  gameplayGrid.toggleAttribute("data-golden", effects.goldenUntil > now);
  for (const cell of gameplayCells) {
    const fake = effects.fakeUntil > now && effects.fakeIds?.includes(cell.index) && cell.state === "off";
    if (fake) {
      cell.bubble.setAttribute("data-fake-target", "");
      cell.bubble.classList.remove("gameplay-bubble--white");
      cell.bubble.dataset.bubbleColor = activeColorPair?.targetColor.id ?? "green";
    } else if (cell.bubble.hasAttribute("data-fake-target")) {
      cell.bubble.removeAttribute("data-fake-target");
      applyCellVisual(cell);
    }
  }
  const attack = run.incoming;
  warningLabel.hidden = !attack;
  if (attack) {
    const seconds = Math.max(0, (attack.at - now) / 1000).toFixed(1);
    warningLabel.textContent = `${skillDefinitions[attack.skill].symbol} ${skillDefinitions[attack.skill].name} · ${seconds}s`;
    warningLabel.style.setProperty("--warning-progress", `${Math.max(0, (attack.at - now) / popRules.attackWarningMs) * 100}%`);
    if (lastWarning !== attack.at) {
      playStreakNote(2);
      setTimeout(() => playStreakNote(5), 115);
    }
  }
  lastWarning = attack?.at ?? null;
  gameplayScreen.toggleAttribute("data-attack-warning", Boolean(attack));
  gameplayScreen.toggleAttribute("data-shield", effects.shieldUntil > now);
  gameplayScreen.toggleAttribute("data-blocked-attack", (run.blockedAt ?? -Infinity) + 450 > now);
}

function renderGameplayLives() {
  if (run.lives === null) {
    gameplayLivesEl.hidden = true;
    gameplayLivesEl.replaceChildren();
    return;
  }
  gameplayLivesEl.hidden = false;
  gameplayLivesEl.setAttribute("aria-label", `${run.lives} of ${frenzyMaxLives} lives left`);
  gameplayLivesEl.replaceChildren(
    ...Array.from({ length: frenzyMaxLives }, (_, i) => {
      const heart = document.createElement("span");
      heart.className = i < run.lives ? "gameplay-heart" : "gameplay-heart gameplay-heart--lost";
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
  if (event?.type === "touchstart" && !audioReady && !navigator.userActivation?.isActive) {
    queuedInputSounds.push(sound);
  } else {
    playGameplaySound(sound);
  }
}

function playStreakNote(step, wave = "sine") {
  if (gameplayAudioContext?.state !== "running") return;
  const start = gameplayAudioContext.currentTime;
  const note = gameplayAudioContext.createOscillator();
  const volume = gameplayAudioContext.createGain();
  note.type = wave;
  note.frequency.value = 440 * 2 ** ([0, 2, 4, 5, 7, 9, 11, 12][(step - 1) % 8] / 12);
  volume.gain.setValueAtTime(0.14, start);
  volume.gain.exponentialRampToValueAtTime(0.001, start + 0.13);
  note.connect(volume).connect(gameplayAudioContext.destination);
  note.start(start);
  note.stop(start + 0.14);
}

function announceFrenzyTier(previous, now) {
  const tier = popRules.getFrenzyTier(run.streak);
  if (tier.streak <= previous) return;
  frenzyAnnouncementUntil = now + 900;
  const step = Math.floor(tier.streak / 10);
  playStreakNote(1 + (step - 1) % 8);
  setTimeout(() => playStreakNote(1 + (step * 3) % 8), 90);
}

function playFlowFeedback(step, index) {
  playStreakNote(step);
  const face = gameplayCells[index]?.face;
  const previous = step > 1 ? previousFlowCell : null;
  previousFlowCell = face;
  if (!face || reduceBubbleMotion.matches) return;
  face.animate?.([{ filter: "brightness(1.7)" }, { filter: "none" }], 300);
  if (!previous || previous === face) return;
  const start = previous.getBoundingClientRect();
  const end = face.getBoundingClientRect();
  const board = gameplayGrid.parentElement;
  const origin = board.getBoundingClientRect();
  const dx = end.left + end.width / 2 - start.left - start.width / 2;
  const dy = end.top + end.height / 2 - start.top - start.height / 2;
  const line = document.createElement("span");
  line.className = "gameplay-flow-line";
  line.style.left = `${start.left + start.width / 2 - origin.left}px`;
  line.style.top = `${start.top + start.height / 2 - origin.top}px`;
  line.style.width = `${Math.hypot(dx, dy)}px`;
  line.style.rotate = `${Math.atan2(dy, dx)}rad`;
  board.append(line);
  setTimeout(() => line.remove(), 300);
}

function playPopFeedback(event) {
  const sound = popPanels.getCosmetic("popSfx");
  if (sound === "arcade" || sound === "retro") playStreakNote(1 + run.streak % 8, sound === "retro" ? "square" : "sine");
  else playGameplayInputSound(popSound, event);
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
  gameplayRule.hidden = locked || (gameplayStartedAt !== null && !activeTargets.size);
  gameplayScreen.classList.toggle("gameplay--wrong-pop", locked);
  gameplayBoardStatus.textContent = locked ? customMessage : "";
}

function setPopRushReadyState(ready, { label = "POP IT!", statusHtml = "Tap <strong>POP IT!</strong>", showBanner = false, moveFocus = false, enabled = ready || gameplayStartedAt !== null } = {}) {
  const wasReady = popRushSlot.dataset.ready === "true";
  popRushButton.disabled = !enabled;
  popRushSlot.hidden = activeMode === "frenzy" && label !== "Results";
  popRushButton.dataset.mode = label === "Results" ? "results" : "rush";
  popRushSlot.dataset.ready = String(ready);
  gameplayGrid.toggleAttribute("data-gesture-reset", ready && modeConfig.resetControl === "swipe");
  if (popRushLabel.textContent !== label) popRushLabel.textContent = label;
  if (popRushStatusText) popRushStatusText.innerHTML = statusHtml;
  popRushActions.hidden = !showBanner;
  if (moveFocus && ready && !wasReady) popRushButton.focus({ preventScroll: true });
}

function showReadyPopRush(moveFocus = true, options = {}) {
  gameplayRule.hidden = true;
  enableShakeButton.hidden = modeConfig.resetControl !== "motion" || typeof motionEvent?.requestPermission !== "function" || enableShakeButton.disabled;
  setPopRushReadyState(true, { label: "POP IT!", showBanner: true, moveFocus, ...options });
}

function formatModeBanner(modeId, isNext = false) {
  const meta = popRules.getMode(modeId);
  const level = onlineGameplay?.state.modeLevel ?? getModeLevel(modeId);
  const label = meta.maxLevel > 1 ? `${meta.name} Lv.${level}` : meta.name;
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
  cell.bubble.toggleAttribute("data-target", isTarget && activeMode !== "memory");
  const marked = activeMode === "memory" ? (isPushed && !cell.mistake) : (isTarget || (isPushed && !cell.mistake));
  const color = marked ? activeColorPair?.targetColor : decoyColors[cell.index];
  const tone = color?.label ?? (marked ? "Green" : "White");
  cell.bubble.classList.toggle("gameplay-bubble--white", !marked && !color);
  cell.bubble.classList.toggle("gameplay-bubble--incorrect", Boolean(isPushed && cell.mistake));
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
  if (wasDown !== isPushed) cell.face.classList.remove("gameplay-bubble-face--mistap");
  if (raise && wasDown && pressed === "true" && !reduceBubbleMotion.matches) {
    cell.riseAnimation?.cancel();
    cell.riseAnimation = cell.face.animate?.(bubbleRiseFrames, {
      duration: 230,
      delay: resetWave ? Math.max(0, 4 - cell.row) * 42 : 0,
      easing: "ease-out",
      fill: "backwards",
    });
  }
}

function startMemorySpill(elapsed = 0) {
  clearSpillTimers();
  if (!onlineGameplay) sessionDeadline = null;
  const duration = popRules.memorySpillDuration(activeModeLevel, activeSpillOrder.length);
  if (elapsed >= duration) {
    setRulePrompt(`Pop <strong>${activeTargets.size}</strong> remembered!`, "green");
    return;
  }
  spillActive = true;
  setPopRushReadyState(false, { enabled: false });
  setGameplayBoardDisabled(true);
  setRulePrompt(`Watch! <strong>Memorize (${activeSpillOrder.length})</strong>`, "green");
  const { gapMs } = popRules.getGameLevel("memory", activeModeLevel);

  activeSpillOrder.forEach((idx, order) => {
    const cell = gameplayCells[idx];
    if (!cell) return;
    const startsIn = 260 + order * gapMs - elapsed;
    const endsIn = startsIn + 220;
    if (endsIn <= 0) return;
    spillTimers.push(setTimeout(() => cell.bubble.classList.add("gameplay-bubble--spill-on"), Math.max(0, startsIn)));
    spillTimers.push(setTimeout(() => cell.bubble.classList.remove("gameplay-bubble--spill-on"), endsIn));
  });

  spillTimers.push(setTimeout(() => {
    if (gameplayStartedAt === null) return;
    spillActive = false;
    if (!onlineGameplay) {
      startLocalSessionClock(performance.now());
      setPopRushReadyState(false);
      setGameplayBoardDisabled(false);
    }
    setRulePrompt(`Pop <strong>${activeTargets.size}</strong> remembered!`, "green");
    gameplayBoardStatus.textContent = "Spill finished. Pop the remembered bubbles.";
  }, duration - elapsed));
}

function showWrongFeedback(message) {
  clearTimeout(wrongPopTimer);
  setWrongPopFeedback(true, message);
  wrongPopTimer = setTimeout(() => {
    wrongPopTimer = null;
    setWrongPopFeedback(false);
  }, 360);
}

function applyWrongPopPenalty(now, event, count = 1, reason) {
  playGameplayInputSound(incorrectSound, event);
  if (onlineGameplay) return;
  if (!popRules.scoreWrong(run, count, now)) {
    gameplayBoardStatus.textContent = "Shield blocked the penalty.";
    return;
  }
  gameplayHuman.score = run.score;
  renderGameplayScores();
  renderGameplayLives();
  const lifeText = run.lives === null ? "" : ` · ${run.lives} lives left`;
  showWrongFeedback(`${reason ?? (count === 1 ? "Wrong pop" : `${count} targets missed`)} · −${count * 5} points${lifeText}`);
  if (run.lives === 0) finishGameplayMatch(null, "Out of lives.");
}

function animateWrongBubble(cell) {
  cell.riseAnimation?.cancel();
  cell.face.classList.remove("gameplay-bubble-face--mistap");
  void cell.face.offsetWidth;
  cell.face.classList.add("gameplay-bubble-face--mistap");
}

function popGameplayBubble(cell, event, fromSkill = false) {
  const now = performance.now();
  if (cell.bubble.disabled || cell.state === "pushed" || spillActive || countdownActive || !updateGameplayMatch(now)) return;
  if (!onlineGameplay && !fromSkill && run.effects.magnet) {
    delete run.effects.magnet;
    for (const index of [...activeTargets]) popGameplayBubble(gameplayCells[index], event, true);
    playPopFeedback(event);
    return;
  }
  const correct = activeTargets.has(cell.index);
  if (onlineGameplay && !sendOnlineGameplayInput("pop", { cell: cell.index })) return;

  cell.riseAnimation?.cancel();
  cell.state = "pushed";
  cell.mistake = !correct;
  if (correct) activeTargets.delete(cell.index);
  applyCellVisual(cell);
  if (correct && popPanels.getCosmetic("popVfx") === "blue-flame" && !reduceBubbleMotion.matches) {
    cell.face.animate?.([{ filter: "drop-shadow(0 -9px 7px #00d5ff) brightness(1.6)" }, { filter: "none" }], 340);
  }
  if (!correct) animateWrongBubble(cell);
  if (onlineGameplay) {
    if (correct && !fromSkill) playPopFeedback(event);
    else if (!correct) applyWrongPopPenalty(now, event);
    return;
  }

  if (!correct) {
    applyWrongPopPenalty(now, event);
    if (activeMode === "frenzy" && gameplayStartedAt !== null) startLocalSessionClock(now);
    if (gameplayStartedAt !== null && !activeTargets.size && activeMode !== "frenzy") showReadyPopRush();
    return;
  }

  const previousFlow = run.flow;
  const previousTier = popRules.getFrenzyTier(run.streak).streak;
  popRules.scoreCorrect(run, activeMode, now, cell.index);
  if (!fromSkill) playPopFeedback(event);
  if (activeMode === "frenzy") {
    startLocalSessionClock(now);
    announceFrenzyTier(previousTier, now);
  }
  if (activeMode === "sequence" && run.flow > previousFlow) playFlowFeedback(run.flow, cell.index);
  humanTotalCleared += 1;
  gameplayHuman.cleared += 1;
  gameplayHuman.totalCleared = humanTotalCleared;
  gameplayHuman.score = run.score;
  gameplayHuman.reachedAt = now - gameplayStartedAt;

  if (activeMode === "frenzy") {
    for (const other of gameplayCells) {
      if (other === cell || other.state !== "pushed") continue;
      other.state = "off";
      other.mistake = false;
      applyCellVisual(other, { raise: true });
    }
  }
  if (activeMode === "sequence" || activeMode === "frenzy") {
    const offCells = gameplayCells.filter((candidate) => candidate.state === "off");
    if (offCells.length) {
      const picked = offCells[Math.floor(Math.random() * offCells.length)];
      picked.state = "on";
      if (activeMode === "sequence") run.appearedAt[picked.index] = now;
      activeTargets.add(picked.index);
      applyCellVisual(picked, { raise: true });
    }
  }

  renderGameplayScores();
  renderGameplayLives();
  if (!activeTargets.size && activeMode !== "frenzy") showReadyPopRush();
  else if (event.type === "click" && event.detail === 0 && activeMode !== "memory") focusNextGameplayBubble();
}

let gameplayCells = [];
let resetWave = false;
let boardGesture = null;

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
    face.addEventListener("animationend", (event) => {
      if (event.animationName.startsWith("matte-bubble-mistap")) {
        face.classList.remove("gameplay-bubble-face--mistap");
      }
    });
    compress.className = "gameplay-bubble-compress";
    face.append(compress);
    bubble.append(face);
    applyBubbleLayout(bubble, spec);

    const cell = {
      bubble,
      face,
      index,
      state: "off",
      mistake: false,
      row: spec?.row ?? Math.floor(index / 4) + 1,
      column: spec?.column ?? index % 4 + 1,
      shape: spec?.shape ?? "circle",
    };
    bubble.addEventListener("touchstart", (event) => {
      if (modeConfig.resetControl === "swipe" && isPopRushReady()) return;
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

function stageDuration() {
  return popRules.sessionDuration(activeMode, activeModeLevel, activeBoard.cellCount);
}

function startLocalSessionClock(now) {
  if (run.startShieldPending) {
    run.effects.shieldUntil = now + 3000;
    delete run.startShieldPending;
  }
  sessionDeadline = now + (activeMode === "frenzy" ? popRules.getFrenzyTier(run.streak).durationMs : stageDuration());
}

function setupSessionState(raiseBubbles = false, { deferStart = false } = {}) {
  clearSpillTimers();
  buildGameplayCells(activeBoard);
  applyBoardTheme(gameplayGrid.parentElement, activeBoard);
  gameplayScreen.querySelector("#gameplay-board-name").textContent = activeBoard.name;
  shakePulse = null;
  gravityBaseline = null;
  const session = popRules.createLevelSession(activeMode, activeModeLevel, activeBoard.cellCount,
    activeMode === "classic" ? activeColorPair : null);
  activeTargets = new Set(session.targets);
  activeColorPair = session.colorPair;
  activeSpillOrder = session.spillOrder;
  decoyColors = session.decoyColors;
  sessionDeadline = null;
  setPopRushReadyState(false, { showBanner: false });
  if (wrongPopTimer === null) setWrongPopFeedback(false);
  renderGameplayLives();
  renderSessionHeading();
  for (const cell of gameplayCells) {
    cell.mistake = false;
    cell.state = activeMode !== "memory" && activeTargets.has(cell.index) ? "on" : "off";
    applyCellVisual(cell, { raise: raiseBubbles });
  }
  setGameplayBoardDisabled(deferStart || activeMode === "memory");
  if (deferStart) renderGameplayTime(stageDuration());
  else if (activeMode === "memory") startMemorySpill();
  else startLocalSessionClock(performance.now());
}

function renderSessionHeading() {
  const config = popRules.getGameLevel(activeMode, activeModeLevel);
  const meta = popRules.getMode(activeMode);
  gameplayTitle.textContent = activeMode === "frenzy" ? meta.name :
    `${meta.shortName} Lv.${activeModeLevel} · ${stageIndex + 1}/${config.sessions}`;
  if (activeMode === "classic") setClassicTargetPrompt();
  else if (activeMode === "color_hunt") {
    const color = activeColorPair.targetColor;
    setRulePrompt(`Pop only <strong>${color.label}!</strong>`, color.id);
  } else if (activeMode === "memory") {
    setRulePrompt(spillActive ? `Watch! <strong>Memorize (${activeSpillOrder.length})</strong>` :
      `Pop <strong>${activeTargets.size}</strong> remembered!`, "green");
  } else {
    setRulePrompt("Pop only <strong>GREEN!</strong>", "green");
  }
}

function switchGameplayMode(modeId) {
  if (gameplayFrame !== null) {
    cancelAnimationFrame(gameplayFrame);
    gameplayFrame = null;
  }
  gameplayStartedAt = null;
  activeMode = popPanels.modeUnlocked(modeId) ? modeId : "classic";
  activeColorPair = activeMode === "classic" ? popRules.pickClassicColorPair() : null;
  activeModeLevel = getModeLevel(activeMode);
  stageIndex = 0;
  run = popRules.createRunState(activeMode);
  run.weekend = popRules.weekendBonus(activeMode, false, Date.now());
  run.skillUpgrades = popPanels.getSkillUpgrades();
  const { booster, xpBoostUntil } = popPanels.matchBoosters();
  run.booster = booster;
  run.xpBoost = xpBoostUntil > Date.now();
  run.startShieldPending = booster === "shield_start";
  popPanels.consumeMatchBooster(booster);
  frenzyAnnouncementUntil = 0;
  loadFrenzyRivals();
  completedLevel = false;
  lastWarning = null;
  botRuntimes = gameplayOpponents.map((player, index) => {
    const config = modeConfig.botSettings[index] ?? {};
    const difficulty = ["Easy", "Medium", "Hard", "Insane"].includes(config.difficulty) ? config.difficulty : "Medium";
    const skills = Array.isArray(config.skills) ? popRules.normalizeLoadout(config.skills, true)
      : popRules.createBotLoadout(difficulty);
    return { player, difficulty, skills, run: popRules.createRunState(activeMode), nextPop: 0, cleared: 0 };
  });

  const level = popRules.getGameLevel(activeMode, activeModeLevel);
  const modeTargetTotal = level.sessions * (activeMode === "sequence" ? activeBoard.cellCount :
    popRules.targetSize(activeBoard.cellCount, level.ratio));
  for (const player of gameplayPlayerStates) {
    player.cleared = 0;
    player.score = 0;
    player.totalCleared = 0;
    player.reachedAt = 0;
    player.forfeit = false;
    player.targetCount = modeTargetTotal;
  }
  humanTotalCleared = 0;
  setupSessionState(true, { deferStart: true });
  renderGameplayScores();

  runGameplayCountdown(() => {
    gameplayStartedAt = performance.now();
    if (activeMode === "memory") startMemorySpill();
    else {
      startLocalSessionClock(gameplayStartedAt);
      setPopRushReadyState(false);
      setGameplayBoardDisabled(false);
    }
    gameplayFrame = requestAnimationFrame(tickGameplayMatch);
  }, formatModeBanner(activeMode));
}

function startGameplayMatch(overrideMode = null) {
  stopGameplayMatch();
  onlineGameplay = null;
  activeBoard = equippedBoard;
  gameplayPlayerStates.forEach((player, seat) => setGameplayIdentity(player, gameplayPlayers[seat]));
  gameplayHuman = gameplayPlayerStates[selectedCharacterSeat()];
  setGameplayIdentity(gameplayHuman, { ...gameplayHuman, name: popPanels.getNickname(), level: popPanels.getPlayerLevel() });
  gameplayOpponents = gameplayPlayerStates.filter((player) => player !== gameplayHuman).slice(0, modeConfig.botCount);
  renderSkillDock(getDeckSkills(modeConfig.botCount > 0));
  lobbySkills = [...modeConfig.lobbySkills];
  gameplayResultsOrder.replaceChildren();
  switchGameplayMode(overrideMode ?? modeConfig.mode);
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
  renderGameplayLives();
  renderSessionHeading();
}

function updateOnlineGameplay(now) {
  const { state, connected, lockUntil } = onlineGameplay;
  const serverNow = onlineGameplayClock(now);
  const readyIn = Math.ceil((state.startsAt - 550 - serverNow) / 1000);
  const selfPlay = state.self;
  const startsAt = selfPlay.playFrom ?? state.startsAt;
  renderGameplayTime(selfPlay.alive ? (selfPlay.deadline ?? startsAt) - Math.max(startsAt, serverNow) : 0);
  let message = "";
  if (!connected) {
    message = "Reconnecting to the match…";
    clearGameplayCountdown();
  } else if (readyIn > 0) {
    const step = String(Math.min(3, readyIn));
    if (gameplayCountdownValue.dataset.step !== step) showCountdownStep(step, step, onlineTransitionBanner);
    onlinePlayShown = false;
  } else {
    if (!onlinePlayShown && serverNow < state.startsAt) {
      onlinePlayShown = true;
      onlinePlayBannerUntil = now + state.startsAt - serverNow;
      showCountdownStep("PLAY!", "play", onlineTransitionBanner);
    } else if (serverNow >= state.startsAt && !gameplayCountdown.hidden) {
      clearGameplayCountdown();
    }
    if (selfPlay && !selfPlay.alive) message = selfPlay.completed ? "Level complete · Waiting for rivals…" : "Out of lives · Watching others…";
  }

  const preStart = connected && (readyIn > 0 || (onlinePlayShown && now < onlinePlayBannerUntil));
  if (!message && !preStart && serverNow < (selfPlay?.effects?.paralyzeUntil ?? 0)) message = "Paralyzed · Board frozen";
  if (!preStart && connected && activeMode === "memory" && !message && serverNow >= selfPlay.sessionStartedAt) {
    const key = `${state.matchId}:${stageIndex}:${selfPlay?.sessionStartedAt}`;
    if (onlineSpillKey !== key && activeSpillOrder.length > 0) {
      onlineSpillKey = key;
      startMemorySpill(Math.max(0, serverNow - selfPlay.sessionStartedAt));
    }
  }

  const locked = !message && !preStart && !spillActive && serverNow < lockUntil;
  const cleared = (selfPlay?.targets?.length ?? 1) === 0;
  const canRush = activeMode !== "frenzy";
  const rushAvailable = !message && !preStart && !spillActive && serverNow >= startsAt &&
    serverNow < selfPlay.deadline && !onlineGameplay.pendingReset && selfPlay.stage === stageIndex;
  const showRush = rushAvailable && !locked && cleared && canRush;
  if (gameplayOnlineStatus.textContent !== message) gameplayOnlineStatus.textContent = message;
  gameplayOnlineStatus.hidden = !message;
  if (showRush && popRushSlot.dataset.ready !== "true") {
    showReadyPopRush(false);
  }
  if (!showRush) setPopRushReadyState(false, { enabled: rushAvailable });
  gameplayRule.hidden = Boolean(message || (preStart && activeMode !== "memory") || locked || cleared || wrongPopTimer !== null);
  const disabled = !rushAvailable || locked;
  if (gameplayCells[0]?.bubble.disabled !== disabled) setGameplayBoardDisabled(disabled);
  updateSkillVisuals(serverNow);
  return !disabled || showRush;
}

function startOnlineGameplay(state) {
  stopGameplayMatch();
  gameplayResultsOrder.replaceChildren();
  renderSkillDock(popRules.normalizeLoadout(state.self.loadout, true));
  lobbySkills = [...modeConfig.lobbySkills];
  onlinePlayShown = false;
  onlinePlayBannerUntil = 0;
  onlineSpillKey = "";
  onlineGameplay = { state, round: state.round ?? 0, receivedAt: performance.now(), sentSeq: state.self.ack, connected: true, lockUntil: 0 };
  activeMode = state.gameMode ?? "classic";
  loadFrenzyRivals();
  activeModeLevel = state.modeLevel ?? 1;
  onlineTransitionBanner = formatModeBanner(activeMode, (state.round ?? 0) > 0);
  activeBoard = popRules.getBoard(state.self.boardId);
  stageIndex = state.self.stage;
  activeTargets = new Set(state.self.targets ?? []);
  activeColorPair = state.self.colorPair ?? null;
  decoyColors = state.self.decoyColors ?? {};
  activeSpillOrder = state.self.spillOrder ?? [];
  run = { ...popRules.createRunState(activeMode), ...state.self };
  popPanels.consumeMatchBooster(run.booster, state.matchId);
  renderGameplayLives();
  applyOnlineSessionHeader();
  gameplayStartedAt = performance.now();
  syncOnlineGameplay(state);
  if (gameplayStartedAt !== null) gameplayFrame = requestAnimationFrame(tickGameplayMatch);
}

function syncOnlineGameplay(state) {
  if (!onlineGameplay || onlineGameplay.state.matchId !== state.matchId || gameplayStartedAt === null) return;
  if (!onlineGameplay.connected) {
    onlineGameplay.sentSeq = state.self.ack;
    onlineGameplay.pendingSkill = null;
    onlineGameplay.pendingReset = null;
  }
  const roundChanged = (state.round ?? 0) !== onlineGameplay.round;
  onlineGameplay.round = state.round ?? 0;
  onlineGameplay.state = state;
  onlineGameplay.receivedAt = performance.now();
  onlineGameplay.connected = true;

  activeMode = state.gameMode ?? activeMode;
  activeModeLevel = state.modeLevel ?? activeModeLevel;
  if (roundChanged) {
    onlinePlayShown = false;
    onlinePlayBannerUntil = 0;
    onlineSpillKey = "";
    clearSpillTimers();
    clearGameplayCountdown();
    setPopRushReadyState(false, { label: "POP IT!", showBanner: false });
    onlineTransitionBanner = formatModeBanner(activeMode, true);
  }
  if (state.self.boardId) activeBoard = popRules.getBoard(state.self.boardId);
  for (const player of state.scores) {
    setGameplayIdentity(gameplayPlayerStates[player.seat], player);
    Object.assign(gameplayPlayerStates[player.seat], {
      cleared: player.cleared,
      totalCleared: player.totalCleared ?? player.cleared,
      score: player.score ?? 0,
      targetCount: player.targetCount ?? activeBoard.targetCount,
      reachedAt: player.reachedAt,
      forfeit: Boolean(player.forfeit),
    });
  }
  renderGameplayScores();
  if (roundChanged || state.self.ack >= onlineGameplay.sentSeq || state.phase === "finished") {
    const stageChanged = roundChanged || stageIndex !== state.self.stage || gameplayGrid.dataset.builtBoard !== activeBoard.id;
    stageIndex = state.self.stage;
      activeTargets = new Set(state.self.targets ?? []);
    activeColorPair = state.self.colorPair ?? null;
    decoyColors = state.self.decoyColors ?? {};
    activeSpillOrder = state.self.spillOrder ?? [];
    const previousMistakes = run.penalties ?? 0;
    const previousFlow = run.flow;
    const previousLives = run.lives;
    const previousTier = popRules.getFrenzyTier(run.streak).streak;
    run = { ...popRules.createRunState(activeMode), ...state.self };
    onlineGameplay.lockUntil = state.self.lockUntil;
    if (run.penalties > previousMistakes) showWrongFeedback(`Wrong pop · −5 per miss${run.lives === null ? "" : ` · ${run.lives} lives left`}`);
    if (run.lives !== previousLives) renderGameplayLives();
    if (activeMode === "frenzy" && run.streak > previousTier) announceFrenzyTier(previousTier, performance.now());
    if (activeMode === "sequence" && run.flow > previousFlow) playFlowFeedback(run.flow, run.lastFlowCell);
    if (state.self.ack >= onlineGameplay.pendingReset || roundChanged) onlineGameplay.pendingReset = null;
    const topUpAccepted = onlineGameplay.pendingTopUp !== undefined && run.coinsSpent > onlineGameplay.pendingTopUp;
    if (state.self.ack >= onlineGameplay.pendingSkill || roundChanged) {
      delete onlineGameplay.pendingTopUp;
      onlineGameplay.pendingSkill = null;
    }
    if (popPanels.settleMatchSkillCoins(state.matchId, state.self.coinsSpent ?? 0, topUpAccepted)) playGameplaySound(coinSound);

    if (stageChanged) {
      clearSpillTimers();
      setPopRushReadyState(false, { label: "POP IT!", showBanner: false });
    }
    applyOnlineSessionHeader();

    const pushedSet = new Set(state.self.pushed ?? []);
    const wrongPushed = new Set(state.self.wrongPushed ?? []);
    for (const cell of gameplayCells) {
      const prevState = cell.state;
      const nextState = pushedSet.has(cell.index) ? "pushed" : activeTargets.has(cell.index) ? "on" : "off";
      cell.state = nextState;
      cell.mistake = wrongPushed.has(cell.index);
      const shouldRaise = (
        (prevState === "pushed" && nextState !== "pushed") ||
        ((activeMode === "sequence" || activeMode === "frenzy") && prevState === "off" && nextState === "on")
      );
      applyCellVisual(cell, { raise: shouldRaise });
    }

  }

  if (state.phase === "finished") {
    renderGameplayTime(0);
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
  topUpOffer.hidden = true;
  previousFlowCell = null;
  sessionDeadline = null;
  if (gameplayFrame !== null) cancelAnimationFrame(gameplayFrame);
  if (wrongPopTimer !== null) clearTimeout(wrongPopTimer);
  clearSpillTimers();
  clearGameplayCountdown();
  gameplayFrame = null;
  gameplayStartedAt = null;
  refreshGameplaySkills(false);
  wrongPopTimer = null;
  gameplayOnlineStatus.hidden = true;
  gameplayLivesEl.hidden = true;
  setPopRushReadyState(false, { label: "POP IT!", showBanner: false });
  setWrongPopFeedback(false);
  warningLabel.hidden = true;
  gameplayScreen.removeAttribute("data-attack-warning");
  gameplayScreen.removeAttribute("data-blocked-attack");
  gameplayScreen.removeAttribute("data-shield");
  gameplayGrid.removeAttribute("data-fog");
  gameplayGrid.removeAttribute("data-reverse");
  gameplayGrid.removeAttribute("data-golden");
  frenzyMarker.hidden = true;
  if (gameplayResults.open) gameplayResults.close();
}

function tickPracticeBots(now) {
  if (run.incoming && now >= run.incoming.at) {
    const { skill } = run.incoming;
    delete run.incoming;
    const result = popRules.landAttack(run, skill, now, activeBoard.cellCount, [...activeTargets],
      gameplayCells.filter((cell) => cell.state === "pushed").map((cell) => cell.index));
    if (result.blocked) {
      run.blockedAt = now;
      gameplayBoardStatus.textContent = "BLOCKED!";
    }
    if (result.targets) {
      if (activeMode === "color_hunt") popRules.moveDecoyColors(decoyColors, [...activeTargets], result.targets);
      activeTargets = new Set(result.targets);
      for (const cell of gameplayCells) {
        if (cell.state === "pushed") continue;
        cell.state = activeMode !== "memory" && activeTargets.has(cell.index) ? "on" : "off";
        applyCellVisual(cell);
      }
      if (activeMode === "memory") {
        activeSpillOrder = result.targets;
        startMemorySpill();
      }
    }
  }

  let changed = false;
  const level = popRules.getGameLevel(activeMode, activeModeLevel);
  const perSession = activeMode === "sequence" ? activeBoard.cellCount : popRules.targetSize(activeBoard.cellCount, level.ratio);
  const rivals = [{ player: gameplayHuman, run }, ...botRuntimes.filter((bot) => !bot.completed && bot.run.lives !== 0)];
  for (const bot of botRuntimes) {
    const { player, difficulty, skills, run: botRun } = bot;
    if (bot.completed || botRun.lives === 0) continue;
    const config = popRules.botLevels[difficulty];
    if (bot.deadline === undefined) {
      startBotSession(bot, gameplayStartedAt, perSession);
    }
    if (now >= bot.deadline) {
      if (activeMode === "frenzy") {
        popRules.scoreWrong(botRun, 1, now);
        bot.deadline = now + popRules.getFrenzyTier(botRun.streak).durationMs;
      } else {
        finishBotSession(bot, now, perSession);
      }
      player.score = botRun.score;
      changed = true;
      if (bot.completed || botRun.lives === 0) continue;
    }
    if (now < bot.playFrom) continue;
    const incoming = botRun.incoming;
    if (incoming && !incoming.reacted && incoming.at - now <= 300 && now < incoming.at) {
      incoming.reacted = true;
      const chance = config.warningShield;
      if (skills.includes("shield") && Math.random() < chance &&
          popRules.canCastSkill(botRun, "shield", now, { mode: activeMode, targets: 1, rivals: true })) {
        popRules.castSkill(botRun, "shield", now);
      }
    }
    if (incoming && now >= incoming.at) {
      delete botRun.incoming;
      const result = popRules.landAttack(botRun, incoming.skill, now, activeBoard.cellCount, [], []);
      if (result.targets) bot.nextPop = Math.max(bot.nextPop, now + 650);
    }
    const targets = activeMode === "frenzy" ? perSession : perSession - bot.sessionPops;
    if (!targets && activeMode !== "frenzy") {
      finishBotSession(bot, now, perSession);
      changed = true;
      continue;
    }
    const attackable = rivals.filter((rival) => rival.player !== player && !rival.run.incoming &&
      !(rival.run.lastAttackedAt + popRules.attackGraceMs > now));
    attackable.sort((a, b) => b.player.score - a.player.score);
    const enemy = difficulty === "Medium" ? attackable[Math.floor(Math.random() * attackable.length)] : attackable[0];
    const chosen = popRules.chooseBotSkill(bot, now, { mode: activeMode, targets, rivals: Boolean(enemy) });
    const blocked = botRun.effects.paralyzeUntil > now;
    let hits = 0;
    if (chosen && (!blocked || chosen === "cleanse")) {
      popRules.castSkill(botRun, chosen, now);
      if (skillDefinitions[chosen].kind === "attack") enemy.run.incoming = { skill: chosen, at: now + popRules.attackWarningMs };
      if (chosen === "blast") hits = 3;
    }
    if (!blocked && now >= bot.nextPop) {
      bot.nextPop = now + popRules.botDelay(config.delay);
      if (botRun.effects.magnet) {
        delete botRun.effects.magnet;
        hits = Math.max(hits, targets);
      } else if (Math.random() >= config.accuracy || (activeMode === "frenzy" && botRun.streak >= config.maxStreak)) {
        popRules.scoreWrong(botRun, 1, now);
        if (activeMode === "frenzy") bot.deadline = now + popRules.getFrenzyTier(botRun.streak).durationMs;
        changed = true;
      } else hits = Math.max(1, hits);
    }
    if (activeMode !== "frenzy") hits = Math.min(hits, targets);
    else if (Number.isFinite(config.maxStreak)) hits = Math.min(hits, config.maxStreak - botRun.streak);
    for (let i = 0; i < hits; i += 1) popRules.scoreCorrect(botRun, activeMode, now);
    if (hits) {
      bot.cleared += hits;
      bot.sessionPops += hits;
      if (activeMode === "frenzy") bot.deadline = now + popRules.getFrenzyTier(botRun.streak).durationMs;
      player.reachedAt = now - gameplayStartedAt;
      changed = true;
    }
    player.cleared = bot.cleared;
    player.score = botRun.score;
  }
  if (changed) renderGameplayScores();
}

function startBotSession(bot, now, targets) {
  const memoryDelay = activeMode === "memory" ? popRules.memorySpillDuration(activeModeLevel, targets) : 0;
  bot.sessionPops = 0;
  bot.playFrom = now + memoryDelay;
  bot.deadline = bot.playFrom + stageDuration();
  bot.nextPop = bot.playFrom + popRules.botDelay(popRules.botLevels[bot.difficulty].delay);
}

function finishBotSession(bot, now, targets) {
  const missed = Math.max(0, targets - bot.sessionPops);
  if (missed) popRules.scoreWrong(bot.run, missed, now);
  popRules.resetSessionScoring(bot.run, activeMode, !missed);
  bot.player.score = bot.run.score;
  if (bot.run.completedSessions >= popRules.getGameLevel(activeMode, activeModeLevel).sessions) bot.completed = true;
  else startBotSession(bot, now, targets);
}

function updateGameplayMatch(now) {
  if (gameplayStartedAt === null) return false;
  if (onlineGameplay) return updateOnlineGameplay(now);

  renderGameplayTime(sessionDeadline === null ? stageDuration() : sessionDeadline - now);
  if (sessionDeadline !== null && now >= sessionDeadline) {
    if (activeMode === "frenzy") {
      applyWrongPopPenalty(now, null, 1, "Time up");
      if (gameplayStartedAt !== null) startLocalSessionClock(now);
    } else {
      completeLocalSession(now);
    }
    return false;
  }

  tickPracticeBots(now);
  if (gameplayStartedAt === null) return false;
  updateSkillVisuals(now);
  const disabled = run.effects.paralyzeUntil > now;
  if (!spillActive && gameplayCells[0]?.bubble.disabled !== disabled) setGameplayBoardDisabled(disabled);
  gameplayOnlineStatus.hidden = !disabled;
  if (disabled) gameplayOnlineStatus.textContent = "Paralyzed · Board frozen";
  return !disabled;
}

function tickGameplayMatch(now) {
  const playing = updateGameplayMatch(now);
  refreshGameplaySkills(playing, now);
  if (gameplayStartedAt !== null) {
    gameplayFrame = requestAnimationFrame(tickGameplayMatch);
  }
}

function finishGameplayMatch(finisher, customReason = null) {
  const finishMode = activeMode;
  const finishedAt = onlineGameplay?.state.self?.finishedAt ?? onlineGameplay?.state.finishedAt ?? performance.now();
  const elapsed = finishedAt - (onlineGameplay?.state.startsAt ?? gameplayStartedAt);
  stopGameplayMatch();
  const ranked = renderGameplayScores();
  const human = onlineGameplay ? gameplayPlayerStates[onlineGameplay.state.you] : gameplayHuman;
  const humanRank = ranked.indexOf(human) + 1;
  const playerRank = rankLabels[humanRank - 1];
  const totalPops = Math.max(human.totalCleared ?? 0, human.cleared);
  const modeMeta = popRules.getMode(finishMode);
  const reason = customReason ?? (finisher ? `${finisher.name} won ${modeMeta.name}!` : `${modeMeta.name} complete.`);
  const completed = completedLevel || Boolean(onlineGameplay?.state.self?.completed);
  const matchId = onlineGameplay?.state.matchId;
  const rewardScale = !onlineGameplay && gameplayOpponents.length ? 0.5 : 1;
  const coins = totalPops ? Math.floor((80 + totalPops * 2) * rewardScale * (run.weekend ? 2 : 1)) : 0;
  const xp = Math.floor((30 + totalPops) * rewardScale * (run.weekend ? 1.5 : 1) * (run.xpBoost ? 1.5 : 1));
  popPanels.recordModeResult(finishMode, { score: human.score, level: activeModeLevel, elapsed, streak: run.bestStreak,
    completed, mistakes: run.mistakes, penalties: run.penalties, feverBoxes: run.feverBoxes, totalPops, rank: humanRank,
    completedSessions: run.completedSessions,
    perfectSessions: run.perfectSessions, skillUses: run.skillUses, skillCategories: run.skillCategories,
    won: onlineGameplay ? onlineGameplay.state.winner === onlineGameplay.state.you : humanRank === 1 && completed,
  }, { coins, xp }, matchId);
  if (matchId) popPanels.refreshLiveEvents();
  gameplayResultsSummary.textContent = `${reason} You placed ${playerRank} with ${human.score} points.`;
  resultPops.textContent = totalPops;
  resultProgress.textContent = `${human.score} pts`;
  resultRank.textContent = playerRank;
  const rewards = [coins ? `+${coins} Coins` : "", xp ? `+${xp} XP` : "",
    run.feverBoxes ? `+${run.feverBoxes} Fever Box` : ""].filter(Boolean);
  if (completed && finishMode === "sequence") {
    rewards.push(`${run.mistakes ? 1 : elapsed < popRules.getGameLevel(finishMode, activeModeLevel).sessions * 5000 ? 3 : 2} ★`);
  }
  const rewardText = document.querySelector("#results-reward");
  rewardText.textContent = rewards.join(" · ");
  rewardText.hidden = !rewards.length;

  const nextId = !onlineGameplay && completedLevel && activeModeLevel < modeMeta.maxLevel ? finishMode : null;
  if (nextId) {
    nextModeButton.hidden = false;
    nextModeButton.textContent = `Next Level: ${activeModeLevel + 1}`;
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
    entry.querySelector(".results-player-score strong").textContent = `${player.score} pts`;
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
  if (gameplayStartedAt === null || spillActive || countdownActive || activeMode === "frenzy" || activeTargets.size) return false;
  return !onlineGameplay || Boolean(onlineGameplay.state.self?.alive && onlineGameplay.state.self.stage === stageIndex);
}

function advanceGameplayStage(restoreFocus = false, event = null, gesture = false) {
  const now = performance.now();
  if (countdownActive || spillActive || activeMode === "frenzy" || !updateGameplayMatch(now)) return;
  const missed = activeTargets.size;
  if (missed && !event) return;
  if (onlineGameplay) {
    if (onlineGameplay.pendingReset || !sendOnlineGameplayInput("rush")) return;
    onlineGameplay.pendingReset = onlineGameplay.sentSeq;
    setPopRushReadyState(false, { enabled: false });
    setGameplayBoardDisabled(true);
    if (missed) playGameplayInputSound(incorrectSound, event);
    else playGameplaySound(reloadSound);
    return;
  }

  completeLocalSession(now, event, gesture);
  if (restoreFocus && activeMode !== "memory" && gameplayStartedAt !== null) focusNextGameplayBubble();
}

function completeLocalSession(now, event = null, gesture = false) {
  const initialMisses = activeTargets.size;
  const missed = activeMode === "sequence" && initialMisses
    ? gameplayCells.filter((cell) => cell.state !== "pushed").length : initialMisses;
  if (missed) {
    applyWrongPopPenalty(now, event, missed, event ? undefined : "Time up");
    if (gameplayStartedAt === null) return;
  } else playGameplaySound(reloadSound);

  popRules.resetSessionScoring(run, activeMode, !missed);
  gameplayHuman.score = run.score;
  renderGameplayScores();

  const meta = popRules.getMode(activeMode);
  if (stageIndex + 1 >= popRules.getGameLevel(activeMode, activeModeLevel).sessions) {
    completedLevel = true;
    if (activeModeLevel < meta.maxLevel) setModeLevel(activeMode, activeModeLevel + 1);
    finishGameplayMatch(null, `${meta.name} Level ${activeModeLevel} complete!`);
    return;
  }
  stageIndex += 1;
  resetWave = gesture;
  setupSessionState(true);
  resetWave = false;
}

popRushButton.addEventListener("click", (event) => {
  if (countdownActive) return;
  if (gameplayStartedAt === null) {
    if (gameplayResultsOrder.childElementCount && !gameplayResults.open) gameplayResults.showModal();
    return;
  }
  advanceGameplayStage(event.detail === 0, event);
});

function motionVector(sample) {
  if (!sample) return null;
  const vector = [sample.x, sample.y, sample.z];
  return vector.every(Number.isFinite) ? vector : null;
}

function handleGameplayShake(event) {
  if (modeConfig.resetControl !== "motion" || !shakeAllowed || !isPopRushReady()) return;
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
    navigator.vibrate?.(45);
  }
}

if (motionEvent) window.addEventListener("devicemotion", handleGameplayShake);
let tiltOrigin = null;
let tiltArmed = false;
window.addEventListener("deviceorientation", (event) => {
  if (modeConfig.resetControl !== "motion" || !shakeAllowed || !isPopRushReady() || !Number.isFinite(event.beta)) {
    tiltOrigin = null;
    tiltArmed = false;
    return;
  }
  tiltOrigin ??= event.beta;
  const delta = Math.abs(event.beta - tiltOrigin);
  if (delta > 27) tiltArmed = true;
  if (tiltArmed && delta < 10) {
    tiltArmed = false;
    advanceGameplayStage();
    navigator.vibrate?.(40);
  }
});

gameplayGrid.addEventListener("touchstart", (event) => {
  if (modeConfig.resetControl !== "swipe" || !isPopRushReady()) return;
  const [first, second] = [...event.touches];
  boardGesture ??= { x: first.clientX, y: first.clientY };
  if (second) boardGesture.distance = Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
}, { passive: true });

gameplayGrid.addEventListener("touchmove", (event) => {
  if (!boardGesture || !isPopRushReady()) return;
  const [first, second] = [...event.touches];
  const swipe = boardGesture.y - first.clientY > 50 && Math.abs(first.clientX - boardGesture.x) < 90;
  const pinch = second && boardGesture.distance && Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY) - boardGesture.distance > 45;
  if (!(swipe || pinch)) return;
  if (event.cancelable) event.preventDefault();
  boardGesture = null;
  advanceGameplayStage(false, null, true);
  [3, 2, 1].forEach((note, index) => setTimeout(() => playStreakNote(note), index * 55));
  navigator.vibrate?.([10, 30, 10, 30, 15]);
}, { passive: false });

for (const type of ["touchend", "touchcancel"]) {
  gameplayGrid.addEventListener(type, () => { boardGesture = null; }, { passive: true });
}
enableShakeButton.addEventListener("click", async () => {
  enableShakeButton.disabled = true;
  try {
    shakeAllowed = await motionEvent.requestPermission() === "granted";
    if (typeof window.DeviceOrientationEvent?.requestPermission === "function") {
      window.DeviceOrientationEvent.requestPermission().catch(() => {});
    }
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
    if (onlineGameplay.state.mode !== "private") multiplayer.leave();
    navigate(document.querySelector("#gameplay-back").hash);
    return;
  }
  startGameplayMatch(activeMode);
  gameplayTitle.focus({ preventScroll: true });
});
