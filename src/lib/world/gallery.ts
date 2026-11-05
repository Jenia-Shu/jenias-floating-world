export type Plate = {
  id: string;
  /** Shown verbatim: these are the dates the files themselves carry. */
  date: string;
  title: { en: string; zh: string };
  role: { en: string; zh: string };
  /** Jenia's own words, kept as written. The English side is a translation. */
  quote?: { en: string; zh: string };
  note?: { en: string; zh: string };
};

/**
 * One plate per moment, in the order they happened. Every line traces back to a
 * file on her desktop; the quotes are her own notes from the run-through sheet,
 * not rewritten copy.
 */
export const PLATES: Plate[] = [
  {
    id: "letter",
    date: "2025.08.23",
    title: { en: "A letter to myself, three years on", zh: "《至三年后的我》" },
    role: { en: "Time capsule", zh: "时间胶囊" },
    quote: {
      en: "I really do think something like a time capsule matters.",
      zh: "我觉得时间胶囊这种东西真的很有意义。",
    },
    note: { en: "The letter stays sealed.", zh: "内容封着，不公开。" },
  },
  {
    id: "monitor",
    date: "2025.09.10",
    title: { en: "Elected class monitor", zh: "竞选班长 → 高一 1 班班长" },
    role: { en: "Class monitor, Grade 10-1", zh: "班长 · 高一 1 班" },
    quote: {
      en: "I was so happy that everyone trusted me.",
      zh: "很开心大家能够信任我。",
    },
  },
  {
    id: "essays",
    date: "2025.09.29",
    title: { en: "Two essays from the first weeks", zh: "《宇宙大戏》《初到枫叶的日子》" },
    role: { en: "Essays", zh: "随笔" },
    quote: { en: "I just like writing essays…", zh: "喜欢写随笔……" },
  },
  {
    id: "sharing",
    date: "2025.10.13–15",
    title: {
      en: "Middle-school talk: freedom and self-discipline",
      zh: "初中部学习分享《自律与自由并行》",
    },
    role: { en: "Study Department member", zh: "学习部部员" },
    quote: {
      en: "My first task as a member of the Study Department.",
      zh: "第一次作为学习部部员执行学习部的任务。",
    },
  },
  {
    id: "expo",
    date: "2025.11.18–19",
    title: { en: "Volunteer lead at the Education Expo", zh: "教育博览会礼仪志愿者组长" },
    role: { en: "Group lead — the only one in Grade 10", zh: "组长 · 高一唯一" },
    quote: {
      en: "My first Education Expo, and the only volunteer lead from Grade 10. It stayed with me.",
      zh: "第一次参加教育博览会，还是高一唯一的志愿者组长。很有感触。",
    },
  },
  {
    id: "newsletter",
    date: "2025.11.26",
    title: { en: "League newsletter, issue nine", zh: "第九期团课简报" },
    role: { en: "Youth League committee", zh: "校团委" },
    quote: {
      en: "The first work I ever did for the League committee.",
      zh: "第一次帮校团委做事。",
    },
  },
  {
    id: "semester",
    date: "2026.01.18",
    title: { en: "A summary of the first semester", zh: "高一上总结" },
    role: { en: "Class monitor", zh: "班长" },
    quote: {
      en: "The first semester was trying things, making friends, laying a base.",
      zh: "高一上就是尝试，结交朋友，奠定基础。",
    },
  },
  {
    id: "prep",
    date: "2026.04.13–05.09",
    title: { en: "Getting ready to run", zh: "竞选准备：三份材料" },
    role: { en: "Candidate", zh: "竞选人" },
    quote: {
      en: "I started preparing to run for head of the Study Department. I had no confidence at all.",
      zh: "开始准备竞选学习部部长了，这时候心里挺没底的。。",
    },
  },
  {
    id: "campaign",
    date: "2026.05.13–18",
    title: { en: "Running for head of the Study Department", zh: "学习部部长竞选" },
    role: { en: "Candidate · speaker · video", zh: "竞选人 · 主讲 · 视频主创" },
    quote: {
      en: "A lot of work went in. On stage during the speech round I somehow talked for seven or eight minutes. It wasn't as hard as I imagined — I was happy.",
      zh: "做了很多工作。我记得最后上台做演讲 PK 的时候，不知不觉就讲了七八分钟。没有想象的那么难，我很开心。",
    },
  },
  {
    id: "league",
    date: "2026.05.20–26",
    title: { en: "Joining the Youth League, speaking for the new members", zh: "入团仪式 · 新团员代表发言" },
    role: { en: "New-member representative", zh: "新团员代表" },
    quote: { en: "I had become a reserve cadre.", zh: "已经成为储备干部了。" },
  },
  {
    id: "script",
    date: "2026.05.25–06.07",
    title: { en: "Fifty Years — four drafts of a script", zh: "《五十年》剧本四版" },
    role: { en: "Project lead", zh: "项目负责人" },
    quote: {
      en: "Hard, but happy. The team was good to work with.",
      zh: "很辛苦吧，但是很开心，团队人员都挺好的。",
    },
  },
  {
    id: "egg",
    date: "2026.06.03",
    title: { en: "A Day in the Life — EGG", zh: "《A Day in the Life——EGG》" },
    role: { en: "All in English", zh: "全英文创作" },
    quote: {
      en: "A hard, grinding project — but mixing AI into the deck made it fun.",
      zh: "很辛苦很艰难的一个项目，但是 PPT 融了 AI 做的很好玩。",
    },
  },
  {
    id: "opening",
    date: "2026.06.22–23",
    title: { en: "Fifty Years opens", zh: "《五十年》开演" },
    role: { en: "Project lead", zh: "项目负责人" },
    quote: {
      en: "Finally done. The Zhou Enlai play landed better than we expected — and plenty of people who weren't on the team came to help.",
      zh: "终于完成了，这个周恩来舞台剧反响超级好！！而且很多不是团队人员的都来帮忙了，很开心！！！",
    },
  },
  {
    id: "core",
    date: "2026.08.28",
    title: { en: "Into the student-union core", zh: "进入学生会核心" },
    role: { en: "Head of the Study Department", zh: "学习部部长" },
    quote: { en: "I'm in the core group now. Finally…", zh: "已经加入学生会核心群体了。终于。。。。" },
    note: {
      en: "The plan document saved here isn't mine — I only kept a copy of it.",
      zh: "对应的工作计划文稿不是我写的，是我保存的版本。",
    },
  },
  {
    id: "zel",
    date: "2026.09.07",
    title: { en: "Running for the Zhou Enlai class lead", zh: "竞选周恩来班班长" },
    role: { en: "Candidate", zh: "竞选人" },
    quote: { en: "Running for class monitor again.", zh: "再次竞选班长。" },
  },
  {
    id: "department",
    date: "2026.09.08",
    title: { en: "Building my own department", zh: "组建自己的学习部" },
    role: { en: "Head of the Study Department", zh: "学习部部长" },
    quote: {
      en: "My members made it easy for me. Thank them.",
      zh: "开始组建我自己的学习部，我的部员们都很省心，感谢他们。",
    },
  },
  {
    id: "halloween",
    date: "2026.09.16",
    title: { en: "Halloween, with the presidium", zh: "协助主席团策划万圣节" },
    role: { en: "Planning", zh: "策划" },
    quote: {
      en: "Helping the student-union presidium plan Halloween.",
      zh: "协助学生会主席团策划万圣节。",
    },
  },
  {
    id: "talk-again",
    date: "2026.10.08–11",
    title: { en: "The middle-school talk, one year later", zh: "初中部宣讲《课堂之外》" },
    role: { en: "Speaker · department head", zh: "主讲 · 部长" },
    quote: {
      en: "Wait — the head still does the work?! Fine, but I hope this is the last time!!!",
      zh: "什么？？部长还要打工？？好吧，我希望这是最后一次！！！",
    },
  },
  {
    id: "booths",
    date: "2026.10.17–18",
    title: { en: "Two Halloween booths", zh: "万圣节两个摊位" },
    role: { en: "Planning · budget", zh: "策划 · 预算" },
    quote: {
      en: "I love these two booths — and my members invented both of them.",
      zh: "这两个摊位我很喜欢，而且都是我部员自己想的。很有特色！！！",
    },
  },
  {
    id: "debate-start",
    date: "2026.10.07",
    title: { en: "The third Chinese debate cup begins", zh: "第三届中文辩论赛启动" },
    role: { en: "Organiser", zh: "组织者" },
    quote: {
      en: "Co-organising Maple Leaf's third Chinese debate cup.",
      zh: "协作组织重庆枫叶国际学校第三届中文辩论赛活动。",
    },
  },
  {
    id: "debate-lead",
    date: "2026.10.14",
    title: { en: "Taking over as the person in charge", zh: "正式接手总负责人" },
    role: { en: "Overall lead", zh: "总负责人" },
    quote: { en: "I officially took over.", zh: "正式接手总负责人一职。" },
  },
  {
    id: "debate-work",
    date: "2026.10.19–11.02",
    title: { en: "Rebuilding the deck, week after week", zh: "物料一路更新" },
    role: { en: "Overall lead", zh: "总负责人" },
    quote: {
      en: "Always following up, updating whatever the event needed.",
      zh: "一直在跟进，更新辩论赛需要的东西。",
    },
    note: {
      en: "Eight deck versions, four scripts, 39 pages at the end, 15.5 MB.",
      zh: "8 版 PPT、4 版主持稿、终版 39 页 / 15.5 MB。",
    },
  },
  {
    id: "debate-show",
    date: "2026.11.03",
    title: { en: "The showcase goes off", zh: "表演赛落地" },
    role: { en: "Overall lead", zh: "总负责人" },
    quote: {
      en: "On 11.3 the showcase debate happened!!! It went really well!!! I was over the moon!!!",
      zh: "11.3 完成辩论赛表演赛！！！！！！效果很好！！！！！！超级开心！！！！！！！！！！！",
    },
  },
  {
    id: "closing",
    date: "—",
    title: { en: "What I wanted people to see", zh: "我最想让人看到的" },
    role: { en: "After the debate cup", zh: "辩论赛之后" },
    quote: {
      en: "I wanted everyone to see that we were happy — whatever your role was, you were glad to be part of it.",
      zh: "我最想让大家看到我们很开心，我最想看到大家参加这个活动不管是什么职位身份都很开心！",
    },
  },
  {
    id: "now",
    date: "2026.11",
    title: { en: "Education Expo, round two", zh: "第二次教育博览会" },
    role: { en: "Head of all volunteers · in progress", zh: "总志愿者负责人 · 筹备中" },
    note: {
      en: "A year ago I led eleven people. This time I lead all of them.",
      zh: "一年前我带 11 个人，这一次我带所有人。",
    },
  },
];
