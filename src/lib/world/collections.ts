/**
 * The five pages of Jenia's collection album.
 *
 * Everything below was given by Jenia: titles, authors, her reasons and her
 * own notes are copied as written, and the English side is a translation of the
 * same words. Nothing here invents a place she has been, a photo she took, or a
 * memory she did not describe.
 *
 * `discovered` is not authored here — it comes from the per-visitor album state
 * in `lib/collections/store.ts`, which fills it in when the pages are built.
 */

export type Bi = { en: string; zh: string };

export type CardCategory = "music" | "book" | "film" | "city" | "drink" | "life" | "moment" | "happiness";

/** Which engraved drawing sits on the card cover when there is no uploaded photo. */
export type ArtKey =
  | "piano"
  | "wave"
  | "feather"
  | "ferry"
  | "mirror"
  | "grid"
  | "spiral"
  | "orbit"
  | "mountains"
  | "sigil"
  | "cup"
  | "window"
  | "compass"
  | "photo"
  | "sun"
  | "chengdu"
  | "dali"
  | "lijiang"
  | "xian"
  | "bengbu"
  | "beijing"
  | "shanghai";

export type CardDetail = { label: Bi; items: Bi[] };

export type CollectionCard = {
  id: string;
  pageId: string;
  /** Number printed on the card back, unique within its page. */
  num: string;
  category: CardCategory;
  title: Bi;
  subtitle: Bi;
  source: Bi | null;
  /** Why it is in the collection. */
  description: Bi;
  /** MY NOTE — her own line, kept separate from the reason. */
  personalNote: Bi;
  tags: Bi[];
  /** Structured lists for the lifestyle page (brands, habits, moments…). */
  details: CardDetail[];
  coverImage: string | null;
  art: ArtKey | null;
  /** Page tone behind the cover art. */
  tint: string;
  /** A ribbon label, e.g. Hometown. */
  label: Bi | null;
  custom: boolean;
  createdAt: number;
  discovered: boolean;
};

/** Seed cards do not carry a discovered flag; the album state supplies it. */
export type CardSeed = Omit<CollectionCard, "discovered">;

export type PageAside = {
  title: Bi;
  cities: { name: Bi; art: ArtKey; tint: string }[];
  reasons: Bi[];
  note: Bi;
};

export type PageSeed = {
  id: string;
  title: Bi;
  subtitle: Bi;
  order: number;
  intro: Bi;
  cards: CardSeed[];
  /** Only the places page has one: the two cities that are not quite her type. */
  aside: PageAside | null;
};

export type CollectionPage = PageSeed & { cards: CollectionCard[] };

const bi = (en: string, zh: string): Bi => ({ en, zh });
const same = (text: string): Bi => ({ en: text, zh: text });
const empty = bi("", "");

const NO_DETAILS: CardDetail[] = [];
const NO_TAGS: Bi[] = [];

const created = 1735689600000; // fixed seed timestamp, keeps builds deterministic

function seed(pageId: string, num: string, input: Omit<CardSeed, "pageId" | "num" | "custom" | "createdAt" | "discovered">): CardSeed {
  return { ...input, pageId, num, custom: false, createdAt: created };
}

/* ------------------------------------------------------------------- page 1 */

