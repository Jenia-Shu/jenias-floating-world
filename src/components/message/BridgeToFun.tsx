/**
 * A short veil of fog that sits directly on top of the 3D Fun Zone and parts
 * to reveal it.
 *
 * The old crossing was its own page: a drawn wooden bridge, an SVG collie
 * walking away, a ferris wheel and a caption. That whole scene was removed —
 * the fog now covers the actual park, so "拨开云雾" lands straight on the 3D
 * scene with nothing drawn in between.
 *
 * Plain DOM + CSS: no second WebGL context, no audio, no dependency, no
 * images. Reduced motion skips the veil entirely.
 */

import { useEffect, useRef, useState } from "react";
import "./bridge-to-fun.css";

/** Keep in step with the 1.8s animation in bridge-to-fun.css. */
const DONE_AT = 1800;
/** Never hold the veil forever if the park fails to mount for some reason.
 *  Normal path is far faster: WorldMap awaits the chunk before mounting. */
const MAX_WAIT = 4000;

const CLOUDS = [
  { left: "6%", top: "14%", width: "42vw", height: "26vh" },
  { left: "54%", top: "8%", width: "40vw", height: "30vh" },
  { left: "-8%", top: "56%", width: "48vw", height: "32vh" },
  { left: "60%", top: "58%", width: "44vw", height: "30vh" },
  { left: "28%", top: "38%", width: "40vw", height: "24vh" },
];

type Props = {
  reducedMotion: boolean;
  /** Fog has parted: unmount this veil. */
  onDone: () => void;
};

export function BridgeToFun({ reducedMotion, onDone }: Props) {
  const timer = useRef(0);
  const [ready, setReady] = useState(false);

  // Hold the fog at full cover until the 3D park is really on screen. The
  // Fun Zone is a lazy chunk, so opening the veil too early would reveal a
  // loading gap instead of the park — exactly the "拨开之后直接就是这个" beat.
  useEffect(() => {
    if (reducedMotion) {
      onDone();
      return;
    }
    if (document.querySelector(".fz-root")) {
      setReady(true);
      return;
    }
    const observer = new MutationObserver(() => {
      if (!document.querySelector(".fz-root")) return;
      setReady(true);
      observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const fallback = window.setTimeout(() => setReady(true), MAX_WAIT);
    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, [reducedMotion, onDone]);

  useEffect(() => {
    if (!ready || reducedMotion) return;
    timer.current = window.setTimeout(onDone, DONE_AT);
    return () => window.clearTimeout(timer.current);
  }, [ready, reducedMotion, onDone]);

  if (reducedMotion) return null;

  return (
    <div className={`btf-root ${ready ? "" : "btf-root--hold"}`} aria-hidden>
      <div className="btf-base" />
      <div className="btf-half btf-half--left" />
      <div className="btf-half btf-half--right" />
      <div className="btf-clouds">
        {CLOUDS.map((c, i) => (
          <span
            key={i}
            className="btf-cloud"
            style={{ left: c.left, top: c.top, width: c.width, height: c.height }}
          />
        ))}
      </div>
    </div>
  );
}
