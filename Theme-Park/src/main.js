import { Renderer, Camera, Transform } from '../../ogl/src/index.js';
import { CAMERA, WORLD, ECONOMY } from './constants.js';
import { createSkybox, createDuskCubemap } from './hub/skybox.js';
import { createGround } from './geometry/ground.js';
import { createFacilities } from './hub/facilities.js';
import { createFountain } from './hub/fountain.js';
import { PlayerController } from './hub/player.js';
import { createShadow } from './hub/shadow.js';
import { loadState, spendTokens } from './meta/store.js';
import { updateHUD, showPrompt, hidePrompt, showCrosshair, hideCrosshair, toggleInfoPanel } from './meta/hud.js';
import { navigateTo, getArcadePinballURL, getCoasterURL, fadeIn, cameFromSubGame } from './meta/nav.js';

class DuskPark {
    constructor() {
        this.canvas = document.getElementById('gl');
        this.init();
        this.bindEvents();
    }

    init() {
        this.renderer = new Renderer({
            canvas: this.canvas,
            dpr: 1,
            antialias: true,
        });
        this.gl = this.renderer.gl;
        this.gl.clearColor(...WORLD.CLEAR_COLOR);

        this.camera = new Camera(this.gl, {
            fov: CAMERA.FOV,
            near: CAMERA.NEAR,
            far: CAMERA.FAR,
        });
        this.camera.position.set(...CAMERA.INITIAL_POSITION);
        this.camera.lookAt(CAMERA.INITIAL_LOOK_AT);

        this.scene = new Transform();
        this.nearestTrigger = null;

        this.buildScene();
        this.player = new PlayerController(this.gl, this.camera, this.canvas);
        this.player.onInteract = () => this.handleInteract();
        this.player.onToggleInfo = () => this.handleToggleInfo();

        this.lastTime = performance.now() / 1000;
        this.running = false;
    }

    buildScene() {
        const { shadow } = createShadow(this.gl);
        this.shadow = shadow;

        this.skybox = createSkybox(this.gl);
        this.skybox.setParent(this.scene);

        this.ground = createGround(this.gl);
        this.ground.setParent(this.scene);
        shadow.add({ mesh: this.ground, cast: false, receive: true });

        const facilities = createFacilities(this.gl);
        this.facilityGroup = facilities.group;
        this.triggers = facilities.triggers;
        this.facilityGroup.setParent(this.scene);
        for (const child of this.facilityGroup.children) {
            shadow.add({ mesh: child, cast: true, receive: true });
        }

        this.cubemap = createDuskCubemap(this.gl);
        const fountain = createFountain(this.gl, this.cubemap);
        this.fountain = fountain.group;
        this.fountain.setParent(this.scene);
        shadow.add({ mesh: fountain.base, cast: true, receive: true });
    }

    bindEvents() {
        window.addEventListener('resize', () => this.onResize());
        document.getElementById('start-btn').addEventListener('click', () => this.start());
    }

    onResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.camera.perspective({
            aspect: window.innerWidth / window.innerHeight,
        });
    }

    start() {
        if (this.running) return;
        this.running = true;
        document.getElementById('loader').classList.add('hidden');
        this.onResize();
        updateHUD();
        if (cameFromSubGame()) {
            fadeIn();
        }
        requestAnimationFrame((t) => this.loop(t));
    }

    loop(timestamp) {
        if (!this.running) return;
        requestAnimationFrame((t) => this.loop(t));

        const time = timestamp / 1000;
        const dt = Math.min(0.033, time - this.lastTime);
        this.lastTime = time;

        this.update(dt, time);
        this.render(time);
    }

    update(dt, time) {
        this.player.update(dt);

        if (this.player.isLocked) {
            showCrosshair();
        } else {
            hideCrosshair();
        }

        this.checkProximity();
    }

    checkProximity() {
        const [px, pz] = this.player.xzPosition;
        let nearest = null;
        let nearestDist = Infinity;

        for (const trigger of this.triggers) {
            const dx = px - trigger.center[0];
            const dz = pz - trigger.center[2];
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < trigger.radius && dist < nearestDist) {
                nearest = trigger;
                nearestDist = dist;
            }
        }

        this.nearestTrigger = nearest;

        if (nearest) {
            if (nearest.facility === 'Coaster Station') {
                const state = loadState();
                const canAfford = state.tokens >= ECONOMY.COASTER_COST;
                if (canAfford) {
                    showPrompt(`<kbd>E</kbd> 搭乘雲霄飛車（${ECONOMY.COASTER_COST} Tokens）`);
                } else {
                    showPrompt(`<kbd>E</kbd> 雲霄飛車（需要 ${ECONOMY.COASTER_COST} Tokens，目前 ${state.tokens}）`);
                }
            } else if (nearest.facility === 'Tour Train') {
                showPrompt(`<kbd>E</kbd> 免費繞園導覽`);
            } else {
                showPrompt(`<kbd>E</kbd> 進入 ${nearest.facility}`);
            }
        } else {
            hidePrompt();
        }
    }

    handleInteract() {
        if (!this.nearestTrigger) return;

        const trigger = this.nearestTrigger;

        if (trigger.facility === 'Coaster Station') {
            const result = spendTokens(ECONOMY.COASTER_COST);
            if (result) {
                updateHUD();
                navigateTo(getCoasterURL());
            }
            return;
        }

        if (trigger.facility === 'Tour Train') {
            return;
        }

        if (trigger.facility === 'Arcade Hall') {
            navigateTo(getArcadePinballURL());
            return;
        }
    }

    handleToggleInfo() {
        toggleInfoPanel();
    }

    render(time) {
        this.shadow.render({ scene: this.scene });
        this.renderer.render({ scene: this.scene, camera: this.camera });
    }
}

const duskPark = new DuskPark();