const MUSIC: PageSeed = {
  id: "music",
  order: 1,
  title: bi("Music Collection", "音乐收藏"),
  subtitle: bi("What plays in the background", "一直在背景里的声音"),
  intro: bi(
    "Three pieces that stayed: one from school lunches, one that is simply classic, and one from a chapter I loved.",
    "三首留下来的曲子：一首来自初中午饭，一首因为实在经典，一首来自我很喜欢的篇章。",
  ),
  aside: null,
  cards: [
    seed("music", "01", {
      id: "music-summer",
      category: "music",
      title: same("Summer"),
      subtitle: bi("Joe Hisaishi", "久石让 Joe Hisaishi"),
      source: null,
      description: bi(
        "I heard this piano piece over lunch most days in middle school. Its melody made me feel at ease, and it settled into those ordinary days as if it belonged there.",
        "初中午饭时经常听到这首钢琴曲。它的旋律让我感到放松，也很自然地融入了当时的日常生活。",
      ),
      personalNote: bi(
        "I like the melody, and I like the ordinary lunches it kept me company through.",
        "喜欢它的旋律，也喜欢它曾经陪伴过我的那些普通午餐时光。",
      ),
      tags: NO_TAGS,
      details: NO_DETAILS,
      coverImage: null,
      art: "piano",
      tint: "#e9e0cd",
      label: null,
    }),
    seed("music", "02", {
      id: "music-talk",
      category: "music",
      title: same("We Don't Talk Anymore"),
      subtitle: bi("Charlie Puth, Selena Gomez", "Charlie Puth, Selena Gomez"),
      source: null,
      description: bi(
        "I like Charlie Puth, and I like the melody and the way the two voices work together. It is a song that feels classic and wears well.",
        "因为喜欢 Charlie Puth，也很喜欢这首歌本身的旋律和两位歌手的合作。它是一首让我觉得非常经典、很耐听的歌。",
      ),
      personalNote: bi(
        "Because I like Charlie Puth, and because the song itself is just that classic and that good.",
        "因为喜欢 Charlie Puth，也因为这首歌本身真的太经典、太好听了。",
      ),
      tags: NO_TAGS,
      details: NO_DETAILS,
      coverImage: null,
      art: "wave",
      tint: "#dfe4ee",
      label: null,
    }),
    seed("music", "03", {
      id: "music-feather",
      category: "music",
      title: same("希望有羽毛和翅膀"),
      subtitle: bi("Robin / HOYO-MiX / Chevy", "知更鸟 / HOYO-MiX / Chevy"),
      source: bi("Honkai: Star Rail · Penacony", "崩坏：星穹铁道 · 匹诺康尼篇章"),
      description: bi(
        "This is music from a chapter of the game I really love. Because I loved that chapter, I treasure this song in particular. It is still the ringtone on my phone.",
        "这是我很喜欢的游戏篇章中的音乐。因为喜欢那个章节，所以也格外珍惜这首歌。它目前还是我日常使用的手机铃声。",
      ),
      personalNote: bi(
        "Because I love that chapter, I treasure the song more. Now it has become part of my everyday life.",
        "因为喜欢那个章节，所以也格外珍惜这首歌。现在，它已经成为我日常生活的一部分。",
      ),
      tags: NO_TAGS,
      details: NO_DETAILS,
      coverImage: null,
      art: "feather",
      tint: "#e6ddc7",
      label: null,
    }),
  ],
};

/* ------------------------------------------------------------------- page 2 */

