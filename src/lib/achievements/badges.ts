/**
 * The twenty-two badges of the Achievement Wall.
 *
 * Names, numbers and order are the ones Jenia confirmed and must not drift.
 * A badge unlocks only when its `progress` reaches its `target`; every number
 * behind that progress comes from real local records (album, visits, journal,
 * easter eggs, the dog), never from a hard-coded "done" flag.
 */

import type { AchievementStats, BadgeDef, BadgeId } from "./types";

export const BADGES: BadgeDef[] = [
  /* ---------------------------------------------- collection & exploration */
  {
    id: "world-collector",
    num: "01",
    zh: "世界收藏家",
    en: "World Collector",
    group: "collection",
    hidden: false,
    emblem: "globe",
    metal: ["#f0dca6", "#a8813f"],
    story: {
      en: "She keeps the things that matter — a song, a book, a film, a city, a small ordinary afternoon — the way other people keep photographs.",
      zh: "喜欢把音乐、书籍、电影和生活中的美好事物收集起来。别人收照片，她收的是一首歌、一本书、一部电影、一座城，和一个普通的下午。",
    },
    condition: {
      en: "Collect 10 different cards across the album.",
      zh: "累计翻开 10 张不同的收藏卡片。",
    },
    line: {
      en: "Your shelves are starting to look like a world.",
      zh: "你的书架，开始像一个世界了。",
    },
    progress: (s) => ({ current: Math.min(s.discoveredCards, 10), target: 10 }),
  },
  {
    id: "universe-of-music",
    num: "02",
    zh: "耳朵有自己的宇宙",
    en: "A Universe of Music",
    group: "collection",
    hidden: false,
    emblem: "music",
    metal: ["#cfdcea", "#6f8ba3"],
    story: {
      en: "Three pieces that stayed: lunchtime piano, a song that is simply classic, and one from a chapter she loved enough to make it her ringtone.",
      zh: "三首留下来的曲子：初中午饭时的钢琴曲、一首因为实在经典而耐听的歌，还有一首来自她很喜欢的篇章——后来成了她的手机铃声。",
    },
    condition: {
      en: "Turn over all 3 cards on the music page.",
      zh: "翻开音乐页的全部 3 张卡片。",
    },
    line: {
      en: "A universe tuned to your own ears.",
      zh: "一个只按你的耳朵调过音的宇宙。",
    },
    progress: (s) => ({ current: Math.min(s.musicCards, 3), target: 3 }),
  },
  {
    id: "beyond-the-map",
    num: "05",
    zh: "地图之外",
    en: "Beyond the Map",
    group: "collection",
    hidden: false,
    emblem: "compass",
    metal: ["#cfe3d5", "#6f9683"],
    story: {
      en: "Chengdu is home; Dali, Lijiang, Xi'an and Bengbu are places she would happily return to. The map has edges, but her curiosity does not.",
      zh: "成都是家乡，大理、丽江、西安、蚌埠是愿意一次次回去的城市。地图有边界，好奇心没有。",
    },
    condition: {
      en: "Turn over 3 different places on the places page.",
      zh: "在地点页翻开 3 座不同的城市。",
    },
    line: {
      en: "Three pins on a map that keeps growing.",
      zh: "地图上又多了三枚图钉。",
    },
    progress: (s) => ({ current: Math.min(s.placeCards, 3), target: 3 }),
  },
  {
    id: "ten-treasures",
    num: "26",
    zh: "十件珍宝",
    en: "Ten Treasures",
    group: "collection",
    hidden: false,
    emblem: "treasure",
    metal: ["#efd9a2", "#b08a45"],
    story: {
      en: "Ten cards face up, ten reasons kept. Not a score — just a small chest of things worth coming back to.",
      zh: "十张卡片翻开，十个留下来的理由。不是战绩，只是一只装着“值得再回来”的小箱子。",
    },
    condition: {
      en: "Collect 10 cards in the album.",
      zh: "累计翻开 10 张收藏卡片。",
    },
    line: {
      en: "Ten treasures, all yours.",
      zh: "十件珍宝，都归你了。",
    },
    progress: (s) => ({ current: Math.min(s.discoveredCards, 10), target: 10 }),
  },
  {
    id: "five-worlds",
    num: "28",
    zh: "五大领域全制霸",
    en: "Five Worlds Explorer",
    group: "collection",
    hidden: false,
    emblem: "constellation",
    metal: ["#d8dfeb", "#7a8ea8"],
    story: {
      en: "Music, words, films, places, everyday things — five rooms, and at least one light on in each of them.",
      zh: "音乐、文字、影视、地点、生活——五个房间，每一间都至少亮起一盏灯。",
    },
    condition: {
      en: "Open at least one card on each of the five album pages.",
      zh: "收藏册的五个页面，每一页至少翻开一张卡片。",
    },
    line: {
      en: "Five rooms, all lit.",
      zh: "五个房间，都亮着。",
    },
    progress: (s) => ({ current: s.exploredCategories, target: 5 }),
  },

  /* ------------------------------------------------- personality & growth */
  {
    id: "little-things",
    num: "07",
    zh: "生活细节观察员",
    en: "Little Things Observer",
    group: "growth",
    hidden: false,
    emblem: "eye",
    metal: ["#dfe9d8", "#7c9a76"],
    story: {
      en: "Sky, sunlight, a passing breeze, the way an ordinary afternoon falls — she notices, and writes it down.",
      zh: "天空、阳光、一阵路过的风、普通下午落下来的样子——她看得见，也愿意记下来。",
    },
    condition: {
      en: "Keep 5 different everyday observations in the private notebook.",
      zh: "在私人手记里记录 5 条不同的生活观察。",
    },
    line: {
      en: "The small things know you are watching.",
      zh: "那些小事，知道你在看。",
    },
    progress: (s) => ({ current: Math.min(s.journalMoments, 5), target: 5 }),
  },
  {
    id: "little-happiness",
    num: "08",
    zh: "小确幸收藏师",
    en: "Little Happiness Collector",
    group: "growth",
    hidden: false,
    emblem: "sun",
    metal: ["#f2dfae", "#b78f4c"],
    story: {
      en: "Good weather, a beautiful sky, a comfortable sleep, a to-do list finally ticked off — happiness small enough to keep in a pocket.",
      zh: "好天气、好看的天空、睡一个舒服的觉、待办事项终于划完——小到可以放进口袋的幸福。",
    },
    condition: {
      en: "Keep 5 different small happinesses in the private notebook.",
      zh: "在私人手记里记录 5 个不同的小确幸。",
    },
    line: {
      en: "Five small joys, safely kept.",
      zh: "五个小确幸，都收好了。",
    },
    progress: (s) => ({ current: Math.min(s.journalHappiness, 5), target: 5 }),
  },
  {
    id: "inspiration",
    num: "09",
    zh: "灵感捕手",
    en: "Inspiration Catcher",
    group: "growth",
    hidden: false,
    emblem: "quill",
    metal: ["#dcd9ee", "#7c7aa6"],
    story: {
      en: "Ideas arrive without warning. She catches them in a line or two before they dissolve.",
      zh: "想法总是不打招呼就来。她在它们散掉之前，用一两句话接住。",
    },
    condition: {
      en: "Save 5 different ideas or lines in the private notebook.",
      zh: "在私人手记里保存 5 条不同的灵感或文字。",
    },
    line: {
      en: "Caught before it flew away.",
      zh: "在它飞走之前，接住了。",
    },
    progress: (s) => ({ current: Math.min(s.journalIdeas, 5), target: 5 }),
  },
  {
    id: "unexpected-discoverer",
    num: "14",
    zh: "意外发现家",
    en: "Unexpected Discoverer",
    group: "growth",
    hidden: false,
    emblem: "lens",
    metal: ["#d4e6e8", "#6c9297"],
    story: {
      en: "The best things are rarely on the itinerary. A wrong turn, a curious click, and suddenly there is something new.",
      zh: "最好的东西很少写在行程里。走错一步、好奇地点一下，忽然就多了一样新东西。",
    },
    condition: {
      en: "Find 3 different hidden things in the world.",
      zh: "在网站里发现 3 个不同的隐藏内容。",
    },
    line: {
      en: "You found what was hiding in plain sight.",
      zh: "你找到了藏在眼皮底下的东西。",
    },
    progress: (s) => ({ current: Math.min(s.discoveredEasterEggs, 3), target: 3 }),
  },
  {
    id: "beyond-the-plan",
    num: "15",
    zh: "计划之外的惊喜",
    en: "Beyond the Plan",
    group: "growth",
    hidden: false,
    emblem: "plane",
    metal: ["#d7e4f2", "#7189a8"],
    story: {
      en: "She leaves room for the unplanned: a sudden trip, a food she has never tried, an evening that goes somewhere else.",
      zh: "她会给“没安排”留一点位置：一次临时起意的旅行、一种没吃过的食物、一个拐了弯的晚上。",
    },
    condition: {
      en: "Meet 3 different random surprises while exploring.",
      zh: "在探索途中遇见 3 种不同的随机惊喜。",
    },
    line: {
      en: "The plan was fine. This was better.",
      zh: "计划本来也不错，但这个更好。",
    },
    progress: (s) => ({ current: Math.min(s.distinctSurprises, 3), target: 3 }),
  },
  {
    id: "behind-scenes",
    num: "16",
    zh: "幕后魔法师",
    en: "Behind-the-Scenes Magician",
    group: "growth",
    hidden: false,
    emblem: "wand",
    metal: ["#eed6d8", "#a97c86"],
    story: {
      en: "The part nobody photographs: the planning, the lists, the quiet work that makes the day happen.",
      zh: "没人拍照的那部分：策划、清单、把一天真正撑起来的安静工作。",
    },
    condition: {
      en: "Confirm in the private corner that you have planned an event.",
      zh: "在私人角落确认：你策划过一项活动。",
    },
    line: {
      en: "The magic was in the preparation.",
      zh: "魔法藏在准备里。",
    },
    progress: (s) => ({ current: s.plannedEvent ? 1 : 0, target: 1 }),
  },
  {
    id: "making-it-happen",
    num: "17",
    zh: "把不可能变成活动",
    en: "Making It Happen",
    group: "growth",
    hidden: false,
    emblem: "flag",
    metal: ["#e7d2b8", "#a47a4c"],
    story: {
      en: "An idea became a date, a date became a room full of people, and it actually happened.",
      zh: "一个想法变成一个日期，一个日期变成一屋子人，然后它真的发生了。",
    },
    condition: {
      en: "Confirm in the private corner that you have completed a large event.",
      zh: "在私人角落确认：你完成过一项大型活动的组织。",
    },
    line: {
      en: "You made it real.",
      zh: "你把它变成了真的。",
    },
    progress: (s) => ({ current: s.organizedEvent ? 1 : 0, target: 1 }),
  },
  {
    id: "no-standard-answer",
    num: "18",
    zh: "成长没有标准答案",
    en: "No Standard Answer",
    group: "growth",
    hidden: false,
    emblem: "sprout",
    metal: ["#d6e8d2", "#71936b"],
    story: {
      en: "She keeps thinking, keeps asking, keeps writing it down. Growing is not a test she is trying to pass.",
      zh: "她一直在想、一直在问、一直写下来。成长不是一场要考过的试。",
    },
    condition: {
      en: "Keep 5 different growth notes in the private notebook.",
      zh: "在私人手记里记录 5 条不同的成长记录。",
    },
    line: {
      en: "Still growing, still no answer key.",
      zh: "还在长，还是没有标准答案。",
    },
    progress: (s) => ({ current: Math.min(s.journalGrowth, 5), target: 5 }),
  },
  {
    id: "world-waiting",
    num: "20",
    zh: "世界还没逛完",
    en: "The World Is Still Waiting",
    group: "growth",
    hidden: false,
    emblem: "horizon",
    metal: ["#d9e2e8", "#788b9c"],
    story: {
      en: "Five islands, and the feeling that the map should be bigger. There is always one more place to look.",
      zh: "五座岛，还是觉得地图应该更大一点。总还有一个地方值得去看看。",
    },
    condition: {
      en: "Explore all 5 main areas of the world.",
      zh: "探索完网站的 5 个主要内容区域。",
    },
    line: {
      en: "The world is still waiting — and so are you.",
      zh: "世界还没逛完，你也还没停下。",
    },
    progress: (s) => ({ current: s.exploredAreas, target: s.totalSections }),
  },

  /* ---------------------------------------------- milestones & secrets */
  {
    id: "lifetime-counter",
    num: "21",
    zh: "生命计数器",
    en: "Lifetime Counter",
    group: "milestones",
    hidden: false,
    emblem: "hourglass",
    metal: ["#e6e1d6", "#8f8574"],
    story: {
      en: "Not a countdown — a count of days already lived, kept only on this device and only for her.",
      zh: "不是倒计时，是已经生活过的天数。只留在这台设备上，只给她自己看。",
    },
    condition: {
      en: "Set a birthday in the private corner.",
      zh: "在私人角落设置生日。",
    },
    line: {
      en: "Every day counted, none of them public.",
      zh: "每一天都被数着，但不必公开。",
    },
    progress: (s) => ({ current: s.lifetimeDays === null ? 0 : 1, target: 1 }),
  },
  {
    id: "secret-finder",
    num: "30",
    zh: "发现秘密的人",
    en: "Secret Finder",
    group: "milestones",
    hidden: true,
    emblem: "keyhole",
    metal: ["#c9d5e6", "#5f7594"],
    story: {
      en: "Something in the world was not meant to be clicked. She clicked it anyway.",
      zh: "世界里有一样东西本来不是给人点的。她还是点了。",
    },
    condition: {
      en: "Find your first hidden thing.",
      zh: "第一次发现网站中的隐藏内容。",
    },
    line: {
      en: "The world noticed you noticing.",
      zh: "世界发现你发现了它。",
    },
    progress: (s) => ({ current: Math.min(s.discoveredEasterEggs, 1), target: 1 }),
  },
  {
    id: "egg-hunter",
    num: "31",
    zh: "彩蛋猎人",
    en: "Easter Egg Hunter",
    group: "milestones",
    hidden: true,
    emblem: "eggs",
    metal: ["#d8e7df", "#6f8f83"],
    story: {
      en: "One hidden thing is an accident. Five is a habit.",
      zh: "发现一个隐藏内容可能是碰巧。发现五个，就是习惯了。",
    },
    condition: {
      en: "Find 5 different hidden things.",
      zh: "累计发现 5 个不同的隐藏内容。",
    },
    line: {
      en: "Nothing stays hidden for long around you.",
      zh: "在你面前，东西藏不了多久。",
    },
    progress: (s) => ({ current: Math.min(s.discoveredEasterEggs, 5), target: 5 }),
  },
  {
    id: "no-page-left",
    num: "33",
    zh: "一页也不放过",
    en: "No Page Left Behind",
    group: "milestones",
    hidden: false,
    emblem: "book",
    metal: ["#e9dfc8", "#9a8359"],
    story: {
      en: "Every card in the album, turned over at least once. She does not leave a page half-read.",
      zh: "收藏册里的每一张卡片，至少翻开过一次。她不把任何一页读到一半。",
    },
    condition: {
      en: "Turn over every card currently in the album.",
      zh: "翻开收藏册里当前所有的卡片。",
    },
    line: {
      en: "Every page, read to the end.",
      zh: "每一页，都读到了最后。",
    },
    progress: (s) => ({ current: s.discoveredCards, target: s.totalCards }),
  },
  {
    id: "completionist",
    num: "34",
    zh: "世界已探索100%",
    en: "World Completionist",
    group: "milestones",
    hidden: false,
    emblem: "gauge",
    metal: ["#f0d9a0", "#a57f3d"],
    story: {
      en: "Five areas, each with its own small task — not just opened, but finished.",
      zh: "五个区域，各有各的小任务——不只是打开过，而是真的做完。",
    },
    condition: {
      en: "Finish the exploration task in every main area: read My World, walk the Gallery, read every album card, open the Fun Zone, and visit A Little Message.",
      zh: "完成每个主要区域的探索任务：读我的世界、走完作品集、翻完收藏册、进入乐园、到访一封信的岛。",
    },
    line: {
      en: "One hundred percent. The whole world, awake.",
      zh: "百分之百。整座世界，都醒了。",
    },
    progress: (s) => ({ current: s.completedSections, target: s.totalSections }),
  },
  {
    id: "dog-tracker",
    num: "37",
    zh: "小狗追踪员",
    en: "Border Collie Tracker",
    group: "milestones",
    hidden: false,
    emblem: "paw",
    metal: ["#dfe3e8", "#5f6d7d"],
    story: {
      en: "The black-and-white dog on the meadow does not appear on any map. She found it anyway.",
      zh: "草地上那只黑白小狗不在任何地图上。她还是找到了。",
    },
    condition: {
      en: "Click the border collie on the main island.",
      zh: "在主岛上直接点击那只边境牧羊犬。",
    },
    line: {
      en: "Found the one who was already watching you.",
      zh: "找到了那只早就在看你的小狗。",
    },
    progress: (s) => ({ current: s.dogFound ? 1 : 0, target: 1 }),
  },
  {
    id: "unexpected-luck",
    num: "38",
    zh: "欧气突然降临",
    en: "Unexpected Luck",
    group: "milestones",
    hidden: true,
    emblem: "clover",
    metal: ["#d9e9cf", "#6f9462"],
    story: {
      en: "No warning, no reason. The world simply decided to be kind for a moment.",
      zh: "没有预告，也没有理由。世界只是忽然决定对它好一点。",
    },
    condition: {
      en: "Meet one real random surprise.",
      zh: "触发一次真正的随机惊喜事件。",
    },
    line: {
      en: "Some days just arrive with a gift.",
      zh: "有些日子，就是带着礼物来的。",
    },
    progress: (s) => ({ current: Math.min(s.distinctSurprises, 1), target: 1 }),
  },
  {
    id: "one-percent",
    num: "40",
    zh: "世界的第1%",
    en: "The 1%",
    group: "milestones",
    hidden: true,
    emblem: "percent",
    metal: ["#d8d6ee", "#6b6796"],
    story: {
      en: "Not luck. Not one click. Every hidden thing found, every card turned, the dog, the whole world finished — and only then the last door.",
      zh: "不是运气，也不是一次点击。所有隐藏内容都找到、所有卡片都翻开、小狗也找到了、整座世界都走完——最后那扇门才开。",
    },
    condition: {
      en: "A secret set of conditions: finish the world, find all 5 hidden things, turn every card, find the dog, and meet all 3 random surprises.",
      zh: "一组隐藏条件：走完整个世界、找到全部 5 个隐藏内容、翻完所有卡片、找到小狗，并遇见全部 3 种随机惊喜。",
    },
    line: {
      en: "You are the one percent who stayed until the end.",
      zh: "你就是那 1%：一直留到了最后的人。",
    },
    progress: (s) => {
      const stages = [
        s.worldCompletion >= 1,
        s.discoveredEasterEggs >= 5,
        s.totalCards > 0 && s.discoveredCards >= s.totalCards,
        s.dogFound,
        s.distinctSurprises >= 3,
      ];
      return { current: stages.filter(Boolean).length, target: stages.length };
    },
  },
];

export const BADGE_BY_ID = new Map<BadgeId, BadgeDef>(BADGES.map((b) => [b.id, b]));

export const GROUP_TITLES = {
  collection: { en: "Collection & Exploration", zh: "主题收藏与探索" },
  growth: { en: "Personality & Growth", zh: "个性与成长" },
  milestones: { en: "Milestones & Secrets", zh: "数字成就与隐藏发现" },
} as const;
