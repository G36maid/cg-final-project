// ============================================================================
// 3D Pinball — Main Game Loop
// Integrates all modules: renderer, physics, table, elements, effects, audio,
// input, scoring, UI. Implements game state machine and render loop.
// ============================================================================

import { Renderer, Camera, Transform } from '../../ogl/src/index.js';
import {
    TABLE, CAMERA, GameState, PHYSICS, PLUNGER, SCORE, COLORS,
    REWARD_CHANNEL, BUMPERS,
} from './constants.js';
import { createTable, SharedUniforms } from './table.js';
import { createBall, updateBallMesh } from './ball.js';
import {
    createFlippers, createBumpers, createSlingshots, createTriBumpers,
    createPlunger, createRewardChannel, createDecorations,
} from './elements.js';
import { createParticleSystem } from './particles.js';
import { createBloom, CameraShake } from './effects.js';
import { PhysicsWorld, CollisionType } from './physics.js';
import { AudioSystem } from './audio.js';
import { Input } from './input.js';
import { ScoreSystem } from './score.js';
import { UI } from './ui.js';

class PinballGame {
    constructor() {
        this.state = GameState.GAME_OVER;
        this.lastTime = 0;
        this.setup();
    }

    // ── Initialization ──────────────────────────────────────────────────
    setup() {
        // Renderer
        this.renderer = new Renderer({ dpr: 1, antialias: false, preserveDrawingBuffer: true });
        this.gl = this.renderer.gl;
        document.body.appendChild(this.gl.canvas);
        this.gl.clearColor(0.02, 0.02, 0.05, 1);

        // Camera
        this.camera = new Camera(this.gl, {
            fov: CAMERA.FOV,
            near: CAMERA.NEAR,
            far: CAMERA.FAR,
        });
        this.camera.position.set(...CAMERA.POSITION);
        this.camera.lookAt([0, 2, 18]);
        this.cameraBasePos = [...CAMERA.POSITION];

        // Scene root
        this.scene = new Transform();

        // Physics world
        this.physics = new PhysicsWorld();

        // Table
        const { group: tableGroup, stripProgram } = createTable(this.gl);
        this.tableGroup = tableGroup;
        this.stripProgram = stripProgram;
        tableGroup.setParent(this.scene);

        // Ball
        const { mesh: ballMesh, radius: ballRadius } = createBall(this.gl);
        this.ballMesh = ballMesh;
        ballMesh.setParent(tableGroup);

        // Elements
        const flippers = createFlippers(this.gl, this.physics);
        this.flippers = flippers;
        flippers.elements.forEach(f => f.node.setParent(tableGroup));

        const bumpers = createBumpers(this.gl, this.physics);
        this.bumpers = bumpers;
        bumpers.bumpers.forEach(b => {
            b.bodyMesh.setParent(tableGroup);
            b.capMesh.setParent(tableGroup);
            b.baseMesh.setParent(tableGroup);
        });

        const slingshots = createSlingshots(this.gl, this.physics);
        this.slingshots = slingshots;
        slingshots.slingshots.forEach(s => {
            s.mesh.setParent(tableGroup);
            s.baseMesh.setParent(tableGroup);
        });

        const triBumpers = createTriBumpers(this.gl, this.physics);
        this.triBumpers = triBumpers;
        triBumpers.triBumpers.forEach(t => t.mesh.setParent(tableGroup));

        const plunger = createPlunger(this.gl);
        this.plunger = plunger;
        plunger.mesh.setParent(tableGroup);
        plunger.baseMesh.setParent(tableGroup);

        const rewardChannel = createRewardChannel(this.gl);
        this.rewardChannel = rewardChannel;
        rewardChannel.group.setParent(tableGroup);

        const decorations = createDecorations(this.gl);
        this.decorations = decorations;
        decorations.accents.forEach(a => a.setParent(tableGroup));

        // Particles
        const particles = createParticleSystem(this.gl);
        this.particles = particles;
        particles.mesh.setParent(tableGroup);

        // Bloom
        this.bloom = createBloom(this.gl);

        // Camera shake
        this.cameraShake = new CameraShake(this.camera);

        // Audio
        this.audio = new AudioSystem();

        // Input
        this.input = new Input();
        this.input.onPlungerRelease = (power) => this.launchBall(power);

        // Score
        this.score = new ScoreSystem();

        // UI
        this.ui = new UI();

        // Reward channel tracking
        this.rewardChannelEntered = false;

        // Setup collision handler
        this.setupCollisionHandler();

        // Setup resize
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Setup UI buttons
        this.ui.startBtn.addEventListener('click', () => this.startGame());
        this.ui.restartBtn.addEventListener('click', () => this.startGame());

        // Show title screen
        this.ui.showTitle();
        this.state = GameState.GAME_OVER; // Pre-game state

        // Start render loop
        this.lastTime = performance.now() / 1000;
        requestAnimationFrame((t) => this.loop(t));
    }

