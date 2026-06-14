import { Plane, Mesh, Program, Texture } from '../../../ogl/src/index.js'
import { phongVertex, phongFragment } from '../shaders/phong.js'
import { createLightingUniforms } from '../hub/lighting.js'
import { MATERIAL, WORLD } from '../constants.js'

function colorToRgb(color, multiplier = 255) {
    return color.map((channel) => Math.max(0, Math.min(255, Math.round(channel * multiplier))))
}

function fillStoneNoise(ctx, size, baseColor) {
    const image = ctx.createImageData(size, size)
    const data = image.data
    const [r, g, b] = colorToRgb(baseColor, 185)

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const i = (y * size + x) * 4
            const grain = Math.random() * 24 - 12
            const mottling = Math.sin(x * 0.13) * 4 + Math.cos(y * 0.17) * 4

            data[i] = Math.max(0, Math.min(255, r + grain + mottling))
            data[i + 1] = Math.max(0, Math.min(255, g + grain + mottling))
            data[i + 2] = Math.max(0, Math.min(255, b + grain + mottling))
            data[i + 3] = 255
        }
    }

    ctx.putImageData(image, 0, 0)
}

function drawTileLines(ctx, size) {
    const tile = 32

    ctx.strokeStyle = 'rgba(10, 8, 12, 0.72)'
    ctx.lineWidth = 2

    for (let i = 0; i <= size; i += tile) {
        ctx.beginPath()
        ctx.moveTo(i + 0.5, 0)
        ctx.lineTo(i + 0.5, size)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(0, i + 0.5)
        ctx.lineTo(size, i + 0.5)
        ctx.stroke()
    }

    ctx.strokeStyle = 'rgba(105, 90, 95, 0.22)'
    ctx.lineWidth = 1
    for (let i = tile; i < size; i += tile * 2) {
        ctx.beginPath()
        ctx.moveTo(i + 4, 0)
        ctx.lineTo(i - 8, size)
        ctx.stroke()
    }
}

function drawCracks(ctx, size) {
    ctx.strokeStyle = 'rgba(18, 14, 16, 0.55)'
    ctx.lineWidth = 1

    for (let i = 0; i < 18; i++) {
        let x = Math.random() * size
        let y = Math.random() * size

        ctx.beginPath()
        ctx.moveTo(x, y)
        for (let j = 0; j < 4; j++) {
            x += Math.random() * 24 - 12
            y += Math.random() * 24 - 12
            ctx.lineTo(x, y)
        }
        ctx.stroke()
    }
}

function createGroundTexture(gl) {
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size

    const ctx = canvas.getContext('2d')
    fillStoneNoise(ctx, size, MATERIAL.GROUND.diffuse)
    drawTileLines(ctx, size)
    drawCracks(ctx, size)

    return new Texture(gl, {
        image: canvas,
        flipY: false,
        generateMipmaps: true,
        wrapS: gl.REPEAT,
        wrapT: gl.REPEAT,
    })
}

export function createGround(gl) {
    const material = MATERIAL.GROUND
    const texture = createGroundTexture(gl)
    const geometry = new Plane(gl, {
        width: WORLD.GROUND_SIZE,
        height: WORLD.GROUND_SIZE,
        widthSegments: 8,
        heightSegments: 8,
    })

    const uvData = geometry.attributes.uv.data
    const tileRepeats = WORLD.GROUND_SIZE / 6
    for (let i = 0; i < uvData.length; i++) {
        uvData[i] *= tileRepeats
    }
    geometry.attributes.uv.needsUpdate = true

    const program = new Program(gl, {
        vertex: phongVertex,
        fragment: phongFragment,
        uniforms: {
            ...createLightingUniforms(),
            uAmbient: { value: material.ambient },
            uDiffuse: { value: material.diffuse },
            uSpecular: { value: material.specular },
            uShininess: { value: material.shininess },
            uUseMap: { value: 1 },
            uMap: { value: texture },
        },
    })

    const mesh = new Mesh(gl, { geometry, program })
    mesh.name = 'ground'
    mesh.rotation.x = -Math.PI / 2

    return mesh
}
