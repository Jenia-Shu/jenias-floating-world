/**
 * The Last Light — final crossfade from Game 03 back to the cover page.
 *
 * Lives at the app root (like a curtain over the whole site), NOT inside the
 * Fun Zone, so it survives the route swapping from the 3D world back to the
 * Welcome screen. Pure DOM + CSS, no second WebGL context, no images.
 *
 * Beats: light door opens → finale line → the light dissolves into the exact
 * `.welcome-backdrop` sky → curtain fades, and the REAL Welcome cover (Jenia +
 * "Welcome to Jenia's World.") appears underneath with its own gentle rise.
 * We never draw a fake copy of the cover text, so there is no double image.
 *
 * Reduced motion skips the curtain entirely and reveals the cover at once.
 */

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";
import { FINALE, say } from "@/components/fun/games/last-light/content";
import "./last-light-home.css";

type Phase = "door" | "line" | "sky" | "fade";

const CLOUDS = [
  { left: "4%", top: "12%", width: "46vw", height: "28vh" },
  { left: "52%", top: "6%", width: "44vw", height: "30vh" },
  { left: "-10%", top: "54%", width: "50vw", height: "32vh" },
  { left: "58%", top: "56%", width: "46vw", height: "30vh" },
];

type Props = {
  /** Mount the real Welcome cover underneath the still-opaque curtain. */
  onReveal: () => void;
  /** Curtain has cleared — unmount it. */
  onDone: () => void;
};

export function LastLightHome({ onReveal, onDone }: Props) {
  const [lang] = useLang();
  const [phase, setPhase] = useState<Phase>("door");
  const timers = useRef<number[]>([]);
  const revealed = useRef(false);

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduce) {
      onReveal();
      onDone();
      return;
    }
    const at = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
    at(900, () => setPhase("line"));
    at(2700, () => setPhase("sky"));
    at(3100, () => {
      if (!revealed.current) {
        revealed.current = true;
        onReveal();
      }
    });
    at(3500, () => setPhase("fade"));
    at(4700, onDone);
    return () => {
      timers.current.forEach(window.clearTimeout);
      timers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="llh-root" data-phase={phase} aria-hidden>
      {/* the light washing over the last card, then holding the cover sky */}
      <div className="llh-veil" />
      <div className="llh-sky" />
      {/* a door of light */}
      <div className="llh-door">
        <div className="llh-door-inner" />
      </div>
      <div className="llh-glow" />
      {/* cloud banks part to either side */}
      <div className="llh-clouds">
        {CLOUDS.map((c, i) => (
          <span
            key={i}
            className={`llh-cloud llh-cloud--${i % 2 === 0 ? "left" : "right"}`}
            style={{ left: c.left, top: c.top, width: c.width, height: c.height }}
          />
        ))}
      </div>
      <p className="llh-finale">{say(FINALE, lang)}</p>
    </div>
  );
}
