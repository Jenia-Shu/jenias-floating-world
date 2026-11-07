/**
 * The card editor. Small and blunt on purpose: one form, two languages, one
 * photo. Empty English or Chinese falls back to the other so a card never ends
 * up blank in one language.
 */

import { useEffect, useState } from "react";
import {
  CATEGORIES,
  CATEGORY_LABEL,
  type Bi,
  type CardCategory,
  type CollectionCard,
} from "@/lib/world/collections";
import type { CardContent } from "@/lib/collections/store";
import { pick, type Lang } from "@/lib/i18n";
import { INK } from "./CardView";

const MUTE = "#7d9fc4";
const GOLD = "#a8813f";

const TINTS: Record<CardCategory, string> = {
  music: "#e9e0cd",
  book: "#dde7ee",
  film: "#dfe0ea",
  city: "#dfe9e3",
  drink: "#e9e2d2",
  life: "#dfe6ea",
  moment: "#e8e0d6",
  happiness: "#efe7d2",
};

const fieldStyle = { borderColor: "rgba(47,65,86,0.2)", background: "#fffdf8", color: "#2f4156" };
const fieldClass =
  "w-full rounded-[0.3rem] border px-2 py-1.5 text-[0.78rem] outline-none transition focus:border-[#a8813f]";

function pair(en: string, zh: string): Bi {
  const a = en.trim();
  const b = zh.trim();
  return { en: a || b, zh: b || a };
}

async function photoToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const max = 1200;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("no canvas");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const url = canvas.toDataURL("image/jpeg", 0.8);
  if (url.length > 3_000_000) throw new Error("too large");
  return url;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <label className="block">
      <span
        className="mb-1 block text-[0.56rem] uppercase tracking-[0.18em]"
        style={{ color: MUTE }}
      >
        {label}
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          placeholder={placeholder}
          className={fieldClass}
          style={fieldStyle}
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={fieldClass}
          style={fieldStyle}
        />
      )}
    </label>
  );
}

