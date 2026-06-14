import { Mesh, Plane, Vec3, RenderTarget, Program } from '../../ogl/src/index.js';
import { TUNNEL_HALF_WIDTH, TRACK_DIVISIONS } from '../config.js';

export class WaterReflection {
    constructor(gl, trackPath) {
        this.gl = gl;

        this.fbo = new RenderTarget(gl, { width: 512, height: 256 });
        this.mesh = this._createWaterMesh(trackPath);
    }

    _createWaterMesh(trackPath) {
        const gl = this.gl;
        const geom = new Plane(gl, {
            width: TUNNEL_HALF_WIDTH * 2,
            height: 40,
        });

        const program = new Program(gl, {
            vertex: /* glsl */ `
                attribute vec3 position;
                attribute vec2 uv;

                uniform mat4 modelViewMatrix;
                uniform mat4 projectionMatrix;

                varying vec2 vUv;

                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragment: /* glsl */ `
                precision highp float;

                uniform sampler2D tReflect;
                uniform float uTime;
                uniform float uOpacity;

                varying vec2 vUv;

                void main() {
                    vec2 uv = vUv;
                    uv.x += sin(uv.y * 10.0 + uTime) * 0.01;
                    uv.y += cos(uv.x * 10.0 + uTime * 0.7) * 0.01;

                    vec3 reflColor = texture2D(tReflect, uv).rgb;
                    vec3 waterColor = vec3(0.02, 0.03, 0.04);

                    gl_FragColor.rgb = mix(waterColor, reflColor, 0.4);
                    gl_FragColor.a = uOpacity;
                }
            `,
            transparent: true,
            uniforms: {
                tReflect: { value: this.fbo.texture },
                uTime: { value: 0 },
                uOpacity: { value: 0.6 },
            },
        });

        const mesh = new Mesh(gl, { geometry: geom, program });

        const startFrame = trackPath.tunnelStartFrame;
        const endFrame = trackPath.tunnelEndFrame;
        const midFrame = Math.floor((startFrame + endFrame) / 2);
        const midT = midFrame / TRACK_DIVISIONS;
        const center = trackPath.getPointAt(midT, new Vec3());

        mesh.position.copy(center);
        mesh.position.y -= 0.5;
        mesh.rotation.x = -Math.PI / 2;

        return mesh;
    }

    update(time) {
        this.mesh.program.uniforms.uTime.value = time;
    }
}
