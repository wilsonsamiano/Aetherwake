import type { SkillId } from "./types";

export type SkillDef = {
  id: SkillId;
  name: string;
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
    desc: "The ship’s living heart. Already online.",
    cost: 0,
    x: 0.5,
    y: 0.5,
    requires: [],
  },
  {
    id: "hull1",
    name: "Plated Hull",
    desc: "+2 maximum hull.",
    cost: 1,
    x: 0.5,
    y: 0.28,
    requires: ["core"],
  },
  {
    id: "hull2",
    name: "Bulkheads",
    desc: "+2 maximum hull.",
    cost: 2,
    x: 0.5,
    y: 0.14,
    requires: ["hull1"],
  },
  {
    id: "regen",
    name: "Nanite Weave",
    desc: "Slow hull regeneration in combat.",
    cost: 2,
    x: 0.64,
    y: 0.14,
    requires: ["hull2"],
  },
  {
    id: "cannon1",
    name: "Rapid Coil",
    desc: "Fire 25% faster.",
    cost: 1,
    x: 0.68,
    y: 0.5,
    requires: ["core"],
  },
  {
    id: "cannon2",
    name: "Hot Cores",
    desc: "Shots deal 40% more damage.",
    cost: 2,
    x: 0.82,
    y: 0.5,
    requires: ["cannon1"],
  },
  {
    id: "spread",
    name: "Tri-Vane",
    desc: "Permanent extra side shots.",
    cost: 3,
    x: 0.94,
    y: 0.36,
    requires: ["cannon2"],
  },
  {
    id: "pierce",
    name: "Phase Tips",
    desc: "Shots pierce one extra target.",
    cost: 2,
    x: 0.82,
    y: 0.68,
    requires: ["cannon2"],
  },
  {
    id: "homing",
    name: "Seek Lattice",
    desc: "Shots gently curve toward foes.",
    cost: 3,
    x: 0.94,
    y: 0.68,
    requires: ["pierce"],
  },
  {
    id: "drive1",
    name: "Afterburn",
    desc: "+18% engine speed.",
    cost: 1,
    x: 0.32,
    y: 0.5,
    requires: ["core"],
  },
  {
    id: "drive2",
    name: "Slipstream",
    desc: "+18% engine speed.",
    cost: 2,
    x: 0.18,
    y: 0.5,
    requires: ["drive1"],
  },
  {
    id: "dash",
    name: "Blink Drive",
    desc: "Shift / dash to burst forward.",
    cost: 2,
    x: 0.18,
    y: 0.68,
    requires: ["drive2"],
  },
  {
    id: "overcharge",
    name: "Overcharge",
    desc: "Fire rate and damage both climb.",
    cost: 3,
    x: 0.08,
    y: 0.36,
    requires: ["drive2"],
  },
  {
    id: "shield1",
    name: "Aegis Ring",
    desc: "Start each life with a shield.",
    cost: 1,
    x: 0.5,
    y: 0.7,
    requires: ["core"],
  },
  {
    id: "shield2",
    name: "Double Aegis",
    desc: "Larger shield capacity.",
    cost: 2,
    x: 0.36,
    y: 0.86,
    requires: ["shield1"],
  },
  {
    id: "magnet",
    name: "Salvage Well",
    desc: "Pull pickups from farther away.",
    cost: 2,
    x: 0.64,
    y: 0.86,
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
