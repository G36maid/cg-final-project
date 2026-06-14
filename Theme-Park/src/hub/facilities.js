import { Transform, Box, Cylinder, Sphere, Mesh, Program, Texture } from '../../../ogl/src/index.js'
import { phongVertex, phongFragment } from '../shaders/phong.js'
import { createLightingUniforms } from './lighting.js'
import { FACILITIES, MATERIAL, COLORS } from '../constants.js'

const FACILITY_CONFIGS = [
    {
        key: 'ARCADE_HALL',
        texture: createArcadeTexture,
        title: 'ARCADE HALL',
        trimColor: COLORS.NEON_PINK,
        doorColor: [0.06, 0.03, 0.10],
        windowColor: COLORS.NEON_CYAN,
        signColors: { border: COLORS.NEON_CYAN, title: COLORS.NEON_PINK },
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
        title: 'COASTER',
        trimColor: [1.0, 0.55, 0.25],
        doorColor: [0.12, 0.11, 0.14],
        windowColor: [1.0, 0.75, 0.36],
        signColors: { border: [1.0, 0.55, 0.25], title: [1.0, 0.75, 0.36] },
        material: MATERIAL.METAL,
    },
    {
        key: 'TOUR_TRAIN',
        texture: createTrainTexture,
        title: 'TOUR TRAIN',
        trimColor: [1.0, 0.75, 0.36],
        doorColor: [0.20, 0.10, 0.04],
        windowColor: COLORS.NEON_PURPLE,
        signColors: { border: COLORS.NEON_PURPLE, title: [1.0, 0.75, 0.36] },
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

function createTexture(gl, canvas, flipY = false) {
    return new Texture(gl, {
        image: canvas,
        flipY,
        generateMipmaps: true,
    })
}

function createSolidTexture(gl, color) {
    const canvas = createCanvas(4)
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = rgb(color)
    ctx.fillRect(0, 0, 4, 4)
    return createTexture(gl, canvas, true)
}

function createLabelTexture(gl, title, subtitle, colors) {
    const size = 256
    const canvas = createCanvas(size)
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = '#100915'
    ctx.fillRect(0, 0, size, size)
    ctx.strokeStyle = rgb(colors.border)
    ctx.lineWidth = 9
    ctx.strokeRect(12, 18, size - 24, size - 36)

    ctx.fillStyle = rgb(colors.title)
    ctx.font = 'bold 30px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(title, size / 2, 96)

    ctx.fillStyle = '#ffd68a'
    ctx.font = 'bold 20px sans-serif'
    ctx.fillText(subtitle, size / 2, 142)

    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)'
    ctx.font = '16px sans-serif'
    ctx.fillText('Press E near entrance', size / 2, 182)

    return createTexture(gl, canvas, true)
}

function createSolidProgram(gl, material, color) {
    return createProgram(gl, material, createSolidTexture(gl, color))
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

    return createTexture(gl, canvas, true)
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

    return createTexture(gl, canvas, true)
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

function createBuildingDetails(gl, group, facility, config) {
    const [width, height, depth] = facility.size
    const [x, y, z] = facility.pos
    const frontZ = z + depth / 2 + 0.04
    const trimProgram = createSolidProgram(gl, MATERIAL.METAL, config.trimColor)
    const doorProgram = createSolidProgram(gl, MATERIAL.METAL, config.doorColor)
    const signProgram = createProgram(gl, MATERIAL.BUILDING, createLabelTexture(gl, config.title, facility.labelZh, config.signColors))

    const doorWidth = Math.min(width * 0.34, 3.8)
    createBoxMesh(gl, group, [doorWidth, height * 0.48, 0.18], [x, y + height * 0.24, frontZ], doorProgram)
    createBoxMesh(gl, group, [doorWidth + 0.35, 0.16, 0.22], [x, y + height * 0.50, frontZ + 0.02], trimProgram)
    createBoxMesh(gl, group, [0.16, height * 0.50, 0.22], [x - doorWidth / 2 - 0.08, y + height * 0.25, frontZ + 0.02], trimProgram)
    createBoxMesh(gl, group, [0.16, height * 0.50, 0.22], [x + doorWidth / 2 + 0.08, y + height * 0.25, frontZ + 0.02], trimProgram)
    createBoxMesh(gl, group, [width * 0.58, height * 0.18, 0.16], [x, y + height * 0.76, frontZ + 0.03], signProgram)

    const windowProgram = createSolidProgram(gl, MATERIAL.METAL, config.windowColor)
    const windowY = y + height * 0.54
    const windowOffset = width * 0.31
    createBoxMesh(gl, group, [1.45, 1.25, 0.14], [x - windowOffset, windowY, frontZ + 0.01], windowProgram)
    createBoxMesh(gl, group, [1.45, 1.25, 0.14], [x + windowOffset, windowY, frontZ + 0.01], windowProgram)
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

function createFacilityCollider(facility, padding = 0.35) {
    return {
        center: [facility.pos[0], facility.pos[2]],
        halfSize: [facility.size[0] / 2 + padding, facility.size[2] / 2 + padding],
    }
}

function pushCollider(colliders, center, halfSize) {
    colliders.push({ center, halfSize })
}

function createBoxMesh(gl, group, size, position, program, rotationY = 0) {
    const geometry = new Box(gl, { width: size[0], height: size[1], depth: size[2] })
    const mesh = new Mesh(gl, { geometry, program })
    mesh.position.set(position[0], position[1], position[2])
    mesh.rotation.y = rotationY
    mesh.setParent(group)
    return mesh
}

function createCylinderMesh(gl, group, config, position, program) {
    const geometry = new Cylinder(gl, config)
    const mesh = new Mesh(gl, { geometry, program })
    mesh.position.set(position[0], position[1], position[2])
    mesh.setParent(group)
    return mesh
}

function createSphereMesh(gl, group, radius, position, program) {
    const geometry = new Sphere(gl, { radius, widthSegments: 18, heightSegments: 10 })
    const mesh = new Mesh(gl, { geometry, program })
    mesh.position.set(position[0], position[1], position[2])
    mesh.setParent(group)
    return mesh
}

function createLamp(gl, group, colliders, x, z) {
    const metal = createSolidProgram(gl, MATERIAL.METAL, [0.22, 0.20, 0.24])
    const glow = createSolidProgram(gl, MATERIAL.METAL, [1.0, 0.75, 0.36])
    createCylinderMesh(gl, group, { radiusTop: 0.10, radiusBottom: 0.14, height: 4.2, radialSegments: 16 }, [x, 2.1, z], metal)
    createSphereMesh(gl, group, 0.42, [x, 4.45, z], glow)
    createCylinderMesh(gl, group, { radiusTop: 0.34, radiusBottom: 0.52, height: 0.32, radialSegments: 20 }, [x, 0.16, z], metal)
    pushCollider(colliders, [x, z], [0.55, 0.55])
}

function createBench(gl, group, colliders, x, z, rotationY) {
    const wood = createSolidProgram(gl, MATERIAL.BUILDING, [0.52, 0.26, 0.13])
    const metal = createSolidProgram(gl, MATERIAL.METAL, [0.16, 0.15, 0.18])
    createBoxMesh(gl, group, [2.8, 0.22, 0.55], [x, 0.72, z], wood, rotationY)
    createBoxMesh(gl, group, [2.8, 0.22, 0.42], [x, 1.28, z - Math.cos(rotationY) * 0.38], wood, rotationY)
    createBoxMesh(gl, group, [0.16, 0.62, 0.16], [x - Math.cos(rotationY) * 1.05, 0.34, z + Math.sin(rotationY) * 1.05], metal, rotationY)
    createBoxMesh(gl, group, [0.16, 0.62, 0.16], [x + Math.cos(rotationY) * 1.05, 0.34, z - Math.sin(rotationY) * 1.05], metal, rotationY)
    pushCollider(colliders, [x, z], [1.55, 0.55])
}

function createPlanter(gl, group, colliders, x, z) {
    const stone = createSolidProgram(gl, MATERIAL.GROUND, [0.34, 0.28, 0.24])
    const leaf = createSolidProgram(gl, MATERIAL.BUILDING, [0.18, 0.46, 0.25])
    createCylinderMesh(gl, group, { radiusTop: 0.75, radiusBottom: 0.62, height: 0.65, radialSegments: 28 }, [x, 0.32, z], stone)
    createSphereMesh(gl, group, 0.55, [x, 0.88, z], leaf)
    createSphereMesh(gl, group, 0.34, [x + 0.36, 0.95, z - 0.12], leaf)
    createSphereMesh(gl, group, 0.30, [x - 0.28, 1.02, z + 0.24], leaf)
    pushCollider(colliders, [x, z], [0.85, 0.85])
}

function createBanner(gl, group, colliders, x, z, rotationY, color) {
    const pole = createSolidProgram(gl, MATERIAL.METAL, [0.18, 0.17, 0.20])
    const cloth = createSolidProgram(gl, MATERIAL.BUILDING, color)
    createCylinderMesh(gl, group, { radiusTop: 0.07, radiusBottom: 0.08, height: 3.2, radialSegments: 12 }, [x, 1.6, z], pole)
    createBoxMesh(gl, group, [1.2, 1.4, 0.08], [x + Math.sin(rotationY) * 0.45, 2.45, z + Math.cos(rotationY) * 0.45], cloth, rotationY)
    pushCollider(colliders, [x, z], [0.35, 0.35])
}

function createDecorations(gl, group, colliders) {
    const lamps = [[-8, -8], [8, -8], [-8, 8], [8, 8], [-20, 4], [20, 4]]
    for (const [x, z] of lamps) createLamp(gl, group, colliders, x, z)

    const benches = [[-6, 5.8, 0], [6, 5.8, 0], [-6, -5.8, Math.PI], [6, -5.8, Math.PI]]
    for (const [x, z, rotation] of benches) createBench(gl, group, colliders, x, z, rotation)

    const planters = [[-11, 0], [11, 0], [0, 11], [0, -11], [-14, 14], [14, 14]]
    for (const [x, z] of planters) createPlanter(gl, group, colliders, x, z)

    createBanner(gl, group, colliders, -15, 9, Math.PI * 0.1, COLORS.NEON_PINK)
    createBanner(gl, group, colliders, 15, 9, -Math.PI * 0.1, COLORS.NEON_CYAN)
    createBanner(gl, group, colliders, -15, -18, Math.PI * 0.1, COLORS.NEON_PURPLE)
    createBanner(gl, group, colliders, 15, -18, -Math.PI * 0.1, [1.0, 0.55, 0.25])
}

function createTrigger(key) {
    const facility = FACILITIES[key]
    const [, , depth] = facility.size
    const doorZ = facility.pos[2] + depth / 2 + 1.6

    return {
        facility: facility.label,
        center: [facility.pos[0], facility.pos[1], doorZ],
        radius: Math.min(facility.trigger.x, facility.trigger.z) * 0.45,
    }
}

export function createFacilities(gl) {
    const group = new Transform()
    const triggers = []
    const colliders = []

    for (const config of FACILITY_CONFIGS) {
        const facility = FACILITIES[config.key]
        createBuilding(gl, group, facility, config.material, config.texture)
        createBuildingDetails(gl, group, facility, config)
        triggers.push(createTrigger(config.key))
        colliders.push(createFacilityCollider(facility))
    }

    createInfoBoard(gl, group)
    colliders.push(createFacilityCollider(FACILITIES.INFO_BOARD, 0.25))
    createDecorations(gl, group, colliders)

    return { group, triggers, colliders }
}
