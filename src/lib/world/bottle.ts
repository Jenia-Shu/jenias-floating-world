/**
 * The shallow tide pool that grows on the Message Island (`community`), and
 * the drifting bottle that lands in it. Geometry lives here so the island
 * mesh, the water plane and the delivery animation all agree on exactly where
 * the surface is.
 *
 * These are island-local coordinates — the same basin is used by the island's
 * dip, its water surface, the collie's drop point and the delivery camera.
 */

import { baseHeight, type Dip } from "./terrain";

/** Basin centre in the Message Island's local space. */
export const POND = { x: 0.95, z: 0.85, r: 0.56 } as const;

/** Carved into the island's shape so the grass dips into a basin. */
export const POND_DIP: Dip = {
  ax: POND.x,
  az: POND.z,
  bx: POND.x,
  bz: POND.z,
  r: 0.8,
  depth: 0.16,
};

/** Kept a little below the rim so the edge stays dry. */
export function pondWaterLevel(shape: Parameters<typeof baseHeight>[2]) {
  return baseHeight(POND.x, POND.z, shape) - 0.07;
}

export type BottleStage = "pending" | "floating" | "read";

export function readBottle(key: string): BottleStage {
  try {
    const raw = localStorage.getItem(key);
    if (raw === "floating" || raw === "read") return raw;
  } catch {
    // storage blocked — treat it as not delivered yet
  }
  return "pending";
}

export function writeBottle(key: string, stage: BottleStage) {
  try {
    localStorage.setItem(key, stage);
  } catch {
    // the animation still runs; only the memory of it is lost
  }
}
