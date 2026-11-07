/**
 * Game 03 — The Last Light / 最后一束光.
 *
 * A closing ceremony in four acts. It deliberately shares no mechanic with
 * Game 01 (answering questions) or Game 02 (walking a maze): here the visitor
 * only pauses, reads three short pieces of writing, chooses one line to carry
 * home, and receives a keepsake card. No score, no ranking, no long input.
 *
 * Pure DOM + CSS over the shared 3D canvas. The final "light becomes the cover
 * sky" crossfade is handled one level up (LastLightHome.tsx), so it survives
 * the route switching back to the welcome screen.
 */

import { useCallback, useState } from "react";
import { pick, type Lang } from "@/lib/i18n";
import { playSound } from "@/lib/fun/sound";
import { markCompleted, type FunState, type RewardId } from "@/lib/fun/funZone";
import {
  CARD_BEFORE,
  CARD_EYEBROW,
  CARD_JOURNEY,
  CARD_LEAD,
  CARD_SIGN,
  CHOICES,
  FRAGMENTS,
  GAME_SUBTITLE,
  GAME_TITLE,
  INTRO,
  say,
} from "./content";
import "./last-light.css";

type Act = "pause" | "fragments" | "choose" | "card" | "ending";

type Props = {
  lang: Lang;
  state: FunState;
  commit: (next: FunState) => void;
  /** Back to the Fun Zone park without ending the journey. */
  onExit: () => void;
  /** Begin the light-to-cover crossfade and return to the home screen. */
  onFinish: () => void;
};

export function LastLightGame({ lang, state, commit, onExit, onFinish }: Props) {
  const [act, setAct] = useState<Act>("pause");
  const [fragment, setFragment] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [lit, setLit] = useState(false);

  const V = (en: string, zh: string) => pick(lang, en, zh);
  const L = (l: { en: string; zh: string }) => say(l, lang);

  const start = useCallback(() => {
    playSound("tap");
    setAct("fragments");
    setFragment(0);
    setLit(false);
  }, []);

  /** One quiet tap on a fragment is the entire interaction — no quiz, no hunt. */
  const readFragment = useCallback(() => {
    if (lit) return;
    playSound("tap");
    setLit(true);
    const next = fragment + 1;
    window.setTimeout(() => {
      setLit(false);
      if (next < FRAGMENTS.length) setFragment(next);
      else setAct("choose");
    }, 260);
  }, [fragment, lit]);

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

  return (
    <div className="ll-root" data-act={act}>
      <div className="ll-gate" aria-hidden />
      <span className="ll-cloud ll-cloud--a" aria-hidden />
      <span className="ll-cloud ll-cloud--b" aria-hidden />
      <span className="ll-cloud ll-cloud--c" aria-hidden />

      <div className="ll-stage" key={act === "fragments" ? `f${fragment}` : act}>
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

        {/* Act 2 — three short fragments of a life, shown as words only */}
        {act === "fragments" &&
          (() => {
            const f = FRAGMENTS[fragment]!;
            return (
              <div className="ll-panel">
                <span className="ll-fragment-no">{f.no} / 03</span>
                <h2 className="ll-fragment-title">{L(f.title)}</h2>
                <p className={`ll-words ${lit ? "ll-words--lit" : ""}`}>{L(f.text)}</p>
                <div className="ll-dots" aria-hidden>
                  {FRAGMENTS.map((_, i) => (
                    <span key={i} className={`ll-dot ${i <= fragment ? "ll-dot--on" : ""}`} />
                  ))}
                </div>
                <div className="ll-actions">
                  <button type="button" className="ll-btn" onClick={readFragment} disabled={lit}>
                    {L(f.touch)} <span aria-hidden>→</span>
                  </button>
                </div>
              </div>
            );
          })()}

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

        {(act === "fragments" || act === "choose") && (
          <button type="button" className="ll-textbtn" onClick={onExit}>
            {V("Leave for the Fun Zone", "先回乐园")}
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
