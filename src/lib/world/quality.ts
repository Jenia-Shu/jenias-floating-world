/**
 * Rendering quality tiers for the two WebGL scenes.
 *
 * The site has a fairly heavy 3D map (dozens of shadow casters, three lights,
 * ACES tone mapping) plus a second 3D Fun Zone. On a real GPU that is fine;
 * on software rendering / weak integrated graphics it drops to a few frames
 * per second, and 4x MSAA is the single biggest cost there.
 *
 * Tiers:
 *  - "low"      software renderer or low-memory machine: no MSAA, 0.75x
 *               resolution, small shadow maps, shadow refresh every 3rd frame
 *  - "balanced" default for real GPUs: modest dpr, 1024/512 shadows, refresh
 *               every 2nd frame (visually identical to every frame here)
 *  - "high"     `?quality=high`: the original, untouched visual settings
 *
 * `?quality=low|balanced|high` forces a tier, which makes A/B checking easy.
 * `?fps=30|40|...` forces a frame cap (see FrameCap); 0 or `max` = uncapped.
 * The probe context is released immediately: every live WebGL context counts
 * against the browser's context budget (see WorldMap.hasWebGL).
 */

export type Quality = "low" | "balanced" | "high";

export type SceneSettings = {
  dpr: number | [number, number];
  antialias: boolean;
  shadowSize: number;
  shadowEvery: number;
  /** Target frames per second for the rAF throttle. 0 means uncapped. */
  fpsCap: number;
};

const TIERS: Record<Quality, { world: SceneSettings; fun: SceneSettings }> = {
  low: {
    world: { dpr: 0.6, antialias: false, shadowSize: 256, shadowEvery: 4, fpsCap: 30 },
    fun: { dpr: 0.6, antialias: false, shadowSize: 256, shadowEvery: 4, fpsCap: 30 },
  },
  balanced: {
    // Default for real GPUs. MSAA (antialias) is by far the heaviest cost on
    // weak integrated graphics, so it is off here; smaller shadows + a touch
    // lower dpr + a frame cap keep the scene smooth without looking flat.
    world: { dpr: 0.85, antialias: false, shadowSize: 512, shadowEvery: 4, fpsCap: 36 },
    fun: { dpr: 0.85, antialias: false, shadowSize: 512, shadowEvery: 4, fpsCap: 36 },
  },
  high: {
    world: { dpr: [1, 1.25], antialias: true, shadowSize: 2048, shadowEvery: 1, fpsCap: 60 },
    fun: { dpr: [1, 1.5], antialias: true, shadowSize: 1024, shadowEvery: 1, fpsCap: 60 },
  },
};

let cached: Quality | null = null;

function detect(): Quality {
  if (typeof window === "undefined") return "balanced";
  const forced = new URLSearchParams(window.location.search).get("quality");
  if (forced === "low" || forced === "balanced" || forced === "high") return forced;

  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
    if (gl) {
      const dbg = gl.getExtension("WEBGL_debug_renderer_info");
      const name = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : "";
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      if (/swiftshader|llvmpipe|software|basic render/i.test(name)) return "low";
    }
  } catch {
    // Detection is best-effort; fall through to the conservative default.
  }

  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const cores = navigator.hardwareConcurrency || 8;
  if ((typeof memory === "number" && memory <= 4) || cores <= 4) return "low";
  return "balanced";
}

export function renderQuality(): Quality {
  if (cached === null) cached = detect();
  return cached;
}

export function sceneSettings(): { world: SceneSettings; fun: SceneSettings } {
  return TIERS[renderQuality()];
}

/**
 * The target frame rate for the rAF throttle (see FrameCap). The scene's slow
 * ambient motion looks identical at ~40fps, so cap below the display rate to
 * keep the GPU from being asked for frames it cannot deliver (which is what
 * reads as "stutter" / "lag" on integrated graphics). `?fps=` overrides it.
 */
export function frameCap(): number {
  if (typeof window === "undefined") return 60;
  const raw = new URLSearchParams(window.location.search).get("fps");
  if (raw) {
    if (raw === "max" || raw === "0") return 0;
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 1 && n <= 120) return n;
  }
  return TIERS[renderQuality()].world.fpsCap;
}
