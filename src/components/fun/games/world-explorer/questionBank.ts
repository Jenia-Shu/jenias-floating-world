/**
 * WORLD EXPLORER question bank — 8 questions per chapter, 24 total.
 *
 * Every answer is checked against the public site content:
 *   Chapter 01 → src/lib/world/story.ts (About Me)
 *   Chapter 02 → src/lib/world/collections.ts (the collection album)
 *   Chapter 03 → the islands, MessageIslandPage, and the Fun Zone registry
 *
 * `source` records where each fact lives so the bank can be re-validated after
 * a content change. Wrong options are deliberately made from *other real*
 * Jenia's World copy wherever possible — no invented personal facts.
 *
 * This file is pure data. Nothing here knows about the UI or the 3D scene.
 */

import { bi, type Bi } from "@/lib/fun/funZone";

export type Difficulty = "easy" | "medium" | "hard";
export type QuestionKind = "text" | "image" | "clue";
export type Visual = "swatches" | "facilities";

export type Question = {
  id: string;
  chapter: 1 | 2 | 3;
  difficulty: Difficulty;
  kind: QuestionKind;
  visual?: Visual;
  swatches?: string[];
  prompt: Bi;
  clue?: Bi;
  options: Bi[];
  /** Index into `options`. Spread across 0..3 so the position is never a tell. */
  correct: number;
  /** Narrows the field; never names the answer. */
  hint: Bi;
  /** Warm explanation shown after a wrong first answer. */
  explain: Bi;
  source: string;
};

export type ChapterDef = {
  n: 1 | 2 | 3;
  title: Bi;
  subtitle: Bi;
  /** Where the region sits on the 3D map table (x, z). */
  spot: [number, number];
  color: string;
};

export const CHAPTERS: ChapterDef[] = [
  {
    n: 1,
    title: bi("Who Is Jenia?", "认识 Jenia"),
    subtitle: bi("The person behind this little world", "这座小小世界背后的人"),
    spot: [-0.78, -0.34],
    color: "#8fb8d8",
  },
  {
    n: 2,
    title: bi("The Collection Room", "收藏的房间"),
    subtitle: bi("Songs, books, films, cities", "歌、书、电影和城市"),
    spot: [0.82, -0.28],
    color: "#e1bd83",
  },
  {
    n: 3,
    title: bi("Explore the World", "去世界里看看"),
    subtitle: bi("Islands, secrets and the Fun Zone", "岛屿、秘密，还有乐园"),
    spot: [0, 0.62],
    color: "#91b89a",
  },
];

const q = (x: Question): Question => x;

