export type Sheet = {
  img: HTMLImageElement;
  cols: number;
  rows: number;
  fw: number;
  fh: number;
};

export type Atlas = {
  player: Sheet | null;
  enemies: Sheet | null;
  powerups: Sheet | null;
  explode: Sheet | null;
  muzzle: Sheet | null;
  boltPlayer: Sheet | null;
  boltEnemy: Sheet | null;
};

function loadSheet(src: string, cols: number, rows: number): Promise<Sheet | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      resolve({
        img,
        cols,
        rows,
        fw: img.naturalWidth / cols,
        fh: img.naturalHeight / rows,
      });
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function loadAtlas(): Promise<Atlas> {
  const [player, enemies, powerups, explode, muzzle, boltPlayer, boltEnemy] = await Promise.all([
    loadSheet("/sprites/player.png", 1, 1),
    loadSheet("/sprites/enemies.png", 2, 2),
    loadSheet("/sprites/powerups.png", 2, 2),
    loadSheet("/sprites/explode.png", 2, 2),
    loadSheet("/sprites/muzzle.png", 2, 2),
    loadSheet("/sprites/bolt-player.png", 2, 2),
    loadSheet("/sprites/bolt-enemy.png", 2, 2),
  ]);
  return { player, enemies, powerups, explode, muzzle, boltPlayer, boltEnemy };
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  sheet: Sheet,
  frame: number,
  x: number,
  y: number,
  w: number,
  h: number,
  rot = 0,
  alpha = 1,
  sx = 1,
  sy = 1,
) {
  const col = frame % sheet.cols;
  const row = Math.floor(frame / sheet.cols) % sheet.rows;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(sx, sy);
  ctx.globalAlpha *= alpha;
  ctx.drawImage(sheet.img, col * sheet.fw, row * sheet.fh, sheet.fw, sheet.fh, -w / 2, -h / 2, w, h);
  ctx.restore();
}
