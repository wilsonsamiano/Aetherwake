import { create } from "zustand";
import type { HudSnap, Phase, ScoreRow, SkillId } from "./types";
import { getScores, loadSettings, type Settings } from "./save";

export type GameApi = {
  start: () => void;
  resume: () => void;
  pause: () => void;
  openSkills: () => void;
  closeSkills: () => void;
  buySkill: (id: SkillId) => boolean;
  submitName: (name: string) => void;
  toTitle: () => void;
  toScores: () => void;
  toHelp: () => void;
  setSettings: (s: Partial<Settings>) => void;
  owned: () => Set<SkillId>;
  forge: () => number;
};

const EMPTY_HUD: HudSnap = {
  score: 0,
  lives: 3,
  hp: 5,
  maxHp: 5,
  shield: 0,
  maxShield: 0,
  wave: 0,
  forge: 0,
  combo: 0,
  multiT: 0,
  speedT: 0,
  banner: "",
  dashCd: 0,
  unspent: 0,
  padOn: false,
};

type GameStore = {
  phase: Phase;
  hud: HudSnap;
  scores: ScoreRow[];
  settings: Settings;
  qualify: boolean;
  lastScore: number;
  lastWave: number;
  owned: SkillId[];
  api: GameApi | null;
  setPhase: (phase: Phase) => void;
  setHud: (hud: HudSnap) => void;
  setApi: (api: GameApi | null) => void;
  setScores: (scores: ScoreRow[]) => void;
  setSettings: (settings: Settings) => void;
  setOwned: (owned: SkillId[]) => void;
  setQualify: (qualify: boolean, score: number, wave: number) => void;
};

export const useGame = create<GameStore>((set) => ({
  phase: "title",
  hud: EMPTY_HUD,
  scores: getScores(),
  settings: loadSettings(),
  qualify: false,
  lastScore: 0,
  lastWave: 0,
  owned: ["core"],
  api: null,
  setPhase: (phase) => set({ phase }),
  setHud: (hud) => set({ hud }),
  setApi: (api) => set({ api }),
  setScores: (scores) => set({ scores }),
  setSettings: (settings) => set({ settings }),
  setOwned: (owned) => set({ owned }),
  setQualify: (qualify, lastScore, lastWave) => set({ qualify, lastScore, lastWave }),
}));
