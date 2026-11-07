/**
 * WORLD EXPLORER — Game 01.
 *
 * `useExplorerGame` owns the whole seven-stage flow and all local persistence;
 * `WorldExplorerGame` is only the DOM layer floating over the 3D campsite.
 * Keeping them apart means the scene never has to know about React quiz state.
 *
 * Rules that must not drift: three fixed chapters in order, three questions
 * each, nine per round, first submitted answer alone counts for the score,
 * a wrong answer never ends the question, one hint per chapter, infinite
 * replay, first completion unlocks Tiny Maze regardless of grade.
 */

import { useEffect, useRef, useState } from "react";
import { pick, type Lang } from "@/lib/i18n";
import {
  abandonRound,
  earnedRewards,
  finishExplorerRound,
  startExplorerRound,
  type FunState,
  type GameId,
  type RoundResult,
  type RoundState,
} from "@/lib/fun/funZone";
import { playSound, startAmbience } from "@/lib/fun/sound";
import type { ExplorerProps } from "@/components/fun/FunZoneCanvas";
import type { PrincessMood } from "@/components/fun/scene/Princess";
import type { ExplorerStage } from "@/components/fun/scene/ExplorerScene";
import { RewardShelf, MiniMap } from "@/components/fun/Rewards";
import { CHAPTERS, questionById, type Question } from "./questionBank";
import { chapterOfIndex, drawRound } from "./engine";

type Feedback = "idle" | "correct" | "wrong";

type Options = {
  state: FunState;
  commit: (next: FunState) => void;
  onUnlocked: (id: GameId) => void;
  reducedMotion: boolean;
};

const nine = () => Array.from({ length: 9 }, () => false);

