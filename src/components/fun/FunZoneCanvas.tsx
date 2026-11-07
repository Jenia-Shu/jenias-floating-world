/**
 * One WebGL context for the whole Fun Zone. The park and the campsite are two
 * scenes in the SAME canvas, so switching never creates a second context
 * (a known source of blank screens in this project) and the camera can glide
 * from the park into the campsite and down to the map table.
 */

import { useMemo, useRef, type ComponentProps } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { GameId } from "@/lib/fun/funZone";
import { ParkScene } from "./scene/ParkScene";
import { ExplorerScene, type ExplorerStage } from "./scene/ExplorerScene";
import { MazeScene, type MazeSceneProps } from "./games/tiny-maze/MazeScene";
import { ShadowTicker } from "@/components/world/ShadowTicker";
import { sceneSettings, frameCap } from "@/lib/world/quality";
import { FrameCap } from "@/components/FrameCap";

/** `maze` owns the camera while it is mounted, so CameraRig stands down. */
export type FunZoneMode = "park" | "game" | "maze";

export type ExplorerProps = Omit<ComponentProps<typeof ExplorerScene>, "reducedMotion">;

type Props = {
  mode: FunZoneMode;
  stage: ExplorerStage | null;
  reducedMotion: boolean;
  active: boolean;
  unlocked: Record<GameId, boolean>;
  justUnlocked: GameId | null;
  onSelect: (id: GameId) => void;
  explorer: ExplorerProps | null;
  maze: MazeSceneProps | null;
  mazeKey: number;
};

type Shot = { pos: [number, number, number]; target: [number, number, number] };

const PARK: Shot = { pos: [0, 6.3, 10.9], target: [0, 0.55, -0.1] };
const CAMP: Shot = { pos: [0, 5.25, 9.6], target: [0, 0.9, 0] };
const CLOSE: Shot = { pos: [0, 3.45, 6.35], target: [0, 1.18, 0.1] };
const CHAPTER: Shot = { pos: [0, 4.45, 8.4], target: [0, 1.0, 0] };
const RESULT: Shot = { pos: [0, 4.7, 8.8], target: [0, 1.0, 0] };

function shotFor(mode: FunZoneMode, stage: ExplorerStage | null): Shot {
  if (mode === "park" || mode === "maze") return PARK;
  switch (stage) {
    case "question":
      return CLOSE;
    case "chapter":
      return CHAPTER;
    case "result":
      return RESULT;
    default:
      return CAMP;
  }
}

function CameraRig({ mode, stage, reducedMotion }: Pick<Props, "mode" | "stage" | "reducedMotion">) {
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3(...PARK.target));
  const shot = useMemo(() => shotFor(mode, stage), [mode, stage]);
  useFrame((_, dt) => {
    const step = Math.min(dt, 0.05);
    const p = shot.pos;
    const t = shot.target;
    if (reducedMotion) {
      camera.position.set(p[0], p[1], p[2]);
      look.current.set(t[0], t[1], t[2]);
    } else {
      camera.position.x = THREE.MathUtils.damp(camera.position.x, p[0], 2.2, step);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, p[1], 2.2, step);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, p[2], 2.2, step);
      look.current.x = THREE.MathUtils.damp(look.current.x, t[0], 2.2, step);
      look.current.y = THREE.MathUtils.damp(look.current.y, t[1], 2.2, step);
      look.current.z = THREE.MathUtils.damp(look.current.z, t[2], 2.2, step);
    }
    camera.lookAt(look.current);
  });
  return null;
}

export function FunZoneCanvas({
  mode,
  stage,
  reducedMotion,
  active,
  unlocked,
  justUnlocked,
  onSelect,
  explorer,
  maze,
  mazeKey,
}: Props) {
  const quality = sceneSettings().fun;
  return (
    <Canvas
      shadows
      dpr={quality.dpr}
      frameloop="demand"
      camera={{ position: PARK.pos, fov: 40, near: 0.1, far: 100 }}
      gl={{ antialias: quality.antialias, alpha: false, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.12;
        // Static sun: see ShadowTicker. Refresh the depth map every N frames
        // instead of redrawing every caster twice per frame.
        gl.shadowMap.autoUpdate = quality.shadowEvery <= 1;
        gl.shadowMap.needsUpdate = true;
      }}
    >
      <color attach="background" args={["#e4eff4"]} />
      <fog attach="fog" args={["#e4eff4", 17, 40]} />
      <ShadowTicker every={quality.shadowEvery} />
      {active && <FrameCap fps={frameCap()} />}
      <ambientLight intensity={0.62} />
      <hemisphereLight args={["#eaf5fb", "#90a982", 0.7]} />
      <directionalLight
        castShadow
        position={[6, 10, 7]}
        intensity={1.55}
        color="#fff3dd"
        shadow-mapSize-width={quality.shadowSize}
        shadow-mapSize-height={quality.shadowSize}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-camera-near={1}
        shadow-camera-far={35}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[-8, 5, -6]} intensity={0.42} color="#cfe0ee" />
      <directionalLight position={[5, 3, 8]} intensity={0.3} color="#f5e6c8" />
      {mode !== "maze" && <CameraRig mode={mode} stage={stage} reducedMotion={reducedMotion} />}

      {mode === "park" ? (
        <ParkScene
          unlocked={unlocked}
          justUnlocked={justUnlocked}
          onSelect={onSelect}
          reducedMotion={reducedMotion}
        />
      ) : mode === "maze" ? (
        maze && <MazeScene key={mazeKey} {...maze} />
      ) : (
        explorer && <ExplorerScene {...explorer} reducedMotion={reducedMotion} />
      )}
    </Canvas>
  );
}