export const QUESTIONS: Question[] = [
  /* --------------------------------------------- Chapter 01 · Who Is Jenia? */
  q({
    id: "ch1-colour",
    chapter: 1,
    difficulty: "easy",
    kind: "image",
    visual: "swatches",
    swatches: ["#8b7bb8", "#5c8065", "#6f9fc4", "#e6a49a"],
    prompt: bi("Which of these is Jenia's favourite colour?", "下面哪一个，是 Jenia 最喜欢的颜色？"),
    options: [bi("A", "A 号色卡"), bi("B", "B 号色卡"), bi("C", "C 号色卡"), bi("D", "D 号色卡")],
    correct: 2,
    hint: bi("Think of the sky over the islands — and a small explorer backpack.", "想想浮岛上那片天空，还有一只小小的探险背包。"),
    explain: bi("The About page says it plainly: favourite colour — blue.", "「我的世界」里写得很直白：喜欢的颜色——蓝色。"),
    source: "story.ts · small facts",
  }),
  q({
    id: "ch1-quote",
    chapter: 1,
    difficulty: "medium",
    kind: "text",
    prompt: bi("Which line opens Jenia's story?", "哪一句，是 Jenia 故事开头的那句话？"),
    options: [
      bi("I love the heavy snow in my life, and then the spring that stays.", "我爱我生命里的大雪，然后是永驻的春天。"),
      bi("May you always keep your curiosity.", "愿你一直保有好奇心。"),
      bi("Still exploring.", "仍在探索。"),
      bi("Growth is not about becoming a standard answer.", "成长不是变成某个标准答案。"),
    ],
    correct: 0,
    hint: bi("It is in the very first chapter, and it holds a winter and a spring.", "它在第一章，一句话里同时装着冬天和春天。"),
    explain: bi("“我爱我生命里的大雪，然后是永驻的春天。” is the opening line of A Beginning.", "《故事的开始》那一章的第一句，就是「我爱我生命里的大雪，然后是永驻的春天」。"),
    source: "story.ts · chapter 01 quote",
  }),
  q({
    id: "ch1-interests",
    chapter: 1,
    difficulty: "easy",
    kind: "text",
    prompt: bi("Which set of interests fits Jenia best?", "哪一组最贴近 Jenia 的兴趣？"),
    options: [
      bi("Competitive sport, racing and model collecting", "竞技体育、赛车、收集模型"),
      bi("Day trading, accounting and coding contests", "短线交易、会计、编程比赛"),
      bi("Music, helping others, exploring and finding new things", "音乐、帮助别人、探索、发现新事物"),
      bi("Fashion styling, photography and baking", "穿搭、摄影、烘焙"),
    ],
    correct: 2,
    hint: bi("Her own introduction mentions a sense of joy found while exploring.", "她的自我介绍里，说的是「在不断探索中找到属于自己的乐趣」。"),
    explain: bi("Her intro: music, helping people, small things to look forward to, and exploring.", "原文是：喜欢音乐、乐于帮助别人、在生活中寻找值得期待的小事，以及不断探索。"),
    source: "story.ts · chapter 02 intro",
  }),
  q({
    id: "ch1-success",
    chapter: 1,
    difficulty: "medium",
    kind: "text",
    prompt: bi("How does Jenia define success?", "Jenia 怎么定义「成功」？"),
    options: [
      bi("By the score on an exam paper", "由考试分数决定"),
      bi("By oneself — reaching what truly matters while keeping choice and happiness", "由自己定义——实现真正重视的目标，同时保留选择权与幸福感"),
      bi("By how other people talk about you", "由别人怎么评价你决定"),
      bi("By the name of the school or company on a badge", "由校牌或工牌上的名字决定"),
    ],
    correct: 1,
    hint: bi("She says success should not have only one standard.", "她说过：成功不应该只有一种标准。"),
    explain: bi("“Success should not have only one standard” — it is defined by oneself.", "「成功不应该只有一种标准」，真正重视的目标和生活的幸福感同样重要。"),
    source: "story.ts · My Definition of Success",
  }),
  q({
    id: "ch1-growth",
    chapter: 1,
    difficulty: "medium",
    kind: "text",
    prompt: bi("What does she say about growing up?", "关于成长，她是怎么说的？"),
    options: [
      bi("Growing up means getting every answer right", "成长就是把每道题都答对"),
      bi("Growing up means leaving curiosity behind", "成长就是把好奇心收起来"),
      bi("Growth is not becoming a standard answer, but slowly finding your own", "成长不是变成某个标准答案，而是慢慢找到自己的答案"),
      bi("Growth is a race you have to finish first", "成长是一场必须跑第一的比赛"),
    ],
    correct: 2,
    hint: bi("It is a short line about answers — one kind of answer she does not want.", "那句话里出现了两次「答案」，她在拒绝其中一种。"),
    explain: bi("“成长不是变成某个标准答案，而是慢慢找到自己的答案。”", "这句话来自「我的世界」的成长章节，也是整座站点最像主题的一句。"),
    source: "story.ts · growth",
  }),
  q({
    id: "ch1-psychology",
    chapter: 1,
    difficulty: "hard",
    kind: "text",
    prompt: bi("Which two fields is she drawn to?", "她被哪两个领域吸引？"),
    options: [
      bi("Psychology and philosophy", "心理学与哲学"),
      bi("Architecture and geology", "建筑与地质"),
      bi("Finance and accounting", "金融与会计"),
      bi("Medicine and agriculture", "医学与农学"),
    ],
    correct: 0,
    hint: bi("Both are about how a person thinks, and what can be known.", "两个都和「人怎么想、我们能知道什么」有关。"),
    explain: bi("The interests chapter has a section titled “03 Psychology & Philosophy”.", "兴趣世界那一章，有一节就叫「03 心理学与哲学」。"),
    source: "story.ts · chapter 03",
  }),
  q({
    id: "ch1-keywords",
    chapter: 1,
    difficulty: "hard",
    kind: "text",
    prompt: bi("Which word is NOT among her six personal keywords?", "下面哪一个，不在她的六个关键词里？"),
    options: [
      bi("Independent / 独立", "独立"),
      bi("Empathetic / 共情", "共情"),
      bi("Creative / 创造", "创造"),
      bi("Competitive / 竞争", "竞争"),
    ],
    correct: 3,
    hint: bi("The six all point inward — how she thinks, feels and wanders.", "那六个词都朝内：怎么想、怎么感受、怎么逛世界。"),
    explain: bi("The six: Independent · Curious · Thoughtful · Empathetic · Creative · Explorative.", "六个是：独立 · 好奇 · 思考 · 共情 · 创造 · 探索。没有「竞争」。"),
    source: "story.ts · words that fit",
  }),
  q({
    id: "ch1-motto",
    chapter: 1,
    difficulty: "easy",
    kind: "text",
    prompt: bi("Which is her English life motto?", "她的英文人生格言是哪一句？"),
    options: [
      bi("Never settle", "Never settle"),
      bi("Keep discovering", "Keep discovering"),
      bi("Stay hungry", "Stay hungry"),
      bi("Dream bigger", "Dream bigger"),
    ],
    correct: 1,
    hint: bi("It ends in “-ing”, and it is what this whole game is about.", "它以 -ing 结尾，也正是这个游戏在做的事。"),
    explain: bi("“Life motto — keep discovering.”", "原文：Life motto — keep discovering.（人生格言——继续发现。）"),
    source: "story.ts · small facts",
  }),

  /* ------------------------------------------ Chapter 02 · Collection Room */
  q({
    id: "ch2-summer",
    chapter: 2,
    difficulty: "easy",
    kind: "text",
    prompt: bi("Which piano piece did she often hear at middle-school lunch?", "初中午饭时，她常常听到的是哪首钢琴曲？"),
    options: [
      bi("River Flows in You", "River Flows in You"),
      bi("Summer — Joe Hisaishi", "Summer · 久石让"),
      bi("Canon in D", "Canon in D"),
      bi("Nuvole Bianche", "Nuvole Bianche"),
    ],
    correct: 1,
    hint: bi("Its title is a season, and the composer is Japanese.", "曲名是一个季节，作曲家来自日本。"),
    explain: bi("The music page opens with Summer by Joe Hisaishi.", "收藏册音乐页的第一张卡，就是久石让的 Summer。"),
    source: "collections.ts · music card 01",
  }),
  q({
    id: "ch2-ringtone",
    chapter: 2,
    difficulty: "medium",
    kind: "text",
    prompt: bi("What is her current WeChat ringtone?", "她现在的微信铃声是哪一首？"),
    options: [
      bi("Summer", "Summer"),
      bi("起风了", "起风了"),
      bi("稻香", "稻香"),
      bi("希望有羽毛和翅膀", "希望有羽毛和翅膀"),
    ],
    correct: 3,
    hint: bi("The title sounds like a small wish someone would write in a letter.", "名字听起来像信里会写下的一个小小心愿。"),
    explain: bi("The music page lists 希望有羽毛和翅膀 as the ringtone.", "收藏册音乐页里，它被标成「现在的微信铃声」。"),
    source: "collections.ts · music card",
  }),
  q({
    id: "ch2-reality",
    chapter: 2,
    difficulty: "hard",
    kind: "text",
    prompt: bi("Which book explores the boundary between reality and cognition?", "哪一本书，在探索现实与认知的边界？"),
    options: [
      bi("天才在左，疯子在右", "天才在左，疯子在右"),
      bi("全球高考", "全球高考"),
      bi("三体", "三体"),
      bi("小王子", "小王子"),
    ],
    correct: 0,
    hint: bi("Its card asks: how do we actually come to know this world?", "那张卡上问的是：我们究竟是如何认识这个世界的？"),
    explain: bi("The book card says: “I like exploring the boundary between reality and cognition.”", "书籍卡的短句是「喜欢它对于现实与认知边界的探索」。"),
    source: "collections.ts · books card",
  }),
  q({
    id: "ch2-exam",
    chapter: 2,
    difficulty: "medium",
    kind: "text",
    prompt: bi("Which book has a distinctive examination setting and worldbuilding?", "哪一本书，有很特别的「考试」设定和世界观？"),
    options: [
      bi("哈利·波特", "哈利·波特"),
      bi("天才在左，疯子在右", "天才在左，疯子在右"),
      bi("全球高考", "全球高考"),
      bi("盗墓笔记", "盗墓笔记"),
    ],
    correct: 2,
    hint: bi("The title puts an exam on a planetary scale.", "书名把一场考试放到了整个世界的尺度上。"),
    explain: bi("全球高考 is on the books page, next to the cognition book.", "它就在书籍页上，紧挨着那本讲认知边界的书。"),
    source: "collections.ts · books card",
  }),
  q({
    id: "ch2-dream",
    chapter: 2,
    difficulty: "easy",
    kind: "text",
    prompt: bi("Which film in the collection is about dreams and reality?", "收藏里哪一部电影，讲的是梦与现实？"),
    options: [
      bi("The Truman Show", "楚门的世界"),
      bi("Inception / 盗梦空间", "盗梦空间 Inception"),
      bi("Memento", "记忆碎片"),
      bi("Interstellar", "星际穿越"),
    ],
    correct: 1,
    hint: bi("Its Chinese title contains the character 梦.", "中文片名里有一个「梦」字。"),
    explain: bi("Inception sits on the film page; Interstellar is the space one.", "电影页里，盗梦空间讲梦，星际穿越讲太空。"),
    source: "collections.ts · film card",
  }),
  q({
    id: "ch2-space",
    chapter: 2,
    difficulty: "easy",
    kind: "text",
    prompt: bi("Which film is about space exploration?", "哪一部电影，讲的是太空探索？"),
    options: [
      bi("Interstellar / 星际穿越", "星际穿越 Interstellar"),
      bi("Inception", "盗梦空间"),
      bi("Arrival", "降临"),
      bi("The Martian", "火星救援"),
    ],
    correct: 0,
    hint: bi("Its Chinese title contains the character 星际.", "中文片名里有「星际」两个字。"),
    explain: bi("Interstellar is the space-exploration card on the film page.", "电影页上那一颗，就是星际穿越。"),
    source: "collections.ts · film card",
  }),
  q({
    id: "ch2-cities",
    chapter: 2,
    difficulty: "hard",
    kind: "clue",
    clue: bi(
      "On the cities page, only one place is tagged “Hometown”. The other four are places she would happily return to. Which list is the complete set of five?",
      "收藏册的城市页里，只有一座城被标成「家乡」；另外四座，是还想再去一次的地方。下面哪一组是完整的五座城？",
    ),
    prompt: bi("Which list matches the album?", "哪一组名单和收藏册一致？"),
    options: [
      bi("Chengdu, Dali, Lijiang, Xi'an, Hangzhou", "成都、大理、丽江、西安、杭州"),
      bi("Beijing, Dali, Lijiang, Xi'an, Bengbu", "北京、大理、丽江、西安、蚌埠"),
      bi("Chengdu, Dali, Lijiang, Xiamen, Bengbu", "成都、大理、丽江、厦门、蚌埠"),
      bi("Chengdu, Dali, Lijiang, Xi'an, Bengbu", "成都、大理、丽江、西安、蚌埠"),
    ],
    correct: 3,
    hint: bi("The hometown one comes first, and the last one is not a famous tourist city.", "「家乡」排在第一位，最后一座不算热门旅游城市。"),
    explain: bi("Chengdu is Hometown; Dali, Lijiang, Xi'an and Bengbu follow.", "五张城市卡依次是：成都（家乡）、大理、丽江、西安、蚌埠。"),
    source: "collections.ts · city cards 01–05",
  }),
  q({
    id: "ch2-drink",
    chapter: 2,
    difficulty: "medium",
    kind: "text",
    prompt: bi("What is her usual drink order?", "她固定点饮品时，会怎么搭配？"),
    options: [
      bi("Full sugar, normal ice", "全糖、正常冰"),
      bi("Half sugar, less ice", "半糖、少冰"),
      bi("No extra sugar, no ice", "不另外加糖、去冰"),
      bi("No sugar, served hot", "不加糖、做热的"),
    ],
    correct: 2,
    hint: bi("Two small adjustments, and she makes them whatever she orders.", "是两个小小的调整，而且不管点什么，基本都这样。"),
    explain: bi("The album says: “No extra sugar”, “No ice” — basically the same, whatever I order.", "收藏册写的是：不另外加糖、去冰，不管喝什么基本都这样搭配。"),
    source: "collections.ts · drinks · my usual order",
  }),

  /* ------------------------------------------- Chapter 03 · Explore the World */
  q({
    id: "ch3-collie",
    chapter: 3,
    difficulty: "hard",
    kind: "text",
    prompt: bi("Tapping Princess as she wanders between the five islands unlocks…", "点击在五座岛之间来回走动的公主，会解锁哪一个徽章？"),
    options: [
      bi("小狗追踪员", "小狗追踪员"),
      bi("世界初探者", "世界初探者"),
      bi("地图之外", "地图之外"),
      bi("耳朵有自己的宇宙", "耳朵有自己的宇宙"),
    ],
    correct: 0,
    hint: bi("The badge name is about following somebody.", "那枚徽章的名字，和「跟着谁」有关。"),
    explain: bi("The collie itself is the button — tap it and 小狗追踪员 is yours.", "那只边牧本身就是按钮，点它就能拿到「小狗追踪员」。"),
    source: "world/collie.tsx · COLLIE_BADGE",
  }),
  q({
    id: "ch3-bottle",
    chapter: 3,
    difficulty: "easy",
    kind: "text",
    prompt: bi("What is the special object on A Little Message island?", "「一封信的岛」上，那个特别的物件是什么？"),
    options: [
      bi("A framed painting wall", "一面画框墙"),
      bi("A grand piano", "一架钢琴"),
      bi("A message bottle holding a letter", "装着信的漂流瓶"),
      bi("A ferris wheel", "一座摩天轮"),
    ],
    correct: 2,
    hint: bi("A collie carries it in from the sea.", "是一只边牧把它从海里叼过来的。"),
    explain: bi("The island's whole chapter is built around a bottle with a letter inside.", "整座岛的情节，都是围着那个装着信的漂流瓶展开的。"),
    source: "message/MessageIslandPage.tsx · world/bottle.ts",
  }),
  q({
    id: "ch3-guide",
    chapter: 3,
    difficulty: "easy",
    kind: "text",
    prompt: bi("What is the name of the character who leads visitors to the Fun Zone?", "带访客走向 Fun Zone 的那个角色，叫什么名字？"),
    options: [
      bi("小鹿", "小鹿"),
      bi("公主", "公主"),
      bi("猫头鹰先生", "猫头鹰先生"),
      bi("小狐狸", "小狐狸"),
    ],
    correct: 1,
    hint: bi("She introduces herself in one short sentence: “我是公主。”", "她会用一句很短的话介绍自己：「我是公主。」"),
    explain: bi("“你好呀！我是公主！” — that is her name, not a label.", "「你好呀！我是公主！」——这是她的名字，不是代号。"),
    source: "Game 01 spec · character identity",
  }),
  q({
    id: "ch3-count",
    chapter: 3,
    difficulty: "easy",
    kind: "image",
    visual: "facilities",
    prompt: bi("Look at the Fun Zone facilities. How many game areas are there?", "看看 Fun Zone 里的这些设施：一共有几个游戏区？"),
    options: [bi("1", "1"), bi("2", "2"), bi("4", "4"), bi("3", "3")],
    correct: 3,
    hint: bi("Count the little buildings, not the islands.", "数的是小设施，不是浮岛。"),
    explain: bi("Three: World Explorer, Tiny Maze and The Last Light.", "三个：知识探索站、迷宫入口、最后一束光。"),
    source: "fun/funZone.ts · GAMES",
  }),
  q({
    id: "ch3-game1",
    chapter: 3,
    difficulty: "medium",
    kind: "text",
    prompt: bi("Which is the FIRST game in the Fun Zone?", "Fun Zone 的第一个游戏是哪一个？"),
    options: [
      bi("TINY MAZE", "迷宫入口"),
      bi("WORLD EXPLORER", "知识探索站"),
      bi("THE LAST LIGHT", "最后一束光"),
      bi("A LITTLE MESSAGE", "一封信的岛"),
    ],
    correct: 1,
    hint: bi("It is the one you are playing right now.", "就是你现在正玩着的这一个。"),
    explain: bi("Game 01 is World Explorer — the map, the questions and Princess.", "第 01 个游戏就是 WORLD EXPLORER：地图、题目，还有公主。"),
    source: "fun/funZone.ts · GAMES[0]",
  }),
  q({
    id: "ch3-game2",
    chapter: 3,
    difficulty: "medium",
    kind: "text",
    prompt: bi("Which game opens after World Explorer is completed?", "完成「知识探索站」之后，会打开哪一个游戏？"),
    options: [
      bi("TINY MAZE", "迷宫入口"),
      bi("WORLD EXPLORER", "知识探索站"),
      bi("THE LAST LIGHT", "最后一束光"),
      bi("ACHIEVEMENT WALL", "徽章墙"),
    ],
    correct: 0,
    hint: bi("It is small, and it has walls you walk between.", "它很小，你要在墙之间找路。"),
    explain: bi("Finishing World Explorer unlocks Tiny Maze, whatever your score.", "只要完成一次「知识探索站」，不管分数高低，都会解锁迷宫入口。"),
    source: "fun/funZone.ts · unlock chain",
  }),
  q({
    id: "ch3-game3",
    chapter: 3,
    difficulty: "medium",
    kind: "text",
    prompt: bi("Which game completes the Fun Zone sequence?", "哪一个游戏，是 Fun Zone 三个游戏的最后一站？"),
    options: [
      bi("WORLD EXPLORER", "知识探索站"),
      bi("TINY MAZE", "迷宫入口"),
      bi("THE LAST LIGHT", "最后一束光"),
      bi("THE COLLECTION ROOM", "收藏的房间"),
    ],
    correct: 2,
    hint: bi("Its name has something to do with picking a path.", "名字里，有一个关于「选」的词。"),
    explain: bi("World Explorer → Tiny Maze → The Last Light.", "顺序是：知识探索站 → 迷宫入口 → 最后一束光。"),
    source: "fun/funZone.ts · GAMES[2]",
  }),
  q({
    id: "ch3-gallery",
    chapter: 3,
    difficulty: "hard",
    kind: "clue",
    clue: bi(
      "One island hangs twenty-five plates in the order they happened. Another holds a five-page album of things she keeps coming back to. What separates them?",
      "有一座岛，把 25 幅画按发生的时间挂成一整面墙；另一座岛，是一本五页的册子，收着她反复回到的东西。两者的区别是什么？",
    ),
    prompt: bi("Which description is right?", "哪一种说法是对的？"),
    options: [
      bi("Gallery shows collected favourites; Collections shows her own works", "Gallery 收的是喜欢的收藏，Collections 放的是自己的作品"),
      bi("Both are the same wall, just in two languages", "其实是同一面墙，只是分了中英文"),
      bi("Gallery displays works she made; Collections displays personally collected favourites", "Gallery 展示自己的作品，Collections 展示她收藏的喜欢之物"),
      bi("Gallery is a quiz; Collections is a map", "Gallery 是答题，Collections 是地图"),
    ],
    correct: 2,
    hint: bi("One is about making. The other is about keeping.", "一个关于「做过」，一个关于「留下」。"),
    explain: bi("Gallery = 25 of her own works; Collections = the album of favourites.", "Gallery 是 25 幅自己的作品；Collections 是五页反复回到的收藏。"),
    source: "gallery/GalleryPage.tsx · collections/CollectionsPage.tsx",
  }),
];

/** Fast lookup for a saved round (state only stores ids). */
export const questionById = (id: string): Question | undefined => QUESTIONS.find((q) => q.id === id);

export const CHAPTER_TOTAL = 3;
export const ROUND_TOTAL = 9;
