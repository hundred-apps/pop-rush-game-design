const showcase = document.querySelector(".showcase");
const dialog = document.querySelector("#game-dialog");
const dialogTitle = document.querySelector("#dialog-title");
const dialogContent = document.querySelector("#dialog-content");
const chatContent = document.querySelector("#chat-content");
const chatLog = document.querySelector(".chat-log");
const chatInput = document.querySelector("#chat-input");
const quickBadge = document.querySelector("#quick-badge");
const privateBadge = document.querySelector("#private-badge");
const readyButton = document.querySelector(".ready-button");
const roomScreen = document.querySelector("#room");
const roomTitle = document.querySelector("#room-title");
const gameplayBack = document.querySelector("#gameplay-back");
const playButton = document.querySelector("#play-match");
const onlineRoomStatus = document.querySelector("#online-room-status");
const inviteButton = document.querySelector("#room-invite");
const inviteDialog = document.querySelector("#room-invite-dialog");
const inviteCode = document.querySelector("#room-invite-code");
const inviteFeedback = document.querySelector("#room-invite-feedback");
const privateRoomDialog = document.querySelector("#private-room-dialog");
const createPrivateRoom = document.querySelector("#create-private-room");
const joinPrivateRoom = document.querySelector("#join-private-room");
const privateRoomCode = document.querySelector("#private-room-code");
const joinWithCode = document.querySelector("#join-with-code");
const privateRoomFeedback = document.querySelector("#private-room-feedback");
let joiningPrivateRoom = false;
let lastOnlineMatchId = null;
let pendingGameplayStart = false;
let initializedQueue = null;
let pageNavigation = 0;
const startupLoader = document.querySelector("#startup-loader");
const decodedArtwork = new Map();
let previewCharacterSeat = 0;
const characterPreview = document.querySelector("#character-preview");
const characterSelect = document.querySelector("#character-select");
const characterStatus = document.querySelector("#character-status");
const characterCards = popRules.players.map((player, index) => {
  const button = document.createElement("button");
  const image = document.createElement("img");
  const name = document.createElement("span");
  const level = document.createElement("small");
  button.type = "button";
  button.setAttribute("aria-label", `${player.name}, level ${player.level}`);
  image.src = `pages/match_results/characters/${player.character}.png`;
  image.alt = "";
  name.textContent = player.name;
  // level.textContent = `Lv. ${player.level}`;
  name.append(level);
  button.append(image, name);
  button.addEventListener("click", () => renderCharacter(index));
  return button;
});
document.querySelector("#character-options").append(...characterCards);

function renderCharacter(index) {
  previewCharacterSeat = index;
  const player = popRules.players[index];
  const portrait = `pages/character/${player.character}.png?v=2`;
  if (characterPreview.getAttribute("src") !== portrait)
    characterPreview.src = portrait;
  characterPreview.alt = player.name;
  characterCards.forEach((card, seat) =>
    card.setAttribute("aria-pressed", String(seat === index)),
  );
  characterSelect.textContent = "Select";
  characterStatus.textContent = "";
}

characterSelect.addEventListener("click", () => {
  saveSelectedCharacter(previewCharacterSeat);
  characterSelect.textContent = "Selected";
  characterStatus.textContent = `${popRules.players[previewCharacterSeat].name} selected for Quick Match.`;
  popPanels.syncHud();
});

const roomSeats = [...roomScreen.querySelectorAll(".player")].map(
  (slot, seat) => {
    const player = popRules.players[seat];
    const card = document.createElement("div");
    const image = document.createElement("img");
    const name = document.createElement("strong");
    const status = document.createElement("span");
    const botLevelSelect = document.createElement("select");
    card.className = "online-room-player";
    image.src = `pages/gameplay/player_card/${player.character}.png`;
    image.alt = "";
    image.loading = "lazy";
    image.hidden = true;
    name.textContent = "Open seat";
    status.textContent = "Waiting";
    botLevelSelect.className = "room-bot-level";
    botLevelSelect.hidden = true;
    for (const level of ["Easy", "Medium", "Hard", "Insane"]) {
      botLevelSelect.append(new Option(`Bot · ${level}`, level));
    }
    botLevelSelect.addEventListener("change", () => {
      const idx = Number(botLevelSelect.dataset.botIndex);
      if (!Number.isInteger(idx)) return;
      modeConfig.botSettings[idx] ??= { difficulty: "Medium" };
      modeConfig.botSettings[idx].difficulty = botLevelSelect.value;
      saveModeConfig();
    });
    card.append(image, name, status, botLevelSelect);
    slot.append(card);
    return { card, image, name, status, botLevelSelect, player };
  },
);

