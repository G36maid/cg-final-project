import { Orbit, Vec3 } from '../../ogl/src/index.js';

const BOARD_CENTER = new Vec3(5, 10, 5);

const VIEW_PRESETS = {
    default: { position: new Vec3(20, 18, 20), target: BOARD_CENTER },
    front: { position: new Vec3(5, 10, 28), target: BOARD_CENTER },
    right: { position: new Vec3(28, 10, 5), target: BOARD_CENTER },
    back: { position: new Vec3(5, 10, -18), target: BOARD_CENTER },
    top: { position: new Vec3(5, 32, 5), target: BOARD_CENTER },
};

export class CameraController {
    constructor(camera, options = {}) {
        this.camera = camera;
        this.orbit = new Orbit(camera, {
            target: BOARD_CENTER.clone(),
            enableRotate: true,
            enableZoom: true,
            enablePan: false,
            rotateSpeed: 0.5,
            zoomSpeed: 1.0,
            minDistance: 15,
            maxDistance: 60,
            minPolarAngle: 0.1,
            maxPolarAngle: Math.PI * 0.49,
            ...options,
        });

        this.enabled = true;
        this._currentView = 'default';
    }

    update() {
        if (this.enabled) this.orbit.update();
    }

    setView(name) {
        const preset = VIEW_PRESETS[name];
        if (!preset) return;

        this.camera.position.copy(preset.position);
        this.orbit.target.copy(preset.target);
        this.orbit.forcePosition();
        this._currentView = name;
    }

    tweenToView(name, createTween) {
        const preset = VIEW_PRESETS[name];
        if (!preset || typeof createTween !== 'function') return null;

        const startPos = this.camera.position.clone();
        const targetPos = preset.position.clone();
        return createTween({
            duration: 300,
            ease: (t) => 1 - Math.pow(1 - t, 3),
            onUpdate: (t) => {
                this.camera.position.copy(startPos).lerp(targetPos, t);
                this.orbit.target.copy(BOARD_CENTER);
            },
            onComplete: () => {
                this.camera.position.copy(targetPos);
                this.orbit.target.copy(preset.target);
                this.orbit.forcePosition();
                this._currentView = name;
            },
        });
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        this.orbit.enabled = enabled;
    }

    remove() {
        this.orbit.remove();
    }

    get currentView() {
        return this._currentView;
    }
}
