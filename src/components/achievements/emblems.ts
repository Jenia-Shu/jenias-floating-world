/**
 * One small 3D object per badge, built from primitives.
 *
 * The wall renders these through a single shared WebGL renderer into cached
 * PNG data URLs instead of mounting twenty-two canvases: browsers only allow a
 * handful of live contexts, and the wall must not spend that budget on
 * thumbnails. The detail view and the unlock moment use a real rotating canvas.
 */

import * as THREE from "three";
import type { EmblemKey } from "@/lib/achievements/types";

type Metal = [string, string];

type Palette = {
  main: THREE.Material;
  deep: THREE.Material;
  light: THREE.Material;
};

function palette(metal: Metal, silhouette: boolean): Palette {
  if (silhouette) {
    const gray = new THREE.MeshStandardMaterial({
      color: "#7f858d",
      metalness: 0.12,
      roughness: 0.88,
    });
    const darker = new THREE.MeshStandardMaterial({
      color: "#6b7179",
      metalness: 0.1,
      roughness: 0.92,
    });
    return { main: gray, deep: darker, light: gray };
  }
  return {
    main: new THREE.MeshStandardMaterial({ color: metal[0], metalness: 0.72, roughness: 0.3 }),
    deep: new THREE.MeshStandardMaterial({ color: metal[1], metalness: 0.6, roughness: 0.42 }),
    light: new THREE.MeshStandardMaterial({ color: "#fbf7ec", metalness: 0.25, roughness: 0.4 }),
  };
}

function put(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  position: [number, number, number] = [0, 0, 0],
  rotation: [number, number, number] = [0, 0, 0],
  scale: [number, number, number] | number = 1,
) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  if (typeof scale === "number") mesh.scale.setScalar(scale);
  else mesh.scale.set(...scale);
  parent.add(mesh);
  return mesh;
}

function bar(
  parent: THREE.Object3D,
  mat: THREE.Material,
  a: THREE.Vector3,
  b: THREE.Vector3,
  r = 0.012,
) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), mat);
  mesh.position.copy(a).addScaledVector(dir, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  parent.add(mesh);
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

function globe(p: Palette) {
  const g = new THREE.Group();
  put(g, new THREE.SphereGeometry(0.46, 28, 20), p.main, [0, 0.12, 0]);
  put(
    g,
    new THREE.TorusGeometry(0.56, 0.024, 8, 48),
    p.deep,
    [0, 0.12, 0],
    [Math.PI / 2.3, 0.2, 0],
  );
  put(
    g,
    new THREE.TorusGeometry(0.56, 0.024, 8, 48),
    p.light,
    [0, 0.12, 0],
    [Math.PI / 1.7, 0.9, 0.3],
  );
  put(g, new THREE.SphereGeometry(0.09, 12, 10), p.light, [0.2, 0.34, 0.34]);
  return g;
}

function music(p: Palette) {
  const g = new THREE.Group();
  // three strings on a small lyre
  for (let i = 0; i < 3; i++) {
    put(g, new THREE.CylinderGeometry(0.012, 0.012, 0.62, 8), p.light, [-0.14 + i * 0.14, 0.05, 0]);
  }
  put(
    g,
    new THREE.TorusGeometry(0.26, 0.035, 10, 32, Math.PI),
    p.main,
    [0, 0.05, 0],
    [0, 0, Math.PI],
  );
  put(g, new THREE.BoxGeometry(0.44, 0.07, 0.1), p.deep, [0, -0.3, 0]);
  put(g, new THREE.SphereGeometry(0.06, 12, 10), p.deep, [0.26, 0.22, 0.02]);
  put(g, new THREE.CylinderGeometry(0.012, 0.012, 0.24, 8), p.deep, [0.26, 0.34, 0.02]);
  put(g, new THREE.TorusGeometry(0.1, 0.022, 8, 24), p.main, [-0.3, 0.28, 0], [0.4, 0.2, 0.3]);
  return g;
}

function compass(p: Palette) {
  const g = new THREE.Group();
  put(g, new THREE.TorusGeometry(0.42, 0.06, 12, 40), p.main, [0, 0.08, 0]);
  put(
    g,
    new THREE.CylinderGeometry(0.03, 0.03, 0.02, 12),
    p.deep,
    [0, 0.08, 0.02],
    [Math.PI / 2, 0, 0],
  );
  put(g, new THREE.ConeGeometry(0.1, 0.42, 4), p.light, [0, 0.25, 0.03], [0, 0, 0.35]);
  put(g, new THREE.ConeGeometry(0.1, 0.34, 4), p.deep, [0, -0.1, 0.03], [0, 0, Math.PI + 0.35]);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    put(
      g,
      new THREE.BoxGeometry(0.035, 0.07, 0.02),
      p.deep,
      [Math.cos(a) * 0.5, 0.08 + Math.sin(a) * 0.5, 0],
      [0, 0, a],
    );
  }
  return g;
}

