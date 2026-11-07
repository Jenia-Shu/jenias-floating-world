/**
 * The crossing between the Message Island and the Fun Zone.
 *
 * "跟上它 / Follow her" used to cut straight to the park page. This interlude
 * keeps the story beat from the brief: the collie leads the way down the wooden
 * bridge, the fog gathers, and then opens to reveal the 3D amusement island.
 *
 * It is a plain DOM/SVG overlay — the 3D map canvas keeps running underneath,
 * and no second WebGL context is ever created. While the fog is thickest the
 * parent swaps the open page for the Fun Zone, so the hand-off between the two
 * canvases is hidden instead of flashing. Reduced motion skips it entirely.
 */

import { useCallback, useEffect, useRef } from "react";
import { pick, type Lang } from "@/lib/i18n";
import "./bridge-to-fun.css";

/** Must stay in step with btf-veil in bridge-to-fun.css (4.3s). */
const REVEAL_AT = 1100;
const DONE_AT = 4300;

type Props = {
  lang: Lang;
  reducedMotion: boolean;
  /** Fog at full cover: open the Fun Zone behind the veil. */
  onReveal: () => void;
  /** Fog cleared: unmount this overlay. */
  onDone: () => void;
};

const CLOUDS = [
  { left: "4%", top: "18%", width: "38vw", height: "22vh", delay: "0s", duration: "9s" },
  { left: "58%", top: "8%", width: "44vw", height: "26vh", delay: "-3s", duration: "11s" },
  { left: "-8%", top: "58%", width: "46vw", height: "30vh", delay: "-5s", duration: "10s" },
  { left: "62%", top: "62%", width: "42vw", height: "28vh", delay: "-1.5s", duration: "8.5s" },
  { left: "30%", top: "40%", width: "34vw", height: "20vh", delay: "-6s", duration: "12s" },
];

/** Perspective planks: the bridge narrows towards the far end at y = 34. */
const PLANKS = Array.from({ length: 9 }, (_, i) => {
  const t = (i + 1) / 10;
  return { y: 34 + t * 186, x1: 300 - 300 * t, x2: 420 + 300 * t };
});

const WHEEL_SPOKES = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2;
  return { x: 60 + Math.cos(a) * 49, y: 60 + Math.sin(a) * 49 };
});

function WoodenBridge() {
  return (
    <svg className="btf-bridge" viewBox="0 0 720 220" preserveAspectRatio="none" aria-hidden>
      <path d="M0 220 L300 34 L420 34 L720 220 Z" fill="#c9ad87" />
      {PLANKS.map((p, i) => (
        <line key={i} x1={p.x1} y1={p.y} x2={p.x2} y2={p.y} stroke="#a98d68" strokeWidth="2" opacity="0.55" />
      ))}
      <path d="M300 34 L0 220 M420 34 L720 220" stroke="#a98d68" strokeWidth="3" fill="none" opacity="0.6" />
    </svg>
  );
}

function FerrisWheel() {
  return (
    <div className="btf-wheel-wrap" aria-hidden>
      <svg className="btf-wheel" viewBox="0 0 120 120" fill="none">
        <path d="M60 62 L34 116 M60 62 L86 116" stroke="#9db4bb" strokeWidth="2.5" />
        <circle cx="60" cy="60" r="49" stroke="#8fa9b2" strokeWidth="2" />
        <circle cx="60" cy="60" r="6" fill="#b9cdd6" />
        {WHEEL_SPOKES.map((s, i) => (
          <g key={i}>
            <line x1="60" y1="60" x2={s.x} y2={s.y} stroke="#a9bfc6" strokeWidth="1.4" />
            <circle cx={s.x} cy={s.y} r="4.2" fill="#f3e1c2" />
          </g>
        ))}
      </svg>
    </div>
  );
}

/** A small black-and-white border collie, seen from the side, facing right. */
function Collie() {
  return (
    <div className="btf-collie-wrap" aria-hidden>
      <svg viewBox="0 0 110 72" fill="none">
        <path d="M14 32C6 28 2 20 5 13c6 3 11 9 14 15l-5 4Z" fill="#f8f6f0" />
        <path d="M18 30c8-9 24-12 38-11 9 1 17 4 21 10l3 13-58 2-4-14Z" fill="#3c454a" />
        <path d="M25 39c12 5 32 6 50 4l2 9-48 2-4-15Z" fill="#f8f6f0" />
        <path d="M29 47h6l-1 16h-5V47ZM69 46h6l1 17h-5L69 46Z" fill="#f8f6f0" />
        <path d="M29 60h6v4h-6zM70 60h6v4h-6z" fill="#3c454a" />
        <path d="M76 24c4-8 12-11 20-8l8 6-2 12-13 4c-8-2-13-7-13-14Z" fill="#f8f6f0" />
        <path d="M80 18l3-9 8 6-4 7-7-4Z" fill="#3c454a" />
        <path d="M96 18c5 0 8 3 8 7l-6 4-5-6 3-5Z" fill="#3c454a" />
        <circle cx="103" cy="29" r="2.2" fill="#2c3337" />
      </svg>
    </div>
  );
}

export function BridgeToFun({ lang, reducedMotion, onReveal, onDone }: Props) {
  const revealed = useRef(false);
  const timers = useRef<number[]>([]);

  const reveal = useCallback(() => {
    if (revealed.current) return;
    revealed.current = true;
    onReveal();
  }, [onReveal]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }, []);

  const finish = useCallback(() => {
    clearTimers();
    reveal();
    onDone();
  }, [clearTimers, reveal, onDone]);

  useEffect(() => {
    // Never make someone who asked for less motion sit through a 4s veil.
    if (reducedMotion) {
      reveal();
      onDone();
      return;
    }
    timers.current.push(window.setTimeout(reveal, REVEAL_AT));
    timers.current.push(
      window.setTimeout(() => {
        timers.current = [];
        onDone();
      }, DONE_AT),
    );
    return clearTimers;
  }, [reducedMotion, reveal, onDone, clearTimers]);

  return (
    <div className="btf-root" role="status" aria-live="polite">
      <div className="btf-fog" aria-hidden>
        {CLOUDS.map((c, i) => (
          <span
            key={i}
            className="btf-cloud"
            style={{
              left: c.left,
              top: c.top,
              width: c.width,
              height: c.height,
              animationDelay: c.delay,
              animationDuration: c.duration,
            }}
          />
        ))}
      </div>

      <div className="btf-scene" aria-hidden>
        <WoodenBridge />
        <FerrisWheel />
        <Collie />
      </div>

      <div className="btf-caption">
        <p className="btf-kicker">{pick(lang, "A NEW PLACE TO DISCOVER", "云雾的另一边")}</p>
        <p className="btf-title">Fun Zone</p>
        <p className="btf-sub">{pick(lang, "Play a little", "乐园 · 玩一会儿")}</p>
      </div>

      <button type="button" className="btf-skip" onClick={finish}>
        {pick(lang, "Skip", "跳过")}
      </button>
    </div>
  );
}
