import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Shared geometries & materials for repeated details.
const geo = {
  trunk: new THREE.CylinderGeometry(0.07, 0.11, 0.6, 8),
  blob: new THREE.IcosahedronGeometry(1, 2),
  rock: new THREE.DodecahedronGeometry(1, 0),
  stem: new THREE.CylinderGeometry(0.045, 0.06, 0.18, 8),
  cap: new THREE.SphereGeometry(0.13, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2),
  flower: new THREE.SphereGeometry(0.045, 8, 6),
  stone: new THREE.CylinderGeometry(1, 1, 1, 9),
};
const mat = {
  trunk: new THREE.MeshStandardMaterial({ color: "#8a6a52", roughness: 0.9 }),
  leaf: new THREE.MeshStandardMaterial({ color: "#7fb07a", roughness: 0.85 }),
  leafLight: new THREE.MeshStandardMaterial({ color: "#a2c98c", roughness: 0.85 }),
  leafMuted: new THREE.MeshStandardMaterial({ color: "#a9b9a6", roughness: 0.9 }),
  rock: new THREE.MeshStandardMaterial({ color: "#b4b3ac", roughness: 0.95, flatShading: true }),
  stem: new THREE.MeshStandardMaterial({ color: "#f1e8d6", roughness: 0.8 }),
  capRed: new THREE.MeshStandardMaterial({ color: "#d98e74", roughness: 0.6 }),
  capCream: new THREE.MeshStandardMaterial({ color: "#e9d6a8", roughness: 0.6 }),
  stone: new THREE.MeshStandardMaterial({ color: "#d4cfc4", roughness: 0.9 }),
  flower: new THREE.MeshStandardMaterial({ roughness: 0.6 }),
  gold: new THREE.MeshStandardMaterial({ color: "#d6b874", metalness: 0.6, roughness: 0.35 }),
};

type V3 = [number, number, number];

export function Tree({ position, scale = 1, variant = 0, muted }: { position: V3; scale?: number; variant?: number; muted?: boolean }) {
  const leaf = muted ? mat.leafMuted : variant % 2 ? mat.leafLight : mat.leaf;
  return (
    <group position={position} scale={scale}>
      <mesh geometry={geo.trunk} material={mat.trunk} position={[0, 0.3, 0]} castShadow />
      {variant % 3 === 2 ? (
        <>
          <mesh geometry={geo.blob} material={leaf} position={[0, 0.75, 0]} scale={[0.38, 0.48, 0.38]} castShadow />
          <mesh geometry={geo.blob} material={leaf} position={[0, 1.12, 0]} scale={[0.27, 0.34, 0.27]} castShadow />
        </>
      ) : (
        <>
          <mesh geometry={geo.blob} material={leaf} position={[0, 0.85, 0]} scale={0.42} castShadow />
          <mesh geometry={geo.blob} material={leaf} position={[0.25, 0.7, 0.1]} scale={0.28} castShadow />
          <mesh geometry={geo.blob} material={leaf} position={[-0.2, 0.72, -0.12]} scale={0.26} castShadow />
        </>
      )}
    </group>
  );
}

export function Rock({ position, scale = 0.2, rot = 0 }: { position: V3; scale?: number; rot?: number }) {
  return <mesh geometry={geo.rock} material={mat.rock} position={position} scale={[scale, scale * 0.7, scale]} rotation={[rot, rot * 2, 0]} castShadow receiveShadow />;
}

export function Mushroom({ position, cream }: { position: V3; cream?: boolean }) {
  return (
    <group position={position}>
      <mesh geometry={geo.stem} material={mat.stem} position={[0, 0.09, 0]} castShadow />
      <mesh geometry={geo.cap} material={cream ? mat.capCream : mat.capRed} position={[0, 0.16, 0]} castShadow />
    </group>
  );
}