    // ── Collision Handler ───────────────────────────────────────────────
    setupCollisionHandler() {
        this.physics.onCollision = (type, data) => {
            switch (type) {
                case CollisionType.BUMPER: {
                    const pts = this.score.addPoints(data.data.score);
                    const result = this.score.registerBumperHit(data.data.index, performance.now() / 1000);
                    this.bumpers.hitBumper(data.data.index);
                    this.particles.burst(data.x, data.y, COLORS.BUMPER, 10);
                    this.audio.bumper();
                    this.cameraShake.shake(CAMERA.SHAKE_COLLISION);
                    if (result.combo) this.audio.combo();
                    break;
                }
                case CollisionType.SLINGSHOT: {
                    this.score.addPoints(data.data.score);
                    this.slingshots.hitSlingshot(data.data.index);
                    this.particles.burst(data.x, data.y, COLORS.SLINGSHOT, 8);
                    this.audio.slingshot();
                    this.cameraShake.shake(CAMERA.SHAKE_COLLISION);
                    break;
                }
                case CollisionType.TRI_BUMPER: {
                    this.score.addPoints(data.data.score);
                    this.triBumpers.hitTriBumper(data.data.index);
                    this.particles.burst(data.x, data.y, COLORS.TRI_BUMPER, 8);
                    this.audio.bumper();
                    this.cameraShake.shake(CAMERA.SHAKE_COLLISION);
                    break;
                }
                case CollisionType.FLIPPER: {
                    this.audio.flipper();
                    break;
                }
                case CollisionType.WALL: {
                    // Subtle wall hit feedback
                    if (Math.random() < 0.3) this.cameraShake.shake(0.03);
                    break;
                }
                case CollisionType.DRAIN: {
                    this.onBallDrain();
                    break;
                }
            }
        };
    }

    // ── Game State Transitions ──────────────────────────────────────────
    startGame() {
        // Initialize audio (must be triggered by user interaction)
        this.audio.init();
        this.audio.resume();

        // Reset score
        this.score.reset();
        this.ui.hideGameOver();
        this.ui.hideTitle();
        this.resetForLaunch();
    }

    resetForLaunch() {
        this.physics.resetBall();
        this.updateBallMesh(this.physics.ball);
        this.state = GameState.LAUNCH;
        this.score.startBallSave();
        this.rewardChannelEntered = false;
    }

    launchBall(power) {
        if (this.state !== GameState.LAUNCH) return;
        this.physics.launchBall(power);
        this.audio.plunger();
        this.state = GameState.PLAYING;
    }

    onBallDrain() {
        if (this.state !== GameState.PLAYING) return;
        this.state = GameState.DRAINING;

        const lost = this.score.onBallDrain();

        if (!lost) {
            // Ball saved
            setTimeout(() => this.resetForLaunch(), 1500);
        } else {
            this.audio.drain();
            this.cameraShake.shake(CAMERA.SHAKE_DRAIN);

            if (this.score.isGameOver) {
                setTimeout(() => this.triggerGameOver(), 1500);
            } else {
                setTimeout(() => this.resetForLaunch(), 2000);
            }
        }
    }

    triggerGameOver() {
        this.state = GameState.GAME_OVER;
        this.audio.gameOver();
        this.ui.showGameOver(this.score.score);

        // Change light strips to red
        if (this.stripProgram) {
            this.stripProgram.uniforms.uColor.value.set(...COLORS.LIGHT_STRIP_RED);
            this.stripProgram.uniforms.uPulse.value = 1;
        }
    }

    // ── Main Loop ───────────────────────────────────────────────────────
    loop(timestamp) {
        requestAnimationFrame((t) => this.loop(t));
        const time = timestamp / 1000;
        const dt = Math.min(0.033, time - this.lastTime);
        this.lastTime = time;

        this.update(dt, time);
        this.render(time);
    }