export function useExplorerGame({ state, commit, onUnlocked, reducedMotion }: Options) {
  const stateRef = useRef(state);
  stateRef.current = state;
  const save = (next: FunState) => {
    stateRef.current = next;
    commit(next);
  };
  const withRound = (round: RoundState | null): FunState => ({
    ...stateRef.current,
    explorer: { ...stateRef.current.explorer, round },
  });

  const initialRound = state.explorer.round;
  const [round, setRound] = useState<RoundState | null>(initialRound);
  const [questions, setQuestions] = useState<Question[]>(() =>
    (initialRound?.questionIds ?? []).map((id) => questionById(id)).filter((q): q is Question => !!q),
  );
  const [stage, setStage] = useState<ExplorerStage>(() => (initialRound ? "question" : "intro"));
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback>("idle");
  const [hintOpen, setHintOpen] = useState(false);
  const [chapterDone, setChapterDone] = useState<number | null>(null);
  const [result, setResult] = useState<RoundResult | null>(null);
  /** Kept after the round is cleared so the finished 3D map still shows which
      stars were earned on the first attempt. */
  const [lastFirstTry, setLastFirstTry] = useState<boolean[]>(nine());
  const [princessSignal, setPrincessSignal] = useState(0);
  const [starTrigger, setStarTrigger] = useState(0);
  const [starTarget, setStarTarget] = useState(0);
  const advanceTimer = useRef(0);

  useEffect(() => () => window.clearTimeout(advanceTimer.current), []);

  const signal = () => setPrincessSignal((n) => n + 1);
  const index = round?.questionIndex ?? 0;
  const chapter = chapterOfIndex(Math.min(index, 8));
  const current = questions[index];
  const solved =
    stage === "result"
      ? Array.from({ length: 9 }, () => true)
      : Array.from({ length: 9 }, (_, i) => round?.solved[i] ?? false);
  const firstTry = round
    ? Array.from({ length: 9 }, (_, i) => round.firstTry[i] ?? false)
    : lastFirstTry;
  const hintUsed = round?.hints[chapter - 1] ?? false;

  const mood: PrincessMood = (() => {
    if (stage === "intro") return "enter";
    if (stage === "result") return "celebrate";
    if (stage === "chapter") return "chapter";
    if (feedback === "correct") return "correct";
    if (feedback === "wrong") return "incorrect";
    if (hintOpen) return "hint";
    if (stage === "question") return "look";
    return "idle";
  })();

  const scene: ExplorerProps = {
    stage,
    solved,
    firstTry,
    chapter,
    starTrigger,
    starTarget,
    mapComplete: stage === "result",
    chestOpen: stage === "result",
    princessMood: mood,
    princessSignal,
  };

  /* ----------------------------------------------------------- transitions */

  const goStory = () => {
    playSound("tap");
    setStage("story");
  };

  const start = () => {
    const drawn = drawRound(stateRef.current.explorer.lastSignature);
    const next = startExplorerRound(stateRef.current, drawn.map((q) => q.id));
    const r = next.explorer.round!;
    setRound(r);
    setQuestions(drawn);
    setSelected(null);
    setFeedback("idle");
    setHintOpen(false);
    setChapterDone(null);
    setResult(null);
    setStage("question");
    signal();
    save(next);
    startAmbience();
    playSound("tap");
  };

  const finish = (r: RoundState) => {
    const res = finishExplorerRound(withRound(r), r.firstTry);
    save(res.state);
    setLastFirstTry([...r.firstTry]);
    setResult(res);
    setStage("result");
    setRound(null);
    signal();
    playSound("complete");
    if (res.unlockedNext) {
      onUnlocked(res.unlockedNext);
      window.setTimeout(() => playSound("unlock"), 700);
    }
  };

  const advance = (r: RoundState) => {
    const justFinished = index;
    const nextIndex = justFinished + 1;
    const updated: RoundState = {
      ...r,
      questionIndex: Math.min(nextIndex, 8),
      chapter: chapterOfIndex(Math.min(nextIndex, 8)),
    };
    setRound(updated);
    setSelected(null);
    setFeedback("idle");
    setHintOpen(false);
    save(withRound(updated));

    if (justFinished % 3 === 2) {
      setChapterDone(chapterOfIndex(justFinished));
      setStage("chapter");
      signal();
      playSound("star");
    } else {
      setStage("question");
      signal();
    }
  };

  const submit = (option: number) => {
    if (stage !== "question" || feedback === "correct" || !round || !current) return;
    const correct = option === current.correct;
    setSelected(option);

    const firstAnswers = [...round.firstAnswers];
    const firstTryFlags = [...round.firstTry];
    const solvedFlags = [...round.solved];
    const isFirst = firstAnswers[index] === null || firstAnswers[index] === undefined;
    if (isFirst) {
      firstAnswers[index] = option;
      if (correct) firstTryFlags[index] = true;
    }
    if (correct) solvedFlags[index] = true;
    const updated: RoundState = {
      ...round,
      firstAnswers,
      firstTry: firstTryFlags,
      solved: solvedFlags,
    };
    setRound(updated);
    save(withRound(updated));
    signal();

    if (correct) {
      setFeedback("correct");
      setStarTarget(index);
      setStarTrigger((n) => n + 1);
      playSound("correct");
      window.clearTimeout(advanceTimer.current);
      advanceTimer.current = window.setTimeout(() => advance(updated), reducedMotion ? 650 : 1500);
    } else {
      setFeedback("wrong");
      playSound("wrong");
    }
  };

  const useHint = () => {
    if (!round || !current || hintUsed || stage !== "question") return;
    const hints: [boolean, boolean, boolean] = [...round.hints] as [boolean, boolean, boolean];
    hints[chapter - 1] = true;
    const updated = { ...round, hints };
    setRound(updated);
    setHintOpen(true);
    save(withRound(updated));
    signal();
    playSound("hint");
  };

  const continueChapter = () => {
    if (!round) return;
    window.clearTimeout(advanceTimer.current);
    if (index >= 8) {
      finish(round);
      return;
    }
    // `advance` already moved questionIndex to the first question of the next
    // chapter — do not increment again or that question gets skipped.
    setChapterDone(null);
    setSelected(null);
    setFeedback("idle");
    setHintOpen(false);
    setStage("question");
    signal();
    playSound("tap");
  };

  const replay = () => {
    window.clearTimeout(advanceTimer.current);
    save(abandonRound(withRound(null)));
    setRound(null);
    setResult(null);
    setChapterDone(null);
    start();
  };

  const line = princessLine(stage, feedback, hintOpen, result, reducedMotion);

  return {
    view: {
      stage,
      questions,
      index,
      chapter,
      current,
      selected,
      feedback,
      hintOpen,
      hintUsed,
      chapterDone,
      result,
      solved,
      firstTry,
      line,
      scene,
      state,
    },
    actions: { goStory, start, submit, useHint, continueChapter, replay },
  };
}

