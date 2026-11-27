const popPanels = (() => {
  const storageKey = "pop-rush-player-state";
  const dialog = document.querySelector("#game-dialog");
  const dialogShell = dialog.querySelector(".game-dialog-shell");
  const profileTopper = document.querySelector("#profile-topper");
  const profileHeaderStars = dialog.querySelectorAll(".profile-header-star");
  const missionsTopper = document.querySelector("#missions-topper");
  const missionsFooter = document.querySelector("#missions-footer");
  const missionsHeaderMascot = document.querySelector(
    "#missions-header-mascot",
  );
  const missionsHeaderCastle = document.querySelector(
    "#missions-header-castle",
  );
  const rewardsAmbient = document.querySelector("#rewards-ambient");
  const shopAmbient = document.querySelector("#shop-ambient");
  const dialogTitle = document.querySelector("#dialog-title");
  const dialogSubtitle = document.querySelector("#dialog-subtitle");
  const dialogIcon = document.querySelector("#dialog-icon");
  const dialogWallet = document.querySelector("#dialog-wallet");
  const dialogWalletCoins = document.querySelector("#dialog-wallet-coins");
  const dialogWalletGems = document.querySelector("#dialog-wallet-gems");
  const dialogBody = document.querySelector("#dialog-body");
  const dialogContent = document.querySelector("#dialog-content");
  const chatContent = document.querySelector("#chat-content");
  const dialogClose = document.querySelector("#dialog-close");
  const dialogToast = document.querySelector("#dialog-toast");
  const hudCoinsValue = document.querySelector("#hud-coins-value");
  const gameplayCoins = document.querySelector("#gameplay-coins-value");
  const hudGemsValue = document.querySelector("#hud-gems-value");
  const hudProfileLevel = document.querySelector("#hud-profile-level");
  const mailButton = document.querySelector(".mail");
  const mailCountBadge = mailButton?.querySelector(".mail-count");

  const defaultState = {
    coins: 24580,
    gems: 980,
    nickname: "",
    level: 1,
    xp: 0,
    progressVersion: 1,
    stats: { matches: 0, wins: 0, totalPops: 0, bestRank: null },
    items: {},
    levelRewardThrough: 1,
    claimedEvents: [],
    claimedMissions: [],
    claimedRewards: [1, 2],
    claimedMail: [],
    readMail: ["season-kickoff"],
    claimedFreeCoinPack: false,
    claimedFreeGemPack: false,
    ownedBoards: ["classic_rush", "color_hunt", "memory_rush"],
    ownedPopColors: ["lime_mint"],
    equippedPopColor: "lime_mint",
    ownedBgs: ["candy_village"],
    equippedBg: "candy_village",
    claimedBundles: [],
  };

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (!saved || typeof saved !== "object")
        return structuredClone(defaultState);
      const xp = Number.isFinite(saved.xp) && saved.xp >= 0 ? Math.trunc(saved.xp) : 0;
      const migratedXp = saved.progressVersion === 1 ? xp : Math.max(xp, popRules.xpForPlayerLevel(saved.level));
      const level = popRules.getPlayerLevel(migratedXp).level;
      return {
        ...structuredClone(defaultState),
        ...saved,
        xp: migratedXp,
        level,
        progressVersion: 1,
        levelRewardThrough: saved.progressVersion === 1 ? (saved.levelRewardThrough ?? level) : level,
        stats: { ...defaultState.stats, ...(saved.stats ?? {}) },
        items: { ...defaultState.items, ...(saved.items ?? {}) },
        ownedBoards:
          Array.isArray(saved.ownedBoards) && saved.ownedBoards.length
            ? saved.ownedBoards
            : [...defaultState.ownedBoards],
        ownedPopColors:
          Array.isArray(saved.ownedPopColors) && saved.ownedPopColors.length
            ? saved.ownedPopColors
            : [...defaultState.ownedPopColors],
        equippedPopColor:
          saved.equippedPopColor || defaultState.equippedPopColor,
        ownedBgs:
          Array.isArray(saved.ownedBgs) && saved.ownedBgs.length
            ? saved.ownedBgs
            : [...defaultState.ownedBgs],
        equippedBg: saved.equippedBg || defaultState.equippedBg,
        claimedBundles: Array.isArray(saved.claimedBundles)
          ? saved.claimedBundles
          : [],
      };
    } catch {
      return structuredClone(defaultState);
    }
  }

  function applyPopColor(colorId) {
    document.documentElement.dataset.popColor = colorId || "lime_mint";
  }

  function applyGameBg(bgId) {
    document.documentElement.dataset.gameBg = bgId || "candy_village";
  }

  let state = loadState();
  applyPopColor(state.equippedPopColor);
  applyGameBg(state.equippedBg);
  saveState();
  let activePanel = null;
  let liveEventsData = null;
  let liveEventsRequest = null;
  let activeTab = {};
  let toastTimer = null;
  let justClaimedReward = false;
  let justBoughtShopItem = false;
  let supportsDisplayTransition;

  function saveState() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {}
  }

  function fmt(num) {
    return Number(num).toLocaleString("en-US");
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function imgEl(src, className = "", alt = "") {
    const node = document.createElement("img");
    node.src = src;
    node.alt = alt;
    if (className) node.className = className;
    return node;
  }

  function badgeEl(text, tone = "") {
    return el(
      "span",
      tone ? `panel-badge panel-badge--${tone}` : "panel-badge",
      text,
    );
  }

  function chipEl(iconSrc, text) {
    const chip = el("span", "panel-chip");
    if (iconSrc) chip.append(imgEl(iconSrc));
    chip.append(el("span", "", text));
    return chip;
  }

  function actionBtn(label, variant, onClick, iconSrc = "") {
    const btn = el("button", `panel-btn panel-btn--${variant}`);
    btn.type = "button";
    if (iconSrc) btn.append(imgEl(iconSrc));
    btn.append(el("span", "", label));
    if (variant === "claimed") btn.disabled = true;
    else btn.addEventListener("click", onClick);
    return btn;
  }

  function showToast(message, tone = "ok") {
    clearTimeout(toastTimer);
    dialogToast.textContent = message;
    dialogToast.dataset.tone = tone;
    dialogToast.hidden = false;
    toastTimer = setTimeout(() => {
      dialogToast.hidden = true;
    }, 2200);
  }

  function activePlayer() {
    const seat =
      typeof selectedCharacterSeat === "function" ? selectedCharacterSeat() : 0;
    return popRules.players[seat] ?? popRules.players[0];
  }

  function playerDisplayName() {
    return state.nickname.trim() || activePlayer().name;
  }

  function mailMessages() {
    return [
      ...(state.rankInbox ?? []).map((item) => ({
        id: item.id, title: item.title, from: "Ranked Season", time: "Season ended",
        body: "A reward for your highest tier in the season.",
        reward: { coins: item.coins, gems: item.gems, label: `+${item.coins} Coins · +${item.gems} Gems` },
      })),
      {
        id: "welcome-gift",
        title: "Welcome to Pop Rush!",
        from: "Pop Rush Team",
        time: "Today",
        body: "Enter Quick Match or Private Room with Luna, Rex, Momo, and Kiko. Claim your starter gift below!",
        reward: { coins: 500, gems: 20, label: "+500 Coins & +20 Gems" },
      },
      {
        id: "new-boards",
        title: "New Boards Arrived!",
        from: "Workshop",
        time: "2h ago",
        body: "Rainbow Pop, Star Pop, and Paw Pop are now ready in the Board menu. Try them in gameplay!",
        reward: { items: { blast: 2 }, label: "Blast ×2" },
      },
      {
        id: "season-kickoff",
        title: "Season 1 Ranking Kickoff",
        from: "Arena Host",
        time: "Yesterday",
        body: "Ranked duels unlock at Player Lv.15. Your highest tier determines the season reward.",
        reward: null,
      },
    ];
  }

  function unreadMailCount() {
    return mailMessages().filter((item) => {
      if (item.reward) return !state.claimedMail.includes(item.id);
      return !state.readMail.includes(item.id);
    }).length;
  }

  function syncHud() {
    document.documentElement.dataset.avatarFrame = state.cosmetics?.avatarFrame ?? "";
    if (gameplayCoins) gameplayCoins.textContent = fmt(state.coins);
    if (hudCoinsValue) {
      hudCoinsValue.textContent = fmt(state.coins);
      hudCoinsValue.parentElement?.setAttribute(
        "aria-label",
        `Coins, ${fmt(state.coins)}`,
      );
    }
    if (hudGemsValue) {
      hudGemsValue.textContent = fmt(state.gems);
      hudGemsValue.parentElement?.setAttribute(
        "aria-label",
        `Gems, ${fmt(state.gems)}`,
      );
    }
    if (hudProfileLevel) {
      hudProfileLevel.textContent = `Lv.${state.level}`;
      hudProfileLevel.parentElement?.setAttribute(
        "aria-label",
        `${playerDisplayName()}, level ${state.level}`,
      );
    }
    if (dialogWalletCoins) dialogWalletCoins.textContent = fmt(state.coins);
    if (dialogWalletGems) dialogWalletGems.textContent = fmt(state.gems);

    const unread = unreadMailCount();
    if (mailButton && mailCountBadge) {
      mailButton.classList.toggle("is-read", unread === 0);
      mailCountBadge.hidden = unread === 0;
      mailCountBadge.textContent = String(unread);
      mailButton.setAttribute(
        "aria-label",
        unread > 0
          ? `Mail, ${unread} unread ${unread === 1 ? "message" : "messages"}`
          : "Mail",
      );
    }
  }

  function awardReward(reward) {
    if (reward.coins) state.coins += reward.coins;
    if (reward.gems) state.gems += reward.gems;
    if (reward.xp) {
      state.xp += reward.xp;
      state.level = popRules.getPlayerLevel(state.xp).level;
      for (const milestone of popRules.playerLevels) {
        if (milestone.level <= state.levelRewardThrough || milestone.level > state.level) continue;
        state.coins += milestone.coins ?? 0;
        state.gems += milestone.gems ?? 0;
        if (milestone.skill) state.items[milestone.skill] = (state.items[milestone.skill] ?? 0) + 1;
      }
      state.levelRewardThrough = Math.max(state.levelRewardThrough, state.level);
    }
    if (reward.finish) {
      state.rewardFinishes ??= [];
      if (!state.rewardFinishes.includes(reward.finish)) state.rewardFinishes.push(reward.finish);
    }
    if (reward.sound) {
      state.rewardSounds ??= [];
      if (!state.rewardSounds.includes(reward.sound)) state.rewardSounds.push(reward.sound);
    }
    if (reward.frame) {
      state.rewardFrames ??= [];
      if (!state.rewardFrames.includes(reward.frame)) state.rewardFrames.push(reward.frame);
    }
    if (reward.title) {
      state.rewardTitles ??= [];
      if (!state.rewardTitles.includes(reward.title)) state.rewardTitles.push(reward.title);
    }
    if (reward.items) {
      for (const [key, qty] of Object.entries(reward.items)) {
        state.items[key] = (state.items[key] ?? 0) + qty;
      }
    }
    saveState();
    syncHud();
  }

  function spendCoins(amount) {
    if (state.coins < amount) return false;
    state.coins -= amount;
    saveState();
    syncHud();
    return true;
  }

  function settleMatchSkillCoins(matchId, coinsSpent, topUp) {
    const ledger = state.matchSkillLedger ?? {};
    const previous = ledger[matchId] ?? (state.matchSkillSpend?.matchId === matchId ? state.matchSkillSpend.amount : 0);
    if (!(coinsSpent > previous)) return false;
    if (topUp && state.gems >= 5) {
      state.gems -= 5;
      state.coins += 250;
    }
    state.coins = Math.max(0, state.coins - (coinsSpent - previous));
    delete ledger[matchId];
    state.matchSkillLedger = Object.fromEntries([...Object.entries(ledger).slice(-19), [matchId, coinsSpent]]);
    saveState();
    syncHud();
    return true;
  }

  function recordModeResult(mode, result, reward, matchId) {
    if (!Number.isFinite(result.elapsed) || result.elapsed < 0) return;
    if (matchId) {
      if ((state.recordedMatches ?? []).includes(matchId)) return;
      state.recordedMatches = [...(state.recordedMatches ?? []).slice(-19), matchId];
    }
    updateMissionProgress(mode, result, Boolean(matchId));
    state.modeRecords ??= {};
    const previous = state.modeRecords[mode];
    const better = !previous || result.score > previous.score ||
      (result.score === previous.score && (result.level > previous.level ||
        (result.level === previous.level && result.elapsed < previous.elapsed)));
    const best = better ? result : previous;
    state.modeRecords[mode] = {
      ...best,
      highestLevel: Math.max(previous?.highestLevel ?? 0, result.completed ? result.level : 0),
      bestStreak: Math.max(previous?.bestStreak ?? 0, result.streak),
    };
    if (mode === "sequence" && result.completed) {
      const stars = state.sequenceStars ??= {};
      const speedrun = 5000 * popRules.getGameLevel(mode, result.level).sessions;
      const earned = result.mistakes === 0 ? (result.elapsed < speedrun ? 3 : 2) : 1;
      stars[result.level] = Math.max(stars[result.level] ?? 0, earned);
    }
    if (mode === "frenzy") state.feverBoxes = (state.feverBoxes ?? 0) + (result.feverBoxes ?? 0);
    awardReward(reward);
  }

  function sequenceStars() {
    return Object.values(state.sequenceStars ?? {}).reduce((total, value) => total + value, 0);
  }

  function exchangeCoins(gems, coins) {
    if (state.gems < gems) return false;
    state.gems -= gems;
    awardReward({ coins });
    return true;
  }

  function matchBoosters() {
    const booster = state.armedBooster;
    return {
      booster: (state.boosterTickets?.[booster] ?? 0) > 0 ? booster : null,
      xpBoostUntil: state.xpBoostUntil ?? 0,
    };
  }

  function consumeMatchBooster(id, matchId) {
    if (!id || (state.boosterTickets?.[id] ?? 0) < 1) return;
    if (matchId) {
      if ((state.spentBoosterMatches ?? []).includes(matchId)) return;
      state.spentBoosterMatches = [...(state.spentBoosterMatches ?? []).slice(-19), matchId];
    }
    state.boosterTickets[id] -= 1;
    if (state.armedBooster === id) state.armedBooster = null;
    saveState();
  }

  function deckSelect(label, items, value, onChange) {
    const field = el("label", "deck-setting", label);
    const select = el("select", "deck-select");
    for (const [id, name] of items) {
      const option = el("option", "", name);
      option.value = id;
      select.append(option);
    }
    select.value = value;
    select.addEventListener("change", () => onChange(select.value));
    field.append(select);
    return field;
  }

  function deckChoices(ids, allowAttack, onChange, forBot = false) {
    const list = el("div", "deck-skill-list");
    for (const [id, skill] of Object.entries(popRules.skillDefinitions)) {
      const label = el("label", "deck-skill");
      const input = el("input");
      input.type = "checkbox";
      input.checked = ids.includes(id);
      const playerLevel = forBot ? 20 : state.level;
      const needed = popRules.skillUnlockLevel(id);
      const versusOnly = !allowAttack && skill.kind === "attack";
      const locked = versusOnly || playerLevel < needed;
      input.disabled = locked || (!input.checked && ids.length >= (forBot ? 3 : popRules.playerSkillSlots(state.xp)));
      input.addEventListener("change", () => {
        onChange(input.checked ? [...ids, id] : ids.filter((selected) => selected !== id));
        renderActivePanel();
      });
      label.append(input, el("span", "", `${skill.symbol} ${skill.name}`),
        el("small", "", versusOnly ? "Versus only" : locked ? `Lv.${needed}` : `${skill.coins}¢`));
      list.append(label);
    }
    return list;
  }

  function renderDeck() {
    const isPractice = location.hash === "#room";
    const isOnline = ["#private-room", "#online-room", "#ranked-room"].includes(location.hash);
    const inLobby = isPractice || isOnline;
    const useVersusDeck = inLobby && (!isPractice || modeConfig.botCount > 0);
    const ids = getDeckSkills(useVersusDeck);
    const cost = ids.reduce((sum, id) => sum + popRules.skillDefinitions[id].coins, 0);
    const root = el("div", "deck-panel");
    if (isPractice) {
      root.append(deckSelect("Opponents", [[0, "Solo"], [1, "1 bot"], [2, "2 bots"], [3, "3 bots"]], modeConfig.botCount, (value) => {
        modeConfig.botCount = Number(value);
        saveModeConfig();
        renderQuickRoom(false);
        renderActivePanel();
      }));
    }
    root.append(el("h3", "panel-title", `Skills · ${ids.length}/${popRules.playerSkillSlots(state.xp)}`),
      el("p", "panel-desc", `One rotation costs ${cost} Coins`),
      deckChoices(ids, useVersusDeck, (next) => {
        setDeckSkills(next, useVersusDeck);
        if (isOnline) submitOnlineReady(false);
      }));
    if (useVersusDeck) {
      root.append(actionBtn("Save as default lobby setting", "blue", () => {
        setDeckSkills(ids, true, true);
        showToast("Lobby setting saved.");
      }));
    }
    if (inLobby && state.coins < cost) {
      root.append(actionBtn("Exchange 10 Gems for 500 Coins", "gold", () => {
        if (!exchangeCoins(10, 500)) return showToast("Not enough Gems.", "warn");
        if (isOnline) submitOnlineReady(false);
        renderActivePanel();
      }));
    }
    const tickets = Object.entries(popRules.boosters).filter(([id]) => id !== "xp_hour" && (state.boosterTickets?.[id] ?? 0) > 0);
    if (tickets.length) {
      root.append(deckSelect("Next match ticket", [["", "None"], ...tickets.map(([id, data]) =>
        [id, `${data.name} ×${state.boosterTickets[id]}`])], state.armedBooster ?? "", (id) => {
        state.armedBooster = id || null;
        saveState();
        if (isOnline) submitOnlineReady(false);
      }));
    }
    if (!inLobby) {
      root.append(deckSelect("POP IT! controls", [["tap", "Tap"], ["swipe", "Swipe / pinch"], ["motion", "Shake / tilt"]], modeConfig.resetControl, (value) => {
        modeConfig.resetControl = value;
        saveModeConfig();
      }));
    }
    for (let index = 0; isPractice && index < modeConfig.botCount; index += 1) {
      const config = modeConfig.botSettings[index] ??= { difficulty: "Medium" };
      const card = el("fieldset", "deck-bot");
      card.append(el("legend", "", `Bot ${index + 1}`),
        deckSelect("Loadout", [["auto", "Auto"], ["custom", "Custom"]], config.skills ? "custom" : "auto", (value) => {
          config.skills = value === "custom" ? [...popRules.defaultLoadout] : null;
          saveModeConfig();
          renderActivePanel();
        }));
      if (config.skills) card.append(deckChoices(config.skills, true, (next) => {
        config.skills = next;
        saveModeConfig();
      }, true));
      root.append(card);
    }
    dialogContent.append(root);
  }

  function goToRoute(hash) {
    close();
    if (typeof navigate === "function") navigate(hash);
    else location.hash = hash;
  }

  function canTransitionDisplay() {
    if (supportsDisplayTransition !== undefined)
      return supportsDisplayTransition;
    if (
      !window.CSS?.supports?.("transition-behavior", "allow-discrete") ||
      !document.body
    ) {
      return false;
    }
    const probe = document.createElement("div");
    probe.style.cssText =
      "transition: display 1s allow-discrete !important; display: block;";
    document.body.appendChild(probe);
    getComputedStyle(probe).display;
    probe.style.display = "none";
    supportsDisplayTransition = getComputedStyle(probe).display === "block";
    probe.remove();
    return supportsDisplayTransition;
  }

  function supportsTopLayerExit() {
    return window.CSS?.supports?.("overlay", "auto") && canTransitionDisplay();
  }

  async function closeTopLayer(targetDialog) {
    if (!targetDialog.open || targetDialog.hasAttribute("data-closing")) return;
    if (!supportsTopLayerExit()) {
      targetDialog.setAttribute("data-closing", "");
      const animations = targetDialog.getAnimations({ subtree: true });
      if (animations.length > 0) {
        await Promise.race([
          Promise.allSettled(animations.map((a) => a.finished)),
          new Promise((r) => setTimeout(r, 400)),
        ]);
      }
      if (!targetDialog.hasAttribute("data-closing")) return;
      targetDialog.removeAttribute("data-closing");
    }
    targetDialog.close();
  }

  if (!("closedBy" in HTMLDialogElement.prototype)) {
    const outside = (e) => {
      const r = (dialogShell || dialog).getBoundingClientRect();
      return (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      );
    };
    let pressedOutside = false;
    dialog.addEventListener("pointerdown", (e) => {
      pressedOutside = outside(e);
    });
    dialog.addEventListener("pointerup", (e) => {
      if (pressedOutside && outside(e)) closeTopLayer(dialog);
    });
  }

  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeTopLayer(dialog);
  });

  dialog.addEventListener("close", () => {
    clearTimeout(toastTimer);
    dialogToast.hidden = true;
    dialog.removeAttribute("data-closing");
  });

  dialogClose.addEventListener("click", () => closeTopLayer(dialog));

  dialogWallet.querySelectorAll("[data-dialog-nav]").forEach((btn) => {
    btn.addEventListener("click", () => open(btn.dataset.dialogNav));
  });

  function renderTabs(panelId, items) {
    const current = activeTab[panelId] ?? items[0].id;
    activeTab[panelId] = current;
    const bar = el("div", "panel-tabs");
    bar.role = "tablist";
    for (const tab of items) {
      const btn = el("button", "panel-tab", tab.label);
      btn.type = "button";
      btn.role = "tab";
      btn.setAttribute("aria-selected", String(tab.id === current));
      btn.addEventListener("click", () => {
        activeTab[panelId] = tab.id;
        renderActivePanel();
      });
      bar.append(btn);
    }
    return [bar, current];
  }

  function attachSpatialTilt(card) {
    if (!window.matchMedia?.("(hover: hover) and (pointer: fine)").matches)
      return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const resetTilt = () => {
      card.style.setProperty("--ev-rx", "0deg");
      card.style.setProperty("--ev-ry", "0deg");
      card.style.removeProperty("will-change");
    };

    card.addEventListener("pointerenter", () => {
      card.style.willChange = "transform";
    });

    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const nx = Math.max(
        -1,
        Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1),
      );
      const ny = Math.max(
        -1,
        Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1),
      );
      card.style.setProperty("--ev-rx", `${(-ny * 4.5).toFixed(2)}deg`);
      card.style.setProperty("--ev-ry", `${(nx * 5.5).toFixed(2)}deg`);
      card.style.setProperty("--ev-gx", `${Math.round((nx + 1) * 50)}%`);
      card.style.setProperty("--ev-gy", `${Math.round((ny + 1) * 50)}%`);
    });

    card.addEventListener("pointerleave", resetTilt);
    card.addEventListener("pointercancel", resetTilt);
  }

  function refreshLiveEvents() {
    if (liveEventsRequest) return liveEventsRequest;
    liveEventsRequest = multiplayer.liveEvents().then((data) => {
      if (!data) return;
      liveEventsData = data;
      state.ranked = { ...data.ranked, standings: undefined, inbox: undefined };
      state.rankInbox = data.ranked.inbox;
      saveState();
      if (dialog.open && ["events", "mail", "missions", "ranking"].includes(activePanel)) renderActivePanel();
      else syncHud();
    }).finally(() => { liveEventsRequest = null; });
    return liveEventsRequest;
  }

  function themeWallet(now = Date.now()) {
    const period = popRules.eventPeriod(now, 14);
    if (state.themeWallet?.id !== period.id) state.themeWallet = { id: period.id, tokens: 0 };
    return { ...period, tokens: state.themeWallet.tokens };
  }

  function recordThemeTokens(sessions) {
    themeWallet();
    state.themeWallet.tokens += sessions;
  }

  function eventEndsAt(value) {
    return new Date(value).toLocaleDateString("en-GB", { dateStyle: "medium", timeZone: "UTC" });
  }

  function renderEvents() {
    const root = el("div", "event-popup");
    const wallet = el("div", "event-art event-art--wallet");
    wallet.append(imgEl("pages/events/popup/wallet.png"));
    for (const currency of ["coins", "gems"]) {
      const amount = fmt(state[currency]);
      const button = el("button", `event-wallet-button event-wallet-button--${currency}`);
      button.type = "button";
      button.setAttribute("aria-label", `Add ${currency}, balance ${amount}`);
      button.append(el("strong", "event-wallet-amount", amount));
      button.addEventListener("click", () => open(currency));
      wallet.append(button);
    }
    const banner = document.querySelector("#event-banner-template").content.cloneNode(true);
    banner.querySelector(".event-festival-badge").textContent = "Live events";
    banner.querySelector(".event-festival-copy h3").textContent = "Pop Rush Events";
    banner.querySelector(".event-festival-description").textContent = "Join the community and collect event rewards.";
    root.append(wallet, banner);

    const weekend = el("div", "panel-card");
    weekend.append(el("h4", "panel-title", "Weekend Frenzy"),
      el("p", "panel-desc", "Saturday and Sunday (UTC) · online matches and Frenzy earn 2× Coins, 1.5× XP and 20% shorter skill cooldowns."),
      badgeEl(popRules.weekendBonus("frenzy", false, Date.now()) ? "Active" : "Starts Saturday", "purple"));
    root.append(weekend);

    const community = el("div", "panel-card");
    community.append(el("h4", "panel-title", "Global Pop Milestone"));
    const current = liveEventsData?.milestone;
    if (!current) {
      community.append(el("p", "panel-desc", "Connect to the game server to see community progress."));
    } else {
      community.append(el("p", "panel-desc", `${fmt(current.total)} / 10,000,000 pops · Your contribution ${fmt(current.contribution)} · Ends ${eventEndsAt(current.endsAt)}`));
      const rows = [
        [2500000, 0, "300 Coins", { coins: 300 }],
        [5000000, 0, "Skill Pack", { items: { shield: 1, blast: 1, double: 1 } }],
        [10000000, 500, "Milestone Celebration finish + 25 Gems", { finish: "global", gems: 25 }],
      ];
      for (const [threshold, contribution, label, reward] of rows) {
        const id = `global:${current.id}:${threshold}`;
        const row = el("div", "panel-row");
        row.append(el("p", "panel-desc", `${fmt(threshold)} pops · ${label}${contribution ? " · 500 personal pops" : ""}`));
        const claimed = state.claimedEvents.includes(id);
        const eligible = current.total >= threshold && current.contribution >= contribution && Date.now() < current.endsAt;
        const claim = actionBtn(claimed ? "Claimed" : "Claim", "gold", () => {
          if (Date.now() >= current.endsAt || state.claimedEvents.includes(id)) return;
          state.claimedEvents.push(id);
          awardReward(reward);
          renderActivePanel();
        });
        claim.disabled = claimed || !eligible;
        row.append(claim);
        community.append(row);
      }
    }
    root.append(community);

    const ranked = el("div", "panel-card");
    ranked.append(el("h4", "panel-title", "Ranked Season"),
      el("p", "panel-desc", state.ranked ? `${state.ranked.tier} · ${state.ranked.points} RP · Ends ${eventEndsAt(state.ranked.endsAt)}` : "30-day season · unlock at Player Lv.15"),
      actionBtn("View standings", "blue", () => open("ranking")));
    root.append(ranked);

    const theme = el("div", "panel-card");
    const period = themeWallet();
    theme.append(el("h4", "panel-title", "Theme Showcase"),
      el("p", "panel-desc", `${period.tokens} Event Tokens · Earn 1 per completed session · Ends ${eventEndsAt(period.endsAt)}`));
    const offers = [
      ["cyberpunk", 20, "Cyberpunk", { finish: "cyberpunk" }],
      ["pastel", 20, "Pastel Candy", { finish: "pastel" }],
      ["arcade", 20, "Retro Arcade", { finish: "arcade" }],
      ["retro", 15, "8-Bit Retro SFX", { sound: "retro" }],
    ];
    for (const [id, cost, label, reward] of offers) {
      const key = `theme:${id}`;
      const row = el("div", "panel-row");
      row.append(el("span", "panel-desc", label));
      const owned = state.claimedEvents.includes(key);
      const buy = actionBtn(owned ? "Owned" : `${cost} Tokens`, "gold", () => {
        if (state.claimedEvents.includes(key) || themeWallet().tokens < cost) return;
        state.themeWallet.tokens -= cost;
        state.claimedEvents.push(key);
        awardReward(reward);
        renderActivePanel();
      });
      buy.disabled = owned || period.tokens < cost;
      row.append(buy);
      theme.append(row);
    }
    root.append(theme);
    dialogContent.append(root);
  }

  const finishLabels = { royal: "Royal Crystal", cyberpunk: "Cyberpunk", pastel: "Pastel Candy", arcade: "Retro Arcade", global: "Milestone Celebration" };

  function missionWindow(now = Date.now()) {
    const day = new Date(now).toISOString().slice(0, 10);
    const week = new Date(popRules.weekStart(now)).toISOString().slice(0, 10);
    const progress = state.missionProgress ??= {};
    if (progress.daily?.key !== day) progress.daily = { key: day };
    if (progress.weekly?.key !== week) progress.weekly = { key: week };
    return progress;
  }

  function updateMissionProgress(mode, result, online) {
    const { daily, weekly } = missionWindow();
    const add = (bucket, key, value) => { bucket[key] = (bucket[key] ?? 0) + (value ?? 0); };
    add(daily, "pops", result.totalPops);
    add(daily, "skills", result.skillUses);
    add(daily, "online", Number(online));
    add(weekly, "wins", Number(online && result.won));
    add(weekly, "frenzy", Number(mode === "frenzy" && result.streak >= 50));
    add(weekly, "perfect", result.perfectSessions);
    for (const kind of ["attack", "defend", "power"]) add(weekly, kind, result.skillCategories?.[kind]);
    add(state.stats, "matches", 1);
    add(state.stats, "wins", Number(result.won));
    add(state.stats, "totalPops", result.totalPops);
    state.stats.bestRank = Math.min(state.stats.bestRank ?? Infinity, result.rank || 4);
    state.achievements ??= {};
    if (mode === "memory" && result.completed && result.level === 15 && !result.penalties) {
      state.achievements.memory = true;
    }
    recordThemeTokens(result.completedSessions ?? 0);
  }

  function missionRows(tab) {
    const { daily, weekly } = missionWindow();
    const dailyClaims = state.claimedMissions.filter((key) => key.startsWith(`${daily.key}:DLY_`) && !key.endsWith("DLY_05")).length;
    const boardCount = new Set([...state.ownedBoards, ...(state.rewardFinishes ?? []),
      ...(state.level >= 10 ? ["neon"] : []), ...(state.level >= 20 ? ["golden"] : []),
      ...(sequenceStars() >= 50 ? ["piano"] : []), ...(sequenceStars() >= 150 ? ["cyber"] : []),
      ...((state.modeRecords?.frenzy?.bestStreak ?? 0) >= 200 ? ["magma"] : [])]).size;
    const all = {
      daily: [
        ["DLY_01", "Daily Login", "Open Pop Rush today", 1, 1, { coins: 100 }, "100 Coins", "#home"],
        ["DLY_02", "Target Popper", "Pop target bubbles in any mode", daily.pops, 150, { coins: 150, xp: 50 }, "150 Coins + 50 XP", "#room"],
        ["DLY_03", "Online Challenger", "Finish online multiplayer matches", daily.online, 2, { coins: 200, xp: 80 }, "200 Coins + 80 XP", "online"],
        ["DLY_04", "Skill User", "Activate skills during matches", daily.skills, 5, { coins: 150, xp: 50 }, "150 Coins + 50 XP", "#room"],
        ["DLY_05", "Daily Sweep", "Claim the other four daily missions", dailyClaims, 4, { gems: 5, xp: 100 }, "5 Gems + 100 XP", "#home"],
      ],
      weekly: [
        ["WKL_01", "Arena Winner", "Win online multiplayer matches", weekly.wins, 10, { coins: 1000, xp: 300 }, "1,000 Coins + 300 XP", "online"],
        ["WKL_02", "Amazing Streak", "Reach 50 streak in three Frenzy matches", weekly.frenzy, 3, { gems: 15, xp: 250 }, "15 Gems + 250 XP", "#room"],
        ["WKL_03", "Perfect Board", "Finish sessions without a mistake", weekly.perfect, 15, { coins: 800, xp: 200 }, "800 Coins + 200 XP", "#room"],
        ["WKL_04", "Skill Rotation", "Use each of the three skill categories ten times", Math.min(weekly.attack ?? 0, weekly.defend ?? 0, weekly.power ?? 0), 10,
          () => {
            const ids = Object.keys(popRules.skillDefinitions);
            return { items: { [ids[Math.floor(Math.random() * ids.length)]]: 1 } };
          }, "Random Skill Card", "#room"],
      ],
      achievements: [
        ["ACH_FRENZY", "Frenzy God", "Reach 200 Frenzy streak", state.modeRecords?.frenzy?.bestStreak, 200, { title: "Untouchable", gems: 50 }, "Untouchable + 50 Gems", "#room"],
        ["ACH_MEMORY", "Photographic Mind", "Clear Memory Lv.15 without losing a life", Number(Boolean(state.achievements?.memory)), 1,
          { frame: "brainiac" }, "Brainiac frame", "#room"],
        ["ACH_ARENA", "Arena Champion", "Reach Diamond in Ranked", Number(Boolean(state.ranked?.diamond)), 1,
          { finish: "royal" }, "Royal Crystal finish", "online"],
        ["ACH_COLLECT", "Collector", "Own ten board themes", boardCount, 10, { gems: 100 }, "100 Gems", "#board"],
      ],
    };
    const prefix = tab === "daily" ? daily.key : tab === "weekly" ? weekly.key : "permanent";
    return all[tab].map(([id, title, desc, cur, max, reward, rewardLabel, route], index) => ({
      id: `${prefix}:${id}`, title, desc, cur: Math.min(cur ?? 0, max), max, reward, rewardLabel, route,
      art: `pages/missions/art-${["quick-match", "board-stylist", "clean-sweeper"][index % 3]}.png`,
      rewardIcon: `pages/home/hud/${reward.gems ? "gem" : "coin"}.png`,
    }));
  }

  function renderMissions() {
    const tabItems = [
      { id: "daily", label: "Daily" },
      { id: "weekly", label: "Weekly" },
      { id: "achievements", label: "Achievements" },
    ];
    const tab = activeTab.missions ?? "daily";
    activeTab.missions = tab;

    const root = el("div", "ms-root");

    /* 1. Daily / Weekly Segmented Tabs */
    const tabBar = el("div", "ms-tabs");
    tabBar.role = "tablist";
    for (const item of tabItems) {
      const btn = el("button", "ms-tab", item.label);
      btn.type = "button";
      btn.role = "tab";
      btn.setAttribute("aria-selected", String(item.id === tab));
      btn.addEventListener("click", () => {
        activeTab.missions = item.id;
        renderActivePanel();
      });
      tabBar.append(btn);
    }

    const rows = missionRows(tab);
    const doneCount = rows.filter((m) =>
      state.claimedMissions.includes(m.id),
    ).length;
    const summaryPct =
      rows.length > 0 ? Math.round((doneCount / rows.length) * 100) : 0;

    /* 2. Summary Progress Card */
    const summaryCard = el("section", "ms-summary");
    summaryCard.append(
      imgEl("pages/missions/icon-calendar.png", "ms-summary-icon"),
    );
    const summaryCopy = el("div", "ms-summary-copy");
    const summaryMeta = el("div", "ms-summary-meta");
    summaryMeta.append(
      el("span", "", `${tabItems.find((item) => item.id === tab).label} Progress`),
      el("strong", "", `${doneCount}/${rows.length} Claimed`),
    );
    const summaryTrack = el("div", "ms-progress-track");
    const summaryFill = el("span", "ms-progress-fill");
    summaryFill.style.width = `${summaryPct}%`;
    summaryTrack.append(summaryFill);
    summaryCopy.append(summaryMeta, summaryTrack);
    summaryCard.append(summaryCopy);

    /* 3. Mission Cards */
    const list = el("div", "ms-list");
    for (const m of rows) {
      const claimed = state.claimedMissions.includes(m.id);
      const ready = m.cur >= m.max;
      const cardState = claimed ? "claimed" : ready ? "ready" : "progress";
      const card = el("article", `ms-card ms-card--${cardState}`);
      card.append(
        createCloudLayer("ms-card-clouds"),
        el("span", "ms-spark ms-spark--a"),
        el("span", "ms-spark ms-spark--b"),
      );

      const top = el("div", "ms-card-top");
      top.append(imgEl(m.art, "ms-art", m.title));

      const copy = el("div", "ms-copy");
      const rewardChip = el("span", "ms-reward-chip");
      rewardChip.append(imgEl(m.rewardIcon), el("span", "", m.rewardLabel));
      copy.append(
        el("h4", "ms-title", m.title),
        el("p", "ms-desc", m.desc),
        rewardChip,
      );

      let cta;
      if (claimed) {
        cta = el("button", "ms-btn ms-btn--claimed", "Claimed");
        cta.type = "button";
        cta.disabled = true;
      } else if (ready) {
        cta = el("button", "ms-btn ms-btn--claim", "Claim");
        cta.type = "button";
        cta.addEventListener("click", () => {
          const current = missionRows(tab).find((row) => row.id === m.id);
          if (!current || current.cur < current.max || state.claimedMissions.includes(m.id)) return renderActivePanel();
          state.claimedMissions.push(m.id);
          awardReward(typeof m.reward === "function" ? m.reward() : m.reward);
          showToast(`Mission claimed: ${m.rewardLabel}!`);
          renderActivePanel();
        });
      } else {
        cta = el("button", "ms-btn ms-btn--go", "Go");
        cta.type = "button";
        cta.addEventListener("click", () => {
          if (m.route === "online") {
            close();
            openOnlineDialog();
          } else goToRoute(m.route);
        });
      }

      top.append(copy, cta);

      const progWrap = el("div", "ms-progress-wrap");
      const progMeta = el("div", "ms-progress-meta");
      progMeta.append(
        el("span", "", "Progress"),
        el("strong", "", `${m.cur}/${m.max}`),
      );
      const progTrack = el("div", "ms-progress-track");
      const progFill = el("span", "ms-progress-fill");
      const pct =
        m.max > 0
          ? Math.max(0, Math.min(100, Math.round((m.cur / m.max) * 100)))
          : 0;
      progFill.style.width = `${pct}%`;
      progTrack.append(progFill);
      progWrap.append(progMeta, progTrack);

      card.append(top, progWrap);
      list.append(card);
    }

    root.append(tabBar, summaryCard, list);
    dialogContent.append(root);
  }

  const shopBoardsCatalog = [
    {
      id: "classic_rush",
      name: "Aqua Wave",
      sizeLabel: "4 × 4",
      art: "pages/gameplay/board-aqua-wave.png",
      theme: "aqua",
      currency: "coins",
      cost: 0,
    },
    {
      id: "color_hunt",
      name: "Sapphire Blue",
      sizeLabel: "4 × 4",
      art: "pages/gameplay/board-sapphire-blue.png",
      theme: "blue",
      currency: "coins",
      cost: 0,
    },
    {
      id: "pink_stage",
      name: "Candy Pink",
      sizeLabel: "4 × 4",
      art: "pages/gameplay/board-candy-pink.png",
      theme: "pink",
      tag: "SWEET",
      currency: "coins",
      cost: 600,
    },
    {
      id: "rainbow_pop",
      name: "Rainbow Pop",
      sizeLabel: "4 × 4",
      art: "pages/gameplay/board-rainbow-pop.png",
      theme: "gold",
      tag: "POPULAR",
      currency: "coins",
      cost: 1200,
    },
    {
      id: "star_pop",
      name: "Star Pop",
      sizeLabel: "11 Bubbles",
      art: "pages/gameplay/board-star-pop.png",
      theme: "violet",
      tag: "STAR",
      currency: "gems",
      cost: 45,
    },
    {
      id: "paw_pop",
      name: "Paw Pop",
      sizeLabel: "5 Bubbles",
      art: "pages/gameplay/board-paw-pop.png",
      theme: "coral",
      tag: "CUTE!",
      currency: "gems",
      cost: 60,
    },
  ];

  const shopBundlesCatalog = [
    {
      id: "bundle_rainbow",
      name: "Rainbow Toy Box",
      desc: "Rainbow Pop Board + 1,500 Coins + Rush ×3",
      tag: "SAVE 40%",
      theme: "gold",
      cost: 65,
      arts: [
        "pages/rewards/day3-surprise-box.png",
        "pages/gameplay/board-rainbow-pop.png",
        "pages/home/hud/coin.png",
      ],
      chips: ["+1,500 Coins", "Rainbow Pop", "Rush ×3"],
      reward: { coins: 1500, items: { rush: 3 } },
      unlockBoard: "rainbow_pop",
    },
    {
      id: "bundle_royal",
      name: "Royal Treasure Pack",
      desc: "Star Pop Board + Royal Arena BG + 3,000 Coins",
      tag: "BEST VALUE",
      theme: "violet",
      cost: 110,
      arts: [
        "pages/rewards/day6-gem-crown.png",
        "pages/gameplay/board-star-pop.png",
        "pages/rewards/day1-coin-pouch.png",
      ],
      chips: ["+3,000 Coins", "Star Pop", "Royal Arena BG"],
      reward: { coins: 3000 },
      unlockBoard: "star_pop",
      unlockBg: "royal_arena",
    },
    {
      id: "bundle_paradise",
      name: "Mega Candy Paradise",
      desc: "Paw Pop Board + Cotton Sunset BG + 5,000 Coins",
      tag: "MEGA BOX",
      theme: "pink",
      cost: 150,
      arts: [
        "pages/home/icon/rewards.png",
        "pages/gameplay/board-paw-pop.png",
        "pages/rewards/day5-piggy-bank.png",
      ],
      chips: ["+5,000 Coins", "Paw Pop", "Cotton Sunset BG"],
      reward: { coins: 5000 },
      unlockBoard: "paw_pop",
      unlockBg: "cotton_sunset",
    },
  ];

  const shopBackgroundsCatalog = [
    {
      id: "candy_village",
      name: "Candy Village",
      desc: "Pastel Town",
      art: "pages/home/background/home.png",
      theme: "aqua",
      currency: "coins",
      cost: 0,
    },
    {
      id: "royal_arena",
      name: "Royal Arena",
      desc: "Magic Castle",
      art: "pages/Waiting_Room/background/waiting_room.png",
      theme: "violet",
      tag: "POPULAR",
      currency: "coins",
      cost: 700,
    },
    {
      id: "sunshine_castle",
      name: "Sunshine Sky",
      desc: "Golden Stage",
      art: "pages/character/stage.webp",
      theme: "gold",
      tag: "SUNNY",
      currency: "coins",
      cost: 900,
    },
    {
      id: "starlight_party",
      name: "Starlight Party",
      desc: "Confetti Glow",
      art: "pages/match_results/stage.webp",
      theme: "blue",
      tag: "PARTY",
      currency: "gems",
      cost: 35,
    },
    {
      id: "cotton_sunset",
      name: "Cotton Sunset",
      desc: "Candy Clouds",
      art: "pages/shop/bg-cotton-sunset.png",
      theme: "pink",
      tag: "SWEET",
      currency: "coins",
      cost: 1100,
    },
    {
      id: "aurora_kingdom",
      name: "Aurora Night",
      desc: "Neon Magic",
      art: "pages/shop/bg-aurora-kingdom.png",
      theme: "coral",
      tag: "EPIC",
      currency: "gems",
      cost: 50,
    },
  ];

  function renderShop() {
    let tab = activeTab.shop;
    if (!["board", "bundle", "background", "boosters"].includes(tab))
      tab = "board";
    activeTab.shop = tab;

    const root = el("div", "sh-root");

    /* 1. Chunky 3D 3-Tab Candy Bar (Board / Bundle / Background) */
    const tabItems = [
      {
        id: "board",
        label: "Board",
        icon: "pages/profile/icon-board-mini.png",
      },
      {
        id: "bundle",
        label: "Bundle",
        icon: "pages/rewards/icon-gift-top.png",
      },
      {
        id: "background",
        label: "Background",
        icon: "pages/missions/castle-cloud.png",
      },
      { id: "boosters", label: "Boosters", icon: "pages/profile/icon-star.png" },
    ];
    const tabBar = el("div", "sh-tabs");
    tabBar.role = "tablist";
    for (const item of tabItems) {
      const btn = el("button", "sh-tab");
      btn.type = "button";
      btn.role = "tab";
      btn.setAttribute("aria-selected", String(item.id === tab));
      const tabIcon = imgEl(item.icon, "sh-tab-icon");
      tabIcon.width = 48;
      tabIcon.height = 48;
      btn.append(tabIcon, el("span", "", item.label));
      btn.addEventListener("click", () => {
        activeTab.shop = item.id;
        renderActivePanel();
      });
      tabBar.append(btn);
    }

    if (tab === "boosters") {
      root.append(tabBar);
      for (const [id, item] of Object.entries(popRules.boosters)) {
        const card = el("div", "panel-card");
        const buy = actionBtn(`${item.cost} ${item.currency === "coins" ? "Coins" : "Gems"}`, "gold", () => {
          if (state[item.currency] < item.cost) return;
          state[item.currency] -= item.cost;
          state.boosterTickets ??= {};
          state.boosterTickets[id] = (state.boosterTickets[id] ?? 0) + 1;
          saveState();
          renderActivePanel();
          showToast(`${item.name} added to Inventory.`);
        });
        buy.disabled = state[item.currency] < item.cost;
        card.append(el("h4", "panel-title", item.name), el("p", "panel-desc", item.desc), buy);
        root.append(card);
      }
      dialogContent.append(root);
      return;
    }

    /* 2. 3D Spotlight Hero Showcase Banner */
    const currentBoardName =
      typeof equippedBoard !== "undefined"
        ? equippedBoard.name
        : "Sapphire Blue";
    const activeBg =
      shopBackgroundsCatalog.find((b) => b.id === state.equippedBg) ??
      shopBackgroundsCatalog[0];

    const heroMeta = {
      board: {
        title: "3D Pop Boards!",
        desc: "Unlock glossy 3D pop-it shapes & stand out!",
        featuredArt: "pages/gameplay/board-rainbow-pop.png",
        chipLabel: `Equipped: ${currentBoardName}`,
      },
      bundle: {
        title: "Super Gift Bundles!",
        desc: "Giant toy boxes packed with Coins, Boards & Worlds!",
        featuredArt: "pages/rewards/day3-surprise-box.png",
        chipLabel: `${state.claimedBundles.length}/${shopBundlesCatalog.length} Collected`,
      },
      background: {
        title: "Magic 3D Worlds!",
        desc: "Change your Home & Arena scenery right now!",
        featuredArt: activeBg.art,
        chipLabel: `World: ${activeBg.name}`,
      },
    }[tab];

    const heroWrap = el("div", "sh-hero-wrap");
    const hero = el("section", "sh-hero");
    hero.setAttribute("aria-label", heroMeta.title);

    const lunaArt = imgEl(
      "pages/match_results/characters/luna.png",
      "sh-hero-luna",
    );
    lunaArt.width = 160;
    lunaArt.height = 160;

    const heroCopy = el("div", "sh-hero-copy");
    heroCopy.append(
      el("h3", "sh-hero-title", heroMeta.title),
      el("p", "sh-hero-desc", heroMeta.desc),
      el("span", "sh-hero-pill", heroMeta.chipLabel),
    );

    const heroStage = el("div", "sh-hero-stage");
    heroStage.setAttribute("aria-hidden", "true");
    heroStage.append(el("span", "sh-hero-pedestal"));
    const featImg = imgEl(
      heroMeta.featuredArt,
      tab === "background" ? "sh-hero-feat sh-hero-feat--bg" : "sh-hero-feat",
    );
    featImg.width = 160;
    featImg.height = 160;
    heroStage.append(featImg);

    hero.append(lunaArt, heroCopy, heroStage);
    attachSpatialTilt(hero);
    heroWrap.append(hero);

    /* 3. Tab Catalog Content */
    if (tab === "board") {
      const grid = el("div", "sh-grid");
      for (const item of shopBoardsCatalog) {
        const board = popRules.getBoard(item.id);
        const owned = item.cost === 0 || state.ownedBoards.includes(item.id);
        const isEquipped =
          typeof equippedBoard !== "undefined" && equippedBoard.id === item.id;
        const card = el(
          "article",
          `sh-card sh-card--${item.theme} ${isEquipped ? "is-equipped" : ""}`,
        );

        if (isEquipped) {
          card.append(el("span", "sh-tag sh-tag--equipped", "ACTIVE"));
        } else if (item.tag) {
          card.append(el("span", "sh-tag", item.tag));
        }

        const stage = el("div", "sh-card-stage");
        stage.append(
          el("span", "sh-card-spotlight"),
          el("span", "sh-pedestal"),
        );
        const art = imgEl(item.art, "sh-card-art");
        art.width = 256;
        art.height = 256;
        stage.append(art);

        const title = el("h4", "sh-card-title", board.name);
        const meta = el("span", "sh-card-meta", item.sizeLabel);

        const btn = el("button", "sh-btn");
        btn.type = "button";
        if (isEquipped) {
          btn.classList.add("sh-btn--equipped");
          btn.textContent = "✓ Equipped";
          btn.disabled = true;
        } else if (owned) {
          btn.classList.add("sh-btn--use");
          btn.textContent = "Use Board";
          btn.addEventListener("click", () => {
            if (typeof equipBoard === "function") equipBoard(board);
            showToast(`${board.name} equipped!`);
            renderActivePanel();
          });
        } else {
          btn.classList.add("sh-btn--buy");
          const curIcon = imgEl(
            item.currency === "gems"
              ? "pages/home/hud/gem.png"
              : "pages/home/hud/coin.png",
            "sh-btn-cur",
          );
          curIcon.width = 48;
          curIcon.height = 48;
          btn.append(curIcon, el("span", "", fmt(item.cost)));
          btn.addEventListener("click", () => {
            if (item.currency === "gems" && state.gems < item.cost) {
              showToast("Not enough Gems!", "warn");
              return;
            }
            if (item.currency === "coins" && state.coins < item.cost) {
              showToast("Not enough Coins!", "warn");
              return;
            }
            if (item.currency === "gems") state.gems -= item.cost;
            else state.coins -= item.cost;
            if (!state.ownedBoards.includes(item.id))
              state.ownedBoards.push(item.id);
            if (typeof equipBoard === "function") equipBoard(board);
            justBoughtShopItem = true;
            saveState();
            syncHud();
            showToast(`Yeay! ${board.name} unlocked!`);
            renderActivePanel();
          });
        }

        card.append(stage, title, meta, btn);
        card.addEventListener("animationend", () => {
          card.style.removeProperty("will-change");
        });
        attachSpatialTilt(card);
        grid.append(card);
      }
      root.append(tabBar, heroWrap, grid);
    } else if (tab === "bundle") {
      const list = el("div", "sh-bundle-list");
      for (const b of shopBundlesCatalog) {
        const owned = state.claimedBundles.includes(b.id);
        const card = el(
          "article",
          `sh-bundle sh-bundle--${b.theme} ${owned ? "is-equipped" : ""}`,
        );
        card.append(el("span", "sh-bundle-ribbon", owned ? "OWNED" : b.tag));

        const stage = el("div", "sh-bundle-stage");
        stage.setAttribute("aria-hidden", "true");
        stage.append(el("span", "sh-bundle-pedestal"));
        b.arts.forEach((src, i) => {
          const im = imgEl(src, `sh-bundle-art sh-bundle-art--${i + 1}`);
          im.width = 160;
          im.height = 160;
          stage.append(im);
        });

        const info = el("div", "sh-bundle-info");
        info.append(
          el("h4", "sh-bundle-title", b.name),
          el("p", "sh-bundle-desc", b.desc),
        );
        const chips = el("div", "sh-bundle-chips");
        for (const chipTxt of b.chips) {
          chips.append(el("span", "sh-bundle-chip", chipTxt));
        }
        info.append(chips);

        const cta = el("button", "sh-btn sh-bundle-btn");
        cta.type = "button";
        if (owned) {
          cta.classList.add("sh-btn--equipped");
          cta.textContent = "✓ Owned";
          cta.disabled = true;
        } else {
          cta.classList.add("sh-btn--buy");
          const gemIcon = imgEl("pages/home/hud/gem.png", "sh-btn-cur");
          gemIcon.width = 48;
          gemIcon.height = 48;
          cta.append(gemIcon, el("span", "", `${fmt(b.cost)} Gems`));
          cta.addEventListener("click", () => {
            if (state.gems < b.cost) {
              showToast("Not enough Gems!", "warn");
              return;
            }
            state.gems -= b.cost;
            state.claimedBundles.push(b.id);
            if (b.unlockBoard && !state.ownedBoards.includes(b.unlockBoard)) {
              state.ownedBoards.push(b.unlockBoard);
              const unlockedBoardObj = popRules.getBoard(b.unlockBoard);
              if (unlockedBoardObj && typeof equipBoard === "function")
                equipBoard(unlockedBoardObj);
            }
            if (b.unlockBg && !state.ownedBgs.includes(b.unlockBg)) {
              state.ownedBgs.push(b.unlockBg);
              state.equippedBg = b.unlockBg;
              applyGameBg(b.unlockBg);
            }
            awardReward(b.reward);
            justBoughtShopItem = true;
            showToast(`Yeay! ${b.name} opened!`);
            renderActivePanel();
          });
        }

        const top = el("div", "sh-bundle-top");
        top.append(stage, info);
        card.append(top, cta);
        card.addEventListener("animationend", () => {
          card.style.removeProperty("will-change");
        });
        attachSpatialTilt(card);
        list.append(card);
      }
      root.append(tabBar, heroWrap, list);
    } else {
      const grid = el("div", "sh-grid");
      for (const item of shopBackgroundsCatalog) {
        const owned = item.cost === 0 || state.ownedBgs.includes(item.id);
        const isEquipped = state.equippedBg === item.id;
        const card = el(
          "article",
          `sh-card sh-bg-card sh-card--${item.theme} ${isEquipped ? "is-equipped" : ""}`,
        );

        if (isEquipped) {
          card.append(el("span", "sh-tag sh-tag--equipped", "ACTIVE"));
        } else if (item.tag) {
          card.append(el("span", "sh-tag", item.tag));
        }

        const frame = el("div", "sh-bg-frame");
        const thumb = imgEl(item.art, "sh-bg-thumb");
        thumb.width = 240;
        thumb.height = 150;
        frame.append(thumb);

        const title = el("h4", "sh-card-title", item.name);
        const meta = el("span", "sh-card-meta", item.desc);

        const btn = el("button", "sh-btn");
        btn.type = "button";
        if (isEquipped) {
          btn.classList.add("sh-btn--equipped");
          btn.textContent = "✓ Equipped";
          btn.disabled = true;
        } else if (owned) {
          btn.classList.add("sh-btn--use");
          btn.textContent = "Use World";
          btn.addEventListener("click", () => {
            state.equippedBg = item.id;
            applyGameBg(item.id);
            saveState();
            showToast(`${item.name} world equipped!`);
            renderActivePanel();
          });
        } else {
          btn.classList.add("sh-btn--buy");
          const curIcon = imgEl(
            item.currency === "gems"
              ? "pages/home/hud/gem.png"
              : "pages/home/hud/coin.png",
            "sh-btn-cur",
          );
          curIcon.width = 48;
          curIcon.height = 48;
          btn.append(curIcon, el("span", "", fmt(item.cost)));
          btn.addEventListener("click", () => {
            if (item.currency === "gems" && state.gems < item.cost) {
              showToast("Not enough Gems!", "warn");
              return;
            }
            if (item.currency === "coins" && state.coins < item.cost) {
              showToast("Not enough Coins!", "warn");
              return;
            }
            if (item.currency === "gems") state.gems -= item.cost;
            else state.coins -= item.cost;
            if (!state.ownedBgs.includes(item.id)) state.ownedBgs.push(item.id);
            state.equippedBg = item.id;
            applyGameBg(item.id);
            justBoughtShopItem = true;
            saveState();
            syncHud();
            showToast(`Yeay! ${item.name} unlocked!`);
            renderActivePanel();
          });
        }

        card.append(frame, title, meta, btn);
        card.addEventListener("animationend", () => {
          card.style.removeProperty("will-change");
        });
        attachSpatialTilt(card);
        grid.append(card);
      }
      root.append(tabBar, heroWrap, grid);
    }

    dialogContent.append(root);

    if (justBoughtShopItem) {
      justBoughtShopItem = false;
      spawnRewardBurst(root);
    }
  }

  function spawnRewardBurst(container) {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const burst = el("div", "rw-burst");
    burst.setAttribute("aria-hidden", "true");
    const pieces = [
      {
        dx: "-92px",
        dy: "-64px",
        rot: "-42deg",
        color: "#ffe14d",
        delay: "0ms",
      },
      {
        dx: "-56px",
        dy: "-86px",
        rot: "28deg",
        color: "#ff6bc2",
        delay: "30ms",
      },
      {
        dx: "-22px",
        dy: "-94px",
        rot: "-24deg",
        color: "#5ceeff",
        delay: "15ms",
      },
      {
        dx: "24px",
        dy: "-92px",
        rot: "34deg",
        color: "#68f278",
        delay: "25ms",
      },
      {
        dx: "62px",
        dy: "-82px",
        rot: "-32deg",
        color: "#ffe14d",
        delay: "10ms",
      },
      {
        dx: "94px",
        dy: "-58px",
        rot: "48deg",
        color: "#ff78c4",
        delay: "35ms",
      },
      {
        dx: "-84px",
        dy: "16px",
        rot: "64deg",
        color: "#70d8ff",
        delay: "20ms",
      },
      {
        dx: "86px",
        dy: "20px",
        rot: "-54deg",
        color: "#ffe14d",
        delay: "25ms",
      },
      {
        dx: "-44px",
        dy: "-48px",
        rot: "18deg",
        color: "#b688ff",
        delay: "40ms",
      },
      {
        dx: "46px",
        dy: "-52px",
        rot: "-22deg",
        color: "#68f278",
        delay: "45ms",
      },
    ];
    for (const p of pieces) {
      const piece = el("span", "rw-confetti");
      piece.style.setProperty("--rw-dx", p.dx);
      piece.style.setProperty("--rw-dy", p.dy);
      piece.style.setProperty("--rw-rot", p.rot);
      piece.style.setProperty("--rw-color", p.color);
      piece.style.animationDelay = p.delay;
      burst.append(piece);
    }
    container.append(burst);
    setTimeout(() => burst.remove(), 980);
  }

  function renderRewards() {
    const days = [
      {
        day: 1,
        title: "Day 1",
        theme: "gold",
        reward: { coins: 300 },
        label: "300 Coins",
        art: "pages/rewards/day1-coin-pouch.png",
      },
      {
        day: 2,
        title: "Day 2",
        theme: "pink",
        reward: { gems: 15 },
        label: "15 Gems",
        art: "pages/rewards/day2-gem-jar.png",
      },
      {
        day: 3,
        title: "Day 3",
        theme: "today",
        reward: { coins: 500, gems: 20 },
        label: "500 + 20",
        art: "pages/rewards/day3-surprise-box.png",
      },
      {
        day: 4,
        title: "Day 4",
        theme: "aqua",
        reward: { items: { rush: 2 } },
        label: "Rush ×2",
        art: "pages/rewards/day4-rush-star.png",
      },
      {
        day: 5,
        title: "Day 5",
        theme: "peach",
        reward: { coins: 800 },
        label: "800 Coins",
        art: "pages/rewards/day5-piggy-bank.png",
      },
      {
        day: 6,
        title: "Day 6",
        theme: "lilac",
        reward: { gems: 40 },
        label: "40 Gems",
        art: "pages/rewards/day6-gem-crown.png",
      },
      {
        day: 7,
        title: "Day 7 Grand Prize",
        reward: { coins: 2000, gems: 100 },
        label: "2,000 Coins + 100 Gems",
        art: "pages/home/icon/rewards.png",
      },
    ];
    const currentDay = 3;
    const claimedCount = state.claimedRewards.length;

    const root = el("div", "rw-root");

    /* 1. 7-Day Adventure Star Trail */
    const streak = el("section", "rw-streak");
    streak.setAttribute("aria-label", "7-Day Treasure Trail");
    const streakHead = el("div", "rw-streak-head");
    streakHead.append(
      el("strong", "rw-streak-title", "7-Day Treasure Trail"),
      el("span", "rw-streak-pill", `${claimedCount}/7 Claimed`),
    );

    const trail = el("div", "rw-trail");
    trail.setAttribute("aria-hidden", "true");
    const trailTrack = el("div", "rw-trail-line");
    const trailFill = el("span", "rw-trail-fill");
    const pct = Math.max(
      0,
      Math.min(100, Math.round((claimedCount / 7) * 100)),
    );
    trailFill.style.width = `${pct}%`;
    trailTrack.append(trailFill);
    trail.append(trailTrack);

    for (const d of days) {
      const done = state.claimedRewards.includes(d.day);
      const isToday = d.day === currentDay && !done;
      const node = el(
        "span",
        `rw-step ${done ? "is-done" : isToday ? "is-today" : "is-upcoming"}`,
      );
      node.textContent = done ? "✓" : d.day === 7 ? "★" : String(d.day);
      trail.append(node);
    }

    streak.append(streakHead, trail);

    /* 2. Staggered 3x2 Daily Gift Grid */
    const grid = el("div", "rw-grid");
    for (const d of days.slice(0, 6)) {
      const claimed = state.claimedRewards.includes(d.day);
      const available = d.day === currentDay && !claimed;
      const stateCls = available
        ? "is-today"
        : claimed
          ? "is-claimed"
          : "is-locked";
      const card = el("article", `rw-day rw-day--${d.theme} ${stateCls}`);

      const badgeText = available ? "TODAY!" : d.title;
      const badge = el("span", "rw-day-badge", badgeText);

      const artWrap = el("div", "rw-day-art-wrap");
      const art = imgEl(d.art, "rw-day-art");
      art.width = 256;
      art.height = 256;
      artWrap.append(art);

      const label = el("strong", "rw-day-label", d.label);

      let statusEl;
      if (claimed) {
        statusEl = el("span", "rw-status rw-status--claimed", "✓ Claimed");
      } else if (available) {
        statusEl = el("button", "rw-claim-btn", "Claim!");
        statusEl.type = "button";
        statusEl.addEventListener("click", () => {
          state.claimedRewards.push(d.day);
          awardReward(d.reward);
          justClaimedReward = true;
          showToast(`Yeay! Day ${d.day} reward claimed!`);
          renderActivePanel();
        });
      } else {
        statusEl = el(
          "span",
          "rw-status rw-status--locked",
          d.day === currentDay + 1 ? "🔒 Tomorrow" : `🔒 Day ${d.day}`,
        );
      }

      card.append(badge, artWrap, label, statusEl);
      card.addEventListener("animationend", () => {
        card.style.removeProperty("will-change");
      });
      attachSpatialTilt(card);
      grid.append(card);
    }

    /* 3. Day 7 Mega Treasure Chest Showcase */
    const day7 = days[6];
    const grandWrap = el("div", "rw-grand-wrap");
    const grand = el("section", "rw-grand");
    grand.setAttribute("aria-label", "Day 7 Grand Prize");

    const grandStage = el("div", "rw-grand-stage");
    grandStage.setAttribute("aria-hidden", "true");
    const chestImg = imgEl(day7.art, "rw-grand-chest");
    chestImg.width = 256;
    chestImg.height = 256;
    const coinSpark = imgEl(
      "pages/home/hud/coin.png",
      "rw-grand-float rw-grand-float--coin",
    );
    const gemSpark = imgEl(
      "pages/home/hud/gem.png",
      "rw-grand-float rw-grand-float--gem",
    );
    const starSpark = imgEl(
      "pages/profile/icon-star.png",
      "rw-grand-float rw-grand-float--star",
    );
    grandStage.append(coinSpark, gemSpark, starSpark, chestImg);

    const grandInfo = el("div", "rw-grand-info");
    grandInfo.append(
      el("span", "rw-grand-badge", "★ DAY 7 GRAND PRIZE ★"),
      el("h4", "rw-grand-title", day7.label),
      el(
        "p",
        "rw-grand-desc",
        "Keep coming back every day to unlock the Week 1 Mega Surprise Box!",
      ),
    );

    grand.append(grandStage, grandInfo);
    attachSpatialTilt(grand);
    grandWrap.append(grand);

    root.append(streak, grid, grandWrap);
    dialogContent.append(root);

    if (justClaimedReward) {
      justClaimedReward = false;
      spawnRewardBurst(root);
    }
  }

  function renderInventory() {
    const [tabBar, tab] = renderTabs("inventory", [
      { id: "items", label: "Items" },
      { id: "boards", label: "Boards" },
      { id: "currency", label: "Currency" },
    ]);

    if (tab === "items") {
      const grid = el("div", "panel-grid-2");
      const best = state.modeRecords?.frenzy?.bestStreak ?? 0;
      const cosmeticGroups = [
        ["boardFinish", "Board finish", [["original", "Original"], ["neon", "Neon Glow", state.level >= 10], ["golden", "Golden Touch", state.level >= 20], ["piano", "Piano Keys", sequenceStars() >= 50],
          ["cyber", "Cyber Grid", sequenceStars() >= 150], ["magma", "Magma Core", best >= 200], ...(state.rewardFinishes ?? []).map((finish) => [finish, finishLabels[finish] ?? finish])]],
        ["popSfx", "Pop sound", [["original", "Original"], ["arcade", "Arcade Synth", best >= 50], ["retro", "8-Bit Retro", state.rewardSounds?.includes("retro") ?? false]]],
        ["popVfx", "Pop effects", [["original", "Original"], ["blue-flame", "Blue Flame", best >= 100]]],
        ["avatarFrame", "Profile frame", [["original", "Original"], ["rookie", "Rookie Popper", state.level >= 5],
          ["lightning", "Lightning", best >= 300], ...(state.rewardFrames ?? []).map((frame) => [frame, frame === "brainiac" ? "Brainiac" : frame])]],
        ["playerTitle", "Player title", [["original", "Star Popper"], ["Pop Master", "Pop Master", state.level >= 15],
          ["Frenzy Maniac", "Frenzy Maniac", best >= 200], ...(state.rewardTitles ?? []).map((title) => [title, title])]],
      ];
      const cosmetics = el("div", "panel-card");
      cosmetics.append(el("h4", "panel-title", "Prestige cosmetics"));
      for (const [key, label, items] of cosmeticGroups) {
        cosmetics.append(deckSelect(label, items.filter((item) => item[2] !== false),
          state.cosmetics?.[key] ?? "original", (value) => {
            (state.cosmetics ??= {})[key] = value;
            saveState();
            syncHud();
          }));
      }
      cosmetics.append(el("p", "panel-desc", "Sequence stars and Frenzy streaks unlock more cosmetics."));
      grid.append(cosmetics);
      const boxes = el("div", "panel-card");
      const count = state.feverBoxes ?? 0;
      boxes.append(el("h4", "panel-title", `Mystery Fever Box · ${count}`));
      if (count) boxes.append(actionBtn("Open Box", "gold", () => {
        state.feverBoxes -= 1;
        const reward = [{ coins: 250 }, { gems: 5 }, { items: { blast: 1 } }][Math.floor(Math.random() * 3)];
        awardReward(reward);
        showToast(reward.coins ? "Found 250 Coins!" : reward.gems ? "Found 5 Gems!" : "Found a Blast card!");
        renderActivePanel();
      }));
      grid.append(boxes);
      const tickets = el("div", "panel-card");
      tickets.append(el("h4", "panel-title", "Booster tickets"));
      for (const [id, item] of Object.entries(popRules.boosters)) {
        tickets.append(el("p", "panel-desc", `${item.name} · ×${state.boosterTickets?.[id] ?? 0}`));
      }
      if (state.xpBoostUntil > Date.now()) {
        tickets.append(el("p", "panel-desc", `XP boost active until ${new Date(state.xpBoostUntil).toLocaleTimeString()}`));
      }
      if ((state.boosterTickets?.xp_hour ?? 0) > 0) {
        tickets.append(actionBtn("Activate XP Booster", "gold", () => {
          if (!(state.boosterTickets?.xp_hour > 0)) return;
          state.boosterTickets.xp_hour -= 1;
          state.xpBoostUntil = Math.max(state.xpBoostUntil ?? 0, Date.now()) + 3_600_000;
          saveState();
          renderActivePanel();
        }));
      }
      tickets.append(actionBtn("Get Boosters", "blue", () => {
        activeTab.shop = "boosters";
        open("shop");
      }));
      grid.append(tickets);
      for (const [id, item] of Object.entries(popRules.skillDefinitions)) {
        const count = state.items[id] ?? 0;
        if (!count && id !== "shield") continue;
        const card = el("div", "panel-card");
        const top = el("div", "panel-row");
        const artwork = item.icon ? imgEl(`pages/gameplay/dock/${item.icon}`, "panel-thumb") : badgeEl(item.symbol, "purple");
        top.append(artwork, badgeEl(`×${count}`, "mint"));
        card.append(top, el("h4", "panel-title", item.name));
        if (id === "shield") {
          const upgraded = state.skillUpgrades?.shield === 2;
          card.append(el("p", "panel-desc", upgraded ? "Level 2 · 3.5 second protection" : "Level 1 · 3 second protection"));
          if (!upgraded) {
            const upgrade = actionBtn("Upgrade · 1 card", "blue", () => {
              if (state.level < 3 || state.skillUpgrades?.shield === 2 || !state.items.shield) return;
              state.items.shield -= 1;
              (state.skillUpgrades ??= {}).shield = 2;
              saveState();
              renderActivePanel();
            });
            upgrade.disabled = !count || state.level < 3;
            card.append(upgrade);
          }
        }
        grid.append(card);
      }
      dialogContent.append(tabBar, grid);
      return;
    }

    if (tab === "boards") {
      const list = el("div", "panel-list");
      const boardArtMap = {
        classic_rush: "pages/gameplay/board-aqua-wave.png",
        color_hunt: "pages/gameplay/board-sapphire-blue.png",
        memory_rush: "pages/gameplay/board-gemmed-purple.png",
        pink_stage: "pages/gameplay/board-candy-pink.png",
        rainbow_pop: "pages/gameplay/board-rainbow-pop.png",
        star_pop: "pages/gameplay/board-star-pop.png",
        paw_pop: "pages/gameplay/board-paw-pop.png",
      };
      for (const board of popRules.boards) {
        const isEquipped =
          typeof equippedBoard !== "undefined" && equippedBoard.id === board.id;
        const card = el(
          "div",
          isEquipped ? "panel-card panel-card--highlight" : "panel-card",
        );
        const row = el("div", "panel-row");
        const start = el("div", "panel-row-start");
        const art = boardArtMap[board.id];
        start.append(
          art ? imgEl(art, "panel-thumb") : el("span", "panel-board-swatch"),
        );
        const info = el("div", "min-w-0 flex-1");
        info.append(
          el("h4", "panel-title", board.name),
          el(
            "p",
            "panel-desc",
            `${board.sizeLabel} · ${board.targetCount} targets`,
          ),
        );
        start.append(info);
        row.append(
          start,
          isEquipped
            ? actionBtn("Equipped", "claimed")
            : actionBtn("Equip", "blue", () => {
                if (typeof equipBoard === "function") equipBoard(board);
                showToast(`${board.name} equipped!`);
                renderActivePanel();
              }),
        );
        card.append(row);
        list.append(card);
      }
      dialogContent.append(tabBar, list);
      return;
    }

    const list = el("div", "panel-list");
    const coinCard = el("div", "panel-card");
    const coinRow = el("div", "panel-row");
    const coinStart = el("div", "panel-row-start");
    coinStart.append(imgEl("pages/home/hud/coin.png", "panel-thumb"));
    const coinText = el("div");
    coinText.append(
      el("h4", "panel-title", "Coins"),
      el("p", "panel-kpi", fmt(state.coins)),
    );
    coinStart.append(coinText);
    coinRow.append(
      coinStart,
      actionBtn("Add Points", "gold", () => open("coins")),
    );
    coinCard.append(coinRow);

    const gemCard = el("div", "panel-card");
    const gemRow = el("div", "panel-row");
    const gemStart = el("div", "panel-row-start");
    gemStart.append(imgEl("pages/home/hud/gem.png", "panel-thumb"));
    const gemText = el("div");
    gemText.append(
      el("h4", "panel-title", "Gems"),
      el("p", "panel-kpi", fmt(state.gems)),
    );
    gemStart.append(gemText);
    gemRow.append(
      gemStart,
      actionBtn("Add Gems", "gold", () => open("gems")),
    );
    gemCard.append(gemRow);

    list.append(coinCard, gemCard);
    dialogContent.append(tabBar, list);
  }

  function renderCoins() {
    const hero = el("div", "panel-hero panel-hero--gold");
    hero.append(imgEl("pages/home/hud/coin.png", "panel-hero-art"));
    const info = el("div");
    info.append(
      el("p", "panel-desc", "Current Balance"),
      el("p", "panel-kpi", `${fmt(state.coins)} Coins`),
    );
    hero.append(info);

    const packs = [
      {
        id: "free-coin",
        amount: 1000,
        gemsCost: 0,
        tag: state.claimedFreeCoinPack ? "CLAIMED" : "FREE",
        tone: "mint",
        title: "+1,000 Coins",
      },
      {
        id: "c500",
        amount: 500,
        gemsCost: 10,
        tag: "POUCH",
        tone: "purple",
        title: "+500 Coins",
      },
      {
        id: "c2500",
        amount: 2500,
        gemsCost: 45,
        tag: "",
        tone: "",
        title: "+2,500 Coins",
      },
      {
        id: "c10000",
        amount: 10000,
        gemsCost: 150,
        tag: "POPULAR",
        tone: "",
        title: "+10,000 Coins",
      },
      {
        id: "c40000",
        amount: 40000,
        gemsCost: 500,
        tag: "BEST VALUE",
        tone: "pink",
        title: "+40,000 Coins",
      },
    ];

    const grid = el("div", "panel-grid-2");
    for (const pack of packs) {
      const isFreeClaimed =
        pack.id === "free-coin" && state.claimedFreeCoinPack;
      const card = el(
        "div",
        pack.tag === "POPULAR" || pack.tag === "BEST VALUE"
          ? "panel-card panel-card--highlight"
          : "panel-card",
      );
      card.style.justifyItems = "center";
      card.style.textAlign = "center";
      if (pack.tag) card.append(badgeEl(pack.tag, pack.tone));
      card.append(
        imgEl("pages/home/hud/coin.png", "panel-thumb"),
        el("h4", "panel-title", pack.title),
      );

      if (isFreeClaimed) {
        card.append(actionBtn("Claimed", "claimed"));
      } else if (pack.gemsCost === 0) {
        card.append(
          actionBtn("Claim Free", "gold", () => {
            if (pack.id === "free-coin") state.claimedFreeCoinPack = true;
            awardReward({ coins: pack.amount });
            showToast(`Added +${fmt(pack.amount)} Coins!`);
            renderActivePanel();
          }),
        );
      } else {
        card.append(
          actionBtn(
            String(pack.gemsCost),
            "gold",
            () => {
              if (!exchangeCoins(pack.gemsCost, pack.amount)) {
                showToast("Not enough Gems!", "warn");
                return;
              }
              showToast(`Added +${fmt(pack.amount)} Coins!`);
              renderActivePanel();
            },
            "pages/home/hud/gem.png",
          ),
        );
      }
      grid.append(card);
    }

    dialogContent.append(hero, grid);
  }

  function renderGems() {
    const hero = el("div", "panel-hero panel-hero--gold");
    hero.append(imgEl("pages/home/hud/gem.png", "panel-hero-art"));
    const info = el("div");
    info.append(
      el("p", "panel-desc", "Current Balance"),
      el("p", "panel-kpi", `${fmt(state.gems)} Gems`),
    );
    hero.append(info);

    const packs = [
      {
        id: "free-gem",
        amount: 50,
        price: "Claim Free",
        tag: state.claimedFreeGemPack ? "CLAIMED" : "FREE GIFT",
        tone: "mint",
      },
      {
        id: "g80",
        amount: 80,
        price: "Preview +80",
        tag: "STARTER",
        tone: "purple",
      },
      { id: "g250", amount: 250, price: "Preview +250", tag: "", tone: "" },
      {
        id: "g550",
        amount: 550,
        price: "Preview +550",
        tag: "POPULAR",
        tone: "",
      },
      {
        id: "g1200",
        amount: 1200,
        price: "Preview +1,200",
        tag: "+20% FREE",
        tone: "mint",
      },
      {
        id: "g2800",
        amount: 2800,
        price: "Preview +2,800",
        tag: "BEST VALUE",
        tone: "pink",
      },
    ];

    const grid = el("div", "panel-grid-2");
    for (const pack of packs) {
      const isFreeClaimed = pack.id === "free-gem" && state.claimedFreeGemPack;
      const card = el(
        "div",
        pack.tag === "POPULAR" || pack.tag === "BEST VALUE"
          ? "panel-card panel-card--highlight"
          : "panel-card",
      );
      card.style.justifyItems = "center";
      card.style.textAlign = "center";
      if (pack.tag) card.append(badgeEl(pack.tag, pack.tone));
      card.append(
        imgEl("pages/home/hud/gem.png", "panel-thumb"),
        el("h4", "panel-title", `+${fmt(pack.amount)} Gems`),
      );

      if (isFreeClaimed) {
        card.append(actionBtn("Claimed", "claimed"));
      } else {
        card.append(
          actionBtn(pack.price, "gold", () => {
            if (pack.id === "free-gem") state.claimedFreeGemPack = true;
            awardReward({ gems: pack.amount });
            showToast(`Added +${fmt(pack.amount)} Gems!`);
            renderActivePanel();
          }),
        );
      }
      grid.append(card);
    }

    dialogContent.append(hero, grid);
  }

  function makeSvg(tag, attrs = {}) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [key, val] of Object.entries(attrs))
      node.setAttribute(key, String(val));
    return node;
  }

  function createCopyIcon() {
    const svg = makeSvg("svg", {
      viewBox: "0 0 24 24",
      fill: "none",
      "aria-hidden": "true",
      class: "pf-copy-svg",
    });
    svg.append(
      makeSvg("rect", {
        x: 9,
        y: 9,
        width: 11,
        height: 11,
        rx: 2.4,
        stroke: "currentColor",
        "stroke-width": 2.1,
      }),
      makeSvg("path", {
        d: "M6 15H5.4A2.4 2.4 0 0 1 3 12.6V5.4A2.4 2.4 0 0 1 5.4 3h7.2A2.4 2.4 0 0 1 15 5.4V6",
        stroke: "currentColor",
        "stroke-width": 2.1,
        "stroke-linecap": "round",
      }),
    );
    return svg;
  }

  function createCloudLayer(className) {
    const svg = makeSvg("svg", {
      viewBox: "0 0 320 64",
      preserveAspectRatio: "none",
      fill: "none",
      "aria-hidden": "true",
      class: className,
    });
    svg.append(
      makeSvg("path", {
        d: "M-8 64V44c9-9 23-12 36-6 7-11 22-16 35-10 8-8 22-8 31 0 11-4 23 1 28 11 9-3 19 0 25 7h26c6-7 16-10 25-7 5-10 17-15 28-11 9-8 23-8 31 0 13-6 28-1 35 10 13-6 27-3 36 6v20H-8z",
        fill: "currentColor",
      }),
    );
    return svg;
  }

  function createLaurelAccents() {
    const svg = makeSvg("svg", {
      viewBox: "0 0 120 40",
      fill: "none",
      "aria-hidden": "true",
      class: "pf-laurel",
    });
    svg.append(
      makeSvg("path", {
        d: "M84 35c10-2 19-8 25-17m-20 15c2-4 5-6 9-7m-1 5c3 1 7 1 10-1m-3-5c1-4 4-6 8-7m-2 5c3 1 6 0 9-2m-2-5c0-4 2-7 6-9",
        stroke: "currentColor",
        "stroke-width": 2.4,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      }),
    );
    return svg;
  }

  function renderProfile() {
    const player = activePlayer();
    const displayName = playerDisplayName();
    const root = el("div", "pf-root");

    /* 1. Gold-rimmed Hero Card */
    const hero = el("section", "pf-hero");
    hero.setAttribute("aria-label", "Player Overview");
    hero.append(
      createCloudLayer("pf-hero-clouds"),
      el("span", "pf-spark pf-spark--h1"),
      el("span", "pf-spark pf-spark--h2"),
      el("span", "pf-spark pf-spark--h3"),
      imgEl("pages/profile/icon-star.png", "pf-hero-star pf-hero-star--a"),
      imgEl("pages/profile/icon-star.png", "pf-hero-star pf-hero-star--b"),
    );

    const artWrap = el("div", "pf-hero-art-wrap");
    const heroArtSrc =
      player.character === "luna"
        ? "pages/home/character/luna_home.png"
        : `pages/character/${player.character}.png`;
    artWrap.append(imgEl(heroArtSrc, "pf-hero-art", displayName));

    const heroInfo = el("div", "pf-hero-info");
    const lvlBadge = el(
      "span",
      "pf-level-badge",
      `LEVEL ${state.level} · ${(state.cosmetics?.playerTitle ?? "STAR POPPER").toUpperCase()}`,
    );
    const heroName = el("h3", "pf-hero-name", displayName);

    const xpWrap = el("div", "pf-xp-wrap");
    const xpMeta = el("div", "pf-xp-meta");
    const { nextXp } = popRules.getPlayerLevel(state.xp);
    xpMeta.append(
      el("span", "", "Total XP"),
      el("strong", "", nextXp ? `${fmt(state.xp)} / ${fmt(nextXp)}` : `${fmt(state.xp)} · Max level`),
    );
    const xpTrack = el("div", "pf-xp-track");
    const xpFill = el("span", "pf-xp-fill");
    const currentXp = popRules.xpForPlayerLevel(state.level);
    const xpPct = nextXp ? (state.xp - currentXp) * 100 / (nextXp - currentXp) : 100;
    xpFill.style.width = `${xpPct}%`;
    xpTrack.append(xpFill);
    xpWrap.append(xpMeta, xpTrack);

    const idRow = el("div", "pf-id-row");
    const idPill = el("span", "pf-id-pill", "ID: PR-88241");
    const copyBtn = el("button", "pf-copy-btn");
    copyBtn.type = "button";
    copyBtn.append(createCopyIcon(), el("span", "", "Copy ID"));
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard?.writeText("PR-88241");
      } catch {}
      showToast("Player ID PR-88241 copied!");
    });
    idRow.append(idPill, copyBtn);

    heroInfo.append(lvlBadge, heroName, xpWrap, idRow);
    hero.append(artWrap, heroInfo);

    /* 2. Frosted Sky Nickname Card */
    const nickCard = el("section", "pf-nickname");
    nickCard.append(
      createCloudLayer("pf-nick-clouds"),
      el("span", "pf-spark pf-spark--n1"),
    );
    const nickHead = el("div", "pf-card-head");
    nickHead.append(
      imgEl("pages/profile/icon-pencil.png", "pf-head-icon"),
      el("h4", "pf-card-title", "Player Nickname"),
    );
    const form = el("form", "pf-nick-form");
    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 16;
    input.placeholder = player.name;
    input.value = state.nickname;
    input.setAttribute("aria-label", "Nickname");
    const saveBtn = el("button", "pf-gold-btn pf-save-btn", "Save");
    saveBtn.type = "submit";
    form.append(input, saveBtn);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      state.nickname = input.value.trim();
      saveState();
      syncHud();
      showToast(`Nickname updated to ${playerDisplayName()}!`);
      renderActivePanel();
    });
    nickCard.append(nickHead, form);

    /* 3. 2x2 Glossy Stat Cards */
    const statsGrid = el("section", "pf-stats");
    statsGrid.setAttribute("aria-label", "Player Statistics");
    const statDefs = [
      {
        tone: "pink",
        label: "Matches",
        value: String(state.stats.matches),
        icon: "pages/profile/icon-trophy.png",
      },
      {
        tone: "purple",
        label: "Wins",
        value: String(state.stats.wins),
        icon: "pages/profile/icon-crown.png",
      },
      {
        tone: "mint",
        label: "Total Pops",
        value: fmt(state.stats.totalPops),
        icon: "pages/profile/icon-bubbles.png",
      },
      {
        tone: "gold",
        label: "Best Rank",
        value: state.stats.bestRank ? `#${state.stats.bestRank}` : "—",
        icon: "pages/profile/icon-medal.png",
        laurel: true,
      },
    ];
    for (const stat of statDefs) {
      const card = el("div", `pf-stat pf-stat--${stat.tone}`);
      card.append(el("span", "pf-spark pf-spark--stat"));
      if (stat.laurel) card.append(createLaurelAccents());
      const copy = el("div", "pf-stat-copy");
      copy.append(
        el("span", "pf-stat-label", stat.label),
        el("strong", "pf-stat-value", stat.value),
      );
      card.append(imgEl(stat.icon, "pf-stat-icon"), copy);
      statsGrid.append(card);
    }

    /* 4. 2-Column Loadout Cards */
    const boardId =
      typeof equippedBoard !== "undefined" ? equippedBoard.id : "color_hunt";
    const boardNameText =
      typeof equippedBoard !== "undefined"
        ? equippedBoard.name
        : "Sapphire Blue";
    const boardThumbMap = {
      color_hunt: "pages/profile/board-thumb-sapphire.png",
      classic_rush: "pages/gameplay/board-aqua-wave.png",
      memory_rush: "pages/gameplay/board-gemmed-purple.png",
      pink_stage: "pages/gameplay/board-candy-pink.png",
      rainbow_pop: "pages/gameplay/board-rainbow-pop.png",
      star_pop: "pages/gameplay/board-star-pop.png",
      paw_pop: "pages/gameplay/board-paw-pop.png",
    };
    const boardThumbSrc =
      boardThumbMap[boardId] ?? "pages/profile/board-thumb-sapphire.png";

    const loadout = el("section", "pf-loadout");
    loadout.setAttribute("aria-label", "Loadout");

    const charCard = el("div", "pf-loadout-card pf-loadout-card--char");
    charCard.append(
      createCloudLayer("pf-loadout-clouds"),
      el("span", "pf-spark pf-spark--l1"),
    );
    const charHead = el("div", "pf-loadout-head");
    charHead.append(
      imgEl(
        `pages/gameplay/player_card/${player.character}.png`,
        "pf-loadout-badge",
      ),
      el("span", "", "Character"),
    );
    const charBody = el("div", "pf-loadout-body");
    charBody.append(
      imgEl(
        `pages/gameplay/player_card/${player.character}.png`,
        "pf-loadout-art",
        player.name,
      ),
      el("strong", "pf-loadout-name", player.name),
    );
    const charBtn = el("button", "pf-gold-btn pf-gold-btn--full", "Change");
    charBtn.type = "button";
    charBtn.addEventListener("click", () => goToRoute("#character"));
    charCard.append(charHead, charBody, charBtn);

    const boardCard = el("div", "pf-loadout-card pf-loadout-card--board");
    boardCard.append(
      createCloudLayer("pf-loadout-clouds"),
      el("span", "pf-spark pf-spark--l1"),
    );
    const boardHead = el("div", "pf-loadout-head");
    boardHead.append(
      imgEl("pages/profile/icon-board-mini.png", "pf-loadout-badge"),
      el("span", "", "Equipped Board"),
    );
    const boardBody = el("div", "pf-loadout-body");
    boardBody.append(
      imgEl(
        boardThumbSrc,
        "pf-loadout-art pf-loadout-art--board",
        boardNameText,
      ),
      el("strong", "pf-loadout-name", boardNameText),
    );
    const boardBtn = el("button", "pf-gold-btn pf-gold-btn--full", "Change");
    boardBtn.type = "button";
    boardBtn.addEventListener("click", () => goToRoute("#board"));
    boardCard.append(boardHead, boardBody, boardBtn);

    loadout.append(charCard, boardCard);
    const levelPath = el("div", "panel-card");
    levelPath.append(el("h3", "panel-title", "Player levels"));
    for (const milestone of popRules.playerLevels) {
      levelPath.append(el("p", "panel-desc",
        `Lv.${milestone.level} · ${fmt(milestone.xp)} XP · ${milestone.label}${state.level >= milestone.level ? " ✓" : ""}`));
    }
    root.append(hero, nickCard, statsGrid, loadout, levelPath);
    dialogContent.append(root);
  }

  function renderMail() {
    const items = mailMessages();
    const unread = unreadMailCount();
    const headerBar = el("div", "panel-row");
    headerBar.append(
      el(
        "p",
        "panel-desc",
        unread > 0
          ? `${unread} pending gift/message`
          : "All mail claimed and read",
      ),
      unread > 0
        ? actionBtn("Claim All", "gold", () => {
            let gained = false;
            for (const m of items) {
              if (!state.readMail.includes(m.id)) state.readMail.push(m.id);
              if (m.reward && !state.claimedMail.includes(m.id)) {
                state.claimedMail.push(m.id);
                awardReward(m.reward);
                gained = true;
              }
            }
            saveState();
            syncHud();
            showToast(
              gained ? "All mail gifts claimed!" : "All mail marked as read.",
            );
            renderActivePanel();
          })
        : actionBtn("All Claimed", "claimed"),
    );

    const list = el("div", "panel-list");
    for (const m of items) {
      const claimed = state.claimedMail.includes(m.id);
      const isPending = m.reward ? !claimed : !state.readMail.includes(m.id);
      const card = el("div", "panel-card panel-mail-card");
      card.dataset.unread = String(isPending);

      const top = el("div", "panel-row");
      const titleGroup = el("div", "panel-row-start");
      if (isPending) titleGroup.append(el("span", "panel-unread-dot"));
      const text = el("div", "min-w-0 flex-1");
      text.append(
        el("h4", "panel-title", m.title),
        el("p", "panel-desc", `${m.from} · ${m.time}`),
      );
      titleGroup.append(text);
      top.append(titleGroup);

      card.append(top, el("p", "panel-desc", m.body));

      const footer = el("div", "panel-row");
      if (m.reward) {
        const icon = m.reward.items
          ? "pages/gameplay/dock/skill-blast.png"
          : m.reward.coins
            ? "pages/home/hud/coin.png"
            : "pages/home/hud/gem.png";
        footer.append(chipEl(icon, m.reward.label));
        footer.append(
          claimed
            ? actionBtn("Claimed", "claimed")
            : actionBtn("Claim", "gold", () => {
                if (!state.readMail.includes(m.id)) state.readMail.push(m.id);
                state.claimedMail.push(m.id);
                awardReward(m.reward);
                showToast(`Mail claimed: ${m.reward.label}!`);
                renderActivePanel();
              }),
        );
      } else {
        footer.append(
          badgeEl("INFO", "purple"),
          isPending
            ? actionBtn("Mark Read", "blue", () => {
                if (!state.readMail.includes(m.id)) state.readMail.push(m.id);
                saveState();
                syncHud();
                renderActivePanel();
              })
            : actionBtn("Read", "claimed"),
        );
      }
      card.append(footer);
      list.append(card);
    }

    dialogContent.append(headerBar, list);
  }

  function renderRanking() {
    const [tabBar, tab] = renderTabs("ranking", [
      { id: "records", label: "Records" }, { id: "ranked", label: "Ranked" }, { id: "frenzy", label: "Frenzy" },
    ]);
    const card = el("div", "panel-card");
    dialogContent.append(tabBar, card);
    if (tab === "records") {
      card.append(el("h3", "panel-title", "Personal mode records"));
      for (const [mode, result] of Object.entries(state.modeRecords ?? {})) {
        card.append(el("p", "panel-desc", `${popRules.getMode(mode).name} · ${fmt(result.score)} pts · Lv.${result.level} · ${(result.elapsed / 1000).toFixed(1)}s`));
      }
      if (!state.modeRecords) card.append(el("p", "panel-desc", "Finish a match to set a record."));
      const stars = sequenceStars();
      if (stars) card.append(el("p", "panel-desc", `Sequence · ${stars} stars`));
      return;
    }
    if (tab === "ranked") {
      card.append(el("h3", "panel-title", "Ranked Season"));
      const live = liveEventsData?.ranked;
      if (!live) {
        card.append(el("p", "panel-desc", "Connect to the game server to see season standings."));
        return;
      }
      card.append(el("p", "panel-desc", `${live.tier} · ${live.points} RP · Ends ${eventEndsAt(live.endsAt)}`));
      if (!live.standings.length) card.append(el("p", "panel-desc", "No ranked results this season."));
      live.standings.forEach((entry, index) => card.append(el("p", "panel-desc", `${index + 1}. ${entry.name} · ${entry.points} RP`)));
      return;
    }

    card.append(el("h3", "panel-title", "Frenzy Survival Leaderboard"), el("p", "panel-desc", "Loading standings…"));
    multiplayer.frenzyRecords().then((data) => {
      if (!card.isConnected) return;
      card.lastElementChild.remove();
      if (!data) {
        card.append(el("p", "panel-desc", "Connect to the game server to see Frenzy standings."));
        return;
      }
      for (const [period, label] of [["weekly", "This week · resets Monday (UTC)"], ["overall", "All time"]]) {
        const group = el("details");
        group.open = period === "weekly";
        group.append(el("summary", "panel-title", label));
        if (!data[period]?.length) group.append(el("p", "panel-desc", "No recorded online runs yet."));
        (data[period] ?? []).forEach((rival, index) => {
          group.append(el("p", "panel-desc", `${index + 1}. ${rival.name} · ${rival.streak} streak`));
        });
        card.append(group);
      }
    });
  }

  const panelMeta = {
    deck: {
      title: "Setting",
      subtitle: "Skills & match settings",
      wallet: true,
      render: renderDeck,
    },
    events: {
      title: "Events",
      subtitle: "Limited-Time Pop Festivals",
      wallet: false,
      render: renderEvents,
    },
    missions: {
      title: "Missions",
      subtitle: "Complete tasks for Coins & Gems",
      icon: "pages/home/icon/missions.png",
      wallet: false,
      render: renderMissions,
    },
    shop: {
      title: "Pop Shop",
      subtitle: "Board · Bundle · Background",
      icon: "pages/home/icon/shop.png",
      wallet: true,
      render: renderShop,
    },
    rewards: {
      title: "Rewards",
      subtitle: "Daily Login Bonus Streak",
      icon: "pages/rewards/icon-gift-top.png",
      wallet: true,
      render: renderRewards,
    },
    inventory: {
      title: "Inventory",
      subtitle: "Your Items, Boards & Wallet",
      icon: "pages/home/navigation/inventory.png",
      wallet: true,
      render: renderInventory,
    },
    coins: {
      title: "Add Points",
      subtitle: "Top up Coins & Daily Bonuses",
      icon: "pages/home/hud/coin.png",
      wallet: true,
      render: renderCoins,
    },
    gems: {
      title: "Add Gems",
      subtitle: "Top up Gems (Preview)",
      icon: "pages/home/hud/gem.png",
      wallet: true,
      render: renderGems,
    },
    profile: {
      title: "Player Profile",
      subtitle: "Identity, Stats & Loadout",
      icon: "pages/home/hud/avatar_luna.png",
      wallet: false,
      render: renderProfile,
    },
    mail: {
      title: "Pesan & Mail",
      subtitle: "Inbox & Gift Attachments",
      icon: "pages/home/hud/mail.png",
      wallet: false,
      render: renderMail,
    },
    ranking: {
      title: "Ranking",
      subtitle: "Mode records and online standings",
      icon: "pages/home/button/ranking.png",
      wallet: false,
      render: renderRanking,
    },
    chat: {
      title: "Room Chat",
      subtitle: "Messages stay in this preview",
      icon: "pages/Waiting_Room/button/chat.png",
      wallet: false,
    },
    fullscreen: {
      title: "Full Screen",
      subtitle: "Display Mode",
      icon: "",
      wallet: false,
    },
  };

  function renderActivePanel() {
    if (!activePanel) return;
    const meta = panelMeta[activePanel];
    if (!meta) return;

    const isProfile = activePanel === "profile";
    const isMissions = activePanel === "missions";
    const isRewards = activePanel === "rewards";
    const isShop = activePanel === "shop";
    dialog.dataset.panel = activePanel;
    if (profileTopper) profileTopper.hidden = !isProfile;
    profileHeaderStars.forEach((star) => {
      star.hidden = !isProfile;
    });
    if (missionsTopper) missionsTopper.hidden = !isMissions;
    if (missionsFooter) missionsFooter.hidden = !isMissions;
    if (missionsHeaderMascot) missionsHeaderMascot.hidden = !isMissions;
    if (missionsHeaderCastle) missionsHeaderCastle.hidden = !isMissions;
    if (rewardsAmbient) rewardsAmbient.hidden = !isRewards;
    if (shopAmbient) shopAmbient.hidden = !isShop;

    dialogTitle.textContent = meta.title;
    dialogSubtitle.textContent = meta.subtitle;
    dialogSubtitle.hidden = !meta.subtitle;

    if (meta.icon && !isMissions) {
      dialogIcon.src = isProfile
        ? `pages/gameplay/player_card/${activePlayer().character}.png`
        : meta.icon;
      dialogIcon.hidden = false;
    } else {
      dialogIcon.hidden = true;
    }

    dialogWallet.hidden = !meta.wallet;
    chatContent.hidden = activePanel !== "chat";
    dialogContent.hidden = activePanel === "chat";
    dialogContent.replaceChildren();

    if (activePanel === "fullscreen") {
      const card = el("div", "panel-card");
      card.append(
        el("h3", "panel-title", "Full-screen mode is unavailable"),
        el(
          "p",
          "panel-desc",
          "Full-screen mode is unavailable in this tab. Try opening Pop Rush directly in your browser.",
        ),
      );
      dialogContent.append(card);
    } else if (meta.render) {
      meta.render();
    }

    syncHud();
  }

  function open(name) {
    if (!panelMeta[name]) return;
    activePanel = name;
    dialogToast.hidden = true;
    renderActivePanel();
    dialogBody.scrollTop = 0;
    if (!dialog.open) dialog.showModal();
    if (["events", "mail", "missions", "ranking"].includes(name)) refreshLiveEvents();
  }

  function close() {
    closeTopLayer(dialog);
  }

  syncHud();
  return { open, close, syncHud, refreshLiveEvents, matchBoosters, consumeMatchBooster,
    getSkillUpgrades: () => ({ shield: state.skillUpgrades?.shield === 2 ? 2 : 1 }), getXp: () => state.xp, getPlayerLevel: () => state.level,
    modeUnlocked: (id) => Object.hasOwn(popRules.modes, id) && state.level >= popRules.modes[id].unlockLevel,
    getCoins: () => state.coins, getGems: () => state.gems, getNickname: playerDisplayName,
    spendCoins, settleMatchSkillCoins, recordModeResult, exchangeCoins, awardReward,
    getCosmetic: (key) => state.cosmetics?.[key],
    getLobbyCosmetics: () => ({ frame: state.cosmetics?.avatarFrame, title: state.cosmetics?.playerTitle }),
    getModeRecord: (mode) => state.modeRecords?.[mode] };
})();
