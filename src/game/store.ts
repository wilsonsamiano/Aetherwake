import { create } from "zustand";
import type { HudSnap, Phase, ScoreRow, SkillId, WaveBrief } from "./types";
import { getScores, loadSettings, type Settings } from "./save";

export type GameApi = {
  start: () => void;
  resume: () => void;
  pause: () => void;
  openSkills: () => void;
  closeSkills: () => void;
  buySkill: (id: SkillId) => boolean;
  advanceWave: () => void;
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
  canDash: false,
};

const EMPTY_BRIEF: WaveBrief = {
  cleared: 0,
  next: 1,
  title: "",
  blurb: "",
  threat: "",
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
  menuIndex: number;
  skillId: SkillId;
  briefing: WaveBrief;
  setPhase: (phase: Phase) => void;
  setHud: (hud: HudSnap) => void;
  setApi: (api: GameApi | null) => void;
  setScores: (scores: ScoreRow[]) => void;
  setSettings: (settings: Settings) => void;
  setOwned: (owned: SkillId[]) => void;
  setQualify: (qualify: boolean, score: number, wave: number) => void;
  setMenuIndex: (menuIndex: number) => void;
  setSkillId: (skillId: SkillId) => void;
  setBriefing: (briefing: WaveBrief) => void;
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
  menuIndex: 0,
  skillId: "core",
  briefing: EMPTY_BRIEF,
  setPhase: (phase) => set({ phase, menuIndex: 0 }),
  setHud: (hud) => set({ hud }),
  setApi: (api) => set({ api }),
  setScores: (scores) => set({ scores }),
  setSettings: (settings) => set({ settings }),
  setOwned: (owned) => set({ owned }),
  setQualify: (qualify, lastScore, lastWave) => set({ qualify, lastScore, lastWave }),
  setMenuIndex: (menuIndex) => set({ menuIndex }),
  setSkillId: (skillId) => set({ skillId }),
  setBriefing: (briefing) => set({ briefing }),
}));