let previewBoard = equippedBoard;
const boardName = document.querySelector("#board-name");
const boardSize = document.querySelector("#board-size");
const boardUse = document.querySelector("#board-use");
const boardColorHunt = document.querySelector(".board-color-hunt");
const boardBubblesContainer = document.querySelector("#board-bubbles");

function createPreviewBubbles(board) {
  const firstTargets = board.stages[0];
  return Array.from({ length: board.cellCount }, (_, index) => {
    const cell = document.createElement("span");
    const face = document.createElement("span");
    const spec = board.cells?.[index];
    cell.className = "gameplay-bubble";
    cell.classList.toggle("gameplay-bubble--white", !firstTargets.includes(index));
    cell.classList.toggle("board-preview-popped", index === firstTargets[0]);
    face.className = "gameplay-bubble-face";
    cell.append(face);
    applyBubbleLayout(cell, spec);
    return cell;
  });
}

const boardCards = boards.map((board) => {
  const card = document.createElement("button");
  const image = boardColorHunt.cloneNode(false);
  const grid = document.createElement("div");
  const label = document.createElement("span");
  card.type = "button";
  image.classList.add("board-thumbnail");
  image.removeAttribute("role");
  image.removeAttribute("aria-label");
  image.setAttribute("aria-hidden", "true");
  grid.className = "gameplay-bubbles";
  grid.dataset.boardLayout = board.layout;
  grid.append(...createPreviewBubbles(board));
  image.append(grid);
  applyBoardTheme(image, board);
  label.textContent = board.name;
  card.append(image, label);
  card.addEventListener("click", () => renderBoard(board));
  return card;
});

document.querySelector("#board-options").append(...boardCards);
const roomBoardName = document.querySelector("#room-board-name");

function renderBoard(board) {
  boardName.textContent = board.name;
  boardSize.textContent = board.sizeLabel;
  previewBoard = board;
  boardBubblesContainer.dataset.boardLayout = board.layout;
  boardBubblesContainer.replaceChildren(...createPreviewBubbles(board));
  applyBoardTheme(boardColorHunt, board);
  boardColorHunt.setAttribute("aria-label", `${board.name} board, ${board.ariaShape}`);
  boardCards.forEach((card, index) => {
    const selected = boards[index] === board;
    card.setAttribute("aria-pressed", String(selected));
    if (showcase.dataset.view === "board" && selected) {
      card.scrollIntoView({ inline: "nearest", block: "nearest" });
    }
  });
  boardUse.textContent = board === equippedBoard ? "Equipped" : "Use Board";
  boardUse.disabled = board === equippedBoard;
}

renderBoard(equippedBoard);
boardUse.addEventListener("click", () => {
  equipBoard(previewBoard);
  renderBoard(previewBoard);
});

function openPanel(name) {
  popPanels.open(name);
}

