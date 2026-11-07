import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

/**
 * Caps the render rate of a `frameloop="demand"` canvas.
 *
 * The world and Fun Zone redraw continuously (`frameloop="always"`) even though
 * their motion is slow and ambient. Asking a weak GPU for 60+ frames a second
 * when it can only paint ~30 is the main source of the "lag" visitors report —
 * the pipeline backs up and every interaction stutters.
 *
 * With the canvas in `demand` mode this component pokes `invalidate()` at a
 * fixed cadence, so the scene still animates (dog, clouds, ferris wheel) but
 * never faster than `fps`. `fps` of 0 (or `?fps=max`) is uncapped. It renders
 * nothing and costs one rAF loop while mounted.
 */
export function FrameCap({ fps }: { fps: number }) {
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    if (!fps || fps >= 120) return; // uncapped
    let raf = 0;
    let last = performance.now();
    const interval = 1000 / fps;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const elapsed = now - last;
      if (elapsed >= interval) {
        // keep the cadence steady even if a frame was delayed
        last = now - (elapsed % interval);
        invalidate();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [fps, invalidate]);

  return null;
}
