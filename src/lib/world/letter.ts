/**
 * The letter inside the drifting bottle. Kept in its own file so the copy can
 * change without touching the delivery animation or the modal.
 */

export type Letter = {
  title: { en: string; zh: string };
  kicker: { en: string; zh: string };
  body: { en: string[]; zh: string[] };
  signature: string;
};

export const LETTER: Letter = {
  title: { en: "A letter from the water", zh: "一封从水里捞起的信" },
  kicker: { en: "Found in the pond, third island", zh: "在第三座岛的水池里捡到" },
  body: {
    en: [
      "Hello, you. If this reached you, the bottle did its job.",
      "By now you've walked two islands, and the third one grew a pond while you weren't looking. That is how this place works — it keeps changing when someone pays attention.",
      "Everything I could tell you is already out on the map: what I make, what I keep, what is still waking up. So I'll only say one thing here.",
      "Thank you for walking slowly. Most of the world asks for speed; this one would rather you stayed a while.",
      "Take the letter with you, or leave it in the water. It will be here either way.",
    ],
    zh: [
      "你好呀。你读到这句话，说明瓶子找到你了。",
      "到这会儿，你已经走过两座岛；第三座岛在你没留意的时候，悄悄长出了一个水池。这里就是这样——有人在看的时候，它就会变。",
      "我能讲的事，地图上都已经写了：我做了什么、留着什么、还有什么在慢慢醒过来。所以这封信里，我只说一件事。",
      "谢谢你走得这么慢。外面的世界大多在催，而这里更希望你多待一会儿。",
      "这封信你可以带走，也可以留在水里。反正它都会在这里。",
    ],
  },
  signature: "Jenia",
};
