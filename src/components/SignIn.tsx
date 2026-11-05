import { useState, type FormEvent } from "react";
import { LangSwitch } from "@/components/LangSwitch";
import { pick, useLang } from "@/lib/i18n";
import { signIn, type Session } from "@/lib/user";

const INK = "#405c78";
const EDGE = "#d9e3ec";
const HINT = "#7d9fc4";
const WARN = "#bf6259";

export function SignIn({ onSignedIn }: { onSignedIn: (session: Session) => void }) {
  const [lang] = useLang();
  const [nameZh, setNameZh] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [password, setPassword] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [answerWrong, setAnswerWrong] = useState(false);

  const clear = () => {
    setError(null);
    setAnswerWrong(false);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const result = signIn(nameEn, nameZh, password, answer);
    if (result.ok) {
      onSignedIn(result.user);
      return;
    }
    if (result.code === "answer") {
      setAnswerWrong(true);
      setError(null);
      return;
    }
    setError(
      result.code === "empty"
        ? pick(lang, "Fill in both names and a password.", "两个名字和密码都要填。")
        : pick(
            lang,
            "That English name is already set up on this device with a different password.",
            "这个英文昵称在这台设备上已经被别的密码注册过了。",
          ),
    );
  };

  const field =
    "mt-2 h-11 w-full rounded-xl border bg-[#fbfcfe] px-3.5 text-[0.95rem] outline-none transition focus:border-[#8fb0cf]";
  const label = "block text-[0.7rem] font-semibold tracking-[0.16em] uppercase";

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-[#dceaf6]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% -10%, #f5f4f0 0%, rgba(245,244,240,0) 55%), radial-gradient(90% 60% at 85% 105%, #c7dcef 0%, rgba(199,220,239,0) 60%)",
        }}
      />
      <div className="absolute right-4 top-4">
        <LangSwitch />
      </div>

      <div className="relative grid min-h-full place-items-center px-5 py-16">
        <div className="w-full max-w-[22rem]">
          <h1
            className="mb-8 text-center text-[0.95rem] font-semibold tracking-[0.34em] uppercase"
            style={{ color: INK }}
          >
            Jenia&apos;s World
          </h1>

          <form
            onSubmit={submit}
            className="rounded-[1.25rem] border border-white/80 bg-white px-6 py-8 shadow-[0_2px_44px_rgba(64,92,120,0.13)] sm:px-7"
          >
            <label className={label} style={{ color: INK }}>
              {pick(lang, "Chinese nickname", "中文昵称")}
            </label>
            <input
              value={nameZh}
              onChange={(e) => {
                setNameZh(e.target.value);
                clear();
              }}
              placeholder={pick(lang, "e.g. 小雨", "比如：小雨")}
              className={`${field} placeholder:text-[#b7c8d8]`}
              style={{ borderColor: EDGE, color: INK }}
            />

            <label className={`${label} mt-4`} style={{ color: INK }}>
              {pick(lang, "English nickname", "英文昵称")}
            </label>
            <input
              value={nameEn}
              onChange={(e) => {
                setNameEn(e.target.value);
                clear();
              }}
              autoComplete="username"
              placeholder={pick(lang, "e.g. Rainy", "比如：Rainy")}
              className={`${field} placeholder:text-[#b7c8d8]`}
              style={{ borderColor: EDGE, color: INK }}
            />

            <label className={`${label} mt-4`} style={{ color: INK }}>
              {pick(lang, "Password", "密码")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clear();
              }}
              autoComplete="current-password"
              className={field}
              style={{ borderColor: EDGE, color: INK }}
            />

            <div className="mt-6 border-t pt-6" style={{ borderColor: EDGE }}>
              <label className={label} style={{ color: INK }}>
                {pick(lang, "Who made this site?", "做这个网站的人叫什么名字？")}
              </label>
              <input
                value={answer}
                onChange={(e) => {
                  setAnswer(e.target.value);
                  clear();
                }}
                placeholder={pick(lang, "Your answer", "你的答案")}
                className={`${field} placeholder:text-[#b7c8d8]`}
                style={{ borderColor: answerWrong ? WARN : EDGE, color: INK }}
              />
              {answerWrong && (
                <p className="mt-2 text-[0.72rem] leading-relaxed" style={{ color: WARN }} role="alert">
                  {pick(
                    lang,
                    "Wrong!! You didn't know that? The answer is right in front of you!",
                    "答错了！！这你都不知道？答案都摆在你眼前了！",
                  )}
                </p>
              )}
            </div>

            {error && (
              <p className="mt-4 text-[0.8rem] leading-relaxed" style={{ color: WARN }} role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="mt-6 h-11 w-full rounded-xl text-[0.9rem] font-semibold tracking-wide text-white transition hover:opacity-90"
              style={{ backgroundColor: INK }}
            >
              {pick(lang, "Enter", "登录")}
            </button>

            <p className="mt-4 text-center text-[0.72rem] leading-relaxed" style={{ color: HINT }}>
              {pick(
                lang,
                "Your exploration progress is saved on this device, per nickname.",
                "探索进度按昵称保存在这台设备上。",
              )}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
