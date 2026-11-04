// Pure terrain math for floating islands. No React / three.js imports.

export type Dip = { ax: number; az: number; bx: number; bz: number; r: number; depth: number };

export type IslandShape = {
  radius: number;
  height: number; // dome height of grass top
  depth: number; // rock underside depth
  seed: number;
  bump: number;
  dips?: Dip[];
};

export function noise2(x: number, z: number, seed: number) {
  return (
    Math.sin(x * 1.3 + seed) * Math.cos(z * 1.7 + seed * 2.1) * 0.5 +
    Math.sin(x * 2.9 - z * 2.1 + seed * 3.3) * 0.25 +
    Math.cos(x * 5.1 + z * 4.3 - seed) * 0.12
  );
}

export function shapeRadius(theta: number, s: IslandShape) {
  const k = s.seed;
  return (
    s.radius *
    (1 +
      0.09 * Math.sin(3 * theta + k) +
      0.05 * Math.sin(5 * theta + k * 1.7) +
      0.025 * Math.sin(9 * theta + k * 0.3))
  );
}

const smooth = (t: number) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};

function segDist(px: number, pz: number, d: Dip) {
  const vx = d.bx - d.ax;
  const vz = d.bz - d.az;
  const len2 = vx * vx + vz * vz;
  let t = len2 > 0 ? ((px - d.ax) * vx + (pz - d.az) * vz) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (d.ax + vx * t), pz - (d.az + vz * t));
}

/** Grass height without dips (pond/stream carving). */
export function baseHeight(x: number, z: number, s: IslandShape) {
  const th = Math.atan2(z, x);
  const d = Math.hypot(x, z) / shapeRadius(th, s);
  if (d >= 1) return 0;
  const dome = s.height * Math.pow(1 - d * d, 0.5);
  const n = noise2(x * 0.6, z * 0.6, s.seed) * s.bump * (1 - Math.pow(d, 4));
  return dome + n;
}

export function surfaceHeight(x: number, z: number, s: IslandShape) {
  let h = baseHeight(x, z, s);
  for (const dip of s.dips ?? []) {
    h -= dip.depth * smooth(1 - segDist(x, z, dip) / dip.r);
  }
  return h;
}

export const ROCK_PALETTE = ["#8b7462", "#b8a996", "#a0a4a6", "#cbc5b7", "#8f99a1", "#b3ada2"];
