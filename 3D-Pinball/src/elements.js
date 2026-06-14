// ============================================================================
// 3D Pinball — Table Elements
// Flippers, circular bumpers, slingshots, triangle bumpers, plunger, reward
// channel. Each element creates its 3D mesh and registers physics collision.
// ============================================================================

import { Transform, Mesh, Box, Cylinder, Sphere, Program, Geometry, Vec3, Color } from '../../ogl/src/index.js';
import {
    FLIPPER, BUMPERS, SLINGSHOTS, TRI_BUMPERS, PLUNGER, REWARD_CHANNEL,
    COLORS, TABLE, PHYSICS,
} from './constants.js';
import { litVertex, litFragment, neonVertex, neonFragment } from './shaders.js';
import { SharedUniforms } from './table.js';
import { CollisionType } from './physics.js';

// ── Create Flippers ────────────────────────────────────────────────────────
export function createFlippers(gl, physicsWorld) {
    const elements = [];

    for (const side of ['left', 'right']) {
        const isLeft = side === 'left';
        const pivot = isLeft ? FLIPPER.LEFT_PIVOT : FLIPPER.RIGHT_PIVOT;

        // Flipper parent transform at pivot position
        const node = new Transform();
        node.position.set(pivot.x, 0.3, pivot.y);

        // Flipper body: tapered cylinder lying along X axis
        const geometry = new Cylinder(gl, {
            radiusTop: 0.28,      // tip end (narrower)
            radiusBottom: 0.5,    // pivot end (wider)
            height: FLIPPER.LENGTH,
            radialSegments: 16,
        });

        const program = new Program(gl, {
            vertex: litVertex,
            fragment: litFragment,
            uniforms: {
                ...SharedUniforms,
                uColor: { value: new Color(...COLORS.FLIPPER) },
                uEmissive: { value: 0.1 },
            },
        });

        const mesh = new Mesh(gl, { geometry, program });
        // Rotate to lie along X axis
        mesh.rotation.z = -Math.PI / 2;
        // Offset so pivot end is at origin of parent node
        mesh.position.set(FLIPPER.LENGTH / 2, 0, 0);
        mesh.setParent(node);

        // Pivot cap (small sphere at pivot)
        const capGeo = new Sphere(gl, { radius: 0.45, widthSegments: 16, heightSegments: 12 });
        const capMesh = new Mesh(gl, { geometry: capGeo, program });
        capMesh.position.set(0, 0, 0);
        capMesh.setParent(node);

        // Register with physics
        const flipper = physicsWorld.addFlipper(side);

        elements.push({ side, node, flipper, pivot });
    }

    // Update function: sync mesh rotation with physics
    function update() {
        for (const el of elements) {
            // rotation.y = -currentAngle (coordinate mapping: physics angle to 3D Y rotation)
            el.node.rotation.y = -el.flipper.currentAngle;
        }
    }

    return { elements, update };
}

