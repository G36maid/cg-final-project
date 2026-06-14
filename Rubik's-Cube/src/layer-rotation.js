import { Transform, Vec3, Quat } from '../../ogl/src/index.js';

const AXIS_VECTORS = [new Vec3(1, 0, 0), new Vec3(0, 1, 0), new Vec3(0, 0, 1)];
const QUARTER_TURN = Math.PI / 2;

export class LayerRotator {
    constructor(scene, cubeState, cubeRenderer) {
        this.scene = scene;
        this.cubeState = cubeState;
        this.cubeRenderer = cubeRenderer;

        this.mode = 'idle';
        this.pivot = null;
        this.layerCubies = [];
        this.axis = null;
        this.layer = null;
        this.currentAngle = 0;

        this.animFromAngle = 0;
        this.animToAngle = 0;
        this.animStartTime = 0;
        this.animDuration = 0;
        this.onAnimComplete = null;

        this._identityQuaternion = new Quat();
    }

    beginDrag(axis, layer) {
        if (this.pivot) this._cleanupPivotOnly();

        this.axis = axis;
        this.layer = layer;
        this.currentAngle = 0;
        this.layerCubies = this._getLayerCubieIndices(axis, layer);

        this.pivot = new Transform();
        this.pivot.quaternion.copy(this._identityQuaternion);
        this.pivot.setParent(this.scene);
        this.pivot.updateMatrixWorld(true);

        for (const idx of this.layerCubies) {
            const group = this.cubeRenderer.getCubieGroup(idx);
            group.updateMatrixWorld(true);
            group.setParent(this.pivot);
        }

        this.mode = 'dragging';
    }

    updateDragAngle(angle) {
        if (!this.pivot || this.axis === null) return;

        this.currentAngle = angle;
        this.pivot.quaternion.fromAxisAngle(AXIS_VECTORS[this.axis], angle);
        this.pivot.updateMatrixWorld(true);
    }

    getCurrentAngle() {
        return this.currentAngle;
    }

    commitDrag(turns) {
        return new Promise((resolve) => {
            if (!this.pivot) {
                resolve(0);
                return;
            }

            this.mode = 'snapping';
            this.animFromAngle = this.currentAngle;
            this.animToAngle = turns * QUARTER_TURN;
            this.animStartTime = performance.now();
            this.animDuration = 180;
            this.onAnimComplete = resolve;

            if (this.animDuration <= 0) this._completeAnimation();
        });
    }

    animateMove(axis, layer, turns, duration = 120) {
        return new Promise((resolve) => {
            this.beginDrag(axis, layer);
            this.mode = 'animating';
            this.animFromAngle = 0;
            this.animToAngle = turns * QUARTER_TURN;
            this.animStartTime = performance.now();
            this.animDuration = Math.max(0, duration);
            this.onAnimComplete = resolve;

            this.updateDragAngle(0);
            this.mode = 'animating';

            if (this.animDuration <= 0) {
                this.updateDragAngle(this.animToAngle);
                this.mode = 'animating';
                this._completeAnimation();
            }
        });
    }

    update(dt) {
        if (this.mode !== 'snapping' && this.mode !== 'animating') return;
        if (!this.pivot || this.axis === null) return;

        const elapsed = performance.now() - this.animStartTime;
        const t = this.animDuration <= 0 ? 1 : Math.min(elapsed / this.animDuration, 1);

        let eased;
        if (this.mode === 'snapping') {
            const c1 = 1.70158;
            const c3 = c1 + 1;
            eased = 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
        } else {
            eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        }

        const angle = this.animFromAngle + (this.animToAngle - this.animFromAngle) * eased;
        this.currentAngle = angle;
        this.pivot.quaternion.fromAxisAngle(AXIS_VECTORS[this.axis], angle);
        this.pivot.updateMatrixWorld(true);

        if (t >= 1) this._completeAnimation();
    }

    _completeAnimation() {
        const turns = Math.round(this.animToAngle / QUARTER_TURN);

        if (turns !== 0 && this.axis !== null && [-1, 0, 1].includes(this.layer)) {
            this.cubeState.rotateLayer(this.axis, this.layer, turns);
        }

        try {
            if (this.pivot) this.pivot.updateMatrixWorld(true);

            for (const idx of this.layerCubies) {
                const group = this.cubeRenderer.getCubieGroup(idx);
                if (!group) continue;
                group.updateMatrixWorld(true);
                group.matrix.copy(group.worldMatrix);
                group.decompose();
                group.setParent(this.scene);
            }
        } catch (e) {
            // continue cleanup even if transform baking fails
        }

        this._cleanupPivotOnly();
        this.cubeRenderer.updateFromState(this.cubeState);

        this.mode = 'idle';
        this.currentAngle = 0;
        this.layerCubies = [];
        this.axis = null;
        this.layer = null;
        this.animFromAngle = 0;
        this.animToAngle = 0;
        this.animStartTime = 0;
        this.animDuration = 0;

        if (this.onAnimComplete) {
            const callback = this.onAnimComplete;
            this.onAnimComplete = null;
            callback(turns);
        }
    }

    _getLayerCubieIndices(axis, layer) {
        return this.cubeState
            .getLayer(axis, layer)
            .map((cubie) => (typeof cubie === 'number' ? cubie : this.cubeState.cubies.indexOf(cubie)))
            .filter((idx) => idx >= 0);
    }

    _cleanupPivotOnly() {
        if (!this.pivot) return;
        this.scene.removeChild(this.pivot);
        this.pivot = null;
    }
}