export type ExplorerGame = ReturnType<typeof useExplorerGame>;

/* ------------------------------------------------------------------ copy */

function princessLine(
  stage: ExplorerStage,
  feedback: Feedback,
  hintOpen: boolean,
  result: RoundResult | null,
  reducedMotion: boolean,
): { en: string; zh: string } {
  if (stage === "intro") {
    return {
      en: "Hi there! I'm Princess. I found a map with pieces missing — will you help me put it back together?",
      zh: "你好呀！我是公主！我发现了一张残缺的地图，你愿意和我一起找回它吗？",
    };
  }
  if (stage === "story") {
    return {
      en: "Three parts are still dark. We'll take them one chapter at a time — take your time, there are no penalties.",
      zh: "地图上还有三片地方没亮起来。我们一章一章慢慢找，答错也没关系，可以再想想。",
    };
  }
  if (stage === "chapter") {
    return { en: "This part of the map is glowing now!", zh: "这一片地图终于亮起来啦！" };
  }
  if (stage === "result") {
    if (result?.streakCelebration) {
      return { en: "Three perfect rounds in a row! I'm doing a little dance for you.", zh: "连续三次满分啦！我要为你转个圈圈。" };
    }
    return { en: "The whole map is back. Thank you for finding it with me!", zh: "地图完整啦！谢谢你陪我一起把它找回来。" };
  }
  if (feedback === "correct") {
    return { en: "That's it! We found another star!", zh: "答对啦！我们又发现了一颗星星！" };
  }
  if (feedback === "wrong") {
    return { en: "Hmm? Let's think about it once more.", zh: "嗯？我们再想想吧！" };
  }
  if (hintOpen) {
    return { en: "Look over here — this clue narrows it down.", zh: "看看这边，这条线索能把范围缩小一点。" };
  }
  if (reducedMotion) return { en: "I'll be right here.", zh: "我就在这儿陪着你。" };
  return { en: "The card is up. Let's look together.", zh: "卡片浮起来啦，我们一起看看。" };
}

/* --------------------------------------------------------------------- UI */

type Props = {
  game: ExplorerGame;
  lang: Lang;
  onExit: () => void;
};

const V = (lang: Lang, en: string, zh: string) => pick(lang, en, zh);
const LETTERS = ["A", "B", "C", "D"];