function renderRoute(moveFocus = false, prepareAssets = false) {
  const previousView = showcase.dataset.view;
  const isPrivate = location.hash === "#private-room";
  const isRanked = location.hash === "#ranked-room";
  const isQueue = location.hash === "#online-room" || isRanked;
  const isOnline = isPrivate || isQueue;
  let view = location.hash === "#room" || isOnline ? "room" : "home";
  if (location.hash === "#gameplay") view = "gameplay";
  if (location.hash === "#character") view = "character";
  if (location.hash === "#board") view = "board";
  showcase.dataset.view = view;
  roomScreen.dataset.private = String(isOnline);
  quickBadge.hidden = isOnline;
  privateBadge.hidden = !isOnline;
  if (isOnline) privateBadge.textContent = isRanked ? "Ranked Match" : isQueue ? "Online Match" : "Room Code";

  if (view !== "gameplay") pendingGameplayStart = false;
  if (previousView === "gameplay" && previousView !== view) stopGameplayMatch();
  if (view === "home" || view === "character" || view === "board") {
    multiplayer.leave();
    lastOnlineMatchId = null;
    if (view === "character") renderCharacter(selectedCharacterSeat());
    if (view === "board") renderBoard(equippedBoard);
  } else if (view === "room") {
    roomBoardName.textContent = equippedBoard.name;
    applyBoardTheme(roomBoardName.parentElement, equippedBoard);
    roomTitle.textContent = isPrivate ? "Multiplayer Room" : isRanked ? "Ranked Match" : isQueue ? "Online Matchmaking" : "Quick Match";
    gameplayBack.hash = isOnline ? location.hash : "#room";
    if (isOnline) {
      connectOnlineRoom(isRanked ? "ranked" : isQueue ? "queue" : "private");
    } else {
      multiplayer.leave();
      setRoomCodeInUrl();
      lastOnlineMatchId = null;
      renderQuickRoom(true);
    }
  } else if (prepareAssets) {
    pendingGameplayStart = true;
  } else if (previousView !== "gameplay" || pendingGameplayStart) {
    pendingGameplayStart = false;
    const session = multiplayer.loadSession();
    if (
      multiplayer.state?.self &&
      multiplayer.connected
    ) {
      startOnlineGameplay(multiplayer.state);
    } else if (session) {
      resumeOnlineGameplay(session);
    } else {
      multiplayer.leave();
      gameplayBack.hash = "#room";
      startGameplayMatch();
    }
  }

  if (moveFocus) {
    document.querySelector(`#${view}-title`).focus({ preventScroll: true });
  }
}

function navigate(hash) {
  if (hash === "#home") setRoomCodeInUrl();
  if (location.hash === hash) {
    renderRoute(true);
    return;
  }

  location.hash = hash;
}

function setRoomCodeInUrl(code) {
  const url = new URL(location.href);
  if (code) url.searchParams.set("room", code);
  else url.searchParams.delete("room");
  if (url.href !== location.href) history.replaceState(null, "", url);
}

const roomModePicker = document.querySelector("#room-mode-picker");
const roomModeButtons = document.querySelectorAll("[data-game-mode]");
const roomLevelStepper = document.querySelector("#room-level-stepper");
const roomLevelPrev = document.querySelector("#room-level-prev");
const roomLevelNext = document.querySelector("#room-level-next");
const roomLevelLabel = document.querySelector("#room-level-label");
const roomModeHint = document.querySelector("#room-mode-hint");

function isOnlineRoomActive() {
  return ["#private-room", "#online-room", "#ranked-room"].includes(location.hash) && multiplayer.connected;
}

function renderRoomModePicker(onlineState = null) {
  const online = Boolean(onlineState) || isOnlineRoomActive();
  const stateRef = onlineState ?? (online ? multiplayer.state : null);
  const canEdit = !online || (stateRef.mode === "private" && stateRef.phase !== "playing" && stateRef.host === stateRef.you);
  const modeId = online ? (stateRef.gameMode ?? "classic") : getSelectedGameMode();
  const meta = popRules.getMode(modeId);
  const lv = online ? (stateRef.modeLevel ?? 1) : getModeLevel(modeId);

  for (const btn of roomModeButtons) {
    const mode = popRules.getMode(btn.dataset.gameMode);
    const locked = !popPanels.modeUnlocked(mode.id);
    btn.setAttribute("aria-pressed", String(mode.id === modeId));
    btn.disabled = !canEdit || locked;
    btn.textContent = locked ? `${mode.shortName} · Lv.${mode.unlockLevel}` : mode.shortName;
  }
  const config = popRules.getGameLevel(modeId, lv);
  const hasLevels = meta.maxLevel > 1;
  roomLevelStepper.hidden = !hasLevels;
  if (hasLevels) {
    roomLevelLabel.textContent = `Lv. ${lv} / ${meta.maxLevel}`;
    roomLevelPrev.disabled = !canEdit || lv <= 1;
    roomLevelNext.disabled = !canEdit || lv >= meta.maxLevel;
  }
  roomModeHint.hidden = false;
  roomModeHint.textContent = hasLevels
    ? `${config.sessions} sessions · ${modeId === "rush" ? "3s each" : `${config.ratio * 100}% initial targets`}`
    : "Endless survival · 3 lives";
}

