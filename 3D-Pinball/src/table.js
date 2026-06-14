// ============================================================================
// 3D Pinball — Table Construction
// Creates the tilted table group, base plate, walls, glass cover, light strips.
// All child objects (ball, bumpers, etc.) are added to the returned Transform.
// ============================================================================

import { Transform, Mesh, Box, Cylinder, Program, Vec3, Color } from '../../ogl/src/index.js';
import { TABLE, HALF_W, COLORS, PLUNGER } from './constants.js';
import { litVertex, litFragment, neonVertex, neonFragment, glassVertex, glassFragment } from './shaders.js';

// Shared light uniforms used across all lit/neon programs
export const SharedUniforms = {
    uLightDir: { value: new Vec3(0.5, 1, 0.3).normalize() },
    uLightColor: { value: new Vec3(1, 0.95, 0.9) },
    uLight2Dir: { value: new Vec3(-0.3, 0.8, -0.5).normalize() },
    uLight2Color: { value: new Vec3(0.3, 0.4, 0.8) },
};

// ── Create the table group (tilted parent Transform) ───────────────────────
export function createTableGroup() {
    const group = new Transform();
    // Tilt around X axis so top of table is higher (far end raised)
    group.rotation.x = -TABLE.TILT_ANGLE;
    return group;
}

// ── Create wall mesh from a 2D physics segment ─────────────────────────────
function createWallMesh(gl, x1, y1, x2, y2, height, thickness, program) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.hypot(dx, dy);
    if (length < 0.01) return null;

    const angle = Math.atan2(dx, dy);
    const midX = (x1 + x2) / 2;
    const midZ = (y1 + y2) / 2;

    const geometry = new Box(gl, { width: thickness, height, depth: length + thickness });
    const mesh = new Mesh(gl, { geometry, program });
    mesh.position.set(midX, height / 2, midZ);
    mesh.rotation.y = angle;
    return mesh;
}

