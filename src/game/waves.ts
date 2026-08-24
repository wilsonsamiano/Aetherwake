import type { EnemyKind } from "./types";

export type WaveSpec = {
  title: string;
  threat: string;
  blurb: string;
  spawns: { kind: EnemyKind; n: number }[];
};

function n(kind: EnemyKind, count: number) {
  return { kind, n: Math.max(1, count | 0) };
}

const SCRIPT: WaveSpec[] = [
  {
    title: "Probe Wake",
    threat: "Ram probes",
    blurb: "Unarmed scouts. Strafe, don’t sit still.",
    spawns: [n("scout", 7)],
  },
  {
    title: "Coil Line",
    threat: "Fighter tracers",
    blurb: "Single aimed bolts. Cut across their aim.",
    spawns: [n("scout", 5), n("fighter", 4)],
  },
  {
    title: "Tri-Vane",
    threat: "Bomber spread",
    blurb: "Triple cones. The middle shot is a lie.",
    spawns: [n("scout", 4), n("fighter", 2), n("bomber", 3)],
  },
  {
    title: "Shard Bloom",
    threat: "Splitters",
    blurb: "Shards hatch mites on death. Kill them cold.",
    spawns: [n("shard", 6), n("scout", 3)],
  },
  {
    title: "Old Ironside",
    threat: "Cruiser battery",
    blurb: "A heavy hull and escorts. Break the screen first.",
    spawns: [n("cruiser", 1), n("fighter", 4), n("scout", 4)],
  },
  {
    title: "Rail Net",
    threat: "Lance rails",
    blurb: "Snipers telegraph a beam, then fire a rail. Sidestep the line.",
    spawns: [n("lance", 4), n("fighter", 3)],
  },
  {
    title: "Minefield",
    threat: "Mine layers",
    blurb: "Miners seed fused charges. Clear the floor or eat the bloom.",
    spawns: [n("miner", 4), n("scout", 5)],
  },
  {
    title: "Flak Wolves",
    threat: "Shotgun cones",
    blurb: "They only bite up close. Keep the range or eat pellets.",
    spawns: [n("flak", 5), n("fighter", 2)],
  },
  {
    title: "Mortar Choir",
    threat: "Fat shells",
    blurb: "Slow, heavy rounds. Never stop moving.",
    spawns: [n("mortar", 4), n("scout", 5), n("bomber", 2)],
  },
  {
    title: "Siege Wake",
    threat: "Mixed battery",
    blurb: "Cruiser, rails, and mines. Spend forge like you mean it.",
    spawns: [n("cruiser", 1), n("lance", 3), n("miner", 2), n("fighter", 3)],
  },
];

const CYCLE: WaveSpec[] = [
  {
    title: "Shard Storm",
    threat: "Splitters+",
    blurb: "More blooms, faster mites.",
    spawns: [n("shard", 8), n("flak", 3)],
  },
  {
    title: "Crossfire",
    threat: "Rails and cones",
    blurb: "Lances at range, flak if you hide close.",
    spawns: [n("lance", 5), n("flak", 4), n("scout", 4)],
  },
  {
    title: "Seeded Void",
    threat: "Mines and mortars",
    blurb: "Floor and sky both kill.",
    spawns: [n("miner", 5), n("mortar", 4), n("fighter", 3)],
  },
  {
    title: "Twin Siege",
    threat: "Double cruiser",
    blurb: "Two heavies. Strip escorts, then the hulls.",
    spawns: [n("cruiser", 2), n("lance", 2), n("bomber", 3)],
  },
];

export function waveSpec(wave: number): WaveSpec {
  if (wave <= SCRIPT.length) return SCRIPT[wave - 1]!;
  const extra = wave - SCRIPT.length;
  const base = CYCLE[(extra - 1) % CYCLE.length]!;
  const bump = 1 + Math.floor((wave - 1) / 10);
  return {
    title: `${base.title} ${bump > 1 ? `Mk.${bump}` : ""}`.trim(),
    threat: base.threat,
    blurb: base.blurb,
    spawns: base.spawns.map((s) => ({ kind: s.kind, n: s.n + Math.floor(extra / 4) })),
  };
}
