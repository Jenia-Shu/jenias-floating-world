import { useEffect, useState } from "react";

/**
 * A plain self-check at /?diag=1. When the islands refuse to appear this page
 * answers, in order: can this browser draw WebGL at all? Which resources failed
 * or crawled? And can three.js itself build a renderer and push one frame?
 */
export function Diag() {
  const [rows, setRows] = useState<string[]>(["checking…"]);
  const [errors, setErrors] = useState<string[]>([]);
  const [three, setThree] = useState("not tested yet — press the button below");

  useEffect(() => {
    const errs: string[] = [];
    const onErr = (e: ErrorEvent) => errs.push(`${e.message} @ ${e.filename}:${e.lineno}`);
    const onRej = (e: PromiseRejectionEvent) => errs.push(`rejection: ${String(e.reason)}`);
    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onRej);

    const out: string[] = [];
    out.push(`ua: ${navigator.userAgent}`);
    out.push(`viewport: ${window.innerWidth}x${window.innerHeight} @${window.devicePixelRatio}x`);

    const probe = (kind: "webgl2" | "webgl") => {
      try {
        const c = document.createElement("canvas");
        c.width = 64;
        c.height = 64;
        const gl = c.getContext(kind) as WebGLRenderingContext | WebGL2RenderingContext | null;
        if (!gl) {
          out.push(`${kind}: NULL  <-- this is the problem`);
          return;
        }
        const dbg = gl.getExtension("WEBGL_debug_renderer_info");
        out.push(`${kind}: ok`);
        out.push(`  renderer: ${dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : "hidden"}`);
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      } catch (err) {
        out.push(`${kind}: THREW ${String(err)}`);
      }
    };
    probe("webgl2");
    probe("webgl");

    const res = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    out.push(`resources loaded: ${res.length}`);
    const slow = [...res].sort((a, b) => b.duration - a.duration).slice(0, 8);
    out.push("slowest:");
    slow.forEach((r) => out.push(`  ${Math.round(r.duration)}ms  ${r.name.split("/").pop()?.slice(0, 60)}`));
    const failed = res.filter((r) => r.decodedBodySize === 0 && r.duration > 400);
    if (failed.length) {
      out.push("no body (likely failed):");
      failed.slice(0, 6).forEach((r) => out.push(`  ${r.name.split("/").pop()?.slice(0, 60)}`));
    }

    setRows(out);
    setErrors(errs);
    return () => {
      window.removeEventListener("error", onErr);
      window.removeEventListener("unhandledrejection", onRej);
    };
  }, []);

  const testThree = async () => {
    setThree("importing three…");
    const t0 = performance.now();
    try {
      const THREE = await import("three");
      const importMs = Math.round(performance.now() - t0);
      setThree(`three imported in ${importMs}ms — building a renderer…`);
      const t1 = performance.now();
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(160, 120);
      const scene = new THREE.Scene();
      scene.background = new THREE.Color("#8fb0cf");
      const camera = new THREE.PerspectiveCamera(50, 160 / 120, 0.1, 10);
      camera.position.z = 3;
      const cube = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial({ color: "#f5f4f0" }));
      scene.add(cube);
      scene.add(new THREE.DirectionalLight("#ffffff", 1.2));
      scene.add(new THREE.AmbientLight("#ffffff", 0.6));
      renderer.render(scene, camera);
      const frameMs = Math.round(performance.now() - t1);
      renderer.dispose();
      renderer.forceContextLoss();
      setThree(`OK — import ${importMs}ms, context + first frame ${frameMs}ms`);
    } catch (err) {
      setThree(`FAILED: ${String(err)}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-[#11151a] px-5 py-6 font-mono text-[12px] leading-6 text-[#cfe2f2]">
      <p className="mb-3 text-[#8fb0cf]">Jenia&apos;s World — browser self-check</p>
      <pre className="whitespace-pre-wrap break-words">{rows.join("\n")}</pre>

      <div className="mt-5 border-t border-white/15 pt-4">
        <p className="text-[#8fb0cf]">three.js direct test</p>
        <button
          type="button"
          onClick={testThree}
          className="mt-2 rounded-md bg-[#8fb0cf] px-3 py-1.5 text-[12px] font-semibold text-[#11151a]"
        >
          run the test
        </button>
        <p className="mt-2 text-[#e9e4d9]">{three}</p>
      </div>

      <div className="mt-5 border-t border-white/15 pt-4">
        <p className="text-[#8fb0cf]">page errors so far</p>
        <pre className="mt-2 whitespace-pre-wrap break-words text-[#f0b9b0]">
          {errors.length ? errors.join("\n") : "none"}
        </pre>
      </div>

      <a href="/" className="mt-6 inline-block text-[#8fb0cf] underline">
        back to the site
      </a>
    </div>
  );
}
