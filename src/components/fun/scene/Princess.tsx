/**
 * 公主 — the border collie, built from the site's existing CollieBody so her
 * proportions and black-and-white markings stay identical everywhere.
 *
 * She is a living character here, not a decoration: entering, breathing,
 * blinking, looking at the question card, wagging, tilting her head, pointing,
 * running to a newly discovered map region and celebrating by the chest.
 * All motion is damped and one-shot triggers are keyed off `signal`, so idle
 * animation never becomes a repetitive loop.
 */

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CollieBody } from "@/components/world/collie";
import { PALETTE, RoundedBox } from "./shared";

export type PrincessMood =
  | "enter"
  | "idle"
  | "look"
  | "correct"
  | "incorrect"
  | "hint"
  | "chapter"
  | "celebrate";

type Props = {
  mood: PrincessMood;
  /** Which map region she runs to when a chapter completes. */
  chapter?: 1 | 2 | 3;
  /** Bump this to replay a one-shot reaction (correct / wrong / celebrate). */
  signal: number;
  reducedMotion: boolean;
};

const HOME: [number, number, number] = [-1.62, 0.05, 1.12];
const ENTRY: [number, number, number] = [-5.2, 0.05, 2.9];
const CHEST: [number, number, number] = [1.42, 0.05, 1.18];
const REGION_SPOTS: Record<1 | 2 | 3, [number, number, number]> = {
  1: [-1.15, 0.05, 0.72],
  2: [1.18, 0.05, 0.72],
  3: [0.05, 0.05, 1.55],
};

