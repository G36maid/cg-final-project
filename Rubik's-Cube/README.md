# Rubik's Cube

A fully interactive 3D Rubik's Cube built with [OGL](https://github.com/oframe/ogl) — zero dependencies, pure WebGL.

## Features

- **Drag-to-rotate** — Pick any face and drag to rotate that layer. 150px of drag = 90 degrees of rotation, with an `easeOutBack` snap on release.
- **Orbit camera** — Drag empty space to orbit the camera around the cube.
- **Scramble** — 20-move WCA-constrained random scramble (no consecutive same-face, no triple same-axis). Animated at 120ms per move.
- **Auto-solve** — Layer-by-layer beginner's method solver (7 stages, under 200 moves). Watch the solution animate step-by-step with formula highlighting.
- **Undo / Redo** — Full move history with inverse animation.
- **Timer + move counter** — Timer starts on your first move, stops when the cube is solved.
- **2D cube net** — Live cross-net in the corner showing all six faces, updated in real time.
- **Celebration** — When solved, the 26 cubies expand outward in a 1-second cubic ease-out burst.

## Run

Requires an HTTP server (ES modules won't work over `file://`):

```bash
miniserve . --index index.html
```

Then open the printed URL in your browser.

## Controls

| Action | Input |
|---|---|
| Rotate a layer | Click-drag on any cube face |
| Orbit camera | Click-drag on empty space |
| Scramble | `S` key or SCRAMBLE button |
| Solve | `Space` key or SOLVE button |
| Undo | UNDO button |
| Redo | REDO button |

## Architecture

```
src/
├── cube-state.js       Pure data model: 26 cubies, quaternion math, layer rotation
├── notation.js         Standard move notation parser (R, U', F2, D, L', B)
├── scramble.js         WCA-constrained 20-move scramble generator
├── solver.js           LBL 7-stage solver with random-replay + depth-limited search
├── cube-render.js      OGL 3D renderer: Box bodies + Plane stickers, shared shader programs
├── layer-rotation.js   Animation engine: pivot reparenting, easeOutBack snap, transform baking
├── drag-control.js     Raycast picking, cross-product direction detection, orbit coexistence
├── cube-net.js         Canvas2D cross-net renderer
├── celebration.js      Expand-outward animation on solve
├── ui.js               Timer, move counter, formula highlighting, button management
└── main.js             Bootstrap: renderer, camera, scene, render loop, event wiring
```

### Key Design Decisions

- **State drives rendering** — All rotations update a pure data model (`CubeState`) first, then the 3D meshes sync to match. This keeps the solver, tests, and rendering consistent.
- **Shared WebGL programs** — One shader program per color (7 total), not one per mesh. Creating ~169 separate programs overwhelms GPU context limits.
- **Pivot-based layer animation** — During rotation, cubies are temporarily reparented to a pivot `Transform`. The pivot's quaternion drives the visual rotation. On completion, world matrices are decomposed back into individual cubie transforms.
- **Raycast + face-plane projection** — Click point is raycast against sticker meshes. Drag direction is projected onto the hit face's plane, then `cross(faceNormal, worldDrag)` determines the rotation axis.

## Tests

Pure-logic modules have unit tests (no WebGL/DOM dependencies):

```bash
npm test
```

Covers: `cube-state` (rotation, facelets, solved check), `notation` (parsing, inversion), `scramble` (WCA constraints), `solver` (10 random scrambles).

## Tech Stack

- **OGL v1.0.11** — Vendored in-repo at `../ogl/`. Minimal WebGL library, zero npm dependencies.
- **Pure ES Modules** — No bundler, no transpiler, no build step. The browser loads modules directly.
- **Hand-rolled physics** — No external physics engine. All rotation math uses inline quaternion operations.
- **Node.js test runner** — `node:test` + `node:assert`, no Jest/Mocha.
