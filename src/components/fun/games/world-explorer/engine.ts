/**
 * Pure game rules — no React, no three.js, no localStorage.
 *
 * A round is always nine questions: three per chapter, in the fixed chapter
 * order 01 → 02 → 03. One easy, one medium and one slightly harder question
 * are drawn from each chapter, so difficulty stays balanced and no question
 * can repeat inside a round. The exact combination from the previous round is
 * avoided whenever the pool allows it.
 */

import { QUESTIONS, ROUND_TOTAL, type Difficulty, type Question } from "./questionBank";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
const CHAPTERS = [1, 2, 3] as const;

export function signatureOf(questions: readonly Question[]): string {
  return questions.map((q) => q.id).sort().join("|");
}

export function chapterOfIndex(index: number): 1 | 2 | 3 {
  return (Math.min(2, Math.floor(index / 3)) + 1) as 1 | 2 | 3;
}

function shuffle<T>(list: T[], rng: () => number): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** Three chapters × three difficulties, in fixed chapter order. */
function drawOnce(rng: () => number): Question[] {
  const round: Question[] = [];
  for (const chapter of CHAPTERS) {
    const picked = DIFFICULTIES.map((difficulty) => {
      const pool = QUESTIONS.filter((q) => q.chapter === chapter && q.difficulty === difficulty);
      // Every chapter is authored with at least one question per difficulty;
      // validateBank() guards that contract.
      return pool[Math.floor(rng() * pool.length)] ?? pool[0]!;
    });
    round.push(...shuffle(picked, rng));
  }
  return round;
}

export function drawRound(lastSignature = "", rng: () => number = Math.random): Question[] {
  let last: Question[] = [];
  for (let attempt = 0; attempt < 12; attempt++) {
    const round = drawOnce(rng);
    last = round;
    if (signatureOf(round) !== lastSignature) return round;
  }
  // The pool is large enough that this is essentially unreachable; returning
  // the last draw is still a valid nine-question round.
  return last;
}

/** Dev-time guard so a content edit cannot silently break the game rules. */
export function validateBank(): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const q of QUESTIONS) {
    if (ids.has(q.id)) problems.push(`duplicate id: ${q.id}`);
    ids.add(q.id);
    if (q.options.length !== 4) problems.push(`${q.id}: expected 4 options`);
    if (q.correct < 0 || q.correct >= q.options.length) problems.push(`${q.id}: bad correct index`);
    if (!q.hint.en || !q.explain.en) problems.push(`${q.id}: missing hint/explanation`);
  }
  for (const chapter of CHAPTERS) {
    const inChapter = QUESTIONS.filter((q) => q.chapter === chapter);
    if (inChapter.length !== 8) problems.push(`chapter ${chapter}: expected 8 questions, got ${inChapter.length}`);
    for (const d of DIFFICULTIES) {
      if (!inChapter.some((q) => q.difficulty === d)) problems.push(`chapter ${chapter}: no ${d} question`);
    }
  }
  return problems;
}

export const TOTAL_QUESTIONS = ROUND_TOTAL;
