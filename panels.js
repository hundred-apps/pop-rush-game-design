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
  const hudGemsValue = document.querySelector("#hud-gems-value");
  const hudProfileLevel = document.querySelector("#hud-profile-level");
  const mailButton = document.querySelector(".mail");
  const mailCountBadge = mailButton?.querySelector(".mail-count");

  const defaultState = {
    coins: 24580,
    gems: 980,
    nickname: "",
    level: 12,
    xp: 2480,
    xpMax: 3000,
    stats: { matches: 48, wins: 31, totalPops: 1284, bestRank: 1 },
    items: { blast: 4, shield: 3, rush: 5, freeze: 2 },
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
      return {
        ...structuredClone(defaultState),
        ...saved,
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
  let activePanel = null;
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
        body: "Climb the Season 1 leaderboard by clearing all 4 stages in under 45 seconds.",
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
    if (reward.xp) state.xp = Math.min(state.xpMax, state.xp + reward.xp);
    if (reward.items) {
      for (const [key, qty] of Object.entries(reward.items)) {
        state.items[key] = (state.items[key] ?? 0) + qty;
      }
    }
    saveState();
    syncHud();
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

  const skillMeta = [
    {
      id: "blast",
      name: "Blast",
      icon: "pages/gameplay/dock/skill-blast.png",
      desc: "Pop an extra green target burst.",
    },
    {
      id: "shield",
      name: "Shield",
      icon: "pages/gameplay/dock/skill-shield.png",
      desc: "Block one wrong-pop board lock.",
    },
    {
      id: "rush",
      name: "Rush",
      icon: "pages/gameplay/dock/skill-rush.png",
      desc: "Trigger stage Pop Rush instantly.",
    },
    {
      id: "freeze",
      name: "Freeze",
      icon: "pages/gameplay/dock/skill-freeze.png",
      desc: "Slow rival progress briefly.",
    },
  ];

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

  function renderEvents() {
    const assetFolder = "pages/events/popup/";
    const milestones = [
      {
        id: "ev-1",
        title: "First Rush Warmup ea ea",
        description: "Complete 1 Quick Match",
        progress: 1,
        target: 1,
        currency: "coins",
        amount: 500,
      },
      {
        id: "ev-2",
        title: "Green Bubble Hunter",
        description: "Pop 50 green target bubbles",
        progress: 35,
        target: 50,
        currency: "gems",
        amount: 25,
      },
      {
        id: "ev-3",
        title: "Board Explorer",
        description: "Win 3 matches on custom boards",
        progress: 1,
        target: 3,
        currency: "coins",
        amount: 1500,
      },
    ];

    function artwork(asset, description = "", tag = "div") {
      const node = el(tag, `event-art event-art--${asset}`);
      node.append(imgEl(`${assetFolder}${asset}.png`, "", description));
      return node;
    }

    const root = el("div", "event-popup");
    const wallet = artwork("wallet");
    for (const currency of ["coins", "gems"]) {
      const amount = fmt(state[currency]);
      const button = el(
        "button",
        `event-wallet-button event-wallet-button--${currency}`,
      );
      button.type = "button";
      button.setAttribute("aria-label", `Add ${currency}, balance ${amount}`);
      button.append(el("strong", "event-wallet-amount", amount));
      button.addEventListener("click", () => open(currency));
      wallet.append(button);
    }

    const banner = document.querySelector("#event-banner-template");
    root.append(wallet, banner.content.cloneNode(true));

    for (const milestone of milestones) {
      const { id, title, description, progress, target, currency, amount } = milestone;
      const claimed = state.claimedEvents.includes(id);
      const ready = progress >= target;
      const rewardLabel = `+${fmt(amount)} ${currency === "coins" ? "Coins" : "Gems"}`;
      const card = el("article", "event-milestone");
      const copy = el("div", "event-milestone-copy");
      copy.append(
        el("h4", "event-milestone-title", title),
        el("p", "event-milestone-description", description),
        el("p", "event-milestone-reward", rewardLabel),
      );

      const action = el("button", "event-milestone-action", claimed ? "Claimed" : ready ? "Claim" : "Play");
      action.type = "button";
      action.dataset.state = claimed ? "claimed" : ready ? "claim" : "play";
      action.disabled = claimed;
      if (!claimed && ready) {
        action.setAttribute("aria-label", `Claim ${title} reward`);
        action.addEventListener("click", () => {
          if (state.claimedEvents.includes(id)) return;
          state.claimedEvents.push(id);
          awardReward({ [currency]: amount });
          renderActivePanel();
          dialogClose.focus({ preventScroll: true });
          showToast(`Festival reward claimed: ${rewardLabel}!`);
        });
      } else if (!claimed) {
        action.setAttribute("aria-label", `Play Quick Match for ${title}`);
        action.addEventListener("click", () => goToRoute("#room"));
      }

      const progressRow = el("div", "event-milestone-progress");
      const track = el("div", "event-progress-track");
      const value = Math.min(target, Math.max(0, progress));
      track.setAttribute("role", "progressbar");
      track.setAttribute("aria-label", `${title} progress`);
      track.setAttribute("aria-valuemax", target);
      track.setAttribute("aria-valuenow", value);
      const fill = el("span", "event-progress-fill");
      fill.style.width = `${(value / target) * 100}%`;
      track.append(fill);
      const count = el("span", "event-progress-count", `${value}/${target}`);
      count.setAttribute("aria-hidden", "true");
      progressRow.append(track, count);
      card.append(copy, action, progressRow);
      root.append(card);
    }

    const play = artwork("play-quick-match", "Play Quick Match", "button");
    play.type = "button";
    play.addEventListener("click", () => goToRoute("#room"));
    root.append(play);
    dialogContent.append(root);
  }

  function renderMissions() {
    const tabItems = [
      { id: "daily", label: "Daily" },
      { id: "weekly", label: "Weekly" },
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

    const allMissions = {
      daily: [
        {
          id: "d1",
          title: "Quick Match Starter",
          desc: "Enter a Quick Match room with Luna",
          cur: 1,
          max: 1,
          reward: { coins: 300 },
          rewardLabel: "+300 Coins",
          art: "pages/missions/art-quick-match.png",
          rewardIcon: "pages/home/hud/coin.png",
          route: "#room",
        },
        {
          id: "d2",
          title: "Board Stylist",
          desc: "Equip Rainbow Pop, Star Pop, or Paw Pop",
          cur: 1,
          max: 1,
          reward: { gems: 15 },
          rewardLabel: "+15 Gems",
          art: "pages/missions/art-board-stylist.png",
          rewardIcon: "pages/home/hud/gem.png",
          route: "#board",
        },
        {
          id: "d3",
          title: "Clean Sweeper",
          desc: "Pop 28 target bubbles in one day",
          cur: 18,
          max: 28,
          reward: { coins: 600 },
          rewardLabel: "+600 Coins",
          art: "pages/missions/art-clean-sweeper.png",
          rewardIcon: "pages/home/hud/coin.png",
          route: "#room",
        },
      ],
      weekly: [
        {
          id: "w1",
          title: "Party Host",
          desc: "Play 5 Private Room matches with friends",
          cur: 2,
          max: 5,
          reward: { gems: 80 },
          rewardLabel: "+80 Gems",
          art: "pages/missions/art-party-host.png",
          rewardIcon: "pages/home/hud/gem.png",
          route: "#private-room",
        },
        {
          id: "w2",
          title: "Speed Runner",
          desc: "Clear all 4 stages 10 times",
          cur: 7,
          max: 10,
          reward: { coins: 2000 },
          rewardLabel: "+2,000 Coins",
          art: "pages/missions/art-speed-runner.png",
          rewardIcon: "pages/home/hud/coin.png",
          route: "#room",
        },
        {
          id: "w3",
          title: "Champion Podium",
          desc: "Finish 1st place in Quick Match",
          cur: 1,
          max: 1,
          reward: { gems: 45 },
          rewardLabel: "+45 Gems",
          art: "pages/missions/art-champion-podium.png",
          rewardIcon: "pages/home/hud/gem.png",
          route: "#room",
        },
      ],
    };

    const rows = allMissions[tab];
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
      el("span", "", `${tab === "daily" ? "Daily" : "Weekly"} Progress`),
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
          state.claimedMissions.push(m.id);
          awardReward({ ...m.reward, xp: 120 });
          showToast(`Mission claimed: ${m.rewardLabel}!`);
          renderActivePanel();
        });
      } else {
        cta = el("button", "ms-btn ms-btn--go", "Go");
        cta.type = "button";
        cta.addEventListener("click", () => goToRoute(m.route));
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
    if (tab !== "board" && tab !== "bundle" && tab !== "background")
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
      for (const item of skillMeta) {
        const card = el("div", "panel-card");
        const top = el("div", "panel-row");
        top.append(
          imgEl(item.icon, "panel-thumb"),
          badgeEl(`×${state.items[item.id] ?? 0}`, "mint"),
        );
        card.append(
          top,
          el("h4", "panel-title", item.name),
          el("p", "panel-desc", item.desc),
          actionBtn("Buy More", "blue", () => open("shop")),
        );
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
        id: "bonus-coin",
        amount: 500,
        gemsCost: 0,
        tag: "BONUS",
        tone: "purple",
        title: "+500 Coins",
      },
      {
        id: "c2500",
        amount: 2500,
        gemsCost: 50,
        tag: "",
        tone: "",
        title: "+2,500 Coins",
      },
      {
        id: "c6000",
        amount: 6000,
        gemsCost: 110,
        tag: "",
        tone: "",
        title: "+6,000 Coins",
      },
      {
        id: "c15000",
        amount: 15000,
        gemsCost: 250,
        tag: "POPULAR",
        tone: "",
        title: "+15,000 Coins",
      },
      {
        id: "c35000",
        amount: 35000,
        gemsCost: 500,
        tag: "BEST VALUE",
        tone: "pink",
        title: "+35,000 Coins",
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
              if (state.gems < pack.gemsCost) {
                showToast("Not enough Gems!", "warn");
                return;
              }
              state.gems -= pack.gemsCost;
              awardReward({ coins: pack.amount });
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
      `LEVEL ${state.level} \u2022 STAR POPPER`,
    );
    const heroName = el("h3", "pf-hero-name", displayName);

    const xpWrap = el("div", "pf-xp-wrap");
    const xpMeta = el("div", "pf-xp-meta");
    xpMeta.append(
      el("span", "", "XP Progress"),
      el("strong", "", `${fmt(state.xp)} / ${fmt(state.xpMax)}`),
    );
    const xpTrack = el("div", "pf-xp-track");
    const xpFill = el("span", "pf-xp-fill");
    const xpPct =
      state.xpMax > 0
        ? Math.max(0, Math.min(100, Math.round((state.xp / state.xpMax) * 100)))
        : 0;
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
        value: `#${state.stats.bestRank}`,
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
    root.append(hero, nickCard, statsGrid, loadout);
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
      { id: "global", label: "Global" },
      { id: "friends", label: "Friends" },
    ]);

    const player = activePlayer();
    const selfName = playerDisplayName();
    const selfScore =
      2480 +
      state.claimedMissions.length * 40 +
      state.claimedRewards.length * 25;

    const baseGlobal = [
      { name: "Kiko", character: "kiko", level: 13, score: 2940 },
      { name: "Rex", character: "rex", level: 11, score: 2360 },
      { name: "Momo", character: "momo", level: 10, score: 2190 },
      { name: "Boba", character: "luna", level: 11, score: 2040 },
      { name: "Pip", character: "kiko", level: 9, score: 1890 },
    ];
    const baseFriends = [
      { name: "Kiko", character: "kiko", level: 13, score: 2940 },
      { name: "Rex", character: "rex", level: 11, score: 2360 },
      { name: "Momo", character: "momo", level: 10, score: 2190 },
    ];
    const entries = [
      ...(tab === "global" ? baseGlobal : baseFriends),
      {
        name: selfName,
        character: player.character,
        level: state.level,
        score: selfScore,
        self: true,
      },
    ].sort((a, b) => b.score - a.score);

    const podiumOrder = [entries[1], entries[0], entries[2]];
    const podium = el("div", "panel-podium");
    const podiumRanks = [2, 1, 3];
    podiumOrder.forEach((entry, i) => {
      if (!entry) return;
      const slot = el(
        "div",
        podiumRanks[i] === 1
          ? "panel-podium-slot panel-podium-slot--first"
          : "panel-podium-slot",
      );
      if (podiumRanks[i] === 1) slot.append(el("span", "panel-podium-crown"));
      slot.append(
        badgeEl(`#${podiumRanks[i]}`, podiumRanks[i] === 1 ? "" : "purple"),
        imgEl(`pages/match_results/characters/${entry.character}.png`),
        el(
          "strong",
          "panel-title",
          entry.self ? `${entry.name} (You)` : entry.name,
        ),
        el("span", "panel-desc", `${fmt(entry.score)} pts`),
      );
      podium.append(slot);
    });

    const list = el("div", "panel-list");
    entries.forEach((entry, index) => {
      const rank = index + 1;
      const row = el(
        "div",
        entry.self ? "panel-rank-row panel-rank-row--self" : "panel-rank-row",
      );
      row.dataset.rank = String(rank);
      const info = el("div", "min-w-0");
      info.append(
        el(
          "h4",
          "panel-title",
          entry.self ? `${entry.name} (You)` : entry.name,
        ),
        el("p", "panel-desc", `Lv.${entry.level}`),
      );
      row.append(
        el("span", "panel-rank-num", String(rank)),
        imgEl(`pages/gameplay/player_card/${entry.character}.png`),
        info,
        el("strong", "panel-title", `${fmt(entry.score)} pts`),
      );
      list.append(row);
    });

    const yourRank = entries.findIndex((e) => e.self) + 1;
    const footerCard = el("div", "panel-card panel-card--highlight");
    const footerRow = el("div", "panel-row");
    footerRow.append(
      el("span", "panel-title", `Your Rank: #${yourRank}`),
      chipEl("pages/home/hud/coin.png", `${fmt(selfScore)} pts`),
    );
    footerCard.append(footerRow);

    dialogContent.append(tabBar, podium, list, footerCard);
  }

  const panelMeta = {
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
      subtitle: "Season 1 Leaderboard",
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
  }

  function close() {
    closeTopLayer(dialog);
  }

  syncHud();
  return { open, close, syncHud };
})();