/** Instanced flowers: one draw call. */
export function Flowers({ points }: { points: { p: V3; c: string }[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    points.forEach((pt, i) => {
      o.position.set(pt.p[0], pt.p[1] + 0.05, pt.p[2]);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, c.set(pt.c));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [points]);
  return <instancedMesh ref={ref} args={[geo.flower, mat.flower, points.length]} castShadow />;
}

/** Instanced flat path stones. */
export function PathStones({ points }: { points: { p: V3; s: number; r: number }[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new THREE.Object3D();
    points.forEach((pt, i) => {
      o.position.set(...pt.p);
      o.rotation.set(0, pt.r, 0);
      o.scale.set(pt.s, 0.05, pt.s * 0.8);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  }, [points]);
  return <instancedMesh ref={ref} args={[geo.stone, mat.stone, points.length]} receiveShadow />;
}

export function Cottage({ position, rotation = 0 }: { position: V3; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* foundation */}
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.35, 0.14, 1.15]} />
        <meshStandardMaterial color="#bdb6aa" roughness={0.95} />
      </mesh>
      {/* walls */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.8, 1.0]} />
        <meshStandardMaterial color="#f3e9d6" roughness={0.85} />
      </mesh>
      {/* roof */}
      <mesh position={[0, 1.18, 0]} rotation={[0, Math.PI / 4, 0]} scale={[1.08, 1, 0.92]} castShadow>
        <coneGeometry args={[1.05, 0.62, 4]} />
        <meshStandardMaterial color="#8fa9b8" roughness={0.7} />
      </mesh>
      {/* chimney */}
      <mesh position={[0.32, 1.32, -0.15]} castShadow>
        <boxGeometry args={[0.16, 0.38, 0.16]} />
        <meshStandardMaterial color="#c9bfb0" roughness={0.9} />
      </mesh>
      {/* door */}
      <mesh position={[0, 0.36, 0.505]}>
        <boxGeometry args={[0.28, 0.46, 0.03]} />
        <meshStandardMaterial color="#9a7458" roughness={0.8} />
      </mesh>
      <mesh position={[0.08, 0.36, 0.53]}>
        <sphereGeometry args={[0.022, 8, 6]} />
        <primitive object={mat.gold} attach="material" />
      </mesh>
      {/* windows */}
      {[-0.38, 0.38].map((x) => (
        <group key={x} position={[x, 0.55, 0.505]}>
          <mesh>
            <boxGeometry args={[0.22, 0.22, 0.03]} />
            <meshStandardMaterial color="#f6e2a8" emissive="#e8c877" emissiveIntensity={0.35} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, 0.018]}>
            <boxGeometry args={[0.26, 0.03, 0.02]} />
            <meshStandardMaterial color="#e9dfcc" />
          </mesh>
        </group>
      ))}
      <mesh position={[0.605, 0.55, 0]}>
        <boxGeometry args={[0.03, 0.22, 0.22]} />
        <meshStandardMaterial color="#f6e2a8" emissive="#e8c877" emissiveIntensity={0.35} />
      </mesh>
    </group>
  );
}

export function Cloud({ position, scale = 1, speed = 0.05, reducedMotion }: { position: V3; scale?: number; speed?: number; reducedMotion?: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const cloudMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 1, transparent: true, opacity: 0.92 }), []);
  useFrame(({ clock }) => {
    if (!ref.current || reducedMotion) return;
    ref.current.position.x = position[0] + Math.sin(clock.elapsedTime * speed) * 3;
  });
  return (
    <group ref={ref} position={position} scale={scale}>
      {[
        [0, 0, 0, 1],
        [0.9, -0.15, 0.1, 0.75],
        [-0.95, -0.2, 0, 0.7],
        [0.3, 0.35, -0.1, 0.65],
        [-0.4, 0.25, 0.2, 0.55],
      ].map(([x, y, z, s], i) => (
        <mesh key={i} geometry={geo.blob} material={cloudMat} position={[x, y, z]} scale={[s, s * 0.7, s * 0.8]} />
      ))}
    </group>
  );
}

export function LockMarker({ position }: { position: V3 }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.4;
  });
  return (
    <group ref={ref} position={position}>
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.34, 0.28, 0.14]} />
        <meshStandardMaterial color="#c9ccd0" metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.17, 0]}>
        <torusGeometry args={[0.11, 0.03, 8, 20, Math.PI]} />
        <meshStandardMaterial color="#d6b874" metalness={0.65} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.02, 0.075]}>
        <cylinderGeometry args={[0.03, 0.03, 0.02, 10]} />
        <meshStandardMaterial color="#6f7a82" />
      </mesh>
    </group>
  );
}

export const sharedMaterials = mat;
