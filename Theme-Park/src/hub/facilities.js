import { Transform, Box, Mesh, Program, Texture } from '../../../ogl/src/index.js'
import { phongVertex, phongFragment } from '../shaders/phong.js'
import { createLightingUniforms } from './lighting.js'
import { FACILITIES, MATERIAL, COLORS } from '../constants.js'

const FACILITY_CONFIGS = [
    {
        key: 'ARCADE_HALL',
        texture: createArcadeTexture,
        material: {
            ambient: [0.14, 0.10, 0.18],
            diffuse: [0.42, 0.35, 0.48],
            specular: [0.55, 0.45, 0.70],
            shininess: 48,
        },
    },
    {
        key: 'COASTER_STATION',
        texture: createCoasterTexture,
        material: MATERIAL.METAL,
    },
    {
        key: 'TOUR_TRAIN',
        texture: createTrainTexture,
        material: {
            ambient: [0.22, 0.14, 0.08],
            diffuse: [0.58, 0.36, 0.18],
            specular: [0.20, 0.14, 0.08],
            shininess: 18,
        },
    },
]

function rgb(color, multiplier = 255) {
    const [r, g, b] = color.map((channel) => Math.max(0, Math.min(255, Math.round(channel * multiplier))))
    return `rgb(${r}, ${g}, ${b})`
}

function createCanvas(size = 256) {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    return canvas
}

function addNoise(ctx, size, opacity = 0.12) {
    const image = ctx.getImageData(0, 0, size, size)
    const data = image.data

    for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * 36 - 18
        data[i] = Math.max(0, Math.min(255, data[i] + noise))
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise))
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise))
        data[i + 3] = Math.round(255 * opacity + data[i + 3] * (1 - opacity))
    }

    ctx.putImageData(image, 0, 0)
}

function createTexture(gl, canvas) {
    return new Texture(gl, {
        image: canvas,
        flipY: false,
        generateMipmaps: true,
    })
}

function createProgram(gl, material, texture) {
    return new Program(gl, {
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
}

function createArcadeTexture(gl) {
    const size = 256
    const canvas = createCanvas(size)
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = '#171021'
    ctx.fillRect(0, 0, size, size)
    addNoise(ctx, size)

    ctx.fillStyle = rgb(COLORS.NEON_PINK)
    ctx.fillRect(0, 38, size, 8)
    ctx.fillStyle = rgb(COLORS.NEON_CYAN)
    ctx.fillRect(0, 68, size, 5)
    ctx.fillStyle = rgb(COLORS.NEON_PURPLE)
    for (let x = 18; x < size; x += 52) {
        ctx.fillRect(x, 102, 18, 52)
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)'
    ctx.lineWidth = 2
    for (let y = 0; y <= size; y += 64) {
        ctx.beginPath()
        ctx.moveTo(0, y + 0.5)
        ctx.lineTo(size, y + 0.5)
        ctx.stroke()
    }

    return createTexture(gl, canvas)
}

function createCoasterTexture(gl) {
    const size = 256
    const canvas = createCanvas(size)
    const ctx = canvas.getContext('2d')
    const gradient = ctx.createLinearGradient(0, 0, size, size)

    gradient.addColorStop(0, '#2b2a31')
    gradient.addColorStop(0.5, '#595765')
    gradient.addColorStop(1, '#222027')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
    addNoise(ctx, size, 0.08)

    ctx.strokeStyle = 'rgba(15, 14, 18, 0.75)'
    ctx.lineWidth = 3
    for (let x = 0; x <= size; x += 64) {
        ctx.beginPath()
        ctx.moveTo(x + 0.5, 0)
        ctx.lineTo(x + 0.5, size)
        ctx.stroke()
    }
    for (let y = 0; y <= size; y += 48) {
        ctx.beginPath()
        ctx.moveTo(0, y + 0.5)
        ctx.lineTo(size, y + 0.5)
        ctx.stroke()
    }

    ctx.fillStyle = 'rgba(255, 150, 70, 0.75)'
    for (let x = 18; x < size; x += 64) {
        ctx.fillRect(x, 18, 8, 8)
        ctx.fillRect(x + 32, 130, 8, 8)
    }

    return createTexture(gl, canvas)
}

function createTrainTexture(gl) {
    const size = 256
    const canvas = createCanvas(size)
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = '#5a3219'
    ctx.fillRect(0, 0, size, size)
    addNoise(ctx, size, 0.10)

    for (let y = 0; y < size; y += 32) {
        ctx.fillStyle = y % 64 === 0 ? '#70411f' : '#4b2814'
        ctx.fillRect(0, y, size, 28)
        ctx.strokeStyle = 'rgba(30, 14, 6, 0.85)'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(0, y + 30.5)
        ctx.lineTo(size, y + 30.5)
        ctx.stroke()
    }

    ctx.strokeStyle = 'rgba(230, 160, 85, 0.18)'
    ctx.lineWidth = 1
    for (let y = 12; y < size; y += 32) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.bezierCurveTo(72, y - 12, 138, y + 12, size, y - 4)
        ctx.stroke()
    }

    return createTexture(gl, canvas)
}

function createSignTexture(gl) {
    const size = 256
    const canvas = createCanvas(size)
    const ctx = canvas.getContext('2d')
    const gradient = ctx.createLinearGradient(0, 0, 0, size)

    gradient.addColorStop(0, '#1a1230')
    gradient.addColorStop(1, '#09070d')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)

    ctx.strokeStyle = rgb(COLORS.NEON_CYAN)
    ctx.lineWidth = 10
    ctx.strokeRect(14, 18, size - 28, size - 36)

    ctx.fillStyle = rgb(COLORS.NEON_PINK)
    ctx.font = 'bold 34px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('DUSK', size / 2, 96)

    ctx.fillStyle = '#ffd68a'
    ctx.font = 'bold 32px sans-serif'
    ctx.fillText('PARK', size / 2, 142)

    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)'
    ctx.font = '18px sans-serif'
    ctx.fillText('Tokens • Rides • Games', size / 2, 184)

    return createTexture(gl, canvas)
}

function createBuilding(gl, group, facility, material, textureFactory) {
    const [width, height, depth] = facility.size
    const geometry = new Box(gl, { width, height, depth })
    const texture = textureFactory(gl)
    const program = createProgram(gl, material, texture)
    const mesh = new Mesh(gl, { geometry, program })

    mesh.name = facility.label
    mesh.position.set(facility.pos[0], facility.pos[1] + height / 2, facility.pos[2])
    mesh.setParent(group)

    return mesh
}

function createInfoBoard(gl, group) {
    const facility = FACILITIES.INFO_BOARD
    const [width, height, depth] = facility.size
    const geometry = new Box(gl, { width, height, depth })
    const texture = createSignTexture(gl)
    const program = createProgram(gl, MATERIAL.BUILDING, texture)
    const mesh = new Mesh(gl, { geometry, program })

    mesh.name = 'info-board'
    mesh.position.set(facility.pos[0], facility.pos[1] + height / 2, facility.pos[2])
    mesh.setParent(group)

    return mesh
}

function createTrigger(key) {
    const facility = FACILITIES[key]
    return {
        facility: facility.label,
        center: facility.pos,
        radius: Math.max(facility.trigger.x, facility.trigger.z),
    }
}

export function createFacilities(gl) {
    const group = new Transform()
    const triggers = []

    for (const config of FACILITY_CONFIGS) {
        const facility = FACILITIES[config.key]
        createBuilding(gl, group, facility, config.material, config.texture)
        triggers.push(createTrigger(config.key))
    }

    createInfoBoard(gl, group)

    return { group, triggers }
}