    // ── Update ──────────────────────────────────────────────────────────
    update(dt, time) {
        // Update shared shader time uniforms
        this.updateShaderTimes(time);

        // Update flippers from input
        if (this.state === GameState.PLAYING || this.state === GameState.LAUNCH) {
            this.physics.setFlipperActive('left', this.input.flipperLeft);
            this.physics.setFlipperActive('right', this.input.flipperRight);
        }

        // Update plunger
        const plungerCharge = this.input.getPlungerCharge();
        this.plunger.update(plungerCharge);
        this.ui.updatePlunger(plungerCharge);

        // Physics update
        if (this.state === GameState.PLAYING) {
            this.physics.update(dt);
            updateBallMesh(this.ballMesh, this.physics.ball);

            // Check reward channel
            this.checkRewardChannel();

            // Update ball save
            this.score.updateBallSave(dt);
        } else if (this.state === GameState.LAUNCH) {
            // Keep ball at plunger position
            this.physics.ball.x = PLUNGER.LANE_X;
            this.physics.ball.y = PLUNGER.START_Y;
            updateBallMesh(this.ballMesh, this.physics.ball);
        }

        // Update element animations
        this.flippers.update();
        this.bumpers.update(time, dt);
        this.slingshots.update(time);
        this.triBumpers.update(time);
        this.decorations.update(time);
        this.rewardChannel.update(time, false);

        // Update particles
        this.particles.update(dt);

        // Update camera shake
        this.cameraShake.update(dt);

        // Update score display
        const displayScore = this.score.updateScoreDisplay(dt);

        // Update light strip color based on game state
        this.updateLightStrips(time);

        // Update UI
        this.ui.updateScore(displayScore);
        this.ui.updateBalls(this.score.balls, SCORE.INITIAL_BALLS);
        this.ui.updateMultiplier(this.score.multiplier);
        this.ui.updateMessages(this.score.getActiveMessages(time));
        this.ui.updateBallSave(this.score.ballSaveSeconds);
    }

    // ── Render ──────────────────────────────────────────────────────────
    render(time) {
        this.bloom.render(this.scene, this.camera);
    }

    // ── Helper: Update shader time uniforms ─────────────────────────────
    updateShaderTimes(time) {
        // Glass shader time
        // (Glass program is on the glass mesh inside table group)
        this.tableGroup.traverse((node) => {
            if (node.program && node.program.uniforms.uTime) {
                if (!node.program.uniforms.uTime._autoUpdated) {
                    node.program.uniforms.uTime.value = time;
                }
            }
        });
    }

    // ── Helper: Update light strip colors ───────────────────────────────
    updateLightStrips(time) {
        if (!this.stripProgram) return;

        if (this.state === GameState.GAME_OVER) {
            // Red pulse
            this.stripProgram.uniforms.uColor.value.set(...COLORS.LIGHT_STRIP_RED);
            this.stripProgram.uniforms.uPulse.value = 0.5 + 0.5 * Math.sin(time * 3);
        } else if (this.score.comboHits > 0 && time - this.score.lastHitTime < SCORE.COMBO_WINDOW) {
            // Yellow during combo window
            this.stripProgram.uniforms.uColor.value.set(...COLORS.LIGHT_STRIP_YELLOW);
            this.stripProgram.uniforms.uPulse.value = 0.3;
        } else {
            // Green breathing (default)
            this.stripProgram.uniforms.uColor.value.set(...COLORS.LIGHT_STRIP_GREEN);
            this.stripProgram.uniforms.uPulse.value = 0;
        }
        this.stripProgram.uniforms.uTime.value = time;
    }

    // ── Helper: Check reward channel ────────────────────────────────────
    checkRewardChannel() {
        const ball = this.physics.ball;
        // Reward channel area: left side, upper area
        const inChannel = ball.x < -7 && ball.y > 34;

        if (inChannel && !this.rewardChannelEntered) {
            this.rewardChannelEntered = true;
        } else if (!inChannel && this.rewardChannelEntered) {
            // Ball exited the channel — award bonus
            this.score.registerRewardChannel();
            this.audio.bonus();
            this.particles.burst(ball.x, ball.y, [0.7, 0.4, 1.0], 12);
            this.cameraShake.shake(0.2);
            this.rewardChannelEntered = false;
        }
    }

    // ── Helper: Update ball mesh ────────────────────────────────────────
    updateBallMesh(physicsBall) {
        updateBallMesh(this.ballMesh, physicsBall);
    }

    // ── Resize ──────────────────────────────────────────────────────────
    resize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.renderer.setSize(w, h);
        this.camera.perspective({ aspect: w / h });
        this.bloom.resize(w, h);
    }
}

// ── Start ─────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    window.game = new PinballGame();
});
