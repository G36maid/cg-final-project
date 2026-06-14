import { Post, Vec2 } from '../../../ogl/src/index.js';
import { brightPassFragment, blurFragment, compositeFragment, grayscaleFragment } from './shaders.js';

export class PostFX {
    constructor(gl) {
        this.gl = gl;

        this.postComposite = new Post(gl, {
            dpr: 1,
        });

        this.postBloom = new Post(gl, {
            dpr: 0.5,
            targetOnly: true,
        });

        this._resolution = { value: new Vec2() };
        this._bloomResolution = { value: new Vec2() };

        this._initPasses();
    }

    _initPasses() {
        this.brightPass = this.postBloom.addPass({
            fragment: brightPassFragment,
            uniforms: {
                uThreshold: { value: 0.6 },
            },
        });

        this.horizontalPass = this.postBloom.addPass({
            fragment: blurFragment,
            uniforms: {
                uResolution: this._bloomResolution,
                uDirection: { value: new Vec2(0.8, 0) },
            },
        });

        this.verticalPass = this.postBloom.addPass({
            fragment: blurFragment,
            uniforms: {
                uResolution: this._bloomResolution,
                uDirection: { value: new Vec2(0, 0.8) },
            },
        });

        for (let i = 0; i < 5; i++) {
            this.postBloom.passes.push(this.horizontalPass, this.verticalPass);
        }

        this.compositePass = this.postComposite.addPass({
            fragment: compositeFragment,
            uniforms: {
                tBloom: this.postBloom.uniform,
                uBloomStrength: { value: 0.4 },
            },
        });

        this.grayscalePass = this.postComposite.addPass({
            fragment: grayscaleFragment,
            uniforms: {
                uAmount: { value: 0 },
            },
        });
        this.grayscalePass.enabled = false;

        this._grayscaleAmount = 0;
        this._grayscaleActive = false;
    }

    render({ scene, camera }) {
        this.compositePass.enabled = false;
        this.grayscalePass.enabled = this._grayscaleActive;
        this.postComposite.targetOnly = true;
        this.postComposite.render({ scene, camera });

        this.postBloom.render({
            texture: this.postComposite.uniform.value,
        });

        this.compositePass.enabled = true;
        this.postComposite.targetOnly = false;
        this.postComposite.render({
            texture: this.postComposite.uniform.value,
        });
    }

    triggerGameOver(createTween) {
        this._grayscaleActive = true;
        this._grayscaleAmount = 0;

        if (typeof createTween === 'function') {
            return createTween({
                duration: 1500,
                ease: (t) => t * t,
                onUpdate: (t) => {
                    this._grayscaleAmount = t;
                    this.grayscalePass.uniforms.uAmount.value = t;
                },
            });
        }

        this._grayscaleAmount = 1;
        this.grayscalePass.uniforms.uAmount.value = 1;
    }

    reset() {
        this._grayscaleActive = false;
        this._grayscaleAmount = 0;
        this.grayscalePass.uniforms.uAmount.value = 0;
        this.grayscalePass.enabled = false;
    }

    resize(width, height) {
        this.postComposite.resize({ width, height });
        this.postBloom.resize({ width, height });

        this._resolution.value.set(
            this.postComposite.resolutionWidth,
            this.postComposite.resolutionHeight
        );
        this._bloomResolution.value.set(
            this.postBloom.resolutionWidth,
            this.postBloom.resolutionHeight
        );
    }
}
