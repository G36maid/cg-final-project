// ============================================================================
// 3D Pinball — Physics Engine
// Pure JS physics: gravity, collision detection (circle/segment/flipper), CCD.
// Operates in 2D table space: x ∈ [-10,10], y ∈ [0,40]. y=0 is drain.
// ============================================================================

import { PHYSICS, FLIPPER, BUMPERS, SLINGSHOTS, TRI_BUMPERS, PLUNGER, DRAIN, TABLE, HALF_W } from './constants.js';

// Collision object types
export const CollisionType = {
    WALL: 'wall',
    BUMPER: 'bumper',
    SLINGSHOT: 'slingshot',
    TRI_BUMPER: 'tri_bumper',
    FLIPPER: 'flipper',
    DRAIN: 'drain',
    PLUNGER: 'plunger',
};

export class PhysicsWorld {
    constructor() {
        // Ball state in table-space 2D
        this.ball = {
            x: PLUNGER.LANE_X,
            y: PLUNGER.START_Y,
            vx: 0,
            vy: 0,
            radius: PHYSICS.BALL_RADIUS,
            active: false,    // false = in plunger lane / not launched
            inPlay: false,    // true = ball is on the main playfield
        };

        // Collision objects
        this.walls = [];      // Line segments: {x1,y1,x2,y2,bounce}
        this.circles = [];    // Bumpers/slingshots: {x,y,radius,bounce,type,data}
        this.flippers = [];   // Flipper objects
        this.triBumpers = []; // Triangle bumpers: {vertices, bounce, type, data}

        // Callbacks
        this.onCollision = null;  // (type, data) => void

        // Generate table walls
        this._setupWalls();
    }

    // ── Wall Setup ──────────────────────────────────────────────────────────
    _setupWalls() {
        const W = HALF_W;          // 10
        const laneL = PLUNGER.LANE_LEFT;  // 8.2
        const topY = 38;
        const arcRadius = W;
        const arcCenterY = topY;

        // 1. Left wall: (-W, 0) → (-W, topY)
        this.walls.push({ x1: -W, y1: 0, x2: -W, y2: topY, bounce: 0.6 });

        // 2. Top arc: from (-W, topY) through (0, topY+W) to (W, topY)
        //    Circle center (0, topY), radius W. Angles π → 0 (upper semicircle).
        const arcSegments = 16;
        for (let i = 0; i < arcSegments; i++) {
            const a1 = Math.PI - (i / arcSegments) * Math.PI;
            const a2 = Math.PI - ((i + 1) / arcSegments) * Math.PI;
            this.walls.push({
                x1: Math.cos(a1) * arcRadius,
                y1: arcCenterY + Math.sin(a1) * arcRadius,
                x2: Math.cos(a2) * arcRadius,
                y2: arcCenterY + Math.sin(a2) * arcRadius,
                bounce: 0.6,
            });
        }

        // 3. Right outer wall: (W, 0) → (W, topY)
        this.walls.push({ x1: W, y1: 0, x2: W, y2: topY, bounce: 0.6 });

        // 4. Plunger lane separator: (laneL, 0) → (laneL, 37)
        //    Gap at top (y>37) for ball to exit lane into playfield
        this.walls.push({ x1: laneL, y1: 0, x2: laneL, y2: 37, bounce: 0.4 });

        // 5. Left inlane diagonal: outer wall down to left flipper pivot
        this.walls.push({ x1: -W, y1: 9, x2: FLIPPER.LEFT_PIVOT.x, y2: FLIPPER.LEFT_PIVOT.y, bounce: 0.3 });

        // 6. Right inlane diagonal: plunger lane down to right flipper pivot
        this.walls.push({ x1: laneL, y1: 9, x2: FLIPPER.RIGHT_PIVOT.x, y2: FLIPPER.RIGHT_PIVOT.y, bounce: 0.3 });

        // 7. Left bottom V-guide: funnels ball past flippers toward center drain
        this.walls.push({ x1: FLIPPER.LEFT_PIVOT.x, y1: 0.3, x2: -1.5, y2: 2.5, bounce: 0.2 });

        // 8. Right bottom V-guide: mirrors left
        this.walls.push({ x1: FLIPPER.RIGHT_PIVOT.x, y1: 0.3, x2: 1.5, y2: 2.5, bounce: 0.2 });

        // 9. Plunger lane bottom
        this.walls.push({ x1: laneL, y1: 0, x2: W, y2: 0, bounce: 0.3 });
    }

