const { mkdirSync, readFileSync, renameSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");

function createFrenzyRecords(directory) {
  const file = join(directory, "frenzy.json");
  let records = {};
  try {
    records = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") console.error("Could not load Frenzy standings", error.message);
  }

  function currentWeek(now) {
    const monday = new Date(now);
    monday.setUTCHours(0, 0, 0, 0);
    monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7);
    return monday.toISOString().slice(0, 10);
  }

  function ranked(period, now = Date.now()) {
    const week = currentWeek(now);
    return Object.entries(records)
      .map(([id, record]) => ({ id, ...record[period] }))
      .filter((record) => record.streak > 0 && (period === "overall" || record.week === week))
      .sort((a, b) => b.streak - a.streak || b.score - a.score || a.at - b.at)
      .slice(0, 100);
  }

  function submit(id, name, character, streak, score, now = Date.now()) {
    if (!id || streak <= 0) return;
    const week = currentWeek(now);
    const result = { name, character, streak, score, at: now, week };
    const entry = records[id] ??= {};
    const improves = (best) => !best || streak > best.streak || (streak === best.streak && score > best.score);
    const overall = improves(entry.overall);
    const weekly = entry.weekly?.week !== week || improves(entry.weekly);
    if (!overall && !weekly) return;
    if (overall) entry.overall = result;
    if (weekly) entry.weekly = result;
    try {
      mkdirSync(directory, { recursive: true });
      writeFileSync(file + ".tmp", JSON.stringify(records));
      renameSync(file + ".tmp", file);
    } catch (error) {
      console.error("Could not save Frenzy standings", error.message);
    }
  }

  return {
    submit,
    crowned: () => new Set(ranked("weekly").map(({ id }) => id)),
    list: () => {
      const visible = ({ name, character, streak, score }) => ({ name, character, streak, score });
      return { week: currentWeek(Date.now()), weekly: ranked("weekly").map(visible), overall: ranked("overall").map(visible) };
    },
  };
}

module.exports = { createFrenzyRecords };