/** Two tiny lids inside the head group — a blink every few seconds. */
function BlinkLids({ reducedMotion }: { reducedMotion: boolean }) {
  const lids = useRef<THREE.Group>(null);
  const next = useRef(2.6 + Math.random() * 2);
  useFrame((_, dt) => {
    if (!lids.current) return;
    if (reducedMotion) {
      lids.current.scale.y = 1;
      return;
    }
    next.current -= dt;
    if (next.current < 0) {
      const phase = -next.current;
      const k = phase < 0.09 ? phase / 0.09 : phase < 0.18 ? 1 - (phase - 0.09) / 0.09 : 0;
      lids.current.scale.y = Math.max(0.02, 1 - k);
      if (phase > 0.18) next.current = 2.8 + Math.random() * 3.2;
    } else {
      lids.current.scale.y = 1;
    }
  });
  return (
    <group ref={lids}>
      {[-0.043, 0.043].map((x) => (
        <mesh key={x} position={[x, 0.024, 0.092]} scale={[1.15, 1, 0.5]}>
          <sphereGeometry args={[0.014, 8, 6]} />
          <meshStandardMaterial color={PALETTE.black} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

export function Princess({ mood, chapter = 1, signal, reducedMotion }: Props) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const legs: RefObject<(THREE.Group | null)[]> = useRef<(THREE.Group | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const oneShot = useRef(0);
  const entered = useRef(false);
  const yaw = useRef(0.5);
  const trot = useRef(0);

  useEffect(() => {
    oneShot.current = 0;
    if (mood === "enter") {
      entered.current = false;
      root.current?.position.set(...ENTRY);
    }
  }, [signal, mood]);

  const target = useMemo<[number, number, number]>(() => {
    if (mood === "chapter") return REGION_SPOTS[chapter];
    if (mood === "celebrate") return CHEST;
    return HOME;
  }, [mood, chapter]);

  useFrame(({ clock }, dt) => {
    const g = root.current;
    if (!g) return;
    const step = Math.min(dt, 0.05);
    const t = clock.elapsedTime;
    oneShot.current += step;
    const p = oneShot.current;

    // ---- position -------------------------------------------------------
    if (mood === "enter" && !entered.current) {
      const k = reducedMotion ? 1 : Math.min(1, p / 1.9);
      const e = 1 - Math.pow(1 - k, 3);
      g.position.set(
        ENTRY[0] + (HOME[0] - ENTRY[0]) * e,
        HOME[1] + Math.abs(Math.sin(k * Math.PI * 5)) * 0.06,
        ENTRY[2] + (HOME[2] - ENTRY[2]) * e,
      );
      if (k >= 1) entered.current = true;
      yaw.current = THREE.MathUtils.damp(yaw.current, Math.atan2(HOME[0] - ENTRY[0], HOME[2] - ENTRY[2]), 6, step);
      g.rotation.y = yaw.current;
      trot.current += step * 14;
    } else {
      if (!entered.current && mood !== "enter") {
        g.position.set(...HOME);
        entered.current = true;
      }
      const moving = mood === "chapter" || mood === "celebrate";
      const speed = moving ? 2.2 : 4;
      g.position.x = THREE.MathUtils.damp(g.position.x, target[0], speed, step);
      g.position.z = THREE.MathUtils.damp(g.position.z, target[2], speed, step);
      const dx = target[0] - g.position.x;
      const dz = target[2] - g.position.z;
      if (moving && Math.hypot(dx, dz) > 0.06) {
        yaw.current = THREE.MathUtils.damp(yaw.current, Math.atan2(dx, dz), 5, step);
        trot.current += step * 12;
      } else {
        const faceMap = Math.atan2(-g.position.x, -g.position.z + 0.2);
        yaw.current = THREE.MathUtils.damp(yaw.current, faceMap, 3, step);
      }
      g.rotation.y = yaw.current;
    }

    // ---- jump / celebration --------------------------------------------
    let jump = 0;
    if (!reducedMotion) {
      if (mood === "correct") jump = Math.max(0, Math.sin(Math.min(1, p / 0.85) * Math.PI)) * 0.24;
      else if (mood === "celebrate") jump = Math.abs(Math.sin(p * 4.2)) * 0.2;
      else if (mood === "enter" && !entered.current) jump = Math.abs(Math.sin(trot.current)) * 0.045;
      else if (mood === "chapter") jump = Math.abs(Math.sin(trot.current)) * 0.045;
    }
    g.position.y = HOME[1] + jump;

    // ---- body / legs ----------------------------------------------------
    if (body.current) {
      const breathe = reducedMotion ? 0 : Math.sin(t * 2.1) * 0.006;
      body.current.position.y = breathe;
      body.current.rotation.x = mood === "hint" ? -0.16 : 0;
    }
    const running = (mood === "enter" && !entered.current) || mood === "chapter" || mood === "celebrate";
    for (let i = 0; i < 4; i++) {
      const leg = legs.current[i];
      if (!leg) continue;
      const swing = running && !reducedMotion ? Math.sin(trot.current + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.55 : 0;
      const point = mood === "hint" && i === 0 ? -0.95 : 0;
      leg.rotation.x = THREE.MathUtils.damp(leg.rotation.x, swing + point, 12, step);
    }

    // ---- head -----------------------------------------------------------
    if (head.current) {
      let wantX = 0;
      let wantY = 0;
      let wantZ = 0;
      if (mood === "look") {
        wantX = -0.32;
        wantY = -0.28;
      } else if (mood === "incorrect") {
        wantZ = 0.34 + Math.sin(Math.min(1, p / 0.5) * Math.PI) * 0.1;
        wantX = -0.08;
      } else if (mood === "hint") {
        wantX = 0.22;
        wantY = 0.3;
      } else if (mood === "celebrate") {
        wantZ = Math.sin(p * 3.2) * 0.16;
        wantX = -0.18;
      } else if (!reducedMotion) {
        wantY = Math.sin(t * 0.7) * 0.22;
        wantX = Math.sin(t * 0.43) * 0.05;
      }
      head.current.rotation.x = THREE.MathUtils.damp(head.current.rotation.x, wantX, 7, step);
      head.current.rotation.y = THREE.MathUtils.damp(head.current.rotation.y, wantY, 7, step);
      head.current.rotation.z = THREE.MathUtils.damp(head.current.rotation.z, wantZ, 7, step);
    }

    // ---- tail -----------------------------------------------------------
    if (tail.current) {
      const fast = mood === "correct" || mood === "celebrate" || (mood === "enter" && !entered.current);
      const rate = reducedMotion ? 0 : fast ? 15 : 3.6;
      const amount = reducedMotion ? 0 : fast ? 0.55 : 0.18;
      tail.current.rotation.y = Math.sin(t * rate) * amount;
      tail.current.rotation.x = -0.25 + (reducedMotion ? 0 : Math.sin(t * rate * 0.7) * 0.08);
    }

    if (mood === "celebrate" && !reducedMotion) g.rotation.y += Math.sin(p * 1.4) * 0.006;
  });

  return (
    <group ref={root} position={HOME} scale={1.55} name="princess">
      <CollieBody
        body={body}
        head={head}
        tail={tail}
        legs={legs}
        mouth={<BlinkLids reducedMotion={reducedMotion} />}
      />
      {/* one small sky-blue explorer backpack — nothing else */}
      <RoundedBox args={[0.13, 0.11, 0.07]} radius={0.03} smoothness={2} position={[0, 0.3, -0.1]} castShadow>
        <meshStandardMaterial color="#9fc4dd" roughness={0.85} />
      </RoundedBox>
      <mesh position={[0, 0.3, -0.145]}>
        <circleGeometry args={[0.018, 12]} />
        <meshStandardMaterial color={PALETTE.gold} metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  );
}
