import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CollieBody } from "./collie";
import { POND, pondWaterLevel } from "@/lib/world/bottle";
import { surfaceHeight, type IslandShape } from "@/lib/world/terrain";

/** The island transform comes from WorldScene so the dog rides the exact island. */
const RUN_IN = 1.9;
const LEAVE = 1.6;
const DROP_AT = 2.35;
const LAND_AT = 2.9;

/** Comes in over the stepping stones, from the main-island side. */
const ENTRY = new THREE.Vector3(-1.29, 0, 1.5);
/** Stops on the rim, close enough that its mouth is over the water. */
const STAND = new THREE.Vector3(0.49, 0, 1.39);
const YAW_TO_POND = Math.atan2(POND.x - STAND.x, POND.z - STAND.z);
const MOUTH_FORWARD = 0.34;
const MOUTH_HEIGHT = 0.3;
/** Let the camera land before the collie starts trotting, so the run is seen. */
const START_DELAY = 0.9;

const easeInOut = (p: number) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);

type Props = {
  shape: IslandShape;
  /** World position of the island this delivery plays on. */
  position: [number, number, number];
  /** Its bob phase — the dog must rise and fall with the ground. */
  bobPhase: number;
  /** Run the delivery from the start. */
  play: boolean;
  /** The bottle is already in the water (including while the delivery runs). */
  delivered: boolean;
  /** The letter has been read — the dog is free to go. */
  exit: boolean;
  reducedMotion: boolean;
  onDelivered: () => void;
  onDone: () => void;
  onOpen: () => void;
};

/**
 * The collie brings the bottle across, drops it into the Message Island's tide
 * pool and sits there wagging until the letter has been read — then it trots off.
 *
 * Times are seconds from the start of `play`: dropped at 2.35, in the water at
 * 2.9, sitting by 3.3; after that it waits for `exit`.
 */