const BOOKS: PageSeed = {
  id: "books",
  order: 2,
  title: bi("Words & Books", "文字与书籍"),
  subtitle: bi("Stories and the worlds they build", "故事和它们搭起来的世界"),
  intro: bi(
    "Three books I keep coming back to, each of them for the world it opens.",
    "三本会反复回到的书，每一本都为了它打开的那个世界。",
  ),
  aside: null,
  cards: [
    seed("books", "01", {
      id: "book-ferryman",
      category: "book",
      title: bi("Ferryman series", "摆渡人系列"),
      subtitle: bi("Claire McFall", "Claire McFall / 克莱儿·麦克福尔"),
      source: null,
      description: bi("I love the story and the particular worldview it builds.", "喜欢它的故事和独特的世界观。"),
      personalNote: bi(
        "Because I love that world, I am willing to walk back into the story again and again.",
        "因为喜欢那个世界，所以愿意一次又一次地走进那个故事。",
      ),
      tags: [bi("Fantasy world", "奇幻世界"), bi("Story", "故事"), bi("Imagination", "想象力")],
      details: NO_DETAILS,
      coverImage: null,
      art: "ferry",
      tint: "#dde7ee",
      label: null,
    }),
    seed("books", "02", {
      id: "book-genius",
      category: "book",
      title: same("天才在左，疯子在右"),
      subtitle: bi("Gao Ming", "高铭"),
      source: null,
      description: bi(
        "I love how it explores the border between reality and perception.",
        "喜欢它对于现实与认知边界的探索。",
      ),
      personalNote: bi(
        "I like probing the edge of what we can know, and asking: how do we actually come to know the world?",
        "我喜欢探索认知的边界，也喜欢思考：我们究竟是如何认识这个世界的？",
      ),
      tags: [bi("Psychology", "心理"), bi("Cognition", "认知"), bi("Thinking", "思考")],
      details: NO_DETAILS,
      coverImage: null,
      art: "mirror",
      tint: "#e7e0d4",
      label: null,
    }),
    seed("books", "03", {
      id: "book-exam",
      category: "book",
      title: same("全球高考"),
      subtitle: bi("Mu Suli", "木苏里"),
      source: null,
      description: bi(
        "I love its distinctive world and the exam rules the story designs so carefully.",
        "喜欢它独特的世界观，以及故事中精心设计的考试规则。",
      ),
      personalNote: bi(
        "What draws me most is that distinctive, attractive world and the exam rules built around it.",
        "最吸引我的，是那个独特又有吸引力的世界，以及它精心设计的考试规则。",
      ),
      tags: [bi("Infinite flow", "无限流"), bi("Worldbuilding", "世界观"), bi("Rules", "规则设定")],
      details: NO_DETAILS,
      coverImage: null,
      art: "grid",
      tint: "#dfe6dd",
      label: null,
    }),
  ],
};

/* ------------------------------------------------------------------- page 3 */

const FILMS: PageSeed = {
  id: "films",
  order: 3,
  title: bi("Films & Shows", "影视收藏"),
  subtitle: bi("Worlds on a screen", "屏幕里的世界"),
  intro: bi(
    "Four screen worlds I like to return to — two films, two animations.",
    "四个愿意反复回去的屏幕世界：两部电影，两部动画。",
  ),
  aside: null,
  cards: [
    seed("films", "01", {
      id: "film-inception",
      category: "film",
      title: bi("Inception", "盗梦空间"),
      subtitle: bi("Christopher Nolan", "Christopher Nolan / 克里斯托弗·诺兰"),
      source: null,
      description: empty,
      personalNote: bi(
        "What draws me most is that it creates such a particular world that you stop being sure whether you are in a dream or awake.",
        "最吸引我的，是它创造了一个如此特别的世界，让人分不清自己究竟身处梦境还是现实。",
      ),
      tags: [bi("Sci-fi", "科幻"), bi("Dreams", "梦境"), bi("Mystery", "悬疑"), bi("Worldbuilding", "世界观")],
      details: NO_DETAILS,
      coverImage: null,
      art: "spiral",
      tint: "#d9e2ee",
      label: null,
    }),
    seed("films", "02", {
      id: "film-interstellar",
      category: "film",
      title: bi("Interstellar", "星际穿越"),
      subtitle: bi("Christopher Nolan", "Christopher Nolan / 克里斯托弗·诺兰"),
      source: null,
      description: empty,
      personalNote: bi(
        "A world big enough, a journey good enough, and images I have not forgotten.",
        "一个足够宏大的世界，一段足够精彩的旅程，以及那些令人难忘的画面。",
      ),
      tags: [bi("Space", "宇宙"), bi("Sci-fi", "科幻"), bi("Time", "时间"), bi("Exploration", "探索")],
      details: NO_DETAILS,
      coverImage: null,
      art: "orbit",
      tint: "#dfe0ea",
      label: null,
    }),
    seed("films", "03", {
      id: "film-cangyuan",
      category: "film",
      title: bi("The Demon Hunter", "沧元图"),
      subtitle: bi("Chinese animation", "国产动画"),
      source: null,
      description: empty,
      personalNote: bi(
        "I love its xuanhuan world, and the fights and adventures that are full of imagination.",
        "喜欢它的玄幻世界，也喜欢那些充满想象力的战斗与冒险。",
      ),
      tags: [bi("Donghua", "国漫"), bi("Xuanhuan", "玄幻"), bi("Fights", "战斗"), bi("Adventure", "冒险")],
      details: NO_DETAILS,
      coverImage: null,
      art: "mountains",
      tint: "#e3e0d3",
      label: null,
    }),
    seed("films", "04", {
      id: "film-soulland",
      category: "film",
      title: bi("Soul Land", "斗罗大陆"),
      subtitle: bi("Chinese animation", "国产动画"),
      source: null,
      description: empty,
      personalNote: bi(
        "I love its distinctive power system, its complete worldbuilding, and the way the story keeps opening up.",
        "我喜欢它独特的力量体系、完整的世界设定，以及不断展开的故事。",
      ),
      tags: [bi("Donghua", "国漫"), bi("Spirit power", "武魂"), bi("Fantasy", "奇幻"), bi("Fights", "战斗")],
      details: NO_DETAILS,
      coverImage: null,
      art: "sigil",
      tint: "#e8e1cf",
      label: null,
    }),
  ],
};