function eye(p: Palette) {
  const g = new THREE.Group();
  put(g, new THREE.SphereGeometry(0.42, 24, 18), p.light, [0, 0.08, 0], [0, 0, 0], [1, 0.62, 0.7]);
  put(g, new THREE.SphereGeometry(0.2, 20, 16), p.deep, [0, 0.08, 0.18], [0, 0, 0], [1, 1, 0.55]);
  put(g, new THREE.SphereGeometry(0.09, 14, 12), p.main, [0, 0.08, 0.3]);
  for (let i = 0; i < 7; i++) {
    const a = -1.2 + (i / 6) * 2.4;
    put(
      g,
      new THREE.ConeGeometry(0.03, 0.16, 6),
      p.main,
      [Math.sin(a) * 0.5, 0.08 + Math.cos(a) * 0.42, 0],
      [0, 0, -a],
    );
  }
  return g;
}

function sun(p: Palette) {
  const g = new THREE.Group();
  put(g, new THREE.SphereGeometry(0.28, 22, 16), p.main, [0, 0.1, 0]);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    put(
      g,
      new THREE.ConeGeometry(0.06, i % 2 ? 0.2 : 0.3, 5),
      i % 2 ? p.light : p.deep,
      [Math.cos(a) * 0.46, 0.1 + Math.sin(a) * 0.46, 0],
      [0, 0, a - Math.PI / 2],
    );
  }
  return g;
}

function quill(p: Palette) {
  const g = new THREE.Group();
  put(
    g,
    new THREE.ConeGeometry(0.16, 0.78, 10),
    p.main,
    [0, 0.28, 0],
    [0.2, 0, 0.16],
    [1, 1, 0.55],
  );
  put(
    g,
    new THREE.CylinderGeometry(0.012, 0.02, 0.62, 8),
    p.deep,
    [0.12, 0.02, 0.02],
    [0, 0, 0.18],
  );
  put(g, new THREE.ConeGeometry(0.045, 0.12, 6), p.light, [0.25, -0.32, 0.05], [0, 0, 0.3]);
  for (let i = 0; i < 5; i++) {
    put(
      g,
      new THREE.ConeGeometry(0.02, 0.1, 5),
      p.light,
      [-0.06 + i * 0.03, 0.55 - i * 0.09, 0.02],
      [0, 0, -0.9],
    );
  }
  return g;
}

function lens(p: Palette) {
  const g = new THREE.Group();
  put(g, new THREE.TorusGeometry(0.3, 0.055, 10, 36), p.main, [0, 0.18, 0]);
  put(
    g,
    new THREE.CylinderGeometry(0.26, 0.26, 0.02, 28),
    p.light,
    [0, 0.18, 0],
    [Math.PI / 2, 0, 0],
  );
  put(g, new THREE.CylinderGeometry(0.05, 0.06, 0.55, 10), p.deep, [0.28, -0.2, 0], [0, 0, 0.6]);
  put(g, new THREE.SphereGeometry(0.075, 12, 10), p.deep, [0.42, -0.42, 0]);
  put(
    g,
    new THREE.TorusGeometry(0.11, 0.025, 8, 24),
    p.light,
    [-0.22, 0.42, 0.06],
    [0.5, 0.3, 0.6],
  );
  return g;
}

function plane(p: Palette) {
  const g = new THREE.Group();
  put(g, new THREE.ConeGeometry(0.16, 0.9, 3), p.light, [0, 0.12, 0], [Math.PI / 2, 0, 0]);
  put(g, new THREE.BoxGeometry(0.72, 0.035, 0.24), p.main, [0, 0.14, -0.02], [0, 0, 0.12]);
  put(g, new THREE.BoxGeometry(0.2, 0.03, 0.3), p.deep, [0, 0.2, 0.36]);
  put(g, new THREE.BoxGeometry(0.16, 0.12, 0.03), p.main, [0, 0.02, 0.32], [0, 0, Math.PI / 2]);
  return g;
}