for (const btn of roomModeButtons) {
  btn.addEventListener("click", () => {
    const gameMode = btn.dataset.gameMode;
    if (isOnlineRoomActive()) {
      multiplayer.send("config", { gameMode });
      return;
    }
    setSelectedGameMode(gameMode);
    renderRoomModePicker();
  });
}

roomLevelPrev.addEventListener("click", () => {
  if (isOnlineRoomActive()) {
    const current = multiplayer.state?.modeLevel ?? 1;
    multiplayer.send("config", { modeLevel: Math.max(1, current - 1) });
    return;
  }
  const modeId = getSelectedGameMode();
  setModeLevel(modeId, getModeLevel(modeId) - 1);
  renderRoomModePicker();
});

roomLevelNext.addEventListener("click", () => {
  if (isOnlineRoomActive()) {
    const current = multiplayer.state?.modeLevel ?? 1;
    multiplayer.send("config", { modeLevel: Math.min(popRules.getMode(multiplayer.state.gameMode).maxLevel, current + 1) });
    return;
  }
  const modeId = getSelectedGameMode();
  setModeLevel(modeId, getModeLevel(modeId) + 1);
  renderRoomModePicker();
});

function renderQuickRoom(ready) {
  roomModePicker.hidden = false;
  renderRoomModePicker();
  const human = selectedCharacterSeat();
  const botSeats = popRules.players
    .map((_, seat) => seat)
    .filter((seat) => seat !== human)
    .slice(0, modeConfig.botCount);
  renderRoomSeats(
    [
      { seat: human, status: ready ? "Ready" : "Not ready" },
      ...botSeats.map((seat, botIndex) => ({ seat, botIndex, status: "Bot" })),
    ],
    human,
  );
  readyButton.disabled = false;
  readyButton.setAttribute("aria-pressed", String(ready));
  playButton.disabled = false;
  playButton.setAttribute("aria-label", "Play match");
  inviteButton.hidden = true;
  onlineRoomStatus.hidden = false;
  quickBadge.textContent = modeConfig.botCount ? "Vs Bots" : "Solo";
  onlineRoomStatus.textContent = modeConfig.botCount ? `1 player · ${modeConfig.botCount} bots` : "Solo progression";
}

async function connectOnlineRoom(mode) {
  roomModePicker.hidden = false;
  const route = location.hash;
  const code = mode === "private" ? new URLSearchParams(location.search).get("room")?.toUpperCase() : "";
  onlineRoomStatus.hidden = false;
  if (
    multiplayer.connected &&
    multiplayer.state?.mode === mode &&
    (!code || multiplayer.state.code === code)
  ) {
    multiplayer.send("board", { boardId: equippedBoard.id });
    renderOnlineRoom(multiplayer.state);
    return;
  }
  readyButton.disabled = true;
  readyButton.setAttribute("aria-pressed", "false");
  playButton.disabled = true;
  inviteButton.hidden = true;
  renderRoomSeats();
  onlineRoomStatus.textContent = "Connecting to the room…";
  const available = await multiplayer.available();
  if (location.hash !== route) return;
  if (!available) {
    onlineRoomStatus.textContent = "Multiplayer server unavailable.";
    return;
  }
  multiplayer.join(mode, code || "", equippedBoard.id);
}