/* ------------------------------------------------------------------- page 4 */

const CITY_NOTE = bi(
  "I like the local atmosphere, the scenery and the culture and history here, and a pace of life that suits me.",
  "喜欢当地的生活氛围、自然风景，也喜欢城市的文化与历史，和比较舒服的城市节奏。",
);

const CITY_DETAILS: CardDetail[] = [
  {
    label: bi("Why I like it here", "喜欢的原因"),
    items: [
      bi("The everyday atmosphere", "生活氛围"),
      bi("The natural scenery", "自然风景"),
      bi("Culture and history", "城市文化与历史"),
      bi("A comfortable pace", "比较舒服的节奏"),
    ],
  },
];

const city = (id: string, num: string, en: string, zh: string, art: ArtKey, tint: string, label: Bi | null): CardSeed =>
  seed("places", num, {
    id,
    category: "city",
    title: bi(en, zh),
    subtitle: bi("A city I like", "我喜欢的城市"),
    source: null,
    description: CITY_NOTE,
    personalNote: empty,
    tags: NO_TAGS,
    details: CITY_DETAILS,
    coverImage: null,
    art,
    tint,
    label,
  });

const PLACES: PageSeed = {
  id: "places",
  order: 4,
  title: bi("Places & Travel", "地点与旅行"),
  subtitle: bi("Cities I like, and two that are not for me", "我喜欢的城市，以及两座不太合拍的"),
  intro: bi(
    "Cities I would happily go back to. The two on the left are only a personal note — not a verdict.",
    "愿意一次次回去的城市。左边那两座只是个人偏好，不是对城市的评价。",
  ),
  cards: [
    city("city-chengdu", "01", "Chengdu", "成都", "chengdu", "#dfe9e3", bi("Hometown", "家乡")),
    city("city-dali", "02", "Dali", "大理", "dali", "#dce9f1", null),
    city("city-lijiang", "03", "Lijiang", "丽江", "lijiang", "#e6e2d4", null),
    city("city-xian", "04", "Xi'an", "西安", "xian", "#e8dfd0", null),
    city("city-bengbu", "05", "Bengbu", "蚌埠", "bengbu", "#dfe8ea", null),
  ],
  aside: {
    title: bi("Not Quite My Type", "不太合拍的"),
    cities: [
      { name: bi("Beijing", "北京"), art: "beijing", tint: "#e6e1d8" },
      { name: bi("Shanghai", "上海"), art: "shanghai", tint: "#dfe3ea" },
    ],
    reasons: [
      bi("The pace of daily life is too fast.", "城市生活节奏太快。"),
      bi("I do not really like the climate.", "不太喜欢当地气候。"),
      bi("The cost of living is too high.", "消费水平太高。"),
    ],
    note: bi(
      "Only a personal preference — not an objective review of either city.",
      "只是个人偏好，不是对城市的客观评价。",
    ),
  },
};