function wand(p: Palette) {
  const g = new THREE.Group();
  put(g, new THREE.CylinderGeometry(0.035, 0.05, 0.85, 10), p.deep, [0, -0.1, 0], [0, 0, 0.5]);
  put(g, new THREE.ConeGeometry(0.1, 0.22, 8), p.main, [0.38, 0.32, 0], [0, 0, -0.5]);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    put(g, new THREE.OctahedronGeometry(0.07, 0), p.light, [
      0.38 + Math.cos(a) * 0.28,
      0.32 + Math.sin(a) * 0.28,
      Math.sin(a) * 0.1,
    ]);
  }
  return g;
}

function flag(p: Palette) {
  const g = new THREE.Group();
  put(g, new THREE.CylinderGeometry(0.028, 0.035, 0.95, 10), p.deep, [0, 0.08, 0]);
  put(g, new THREE.SphereGeometry(0.07, 12, 10), p.main, [0, 0.58, 0]);
  put(g, new THREE.BoxGeometry(0.52, 0.32, 0.03), p.main, [0.27, 0.38, 0], [0, 0, 0.06]);
  put(g, new THREE.BoxGeometry(0.52, 0.06, 0.035), p.light, [0.27, 0.26, 0], [0, 0, 0.06]);
  return g;
}

function sprout(p: Palette) {
  const g = new THREE.Group();
  put(g, new THREE.CylinderGeometry(0.18, 0.24, 0.16, 14), p.deep, [0, -0.32, 0]);
  put(g, new THREE.CylinderGeometry(0.025, 0.04, 0.5, 8), p.main, [0, -0.05, 0]);
  put(
    g,
    new THREE.SphereGeometry(0.2, 16, 12),
    p.main,
    [-0.18, 0.14, 0],
    [0, 0, 0.5],
    [1, 0.55, 0.5],
  );
  put(
    g,
    new THREE.SphereGeometry(0.16, 16, 12),
    p.light,
    [0.16, 0.22, 0],
    [0, 0, -0.5],
    [1, 0.5, 0.45],
  );
  put(g, new THREE.SphereGeometry(0.06, 10, 8), p.deep, [0, 0.42, 0]);
  return g;
}

function horizon(p: Palette) {
  const g = new THREE.Group();
  put(g, new THREE.TorusGeometry(0.4, 0.035, 8, 40, Math.PI), p.main, [0, 0.0, 0], [0, 0, 0]);
  put(g, new THREE.SphereGeometry(0.17, 18, 14), p.light, [0, 0.06, 0]);
  for (let i = 0; i < 3; i++) {
    put(g, new THREE.BoxGeometry(0.9 - i * 0.18, 0.03, 0.08), p.deep, [0, -0.22 - i * 0.09, 0.04]);
  }
  put(g, new THREE.ConeGeometry(0.09, 0.2, 4), p.light, [-0.42, 0.42, 0], [0, 0, 0.4]);
  return g;
}

function hourglass(p: Palette) {
  const g = new THREE.Group();
  put(g, new THREE.CylinderGeometry(0.3, 0.3, 0.06, 20), p.main, [0, 0.38, 0]);
  put(g, new THREE.CylinderGeometry(0.3, 0.3, 0.06, 20), p.main, [0, -0.38, 0]);
  put(g, new THREE.ConeGeometry(0.26, 0.42, 18), p.light, [0, 0.16, 0]);
  put(g, new THREE.ConeGeometry(0.26, 0.42, 18), p.light, [0, -0.16, 0], [Math.PI, 0, 0]);
  put(g, new THREE.SphereGeometry(0.12, 14, 10), p.deep, [0, -0.2, 0], [0, 0, 0], [1, 0.7, 1]);
  for (let i = 0; i < 3; i++)
    put(g, new THREE.CylinderGeometry(0.02, 0.02, 0.6, 6), p.deep, [-0.3 + i * 0.3, 0, 0]);
  return g;
}

function treasure(p: Palette) {
  const g = new THREE.Group();
  put(g, new THREE.BoxGeometry(0.62, 0.34, 0.42), p.main, [0, -0.1, 0]);
  put(
    g,
    new THREE.CylinderGeometry(0.21, 0.21, 0.62, 16, 1, false, 0, Math.PI),
    p.deep,
    [0, 0.07, 0],
    [0, 0, Math.PI / 2],
    [1, 1, 1],
  );
  put(g, new THREE.BoxGeometry(0.1, 0.14, 0.04), p.light, [0, -0.02, 0.22]);
  for (let i = 0; i < 3; i++) {
    put(g, new THREE.OctahedronGeometry(0.09, 0), p.light, [-0.16 + i * 0.16, -0.06, 0.26]);
  }
  return g;
}

