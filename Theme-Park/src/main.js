import { Renderer, Camera, Transform } from '../../ogl/src/index.js';
import { CAMERA, WORLD } from './constants.js';
import { createSkybox, createDuskCubemap } from './hub/skybox.js';
import { createGround } from './geometry/ground.js';
import { createFacilities } from './hub/facilities.js';
import { createFountain } from './hub/fountain.js';
import { PlayerController } from './hub/player.js';
import { createShadow } from './hub/shadow.js';

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

        this.buildScene();
        this.player = new PlayerController(this.gl, this.camera, this.canvas);

        this.lastTime = performance.now() / 1000;
        this.running = false;
    }

    buildScene() {
        // Shadow system (must be created before Phong meshes)
        const { shadow, light } = createShadow(this.gl);
        this.shadow = shadow;

        this.skybox = createSkybox(this.gl);
        this.skybox.setParent(this.scene);

        this.ground = createGround(this.gl);
        this.ground.setParent(this.scene);
        // Ground receives shadows but does not cast
        shadow.add({ mesh: this.ground, cast: false, receive: true });

        const facilities = createFacilities(this.gl);
        this.facilityGroup = facilities.group;
        this.triggers = facilities.triggers;
        this.facilityGroup.setParent(this.scene);
        // Buildings cast and receive shadows
        for (const child of this.facilityGroup.children) {
            shadow.add({ mesh: child, cast: true, receive: true });
        }

        this.cubemap = createDuskCubemap(this.gl);
        const fountain = createFountain(this.gl, this.cubemap);
        this.fountain = fountain.group;
        this.fountain.setParent(this.scene);
        // Fountain base casts and receives shadows; water does not
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
    }

    render(time) {
        this.shadow.render({ scene: this.scene });
        this.renderer.render({ scene: this.scene, camera: this.camera });
    }
}

window.duskPark = new DuskPark();