// ── Build the complete table ───────────────────────────────────────────────
export function createTable(gl) {
    const group = createTableGroup();
    const wallH = TABLE.WALL_HEIGHT;
    const wallT = TABLE.WALL_THICKNESS;

    // ── Base plate ──
    {
        const geometry = new Box(gl, { width: TABLE.WIDTH + 0.4, height: 0.5, depth: TABLE.LENGTH + 0.4 });
        const program = new Program(gl, {
            vertex: litVertex,
            fragment: litFragment,
            uniforms: {
                ...SharedUniforms,
                uColor: { value: new Color(...COLORS.TABLE_BASE) },
                uEmissive: { value: 0.0 },
            },
        });
        const mesh = new Mesh(gl, { geometry, program });
        mesh.position.set(0, -0.25, TABLE.LENGTH / 2);
        mesh.setParent(group);
    }

    // ── Inner playfield surface (decorative dark glossy surface) ──
    {
        const geometry = new Box(gl, { width: TABLE.WIDTH, height: 0.05, depth: TABLE.LENGTH });
        const program = new Program(gl, {
            vertex: litVertex,
            fragment: litFragment,
            uniforms: {
                ...SharedUniforms,
                uColor: { value: new Color(0.05, 0.04, 0.08) },
                uEmissive: { value: 0.02 },
            },
        });
        const mesh = new Mesh(gl, { geometry, program });
        mesh.position.set(0, 0.025, TABLE.LENGTH / 2);
        mesh.setParent(group);
    }

    // ── Wall material (metallic dark frame) ──
    const wallProgram = new Program(gl, {
        vertex: litVertex,
        fragment: litFragment,
        uniforms: {
            ...SharedUniforms,
            uColor: { value: new Color(...COLORS.WALL) },
            uEmissive: { value: 0.05 },
        },
    });

    // ── Walls ──
    const W = HALF_W;
    const topY = 38;
    const laneL = PLUNGER.LANE_LEFT;
    const arcRadius = W;
    const arcCenterY = topY;

    // Left wall
    let m = createWallMesh(gl, -W, 0, -W, topY, wallH, wallT, wallProgram);
    if (m) m.setParent(group);

    // Right outer wall
    m = createWallMesh(gl, W, 0, W, topY, wallH, wallT, wallProgram);
    if (m) m.setParent(group);

    // Plunger lane separator
    m = createWallMesh(gl, laneL, 0, laneL, 37, wallH * 0.8, wallT * 0.7, wallProgram);
    if (m) m.setParent(group);

    // Bottom-left diagonal
    m = createWallMesh(gl, -W, 1.5, -4.2, 5.5, wallH, wallT, wallProgram);
    if (m) m.setParent(group);

    // Bottom-right diagonal
    m = createWallMesh(gl, laneL, 1.5, 4.2, 5.5, wallH, wallT, wallProgram);
    if (m) m.setParent(group);

    // Top arc (semicircle)
    const arcSegments = 16;
    for (let i = 0; i < arcSegments; i++) {
        const a1 = Math.PI - (i / arcSegments) * Math.PI;
        const a2 = Math.PI - ((i + 1) / arcSegments) * Math.PI;
        const x1 = Math.cos(a1) * arcRadius;
        const y1 = arcCenterY + Math.sin(a1) * arcRadius;
        const x2 = Math.cos(a2) * arcRadius;
        const y2 = arcCenterY + Math.sin(a2) * arcRadius;
        m = createWallMesh(gl, x1, y1, x2, y2, wallH, wallT, wallProgram);
        if (m) m.setParent(group);
    }

    // ── Neon light strips along walls (emissive) ──
    const stripProgram = new Program(gl, {
        vertex: neonVertex,
        fragment: neonFragment,
        uniforms: {
            uColor: { value: new Color(...COLORS.LIGHT_STRIP_GREEN) },
            uTime: { value: 0 },
            uPulse: { value: 0 },
            uBreath: { value: 1 },
        },
    });

    // Light strip along left wall base
    {
        const geometry = new Box(gl, { width: 0.08, height: 0.08, depth: topY });
        const mesh = new Mesh(gl, { geometry, program: stripProgram });
        mesh.position.set(-W + 0.15, 0.1, topY / 2);
        mesh.setParent(group);
    }

    // Light strip along right wall base
    {
        const geometry = new Box(gl, { width: 0.08, height: 0.08, depth: topY });
        const mesh = new Mesh(gl, { geometry, program: stripProgram });
        mesh.position.set(W - 0.15, 0.1, topY / 2);
        mesh.setParent(group);
    }

    // ── Glass cover ──
    {
        const geometry = new Box(gl, {
            width: TABLE.WIDTH + 0.6,
            height: 0.2,
            depth: TABLE.LENGTH + 1.0,
        });
        const program = new Program(gl, {
            vertex: glassVertex,
            fragment: glassFragment,
            uniforms: {
                uColor: { value: new Color(...COLORS.GLASS) },
                uOpacity: { value: 0.06 },
                uTime: { value: 0 },
            },
            transparent: true,
            depthWrite: false,
            cullFace: false,
        });
        const mesh = new Mesh(gl, { geometry, program });
        mesh.position.set(0, wallH + 0.1, TABLE.LENGTH / 2);
        mesh.setParent(group);
    }

    // ── Drain area marker (dark red glow at bottom) ──
    {
        const geometry = new Box(gl, { width: 7, height: 0.03, depth: 1.5 });
        const program = new Program(gl, {
            vertex: neonVertex,
            fragment: neonFragment,
            uniforms: {
                uColor: { value: new Color(0.3, 0.0, 0.0) },
                uTime: { value: 0 },
                uPulse: { value: 0 },
                uBreath: { value: 0.3 },
            },
        });
        const mesh = new Mesh(gl, { geometry, program });
        mesh.position.set(0, 0.05, 0.75);
        mesh.setParent(group);
    }

    return { group, stripProgram };
}
