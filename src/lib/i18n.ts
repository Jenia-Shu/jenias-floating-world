import { useEffect, useState } from "react";

export type Lang = "en" | "zh";

const KEY = "jenia:lang";
const EVENT = "jenia:lang";

function readLang(): Lang {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "en" || saved === "zh") return saved;
  } catch {
    /* storage may be unavailable */
  }
  try {
    const nav = navigator.language || "";
    if (nav.toLowerCase().startsWith("zh")) return "zh";
  } catch {
    /* ignore */
  }
  return "en";
}

/**
 * Language lives in localStorage and broadcasts a window event, so the switch
 * in one corner updates every mounted island page without a router round-trip.
 */
export function useLang(): [Lang, (next: Lang) => void] {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    setLang(readLang());
    const sync = () => setLang(readLang());
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  const set = (next: Lang) => {
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(EVENT));
  };

  return [lang, set];
}

export function pick(lang: Lang, en: string, zh?: string): string {
  return lang === "zh" ? (zh ?? en) : en;
}

const UI = {
  en: {
    map: "Map",
    home: "Home",
    enter: "Enter",
    locked: "Locked",
    seenThis: "Seen this →",
    backToMap: "Back to map",
    discovered: (a: number, b: number) => `${a} / ${b} discovered · tap a lit island`,
    allAwake: "The whole world is awake · drag to look around",
    startOver: "start over",
    gathering: "Gathering the islands",
    loadFailed: "The 3D map didn't finish loading. You can retry, or pick a place below.",
    retry: "Try again",
    welcome: "Welcome to Jenia's World.",
    style: "Style",
    webgl: "The island map needs WebGL, which this browser doesn't seem to support. Try a recent Chrome, Safari, Firefox or Edge.",
  },
  zh: {
    map: "地图",
    home: "首页",
    enter: "进入",
    locked: "未解锁",
    seenThis: "看完了 →",
    backToMap: "回到地图",
    discovered: (a: number, b: number) => `已探索 ${a} / ${b} · 点击亮起的岛`,
    allAwake: "整座世界都醒了 · 拖动看看四周",
    startOver: "重新开始",
    gathering: "岛屿正在聚拢",
    loadFailed: "3D 地图没能加载完。你可以重试，或者直接从下面选一个地方。",
    retry: "重试",
    welcome: "欢迎来到 Jenia 的世界。",
    style: "版式",
    webgl: "这座岛需要 WebGL，你的浏览器似乎不支持。试试较新版本的 Chrome、Safari、Firefox 或 Edge。",
  },
} as const;

export function t(lang: Lang) {
  return UI[lang];
}