/* ------------------------------------------------------------------- page 5 */

const FOOD: PageSeed = {
  id: "food",
  order: 5,
  title: bi("Food & Lifestyle", "美食与生活"),
  subtitle: bi("Drinks, habits, and small happiness", "饮品、习惯，还有小小的幸福"),
  intro: bi(
    "Five little pages: what I drink, how I spend my time, what I want to try, the moments worth keeping, and the happiness in between.",
    "五个小主题：喝什么、怎么过日子、想尝试什么、值得留下的瞬间，还有中间那些小小的幸福。",
  ),
  aside: null,
  cards: [
    seed("food", "01", {
      id: "life-drinks",
      category: "drink",
      title: bi("Drinks I Love", "喜欢的饮品"),
      subtitle: bi("A · What is in my cup", "A · 杯子里的日常"),
      source: null,
      description: bi(
        "I like milk tea, fruit tea and coffee, and black tea and oolong too. More than any single drink, I care whether it actually tastes good — and different moods and seasons make me want different things.",
        "我喜欢奶茶、果茶、咖啡，也喜欢红茶和乌龙茶。比起固定某一种饮品，我更在意它是不是真的好喝。不同的心情、不同的季节，也会让我想喝不一样的东西。",
      ),
      personalNote: empty,
      tags: NO_TAGS,
      details: [
        {
          label: bi("Brands I like", "喜欢的品牌"),
          items: [same("一点点"), same("瑞幸")],
        },
        {
          label: bi("Types", "喜欢的类型"),
          items: [
            bi("Milk tea", "奶茶"),
            bi("Fruit tea", "果茶"),
            bi("Coffee", "咖啡"),
            bi("Black tea", "红茶"),
            bi("Oolong", "乌龙茶"),
          ],
        },
        {
          label: bi("Especially", "特别喜欢"),
          items: [
            bi("Anything with apple", "带苹果的饮品"),
            bi("Coconut jelly", "椰果"),
            bi("Americano", "美式"),
            bi("Jasmine latte", "茉莉花拿铁"),
            bi("Mascarpone latte", "马斯卡生酪拿铁"),
            bi("Meteor latte", "陨石拿铁"),
          ],
        },
        {
          label: bi("My usual order", "固定饮品习惯"),
          items: [
            bi("No extra sugar", "不另外加糖"),
            bi("No ice", "去冰"),
            bi("Basically the same, whatever I order", "不管喝什么，基本都这样搭配"),
          ],
        },
        {
          label: bi("How I choose", "怎么选"),
          items: [
            bi("Taste comes first", "味道好喝，口味最重要"),
            bi("Mostly the mood of the day", "主要看当天心情"),
            bi("A different drink for each season", "喜欢根据不同季节选择不同饮品"),
          ],
        },
      ],
      coverImage: null,
      art: "cup",
      tint: "#e9e2d2",
      label: null,
    }),
    seed("food", "02", {
      id: "life-way",
      category: "life",
      title: bi("My Way of Life", "喜欢的生活方式"),
      subtitle: bi("B · Small habits", "B · 小习惯"),
      source: null,
      description: bi(
        "I like to keep some free time for myself. I can sink into a film, a book or a game, or plan nothing at all and just enjoy the quiet. Now and then I plan a small trip, to put a little freshness into ordinary days.",
        "喜欢给自己留出自由的时间。可以沉浸在电影、书籍和游戏里，也可以什么都不安排，只是安静地享受属于自己的时光。偶尔计划一场旅行，让日常生活多一点新鲜感。",
      ),
      personalNote: empty,
      tags: NO_TAGS,
      details: [
        {
          label: bi("What I like to do", "喜欢做的事"),
          items: [
            bi("Films, series or games", "看电影、追剧或玩游戏"),
            bi("Reading, writing, noting ideas", "阅读、写东西或记录想法"),
            bi("Unwinding before sleep, time that is mine", "睡前放松，享受自己的时间"),
            bi("An occasional small trip", "偶尔计划一场小旅行"),
            bi("No fixed plan — a little freedom", "没有固定安排，喜欢自由一点"),
          ],
        },
      ],
      coverImage: null,
      art: "window",
      tint: "#dfe6ea",
      label: null,
    }),
    seed("food", "03", {
      id: "life-adventures",
      category: "life",
      title: bi("Little Adventures", "有趣的生活体验"),
      subtitle: bi("C · Things I want to try", "C · 想尝试的事"),
      source: null,
      description: bi(
        "I like exploring places I have not been, and trying things I have not done before. A new trip, a food I have never eaten, or planning something with friends all bring a different kind of fun. More than watching from the side, I enjoy taking part and making the experience happen.",
        "我喜欢探索未知的地方，也喜欢尝试以前没有体验过的事情。无论是一次新的旅行、一种没吃过的食物，还是和朋友一起策划活动，都能给生活带来不一样的乐趣。比起只做旁观者，我也很享受亲自参与、创造体验的过程。",
      ),
      personalNote: empty,
      tags: NO_TAGS,
      details: [
        {
          label: bi("Things I like to try", "喜欢尝试的事"),
          items: [
            bi("Cities and places I have not been", "去没去过的城市或地方"),
            bi("Different kinds of entertainment", "体验不同的娱乐项目或活动"),
            bi("Food and drinks I have not tried", "尝试新鲜的食物和饮品"),
            bi("Planning things with friends", "和朋友一起策划活动"),
            bi("Outdoors, closer to nature", "体验户外活动或亲近自然"),
            bi("School events and organising them", "参加学校活动、组织活动"),
          ],
        },
      ],
      coverImage: null,
      art: "compass",
      tint: "#dfe9dd",
      label: null,
    }),
    seed("food", "04", {
      id: "life-moments",
      category: "moment",
      title: bi("Special Moments", "特别的生活瞬间"),
      subtitle: bi("D · Kept with a photo and a date", "D · 配一张照片和日期"),
      source: null,
      description: bi(
        "These are the moments I like to keep in this album. One day each of them can carry a photo, a date, and the line I write at the time.",
        "这些是我喜欢收进收藏册的瞬间。以后可以在这里放进照片、日期和当时写下的话。",
      ),
      personalNote: empty,
      tags: NO_TAGS,
      details: [
        {
          label: bi("Moments worth keeping", "喜欢收藏的瞬间"),
          items: [
            bi("Happy hours with friends", "和朋友一起度过的开心时光"),
            bi("The lift after an event goes well", "一次活动成功举办后的成就感"),
            bi("Beautiful scenery on a trip", "旅行中看到的漂亮风景"),
            bi("An ordinary but happy everyday moment", "某个平凡但很幸福的日常瞬间"),
            bi("Warm time with family", "和家人相处的温暖时刻"),
            bi("An unexpected surprise or gift", "收到意外惊喜或礼物"),
            bi("Finishing something I always wanted to do", "完成一件一直想做的事情"),
            bi("A performance, match or event that mattered", "某次特别有意义的演出、比赛或活动"),
            bi("A moment that suddenly made sense", "某个让自己突然有所感悟的瞬间"),
          ],
        },
      ],
      coverImage: null,
      art: "photo",
      tint: "#e8e0d6",
      label: null,
    }),
    seed("food", "05", {
      id: "life-happiness",
      category: "happiness",
      title: bi("Little Happiness", "日常中的小确幸"),
      subtitle: bi("E · Small photos, short lines", "E · 小照片，短文字"),
      source: null,
      description: bi(
        "Small photos, a short line and a date — the tiny cards this album is meant to hold.",
        "小照片、简短文字和日期，组成精致的小型回忆卡。",
      ),
      personalNote: empty,
      tags: NO_TAGS,
      details: [
        {
          label: bi("Small happiness", "小确幸"),
          items: [
            bi("Finding a good film or a good book", "发现一部好电影或一本好书"),
            bi("Weather that is just right", "天气很好，阳光或微风刚刚好"),
            bi("A beautiful sky, clouds or sunset", "看到漂亮的天空、云朵或日落"),
            bi("Finally resting after everything is done", "忙完事情后终于可以休息"),
            bi("Buying a small thing I like", "买到喜欢的小东西"),
            bi("Stumbling on a good little shop", "偶然发现一家不错的小店"),
            bi("A comfortable sleep", "睡一个舒服的觉"),
            bi("Tick off the to-do list", "完成待办事项，感觉很有成就感"),
          ],
        },
      ],
      coverImage: null,
      art: "sun",
      tint: "#efe7d2",
      label: null,
    }),
  ],
};