    // ── Add Collision Objects ───────────────────────────────────────────────
    addCircularBumper(x, y, radius, bounce, type, data) {
        this.circles.push({ x, y, radius, bounce, type, data, hitTime: 0 });
    }

    addFlipper(side) {
        const isLeft = side === 'left';
        const pivot = isLeft ? FLIPPER.LEFT_PIVOT : FLIPPER.RIGHT_PIVOT;
        const restAngle = isLeft ? FLIPPER.REST_ANGLE : (Math.PI - FLIPPER.REST_ANGLE);
        const activeAngle = isLeft ? FLIPPER.ACTIVE_ANGLE : (Math.PI - FLIPPER.ACTIVE_ANGLE);

        const flipper = {
            side,
            pivotX: pivot.x,
            pivotY: pivot.y,
            length: FLIPPER.LENGTH,
            radius: FLIPPER.RADIUS,
            restAngle,
            activeAngle,
            currentAngle: restAngle,
            targetAngle: restAngle,
            angularVel: 0,
            activated: false,
        };
        this.flippers.push(flipper);
        return flipper;
    }

    addTriBumper(cx, cy, size, bounce, data) {
        // Inverted triangle (point down)
        const h = size * Math.sqrt(3) / 2;
        const vertices = [
            { x: cx - size / 2, y: cy + h / 2 },  // bottom-left
            { x: cx + size / 2, y: cy + h / 2 },  // bottom-right
            { x: cx, y: cy - h / 2 },              // top point (inverted = point up actually)
        ];
        // Actually, "inverted triangle" = point down
        const invVertices = [
            { x: cx - size / 2, y: cy - h / 2 },  // top-left
            { x: cx + size / 2, y: cy - h / 2 },  // top-right
            { x: cx, y: cy + h / 2 },              // bottom point
        ];
        this.triBumpers.push({ vertices: invVertices, bounce, data, center: { x: cx, y: cy }, size });
    }

    // ── Flipper Control ─────────────────────────────────────────────────────
    setFlipperActive(side, active) {
        const flipper = this.flippers.find(f => f.side === side);
        if (!flipper) return;
        flipper.activated = active;
        flipper.targetAngle = active ? flipper.activeAngle : flipper.restAngle;
    }

    // ── Plunger ─────────────────────────────────────────────────────────────
    launchBall(power) {
        // power: 0-1
        if (!this.ball.active) {
            const speed = PLUNGER.MIN_SPEED + (PLUNGER.MAX_SPEED - PLUNGER.MIN_SPEED) * power;
            this.ball.vy = speed;
            this.ball.vx = 0;
            this.ball.active = true;
        }
    }

    resetBall() {
        this.ball.x = PLUNGER.LANE_X;
        this.ball.y = PLUNGER.START_Y;
        this.ball.vx = 0;
        this.ball.vy = 0;
        this.ball.active = false;
        this.ball.inPlay = false;
    }

    // ── Physics Update ──────────────────────────────────────────────────────
    update(dt) {
        if (!this.ball.active) return;

        // Clamp dt to prevent large steps
        dt = Math.min(dt, 1 / 30);

        // Update flipper angles first (they affect collision)
        this._updateFlippers(dt);

        // Apply gravity (along table surface, toward drain = -y direction)
        this.ball.vy -= PHYSICS.GRAVITY * dt;

        // Apply friction (frame-rate independent)
        const friction = Math.pow(PHYSICS.FRICTION, dt * 60);
        this.ball.vx *= friction;
        this.ball.vy *= friction;

        // Cap speed
        const speed = Math.hypot(this.ball.vx, this.ball.vy);
        if (speed > PHYSICS.MAX_SPEED) {
            this.ball.vx *= PHYSICS.MAX_SPEED / speed;
            this.ball.vy *= PHYSICS.MAX_SPEED / speed;
        }

        // Determine substeps (CCD for fast-moving ball)
        const currentSpeed = Math.hypot(this.ball.vx, this.ball.vy);
        const steps = currentSpeed > PHYSICS.CCD_THRESHOLD ? PHYSICS.CCD_SUBSTEPS : 1;
        const subDt = dt / steps;

        for (let i = 0; i < steps; i++) {
            // Move ball
            this.ball.x += this.ball.vx * subDt;
            this.ball.y += this.ball.vy * subDt;

            // Check collisions
            this._collideWalls();
            this._collideCircles();
            this._collideFlippers();
            this._collideTriBumpers();

            // Check drain
            this._checkDrain();

            // Check playfield entry (ball exits plunger lane)
            if (!this.ball.inPlay && this.ball.y > 37 && this.ball.x < PLUNGER.LANE_LEFT) {
                this.ball.inPlay = true;
            }
        }
    }

