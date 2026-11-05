import type React from "react";
import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Reveals its children with an ease-out scale-up, so a region visibly grows
 * out of bare rock instead of just popping into place.
 */
export function Grow({
  position,
  reducedMotion,
  children,
}: {
  position?: [number, number, number];
  reducedMotion?: boolean | undefined;
  children: React.ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  const t = useRef(reducedMotion ? 1 : 0);

  useEffect(() => {
    const g = ref.current;
    if (!g || !reducedMotion) return;
    t.current = 1;
    g.scale.setScalar(1);
    g.visible = true;
  }, [reducedMotion]);

  useFrame((_, dt) => {
    const g = ref.current;
    if (!g || t.current >= 1) return;
    t.current = Math.min(1, t.current + dt * 1.9);
    const e = 1 - Math.pow(1 - t.current, 3);
    g.scale.setScalar(Math.max(0.001, e));
    g.visible = e > 0.02;
    if (t.current >= 1) g.scale.setScalar(1);
  });

  return (
    <group ref={ref} position={position} scale={reducedMotion ? 1 : 0.001} visible={!!reducedMotion}>
      {children}
    </group>
  );
}