async function resumeOnlineGameplay(session) {
  setGameplayBoardDisabled(true);
  gameplayRule.hidden = true;
  gameplayOnlineStatus.textContent = "Reconnecting to the match…";
  gameplayOnlineStatus.hidden = false;
  const available = await multiplayer.available();
  if (location.hash !== "#gameplay") return;
  if (!available) {
    multiplayer.leave();
    gameplayOnlineStatus.textContent = "Multiplayer server unavailable.";
    return;
  }
  multiplayer.join(session.mode, session.code, equippedBoard.id);
}

function renderRoomSeats(members = [], yourSeat) {
  roomSeats.forEach(({ card, image, name, status, botLevelSelect, player }, seat) => {
    const member = members.find((item) => item.seat === seat);
    card.toggleAttribute("data-self", Boolean(member && seat === yourSeat));
    image.hidden = !member;
    const character = member?.character ?? player.character;
    const portrait = `pages/gameplay/player_card/${character}.png`;
    if (image.getAttribute("src") !== portrait) image.src = portrait;
    name.textContent = member ? `${member.weeklyCrown ? "♛ " : ""}${member.name ?? player.name}` : "Open seat";
    card.dataset.frame = member?.frame ?? "";
    const isPracticeBot = Number.isInteger(member?.botIndex);
    if (isPracticeBot) {
      const config = modeConfig.botSettings[member.botIndex] ??= { difficulty: "Medium" };
      const difficulty = ["Easy", "Medium", "Hard", "Insane"].includes(config.difficulty) ? config.difficulty : "Medium";
      botLevelSelect.dataset.botIndex = String(member.botIndex);
      botLevelSelect.value = difficulty;
      botLevelSelect.setAttribute("aria-label", `${member.name ?? player.name} level`);
      botLevelSelect.hidden = false;
      status.hidden = true;
    } else {
      delete botLevelSelect.dataset.botIndex;
      botLevelSelect.hidden = true;
      status.hidden = false;
      status.textContent = member?.title ? `${member.status} · ${member.title}` : member?.status ?? "Waiting";
    }
  });
}

function renderOnlineRoom(state) {
  const playing = state.phase === "playing";
  renderRoomSeats(
    state.players.map((member) => ({
      seat: member.seat,
      character: member.character,
      name: member.name,
      frame: member.frame,
      title: member.title,
      weeklyCrown: member.weeklyCrown,
      status: member.bot
        ? "Bot"
        : !member.connected
        ? "Disconnected"
        : playing
          ? "In match"
          : member.ready
            ? "Ready"
            : "Not ready",
    })),
    state.you,
  );
  const joined = state.players.filter((member) => member.connected);
  const self = joined.find((member) => member.seat === state.you);
  const isQueue = state.mode !== "private";
  const canPlay =
    playing ||
    (!isQueue && joined.length >= 2 &&
      joined.every((member) => member.ready) &&
      state.host === state.you);
  readyButton.disabled = !self || playing || (isQueue && !state.prepareUntil);
  readyButton.setAttribute("aria-pressed", String(Boolean(self?.ready)));
  playButton.disabled = !canPlay;
  playButton.textContent = "Play";
  playButton.setAttribute(
    "aria-label",
    playing ? "Return to match" : "Play match",
  );
  inviteButton.hidden = playing || isQueue;
  if (!inviteButton.hidden)
    inviteButton.textContent = `Room code · ${state.code}`;
  roomModePicker.hidden = false;
  renderRoomModePicker(state);
  const message = playing
    ? "Match in progress"
    : isQueue && state.prepareUntil
      ? "Choose your setting and tap Ready · 15s preparation"
      : isQueue
        ? state.mode === "ranked" ? "Finding a player from your tier" : "Finding players · Bots fill empty seats after 12s"
    : joined.length < 2
      ? "Waiting for another player"
      : !joined.every((member) => member.ready)
        ? "Tap Ready to start"
        : state.host === state.you
          ? "Ready to play"
          : "Waiting for host";
  onlineRoomStatus.textContent = `${joined.length}/${state.mode === "ranked" ? 2 : 4} · ${message}`;
}

