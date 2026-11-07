/**
 * The letter inside the drifting bottle. Kept in its own file so the copy can
 * change without touching the delivery animation or the modal.
 *
 * The Chinese text is the version the user confirmed on 2026-11-07 (see
 * `docs/漂流瓶岛-需求原档.md`, end of file). The English paragraphs are a
 * faithful translation of that text, written so the bilingual switch has
 * something to show — replace them if a second original is wanted.
 *
 * 2026-11-07 14:15: the user asked for the letter to be from Jenia the person,
 * not from "Jenia's World" — so neither the title nor the signature carries the
 * world's name any more.
 */

export type Letter = {
  title: { en: string; zh: string };
  kicker: { en: string; zh: string };
  body: { en: string[]; zh: string[] };
  signature: { en: string; zh: string };
};

export const LETTER: Letter = {
  title: { en: "A LETTER FROM JENIA", zh: "一封来自杰尼亚的信" },
  kicker: { en: "Someone left you a message", zh: "有人给你留下了一封信" },
  body: {
    en: [
      "Dear Explorer,",
      "I'm glad you found your way here.",
      "Maybe you stumbled upon this place by accident, or maybe you just wanted to see what the next island was hiding.",
      "Either way, welcome to my little world.",
      "I've always thought the interesting part of a world isn't only the scenery that's already been found, but the paths not yet walked, the people not yet met, and the small surprises that happen by chance.",
      "You don't need to hurry toward an ending, and you don't have to explore by anyone's rules. If you like something, stay a little longer. If something makes you curious, go and look.",
      "I hope this little world brings you a bit of joy, and a few surprises you didn't see coming.",
      "After all, life shouldn't only be about the destination.",
      "Sometimes the way there is the view worth keeping.",
      "May you always stay curious.",
    ],
    zh: [
      "很高兴你能来到这里。",
      "也许你是偶然发现了这个地方，也许你只是想看看，下一座岛上究竟藏着什么。",
      "不管怎样，欢迎来到我的小小世界。",
      "我一直觉得，世界有趣的地方，不只是那些已经被发现的风景，还有那些尚未走过的路、没有见过的人，以及偶然发生的小小惊喜。",
      "你不必急着找到终点，也不需要按照某种标准去探索。喜欢什么，就多停留一会儿；遇到好奇的东西，就去看看。",
      "希望这个小小的世界，能给你带来一点快乐，也能让你发现一些意料之外的惊喜。",
      "毕竟，生活不应该只有目的地。",
      "有时候，沿途本身就是值得收藏的风景。",
      "愿你一直保有好奇心。",
    ],
  },
  signature: { en: "Jenia", zh: "杰尼亚" },
};
