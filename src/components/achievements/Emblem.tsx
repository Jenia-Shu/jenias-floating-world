/**
 * Emblem thumbnails and the one live emblem used by the detail and unlock views.
 */

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { EmblemKey } from "@/lib/achievements/types";
import { buildEmblem, emblemDataUrl } from "./emblems";

type Metal = [string, string];

export function EmblemThumb({
  emblem,
  metal,
  silhouette,
  className,
}: {
  emblem: EmblemKey;
  metal: Metal;
  silhouette: boolean;
  className?: string;
}) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    let alive = true;
    // One frame later keeps the first paint of the wall fast; the shared
    // renderer then bakes all twenty-two emblems in the same context.
    const id = window.setTimeout(() => {
      if (alive) setSrc(emblemDataUrl(emblem, metal, silhouette));
    }, 0);
    return () => {
      alive = false;
      window.clearTimeout(id);
    };
  }, [emblem, metal, silhouette]);

  return (
    <span className={className} aria-hidden>
      {src ? (
        <img src={src} alt="" draggable={false} className="h-full w-full object-contain" />
      ) : (
        <span className="emblem-fallback" />
      )}
    </span>
  );
}

function Spin({
  emblem,
  metal,
  silhouette,
}: {
  emblem: EmblemKey;
  metal: Metal;
  silhouette: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  useEffect(() => {
    const node = group.current;
    if (!node) return;
    const g = buildEmblem(emblem, metal, silhouette);
    g.scale.setScalar(1.25);
    node.add(g);
    return () => {
      node.remove(g);
    };
  }, [emblem, metal, silhouette]);
  useFrame(({ clock }) => {
    if (group.current) group.current.rotation.y = clock.elapsedTime * 0.5;
  });
  return <group ref={group} />;
}

/** A real rotating emblem — exactly one of these is ever mounted at a time. */
export function EmblemLive({
  emblem,
  metal,
  silhouette = false,
}: {
  emblem: EmblemKey;
  metal: Metal;
  silhouette?: boolean;
}) {
  const [gl] = useState(() => {
    if (typeof document === "undefined") return false;
    try {
      const canvas = document.createElement("canvas");
      return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
    } catch {
      return false;
    }
  });

  if (!gl) {
    return (
      <span className="block h-full w-full">
        <EmblemThumb
          emblem={emblem}
          metal={metal}
          silhouette={silhouette}
          className="block h-full w-full"
        />
      </span>
    );
  }
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.3, 3.4], fov: 30 }}
      gl={{ antialias: true, alpha: true }}
      style={{ width: "100%", height: "100%" }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[2.4, 3.2, 3.4]} intensity={1.5} color="#fff4df" />
      <directionalLight position={[-3, 1, -2.4]} intensity={0.7} color="#cfe0ff" />
      <directionalLight position={[0, -2, 2]} intensity={0.35} color="#f6e6c8" />
      <pointLight position={[0, 0.8, 1.6]} intensity={1.4} color="#dbe8ff" distance={4} />
      <Spin emblem={emblem} metal={metal} silhouette={silhouette} />
    </Canvas>
  );
}
