import { Camera, Shadow } from '../../../ogl/src/index.js'
import { COLORS } from '../constants.js'

export function createShadow(gl) {
    // Orthographic camera matching the directional sun light
    const sunDir = COLORS.SUN_DIR
    const light = new Camera(gl, {
        left: -30,
        right: 30,
        bottom: -30,
        top: 30,
        near: 0.5,
        far: 80,
    })
    // Position the light camera high up in the sun direction
    const sunDist = 40
    light.position.set(
        -sunDir[0] * sunDist,
        -sunDir[1] * sunDist,
        -sunDir[2] * sunDist,
    )
    light.lookAt([0, 0, 0])

    const shadow = new Shadow(gl, {
        light,
        width: 2048,
        height: 2048,
    })

    return { shadow, light }
}