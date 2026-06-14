import { Vec3 } from '../../ogl/src/index.js';

export class Celebration {
    constructor(cubeRenderer) {
        this.cubeRenderer = cubeRenderer;
        this.active = false;
        this.elapsed = 0;
        this.duration = 1000;
        this.originalPositions = [];
        this.targetOffsets = [];
    }

    trigger() {
        if (this.active) return;

        this.active = true;
        this.elapsed = 0;
        this.originalPositions = [];
        this.targetOffsets = [];

        for (let i = 0; i < this.cubeRenderer.cubieGroups.length; i++) {
            const group = this.cubeRenderer.cubieGroups[i];
            const pos = group.position.clone();
            this.originalPositions.push(pos);

            const dir = pos.clone();
            if (dir.len() < 0.1) {
                this.targetOffsets.push(new Vec3(0, 0, 0));
            } else {
                dir.normalize();
                this.targetOffsets.push(dir.multiply(2.5));
            }
        }
    }

    update(dt) {
        if (!this.active) return;

        this.elapsed += dt;
        const t = Math.min(this.elapsed / this.duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);

        for (let i = 0; i < this.cubeRenderer.cubieGroups.length; i++) {
            const group = this.cubeRenderer.cubieGroups[i];
            const orig = this.originalPositions[i];
            const offset = this.targetOffsets[i];

            if (!orig || !offset) continue;

            group.position.set(
                orig[0] + offset[0] * eased,
                orig[1] + offset[1] * eased,
                orig[2] + offset[2] * eased
            );
        }

        if (t >= 1) {
            this.active = false;
        }
    }

    reset() {
        for (let i = 0; i < this.cubeRenderer.cubieGroups.length; i++) {
            const group = this.cubeRenderer.cubieGroups[i];
            const orig = this.originalPositions[i];

            if (orig) {
                group.position.copy(orig);
            }
        }

        this.active = false;
        this.elapsed = 0;
        this.originalPositions = [];
        this.targetOffsets = [];
    }
}
