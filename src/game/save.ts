import type { ScoreRow } from "./types";

const KEY = "aetherwake-save";
const VERSION = 1;
const MAX_SCORES = 8;

export type Settings = {
  mute: boolean;
  shake: boolean;
};

export type SaveData = {
  version: number;
  scores: ScoreRow[];
  settings: Settings;
};

const DEFAULTS: SaveData = {
  version: VERSION,
  scores: [],
  settings: { mute: false, shake: true },
};

function migrate(raw: SaveData): SaveData {
  const s = { ...DEFAULTS, ...raw, settings: { ...DEFAULTS.settings, ...raw.settings } };
  s.version = VERSION;
  s.scores = Array.isArray(s.scores) ? s.scores.slice(0, MAX_SCORES) : [];
  return s;
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULTS);
    const parsed = JSON.parse(raw) as SaveData;
    if (!parsed || typeof parsed !== "object") return structuredClone(DEFAULTS);
    return migrate(parsed);
  } catch {
    return structuredClone(DEFAULTS);
  }
}

export function writeSave(data: SaveData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* private mode / quota */
  }
}

export function loadSettings(): Settings {
  return loadSave().settings;
}

export function saveSettings(settings: Settings) {
  const data = loadSave();
  data.settings = settings;
  writeSave(data);
}

export function getScores(): ScoreRow[] {
  return loadSave().scores;
}

export function qualifies(score: number): boolean {
  const scores = getScores();
  if (scores.length < MAX_SCORES) return score > 0;
  return score > (scores[scores.length - 1]?.score ?? 0);
}

export function submitScore(row: ScoreRow): ScoreRow[] {
  const data = loadSave();
  data.scores = [...data.scores, row]
    .sort((a, b) => b.score - a.score || b.wave - a.wave)
    .slice(0, MAX_SCORES);
  writeSave(data);
  return data.scores;
}
