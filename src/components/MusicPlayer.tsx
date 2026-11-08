import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume1, Volume2, VolumeX } from "lucide-react";

/**
 * Global background-music control, fixed top-right.
 *
 * Two buttons: a play/pause toggle and a volume button that reveals a slider.
 * Defaults to a very low volume and loops forever. To avoid jank, we use a
 * plain <audio loop> element whose decode happens off the main thread (it will
 * not make the 3D scene stutter), and we only preload metadata.
 *
 * The track lives at /music.mp3 (drop your file into /public). Until that file
 * exists we fall back to a soft synthesised pad so the site is never silent.
 */

const VOL_KEY = "jenia:music:volume";
const PLAY_KEY = "jenia:music:on";
const DEFAULT_VOL = 0.12;

type Fallback = {
  ctx: AudioContext;
  gain: GainNode;
  stop: () => void;
} | null;

export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fbRef = useRef<Fallback>(null);
  const startedRef = useRef(false);
  const playingRef = useRef(true);

  const [playing, setPlaying] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const v = localStorage.getItem(PLAY_KEY);
    return v === null ? true : v === "1";
  });
  const [volume, setVolume] = useState<number>(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem(VOL_KEY) : null;
    const n = raw ? Number(raw) : DEFAULT_VOL;
    return Number.isFinite(n) && n >= 0 && n <= 1 ? n : DEFAULT_VOL;
  });
  const [showVol, setShowVol] = useState(false);
  const [hasFile, setHasFile] = useState<boolean | null>(null);

  playingRef.current = playing;

  // Keep the audio element + fallback gain in sync with the slider.
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    if (fbRef.current) {
      fbRef.current.gain.gain.setTargetAtTime(volume * 0.6, fbRef.current.ctx.currentTime, 0.1);
    }
    if (typeof window !== "undefined") localStorage.setItem(VOL_KEY, String(volume));
  }, [volume]);

  // Auto-start on the first user gesture (browsers block autoplay-with-sound).
  useEffect(() => {
    if (playing === false) return;
    const start = (e: Event) => {
      if (startedRef.current) return;
      // Don't treat interaction with the player itself as the "first gesture".
      const t = e.target as HTMLElement | null;
      if (t && t.closest("[data-mp]")) return;
      startedRef.current = true;
      beginPlayback();
    };
    window.addEventListener("pointerdown", start, { once: true });
    window.addEventListener("keydown", start, { once: true });
    return () => {
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  function beginPlayback() {
    const el = audioRef.current;
    if (el && hasFile !== false) {
      el.volume = volume;
      el.play().catch(() => {
        setHasFile(false);
        startFallback();
      });
    } else {
      startFallback();
    }
  }

  function startFallback() {
    if (fbRef.current || typeof window === "undefined") return;
    try {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      const ctx = new Ctor();
      const master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 700;
      filter.Q.value = 0.5;
      filter.connect(master);
      // A calm, wordless pad — A minor-ish: A2, E3, A3, C4.
      const freqs = [110, 164.81, 220, 261.63];
      const oscs = freqs.map((f, i) => {
        const o = ctx.createOscillator();
        o.type = i % 2 ? "sine" : "triangle";
        o.frequency.value = f;
        const g = ctx.createGain();
        g.gain.value = 0.16 / freqs.length;
        o.connect(g).connect(filter);
        o.start();
        return o;
      });
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.06;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 240;
      lfo.connect(lfoGain).connect(filter.frequency);
      lfo.start();
      master.gain.setTargetAtTime(volume * 0.6, ctx.currentTime, 1.4);
      fbRef.current = {
        ctx,
        gain: master,
        stop: () => {
          try {
            oscs.forEach((o) => o.stop());
            lfo.stop();
          } catch {
            /* already stopped */
          }
          void ctx.close();
        },
      };
    } catch {
      /* audio is a nice-to-have */
    }
  }

  function stopFallback() {
    const fb = fbRef.current;
    if (!fb) return;
    fb.gain.gain.setTargetAtTime(0, fb.ctx.currentTime, 0.3);
    window.setTimeout(() => {
      try {
        fb.stop();
      } catch {
        /* already stopped */
      }
    }, 600);
    fbRef.current = null;
  }

  function toggle() {
    const next = !playing;
    setPlaying(next);
    if (typeof window !== "undefined") localStorage.setItem(PLAY_KEY, next ? "1" : "0");
    if (next) {
      beginPlayback();
    } else {
      audioRef.current?.pause();
      stopFallback();
    }
  }

  const VolIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div
      data-mp
      className="fixed right-3 top-3 z-[60] flex items-center gap-1.5 rounded-full border border-black/5 bg-white/70 p-1 pl-2 shadow-lg shadow-black/5 backdrop-blur-md"
    >
      {showVol && (
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          aria-label="音量大小"
          className="h-1 w-24 cursor-pointer accent-sky-500"
          style={{ accentColor: "#5b8bbf" }}
        />
      )}
      <button
        type="button"
        onClick={() => setShowVol((s) => !s)}
        aria-label="调整音量"
        aria-pressed={showVol}
        className="rounded-full p-2 text-slate-600 transition-colors hover:bg-black/5 hover:text-slate-900"
      >
        <VolIcon size={18} strokeWidth={1.8} />
      </button>
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "暂停背景音乐" : "播放背景音乐"}
        className="rounded-full p-2 text-slate-600 transition-colors hover:bg-black/5 hover:text-slate-900"
      >
        {playing ? <Pause size={18} strokeWidth={1.8} /> : <Play size={18} strokeWidth={1.8} />}
      </button>
      <audio
        ref={audioRef}
        src={`${import.meta.env.BASE_URL}music.mp3`}
        loop
        preload="metadata"
        onCanPlay={() => setHasFile(true)}
        onError={() => {
          setHasFile(false);
          if (playing && startedRef.current) startFallback();
        }}
      />
    </div>
  );
}
