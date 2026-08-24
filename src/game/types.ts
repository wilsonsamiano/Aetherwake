export type Phase = "title" | "playing" | "paused" | "skills" | "gameover" | "scores" | "help";

export type EnemyKind = "scout" | "fighter" | "bomber" | "cruiser";
export type PickupKind = "multi" | "shield" | "speed" | "repair";

export type Player = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Current hull heading (radians, 0 = +X). */
  aim: number;
  /** Desired heading from mouse / right stick. */
  want: number;
  /** Angular velocity, rad/s. */
  omega: number;
  hp: number;
  maxHp: number;
  lives: number;
  invuln: number;
  deadT: number;
  shield: number;
  maxShield: number;
  fireCd: number;
  dashCd: number;
  multiT: number;
  speedT: number;
  magnet: number;
  extraShots: number;
  fireMul: number;
  dmgMul: number;
  pierce: number;
  homing: number;
  speedMul: number;
  regen: number;
  regenAcc: number;
  radius: number;
};

export type Enemy = {
  alive: boolean;
  kind: EnemyKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  r: number;
  value: number;
  fireCd: number;
  flash: number;
  knock: number;
  aim: number;
};

export type Bullet = {
  alive: boolean;
  friendly: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  dmg: number;
  ttl: number;
  pierce: number;
  homing: number;
  rot: number;
};

export type Pickup = {
  alive: boolean;
  kind: PickupKind;
  x: number;
  y: number;
  ttl: number;
  bob: number;
};

export type Particle = {
  alive: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  drag: number;
  additive: boolean;
};

export type Floater = {
  alive: boolean;
  x: number;
  y: number;
  vy: number;
  text: string;
  life: number;
  color: string;
};

export type Muzzle = {
  alive: boolean;
  x: number;
  y: number;
  rot: number;
  life: number;
  max: number;
};

export type Star = {
  x: number;
  y: number;
  z: number;
  s: number;
};

export type ScoreRow = {
  name: string;
  score: number;
  wave: number;
  at: number;
};

export type HudSnap = {
  score: number;
  lives: number;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  wave: number;
  forge: number;
  combo: number;
  multiT: number;
  speedT: number;
  banner: string;
  dashCd: number;
  unspent: number;
  padOn: boolean;
};

export type SkillId =
  | "core"
  | "hull1"
  | "hull2"
  | "regen"
  | "cannon1"
  | "cannon2"
  | "spread"
  | "pierce"
  | "homing"
  | "drive1"
  | "drive2"
  | "dash"
  | "overcharge"
  | "shield1"
  | "shield2"
  | "magnet";
