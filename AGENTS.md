# AGENTS.md

Guidance for OpenCode agents working in this repo.

## Hard constraint: OGL only, never Three.js

3D rendering must use the vendored **OGL** library exclusively. Do **not** introduce any Three.js dependency (no `three`, `@react-three/fiber`, etc.). This applies to all games. The `original-threejs-plan/` directory contains reference-only design docs that must **not** be implemented — they predate the OGL decision.

## Repo layout

Monorepo of independent browser games sharing one vendored library. No root `package.json`, no monorepo tooling, no build step.

- `ogl/` — OGL library source (v1.0.11), vendored verbatim. **Do not treat as a dependency to `npm install`** — it lives in-repo. Modify only if the library itself needs a fix.
- `3D-Pinball/` — entry: `index.html` → `src/main.js`. No `package.json`.
- `3D-Tetris/` — **no browser entry yet** (WIP). Has `src/` (core logic) and `test/`. Entry point to be created.
- `Roller-Coaster/` — entry: `index.html` → `main.js` (note: `main.js` is at the project root, not in `src/`).
- `Rubik's-Cube/` — entry: `index.html` → `src/main.js`.
- `original-threejs-plan/` — read-only reference. Do not implement from these.

Each game project is self-contained; changes to one game do not affect the others.

## How OGL is imported

Games import the vendored library via **relative paths**, not from an npm package. The depth depends on where the entry file lives:

- Entry at project root (Roller-Coaster): `import { ... } from '../ogl/src/index.js'`
- Entry in `src/` (Pinball, Rubik's-Cube): `import { ... } from '../../ogl/src/index.js'`

Never change these to `import ... from 'ogl'` — there is no installed `node_modules/ogl`.

## Running a game

All projects are pure ES modules — they **require an HTTP server**; `file://` won't work (browser CORS on module scripts).

**Always use `miniserve`** to serve any project. Ignore the `serve`/`start` scripts in each project's `package.json` — those reference `npx serve` or `python3 -m http.server`, but `miniserve` is the canonical choice.

```sh
miniserve .              # run from inside the project directory
```

| Project | Notes |
|---|---|
| 3D-Pinball | Serve the project dir |
| 3D-Tetris | N/A (no entry point yet) |
| Roller-Coaster | Serve the project dir |
| Rubik's-Cube | Serve the project dir |

No bundler, no transpile, no Vite — the browser loads ES modules directly.

## Tests

Tests use **Node's built-in test runner** (`node:test` + `node:assert`). No Jest/Mocha.

| Project | Command |
|---|---|
| Rubik's-Cube | `npm test` (= `node --test tests/*.test.js`) |
| 3D-Tetris | `node --test test/*.test.js` (run from project dir) |

Tests only cover pure-logic modules (state, scoring, grid, notation, solver) — nothing that touches WebGL or the DOM.

## Conventions

- **No external physics engine** — all physics is hand-rolled in JS, updating OGL `Transform` nodes directly.
- **No GLTF/model loading pipelines** — geometry is procedurally generated via OGL primitives and custom `Geometry`/`Program`.
- **Plans are authoritative specs**: each game's `plan.md` (written in Traditional Chinese) defines the detailed game design, physics constants, and controls. Consult it before implementing game behavior.
- **Code style**: no ESLint/Prettier config at root or in game projects (only the vendored `ogl/` has Prettier settings). Match the existing style within each project — most use 4-space indent, single quotes; 3D-Tetris uses 2-space indent.
- **Shaders**: GLSL is inlined in JS via `/* glsl */` template literals inside OGL `Program` configs.
- **Language**: user-facing comments and docs are often in Traditional Chinese.