    // ── Flipper Update ──────────────────────────────────────────────────────
    _updateFlippers(dt) {
        for (const f of this.flippers) {
            const prevAngle = f.currentAngle;
            const diff = f.targetAngle - f.currentAngle;

            if (Math.abs(diff) > 0.001) {
                const direction = Math.sign(diff);
                const rotationAmount = FLIPPER.ROTATION_SPEED * dt;
                if (Math.abs(diff) <= rotationAmount) {
                    f.currentAngle = f.targetAngle;
                } else {
                    f.currentAngle += direction * rotationAmount;
                }
            }

            // Angular velocity (for collision response)
            f.angularVel = (f.currentAngle - prevAngle) / dt;
        }
    }

    // ── Wall Collision ──────────────────────────────────────────────────────
    _collideWalls() {
        const b = this.ball;

        // Find the deepest penetration to avoid compounding multiple collision
        // responses when ball touches adjacent wall segments (e.g. arc pieces).
        let best = null;

        for (const w of this.walls) {
            const dx = w.x2 - w.x1;
            const dy = w.y2 - w.y1;
            const len2 = dx * dx + dy * dy;
            if (len2 < 0.001) continue;

            let t = ((b.x - w.x1) * dx + (b.y - w.y1) * dy) / len2;
            t = Math.max(0, Math.min(1, t));

            const cx = w.x1 + t * dx;
            const cy = w.y1 + t * dy;
            const ndx = b.x - cx;
            const ndy = b.y - cy;
            const dist = Math.hypot(ndx, ndy);

            if (dist < b.radius && dist > 0.0001) {
                const overlap = b.radius - dist;
                if (!best || overlap > best.overlap) {
                    best = {
                        nx: ndx / dist,
                        ny: ndy / dist,
                        overlap,
                        bounce: w.bounce,
                    };
                }
            }
        }

        if (best) {
            b.x += best.nx * best.overlap;
            b.y += best.ny * best.overlap;

            const dot = b.vx * best.nx + b.vy * best.ny;
            if (dot < 0) {
                // At low speed, treat collision as inelastic so the ball
                // slides along the wall surface instead of bouncing in place.
                const speed = Math.hypot(b.vx, b.vy);
                const e = speed < 3.0 ? 0 : best.bounce;
                b.vx -= (1 + e) * dot * best.nx;
                b.vy -= (1 + e) * dot * best.ny;
                if (this.onCollision) {
                    this.onCollision(CollisionType.WALL, { bounce: best.bounce });
                }
            }
        }
    }

    // ── Circle (Bumper/Slingshot) Collision ─────────────────────────────────
    _collideCircles() {
        const b = this.ball;
        for (const c of this.circles) {
            const dx = b.x - c.x;
            const dy = b.y - c.y;
            const dist = Math.hypot(dx, dy);
            const minDist = b.radius + c.radius;

            if (dist < minDist && dist > 0.0001) {
                const nx = dx / dist;
                const ny = dy / dist;
                const overlap = minDist - dist;
                b.x += nx * overlap;
                b.y += ny * overlap;

                const dot = b.vx * nx + b.vy * ny;
                if (dot < 0) {
                    // Bounce with extra energy from bumper
                    b.vx -= (1 + c.bounce) * dot * nx;
                    b.vy -= (1 + c.bounce) * dot * ny;
                    // Add extra push from bumper
                    b.vx += nx * 5 * (c.bounce - 1);
                    b.vy += ny * 5 * (c.bounce - 1);
                }

                c.hitTime = performance.now() / 1000;
                if (this.onCollision) {
                    this.onCollision(c.type, { x: c.x, y: c.y, data: c.data, bounce: c.bounce });
                }
            }
        }
    }

