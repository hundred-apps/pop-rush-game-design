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

  const modes = {
    classic: { id: "classic", name: "Classic Hunt", shortName: "Classic", maxLevel: 1, sessionsPerLevel: 4 },
    memory: { id: "memory", name: "Memory", shortName: "Memory", maxLevel: 100, sessionsPerLevel: 10, targetRatio: 0.3 },
    rush: { id: "rush", name: "Rush", shortName: "Rush", maxLevel: 1, durations: [30, 45, 60] },
    sequence: { id: "sequence", name: "Sequence", shortName: "Sequence", maxLevel: 100, sessionsPerLevel: 10, targetRatio: 0.5 },
    color_hunt: { id: "color_hunt", name: "Color Hunt", shortName: "Color", maxLevel: 100, sessionsPerLevel: 10, targetRatio: 0.5 },
    frenzy: { id: "frenzy", name: "Frenzy", shortName: "Frenzy", maxLevel: 1, sessionsPerLevel: 1, targetRatio: 0.5 },
  };

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

  function createClassicStages(board) {
    const active = board ?? boards[1];
    return active.stages.map((stage) =>
      pickRandomIndices(active.cellCount, stage.length).sort((a, b) => a - b),
    );
  }

  function createSessionTargets(cellCount, ratio) {
    const count = Math.max(1, Math.min(cellCount, Math.round(cellCount * ratio)));
    return pickRandomIndices(cellCount, count);
  }

  function pickClassicColorPair() {
    const targetColor = colorHuntColors[Math.floor(Math.random() * colorHuntColors.length)];
    return { targetColor, offColor: null };
  }

  function pickColorHuntPair() {
    const [targetColor, offColor] = shuffleArray(colorHuntColors);
    return { targetColor, offColor };
  }

  function getMode(id) {
    return modes[id] ?? modes.classic;
  }

  function getNextMode(modeId) {
    const index = modeOrder.indexOf(modeId);
    if (index < 0 || index >= modeOrder.length - 1) return null;
    return modeOrder[index + 1];
  }

  function getMemorySpillTiming(level) {
    const lv = Math.max(1, Math.min(100, Number(level) || 1));
    const t = (lv - 1) / 99;
    return {
      onMs: Math.round(420 - t * 200),
      offMs: Math.round(160 - t * 70),
    };
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
    createClassicStages,
    createSessionTargets,
    pickClassicColorPair,
    pickColorHuntPair,
    getMode,
    getNextMode,
    getMemorySpillTiming,
    matchDurationMs: 45_000,
    wrongPopLockMs: 1000,
    targetCount: defaultTargetCount,
  };
})();

if (typeof module !== "undefined") module.exports = popRules;
