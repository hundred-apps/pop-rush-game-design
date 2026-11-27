const { mkdirSync, readFileSync, renameSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");
const { eventPeriod } = require("./gameplay-rules.js");

const tiers = [
  ["Bronze", 0], ["Silver", 100], ["Gold", 250],
  ["Platinum", 450], ["Diamond", 700], ["Grand Popper", 1000],
];

function tierFor(points) {
  let index = tiers.length - 1;
  while (points < tiers[index][1]) index -= 1;
  return index;
}

function createLiveEvents(directory) {
  const path = join(directory, "live-events.json");
  let state = { rankings: {}, global: null };
  try {
    state = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") console.error("Could not load live events", error.message);
  }

  function points(id, now) {
    return state.rankings[id]?.seasons[eventPeriod(now, 30).id]?.points ?? 0;
  }

  function commit() {
    try {
      mkdirSync(directory, { recursive: true });
      writeFileSync(path + ".tmp", JSON.stringify(state));
      renameSync(path + ".tmp", path);
    } catch (error) {
      console.error("Could not save live events", error.message);
    }
  }

  function record(players, winner, ranked, now = Date.now()) {
    const participants = players.filter((player) => !player.bot && player.profileId);
    if (!participants.length) return;
    const rotation = eventPeriod(now, 7).id;
    if (state.global?.id !== rotation) state.global = { id: rotation, total: 0, contributions: {} };
    for (const player of participants) {
      const { profileId, pops } = player;
      state.global.total += pops;
      state.global.contributions[profileId] = (state.global.contributions[profileId] ?? 0) + pops;
    }
    if (ranked && participants.length === 2 && participants[0].profileId !== participants[1].profileId) {
      const season = eventPeriod(now, 30).id;
      for (const player of participants) {
        const entry = state.rankings[player.profileId] ??= { seasons: {} };
        entry.name = player.name;
        entry.character = player.character;
        const result = entry.seasons[season] ??= { points: 0, peak: 0 };
        result.points = Math.max(0, result.points + (player.seat === winner ? 25 : -15));
        result.peak = Math.max(result.peak, result.points);
      }
    }
    commit();
  }

  function snapshot(id, now = Date.now()) {
    const { id: week, endsAt: milestoneEndsAt } = eventPeriod(now, 7);
    const { id: season, endsAt: seasonEndsAt } = eventPeriod(now, 30);
    const entry = state.rankings[id];
    const rankedPoints = points(id, now);
    const standings = Object.values(state.rankings).filter((player) => player.seasons[season]?.points > 0)
      .map(({ name, character, seasons }) => ({ name, character, points: seasons[season].points }))
      .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
      .slice(0, 100);
    const inbox = Object.entries(entry?.seasons ?? {}).filter(([key]) => Number(key) < season)
      .map(([key, result]) => {
        const index = tierFor(result.peak);
        return { id: `ranked-season-${key}`, title: `${tiers[index][0]} season reward`,
          coins: 300 + 250 * index, gems: 5 * index };
      });
    return {
      milestone: { id: week, endsAt: milestoneEndsAt,
        total: state.global?.id === week ? state.global.total : 0,
        contribution: state.global?.id === week ? state.global.contributions[id] ?? 0 : 0 },
      ranked: { season, endsAt: seasonEndsAt, points: rankedPoints, tier: tiers[tierFor(rankedPoints)][0],
        diamond: Object.values(entry?.seasons ?? {}).some((result) => result.peak >= 700), standings, inbox },
    };
  }

  return { record, snapshot, rank: (id) => tierFor(points(id, Date.now())) };
}

module.exports = { createLiveEvents };
