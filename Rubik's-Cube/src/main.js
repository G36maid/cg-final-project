import { Renderer, Camera, Transform, Orbit, Vec3 } from '../../ogl/src/index.js';

import { CubeState } from './cube-state.js';
import { CubeRenderer } from './cube-render.js';
import { LayerRotator } from './layer-rotation.js';
import { DragControl } from './drag-control.js';
import { CubeNet } from './cube-net.js';
import { Celebration } from './celebration.js';
import { UI } from './ui.js';
import { generateScramble } from './scramble.js';
import { solveCube } from './solver.js';

{
    const canvas = document.getElementById('glcanvas');
    const renderer = new Renderer({ canvas, dpr: 2, antialias: true });
    const gl = renderer.gl;
    gl.clearColor(0.102, 0.102, 0.18, 1);

    const camera = new Camera(gl, { fov: 45, near: 0.1, far: 100 });
    camera.position.set(4, 4, 6);
    camera.lookAt([0, 0, 0]);

    const scene = new Transform();
    const orbit = new Orbit(camera, {
        target: new Vec3(0, 0, 0),
        rotateSpeed: 0.5,
        enablePan: false,
    });

    const cubeState = new CubeState();
    const cubeRenderer = new CubeRenderer(gl, scene);
    cubeRenderer.buildCubies(cubeState);

    const layerRotator = new LayerRotator(scene, cubeState, cubeRenderer);
    const dragControl = new DragControl(gl, camera, cubeRenderer, layerRotator, orbit, canvas);
    const cubeNet = new CubeNet(document.getElementById('net-canvas'));
    const celebration = new Celebration(cubeRenderer);
    const ui = new UI();

    let moveHistory = [], redoStack = [];
    let timerStarted = false, isScrambling = false, isSolving = false;

    cubeNet.update(cubeState);
    updateControls();

    dragControl.onMoveCommitted = (move) => {
        moveHistory.push(move);
        redoStack = [];

        if (!timerStarted) {
            timerStarted = true;
            ui.startTimer();
        }

        ui.setMoveCount(moveHistory.length);
        cubeNet.update(cubeState);
        updateControls();

        if (cubeState.isSolved() && moveHistory.length > 0) {
            ui.stopTimer();
            celebration.trigger();
        }
    };

    ui.onScramble = () => doScramble();
    ui.onSolve = () => doSolve();
    ui.onUndo = () => doUndo();
    ui.onRedo = () => doRedo();

    async function doScramble() {
        if (isScrambling || isSolving || layerRotator.mode !== 'idle') return;

        isScrambling = true;
        setInteractionEnabled(false);

        try {
            celebration.reset();
            cubeState.reset();
            cubeRenderer.updateFromState(cubeState);
            moveHistory = [];
            redoStack = [];
            timerStarted = false;
            ui.resetTimer();
            ui.setMoveCount(0);
            ui.hideSolution();

            const scramble = generateScramble(20);
            ui.setScrambleFormula(scramble.notation);

            for (const { axis, layer, turns } of scramble.moves) {
                await layerRotator.animateMove(axis, layer, turns, 120);
            }

            cubeNet.update(cubeState);
        } catch (error) {
            console.error('Scramble failed:', error);
        } finally {
            isScrambling = false;
            setInteractionEnabled(true);
        }
    }

    async function doSolve() {
        if (isScrambling || isSolving || layerRotator.mode !== 'idle') return;

        isSolving = true;
        setInteractionEnabled(false);

        try {
            const solution = solveCube(cubeState);
            ui.setSolutionFormula(solution.moves, 0);

            for (let i = 0; i < solution.moves.length; i++) {
                const { axis, layer, turns } = solution.moves[i];
                ui.updateSolutionHighlight(i);
                await layerRotator.animateMove(axis, layer, turns, 200);
                cubeNet.update(cubeState);
            }

            ui.updateSolutionHighlight(solution.moves.length);

            if (cubeState.isSolved()) {
                ui.stopTimer();
                celebration.trigger();
            }
        } catch (error) {
            console.error('Solve failed:', error);
        } finally {
            isSolving = false;
            setInteractionEnabled(true);
        }
    }

    async function doUndo() {
        if (isScrambling || isSolving || layerRotator.mode !== 'idle' || moveHistory.length === 0) return;

        setInteractionEnabled(false);

        try {
            const move = moveHistory.pop();
            const inverseTurns = move.turns === 1 ? -1 : move.turns === -1 ? 1 : 2;
            await layerRotator.animateMove(move.axis, move.layer, inverseTurns, 120);
            redoStack.push(move);
            ui.setMoveCount(moveHistory.length);
            cubeNet.update(cubeState);
        } finally {
            setInteractionEnabled(true);
        }
    }

    async function doRedo() {
        if (isScrambling || isSolving || layerRotator.mode !== 'idle' || redoStack.length === 0) return;

        setInteractionEnabled(false);

        try {
            const move = redoStack.pop();
            await layerRotator.animateMove(move.axis, move.layer, move.turns, 120);
            moveHistory.push(move);
            ui.setMoveCount(moveHistory.length);
            cubeNet.update(cubeState);
        } finally {
            setInteractionEnabled(true);
        }
    }

    function setInteractionEnabled(enabled) {
        dragControl.enabled = enabled;
        orbit.enabled = enabled;
        if (enabled) updateControls();
        else ui.setBusy(true);
    }

    function updateControls() {
        const idle = !isScrambling && !isSolving && layerRotator.mode === 'idle';
        ui.setButtonsEnabled(idle, idle, idle && moveHistory.length > 0, idle && redoStack.length > 0);
    }

    window.addEventListener('keydown', (e) => {
        if (e.repeat) return;
        if (e.code === 'KeyS') doScramble();
        if (e.code === 'Space') {
            e.preventDefault();
            doSolve();
        }
    });

    canvas.addEventListener('pointerdown', e => dragControl.onPointerDown(e));
    canvas.addEventListener('pointermove', e => dragControl.onPointerMove(e));
    canvas.addEventListener('pointerup', e => dragControl.onPointerUp(e));
    canvas.addEventListener('pointercancel', e => dragControl.onPointerUp(e));

    function resize() {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.perspective({ aspect: gl.canvas.width / gl.canvas.height });
    }

    window.addEventListener('resize', resize);
    resize();

    let lastTime = 0;
    requestAnimationFrame(loop);

    function loop(t) {
        requestAnimationFrame(loop);
        const dt = t - lastTime;
        lastTime = t;
        orbit.update();
        layerRotator.update(dt);
        celebration.update(dt);
        renderer.render({ scene, camera });
    }
}