// ── Create Circular Bumpers ────────────────────────────────────────────────
export function createBumpers(gl, physicsWorld) {
    const bumpers = [];

    for (const cfg of BUMPERS) {
        // Bumper body: short wide cylinder
        const bodyGeo = new Cylinder(gl, {
            radiusTop: cfg.radius * 0.7,
            radiusBottom: cfg.radius,
            height: 0.7,
            radialSegments: 24,
        });

        const program = new Program(gl, {
            vertex: neonVertex,
            fragment: neonFragment,
            uniforms: {
                uColor: { value: new Color(...cfg.color) },
                uTime: { value: 0 },
                uPulse: { value: 0 },
                uBreath: { value: 0.3 },
            },
        });

        const bodyMesh = new Mesh(gl, { geometry: bodyGeo, program });
        bodyMesh.position.set(cfg.x, 0.35, cfg.y);
        bodyMesh.rotation.x = 0; // cylinder stands upright

        // Bumper top cap (glowing dome)
        const capGeo = new Sphere(gl, {
            radius: cfg.radius * 0.6,
            widthSegments: 24,
            heightSegments: 12,
            thetaLength: Math.PI / 2, // half sphere
        });
        const capProgram = new Program(gl, {
            vertex: neonVertex,
            fragment: neonFragment,
            uniforms: {
                uColor: { value: new Color(cfg.color[0] * 1.3, cfg.color[1] * 1.3, cfg.color[2] * 1.3) },
                uTime: { value: 0 },
                uPulse: { value: 0 },
                uBreath: { value: 0.5 },
            },
        });
        const capMesh = new Mesh(gl, { geometry: capGeo, program: capProgram });
        capMesh.position.set(cfg.x, 0.7, cfg.y);

        // Bumper base ring (dark)
        const baseGeo = new Cylinder(gl, {
            radiusTop: cfg.radius * 1.05,
            radiusBottom: cfg.radius * 1.15,
            height: 0.15,
            radialSegments: 24,
        });
        const baseProgram = new Program(gl, {
            vertex: litVertex,
            fragment: litFragment,
            uniforms: {
                ...SharedUniforms,
                uColor: { value: new Color(0.1, 0.1, 0.12) },
                uEmissive: { value: 0 },
            },
        });
        const baseMesh = new Mesh(gl, { geometry: baseGeo, program: baseProgram });
        baseMesh.position.set(cfg.x, 0.075, cfg.y);

        // Register physics collision
        physicsWorld.addCircularBumper(cfg.x, cfg.y, cfg.radius, cfg.bounce, CollisionType.BUMPER, {
            score: cfg.score,
            index: bumpers.length,
        });

        bumpers.push({
            x: cfg.x, y: cfg.y, radius: cfg.radius,
            color: cfg.color,
            bodyMesh, capMesh, baseMesh,
            program, capProgram,
            hitTime: -10,
            scale: 1,
        });
    }

    function update(time, dt) {
        for (const b of bumpers) {
            // Pulse animation: scale up on hit, then ease back
            const timeSinceHit = time - b.hitTime;
            if (timeSinceHit < 0.4) {
                const t = timeSinceHit / 0.4;
                b.scale = 1 + 0.3 * (1 - t) * (1 - t);
            } else {
                b.scale = 1;
            }
            b.bodyMesh.scale.set(b.scale, 1, b.scale);
            b.capMesh.scale.set(b.scale, b.scale, b.scale);

            // Update shader uniforms
            const pulse = Math.max(0, 1 - timeSinceHit / 0.4);
            b.program.uniforms.uTime.value = time;
            b.program.uniforms.uPulse.value = pulse;
            b.capProgram.uniforms.uTime.value = time;
            b.capProgram.uniforms.uPulse.value = pulse;
        }
    }

    function hitBumper(index) {
        if (bumpers[index]) {
            bumpers[index].hitTime = performance.now() / 1000;
        }
    }

    return { bumpers, update, hitBumper };
}

// ── Create Slingshot Bumpers ───────────────────────────────────────────────
export function createSlingshots(gl, physicsWorld) {
    const slingshots = [];

    for (const cfg of SLINGSHOTS) {
        // Slingshot body: short cylinder
        const bodyGeo = new Cylinder(gl, {
            radiusTop: cfg.radius * 0.6,
            radiusBottom: cfg.radius,
            height: 0.5,
            radialSegments: 20,
        });

        const program = new Program(gl, {
            vertex: neonVertex,
            fragment: neonFragment,
            uniforms: {
                uColor: { value: new Color(...cfg.color) },
                uTime: { value: 0 },
                uPulse: { value: 0 },
                uBreath: { value: 0.2 },
            },
        });

        const mesh = new Mesh(gl, { geometry: bodyGeo, program });
        mesh.position.set(cfg.x, 0.25, cfg.y);

        // Base ring
        const baseGeo = new Cylinder(gl, {
            radiusTop: cfg.radius * 1.05,
            radiusBottom: cfg.radius * 1.15,
            height: 0.12,
            radialSegments: 20,
        });
        const baseProgram = new Program(gl, {
            vertex: litVertex,
            fragment: litFragment,
            uniforms: {
                ...SharedUniforms,
                uColor: { value: new Color(0.1, 0.1, 0.12) },
                uEmissive: { value: 0 },
            },
        });
        const baseMesh = new Mesh(gl, { geometry: baseGeo, program: baseProgram });
        baseMesh.position.set(cfg.x, 0.06, cfg.y);

        // Register physics collision
        physicsWorld.addCircularBumper(cfg.x, cfg.y, cfg.radius, cfg.bounce, CollisionType.SLINGSHOT, {
            score: cfg.score,
            index: slingshots.length,
        });

        slingshots.push({
            x: cfg.x, y: cfg.y,
            mesh, baseMesh, program,
            hitTime: -10,
        });
    }

    function update(time) {
        for (const s of slingshots) {
            const timeSinceHit = time - s.hitTime;
            const pulse = Math.max(0, 1 - timeSinceHit / 0.3);
            s.program.uniforms.uTime.value = time;
            s.program.uniforms.uPulse.value = pulse;
        }
    }

    function hitSlingshot(index) {
        if (slingshots[index]) {
            slingshots[index].hitTime = performance.now() / 1000;
        }
    }

    return { slingshots, update, hitSlingshot };
}