multiplayer.onState = (state) => {
  const roomRoute = state.mode === "ranked" ? "#ranked-room" : state.mode === "queue" ? "#online-room" : "#private-room";
  if (joiningPrivateRoom && state.mode === "private") {
    setJoiningPrivateRoom(false);
    setRoomCodeInUrl(state.code);
    privateRoomDialog.close();
    navigate("#private-room");
    return;
  }
  if (location.hash !== roomRoute && location.hash !== "#gameplay")
    return;
  if (state.mode !== "private" && state.phase === "lobby" && initializedQueue !== state.code) {
    initializedQueue = state.code;
    submitOnlineReady(false);
  }
  renderOnlineRoom(state);
  gameplayBack.hash = roomRoute;
  if (state.phase === "playing" && lastOnlineMatchId !== state.matchId) {
    lastOnlineMatchId = state.matchId;
    if (location.hash !== "#gameplay") {
      navigate("#gameplay");
      return;
    }
  }
  if (location.hash !== "#gameplay" || showcase.dataset.view !== "gameplay" || pendingGameplayStart) return;
  if (state.self) {
    if (onlineGameplay?.state.matchId === state.matchId)
      syncOnlineGameplay(state);
    else startOnlineGameplay(state);
  } else {
    navigate(roomRoute);
  }
};

multiplayer.onStatus = (message, connected, fatal = false) => {
  if (joiningPrivateRoom) {
    privateRoomFeedback.textContent = message;
    if (fatal) {
      setJoiningPrivateRoom(false);
      privateRoomCode.focus();
      privateRoomCode.select();
    }
    return;
  }
  if (!["#private-room", "#online-room", "#ranked-room", "#gameplay"].includes(location.hash))
    return;
  onlineRoomStatus.textContent = message;
  if (connected) return;
  playButton.disabled = true;
  readyButton.disabled = true;
  inviteButton.hidden = true;
  pauseOnlineGameplay();
  if (location.hash === "#gameplay" && (!onlineGameplay || fatal))
    gameplayOnlineStatus.textContent = message;
};

function setJoiningPrivateRoom(pending) {
  joiningPrivateRoom = pending;
  createPrivateRoom.disabled = pending;
  joinWithCode.disabled = pending;
  privateRoomCode.readOnly = pending;
}

async function openOnlineDialog() {
  const route = location.hash;
  const onlineUnlocked = true;
  const rankedUnlocked = popPanels.getPlayerLevel() >= 15;
  const modeSelect = document.querySelector("#online-queue-mode");
  for (const option of modeSelect.options) option.disabled = !popPanels.modeUnlocked(option.value);
  modeSelect.value = getSelectedGameMode();
  syncOnlineLevelOptions();
  createPrivateRoom.disabled = !onlineUnlocked;
  joinWithCode.disabled = !onlineUnlocked;
  document.querySelector("#find-online-match").disabled = !onlineUnlocked;
  document.querySelector("#find-ranked-match").disabled = !rankedUnlocked;
  document.querySelector("#find-ranked-match").textContent = rankedUnlocked ? "Ranked Match" : "Ranked Match · Lv.15";
  const available = onlineUnlocked && await multiplayer.available();
  if (location.hash !== route || privateRoomDialog.open) return;
  privateRoomCode.value = "";
  privateRoomFeedback.textContent = available ? "" : "Multiplayer server unavailable.";
  if (!available) {
    createPrivateRoom.disabled = true;
    joinWithCode.disabled = true;
    document.querySelector("#find-online-match").disabled = true;
    document.querySelector("#find-ranked-match").disabled = true;
  }
  privateRoomDialog.showModal();
}

function syncOnlineLevelOptions() {
  const mode = document.querySelector("#online-queue-mode").value;
  const select = document.querySelector("#online-queue-level");
  select.replaceChildren(...Array.from({ length: popRules.getMode(mode).maxLevel }, (_, index) =>
    new Option(`Lv. ${index + 1}`, String(index + 1))));
  select.value = String(getModeLevel(mode));
  select.hidden = popRules.getMode(mode).maxLevel === 1;
}