export function CardEditor({
  card,
  lang,
  onClose,
  onSave,
  onDelete,
  onRestore,
}: {
  card: CollectionCard | null;
  lang: Lang;
  onClose: () => void;
  onSave: (content: CardContent) => void;
  onDelete?: (() => void) | undefined;
  onRestore?: (() => void) | undefined;
}) {
  const L = (en: string, zh: string) => pick(lang, en, zh);
  const [titleEn, setTitleEn] = useState(card?.title.en ?? "");
  const [titleZh, setTitleZh] = useState(card?.title.zh ?? "");
  const [subEn, setSubEn] = useState(card?.subtitle.en ?? "");
  const [subZh, setSubZh] = useState(card?.subtitle.zh ?? "");
  const [srcEn, setSrcEn] = useState(card?.source?.en ?? "");
  const [srcZh, setSrcZh] = useState(card?.source?.zh ?? "");
  const [descEn, setDescEn] = useState(card?.description.en ?? "");
  const [descZh, setDescZh] = useState(card?.description.zh ?? "");
  const [noteEn, setNoteEn] = useState(card?.personalNote.en ?? "");
  const [noteZh, setNoteZh] = useState(card?.personalNote.zh ?? "");
  const [tags, setTags] = useState(
    card ? card.tags.map((tag) => pick(lang, tag.en, tag.zh)).join(", ") : "",
  );
  const [category, setCategory] = useState<CardCategory>(card?.category ?? "music");
  const [image, setImage] = useState<string | null>(card?.coverImage ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      setImage(await photoToDataUrl(file));
    } catch {
      setError(
        L(
          "That photo could not be read. Try a JPG or PNG.",
          "这张照片读不出来，换一张 JPG 或 PNG 试试。",
        ),
      );
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    if (!titleEn.trim() && !titleZh.trim()) {
      setError(L("A card needs a title.", "卡片至少要有一个标题。"));
      return;
    }
    const list = tags
      .split(/[,，]/)
      .map((tag) => tag.trim())
      .filter(Boolean)
      .map((tag) => ({ en: tag, zh: tag }));
    const seen = new Set<string>();
    const unique: Bi[] = [];
    for (const tag of list) {
      if (seen.has(tag.en)) continue;
      seen.add(tag.en);
      unique.push(tag);
    }

    onSave({
      category,
      title: pair(titleEn, titleZh),
      subtitle: pair(subEn, subZh),
      source: srcEn.trim() || srcZh.trim() ? pair(srcEn, srcZh) : null,
      description: pair(descEn, descZh),
      personalNote: pair(noteEn, noteZh),
      tags: unique,
      details: card?.details ?? [],
      coverImage: image,
      art: card?.art ?? "sigil",
      tint: card?.tint ?? TINTS[category],
      label: card?.label ?? null,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto px-4 py-8"
      style={{ background: "rgba(23,37,54,0.45)", backdropFilter: "blur(6px)" }}
      role="dialog"
      aria-modal="true"
      aria-label={L("Edit a collection card", "编辑收藏卡片")}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-2xl rounded-[0.8rem] p-5 sm:p-6"
        style={{ background: "#fbf7ee", boxShadow: "0 30px 70px -30px rgba(15,28,44,0.6)" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.52rem] uppercase tracking-[0.3em]" style={{ color: GOLD }}>
              {card ? L("Edit card", "编辑卡片") : L("New card", "新建卡片")}
            </p>
            <h2 className="mt-1 text-[1.1rem] font-semibold" style={{ color: INK }}>
              {card
                ? pick(lang, card.title.en, card.title.zh)
                : L("A new little card", "一张新的收藏卡")}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-[1.1rem] leading-none transition hover:bg-black/5"
            style={{ color: INK }}
            aria-label={L("Close", "关闭")}
          >
            ×
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Field
            label={L("Title · English", "标题 · 英文")}
            value={titleEn}
            onChange={setTitleEn}
          />
          <Field label={L("Title · 中文", "标题 · 中文")} value={titleZh} onChange={setTitleZh} />
          <Field
            label={L("Author or type · English", "作者或类型 · 英文")}
            value={subEn}
            onChange={setSubEn}
          />
          <Field
            label={L("Author or type · 中文", "作者或类型 · 中文")}
            value={subZh}
            onChange={setSubZh}
          />
          <Field label={L("Source · English", "来源 · 英文")} value={srcEn} onChange={setSrcEn} />
          <Field label={L("Source · 中文", "来源 · 中文")} value={srcZh} onChange={setSrcZh} />
          <Field
            label={L("Why it is here · English", "收藏理由 · 英文")}
            value={descEn}
            onChange={setDescEn}
            multiline
          />
          <Field
            label={L("Why it is here · 中文", "收藏理由 · 中文")}
            value={descZh}
            onChange={setDescZh}
            multiline
          />
          <Field
            label={L("My note · English", "MY NOTE · 英文")}
            value={noteEn}
            onChange={setNoteEn}
            multiline
          />
          <Field
            label={L("My note · 中文", "MY NOTE · 中文")}
            value={noteZh}
            onChange={setNoteZh}
            multiline
          />
          <Field
            label={L("Tags, comma separated", "标签，用逗号分开")}
            value={tags}
            onChange={setTags}
          />
          <label className="block">
            <span
              className="mb-1 block text-[0.56rem] uppercase tracking-[0.18em]"
              style={{ color: MUTE }}
            >
              {L("Kind", "类别")}
            </span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as CardCategory)}
              className={fieldClass}
              style={fieldStyle}
            >
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {pick(lang, CATEGORY_LABEL[item].en, CATEGORY_LABEL[item].zh)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span
            className="relative block h-16 w-[3.2rem] overflow-hidden rounded-[0.25rem]"
            style={{ background: "#efe8da" }}
          >
            {image ? (
              <img src={image} alt="" className="h-full w-full object-cover" />
            ) : (
              <span
                className="grid h-full w-full place-items-center text-[0.5rem] uppercase tracking-[0.1em]"
                style={{ color: MUTE }}
              >
                {L("No photo", "无照片")}
              </span>
            )}
          </span>
          <label
            className="cursor-pointer rounded-full px-3 py-1.5 text-[0.66rem] transition hover:bg-black/5"
            style={{ border: "1px solid rgba(47,65,86,0.22)", color: INK }}
          >
            {busy ? L("Reading…", "读取中…") : L("Upload a photo", "上传一张照片")}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => void upload(event.target.files?.[0])}
            />
          </label>
          {image && (
            <button
              type="button"
              onClick={() => setImage(null)}
              className="text-[0.64rem] underline-offset-4 hover:underline"
              style={{ color: MUTE }}
            >
              {L("remove photo", "移除照片")}
            </button>
          )}
        </div>

        {error && (
          <p className="mt-3 text-[0.7rem]" style={{ color: "#a8442f" }} role="alert">
            {error}
          </p>
        )}

        <div
          className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4"
          style={{ borderColor: "rgba(47,65,86,0.12)" }}
        >
          <div className="flex gap-3">
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      L("Remove this card from the album?", "要把这张卡片从收藏册里删掉吗？"),
                    )
                  )
                    onDelete();
                }}
                className="text-[0.68rem] underline-offset-4 hover:underline"
                style={{ color: "#a8442f" }}
              >
                {L("Delete card", "删除卡片")}
              </button>
            )}
            {onRestore && (
              <button
                type="button"
                onClick={onRestore}
                className="text-[0.68rem] underline-offset-4 hover:underline"
                style={{ color: MUTE }}
              >
                {L("Restore original", "还原原文")}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-4 py-2 text-[0.7rem] transition hover:bg-black/5"
              style={{ color: INK }}
            >
              {L("Cancel", "取消")}
            </button>
            <button
              type="button"
              onClick={save}
              className="rounded-full px-5 py-2 text-[0.7rem] font-semibold text-white transition hover:brightness-105"
              style={{ background: INK }}
            >
              {L("Save card", "保存卡片")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
