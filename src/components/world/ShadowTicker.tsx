import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

/**
 * Shadow maps are the single most expensive pass in both scenes: every mesh
 * with castShadow is drawn a second time from the light's point of view, at
 * 2048² / 1024², on every single frame.
 *
 * The sun never moves and the moving props (ferris wheel, carousel, train,
 * drifting clouds) turn slowly, so recomputing the depth map every frame buys
 * nothing visually. Freeze automatic updates and ask for a refresh every N
 * frames instead. `every = 1` restores the original one-shadow-per-frame
 * behaviour.
 */
export function ShadowTicker({ every = 2 }: { every?: number }) {
  const gl = useThree((s) => s.gl);
  const frame = useRef(0);

  useFrame(() => {
    if (every <= 1) return;
    frame.current += 1;
    if (frame.current < every) return;
    frame.current = 0;
    gl.shadowMap.needsUpdate = true;
  });

  return null;
}
