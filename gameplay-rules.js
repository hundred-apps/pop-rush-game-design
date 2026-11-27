const popRules = (() => {
  const defaultStages = [
    [0, 3, 5, 6, 8, 10, 13],
    [1, 2, 4, 7, 9, 11, 14],
    [0, 2, 5, 7, 8, 11, 15],
    [1, 3, 4, 6, 9, 12, 14],
  ];

  const defaultTargetCount = defaultStages.reduce((total, targets) => total + targets.length, 0);

  function withStageMeta(board) {
    return {
      ...board,
      targetCount: board.stages.reduce((total, targets) => total + targets.length, 0),
    };
  }

  const boards = [
    { id: "classic_rush", name: "Aqua Wave", layout: "grid", sizeLabel: "4 × 4", ariaShape: "4 by 4", cellCount: 16, stages: defaultStages },
    { id: "color_hunt", name: "Sapphire Blue", layout: "grid", sizeLabel: "4 × 4", ariaShape: "4 by 4", cellCount: 16, stages: defaultStages },
    { id: "memory_rush", name: "Royal Gem", layout: "grid", sizeLabel: "4 × 4", ariaShape: "4 by 4", cellCount: 16, stages: defaultStages },
    { id: "pink_stage", name: "Candy Pink", layout: "grid", sizeLabel: "4 × 4", ariaShape: "4 by 4", cellCount: 16, stages: defaultStages },
    {
      id: "rainbow_pop",
      name: "Rainbow Pop",
      layout: "custom",
      sizeLabel: "4 × 4",
      ariaShape: "4 by 4",
      cellCount: 16,
      stages: defaultStages,
      cells: [
        { x: 22.70, y: 22.64, d: 15.9, row: 1, column: 1 },
        { x: 41.15, y: 22.77, d: 15.9, row: 1, column: 2 },
        { x: 59.12, y: 22.70, d: 15.9, row: 1, column: 3 },
        { x: 77.23, y: 22.70, d: 15.9, row: 1, column: 4 },
        { x: 22.70, y: 40.41, d: 15.9, row: 2, column: 1 },
        { x: 41.08, y: 40.20, d: 15.9, row: 2, column: 2 },
        { x: 59.26, y: 40.20, d: 15.9, row: 2, column: 3 },
        { x: 77.57, y: 40.20, d: 15.9, row: 2, column: 4 },
        { x: 22.70, y: 57.84, d: 15.9, row: 3, column: 1 },
        { x: 41.15, y: 57.77, d: 15.9, row: 3, column: 2 },
        { x: 59.39, y: 57.77, d: 15.9, row: 3, column: 3 },
        { x: 77.70, y: 57.77, d: 15.9, row: 3, column: 4 },
        { x: 22.77, y: 75.54, d: 15.9, row: 4, column: 1 },
        { x: 41.28, y: 75.47, d: 15.9, row: 4, column: 2 },
        { x: 59.39, y: 75.47, d: 15.9, row: 4, column: 3 },
        { x: 77.57, y: 75.47, d: 15.9, row: 4, column: 4 },
      ],
    },
    {
      id: "star_pop",
      name: "Star Pop",
      layout: "custom",
      sizeLabel: "11 Bubbles",
      ariaShape: "11-bubble star",
      cellCount: 11,
      stages: [
        [0, 1, 4, 6, 8],
        [2, 3, 5, 7, 9],
        [0, 2, 5, 8, 10],
        [1, 3, 4, 6, 10],
      ],
      cells: [
        { x: 50.47, y: 21.82, d: 17.2, row: 1, column: 1 },
        { x: 23.18, y: 42.64, d: 16.2, row: 2, column: 1 },
        { x: 41.55, y: 41.69, d: 16.1, row: 2, column: 2 },
        { x: 59.73, y: 41.69, d: 16.1, row: 2, column: 3 },
        { x: 77.84, y: 42.57, d: 16.2, row: 2, column: 4 },
        { x: 31.42, y: 60.81, d: 16.0, row: 3, column: 1 },
        { x: 50.20, y: 60.88, d: 16.2, row: 3, column: 2 },
        { x: 68.99, y: 60.81, d: 16.1, row: 3, column: 3 },
        { x: 28.85, y: 78.85, d: 16.5, row: 4, column: 1 },
        { x: 49.80, y: 78.45, d: 15.9, row: 4, column: 2 },
        { x: 70.41, y: 78.85, d: 16.5, row: 4, column: 3 },
      ],
    },
    {
      id: "paw_pop",
      name: "Paw Pop",
      layout: "custom",
      sizeLabel: "5 Bubbles",
      ariaShape: "5-bubble paw",
      cellCount: 5,
      stages: [
        [0, 2, 4],
        [1, 2, 3],
        [0, 1, 4],
        [1, 3, 4],
      ],
      cells: [
        { x: 22.16, y: 43.11, d: 21.6, row: 1, column: 1 },
        { x: 37.97, y: 25.14, d: 21.8, row: 1, column: 2 },
        { x: 62.23, y: 25.14, d: 21.8, row: 1, column: 3 },
        { x: 78.18, y: 43.11, d: 21.6, row: 1, column: 4 },
        { shape: "paw-pad", left: 20.0, top: 38.24, width: 59.19, height: 44.19, row: 2, column: 1 },
      ],
    },
  ].map(withStageMeta);

  const modeOrder = ["classic", "memory", "rush", "sequence", "color_hunt", "frenzy"];

  const modes = Object.fromEntries([
    ["classic", "Classic Hunt", "Classic", 1], ["memory", "Memory", "Memory", 3],
    ["rush", "Rush", "Rush", 2], ["sequence", "Sequence", "Sequence", 7],
    ["color_hunt", "Color Hunt", "Color", 6], ["frenzy", "Frenzy", "Frenzy", 8],
  ].map(([id, name, shortName, unlockLevel]) => [id, { id, name, shortName, unlockLevel, maxLevel: id === "frenzy" ? 1 : 15 }]));

  // Rows apply to levels 1–2, 3–5, 6–10, and 11–15 respectively.
  const levelCurves = {
    classic: [[0.2, 1000], [0.3, 1000], [0.4, 950], [0.5, 900]],
    memory: [[0.2, 1000, 900], [0.3, 950, 850], [0.4, 850, 800], [0.5, 750, 700]],
    rush: [[0.2, 3000], [0.3, 3000], [0.4, 3000], [0.5, 3000]],
    color_hunt: [[0.2, 1000, 2], [0.4, 950, 2], [0.3, 850, 3], [0.4, 700, 3]],
    sequence: [[0.2, 1000], [0.3, 950], [0.3, 800], [0.4, 700]],
  };
  const frenzyTiers = [
    [0, 1, 10, 1200, ""], [10, 2, 10, 1100, "Nice!"], [20, 2, 12, 1050, "Good!"],
    [30, 2, 14, 1000, "Great!"], [40, 2, 16, 950, "Awesome!"], [50, 2, 18, 900, "Amazing!"],
    [60, 2, 20, 850, "Fantastic!"], [70, 2, 25, 800, "Incredible!"], [80, 2, 30, 750, "Unstoppable!"],
    [90, 2, 40, 700, "Insane!"], [100, 2, 50, 650, "FEVER!"], [200, 4, 50, 550, "SUPER FRENZY!!!"],
  ].map(([streak, multiplier, points, durationMs, label]) => ({ streak, multiplier, points, durationMs, label }));

  const playerLevels = [
    { level: 1, xp: 0, slots: 1, label: "Classic · Skill Slot 1" },
    { level: 2, xp: 200, coins: 250, label: "Rush · 250 Coins" },
    { level: 3, xp: 500, skill: "shield", label: "Memory · Shield" },
    { level: 4, xp: 900, skill: "paralyze", label: "Online Multiplayer · Paralyze" },
    { level: 5, xp: 1400, slots: 2, frame: "rookie", label: "Skill Slot 2 · Rookie Popper frame" },
    { level: 6, xp: 2000, coins: 500, label: "Color Hunt · 500 Coins" },
    { level: 7, xp: 2800, skill: "blast", label: "Sequence · Blast" },
    { level: 8, xp: 3700, gems: 10, label: "Frenzy · 10 Gems" },
    { level: 10, xp: 5000, slots: 3, board: "neon", label: "Skill Slot 3 · Neon Glow" },
    { level: 15, xp: 9500, title: "Pop Master", label: "Ranked Match · Pop Master title" },
    { level: 20, xp: 15000, board: "golden", gems: 50, label: "Golden Touch · 50 Gems" },
  ];

  const boosters = {
    double_score: { name: "Double Score Ticket", desc: "Double base pop points for one match", currency: "coins", cost: 250 },
    shield_start: { name: "Shield Start Ticket", desc: "Protect the first 3 seconds of a match", currency: "coins", cost: 180 },
    xp_hour: { name: "XP Booster · 1 hour", desc: "Earn 50% more match XP for one hour", currency: "gems", cost: 15 },
  };

  const playerThresholds = Array.from({ length: 20 }, (_, index) => {
    const level = index + 1;
    const upper = playerLevels.findIndex((entry) => entry.level >= level);
    const next = playerLevels[upper];
    if (next.level === level) return next.xp;
    const previous = playerLevels[upper - 1];
    return Math.round(previous.xp + (next.xp - previous.xp) * (level - previous.level) / (next.level - previous.level));
  });

  function getPlayerLevel(xp) {
    const total = Number.isFinite(xp) ? xp : 0;
    const next = playerThresholds.findIndex((threshold) => threshold > total);
    return { level: next < 0 ? 20 : Math.max(1, next), nextXp: next < 0 ? null : playerThresholds[next] };
  }

  function xpForPlayerLevel(level) {
    return playerThresholds[Math.max(1, Math.min(20, Math.trunc(Number(level)) || 1)) - 1];
  }

  function playerSkillSlots(xp) {
    return xp >= 5000 ? 3 : xp >= 1400 ? 2 : 1;
  }

  function skillUnlockLevel(id) {
    return playerLevels.find((entry) => entry.skill === id)?.level ?? 1;
  }

  function allowedPlayerLoadout(ids, allowAttack, xp) {
    const level = getPlayerLevel(xp).level;
    return normalizeLoadout(ids, allowAttack).filter((id) => level >= skillUnlockLevel(id)).slice(0, playerSkillSlots(xp));
  }

  function normalizeGameLevel(mode, level) {
    return Math.max(1, Math.min(getMode(mode).maxLevel, Math.trunc(Number(level)) || 1));
  }

  function getGameLevel(mode, level) {
    if (!Object.hasOwn(levelCurves, mode)) return { ratio: 0.5, sessions: 1 };
    const current = normalizeGameLevel(mode, level);
    const band = current <= 2 ? 0 : current <= 5 ? 1 : current <= 10 ? 2 : 3;
    const [ratio, durationMs, extra] = levelCurves[mode][band];
    return {
      ratio, durationMs, sessions: [5, 7, 8, 9][band],
      gapMs: mode === "memory" ? extra : null,
      colors: mode === "color_hunt" ? extra : null,
    };
  }

  function getFrenzyTier(streak) {
    const next = frenzyTiers.findIndex((tier) => tier.streak > streak);
    return frenzyTiers[next < 0 ? frenzyTiers.length - 1 : Math.max(0, next - 1)];
  }

  const colorHuntColors = [
    { id: "red", label: "RED" },
    { id: "green", label: "GREEN" },
    { id: "yellow", label: "YELLOW" },
    { id: "blue", label: "BLUE" },
  ];

  function shuffleArray(items) {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function pickRandomIndices(cellCount, count, exclude = []) {
    const blocked = new Set(exclude);
    const pool = [];
    for (let i = 0; i < cellCount; i += 1) {
      if (!blocked.has(i)) pool.push(i);
    }
    return shuffleArray(pool).slice(0, Math.min(count, pool.length));
  }

  function targetSize(cellCount, ratio) {
    return Math.max(1, Math.round(cellCount * ratio));
  }

  function createSessionTargets(cellCount, ratio) {
    return pickRandomIndices(cellCount, targetSize(cellCount, ratio));
  }

  function sessionDuration(mode, level, cellCount) {
    const { ratio, durationMs } = getGameLevel(mode, level);
    if (mode === "rush") return durationMs;
    if (mode === "frenzy") return getFrenzyTier(0).durationMs;
    const scoredPops = mode === "sequence" ? cellCount : Math.max(1, ratio * cellCount);
    return Math.round(scoredPops * durationMs);
  }

  function memorySpillDuration(level, count) {
    return 560 + Math.max(0, count - 1) * getGameLevel("memory", level).gapMs;
  }

  function createLevelSession(mode, level, cellCount, classicColor = null) {
    const config = getGameLevel(mode, level);
    const targets = createSessionTargets(cellCount, config.ratio);
    const colorPair = mode === "color_hunt" ? pickColorHuntPair(config.colors) : classicColor;
    const decoyColors = {};
    if (colorPair?.offColors) {
      shuffleArray(Array.from({ length: cellCount }, (_, index) => index).filter((index) => !targets.includes(index)))
        .forEach((index, order) => { decoyColors[index] = colorPair.offColors[order % colorPair.offColors.length]; });
    }
    return {
      targets, pushed: [], wrongPushed: [], colorPair, decoyColors, stageCount: config.sessions,
      spillOrder: mode === "memory" ? [...targets] : [],
    };
  }

  function moveDecoyColors(colors, previous, next) {
    const removed = previous.filter((index) => !next.includes(index));
    const added = next.filter((index) => !previous.includes(index));
    removed.forEach((index, order) => {
      colors[index] = colors[added[order]];
      delete colors[added[order]];
    });
  }

  function weekStart(now) {
    const date = new Date(now);
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
    return date.getTime();
  }

  function weekendBonus(mode, online, now) {
    const day = new Date(now).getUTCDay();
    return (day === 0 || day === 6) && (online || mode === "frenzy");
  }

  function eventPeriod(now, days) {
    const dayMs = 86_400_000;
    const start = Date.UTC(2026, 10, 23);
    const duration = days * dayMs;
    const index = Math.floor((now - start) / duration);
    return { id: index, endsAt: start + (index + 1) * duration };
  }

  function createRunState(mode) {
    return {
      score: 0, lives: mode === "rush" ? null : 3, streak: 0, bestStreak: 0, energy: 0,
      effects: {}, cooldowns: {}, mistakes: 0, penalties: 0, feverBoxes: 0, flow: 0,
      flowClean: true, appearedAt: {}, sessionScore: 0, flowHits: 0, completedSessions: 0,
      perfectSessions: 0, skillUses: 0, skillCategories: {},
    };
  }

  function scoreCorrect(run, mode, now, cell) {
    run.streak += 1;
    run.bestStreak = Math.max(run.bestStreak, run.streak);
    run.energy = Math.min(100, run.energy + 20);
    const tier = mode === "frenzy" ? getFrenzyTier(run.streak) : null;
    const multiplier = tier ? tier.multiplier + Number((run.effects.frenzyBoostUntil ?? 0) > now) : 1;
    const double = run.booster === "double_score" || (run.effects.doubleUntil ?? 0) > now ? 2 : 1;
    const gold = (run.effects.goldenUntil ?? 0) > now ? 50 : 0;
    const points = (tier?.points ?? 10) * multiplier * double + gold;
    run.score += points;
    run.sessionScore += points;
    if (mode === "frenzy" && run.streak % 50 === 0) run.feverBoxes += 1;
    if (mode === "sequence" && Object.hasOwn(run.appearedAt, cell)) {
      const allowed = run.effects.timeSlowUntil > now ? 800 : 400;
      if (now - run.appearedAt[cell] < allowed) {
        run.flow += 1;
        run.flowHits += 1;
        run.lastFlowCell = cell;
      } else {
        run.flow = 0;
        run.flowClean = false;
      }
      delete run.appearedAt[cell];
    }
    return multiplier;
  }

  function resetSessionScoring(run, mode, cleared) {
    if (run.lives !== 0) run.completedSessions += 1;
    if (cleared && run.flowClean) run.perfectSessions += 1;
    if (mode === "sequence" && cleared && run.flowClean && run.flowHits > 0) {
      run.score += Math.round(run.sessionScore / 2);
    }
    Object.assign(run, { flow: 0, flowClean: true, appearedAt: {}, sessionScore: 0, flowHits: 0 });
    delete run.lastFlowCell;
  }

  function scoreWrong(run, count, now) {
    run.flowClean = false;
    run.flow = 0;
    run.mistakes += count;
    if ((run.effects.shieldUntil ?? 0) > now) return false;
    run.penalties += count;
    run.score = Math.max(0, run.score - 5 * count);
    if (run.lives !== null) run.lives = Math.max(0, run.lives - count);
    if (run.effects.streakSaver) {
      delete run.effects.streakSaver;
      if (count > 1) run.streak = 0;
    } else run.streak = 0;
    return true;
  }

  const skillDefinitions = {
    paralyze: { name: "Paralyze", kind: "attack", coins: 40, symbol: "❄", icon: "skill-freeze.png" },
    shuffle: { name: "Shuffle", kind: "attack", coins: 15, symbol: "⇄" },
    fog: { name: "Fog / Ink", kind: "attack", coins: 25, symbol: "☁" },
    fake_target: { name: "Fake Target", kind: "attack", coins: 30, symbol: "◉" },
    reverse: { name: "Reverse", kind: "attack", coins: 20, symbol: "↶" },
    shield: { name: "Shield", kind: "defend", coins: 30, symbol: "◈", icon: "skill-shield.png" },
    revive: { name: "Revive", kind: "defend", coins: 50, symbol: "♥" },
    cleanse: { name: "Cleanse", kind: "defend", coins: 25, symbol: "+" },
    time_slow: { name: "Time Slow", kind: "defend", coins: 15, symbol: "◷" },
    streak_saver: { name: "Streak Saver", kind: "defend", coins: 20, symbol: "★" },
    blast: { name: "Blast", kind: "power", coins: 20, symbol: "✷", icon: "skill-blast.png" },
    double: { name: "Double", kind: "power", coins: 25, symbol: "×2" },
    magnet: { name: "Magnet", kind: "power", coins: 45, symbol: "∪" },
    golden_bubble: { name: "Golden Bubble", kind: "power", coins: 35, symbol: "●" },
    frenzy_boost: { name: "Frenzy Boost", kind: "power", coins: 30, symbol: "↑" },
  };

  const defaultLoadout = ["double", "shield", "blast"];
  const attackWarningMs = 1500;
  const attackGraceMs = 2500;
  const skillEnergyCost = 100;

  function normalizeLoadout(ids, allowAttack) {
    if (!Array.isArray(ids)) return [...defaultLoadout];
    return [...new Set(ids)].filter((id) =>
      typeof id === "string" && Object.hasOwn(skillDefinitions, id) &&
      (allowAttack || skillDefinitions[id].kind !== "attack"),
    ).slice(0, 3);
  }

  const botLevels = {
    Easy: { id: "bot_easy", delay: [1100, 1400], accuracy: 0.75, maxStreak: 10, warningShield: 0 },
    Medium: { id: "bot_medium", delay: [800, 1050], accuracy: 0.85, maxStreak: 30, warningShield: 0 },
    Hard: { id: "bot_hard", delay: [550, 750], accuracy: 0.93, maxStreak: 60, warningShield: 0.4 },
    Insane: { id: "bot_insane", delay: [400, 520], accuracy: 0.98, maxStreak: Infinity, warningShield: 0.75 },
  };

  function botDelay([min, max]) {
    return Math.round(min + Math.random() * (max - min));
  }

  function createBotLoadout(difficulty = "Medium") {
    const attack = shuffleArray(["paralyze", "shuffle", "reverse", "fog", "fake_target"]);
    const defend = shuffleArray(["shield", "revive", "streak_saver"]);
    const power = shuffleArray(["blast", "double", "magnet", "golden_bubble"]);
    if (difficulty === "Easy") return [power[0], power[1], defend[0]];
    if (difficulty === "Insane") return [attack[0], attack[1], Math.random() < 0.5 ? "cleanse" : power[0]];
    return [attack[0], difficulty === "Hard" ? "cleanse" : defend[0], power[0]];
  }

  function chooseBotSkill(bot, now, context) {
    const { run, difficulty, skills } = bot;
    if (run.energy < skillEnergyCost) {
      bot.skillReadyAt = null;
      return;
    }
    const available = skills.filter((id) => canCastSkill(run, id, now, context));
    if (difficulty === "Easy") {
      bot.skillReadyAt ??= now + botDelay([3000, 5000]);
      if (now >= bot.skillReadyAt) return shuffleArray(available)[0];
      return;
    }
    const cleanse = available.includes("cleanse") && hasDebuff(run, now);
    if ((difficulty === "Hard" || difficulty === "Insane") && cleanse) return "cleanse";
    if (difficulty === "Medium" && run.lives !== null && run.lives < 3) {
      const defense = available.find((id) => skillDefinitions[id].kind === "defend");
      if (defense) return defense;
    }
    const attack = available.find((id) => skillDefinitions[id].kind === "attack");
    if (attack && (difficulty !== "Medium" || Math.random() < 0.4)) return attack;
    return available.find((id) => skillDefinitions[id].kind === "power");
  }

  function hasDebuff(run, now) {
    return ["paralyzeUntil", "fogUntil", "fakeUntil", "reverseUntil"].some((key) => run.effects[key] > now);
  }

  function canCastSkill(run, skill, now, { mode, targets, rivals }) {
    if (!Object.hasOwn(skillDefinitions, skill) || run.energy < skillEnergyCost || (run.cooldowns[skill] ?? 0) > now) return false;
    if (skillDefinitions[skill].kind === "attack") return rivals;
    if (skill === "revive") return run.lives !== null && run.lives > 0 && run.lives < 3;
    if (skill === "cleanse") return hasDebuff(run, now);
    if (skill === "blast" || skill === "magnet") return targets > 0;
    if (skill === "double" && run.booster === "double_score") return false;
    if (skill === "time_slow") return mode === "sequence";
    if (skill === "frenzy_boost") return mode === "frenzy";
    return true;
  }

  function castSkill(run, skill, now) {
    run.energy -= skillEnergyCost;
    run.skillUses += 1;
    const kind = skillDefinitions[skill].kind;
    run.skillCategories[kind] = (run.skillCategories[kind] ?? 0) + 1;
    switch (skill) {
      case "shield": run.effects.shieldUntil = now + (run.skillUpgrades?.shield === 2 ? 3500 : 3000); break;
      case "revive":
        run.lives += 1;
        run.cooldowns.revive = now + (run.weekend ? 8000 : 10_000);
        break;
      case "cleanse":
        for (const field of ["paralyzeUntil", "fogUntil", "fakeUntil", "reverseUntil", "fakeIds"]) delete run.effects[field];
        break;
      case "time_slow": run.effects.timeSlowUntil = now + 4000; break;
      case "streak_saver": run.effects.streakSaver = true; break;
      case "double": run.effects.doubleUntil = now + 5000; break;
      case "magnet": run.effects.magnet = true; break;
      case "golden_bubble": run.effects.goldenUntil = now + 3000; break;
      case "frenzy_boost": run.effects.frenzyBoostUntil = now + 5000; break;
    }
  }

  function landAttack(run, skill, now, cellCount, targets, pushed) {
    run.lastAttackedAt = now;
    if (run.effects.shieldUntil > now) return { blocked: true };
    if (skill === "paralyze") run.effects.paralyzeUntil = now + 2000;
    if (skill === "fog") run.effects.fogUntil = now + 4000;
    if (skill === "reverse") run.effects.reverseUntil = now + 3000;
    if (skill === "fake_target") {
      run.effects.fakeUntil = now + 4000;
      run.effects.fakeIds = pickRandomIndices(cellCount, 3, [...targets, ...pushed]);
    }
    if (skill === "shuffle") return { targets: pickRandomIndices(cellCount, targets.length, pushed) };
    return {};
  }

  function pickClassicColorPair() {
    const targetColor = colorHuntColors[Math.floor(Math.random() * colorHuntColors.length)];
    return { targetColor, offColor: null };
  }

  function pickColorHuntPair(count) {
    const [targetColor, ...offColors] = shuffleArray(colorHuntColors).slice(0, count);
    return { targetColor, offColors };
  }

  function getMode(id) {
    return Object.hasOwn(modes, id) ? modes[id] : modes.classic;
  }

  return {
    players: [
      { name: "Luna", level: 12, character: "luna" },
      { name: "Rex", level: 11, character: "rex", botIntervalMs: 1710 },
      { name: "Momo", level: 10, character: "momo", botIntervalMs: 1900 },
      { name: "Kiko", level: 13, character: "kiko", botIntervalMs: 2160 },
    ],
    stages: defaultStages,
    boards,
    modeOrder,
    modes,
    colorHuntColors,
    frenzyMaxLives: 3,
    getBoard(id) {
      return boards.find((board) => board.id === id) ?? boards[1];
    },
    pickRandomIndices,
    createSessionTargets,
    targetSize,
    createRunState,
    scoreCorrect,
    resetSessionScoring,
    scoreWrong,
    skillDefinitions,
    defaultLoadout,
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
    skillEnergyCost,
    pickClassicColorPair,
    pickColorHuntPair,
    getMode,
    getGameLevel,
    normalizeGameLevel,
    sessionDuration,
    memorySpillDuration,
    createLevelSession,
    moveDecoyColors,
    getFrenzyTier,
    playerLevels,
    boosters,
    getPlayerLevel,
    xpForPlayerLevel,
    playerSkillSlots,
    skillUnlockLevel,
    allowedPlayerLoadout,
    weekStart,
    weekendBonus,
    eventPeriod,
    targetCount: defaultTargetCount,
  };
})();

if (typeof module !== "undefined") module.exports = popRules;
