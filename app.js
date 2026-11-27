const backsound = document.querySelector("#game-backsound");
backsound.volume = 0.25;

function startBacksound() {
  backsound.play().then(() => {
    document.removeEventListener("click", startBacksound, true);
  }).catch(() => {
    // A later interaction can retry if the browser blocks playback.
  });
}

document.addEventListener("click", startBacksound, true);
startBacksound();

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
    card.className = "online-room-player";
    image.src = `pages/gameplay/player_card/${player.character}.png`;
    image.alt = "";
    image.loading = "lazy";
    image.hidden = true;
    name.textContent = "Open seat";
    status.textContent = "Waiting";
    card.append(image, name, status);
    slot.append(card);
    return { card, image, name, status, player };
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
  let view = location.hash === "#room" || isPrivate ? "room" : "home";
  if (location.hash === "#gameplay") view = "gameplay";
  if (location.hash === "#character") view = "character";
  if (location.hash === "#board") view = "board";
  showcase.dataset.view = view;
  roomScreen.dataset.private = String(isPrivate);
  quickBadge.hidden = isPrivate;
  privateBadge.hidden = !isPrivate;

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
    roomTitle.textContent = isPrivate ? "Multiplayer Room" : "Quick Match";
    gameplayBack.hash = isPrivate ? "#private-room" : "#room";
    if (isPrivate) {
      connectPrivateRoom();
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
      multiplayer.state?.mode === "private" &&
      multiplayer.state.self &&
      multiplayer.connected
    ) {
      startOnlineGameplay(multiplayer.state);
    } else if (session?.mode === "private") {
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
const roomRushDurations = document.querySelector("#room-rush-durations");
const roomRushButtons = document.querySelectorAll("[data-rush-seconds]");
const roomLevelStepper = document.querySelector("#room-level-stepper");
const roomLevelPrev = document.querySelector("#room-level-prev");
const roomLevelNext = document.querySelector("#room-level-next");
const roomLevelLabel = document.querySelector("#room-level-label");
const roomModeHint = document.querySelector("#room-mode-hint");

function isOnlineRoomActive() {
  return location.hash === "#private-room" && multiplayer.connected && multiplayer.state?.mode === "private";
}

function renderRoomModePicker(onlineState = null) {
  const online = Boolean(onlineState) || isOnlineRoomActive();
  const stateRef = onlineState ?? (online ? multiplayer.state : null);
  const canEdit = !online || (stateRef.phase !== "playing" && stateRef.host === stateRef.you);
  const modeId = online ? (stateRef.gameMode ?? "classic") : getSelectedGameMode();
  const rushSec = online ? (stateRef.rushSeconds ?? 45) : getSelectedRushSeconds();
  const meta = popRules.getMode(modeId);
  const lv = online ? (stateRef.modeLevel ?? 1) : getModeLevel(modeId);

  for (const btn of roomModeButtons) {
    btn.setAttribute("aria-pressed", String(btn.dataset.gameMode === modeId));
    btn.disabled = !canEdit;
  }
  roomRushDurations.hidden = modeId !== "rush";
  if (modeId === "rush") {
    for (const btn of roomRushButtons) {
      btn.setAttribute("aria-pressed", String(Number(btn.dataset.rushSeconds) === rushSec));
      btn.disabled = !canEdit;
    }
  }
  const hasLevels = meta.maxLevel > 1;
  roomLevelStepper.hidden = !hasLevels;
  if (hasLevels) {
    roomLevelLabel.textContent = `Lv. ${lv} / ${meta.maxLevel}`;
    roomLevelPrev.disabled = !canEdit || lv <= 1;
    roomLevelNext.disabled = !canEdit || lv >= meta.maxLevel;
  }
  roomModeHint.hidden = modeId === "rush" || hasLevels;
  if (online && !canEdit) {
    roomModeHint.hidden = false;
    roomModeHint.textContent = `Host selected: ${meta.name}`;
  } else if (modeId === "classic") {
    roomModeHint.textContent = "All 6 modes: Classic \u2192 Frenzy";
  } else if (modeId === "frenzy") {
    roomModeHint.textContent = "Endless survival \u00b7 3 lives";
  }
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

for (const btn of roomRushButtons) {
  btn.addEventListener("click", () => {
    const rushSeconds = Number(btn.dataset.rushSeconds);
    if (isOnlineRoomActive()) {
      multiplayer.send("config", { rushSeconds });
      return;
    }
    setSelectedRushSeconds(rushSeconds);
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
    multiplayer.send("config", { modeLevel: Math.min(100, current + 1) });
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
  renderRoomSeats(
    popRules.players.map((_, seat) => ({
      seat,
      status: seat === human ? (ready ? "Ready" : "Not ready") : "Bot",
    })),
    human,
  );
  readyButton.disabled = false;
  readyButton.setAttribute("aria-pressed", String(ready));
  playButton.disabled = false;
  playButton.setAttribute("aria-label", "Play match");
  inviteButton.hidden = true;
  onlineRoomStatus.hidden = false;
  onlineRoomStatus.textContent = "1 player · 3 bots";
}

async function connectPrivateRoom() {
  roomModePicker.hidden = false;
  const route = location.hash;
  const code = new URLSearchParams(location.search).get("room")?.toUpperCase();
  onlineRoomStatus.hidden = false;
  if (
    multiplayer.connected &&
    multiplayer.state?.mode === "private" &&
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
  multiplayer.join("private", code || "", equippedBoard.id);
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
  multiplayer.join("private", session.code, equippedBoard.id);
}

function renderRoomSeats(members = [], yourSeat) {
  roomSeats.forEach(({ card, image, name, status, player }, seat) => {
    const member = members.find((item) => item.seat === seat);
    card.toggleAttribute("data-self", Boolean(member && seat === yourSeat));
    image.hidden = !member;
    name.textContent = member ? player.name : "Open seat";
    status.textContent = member?.status ?? "Waiting";
  });
}

function renderOnlineRoom(state) {
  const playing = state.phase === "playing";
  renderRoomSeats(
    state.players.map((member) => ({
      seat: member.seat,
      status: !member.connected
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
  const canPlay =
    playing ||
    (joined.length >= 2 &&
      joined.every((member) => member.ready) &&
      state.host === state.you);
  readyButton.disabled = !self || playing;
  readyButton.setAttribute("aria-pressed", String(Boolean(self?.ready)));
  playButton.disabled = !canPlay;
  playButton.textContent = "Play";
  playButton.setAttribute(
    "aria-label",
    playing ? "Return to match" : "Play match",
  );
  inviteButton.hidden = playing;
  if (!inviteButton.hidden)
    inviteButton.textContent = `Room code · ${state.code}`;
  roomModePicker.hidden = false;
  renderRoomModePicker(state);
  const message = playing
    ? "Match in progress"
    : joined.length < 2
      ? "Waiting for another player"
      : !joined.every((member) => member.ready)
        ? "Tap Ready to start"
        : state.host === state.you
          ? "Ready to play"
          : "Waiting for host";
  onlineRoomStatus.textContent = `${joined.length}/4 · ${message}`;
}

multiplayer.onState = (state) => {
  if (state.mode !== "private") return;
  if (joiningPrivateRoom) {
    setJoiningPrivateRoom(false);
    setRoomCodeInUrl(state.code);
    privateRoomDialog.close();
    navigate("#private-room");
    return;
  }
  if (location.hash !== "#private-room" && location.hash !== "#gameplay")
    return;
  renderOnlineRoom(state);
  gameplayBack.hash = "#private-room";
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
    navigate("#private-room");
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
  if (location.hash !== "#private-room" && location.hash !== "#gameplay")
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

document.querySelectorAll("[data-room]").forEach((button) => {
  button.addEventListener("click", async () => {
    if (button.dataset.room !== "private") {
      navigate("#room");
      return;
    }
    const route = location.hash;
    const available = await multiplayer.available();
    if (route !== location.hash || privateRoomDialog.open) return;
    if (available) {
      privateRoomCode.value = "";
      privateRoomFeedback.textContent = "";
      privateRoomDialog.showModal();
    } else {
      navigate("#private-room");
    }
  });
});

createPrivateRoom.addEventListener("click", () => {
  setRoomCodeInUrl();
  privateRoomDialog.close();
  navigate("#private-room");
});

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
  else multiplayer.send("ready", { ready });
});

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
