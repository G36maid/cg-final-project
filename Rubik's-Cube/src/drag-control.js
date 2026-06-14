import { Vec2, Vec3, Raycast } from '../../ogl/src/index.js';

const DEAD_ZONE = 10;
const PX_PER_90 = 150;
const QUARTER_TURN = Math.PI / 2;
const AXIS_EPSILON = 0.0001;

export class DragControl {
    constructor(gl, camera, cubeRenderer, layerRotator, orbit, canvas) {
        this.gl = gl;
        this.camera = camera;
        this.cubeRenderer = cubeRenderer;
        this.layerRotator = layerRotator;
        this.orbit = orbit;
        this.canvas = canvas;

        this.enabled = true;
        this.state = 'idle';
        this.raycast = new Raycast();

        this.hitPoint = null;
        this.hitFaceNormal = null;
        this.hitCubieIndex = null;
        this.hitFace = null;

        this.pointerStart = { x: 0, y: 0 };
        this.dragScreenStart = { x: 0, y: 0 };
        this.dragScreenDir = { x: 0, y: 0 };

        this.dragAxis = null;
        this.dragLayer = null;
        this.dragSign = 1;

        this.onMoveCommitted = null;

        this.DEAD_ZONE = DEAD_ZONE;
        this.PX_PER_90 = PX_PER_90;
    }

    getMouseNdc(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = 1 - ((event.clientY - rect.top) / rect.height) * 2;

        return new Vec2(x, y);
    }

    resetDragState() {
        this.hitPoint = null;
        this.hitFaceNormal = null;
        this.hitCubieIndex = null;
        this.hitFace = null;
        this.pointerStart = { x: 0, y: 0 };
        this.dragScreenStart = { x: 0, y: 0 };
        this.dragScreenDir = { x: 0, y: 0 };
        this.dragAxis = null;
        this.dragLayer = null;
        this.dragSign = 1;
    }

    onPointerDown(event) {
        if (!this.enabled || this.layerRotator.mode !== 'idle') return;

        const ndc = this.getMouseNdc(event);
        this.raycast.castMouse(this.camera, [ndc.x, ndc.y]);

        const stickerMeshes = this.cubeRenderer.getStickerMeshes();
        const hits = this.raycast.intersectMeshes(stickerMeshes, {
            includeNormal: true,
            cullFace: true,
        });

        if (hits.length === 0) {
            this.state = 'idle';
            this.orbit.enabled = true;
            this.resetDragState();
            return;
        }

        const hitMesh = hits[0];

        this.orbit.enabled = false;
        this.state = 'pending';
        this.hitPoint = hitMesh.hit.point.clone();
        this.hitFaceNormal = hitMesh.hit.faceNormal.clone().normalize();
        this.hitCubieIndex = hitMesh.userData.cubieIndex;
        this.hitFace = hitMesh.userData.face;
        this.pointerStart = { x: event.clientX, y: event.clientY };
        this.dragScreenStart = { x: event.clientX, y: event.clientY };
        this.dragScreenDir = { x: 0, y: 0 };
    }

    onPointerMove(event) {
        if (!this.enabled || this.state === 'idle') return;

        const dx = event.clientX - this.pointerStart.x;
        const dy = event.clientY - this.pointerStart.y;
        const dragMag = Math.sqrt(dx * dx + dy * dy);

        if (this.state === 'pending') {
            if (dragMag < this.DEAD_ZONE) return;
            if (!this.detectDragDirection(event, dx, dy, dragMag)) return;
        }

        if (this.state !== 'dragging') return;

        const dragDx = event.clientX - this.dragScreenStart.x;
        const dragDy = event.clientY - this.dragScreenStart.y;
        const signedDist = dragDx * this.dragScreenDir.x + dragDy * this.dragScreenDir.y;
        const angle = (signedDist / this.PX_PER_90) * QUARTER_TURN * this.dragSign;

        this.layerRotator.updateDragAngle(angle);
    }

    detectDragDirection(event, dx, dy, dragMag) {
        const ndc = this.getMouseNdc(event);
        this.raycast.castMouse(this.camera, [ndc.x, ndc.y]);

        const currentPoint = this.raycast.intersectPlane({
            origin: this.hitPoint,
            normal: this.hitFaceNormal,
        });

        if (!currentPoint) return false;

        const worldDrag = new Vec3().sub(currentPoint, this.hitPoint);
        if (worldDrag.len() < AXIS_EPSILON) return false;

        const rotationAxisVec = new Vec3().cross(this.hitFaceNormal, worldDrag).normalize();
        const absX = Math.abs(rotationAxisVec.x);
        const absY = Math.abs(rotationAxisVec.y);
        const absZ = Math.abs(rotationAxisVec.z);

        let maxIdx = 0;
        if (absY > absX && absY >= absZ) {
            maxIdx = 1;
        } else if (absZ > absX && absZ > absY) {
            maxIdx = 2;
        }

        const cubieGroup = this.cubeRenderer.getCubieGroup(this.hitCubieIndex);
        if (!cubieGroup) return false;

        this.dragAxis = maxIdx;
        this.dragLayer = Math.round(cubieGroup.position[maxIdx] / this.cubeRenderer.spacing);
        this.dragSign = Math.sign(rotationAxisVec[maxIdx]) || 1;
        this.dragScreenDir = { x: dx / dragMag, y: dy / dragMag };
        this.dragScreenStart = { x: this.pointerStart.x, y: this.pointerStart.y };

        this.layerRotator.beginDrag(this.dragAxis, this.dragLayer);
        this.state = 'dragging';

        return true;
    }

    onPointerUp() {
        if (this.state === 'pending') {
            this.state = 'idle';
            this.orbit.enabled = true;
            this.resetDragState();
            return;
        }

        if (this.state !== 'dragging') return;

        const axis = this.dragAxis;
        const layer = this.dragLayer;
        const currentAngle = this.layerRotator.getCurrentAngle();
        const turns = Math.round(currentAngle / QUARTER_TURN);

        this.state = 'idle';
        this.orbit.enabled = true;

        this.layerRotator.commitDrag(turns).then(() => {
            if (turns !== 0 && this.onMoveCommitted) {
                this.onMoveCommitted({ axis, layer, turns });
            }

            this.resetDragState();
        });
    }
}
