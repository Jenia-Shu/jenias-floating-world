/** Bilingual copy for the About Me story. All facts come from what Jenia provided. */

export type Bi = { en: string; zh: string };

export type Block = { id: string; title: Bi; body: Bi };

export type Chapter = {
  id: string;
  num: string;
  title: Bi;
  lead: Bi;
  blocks: Block[];
};

export const CHAPTERS: Chapter[] = [
  {
    id: "beginning",
    num: "01",
    title: { en: "A Beginning", zh: "故事的开始" },
    lead: {
      en: "Every story begins somewhere.",
      zh: "每个故事，都从一个地方开始。",
    },
    blocks: [
      {
        id: "quote",
        title: { en: "A little introduction to who I am.", zh: "关于我是谁的一点介绍。" },
        body: {
          en: "I love the heavy snow in my life, and then the spring that stays.",
          zh: "我爱我生命里的大雪，然后是永驻的春天。",
        },
      },
    ],
  },
  {
    id: "person",
    num: "02",
    title: { en: "The Person Behind", zh: "真正的我" },
    lead: { en: "Who am I?", zh: "我是谁？" },
    blocks: [
      {
        id: "intro",
        title: { en: "A little about me", zh: "一点自我介绍" },
        body: {
          en: "I love music, I like helping people, and I like finding small things in daily life worth looking forward to. I want to feel life in my own way, get to know the world, and find my own kind of joy while I keep exploring.",
          zh: "我喜欢音乐，乐于帮助别人，也喜欢在生活中寻找值得期待的小事。我想用自己的方式感受生活、认识世界，在不断探索中找到属于自己的乐趣。",
        },
      },
      {
        id: "keywords",
        title: { en: "Words that fit", zh: "几个关键词" },
        body: {
          en: "Independent · Curious · Thoughtful · Empathetic · Creative · Explorative",
          zh: "独立 · 好奇 · 思考 · 共情 · 创造 · 探索",
        },
      },
      {
        id: "facts",
        title: { en: "Small facts", zh: "小事" },
        body: {
          en: "Favorite colour — blue. Always exploring — new ideas and experiences. Life motto — keep discovering.",
          zh: "喜欢的颜色——蓝色。一直在探索——新的想法和经历。人生格言——继续发现。",
        },
      },
    ],
  },
  {
    id: "interests",
    num: "03",
    title: { en: "A World of Interests", zh: "兴趣世界" },
    lead: {
      en: "Six small rooms, each one a different way of paying attention.",
      zh: "六个小房间，六种留意世界的方式。",
    },
    blocks: [
      {
        id: "music",
        title: { en: "01 Music & Sound", zh: "01 音乐与声音" },
        body: {
          en: "A warm room with a record player and headphones. Music is how I change the weather of a day.",
          zh: "一个有唱片机和耳机的暖房间。音乐是我改变一天天气的方式。",
        },
      },
      {
        id: "reading",
        title: { en: "02 Reading & Writing", zh: "02 阅读与写作" },
        body: {
          en: "Bookshelves, a desk, a notebook. Literature, character studies, and notes on ordinary life.",
          zh: "书架、书桌、笔记本。文学、人物分析，还有关于日常生活的记录。",
        },
      },
      {
        id: "philosophy",
        title: { en: "03 Psychology & Philosophy", zh: "03 心理学与哲学" },
        body: {
          en: "A quiet room for thinking about human behaviour, self-knowledge, freedom and choice.",
          zh: "一个安静的思考空间：关于人类行为、自我认知、自由与选择。",
        },
      },
      {
        id: "outdoors",
        title: { en: "04 Exploration & Adventure", zh: "04 探索与冒险" },
        body: {
          en: "A path, a lake, a tent, a telescope. Travel, nature, and trying things I have not tried yet.",
          zh: "一条山路、一面湖、一顶帐篷、一架望远镜。旅行、自然，还有尝试新事物。",
        },
      },
      {
        id: "games",
        title: { en: "05 Games & Creative Worlds", zh: "05 游戏与创造" },
        body: {
          en: "Games are places to explore, to find what is hidden, and sometimes to build something of my own.",
          zh: "游戏是可以探索的地方，可以发现隐藏的东西，有时也能造一点属于自己的空间。",
        },
      },
      {
        id: "everyday",
        title: { en: "06 Everyday Life", zh: "06 日常生活" },
        body: {
          en: "A small café, a table, a vase of flowers. Food, small shops, and the details of ordinary days.",
          zh: "一家小咖啡馆、一张桌子、一瓶花。美食、特色小店，还有日常细节。",
        },
      },
    ],
  },
  {
    id: "journey",
    num: "04",
    title: { en: "Growing, Changing, Becoming.", zh: "成长、改变、成为。" },
    lead: {
      en: "Growing up is not about arriving at one correct answer. It is about slowly finding your own.",
      zh: "成长不是变成某个标准答案，而是慢慢找到自己的答案。",
    },
    blocks: [
      {
        id: "self",
        title: { en: "01 Understanding Myself", zh: "01 认识自己" },
        body: {
          en: "Gradually learning my own thoughts, feelings, traits, and the things I actually value.",
          zh: "逐渐了解自己的想法、情绪、特点和真正重视的东西。",
        },
      },
      {
        id: "independent",
        title: { en: "02 Thinking Independently", zh: "02 独立思考" },
        body: {
          en: "Forming my own judgement, understanding other views, and not accepting ready-made answers too quickly.",
          zh: "学会形成自己的判断，理解不同观点，不轻易接受现成答案。",
        },
      },
      {
        id: "others",
        title: { en: "03 Understanding Others", zh: "03 理解他人" },
        body: {
          en: "Realising how complicated people are — learning to understand others while respecting my own feelings and boundaries.",
          zh: "逐渐认识到人与人之间的复杂性，学会理解别人，也尊重自己的感受与边界。",
        },
      },
      {
        id: "direction",
        title: { en: "04 Finding My Direction", zh: "04 寻找方向" },
        body: {
          en: "Trying new things, learning new things, and slowly working out the road I want to take.",
          zh: "继续尝试新的事物，学习新的知识，慢慢找到自己想走的路。",
        },
      },
    ],
  },
  {
    id: "mind",
    num: "05",
    title: { en: "A Mind of My Own", zh: "我自己的想法" },
    lead: {
      en: "A mind of my own. A world to explore.",
      zh: "有自己的想法，也有一个世界可以去探索。",
    },
    blocks: [
      {
        id: "freedom",
        title: { en: "01 · Freedom & Choice", zh: "01 · 自由与选择" },
        body: {
          en: "I think everyone should have the right to choose how they live, instead of only following outside standards.",
          zh: "我认为每个人都应该有权利选择自己的生活方式，而不是只按照外界的标准生活。",
        },
      },
      {
        id: "success",
        title: { en: "02 · My Definition of Success", zh: "02 · 我理解的成功" },
        body: {
          en: "Success should not have only one standard. Reaching what you truly value, while keeping happiness and choice in your life, matters just as much.",
          zh: "成功不应该只有一种标准。实现真正重视的目标，同时保留生活的幸福感和选择权，同样重要。",
        },
      },
      {
        id: "human",
        title: { en: "03 · Understanding People", zh: "03 · 理解人" },
        body: {
          en: "People are complicated. Experience, environment and choices all shape what someone thinks and does. We should not judge others by a single standard.",
          zh: "人是复杂的，经历、环境和选择都会影响一个人的想法与行为。我们不应该轻易用单一标准判断别人。",
        },
      },
      {
        id: "growth",
        title: { en: "04 · Learning & Growing", zh: "04 · 学习与成长" },
        body: {
          en: "Keep learning, stay curious, think independently — so that more choices stay open.",
          zh: "持续学习、保持好奇、独立思考，让自己拥有更多选择的可能。",
        },
      },
    ],
  },
  {
    id: "still",
    num: "06",
    title: { en: "Still Exploring.", zh: "仍在探索。" },
    lead: { en: "Still becoming.", zh: "仍在成为。" },
    blocks: [
      {
        id: "end",
        title: { en: "There is always more to discover.", zh: "总还有更多可以发现。" },
        body: {
          en: "I am still learning to understand myself, others, and the world around me. I am still on my way — and that is alright.",
          zh: "我还在认识自己，认识世界，也在寻找更多可能。我仍在路上，这样也很好。",
        },
      },
    ],
  },
];

export const KEYWORDS: Bi[] = [
  { en: "Independent", zh: "独立" },
  { en: "Curious", zh: "好奇" },
  { en: "Thoughtful", zh: "思考" },
  { en: "Empathetic", zh: "共情" },
  { en: "Creative", zh: "创造" },
  { en: "Explorative", zh: "探索" },
];
