# 2026-09-06 — No `preview.toml`: rely on Vite auto-detection

Status: accepted (grain-2)

## Context

The preview runtime auto-detects a run shape from the repository, and
`conventions/preview-toml.md` says a manifest should only be added when that
detection is **ambiguous or wrong**. Grain-1 verified the clean-checkout
build/run path; this decision records whether the verified shape needs an
explicit manifest.

## Verified shape

Checked against the Vite row of `conventions/stack-frontend-react.md`
(`vite` dep + `build` script → `dist/`):

| Detection signal | Observed | Result |
| --- | --- | --- |
| Runnable app location | single root `package.json`, no nested packages | repo root — no `target` needed |
| Framework marker | `vite` in `devDependencies` | Vite build-to-static |
| Build script | `"build": "tsc -b && vite build"` | standard `build` name |
| Output directory | `dist/` (no `build.outDir` override in `vite.config.ts`) | framework default |
| Build artifacts | clean `npm run build` emits `dist/index.html` + `dist/assets/*` | matches expected layout |
| Server process | none — no backend, no `PORT` listener of our own | static, not `model = "server"` |
| Datastores / env | no `DATABASE_URL`, `REDIS_URL`, or required build-time keys | no `[db]` / `[env]` |
| Client routing | single-screen app, no history/`pushState` router | no deep-link fallback concern |

Every signal lands on the documented default path, and none of the
`preview-toml.md` triggers (monorepo, non-standard build/run, custom output
dir, required env, React Router v8 Framework Mode) apply. `@react-router/dev`
is absent, so the one ambiguous-Vite case does not apply either.

## Decision

Ship **no** `preview.toml`. Auto-detection resolves this repository to
build-to-static: run `npm run build`, serve `dist/`.

## Rejected alternatives

- **Commit a `preview.toml` restating the detected shape** (`model =
  "build-static"`, `[build].command = "npm run build"`, `[serve].static_dir =
  "dist"`). Rejected: it is redundant with detection, and `preview-toml.md`
  explicitly warns that a manifest must be re-synced whenever the build
  command or output dir changes — so the only thing it adds is a second
  source of truth that can silently go stale. The conventions say "when in
  doubt, leave it out."
- **`model = "static"` serving `dist/` without a build step.** Rejected:
  `dist/` is build output and is git-ignored, so a clean checkout has nothing
  to serve.

## Consequences / how to revisit

Auto-detection stays correct only while the signals above hold. Add a
`preview.toml` if any of these change: the app moves into a subdirectory, the
`build` script is renamed or dropped, `build.outDir` moves off `dist/`, a
server process is introduced, or a required env key is added.

## Verification

No automated test applies — this grain adds no runtime code. The evidence is
the reproduced clean build above (`rm -rf dist && npm run build` → `dist/index.html`)
plus the inspected `package.json` / `vite.config.ts` signals.