document.querySelectorAll("[data-room]").forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.room === "private") openOnlineDialog();
    else navigate("#room");
  });
});

createPrivateRoom.addEventListener("click", () => {
  setRoomCodeInUrl();
  privateRoomDialog.close();
  navigate("#private-room");
});

document.querySelector("#find-online-match").addEventListener("click", () => {
  setRoomCodeInUrl();
  privateRoomDialog.close();
  navigate("#online-room");
});

document.querySelector("#find-ranked-match").addEventListener("click", () => {
  setRoomCodeInUrl();
  privateRoomDialog.close();
  navigate("#ranked-room");
});

document.querySelector("#online-queue-mode").addEventListener("change", syncOnlineLevelOptions);

joinPrivateRoom.addEventListener("submit", (event) => {
  event.preventDefault();
  if (joiningPrivateRoom) return;
  const code = privateRoomCode.value.trim().toUpperCase();
  if (!/^[A-F0-9]{6}$/.test(code)) {
    privateRoomFeedback.textContent =
      "Enter the 6-character code, such as A1B2C3.";
    privateRoomCode.focus();
    return;
  }
  privateRoomCode.value = code;
  setJoiningPrivateRoom(true);
  multiplayer.join("private", code, equippedBoard.id);
});

privateRoomDialog.addEventListener("close", () => {
  if (!joiningPrivateRoom) return;
  multiplayer.leave();
  setJoiningPrivateRoom(false);
});

document.querySelectorAll("[data-home]").forEach((button) => {
  button.addEventListener("click", () => navigate("#home"));
});

document.querySelectorAll("[data-character-page]").forEach((button) => {
  button.addEventListener("click", () => navigate("#character"));
});

document.querySelectorAll("[data-board-page]").forEach((button) => {
  button.addEventListener("click", () => navigate("#board"));
});

playButton.addEventListener("click", () => {
  if (location.hash === "#room" || multiplayer.state?.phase === "playing")
    navigate("#gameplay");
  else multiplayer.send("start");
});

inviteButton.addEventListener("click", () => {
  inviteCode.value = multiplayer.state.code;
  inviteFeedback.textContent = "";
  inviteDialog.showModal();
  inviteCode.select();
});

document
  .querySelector("#copy-room-invite")
  .addEventListener("click", async () => {
    inviteCode.select();
    try {
      if (navigator.clipboard)
        await navigator.clipboard.writeText(inviteCode.value);
      else if (!document.execCommand("copy"))
        throw new Error("Clipboard blocked");
      inviteFeedback.textContent = "Code copied.";
    } catch {
      inviteFeedback.textContent = "Select and copy the code above.";
    }
  });

document.querySelectorAll("[data-panel]").forEach((button) => {
  button.addEventListener("click", () => openPanel(button.dataset.panel));
});

const fullscreenButtons = document.querySelectorAll("[data-fullscreen]");

for (const button of fullscreenButtons) {
  button.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen({
          navigationUI: "hide",
        });
      }
    } catch {
      openPanel("fullscreen");
    }
  });
}

document.addEventListener("fullscreenchange", () => {
  const active = Boolean(document.fullscreenElement);
  for (const button of fullscreenButtons) {
    button.setAttribute(
      "aria-label",
      active ? "Exit full screen" : "Enter full screen",
    );
    button.firstElementChild.textContent = active ? "×" : "⛶";
  }
});

readyButton.addEventListener("click", () => {
  const ready = readyButton.getAttribute("aria-pressed") === "false";
  if (location.hash === "#room") renderQuickRoom(ready);
  else submitOnlineReady(ready);
});

function submitOnlineReady(ready) {
  multiplayer.send("ready", { ready, coins: popPanels.getCoins(), gems: popPanels.getGems(),
    loadout: getDeckSkills(true), upgrades: popPanels.getSkillUpgrades(), ...popPanels.matchBoosters() });
}

