import { CAMERA, PLAYER } from '../constants.js'

const PITCH_LIMIT = Math.PI * 89 / 180
const VELOCITY_RESPONSE = 18
const CONTROL_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyC', 'KeyE', 'KeyM'])

export class PlayerController {
    constructor(gl, camera, canvas) {
        this.gl = gl
        this.camera = camera
        this.canvas = canvas

        this.playerPosition = [
            CAMERA.INITIAL_POSITION[0],
            0,
            CAMERA.INITIAL_POSITION[2],
        ]
        this.yaw = 0
        this.pitch = 0
        this.velocity = [0, 0, 0]
        this.keys = new Set()
        this.locked = document.pointerLockElement === this.canvas
        this.thirdPerson = false

        // Interaction callbacks (set by main.js)
        this.onInteract = null
        this.onToggleInfo = null

        this.onCanvasClick = () => this.requestPointerLock()
        this.onPointerLockChange = () => this.syncPointerLockState()
        this.onMouseMove = (event) => this.handleMouseMove(event)
        this.onKeyDown = (event) => this.handleKeyDown(event)
        this.onKeyUp = (event) => this.handleKeyUp(event)

        this.canvas.addEventListener('click', this.onCanvasClick)
        document.addEventListener('pointerlockchange', this.onPointerLockChange)
        document.addEventListener('mousemove', this.onMouseMove)
        window.addEventListener('keydown', this.onKeyDown)
        window.addEventListener('keyup', this.onKeyUp)

        this.syncCamera()
    }

    update(dt) {
        const forward = [-Math.sin(this.yaw), 0, -Math.cos(this.yaw)]
        const right = [Math.cos(this.yaw), 0, -Math.sin(this.yaw)]
        const input = [0, 0, 0]

        if (this.keys.has('KeyW')) {
            input[0] += forward[0]
            input[2] += forward[2]
        }
        if (this.keys.has('KeyS')) {
            input[0] -= forward[0]
            input[2] -= forward[2]
        }
        if (this.keys.has('KeyD')) {
            input[0] += right[0]
            input[2] += right[2]
        }
        if (this.keys.has('KeyA')) {
            input[0] -= right[0]
            input[2] -= right[2]
        }

        const length = Math.hypot(input[0], input[2])
        if (length > 0) {
            input[0] /= length
            input[2] /= length
        }

        const targetVelocity = [
            input[0] * PLAYER.MOVE_SPEED,
            0,
            input[2] * PLAYER.MOVE_SPEED,
        ]
        const blend = 1 - Math.exp(-VELOCITY_RESPONSE * dt)

        this.velocity[0] += (targetVelocity[0] - this.velocity[0]) * blend
        this.velocity[1] = 0
        this.velocity[2] += (targetVelocity[2] - this.velocity[2]) * blend

        this.playerPosition[0] += this.velocity[0] * dt
        this.playerPosition[1] = 0
        this.playerPosition[2] += this.velocity[2] * dt

        this.syncCamera()
    }

    get position() {
        return [
            this.playerPosition[0],
            this.thirdPerson ? 0 : PLAYER.EYE_HEIGHT,
            this.playerPosition[2],
        ]
    }

    // XZ position for proximity checks (ignores Y)
    get xzPosition() {
        return [this.playerPosition[0], this.playerPosition[2]]
    }

    get isLocked() {
        return this.locked
    }

    get isThirdPerson() {
        return this.thirdPerson
    }

    destroy() {
        this.canvas.removeEventListener('click', this.onCanvasClick)
        document.removeEventListener('pointerlockchange', this.onPointerLockChange)
        document.removeEventListener('mousemove', this.onMouseMove)
        window.removeEventListener('keydown', this.onKeyDown)
        window.removeEventListener('keyup', this.onKeyUp)

        this.keys.clear()
    }

    requestPointerLock() {
        if (document.pointerLockElement !== this.canvas) {
            this.canvas.requestPointerLock()
        }
    }

    syncPointerLockState() {
        this.locked = document.pointerLockElement === this.canvas
        if (this.locked) {
            this.canvas.classList.add('locked')
        } else {
            this.canvas.classList.remove('locked')
        }
    }

    handleMouseMove(event) {
        if (!this.locked) return

        this.yaw -= event.movementX * PLAYER.MOUSE_SENSITIVITY
        this.pitch -= event.movementY * PLAYER.MOUSE_SENSITIVITY
        this.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, this.pitch))
        this.syncCamera()
    }

    handleKeyDown(event) {
        if (CONTROL_KEYS.has(event.code)) event.preventDefault()

        if (event.code === 'KeyC' && !event.repeat) {
            this.thirdPerson = !this.thirdPerson
            this.syncCamera()
            return
        }

        if (event.code === 'KeyE' && !event.repeat) {
            if (this.onInteract) this.onInteract()
            return
        }

        if (event.code === 'KeyM' && !event.repeat) {
            if (this.onToggleInfo) this.onToggleInfo()
            return
        }

        if (this.isMoveKey(event.code)) {
            this.keys.add(event.code)
        }
    }

    handleKeyUp(event) {
        if (CONTROL_KEYS.has(event.code)) event.preventDefault()

        if (this.isMoveKey(event.code)) {
            this.keys.delete(event.code)
        }
    }

    isMoveKey(code) {
        return code === 'KeyW' || code === 'KeyA' || code === 'KeyS' || code === 'KeyD'
    }

    syncCamera() {
        if (this.thirdPerson) {
            this.syncThirdPersonCamera()
        } else {
            this.syncFirstPersonCamera()
        }
    }

    syncFirstPersonCamera() {
        this.camera.position.set(
            this.playerPosition[0],
            PLAYER.EYE_HEIGHT,
            this.playerPosition[2]
        )
        this.camera.rotation.x = this.pitch
        this.camera.rotation.y = this.yaw
        this.camera.rotation.z = 0
    }

    syncThirdPersonCamera() {
        const behind = [Math.sin(this.yaw), 0, Math.cos(this.yaw)]
        const lookTarget = [
            this.playerPosition[0],
            PLAYER.EYE_HEIGHT,
            this.playerPosition[2],
        ]

        this.camera.position.set(
            this.playerPosition[0] + behind[0] * PLAYER.THIRD_PERSON_DISTANCE,
            PLAYER.THIRD_PERSON_HEIGHT,
            this.playerPosition[2] + behind[2] * PLAYER.THIRD_PERSON_DISTANCE
        )
        this.camera.lookAt(lookTarget)
    }
}