// ── Create Triangle Bumpers ────────────────────────────────────────────────
export function createTriBumpers(gl, physicsWorld) {
    const triBumpers = [];

    for (const cfg of TRI_BUMPERS) {
        const { x, y, size, bounce } = cfg;
        const h = size * Math.sqrt(3) / 2;

        // Create extruded triangle geometry
        const halfThick = 0.3;
        // Vertices for top and bottom faces
        // Triangle pointing down (inverted): top edge + bottom point
        const positions = new Float32Array([
            // Top face (y = +halfThick)
            -size / 2, halfThick, -h / 2,  // 0: top-left
            size / 2, halfThick, -h / 2,   // 1: top-right
            0, halfThick, h / 2,            // 2: bottom point

            // Bottom face (y = -halfThick)
            -size / 2, -halfThick, -h / 2,  // 3
            size / 2, -halfThick, -h / 2,   // 4
            0, -halfThick, h / 2,            // 5
        ]);

        const normals = new Float32Array([
            // Top face normals (pointing up)
            0, 1, 0,  0, 1, 0,  0, 1, 0,
            // Bottom face normals (pointing down)
            0, -1, 0,  0, -1, 0,  0, -1, 0,
        ]);

        // Indices for 8 triangles (2 top/bottom + 3 sides × 2)
        const indices = new Uint16Array([
            // Top face
            0, 2, 1,
            // Bottom face
            3, 4, 5,
            // Side 1 (top edge: vertices 0,1,3,4)
            0, 1, 4,  0, 4, 3,
            // Side 2 (right edge: vertices 1,2,4,5)
            1, 2, 5,  1, 5, 4,
            // Side 3 (left edge: vertices 2,0,5,3)
            2, 0, 3,  2, 3, 5,
        ]);

        const geometry = new Geometry(gl, {
            position: { size: 3, data: positions },
            normal: { size: 3, data: normals },
            index: { data: indices },
        });

        const program = new Program(gl, {
            vertex: neonVertex,
            fragment: neonFragment,
            uniforms: {
                uColor: { value: new Color(...COLORS.TRI_BUMPER) },
                uTime: { value: 0 },
                uPulse: { value: 0 },
                uBreath: { value: 0.3 },
            },
        });

        const mesh = new Mesh(gl, { geometry, program });
        mesh.position.set(x, 0.3, y);

        // Register physics collision
        physicsWorld.addTriBumper(x, y, size, bounce, {
            score: cfg.score,
            index: triBumpers.length,
        });

        triBumpers.push({ x, y, mesh, program, hitTime: -10 });
    }

    function update(time) {
        for (const t of triBumpers) {
            const timeSinceHit = time - t.hitTime;
            const pulse = Math.max(0, 1 - timeSinceHit / 0.3);
            t.program.uniforms.uTime.value = time;
            t.program.uniforms.uPulse.value = pulse;
        }
    }

    function hitTriBumper(index) {
        if (triBumpers[index]) {
            triBumpers[index].hitTime = performance.now() / 1000;
        }
    }

    return { triBumpers, update, hitTriBumper };
}