/** Fixed order — the album is read in this sequence and cannot be rearranged. */
export const PAGE_SEEDS: PageSeed[] = [MUSIC, BOOKS, FILMS, PLACES, FOOD];

/* ------------------------------------------------------------------ badges */

export type BadgeIcon = "music" | "book" | "film" | "compass" | "camera" | "world";

export type Badge = {
  id: string;
  name: Bi;
  caption: Bi;
  icon: BadgeIcon;
  /** The page that earns it; null for the album-wide badge. */
  pageId: string | null;
  /** Two-stop metal colour. */
  metal: [string, string];
};

export const BADGES: Badge[] = [
  {
    id: "badge-music",
    name: bi("Music Explorer", "音乐探索者"),
    caption: bi("For turning over every card on the music page.", "翻完音乐页的每一张卡片。"),
    icon: "music",
    pageId: "music",
    metal: ["#e8cf9a", "#a8813f"],
  },
  {
    id: "badge-books",
    name: bi("Story Collector", "故事收藏家"),
    caption: bi("For finishing the page of words and worlds.", "收好文字与世界观的那一页。"),
    icon: "book",
    pageId: "books",
    metal: ["#cfdce6", "#7e99ad"],
  },
  {
    id: "badge-films",
    name: bi("Film Enthusiast", "光影收藏家"),
    caption: bi("For finishing the page of films and shows.", "收好影视的那一页。"),
    icon: "film",
    pageId: "films",
    metal: ["#d8cbb6", "#8c7351"],
  },
  {
    id: "badge-places",
    name: bi("World Wanderer", "世界漫游者"),
    caption: bi("For finishing the page of places.", "收好地点与旅行的这一页。"),
    icon: "compass",
    pageId: "places",
    metal: ["#c9dfd2", "#6d9483"],
  },
  {
    id: "badge-food",
    name: bi("Little Moments Keeper", "生活收藏家"),
    caption: bi("For finishing the page of everyday things.", "收好生活与美食的这一页。"),
    icon: "camera",
    pageId: "food",
    metal: ["#e7d8c2", "#b08d63"],
  },
  {
    id: "badge-world",
    name: bi("Jenia's World", "全部收藏完成纪念"),
    caption: bi("For exploring all five pages and closing the album.", "探索完五页，合上整本收藏册。"),
    icon: "world",
    pageId: null,
    metal: ["#f0dca6", "#9a6d2f"],
  },
];

export const CATEGORY_LABEL: Record<CardCategory, Bi> = {
  music: bi("Music", "音乐"),
  book: bi("Book", "书"),
  film: bi("Film", "影视"),
  city: bi("City", "城市"),
  drink: bi("Drink", "饮品"),
  life: bi("Life", "生活"),
  moment: bi("Moment", "瞬间"),
  happiness: bi("Happiness", "小确幸"),
};

export const CATEGORIES = Object.keys(CATEGORY_LABEL) as CardCategory[];
