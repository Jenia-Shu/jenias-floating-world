/**
 * Game 03 — The Last Light / 最后一束光.
 *
 * A closing ceremony in four acts. Act 2 is where the "game" lives: three
 * lamps, each lit by a different classic little mechanic —
 *   1. Memory Match  (find three pairs)
 *   2. Rhythm / Timing (keep a breathing light company, three taps)
 *   3. Collect & Light (gather nine drifting motes into the lamp)
 * They share one goal (three lamps) so the act still reads as one ceremony,
 * not a minigame compilation. Nothing is scored, timed, ranked or failed:
 * a mismatched pair just turns back, every rhythm tap counts, and every mote
 * goes home. `prefers-reduced-motion` / reducedMotion removes the timing
 * judgement entirely — three quiet taps light the second lamp.
 *
 * The three fragments and the five closing lines keep their exact wording;
 * no attribution or "draft" label appears anywhere in the UI.
 *
 * Pure DOM + CSS over the shared 3D canvas. The final "light becomes the cover
 * sky" crossfade is handled one level up (LastLightHome.tsx) and is untouched.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { pick, type Lang } from "@/lib/i18n";
import { playSound } from "@/lib/fun/sound";
import { markCompleted, type FunState, type RewardId } from "@/lib/fun/funZone";
import {
  ALL_LIT_NEXT,
  CARD_BEFORE,
  CARD_EYEBROW,
  CARD_JOURNEY,
  CARD_LEAD,
  CARD_SIGN,
  CHOICES,
  COLLECT_COUNT,
  COLLECT_DONE,
  COLLECT_HINT,
  COLLECT_TITLE,
  FRAGMENTS,
  GAME_SUBTITLE,
  GAME_TITLE,
  INTRO,
  LAMP_DONE,
  LAMP_EXIT,
  LAMP_LEAD,
  LAMP_OF,
  LAMP_TITLE,
  MEMORY_DONE,
  MEMORY_HINT,
  MEMORY_TITLE,
  NEXT_LIGHT,
  PAIR_SYMBOLS,
  RHYTHM_BULLSEYE,
  RHYTHM_DONE,
  RHYTHM_HINT,
  RHYTHM_TAP,
  RHYTHM_TITLE,
  say,
} from "./content";
import "./last-light.css";

type Act = "pause" | "lamps" | "choose" | "card" | "ending";
/** A lamp is first played, then its fragment of writing is read. */
type LampPhase = "play" | "read";

type Props = {
  lang: Lang;
  state: FunState;
  commit: (next: FunState) => void;
  /** Back to the Fun Zone park without ending the journey. */
  onExit: () => void;
  /** Begin the light-to-cover crossfade and return to the home screen. */
  onFinish: () => void;
  /** Removes the rhythm timing judgement; three taps always light the lamp. */
  reducedMotion?: boolean;
};

/**
 * A fixed, deliberately "shuffled-looking" deck. It must be identical on the
 * server prerender and the client, so no Math.random() here.
 */
const DECK: readonly string[] = [PAIR_SYMBOLS[0], PAIR_SYMBOLS[2], PAIR_SYMBOLS[1], PAIR_SYMBOLS[1], PAIR_SYMBOLS[0], PAIR_SYMBOLS[2]];

/** Nine drifting motes, placed by hand so the field stays readable on mobile. */
const MOTES = [
  { x: 11, y: 17 },
  { x: 34, y: 8 },
  { x: 63, y: 13 },
  { x: 85, y: 25 },
  { x: 7, y: 53 },
  { x: 76, y: 47 },
  { x: 92, y: 64 },
  { x: 24, y: 79 },
  { x: 56, y: 85 },
] as const;

const RHYTHM_PERIOD = 2600;
const glowAt = (p: number) => 0.5 + 0.5 * Math.sin(p * Math.PI * 2 - Math.PI / 2);