// ── Create Plunger ─────────────────────────────────────────────────────────
export function createPlunger(gl) {
    const geometry = new Cylinder(gl, {
        radiusTop: 0.3,
        radiusBottom: 0.35,
        height: 1.5,
        radialSegments: 16,
    });

    const program = new Program(gl, {
        vertex: litVertex,
        fragment: litFragment,
        uniforms: {
            ...SharedUniforms,
            uColor: { value: new Color(...COLORS.PLUNGER) },
            uEmissive: { value: 0.05 },
        },
    });

    const mesh = new Mesh(gl, { geometry, program });
    mesh.position.set(PLUNGER.LANE_X, -0.5, PLUNGER.START_Y - 0.5);

    // Plunger base plate
    const baseGeo = new Box(gl, { width: 1.4, height: 0.3, depth: 0.8 });
    const baseMesh = new Mesh(gl, { geometry: baseGeo, program });
    baseMesh.position.set(PLUNGER.LANE_X, -0.9, PLUNGER.START_Y - 1.2);

    function update(charge) {
        // charge: 0-1, plunger compresses down
        const compress = charge * 0.8;
        mesh.scale.y = 1 - compress * 0.4;
        mesh.position.y = -0.5 - compress * 0.3;
    }

    return { mesh, baseMesh, update };
}

// ── Create Reward Channel (decorative arc) ──────────────────────────────────
export function createRewardChannel(gl) {
    const group = new Transform();
    const points = REWARD_CHANNEL.points;

    // Create glowing arc segments
    const program = new Program(gl, {
        vertex: neonVertex,
        fragment: neonFragment,
        uniforms: {
            uColor: { value: new Color(...COLORS.NEON_PURPLE) },
            uTime: { value: 0 },
            uPulse: { value: 0 },
            uBreath: { value: 0.5 },
        },
    });

    const meshes = [];
    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.hypot(dx, dy);
        if (len < 0.1) continue;

        const angle = Math.atan2(dx, dy);
        const geo = new Box(gl, { width: 0.12, height: 0.12, depth: len });
        const mesh = new Mesh(gl, { geometry: geo, program });
        mesh.position.set((p1.x + p2.x) / 2, 0.15, (p1.y + p2.y) / 2);
        mesh.rotation.y = angle;
        mesh.setParent(group);
        meshes.push(mesh);
    }

    function update(time, isCompleted) {
        program.uniforms.uTime.value = time;
        program.uniforms.uPulse.value = isCompleted ? 0.5 : 0;
    }

    return { group, meshes, program, update };
}

// ── Create Decorative Neon Accents ─────────────────────────────────────────
export function createDecorations(gl) {
    const accents = [];

    // Neon accent strips on the table surface (inlanes)
    const stripProgram = new Program(gl, {
        vertex: neonVertex,
        fragment: neonFragment,
        uniforms: {
            uColor: { value: new Color(...COLORS.NEON_CYAN) },
            uTime: { value: 0 },
            uPulse: { value: 0 },
            uBreath: { value: 0.6 },
        },
    });

    // Left inlane strip
    {
        const geo = new Box(gl, { width: 0.06, height: 0.02, depth: 5 });
        const mesh = new Mesh(gl, { geometry: geo, program: stripProgram });
        mesh.position.set(-9.3, 0.04, 3);
        accents.push(mesh);
    }

    // Right inlane strip
    {
        const geo = new Box(gl, { width: 0.06, height: 0.02, depth: 5 });
        const mesh = new Mesh(gl, { geometry: geo, program: stripProgram });
        mesh.position.set(7.5, 0.04, 3);
        accents.push(mesh);
    }

    // Center decorative line
    {
        const geo = new Box(gl, { width: 0.04, height: 0.02, depth: 30 });
        const mesh = new Mesh(gl, { geometry: geo, program: stripProgram });
        mesh.position.set(0, 0.03, 20);
        accents.push(mesh);
    }

    function update(time) {
        stripProgram.uniforms.uTime.value = time;
    }

    return { accents, update, stripProgram };
}
