// 黃昏樂園 Dusk Park — 主入口
// Phase 1: Hub 場景骨架 — Renderer / Camera / Scene / Skybox / Ground / Loop

import { Renderer, Camera, Transform, Plane, Mesh, Program } from '../../ogl/src/index.js';
import { CAMERA, WORLD, MATERIAL } from './constants.js';
import { createSkybox } from './hub/skybox.js';
import { createLightingUniforms, createDefaultTexture } from './hub/lighting.js';
import { phongVertex, phongFragment } from './shaders/phong.js';

class DuskPark {
    constructor() {
        this.canvas = document.getElementById('gl');
        this.init();
        this.bindEvents();
    }

    init() {
        // ===== Renderer =====
        // 使用 index.html 中的 <canvas id="gl">（OGL Renderer 接受 canvas 參數）
        this.renderer = new Renderer({
            canvas: this.canvas,
            dpr: 1,
            antialias: true,
        });
        this.gl = this.renderer.gl;
        this.gl.clearColor(...WORLD.CLEAR_COLOR);

        // ===== Camera =====
        this.camera = new Camera(this.gl, {
            fov: CAMERA.FOV,
            near: CAMERA.NEAR,
            far: CAMERA.FAR,
        });
        this.camera.position.set(...CAMERA.INITIAL_POSITION);
        this.camera.lookAt(CAMERA.INITIAL_LOOK_AT);

        // ===== Scene root =====
        this.scene = new Transform();

        // ===== 場景元素（陸續擴充） =====
        this.buildSkybox();    // T5: 黃昏 cube map 背景
        this.buildGround();    // 暗色廣場地面（之後升級為貼圖）

        // ===== 狀態 =====
        this.lastTime = performance.now() / 1000;
        this.running = false;
    }

    // ===== Skybox（T5） =====
    buildSkybox() {
        this.skybox = createSkybox(this.gl);
        this.skybox.setParent(this.scene);
    }

    buildGround() {
        const geometry = new Plane(this.gl, {
            width: WORLD.GROUND_SIZE,
            height: WORLD.GROUND_SIZE,
        });

        const program = new Program(this.gl, {
            vertex: phongVertex,
            fragment: phongFragment,
            uniforms: {
                ...createLightingUniforms(),
                uAmbient: { value: MATERIAL.GROUND.ambient },
                uDiffuse: { value: MATERIAL.GROUND.diffuse },
                uSpecular: { value: MATERIAL.GROUND.specular },
                uShininess: { value: MATERIAL.GROUND.shininess },
                uUseMap: { value: 0 },
                uMap: { value: createDefaultTexture(this.gl) },
            },
        });

        this.ground = new Mesh(this.gl, { geometry, program });
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.setParent(this.scene);
    }

    // ===== 事件綁定 =====
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

    // ===== 啟動（點擊「進入樂園」後） =====
    start() {
        if (this.running) return;
        this.running = true;
        document.getElementById('loader').classList.add('hidden');
        this.onResize();
        requestAnimationFrame((t) => this.loop(t));
    }

    // ===== 主迴圈 =====
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
        // Phase 1 後續：玩家控制器、相機切換、動畫
        // Phase 2 後續：觸發區偵測、HUD 更新
    }

    render(time) {
        this.renderer.render({ scene: this.scene, camera: this.camera });
    }
}

// Bootstrap（module script 預設 defer，DOM 已就緒）
window.duskPark = new DuskPark();