function constellation(p: Palette) {
  const g = new THREE.Group();
  const pts = [
    V(-0.4, 0.3, 0),
    V(-0.1, 0.5, 0.05),
    V(0.18, 0.2, 0),
    V(0.42, 0.36, 0.04),
    V(0.05, -0.18, 0),
    V(-0.28, -0.3, 0.02),
  ];
  for (const pt of pts)
    put(g, new THREE.SphereGeometry(0.075, 12, 10), p.light, [pt.x, pt.y, pt.z]);
  for (let i = 0; i < pts.length - 1; i++) bar(g, p.main, pts[i]!, pts[i + 1]!, 0.008);
  bar(g, p.main, pts[2]!, pts[4]!, 0.008);
  return g;
}

function keyhole(p: Palette) {
  const g = new THREE.Group();
  put(g, new THREE.TorusGeometry(0.3, 0.05, 10, 32), p.main, [0, 0.2, 0]);
  put(g, new THREE.CylinderGeometry(0.055, 0.055, 0.3, 10), p.deep, [0, -0.14, 0]);
  put(g, new THREE.BoxGeometry(0.18, 0.08, 0.08), p.deep, [0.08, -0.34, 0]);
  put(g, new THREE.BoxGeometry(0.08, 0.08, 0.08), p.light, [0.14, -0.24, 0]);
  put(g, new THREE.SphereGeometry(0.07, 12, 10), p.light, [0, 0.2, 0.02]);
  return g;
}

function eggs(p: Palette) {
  const g = new THREE.Group();
  put(
    g,
    new THREE.TorusGeometry(0.32, 0.09, 8, 28),
    p.deep,
    [0, -0.24, 0],
    [Math.PI / 2, 0, 0],
    [1, 1, 0.7],
  );
  const spots: [number, number, number][] = [
    [0, -0.06, 0],
    [-0.22, -0.14, 0.04],
    [0.22, -0.12, -0.02],
  ];
  spots.forEach((s, i) => {
    put(
      g,
      new THREE.SphereGeometry(0.16, 16, 12),
      i === 0 ? p.light : p.main,
      s,
      [0, 0, 0],
      [0.82, 1.12, 0.82],
    );
  });
  for (let i = 0; i < 4; i++) {
    put(
      g,
      new THREE.ConeGeometry(0.02, 0.14, 5),
      p.deep,
      [-0.3 + i * 0.2, -0.3, 0.12],
      [0.4, 0, 0.5 + i * 0.2],
    );
  }
  return g;
}

function book(p: Palette) {
  const g = new THREE.Group();
  put(g, new THREE.BoxGeometry(0.56, 0.72, 0.12), p.main, [0, 0.02, 0]);
  put(g, new THREE.BoxGeometry(0.5, 0.66, 0.08), p.light, [0.02, 0.02, 0.09]);
  put(g, new THREE.BoxGeometry(0.08, 0.72, 0.14), p.deep, [-0.24, 0.02, 0]);
  for (let i = 0; i < 4; i++) {
    put(g, new THREE.BoxGeometry(0.34, 0.02, 0.02), p.deep, [0.02, 0.26 - i * 0.1, 0.14]);
  }
  put(g, new THREE.BoxGeometry(0.06, 0.34, 0.02), p.deep, [0.2, 0.36, 0.15], [0, 0, 0.3]);
  return g;
}

function gauge(p: Palette) {
  const g = new THREE.Group();
  put(g, new THREE.TorusGeometry(0.4, 0.05, 10, 40, Math.PI), p.main, [0, 0.02, 0], [0, 0, 0]);
  put(
    g,
    new THREE.CylinderGeometry(0.045, 0.045, 0.03, 12),
    p.deep,
    [0, 0.02, 0.03],
    [Math.PI / 2, 0, 0],
  );
  put(
    g,
    new THREE.CylinderGeometry(0.02, 0.02, 0.32, 8),
    p.light,
    [0.11, 0.18, 0.03],
    [0, 0, -0.7],
  );
  for (let i = 0; i < 7; i++) {
    const a = Math.PI - (i / 6) * Math.PI;
    put(
      g,
      new THREE.BoxGeometry(0.03, 0.07, 0.02),
      p.deep,
      [Math.cos(a) * 0.46, 0.02 + Math.sin(a) * 0.46, 0],
      [0, 0, a],
    );
  }
  return g;
}

function paw(p: Palette) {
  const g = new THREE.Group();
  put(g, new THREE.SphereGeometry(0.3, 18, 14), p.main, [0, -0.12, 0], [0, 0, 0], [1, 0.82, 0.6]);
  const toes: [number, number, number][] = [
    [-0.34, 0.16, 0],
    [-0.12, 0.32, 0.02],
    [0.12, 0.32, 0.02],
    [0.34, 0.16, 0],
  ];
  for (const t of toes) {
    put(g, new THREE.SphereGeometry(0.11, 14, 10), p.light, t, [0, 0, 0], [1, 0.9, 0.6]);
  }
  return g;
}