    // ── Flipper Collision (rotating capsule) ────────────────────────────────
    _collideFlippers() {
        const b = this.ball;
        for (const f of this.flippers) {
            // Flipper segment endpoints
            const x1 = f.pivotX;
            const y1 = f.pivotY;
            const x2 = f.pivotX + Math.cos(f.currentAngle) * f.length;
            const y2 = f.pivotY + Math.sin(f.currentAngle) * f.length;

            // Closest point on segment to ball
            const dx = x2 - x1;
            const dy = y2 - y1;
            const len2 = dx * dx + dy * dy;
            let t = ((b.x - x1) * dx + (b.y - y1) * dy) / len2;
            t = Math.max(0, Math.min(1, t));

            const cx = x1 + t * dx;
            const cy = y1 + t * dy;
            const ndx = b.x - cx;
            const ndy = b.y - cy;
            const dist = Math.hypot(ndx, ndy);
            const minDist = b.radius + f.radius;

            if (dist < minDist) {
                let nx, ny;
                if (dist > 0.001) {
                    nx = ndx / dist;
                    ny = ndy / dist;
                } else {
                    // Ball exactly on segment — use perpendicular
                    nx = -Math.sin(f.currentAngle);
                    ny = Math.cos(f.currentAngle);
                }

                const overlap = minDist - dist;
                b.x += nx * overlap;
                b.y += ny * overlap;

                // Compute flipper surface velocity at contact point
                const armDx = cx - f.pivotX;
                const armDy = cy - f.pivotY;
                const armLen = Math.hypot(armDx, armDy);
                // Tangential velocity direction: perpendicular to arm
                const tangentialSpeed = f.angularVel * armLen;
                const flipperVx = -armDy / armLen * tangentialSpeed;
                const flipperVy = armDx / armLen * tangentialSpeed;

                // Relative velocity (ball relative to flipper surface)
                const relVx = b.vx - flipperVx;
                const relVy = b.vy - flipperVy;
                const dot = relVx * nx + relVy * ny;

                if (dot < 0) {
                    const bounce = 0.8;
                    b.vx -= (1 + bounce) * dot * nx;
                    b.vy -= (1 + bounce) * dot * ny;

                    // Add flipper push when active
                    if (f.activated && Math.abs(f.angularVel) > 0.5) {
                        const pushForce = Math.abs(f.angularVel) * armLen * 0.6;
                        b.vx += flipperVx * 0.5 + nx * pushForce * 0.3;
                        b.vy += flipperVy * 0.5 + ny * pushForce * 0.3;
                    }

                    if (this.onCollision) {
                        this.onCollision(CollisionType.FLIPPER, { side: f.side });
                    }
                }
            }
        }
    }

    // ── Triangle Bumper Collision ───────────────────────────────────────────
    _collideTriBumpers() {
        const b = this.ball;
        for (const tri of this.triBumpers) {
            // Check each edge of the triangle as a line segment
            const verts = tri.vertices;
            for (let i = 0; i < 3; i++) {
                const v1 = verts[i];
                const v2 = verts[(i + 1) % 3];

                const dx = v2.x - v1.x;
                const dy = v2.y - v1.y;
                const len2 = dx * dx + dy * dy;
                let t = ((b.x - v1.x) * dx + (b.y - v1.y) * dy) / len2;
                t = Math.max(0, Math.min(1, t));

                const cx = v1.x + t * dx;
                const cy = v1.y + t * dy;
                const ndx = b.x - cx;
                const ndy = b.y - cy;
                const dist = Math.hypot(ndx, ndy);

                if (dist < b.radius && dist > 0.0001) {
                    const nx = ndx / dist;
                    const ny = ndy / dist;
                    const overlap = b.radius - dist;
                    b.x += nx * overlap;
                    b.y += ny * overlap;

                    const dot = b.vx * nx + b.vy * ny;
                    if (dot < 0) {
                        b.vx -= (1 + tri.bounce) * dot * nx;
                        b.vy -= (1 + tri.bounce) * dot * ny;

                        if (this.onCollision) {
                            this.onCollision(CollisionType.TRI_BUMPER, {
                                x: tri.center.x, y: tri.center.y, data: tri.data, bounce: tri.bounce
                            });
                        }
                    }
                    break; // Only one edge can collide at a time
                }
            }
        }
    }

    // ── Drain Check ─────────────────────────────────────────────────────────
    _checkDrain() {
        const b = this.ball;
        if (b.y < 1.0) {
            b.active = false;
            b.inPlay = false;
            if (this.onCollision) {
                this.onCollision(CollisionType.DRAIN, {});
            }
        }
    }

    // ── Helpers ─────────────────────────────────────────────────────────────
    getBallSpeed() {
        return Math.hypot(this.ball.vx, this.ball.vy);
    }
}
