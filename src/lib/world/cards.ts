/**
 * The cards inside the Collections album. Every entry below is an EXAMPLE —
 * no title, note or tag here was supplied by Jenia, so none of it should be
 * read as a real favourite yet.
 */

export type CardKind = "book" | "film" | "music";

export type CollectionCard = {
  id: string;
  num: string;
  kind: CardKind;
  title: string;
  by: string;
  /** Why it stayed with me. */
  why: { en: string; zh: string };
  tags: { en: string; zh: string }[];
  /** Backing colour of the card face. */
  tint: string;
};

export const KIND_LABEL: Record<CardKind, { en: string; zh: string }> = {
  book: { en: "Book", zh: "书" },
  film: { en: "Film", zh: "电影" },
  music: { en: "Music", zh: "音乐" },
};

export const CARDS: CollectionCard[] = [
  {
    id: "courage",
    num: "01",
    kind: "book",
    title: "The Courage to Be Disliked",
    by: "Ichiro Kishimi & Fumitake Koga",
    why: {
      en: "[Example] The conversation format made philosophy feel like something you could actually have an argument with.",
      zh: "【示例】对话体让哲学变成了一种你真的能跟它吵起来的东西。",
    },
    tags: [{ en: "psychology", zh: "心理学" }, { en: "reread", zh: "重读" }],
    tint: "#dce8f2",
  },
  {
    id: "stranger",
    num: "02",
    kind: "book",
    title: "The Stranger",
    by: "Albert Camus",
    why: {
      en: "[Example] The first story I liked for being cold instead of warm.",
      zh: "【示例】第一次喜欢上一个冷而不是暖的故事。",
    },
    tags: [{ en: "fiction", zh: "小说" }],
    tint: "#e9e2d3",
  },
  {
    id: "sapiens",
    num: "03",
    kind: "book",
    title: "Sapiens",
    by: "Yuval Noah Harari",
    why: {
      en: "[Example] Long, but it rearranged how I look at people in groups.",
      zh: "【示例】很长，但它把我看群体的方式挪了一下。",
    },
    tags: [{ en: "history", zh: "历史" }],
    tint: "#dbe8de",
  },
  {
    id: "piano",
    num: "04",
    kind: "film",
    title: "The Legend of 1900",
    by: "1998",
    why: {
      en: "[Example] A whole life that fits on one keyboard.",
      zh: "【示例】一生就在一台琴键上。",
    },
    tags: [{ en: "rewatch", zh: "重看" }],
    tint: "#d9e4ee",
  },
  {
    id: "will",
    num: "05",
    kind: "film",
    title: "Good Will Hunting",
    by: "1997",
    why: {
      en: "[Example] It is not really about being smart.",
      zh: "【示例】它其实不是讲聪明。",
    },
    tags: [{ en: "quiet", zh: "安静" }],
    tint: "#e6dfd2",
  },
  {
    id: "interstellar",
    num: "06",
    kind: "film",
    title: "Interstellar",
    by: "2014",
    why: {
      en: "[Example] The organ score did most of the work.",
      zh: "【示例】管风琴干了大部分的活。",
    },
    tags: [{ en: "score", zh: "原声" }],
    tint: "#dcdcea",
  },
  {
    id: "summer",
    num: "07",
    kind: "music",
    title: "Summer",
    by: "Joe Hisaishi",
    why: {
      en: "[Example] Played on loop while doing homework.",
      zh: "【示例】写作业时的循环曲。",
    },
    tags: [{ en: "piano", zh: "钢琴" }],
    tint: "#e8e0cf",
  },
  {
    id: "merry",
    num: "08",
    kind: "music",
    title: "Merry Christmas Mr. Lawrence",
    by: "Ryuichi Sakamoto",
    why: {
      en: "[Example] The one I put on when everything is too loud.",
      zh: "【示例】太吵的时候会放这一首。",
    },
    tags: [{ en: "ambient", zh: "氛围" }],
    tint: "#dbe6ea",
  },
  {
    id: "nosurprises",
    num: "09",
    kind: "music",
    title: "No Surprises",
    by: "Radiohead",
    why: {
      en: "[Example] A very quiet way of being tired.",
      zh: "【示例】一种很安静的累。",
    },
    tags: [{ en: "night", zh: "夜里" }],
    tint: "#e2dcea",
  },
];
