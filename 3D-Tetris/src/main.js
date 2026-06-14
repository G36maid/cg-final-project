import { Renderer, Camera, Vec3 } from '../../ogl/src/index.js';
import { Game } from './core/Game.js';
import { Scene } from './render/Scene.js';
import { CameraController } from './systems/CameraController.js';
import { Input } from './systems/Input.js';
import { TweenManager, createTween } from './systems/Tween.js';
import { Gravity } from './systems/Gravity.js';
import { PostFX } from './post/PostFX.js';
import { Hud } from './hud/Hud.js';

{
    const renderer = new Renderer({ dpr: 2, antialias: true });
    const gl = renderer.gl;
    document.body.appendChild(gl.canvas);
    gl.clearColor(0.03, 0.03, 0.08, 1);

    const camera = new Camera(gl, { fov: 45, near: 0.1, far: 200 });

    const tweenManager = new TweenManager();
    const game = new Game();
    const scene = new Scene(gl, tweenManager);
    const cameraController = new CameraController(camera);
    const input = new Input(game);
    const gravity = new Gravity();
    const postfx = new PostFX(gl);
    const hud = new Hud();

    game.onPieceSpawn = (piece) => {
        scene.activePiece.sync(piece.getCells(), piece.color);
        scene.ghostPiece.sync(piece.getGhostCells(game.grid), piece.color);
    };

    game.onPieceMove = (piece) => {
        scene.activePiece.sync(piece.getCells(), piece.color);
        scene.ghostPiece.sync(piece.getGhostCells(game.grid), piece.color);
    };

    game.onPieceLock = () => {
        scene.placedBlocks.rebuild(game.grid.getOccupiedCells());
    };

    game.onLayersCleared = (clearedYs) => {
        clearedYs.forEach((y) => {
            scene.particles.burst({
                origin: new Vec3(5, y, 5),
                count: 30,
                color: '#FFFFFF',
                speed: 5,
                mode: 'explosion',
            });
        });
        scene.placedBlocks.rebuild(game.grid.getOccupiedCells());
    };

    game.onHardDrop = (_landY, color, piece) => {
        const cells = piece.getCells();
        let cx = 0;
        let cy = 0;
        let cz = 0;

        cells.forEach((cell) => {
            cx += cell.x;
            cy += cell.y;
            cz += cell.z;
        });

        const origin = new Vec3(cx / cells.length, cy / cells.length, cz / cells.length);

        scene.particles.burst({
            origin,
            count: 25,
            color,
            speed: 4,
            mode: 'splash',
        });

        tweenManager.add(scene.dropRing.trigger(origin, color, 4));
    };

    game.onGameOver = () => {
        const grayTween = postfx.triggerGameOver(createTween);
        if (grayTween) tweenManager.add(grayTween);
        hud.showGameOver();
    };

    game.onStateChange = (newState) => {
        if (newState === 'paused') {
            hud.showPause();
        } else if (newState === 'playing') {
            postfx.reset();
            gravity.reset();
            input.setEnabled(true);
            hud.hideOverlay();
            scene.sync(game);
        } else if (newState === 'gameover') {
            hud.showGameOver();
        }
    };

    scene.sync(game);
    cameraController.setView('default');

    function resize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        renderer.setSize(width, height);
        camera.perspective({ aspect: width / height });
        postfx.resize(width, height);
    }

    window.addEventListener('resize', resize);
    resize();

    let lastTime = performance.now();

    function update(time) {
        requestAnimationFrame(update);

        const dt = Math.min(time - lastTime, 100);
        lastTime = time;

        tweenManager.update(dt);
        cameraController.update();

        if (game.state === 'playing') {
            input.update(dt);
            gravity.setSoftDrop(game.softDropActive);
            gravity.update(dt, game.score.dropInterval, () => game.stepGravity());
        }

        scene.update(dt, time);
        hud.update(game);
        postfx.render({ scene: scene.root, camera });
    }

    requestAnimationFrame(update);
}
