<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- Island terrain math lives in `src/lib/world/terrain.ts` (no React/three imports) so shapes and object placement stay deterministic and testable.
- 3D scene lives in `src/components/world/*`, lazy-loaded from `WorldMap`; the `/` route is `ssr: false` because WebGL is browser-only.
- Scene labels are plain DOM positioned by `LabelProjector` (drei `<Html>` remounted unreliably under React 19 and lost the About Me label).
