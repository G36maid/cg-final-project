import { Texture } from '../../../ogl/src/index.js';
import { MAX_LIGHTS } from '../shaders/phong.js';
import { POINT_LIGHTS, COLORS } from '../constants.js';

export function createLightingUniforms() {
    const positions = [];
    const colors = [];
    const intensities = [];

    const count = Math.min(POINT_LIGHTS.length, MAX_LIGHTS);
    for (let i = 0; i < count; i++) {
        const light = POINT_LIGHTS[i];
        positions.push(...light.pos);
        colors.push(...light.color);
        intensities.push(light.intensity);
    }

    return {
        uLightPos: { value: positions },
        uLightColor: { value: colors },
        uLightIntensity: { value: intensities },
        uNumLights: { value: count },
        uSunDir: { value: COLORS.SUN_DIR },
        uSunColor: { value: COLORS.SUN_COLOR },
        uSunIntensity: { value: COLORS.SUN_INTENSITY },
    };
}

export function createDefaultTexture(gl) {
    const tex = new Texture(gl);
    tex.image = new Uint8Array([255, 255, 255, 255]);
    tex.width = 1;
    tex.height = 1;
    tex.needsUpdate = true;
    return tex;
}
