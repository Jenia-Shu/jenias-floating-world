/**
 * The Last Light — all words on Game 03.
 *
 * A closing ceremony built from three classic little games (memory pairs,
 * a breathing-light rhythm tap, and gathering drifting lights). No questions,
 * no score, no ranking, no miss state. The three fragments and the five
 * closing lines are shown exactly as written; no attribution or "draft"
 * label appears anywhere in the UI.
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

/* --------------------------------------------------------------- Act 2 ---
 * Three classic little games, one per fragment. They share a single goal —
 * light three lamps — so they read as one ceremony rather than a minigame
 * compilation. Every mechanic is fail-safe: no timer, no miss, no counter of
 * mistakes, no score.
 */

export const LAMP_TITLE: Line = { en: "Three little lights", zh: "三盏小灯" };
export const LAMP_LEAD: Line = {
  en: "Before the last light opens, let's light these three lamps together.",
  zh: "在最后一束光亮起之前，和我一起点亮这三盏灯吧。",
};
export const LAMP_OF = (n: number) => ({ en: `LAMP ${n} / 3`, zh: `第 ${n} 盏 / 共 3 盏` });
export const LAMP_DONE: Line = { en: "All three lamps are lit.", zh: "三盏灯都亮了。" };

/** Lamp 1 — Memory Match. Six cards, three pairs, no wrong-turn counter. */
export const MEMORY_TITLE: Line = { en: "Find the pairs", zh: "找出成对的微光" };
export const MEMORY_HINT: Line = {
  en: "Turn over two cards and look for a match. Take your time — nothing here is counted.",
  zh: "翻开两张牌，找找成对的那一对。慢慢来，这里什么都不记。",
};
export const MEMORY_DONE: Line = { en: "The first lamp is on.", zh: "第一盏灯亮了。" };
/** Three pairs of quiet symbols; the pair identity is not a question. */
export const PAIR_SYMBOLS = ["✦", "☾", "❋"] as const;

/** Lamp 2 — a breathing light; three taps, no miss state at all. */
export const RHYTHM_TITLE: Line = { en: "Keep the light company", zh: "跟着光呼吸" };
export const RHYTHM_HINT: Line = {
  en: "Tap the light three times. If you catch it at its brightest, it glows a little more — either way it counts.",
  zh: "轻点这束光三下。点在它最亮的一刻，会亮得更盛一些；无论哪一下，都算数。",
};
export const RHYTHM_TAP: Line = { en: "Tap", zh: "轻点" };
export const RHYTHM_DONE: Line = { en: "The second lamp is on.", zh: "第二盏灯亮了。" };
export const RHYTHM_BULLSEYE: Line = { en: "just right", zh: "正好" };

/** Lamp 3 — Collect & Light. Nine drifting motes into one lamp. */
export const COLLECT_TITLE: Line = { en: "Gather the drifting lights", zh: "收拢散落的微光" };
export const COLLECT_HINT: Line = {
  en: "Nine little lights got loose. Tap them, one by one, and they will find their way into the lamp.",
  zh: "九颗小光点跑散了。一颗一颗轻点它们，它们就会回到灯里。",
};
export const COLLECT_DONE: Line = { en: "The third lamp is on.", zh: "第三盏灯亮了。" };
export const COLLECT_COUNT = (n: number) => ({ en: `${n} / 9`, zh: `${n} / 9` });

/** Shown after each lamp lights, with that fragment's own writing. */
export const NEXT_LIGHT: Line = { en: "Next light →", zh: "下一盏灯 →" };
export const ALL_LIT_NEXT: Line = { en: "Let the light gather →", zh: "让光聚起来 →" };
export const LAMP_EXIT: Line = { en: "Leave for the Fun Zone", zh: "先回乐园" };

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