function clover(p: Palette) {
  const g = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    put(
      g,
      new THREE.SphereGeometry(0.2, 16, 12),
      i % 2 ? p.light : p.main,
      [Math.cos(a) * 0.22, 0.18 + Math.sin(a) * 0.22, 0],
      [0, 0, a],
      [1, 0.7, 0.4],
    );
  }
  put(g, new THREE.CylinderGeometry(0.025, 0.04, 0.4, 8), p.deep, [0, -0.3, 0], [0, 0, 0.1]);
  return g;
}

function percent(p: Palette) {
  const g = new THREE.Group();
  put(g, new THREE.TorusGeometry(0.18, 0.055, 10, 28), p.main, [-0.24, 0.24, 0]);
  put(g, new THREE.TorusGeometry(0.18, 0.055, 10, 28), p.light, [0.24, -0.2, 0]);
  put(g, new THREE.CylinderGeometry(0.035, 0.035, 0.9, 8), p.deep, [0, 0.02, 0], [0, 0, 0.7]);
  put(g, new THREE.OctahedronGeometry(0.09, 0), p.deep, [0.42, 0.36, 0]);
  return g;
}

const BUILDERS: Record<EmblemKey, (p: Palette) => THREE.Group> = {
  globe,
  music,
  compass,
  eye,
  sun,
  quill,
  lens,
  plane,
  wand,
  flag,
  sprout,
  horizon,
  hourglass,
  treasure,
  constellation,
  keyhole,
  eggs,
  book,
  gauge,
  paw,
  clover,
  percent,
};

export function buildEmblem(key: EmblemKey, metal: Metal, silhouette: boolean): THREE.Group {
  const g = BUILDERS[key](palette(metal, silhouette));
  g.rotation.x = 0.16;
  return g;
}

export function emblemScene(key: EmblemKey, metal: Metal, silhouette: boolean): THREE.Scene {
  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xffffff, silhouette ? 0.85 : 0.62));
  const keyLight = new THREE.DirectionalLight(0xfff4df, silhouette ? 0.7 : 1.5);
  keyLight.position.set(2.4, 3.2, 3.4);
  scene.add(keyLight);
  const rim = new THREE.DirectionalLight(0xcfe0ff, silhouette ? 0.2 : 0.7);
  rim.position.set(-3, 1, -2.4);
  scene.add(rim);
  const bounce = new THREE.DirectionalLight(0xf6e6c8, 0.35);
  bounce.position.set(0, -2, 2);
  scene.add(bounce);
  scene.add(buildEmblem(key, metal, silhouette));
  return scene;
}

const SIZE = 256;
let renderer: THREE.WebGLRenderer | null = null;

function getRenderer(): THREE.WebGLRenderer | null {
  if (renderer) return renderer;
  try {
    const next = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    next.setPixelRatio(1);
    next.setSize(SIZE, SIZE, false);
    next.outputColorSpace = THREE.SRGBColorSpace;
    // A context lost in the background must not leave the wall permanently
    // blank: drop the renderer so the next thumbnail builds a fresh one.
    next.domElement.addEventListener(
      "webglcontextlost",
      () => {
        if (renderer === next) renderer = null;
      },
      { once: true },
    );
    renderer = next;
  } catch {
    renderer = null;
  }
  return renderer;
}

const cache = new Map<string, string>();

/** Cached transparent PNG for one emblem. Empty string if WebGL is unavailable. */
export function emblemDataUrl(key: EmblemKey, metal: Metal, silhouette: boolean): string {
  const id = `${key}|${metal[0]}|${metal[1]}|${silhouette ? "s" : "c"}`;
  const hit = cache.get(id);
  if (hit !== undefined) return hit;
  const r = getRenderer();
  // Never cache the failure: a context can come back, and a permanently cached
  // empty string would turn every emblem on the wall into a placeholder dot.
  if (!r) return "";
  try {
    const scene = emblemScene(key, metal, silhouette);
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
    camera.position.set(0, 0.3, 3.5);
    camera.lookAt(0, 0.08, 0);
    r.render(scene, camera);
    const url = r.domElement.toDataURL("image/png");
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) obj.geometry.dispose();
    });
    cache.set(id, url);
    return url;
  } catch {
    renderer = null;
    return "";
  }
}