document.querySelector("#chat-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const message = chatInput.value.trim();
  if (!message) {
    chatInput.focus();
    return;
  }

  const item = document.createElement("li");
  const player = popRules.players[multiplayer.state?.you ?? 0];
  item.textContent = `${player.name}: ${message}`;
  chatLog.append(item);
  chatLog.scrollTop = chatLog.scrollHeight;
  chatInput.value = "";
  chatInput.focus();
});

function addArtworkUrls(urls, ...values) {
  for (const value of values) {
    for (const [, url] of value.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
      urls.add(new URL(url, document.baseURI).href);
    }
  }
}

function decodeArtwork(url) {
  const cached = decodedArtwork.get(url);
  if (cached) return cached;
  const image = new Image();
  image.src = url;
  const decoded = image.decode().catch(() => {
    decodedArtwork.delete(url);
  });
  decodedArtwork.set(url, decoded);
  return decoded;
}

function waitForPageAssets() {
  const urls = new Set();
  const images = [];
  const preparingMatch = ["room", "gameplay"].includes(showcase.dataset.view);

  if (preparingMatch) {
    const onlineBoardId = multiplayer.state?.self?.boardId;
    const matchBoard = onlineBoardId ? popRules.getBoard(onlineBoardId) : equippedBoard;
    const frame = gameplayGrid.parentElement;
    applyBoardTheme(frame, matchBoard);
    addArtworkUrls(urls, getComputedStyle(frame, "::before").backgroundImage);

    const theme = getComputedStyle(gameplayScreen);
    for (const property of [
      "--green-bubble", "--white-bubble", "--shallow-press-bubble",
      "--deep-press-bubble", "--popped-bubble",
    ]) {
      addArtworkUrls(urls, theme.getPropertyValue(property));
    }

    if (matchBoard.id === "paw_pop") {
      for (const state of ["idle", "white", "shallow", "deep", "popped"]) {
        urls.add(new URL(`pages/gameplay/bubbles/paw-pad-${state}.png`, document.baseURI).href);
      }
    }

    for (const { image, player } of roomSeats) {
      image.loading = "eager";
      images.push(image.decode());
      urls.add(new URL(`pages/match_results/characters/${player.character}.png`, document.baseURI).href);
    }
  }

  if (showcase.dataset.view === "gameplay") {
    for (const asset of ["stage.webp", "ribbon.png", "podium.png"]) {
      urls.add(new URL(`pages/match_results/${asset}`, document.baseURI).href);
    }
  }

  for (const element of showcase.querySelectorAll(".screen, .screen *")) {
    if (!element.getClientRects().length) continue;
    if (element instanceof HTMLImageElement) {
      element.loading = "eager";
      images.push(element.decode());
    }

    for (const pseudo of [null, "::before", "::after"]) {
      const style = getComputedStyle(element, pseudo);
      if (pseudo && (style.content === "none" || style.content === "normal")) continue;
      addArtworkUrls(urls, style.backgroundImage, style.borderImageSource);
    }
  }

  return Promise.allSettled([...images, ...[...urls].map(decodeArtwork)]);
}

function setPageLoading(loading) {
  startupLoader.hidden = !loading;
  showcase.inert = loading;
  if (loading) showcase.setAttribute("aria-busy", "true");
  else showcase.removeAttribute("aria-busy");
}

async function openPage(moveFocus = false) {
  const navigation = ++pageNavigation;
  const route = location.hash;
  setPageLoading(true);
  renderRoute(false, true);

  let timeout;
  try {
    await Promise.race([
      waitForPageAssets(),
      new Promise((resolve) => { timeout = setTimeout(resolve, 8000); }),
    ]);
  } finally {
    clearTimeout(timeout);
    if (navigation === pageNavigation && location.hash === route) {
      setPageLoading(false);
      if (pendingGameplayStart) renderRoute(moveFocus);
      else if (moveFocus) {
        document.querySelector(`#${showcase.dataset.view}-title`).focus({ preventScroll: true });
      }
    }
  }
}

window.addEventListener("hashchange", () => openPage(true));
openPage();
popPanels.refreshLiveEvents();