export function LastLightGame({ lang, state, commit, onExit, onFinish, reducedMotion = false }: Props) {
  const [act, setAct] = useState<Act>("pause");
  const [lamp, setLamp] = useState(0);
  const [lampPhase, setLampPhase] = useState<LampPhase>("play");
  const [litCount, setLitCount] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);

  /* Lamp 1 — Memory Match */
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const flipLock = useRef(false);

  /* Lamp 2 — breathing light */
  const [taps, setTaps] = useState(0);
  const [bullseye, setBullseye] = useState(false);
  const pulseRef = useRef<HTMLButtonElement>(null);
  const phaseRef = useRef(0);

  /* Lamp 3 — drifting motes */
  const [gathered, setGathered] = useState<number[]>([]);

  const V = (en: string, zh: string) => pick(lang, en, zh);
  const L = (l: { en: string; zh: string }) => say(l, lang);

  /** One lamp is lit: play the soft chime, then show that fragment's words. */
  const lightLamp = useCallback(() => {
    playSound("complete");
    setLitCount(lamp + 1);
    setLampPhase("read");
  }, [lamp]);

  const start = useCallback(() => {
    playSound("tap");
    setAct("lamps");
    setLamp(0);
    setLampPhase("play");
    setLitCount(0);
  }, []);

  const nextLamp = useCallback(() => {
    playSound("tap");
    if (lamp < FRAGMENTS.length - 1) {
      setLamp(lamp + 1);
      setLampPhase("play");
    } else {
      setAct("choose");
    }
  }, [lamp]);

  /* ------------------------------------------------------- Lamp 1: pairs */

  const flip = useCallback(
    (i: number) => {
      if (flipLock.current || matched.includes(i) || flipped.includes(i)) return;
      playSound("tap");
      const next = [...flipped, i];
      setFlipped(next);
      if (next.length < 2) return;
      flipLock.current = true;
      const [a, b] = next as [number, number];
      if (DECK[a] === DECK[b]) {
        window.setTimeout(() => {
          const m = [...matched, a, b];
          setMatched(m);
          setFlipped([]);
          flipLock.current = false;
          playSound("correct");
          if (m.length === DECK.length) lightLamp();
        }, 420);
      } else {
        // A mismatch is not a mistake: the cards simply turn back.
        window.setTimeout(() => {
          setFlipped([]);
          flipLock.current = false;
        }, 760);
      }
    },
    [flipped, matched, lightLamp],
  );

  /* ------------------------------------------------------ Lamp 2: rhythm */

  // A single rAF drives both the visual glow and the timing judgement, so the
  // two can never disagree. No React state per frame.
  useEffect(() => {
    if (act !== "lamps" || lamp !== 1 || lampPhase !== "play" || reducedMotion) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = ((now - t0) % RHYTHM_PERIOD) / RHYTHM_PERIOD;
      phaseRef.current = p;
      pulseRef.current?.style.setProperty("--ll-glow", glowAt(p).toFixed(3));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [act, lamp, lampPhase, reducedMotion]);

  const tapLight = useCallback(() => {
    if (taps >= 3) return;
    const bright = !reducedMotion && glowAt(phaseRef.current) > 0.72;
    setBullseye(bright);
    playSound(bright ? "star" : "tap");
    window.setTimeout(() => setBullseye(false), 900);
    const n = taps + 1;
    setTaps(n);
    if (n >= 3) window.setTimeout(lightLamp, 460);
  }, [taps, reducedMotion, lightLamp]);

  /* ---------------------------------------------------- Lamp 3: gathering */

  const gather = useCallback(
    (i: number) => {
      if (gathered.includes(i)) return;
      const next = [...gathered, i];
      setGathered(next);
      playSound("star");
      if (next.length === MOTES.length) window.setTimeout(lightLamp, 460);
    },
    [gathered, lightLamp],
  );

  /* -------------------------------------------------------------- finish */

  const finish = useCallback(() => {
    if (!chosen) return;
    const completion = markCompleted(state, "choice-adventure");
    const rewards: RewardId[] = completion.state.rewards.includes("last-light-card")
      ? completion.state.rewards
      : [...completion.state.rewards, "last-light-card" as const];
    commit({
      ...completion.state,
      // Keep it replayable from the park even when a visitor arrived through
      // the debug shortcut without finishing Tiny Maze first.
      unlocked: { ...completion.state.unlocked, "choice-adventure": true },
      rewards,
    });
    playSound("complete");
    setAct("card");
  }, [chosen, state, commit]);

  const goHome = useCallback(() => {
    setAct("ending");
    onFinish();
  }, [onFinish]);

  const chosenLine = CHOICES.find((c) => c.id === chosen)?.line;
  const date = new Date().toLocaleDateString(lang === "zh" ? "zh-CN" : "en-GB");
  const fragment = FRAGMENTS[lamp];
  const lampDoneLine = [MEMORY_DONE, RHYTHM_DONE, COLLECT_DONE][lamp]!;

  return (
    <div className="ll-root" data-act={act} data-lamp={act === "lamps" ? lamp : ""} data-lamp-phase={lampPhase} data-lit={litCount}>
      <div className="ll-gate" aria-hidden />
      <span className="ll-cloud ll-cloud--a" aria-hidden />
      <span className="ll-cloud ll-cloud--b" aria-hidden />
      <span className="ll-cloud ll-cloud--c" aria-hidden />

      <div className="ll-stage" key={`${act}-${act === "lamps" ? `${lamp}-${lampPhase}` : ""}`}>
        <span className="ll-eyebrow">{V("GAME 03 · THE END OF FUN ZONE", "第三站 · 乐园的结尾")}</span>
        <h1 className="ll-title">{L(GAME_TITLE)}</h1>
        <p className="ll-sub">{L(GAME_SUBTITLE)}</p>

        {/* Act 1 — pause */}
        {act === "pause" && (
          <div className="ll-panel">
            <span className="ll-speaker">{V("Princess is waiting", "公主在岛上等你")}</span>
            <p className="ll-quote">{L(INTRO)}</p>
            <div className="ll-actions">
              <button type="button" className="ll-btn" onClick={start}>
                {V("Stay a little longer", "再待一会儿")} <span aria-hidden>→</span>
              </button>
              <button type="button" className="ll-btn ll-btn--ghost" onClick={onExit}>
                {V("Back to Fun Zone", "回到乐园")}
              </button>
            </div>
          </div>
        )}

        {/* Act 2 — three lamps, three classic little games */}
        {act === "lamps" && (
          <div className="ll-panel ll-panel--wide">
            <div className="ll-lamp-row" aria-label={L(LAMP_TITLE)}>
              {[0, 1, 2].map((i) => (
                <span key={i} className={`ll-lamp ${i < litCount ? "ll-lamp--on" : ""}`} data-on={i < litCount}>
                  <span aria-hidden>✦</span>
                </span>
              ))}
            </div>
            <span className="ll-fragment-no">{L(LAMP_OF(lamp + 1))}</span>
            <p className="ll-note">{L(LAMP_LEAD)}</p>

            {lampPhase === "play" ? (
              <>
                <h2 className="ll-fragment-title">
                  {lamp === 0 ? L(MEMORY_TITLE) : lamp === 1 ? L(RHYTHM_TITLE) : L(COLLECT_TITLE)}
                </h2>
                <p className="ll-note ll-hint">
                  {lamp === 0 ? L(MEMORY_HINT) : lamp === 1 ? L(RHYTHM_HINT) : L(COLLECT_HINT)}
                </p>

                {/* Lamp 1 — Memory Match */}
                {lamp === 0 && (
                  <div className="ll-memory" role="group" aria-label={L(MEMORY_TITLE)} data-matched={matched.length / 2}>
                    {DECK.map((symbol, i) => {
                      const up = flipped.includes(i) || matched.includes(i);
                      return (
                        <button
                          key={i}
                          type="button"
                          className={`ll-pair ${up ? "ll-pair--up" : ""} ${matched.includes(i) ? "ll-pair--matched" : ""}`}
                          onClick={() => flip(i)}
                          aria-label={V(`Card ${i + 1}`, `第 ${i + 1} 张牌`)}
                        >
                          <span className="ll-pair-face" aria-hidden>{symbol}</span>
                          <span className="ll-pair-back" aria-hidden>✧</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Lamp 2 — a breathing light, three taps, no miss */}
                {lamp === 1 && (
                  <div className="ll-rhythm" data-taps={taps}>
                    <button
                      ref={pulseRef}
                      type="button"
                      className={`ll-pulse ${bullseye ? "ll-pulse--hit" : ""}`}
                      onClick={tapLight}
                      aria-label={L(RHYTHM_TAP)}
                    >
                      <span aria-hidden>✧</span>
                    </button>
                    <div className="ll-beats" aria-hidden>
                      {[0, 1, 2].map((i) => (
                        <span key={i} className={`ll-beat ${i < taps ? "ll-beat--on" : ""}`} />
                      ))}
                    </div>
                    <p className={`ll-bullseye ${bullseye ? "is-on" : ""}`} aria-live="polite">
                      {bullseye ? L(RHYTHM_BULLSEYE) : L(RHYTHM_TAP)}
                    </p>
                  </div>
                )}

                {/* Lamp 3 — gather the drifting motes */}
                {lamp === 2 && (
                  <div className="ll-collect" data-gathered={gathered.length}>
                    <div className="ll-collect-core" aria-hidden>✦</div>
                    {MOTES.map((m, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`ll-mote ${gathered.includes(i) ? "ll-mote--gone" : ""}`}
                        style={{ left: `${m.x}%`, top: `${m.y}%`, animationDelay: `${i * 0.27}s` }}
                        onClick={() => gather(i)}
                        aria-label={V(`A drifting light (${i + 1} of 9)`, `第 ${i + 1} 颗微光`)}
                      >
                        ✦
                      </button>
                    ))}
                    <p className="ll-collect-count">{L(COLLECT_COUNT(gathered.length))}</p>
                  </div>
                )}
              </>
            ) : (
              /* A lamp has been lit — its fragment of writing, shown as-is. */
              <div className="ll-reading">
                <p className="ll-reading-done">{L(lampDoneLine)}</p>
                <h2 className="ll-fragment-title">{L(fragment!.title)}</h2>
                <p className="ll-words ll-words--lit">{L(fragment!.text)}</p>
                <div className="ll-actions">
                  <button type="button" className="ll-btn" onClick={nextLamp}>
                    {lamp < FRAGMENTS.length - 1 ? L(NEXT_LIGHT) : L(ALL_LIT_NEXT)} <span aria-hidden>→</span>
                  </button>
                </div>
                {lamp === FRAGMENTS.length - 1 && <p className="ll-note">{L(LAMP_DONE)}</p>}
              </div>
            )}
          </div>
        )}

        {/* Act 3 — choose one line to carry home */}
        {act === "choose" && (
          <div className="ll-panel">
            <span className="ll-speaker">{V("BEFORE YOU GO", "离开之前")}</span>
            <p className="ll-quote">{V("Which one would you like to take with you?", "这一次，你想带走哪一句？")}</p>
            <div className="ll-choices" role="group" aria-label={V("Choose a line", "选择一句话")}>
              {CHOICES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="ll-choice"
                  aria-pressed={chosen === c.id}
                  onClick={() => {
                    setChosen(c.id);
                    playSound("tap");
                  }}
                >
                  <span className="ll-choice-mark" aria-hidden>✓</span>
                  <span>{L(c.line)}</span>
                </button>
              ))}
            </div>
            <div className="ll-actions">
              <button type="button" className="ll-btn" onClick={finish} disabled={!chosen}>
                {V("Keep this one", "收好这句话")} <span aria-hidden>→</span>
              </button>
            </div>
          </div>
        )}

        {/* Act 4 — the keepsake card (option C): a gentle recollection, never a score */}
        {act === "card" && chosenLine && (
          <div className="ll-keepsake">
            <span className="ll-eyebrow">{L(CARD_EYEBROW)}</span>
            <p className="ll-card-lead">{L(CARD_LEAD)}</p>
            <p className="ll-note" style={{ marginTop: 10 }}>{L(CARD_JOURNEY)}</p>
            <div className="ll-card-rule" />
            <p className="ll-card-before">{L(CARD_BEFORE)}</p>
            <p className="ll-card-line">{L(chosenLine)}</p>
            <div className="ll-card-rule" />
            <p className="ll-card-sign">{L(CARD_SIGN)}</p>
            <p className="ll-card-date">{date}</p>
          </div>
        )}

        {act === "ending" && (
          <div className="ll-panel">
            <p className="ll-quote">{V("The light is opening.", "光正在散开。")}</p>
          </div>
        )}

        {(act === "lamps" || act === "choose") && (
          <button type="button" className="ll-textbtn" onClick={onExit}>
            {L(LAMP_EXIT)}
          </button>
        )}

        {act === "card" && (
          <>
            <div className="ll-actions">
              <button type="button" className="ll-btn" onClick={goHome}>
                {V("Back to the beginning", "回到起点")} <span aria-hidden>→</span>
              </button>
            </div>
            <button
              type="button"
              className="ll-textbtn"
              onClick={() => {
                setChosen(null);
                setAct("choose");
              }}
            >
              {V("Choose another line", "换一句话")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