export function CollieDelivery({
  shape,
  position,
  bobPhase,
  play,
  delivered,
  exit,
  reducedMotion,
  onDelivered,
  onDone,
  onOpen,
}: Props) {
  const water = useMemo(() => pondWaterLevel(shape), [shape]);

  const root = useRef<THREE.Group>(null);
  const dog = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const legs = useRef<(THREE.Group | null)[]>([null, null, null, null]);
  const bottle = useRef<THREE.Group>(null);
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);
  const ringAMat = useRef<THREE.MeshBasicMaterial>(null);
  const ringBMat = useRef<THREE.MeshBasicMaterial>(null);
  const halo = useRef<THREE.Mesh>(null);
  const haloMat = useRef<THREE.MeshBasicMaterial>(null);

  const started = useRef<number | null>(null);
  const leaveAt = useRef<number | null>(null);
  const readAtMount = useRef(exit);
  const landed = useRef(delivered);
  const ready = useRef(delivered);
  const fired = useRef({ delivered: false, done: false });

  const pos = useMemo(() => new THREE.Vector3(), []);
  const mouth = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    if (delivered) landed.current = true;
  }, [delivered]);

  // Someone who asked for less motion gets the result, not the trot.
  useEffect(() => {
    if (!play || !reducedMotion) return;
    landed.current = true;
    ready.current = true;
    if (!fired.current.delivered) {
      fired.current.delivered = true;
      onDelivered();
    }
    if (!fired.current.done) {
      fired.current.done = true;
      onDone();
    }
  }, [play, reducedMotion, onDelivered, onDone]);

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    const step = Math.min(dt, 0.05);

    if (root.current) {
      const bob = reducedMotion ? 0 : Math.sin(t * 0.45 + bobPhase) * 0.12;
      root.current.position.set(position[0], position[1] + bob, position[2]);
      root.current.rotation.y = reducedMotion ? 0 : Math.sin(t * 0.12 + bobPhase) * 0.02;
    }

    if (play && started.current === null) started.current = t + START_DELAY;
    const s = play && started.current !== null && !reducedMotion ? Math.max(0, t - started.current) : null;

    if (exit && !readAtMount.current && leaveAt.current === null && landed.current) leaveAt.current = t;
    const leaving = leaveAt.current !== null ? t - leaveAt.current : null;

    const dogUp = dog.current;
    if (!dogUp) return;

    // ---- where the dog is ------------------------------------------------
    let running = false;
    let sitting = false;
    let headDown = 0;
    let yaw = YAW_TO_POND;

    // Someone who already read the letter on an earlier visit keeps the bottle,
    // not the dog.
    const showDog = !readAtMount.current;

    if (leaving !== null) {
      const p = Math.min(1, leaving / LEAVE);
      pos.lerpVectors(STAND, ENTRY, easeInOut(p));
      yaw = Math.atan2(ENTRY.x - STAND.x, ENTRY.z - STAND.z);
      running = p < 0.98;
      dogUp.visible = showDog && p < 0.98;
    } else if (s !== null && s < RUN_IN) {
      const p = s / RUN_IN;
      pos.lerpVectors(ENTRY, STAND, p);
      yaw = YAW_TO_POND;
      running = true;
      dogUp.visible = showDog;
    } else {
      pos.copy(STAND);
      dogUp.visible = showDog;
      if (s === null) {
        sitting = !exit;
      } else {
        sitting = s >= 3.3;
        if (s >= DROP_AT && s < LAND_AT + 0.15) headDown = 0.6;
      }
    }

    const ground = surfaceHeight(pos.x, pos.z, shape) + 0.03;
    dogUp.position.set(pos.x, ground, pos.z);
    dogUp.rotation.y = yaw;

    // ---- pose ------------------------------------------------------------
    if (body.current) {
      const targetX = sitting ? -0.42 : 0;
      const targetY = sitting ? 0.02 : running ? Math.abs(Math.sin(t * 9)) * 0.012 : 0;
      body.current.rotation.x += (targetX - body.current.rotation.x) * Math.min(1, step * 8);
      body.current.position.y += (targetY - body.current.position.y) * Math.min(1, step * 10);
    }

    const swing = running ? 0.5 : 0;
    const setLeg = (i: number, target: number) => {
      const leg = legs.current[i];
      if (leg) leg.rotation.x += (target - leg.rotation.x) * Math.min(1, step * 12);
    };
    if (sitting) {
      setLeg(0, 0);
      setLeg(1, 0);
      setLeg(2, 1.25);
      setLeg(3, 1.25);
    } else {
      setLeg(0, Math.sin(t * 11) * swing);
      setLeg(1, Math.sin(t * 11 + Math.PI) * swing);
      setLeg(2, Math.sin(t * 11 + Math.PI) * swing);
      setLeg(3, Math.sin(t * 11) * swing);
    }

    if (tail.current) {
      const wag = sitting ? 9 : running ? 7 : 3.4;
      const amount = sitting ? 0.5 : running ? 0.28 : 0.16;
      tail.current.rotation.y = reducedMotion ? 0 : Math.sin(t * wag) * amount;
      tail.current.rotation.x = sitting ? -0.55 : -0.25 + Math.sin(t * wag * 0.7) * 0.08;
    }

    if (head.current) {
      const targetX = headDown;
      const targetY = sitting ? Math.sin(t * 0.7) * 0.25 : 0;
      head.current.rotation.x += (targetX - head.current.rotation.x) * Math.min(1, step * 10);
      head.current.rotation.y += (targetY - head.current.rotation.y) * Math.min(1, step * 4);
      head.current.rotation.z = sitting && !reducedMotion ? Math.sin(t * 0.9) * 0.06 : 0;
    }

    // ---- the bottle ------------------------------------------------------
    const bottleUp = bottle.current;
    mouth.set(pos.x + Math.sin(yaw) * MOUTH_FORWARD, ground + MOUTH_HEIGHT, pos.z + Math.cos(yaw) * MOUTH_FORWARD);
    const floating = s === null ? delivered || landed.current : s >= LAND_AT;

    if (bottleUp) {
      if (s !== null && s >= DROP_AT && s < LAND_AT) {
        const f = (s - DROP_AT) / (LAND_AT - DROP_AT);
        bottleUp.visible = true;
        bottleUp.position.set(
          mouth.x + (POND.x - mouth.x) * f,
          mouth.y + (water + 0.022 - mouth.y) * f + Math.sin(Math.PI * f) * 0.12,
          mouth.z + (POND.z - mouth.z) * f,
        );
        bottleUp.rotation.set(0.15, 0.7, 1.32);
      } else if (floating) {
        bottleUp.visible = true;
        const wob = reducedMotion ? 0 : Math.sin(t * 1.1) * 0.012;
        bottleUp.position.set(POND.x, water + 0.022 + wob, POND.z);
        bottleUp.rotation.set(0.12, 0.7, 1.32 + (reducedMotion ? 0 : Math.sin(t * 0.9) * 0.05));
      } else if (!leaving) {
        bottleUp.visible = true;
        bottleUp.position.copy(mouth);
        bottleUp.rotation.set(Math.PI / 2, yaw, 0);
      } else {
        bottleUp.visible = floating;
      }
    }

    // ---- splash rings ----------------------------------------------------
    const p = s !== null ? s - LAND_AT : -1;
    const ring = p >= 0 && p < 1.6 ? p / 1.6 : 1;
    if (ringA.current) {
      ringA.current.visible = p >= 0 && p < 1.6;
      const k = 0.25 + ring * 1.5;
      ringA.current.scale.set(k, k, 1);
    }
    if (ringB.current) {
      const p2 = p - 0.12;
      const k2 = 0.2 + Math.max(0, p2) * 1.7;
      ringB.current.visible = p2 >= 0 && p2 < 1.5;
      ringB.current.scale.set(k2, k2, 1);
    }
    if (ringAMat.current) ringAMat.current.opacity = 0.45 * (1 - ring);
    if (ringBMat.current) ringBMat.current.opacity = 0.3 * (1 - Math.min(1, Math.max(0, p - 0.12)));

    // ---- the quiet "there is something here" halo ----------------------
    const haloOn = floating && bottleUp?.visible === true;
    if (halo.current) {
      halo.current.visible = haloOn;
      const k = 1 + (reducedMotion ? 0 : Math.sin(t * 1.7) * 0.1);
      halo.current.scale.set(k, k, 1);
      halo.current.rotation.z = t * 0.2;
    }
    if (haloMat.current) haloMat.current.opacity = 0.2 + (reducedMotion ? 0 : Math.sin(t * 1.7) * 0.08);

    // ---- parent callbacks ---------------------------------------------
    if (s !== null) {
      if (!fired.current.delivered && s >= LAND_AT) {
        fired.current.delivered = true;
        landed.current = true;
        onDelivered();
      }
      if (!fired.current.done && s >= 3.3) {
        fired.current.done = true;
        onDone();
      }
    }
    ready.current = floating && (s === null || s >= LAND_AT);
  });

  return (
    <group ref={root} position={position}>
      <group ref={dog} name="delivery-dog" visible={!readAtMount.current && (delivered || play)} scale={0.95}>
        <CollieBody body={body} head={head} tail={tail} legs={legs} />
      </group>

      <group ref={bottle} name="delivery-bottle" visible={delivered}>
        {/* glass bottle, corked, with a roll of paper showing through */}
        <mesh castShadow>
          <cylinderGeometry args={[0.045, 0.045, 0.16, 10]} />
          <meshStandardMaterial color="#a8c8c4" roughness={0.08} metalness={0.05} transparent opacity={0.62} />
        </mesh>
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.021, 0.03, 0.06, 10]} />
          <meshStandardMaterial color="#a8c8c4" roughness={0.08} metalness={0.05} transparent opacity={0.62} />
        </mesh>
        <mesh position={[0, 0.145, 0]}>
          <cylinderGeometry args={[0.021, 0.021, 0.028, 8]} />
          <meshStandardMaterial color="#c9a882" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.02, 0]} rotation={[0, 0, 0.06]}>
          <cylinderGeometry args={[0.028, 0.028, 0.1, 8]} />
          <meshStandardMaterial color="#f3ead6" roughness={0.95} />
        </mesh>
        <mesh
          position={[0, 0.05, 0]}
          onPointerOver={() => {
            if (ready.current) document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            document.body.style.cursor = "";
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (ready.current) onOpen();
          }}
        >
          <sphereGeometry args={[0.24, 8, 6]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>

      <group position={[POND.x, water + 0.004, POND.z]}>
        <mesh ref={ringA} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.9, 1, 40]} />
          <meshBasicMaterial ref={ringAMat} color="#eef8fa" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        <mesh ref={ringB} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.9, 1, 40]} />
          <meshBasicMaterial ref={ringBMat} color="#e4f2f6" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
        <mesh ref={halo} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.15, 0.17, 28]} />
          <meshBasicMaterial ref={haloMat} color="#f4fbff" transparent opacity={0.2} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}
