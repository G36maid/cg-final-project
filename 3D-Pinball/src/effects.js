// ============================================================================
// 3D Pinball — Visual Effects
// Bloom post-processing (bright pass + gaussian blur + composite) and
// camera shake (random offset on collision/drain events).
// ============================================================================

import { Post, Vec2, Camera } from '../../ogl/src/index.js';
import { BLOOM, CAMERA } from './constants.js';
import { bloomVertex, brightPassFragment, blurFragment, compositeFragment } from './shaders.js';

// ── Bloom Post-Processing Setup ────────────────────────────────────────────
export function createBloom(gl) {
    // Composite post at full resolution
    const postComposite = new Post(gl);

    // Bloom post at half resolution (targetOnly = renders to texture, not canvas)
    const postBloom = new Post(gl, { dpr: BLOOM.BLOOM_DPR, targetOnly: true });

    // Resolution uniforms
    const resolution = { value: new Vec2() };
    const bloomResolution = { value: new Vec2() };

    // ── Bloom passes ──
    // 1. Bright pass: extract bright areas above threshold
    const brightPass = postBloom.addPass({
        vertex: bloomVertex,
        fragment: brightPassFragment,
        uniforms: {
            uThreshold: { value: BLOOM.THRESHOLD },
        },
    });

    // 2. Horizontal blur
    const horizontalPass = postBloom.addPass({
        vertex: bloomVertex,
        fragment: blurFragment,
        uniforms: {
            uResolution: bloomResolution,
            uDirection: { value: new Vec2(BLOOM.BLUR_RADIUS, 0) },
        },
    });

    // 3. Vertical blur
    const verticalPass = postBloom.addPass({
        vertex: bloomVertex,
        fragment: blurFragment,
        uniforms: {
            uResolution: bloomResolution,
            uDirection: { value: new Vec2(0, BLOOM.BLUR_RADIUS) },
        },
    });

    // Add extra blur iterations for smoother bloom
    for (let i = 0; i < 4; i++) {
        postBloom.passes.push(horizontalPass, verticalPass);
    }

    // ── Composite pass: combine original scene + bloom ──
    const compositePass = postComposite.addPass({
        vertex: bloomVertex,
        fragment: compositeFragment,
        uniforms: {
            uResolution: resolution,
            tBloom: postBloom.uniform,
            uBloomStrength: { value: BLOOM.STRENGTH },
        },
    });

    // ── Resize handler ──
    function resize(width, height) {
        postComposite.resize();
        postBloom.resize();
        resolution.value.set(width, height);
        bloomResolution.value.set(postBloom.resolutionWidth, postBloom.resolutionHeight);
    }

    // ── Render with bloom ──
    function render(scene, camera) {
        // Step 1: Render scene to composite FBO (disable composite pass)
        compositePass.enabled = false;
        postComposite.targetOnly = true;
        postComposite.render({ scene, camera });

        // Step 2: Render bloom passes using the scene texture
        postBloom.render({ texture: postComposite.uniform.value });

        // Step 3: Composite scene + bloom to canvas
        compositePass.enabled = true;
        postComposite.targetOnly = false;
        postComposite.render({ texture: postComposite.uniform.value });
    }

    return { postComposite, postBloom, resize, render };
}

// ── Camera Shake ───────────────────────────────────────────────────────────
export class CameraShake {
    constructor(camera) {
        this.camera = camera;
        this.basePosition = [...camera.position];
        this.intensity = 0;
        this.decay = CAMERA.SHAKE_DECAY;
    }

    // Trigger shake with given intensity
    shake(intensity) {
        this.intensity = Math.max(this.intensity, intensity);
    }

    // Update camera position with shake offset
    update(dt) {
        // Decay intensity
        this.intensity *= Math.exp(-this.decay * dt);
        if (this.intensity < 0.001) this.intensity = 0;

        // Apply random offset
        const ox = (Math.random() - 0.5) * this.intensity * 4;
        const oy = (Math.random() - 0.5) * this.intensity * 4;
        const oz = (Math.random() - 0.5) * this.intensity * 2;

        this.camera.position.x = this.basePosition[0] + ox;
        this.camera.position.y = this.basePosition[1] + oy;
        this.camera.position.z = this.basePosition[2] + oz;
    }

    reset() {
        this.intensity = 0;
        this.camera.position.set(...this.basePosition);
    }
}
