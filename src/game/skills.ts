import type { SkillId } from "./types";

export type SkillDef = {
  id: SkillId;
  name: string;
  short: string;
  desc: string;
  cost: number;
  x: number;
  y: number;
  requires: SkillId[];
};

export const SKILLS: SkillDef[] = [
  {
    id: "core",
    name: "Wake Core",
    short: "CORE",
    desc: "The ship’s living heart. Already online.",
    cost: 0,
    x: 0.5,
    y: 0.48,
    requires: [],
  },
  {
    id: "hull1",
    name: "Plated Hull",
    short: "HULL",
    desc: "+2 maximum hull.",
    cost: 1,
    x: 0.5,
    y: 0.3,
    requires: ["core"],
  },
  {
    id: "hull2",
    name: "Bulkheads",
    short: "BULK",
    desc: "+2 maximum hull.",
    cost: 2,
    x: 0.5,
    y: 0.14,
    requires: ["hull1"],
  },
  {
    id: "regen",
    name: "Nanite Weave",
    short: "NANO",
    desc: "Slow hull regeneration in combat.",
    cost: 2,
    x: 0.62,
    y: 0.14,
    requires: ["hull2"],
  },
  {
    id: "cannon1",
    name: "Rapid Coil",
    short: "COIL",
    desc: "Fire 25% faster.",
    cost: 1,
    x: 0.66,
    y: 0.48,
    requires: ["core"],
  },
  {
    id: "cannon2",
    name: "Hot Cores",
    short: "HOT",
    desc: "Shots deal 40% more damage.",
    cost: 2,
    x: 0.8,
    y: 0.48,
    requires: ["cannon1"],
  },
  {
    id: "spread",
    name: "Tri-Vane",
    short: "TRI",
    desc: "Permanent extra side shots.",
    cost: 3,
    x: 0.9,
    y: 0.32,
    requires: ["cannon2"],
  },
  {
    id: "pierce",
    name: "Phase Tips",
    short: "PHASE",
    desc: "Shots pierce one extra target.",
    cost: 2,
    x: 0.8,
    y: 0.66,
    requires: ["cannon2"],
  },
  {
    id: "homing",
    name: "Seek Lattice",
    short: "SEEK",
    desc: "Shots gently curve toward foes.",
    cost: 3,
    x: 0.9,
    y: 0.66,
    requires: ["pierce"],
  },
  {
    id: "drive1",
    name: "Afterburn",
    short: "BURN",
    desc: "+18% engine speed.",
    cost: 1,
    x: 0.34,
    y: 0.48,
    requires: ["core"],
  },
  {
    id: "drive2",
    name: "Slipstream",
    short: "SLIP",
    desc: "+18% engine speed.",
    cost: 2,
    x: 0.2,
    y: 0.48,
    requires: ["drive1"],
  },
  {
    id: "dash",
    name: "Blink Drive",
    short: "BLINK",
    desc: "Shift / dash to burst forward.",
    cost: 2,
    x: 0.2,
    y: 0.66,
    requires: ["drive2"],
  },
  {
    id: "overcharge",
    name: "Overcharge",
    short: "OVER",
    desc: "Fire rate and damage both climb.",
    cost: 3,
    x: 0.1,
    y: 0.32,
    requires: ["drive2"],
  },
  {
    id: "shield1",
    name: "Aegis Ring",
    short: "AEGIS",
    desc: "Start each life with a shield.",
    cost: 1,
    x: 0.5,
    y: 0.66,
    requires: ["core"],
  },
  {
    id: "shield2",
    name: "Double Aegis",
    short: "DBL",
    desc: "Larger shield capacity.",
    cost: 2,
    x: 0.38,
    y: 0.84,
    requires: ["shield1"],
  },
  {
    id: "magnet",
    name: "Salvage Well",
    short: "WELL",
    desc: "Pull pickups from farther away.",
    cost: 2,
    x: 0.62,
    y: 0.84,
    requires: ["shield1"],
  },
];

export const SKILL_BY_ID = Object.fromEntries(SKILLS.map((s) => [s.id, s])) as Record<
  SkillId,
  SkillDef
>;

export const SKILL_EDGES: [SkillId, SkillId][] = SKILLS.flatMap((s) =>
  s.requires.map((r) => [r, s.id] as [SkillId, SkillId]),
);

export function isAvailable(id: SkillId, owned: Set<SkillId>): boolean {
  if (owned.has(id)) return false;
  const def = SKILL_BY_ID[id];
  return def.requires.every((r) => owned.has(r));
}

export function applyOwnedToPlayer(owned: Set<SkillId>) {
  return {
    maxHp: 5 + (owned.has("hull1") ? 2 : 0) + (owned.has("hull2") ? 2 : 0),
    fireMul:
      (owned.has("cannon1") ? 1.25 : 1) * (owned.has("overcharge") ? 1.2 : 1),
    dmgMul:
      (owned.has("cannon2") ? 1.4 : 1) * (owned.has("overcharge") ? 1.2 : 1),
    extraShots: owned.has("spread") ? 2 : 0,
    pierce: owned.has("pierce") ? 1 : 0,
    homing: owned.has("homing") ? 1 : 0,
    speedMul:
      (owned.has("drive1") ? 1.18 : 1) * (owned.has("drive2") ? 1.18 : 1),
    maxShield: owned.has("shield2") ? 6 : owned.has("shield1") ? 3 : 0,
    magnet: owned.has("magnet") ? 160 : 72,
    regen: owned.has("regen") ? 0.35 : 0,
    canDash: owned.has("dash"),
  };
}