export function WorldExplorerGame({ game, lang, onExit }: Props) {
  const { view: v, actions: a } = game;
  const chapterDef = CHAPTERS[v.chapter - 1]!;

  const progress = (
    <div className="fz-progress" aria-label={`${v.index + 1} / 9`}>
      {Array.from({ length: 9 }, (_, i) => (
        <i key={i} className={v.solved[i] ? "on" : i === v.index ? "now" : ""} />
      ))}
    </div>
  );

  return (
    <>
      {v.stage === "intro" && (
        <div className="fz-panel fz-panel--intro fz-glass">
          <p className="fz-eyebrow">{V(lang, "FUN ZONE · GAME 01", "乐园 · 第 01 个游戏")}</p>
          <h1 className="fz-title--clear">WORLD EXPLORER</h1>
          <p className="fz-sub">Every little detail tells a story.</p>
          <p className="fz-note" style={{ marginTop: 14 }}>
            {V(lang, "A small adventure through Jenia's World", "世界探索 · 一场关于 Jenia's World 的小小探险")}
          </p>
          <div style={{ marginTop: 22 }}>
            <button type="button" className="fz-btn" onClick={a.goStory}>
              {V(lang, "Start Exploring", "开始探索")} <span aria-hidden>→</span>
            </button>
          </div>
        </div>
      )}

      {v.stage === "story" && (
        <div className="fz-panel fz-panel--story fz-glass">
          <p className="fz-eyebrow">{V(lang, "THE INCOMPLETE MAP", "一张残缺的地图")}</p>
          <h2 className="fz-display" style={{ fontSize: "2.6rem", marginTop: 6 }}>
            {V(lang, "Find what's missing", "把地图找回来")}
          </h2>
          <MiniMap solved={nine()} />
          <div style={{ display: "grid", gap: 8, margin: "16px 0", textAlign: "left" }}>
            {CHAPTERS.map((c) => (
              <div
                key={c.n}
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "baseline",
                  padding: "9px 12px",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.6)",
                }}
              >
                <b style={{ color: c.color, fontSize: "0.8rem", letterSpacing: "0.1em" }}>0{c.n}</b>
                <span style={{ fontSize: "0.86rem", fontWeight: 700 }}>
                  {V(lang, c.title.en, c.title.zh)}
                </span>
                <small style={{ marginLeft: "auto", color: "#8ba09c", fontSize: "0.68rem" }}>
                  {V(lang, c.subtitle.en, c.subtitle.zh)}
                </small>
              </div>
            ))}
          </div>
          <p className="fz-note">
            {V(
              lang,
              "Three chapters, three questions each. A wrong answer just means another try — only your FIRST answer counts toward the score. One hint per chapter. You can replay as often as you like.",
              "三个章节，每章三题。答错可以再选一次，只有「第一次提交的答案」计入分数；每章有一次提示；可以无限次重新挑战。",
            )}
          </p>
          <div style={{ marginTop: 18 }}>
            <button type="button" className="fz-btn" onClick={a.start}>
              {V(lang, "Begin the search", "开始找回地图")} <span aria-hidden>→</span>
            </button>
          </div>
        </div>
      )}

      {v.stage === "question" && v.current && (
        <div className="fz-quest fz-glass">
          <div className="fz-quest-top">
            <span className="fz-eyebrow">
              {V(lang, `CHAPTER 0${v.chapter} · ${chapterDef.title.en}`, `第 0${v.chapter} 章 · ${chapterDef.title.zh}`)}
            </span>
            {progress}
          </div>

          {v.current.kind === "image" && v.current.visual === "swatches" && (
            <div className="fz-visual" aria-label="colour cards">
              {(v.current.swatches ?? []).map((c, i) => (
                <div key={i} className="fz-swatch" style={{ background: c }}>
                  {LETTERS[i]}
                </div>
              ))}
            </div>
          )}
          {v.current.kind === "image" && v.current.visual === "facilities" && (
            <div className="fz-visual" aria-label="three game facilities">
              <div className="fz-facility">⛺</div>
              <div className="fz-facility">🌀</div>
              <div className="fz-facility">🪧</div>
            </div>
          )}
          {v.current.kind === "clue" && v.current.clue && (
            <p className="fz-clue">{V(lang, v.current.clue.en, v.current.clue.zh)}</p>
          )}

          <h2>{V(lang, v.current.prompt.en, v.current.prompt.zh)}</h2>

          <div className="fz-options" role="group" aria-label="answer options">
            {v.current.options.map((opt, i) => {
              const isCorrect = v.feedback === "correct" && i === v.current!.correct;
              const isWrong = v.feedback === "wrong" && i === v.selected;
              const cls = isCorrect ? "correct" : isWrong ? "wrong" : v.selected === i ? "picked" : "";
              return (
                <button
                  key={i}
                  type="button"
                  className={`fz-option ${cls}`}
                  disabled={v.feedback === "correct"}
                  onClick={() => a.submit(i)}
                >
                  <b>{LETTERS[i]}</b>
                  <span>{V(lang, opt.en, opt.zh)}</span>
                </button>
              );
            })}
          </div>

          {v.feedback === "correct" && (
            <div className="fz-feedback ok" role="status">
              {V(lang, "A star is heading to the map.", "一颗星星正飞向地图。")}
            </div>
          )}
          {v.feedback === "wrong" && (
            <div className="fz-feedback no" role="status">
              {V(lang, v.current.explain.en, v.current.explain.zh)}
              <br />
              {V(lang, "Take another look — you can choose again.", "再看看，可以重新选。")}
            </div>
          )}
          {v.hintOpen && (
            <p className="fz-hintline">
              {V(lang, "Princess's hint: ", "公主的提示：")}
              {V(lang, v.current.hint.en, v.current.hint.zh)}
            </p>
          )}

          <div className="fz-quest-foot">
            <span className="fz-note" style={{ fontSize: "0.72rem" }}>
              {V(lang, `Question ${v.index + 1} of 9`, `第 ${v.index + 1} / 9 题`)}
            </span>
            <button type="button" className="fz-textbtn" onClick={a.useHint} disabled={v.hintUsed || v.feedback === "correct"}>
              {v.hintUsed
                ? V(lang, "Hint used for this chapter", "本章提示已使用")
                : V(lang, "Ask Princess for a hint", "请公主给个提示")}
            </button>
          </div>
        </div>
      )}

      {v.stage === "chapter" && v.chapterDone && (
        <div className="fz-chapter fz-glass">
          <div className="fz-chapter-num">0{v.chapterDone}</div>
          <h2 className="fz-display" style={{ fontSize: "2.3rem" }}>
            {V(lang, "A region lights up", "一片地图亮起来了")}
          </h2>
          <MiniMap solved={v.solved} firstTry={v.firstTry} />
          <p className="fz-note" style={{ marginTop: 12 }}>
            {V(
              lang,
              `Chapter 0${v.chapterDone} complete — ${CHAPTERS[v.chapterDone - 1]!.title.en}.`,
              `第 0${v.chapterDone} 章完成 —— ${CHAPTERS[v.chapterDone - 1]!.title.zh}。`,
            )}
          </p>
          <div style={{ marginTop: 18 }}>
            <button type="button" className="fz-btn" onClick={a.continueChapter}>
              {v.index >= 8
                ? V(lang, "Open the treasure chest", "打开宝箱")
                : V(lang, "Next chapter", "下一章")}{" "}
              <span aria-hidden>→</span>
            </button>
          </div>
        </div>
      )}

      {v.stage === "result" && v.result && (
        <div className="fz-results fz-glass">
          <p className="fz-eyebrow">{V(lang, "THE MAP IS WHOLE AGAIN", "地图恢复完整")}</p>
          <div className="fz-grade">{V(lang, v.result.grade.name.en, v.result.grade.name.zh)}</div>
          <p className="fz-note" style={{ marginTop: 4 }}>{V(lang, v.line.en, v.line.zh)}</p>
          <div className="fz-stats">
            <div className="fz-stat">
              <b>{v.result.score}/9</b>
              <span>{V(lang, "THIS ROUND", "本轮得分")}</span>
            </div>
            <div className="fz-stat">
              <b>{v.result.best}/9</b>
              <span>{V(lang, "PERSONAL BEST", "历史最好")}</span>
            </div>
            <div className="fz-stat">
              <b>{v.result.challenges}</b>
              <span>{V(lang, "CHALLENGES", "挑战次数")}</span>
            </div>
          </div>
          <MiniMap solved={Array.from({ length: 9 }, () => true)} firstTry={v.firstTry} complete />
          <RewardShelf rewards={earnedRewards(v.result.state)} newly={v.result.newly} lang={lang} />
          {v.result.perfectStreak >= 2 && (
            <p className="fz-note">
              {V(lang, `${v.result.perfectStreak} perfect rounds in a row.`, `连续 ${v.result.perfectStreak} 次满分。`)}
            </p>
          )}
          {v.result.unlockedNext && (
            <p className="fz-feedback ok" style={{ marginTop: 12 }}>
              {V(lang, "Tiny Maze is now open in the Fun Zone!", "乐园里的「迷宫入口」已经亮起来啦！")}
            </p>
          )}
          <p className="fz-note" style={{ marginTop: 12, fontSize: "0.7rem" }}>
            {V(
              lang,
              "Progress is saved on this device only, under your nickname. It does not sync across devices.",
              "进度只保存在这台设备、当前昵称下，不会跨设备同步。",
            )}
          </p>
          <div className="fz-actions">
            <button type="button" className="fz-btn" onClick={a.replay}>
              {V(lang, "Play again", "再玩一次")}
            </button>
            <button type="button" className="fz-btn fz-btn--ghost" onClick={onExit}>
              {V(lang, "Return to Fun Zone", "回到乐园")}
            </button>
          </div>
        </div>
      )}

      {v.stage !== "result" && (
        <div className="fz-speech" aria-live="polite">
          <span className="fz-speech-avatar" aria-hidden>🐾</span>
          <span>
            <span className="fz-speech-name">{V(lang, "PRINCESS · 公主", "公主 · PRINCESS")}</span>
            {V(lang, v.line.en, v.line.zh)}
          </span>
        </div>
      )}
    </>
  );
}
