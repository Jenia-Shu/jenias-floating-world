/**
 * The Last Light — all words on Game 03.
 *
 * This game is a closing ceremony, not a quiz: no questions, no score, no
 * ranking. The three fragments and the five closing lines are shown exactly
 * as written; no attribution or "draft" label appears anywhere in the UI.
 *
 * `id` values are storage keys — keep them stable once visitors have played.
 */

export type Line = { en: string; zh: string };
export const say = (l: Line, lang: "en" | "zh") => (lang === "zh" ? l.zh : l.en);

export const INTRO: Line = {
  en: "We've walked through quite a few places. Before you go, there is one last thing I'd like to do with you.",
  zh: "我们已经走过了不少地方。不过，在离开之前，还有一件事想和你一起完成。",
};

export const GAME_TITLE: Line = { en: "The Last Light", zh: "最后一束光" };
export const GAME_SUBTITLE: Line = { en: "A Journey to the Beginning", zh: "回到起点的一段路" };

/** Act 2 — three short moments. Shown as words on the island, nothing else. */
export type Fragment = {
  id: string;
  no: string;
  title: Line;
  /** The piece of writing itself. */
  text: Line;
  /** A single quiet action; never a question, never something to find. */
  touch: Line;
};

export const FRAGMENTS: Fragment[] = [
  {
    id: "knowing",
    no: "01",
    title: { en: "Knowing", zh: "认识" },
    text: {
      en: "I used to think being different was something to hide. Later I understood that difference was simply me.",
      zh: "小时候我总觉得自己和别人不太一样。后来才明白，那种不一样，恰恰是我自己。",
    },
    touch: { en: "Let it settle", zh: "轻轻读一遍" },
  },
  {
    id: "growing",
    no: "02",
    title: { en: "Growing", zh: "成长" },
    text: {
      en: "Not everything went the way I hoped, but each of them left a quiet mark, and together they became who I am now.",
      zh: "不是每段经历都如我所愿，但它们都悄悄留下了痕迹，成了现在的我。",
    },
    touch: { en: "Let it settle", zh: "轻轻读一遍" },
  },
  {
    id: "thinking",
    no: "03",
    title: { en: "Thinking", zh: "思考" },
    text: {
      en: "Growing up, I found there is no standard answer sheet for a life — everyone is writing their own version.",
      zh: "长大以后我发现，人生没有一张标准答卷——每个人都在写自己的版本。",
    },
    touch: { en: "Let it settle", zh: "轻轻读一遍" },
  },
];

/** Act 3 — the five lines the visitor chose between (options 2, 4, 5, 7, 10). */
export type Choice = { id: string; line: Line };

export const CHOICES: Choice[] = [
  {
    id: "slow",
    line: { en: "It's okay to go slowly.", zh: "慢一点，也没关系。" },
  },
  {
    id: "curious",
    line: {
      en: "Stay curious, and the world will always leave a door open for you.",
      zh: "保持好奇，世界就会一直为你留一扇门。",
    },
  },
  {
    id: "no-answer",
    line: { en: "Not everything needs an answer.", zh: "不是每件事都要有答案。" },
  },
  {
    id: "the-way",
    line: {
      en: "The destination was never the point — the way there was.",
      zh: "终点不是目的，沿路才是。",
    },
  },
  {
    id: "hello",
    line: {
      en: "Every goodbye makes room for the next hello.",
      zh: "每一次告别，都是为了下一次相遇。",
    },
  },
];

/** Act 4 — the keepsake card. A gentle recollection, never a score sheet. */
export const CARD_EYEBROW: Line = { en: "A KEEPSAKE FOR YOU", zh: "一张留给你的纪念卡" };
export const CARD_LEAD: Line = {
  en: "You got to know Jenia, wandered through her little world, and stopped for a while in the last light.",
  zh: "你认识了杰尼亚，走过了这座小小的世界，也在最后一束光里停了一会儿。",
};
/** The whole Fun Zone in three phrases — a recollection, not a checklist. */
export const CARD_JOURNEY: Line = {
  en: "Knowing someone · exploring a world · leaving with a little thought",
  zh: "了解一个人 · 探索一个世界 · 带着一点感悟离开",
};
export const CARD_BEFORE: Line = { en: "And this is the thought you chose to carry home:", zh: "这是你想带走的那句话：" };
export const CARD_SIGN: Line = { en: "— Jenia's World", zh: "— 杰尼亚的世界" };

/** Final act — the line that fades in as the light becomes the cover sky. */
export const FINALE: Line = {
  en: "Every journey has an ending. Every ending can be a beginning.",
  zh: "每一段旅程都有终点，而每一个终点，都可以是新的开始。",
};
