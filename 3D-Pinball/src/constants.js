// ============================================================================
// 3D Pinball — Game Constants
// All dimensions, physics parameters, element positions, scoring, and colors.
// ============================================================================

// ── Table Dimensions ───────────────────────────────────────────────────────
export const TABLE = {
    WIDTH: 20,        // X: [-10, 10]
    LENGTH: 40,       // Y: [0, 40] (0=bottom/drain, 40=top/plunger area)
    HEIGHT_DIFF: 4,   // Top is 4 units higher than bottom
    WALL_HEIGHT: 2,
    WALL_THICKNESS: 0.5,
    TILT_ANGLE: Math.atan2(4, 40), // ≈ 5.71° — derived from height diff / length
    BASE_COLOR: [0x0d / 255, 0x0d / 255, 0x12 / 255], // #0D0D12
};

// Half-dimensions for convenience
export const HALF_W = TABLE.WIDTH / 2;  // 10
export const HALF_L = TABLE.LENGTH / 2; // 20

// ── Physics Constants ──────────────────────────────────────────────────────
export const PHYSICS = {
    GRAVITY: 25,          // Base gravity (units/s²) along table surface
    FRICTION: 0.999,      // Per-frame velocity multiplier (damping)
    MAX_SPEED: 60,        // Speed cap (units/s) — prevents tunneling
    CCD_THRESHOLD: 30,    // Enable CCD above this speed
    CCD_SUBSTEPS: 4,      // Substep count when CCD active
    BALL_RADIUS: 0.55,    // Ball collision radius
    BALL_MASS: 1,
    RESTITUTION_WALL: 0.7,   // Wall bounce energy retention
};

// ── Flipper Configuration ──────────────────────────────────────────────────
export const FLIPPER = {
    LENGTH: 4.2,
    RADIUS: 0.4,         // Collision radius (capsule thickness)
    PIVOT_RADIUS: 0.55,
    REST_ANGLE: -25 * Math.PI / 180,   // -25° from horizontal
    ACTIVE_ANGLE: 55 * Math.PI / 180,  // +55° from horizontal
    ROTATION_SPEED: 18,   // rad/s — how fast flipper rotates when activated
    LEFT_PIVOT: { x: -4.8, y: 5.5 },
    RIGHT_PIVOT: { x: 4.8, y: 5.5 },
};

// ── Circular Bumpers (top area, triangular distribution) ────────────────────
export const BUMPERS = [
    { x: -4.5, y: 28, radius: 1.3, color: [1.0, 0.133, 0.4], bounce: 1.2, score: 100 },  // #FF2266
    { x: 4.5, y: 28, radius: 1.3, color: [1.0, 0.133, 0.4], bounce: 1.2, score: 100 },
    { x: 0, y: 33, radius: 1.3, color: [1.0, 0.133, 0.4], bounce: 1.2, score: 100 },
];

// ── Slingshot Bumpers (above flippers, two sides) ──────────────────────────
export const SLINGSHOTS = [
    { x: -7.5, y: 11, radius: 0.9, color: [1.0, 0.4, 0.0], bounce: 1.3, score: 50 },  // Orange
    { x: 7.5, y: 11, radius: 0.9, color: [1.0, 0.4, 0.0], bounce: 1.3, score: 50 },
];

// ── Triangle Bumpers (3 inverted triangles, mid-table) ─────────────────────
export const TRI_BUMPERS = [
    { x: -3.5, y: 18, size: 1.5, bounce: 0.9, score: 30 },
    { x: 3.5, y: 18, size: 1.5, bounce: 0.9, score: 30 },
    { x: 0, y: 23, size: 1.5, bounce: 0.9, score: 30 },
];

// ── Plunger ────────────────────────────────────────────────────────────────
export const PLUNGER = {
    LANE_X: 9.25,       // Center of plunger lane (right side)
    LANE_LEFT: 8.2,     // Left wall of plunger lane
    LANE_RIGHT: 10,     // Right wall (table edge)
    START_Y: 1.5,       // Ball resting position
    LANE_TOP: 38,       // Where ball exits lane into playfield
    MIN_SPEED: 20,
    MAX_SPEED: 60,
    MAX_CHARGE_TIME: 2,  // seconds for full charge
};

// ── Drain ──────────────────────────────────────────────────────────────────
export const DRAIN = {
    LEFT_EDGE: -3.5,
    RIGHT_EDGE: 3.5,
    Y: 0.5,             // Y position where drain triggers
};

// ── Reward Channel (arc on left side) ──────────────────────────────────────
export const REWARD_CHANNEL = {
    // Arc path waypoints (left side of table, upper area)
    points: [
        { x: -10, y: 35 },
        { x: -9, y: 37 },
        { x: -7, y: 38.5 },
        { x: -4, y: 38.8 },
        { x: 0, y: 38.5 },
    ],
    score: 500,
};

// ── Scoring ────────────────────────────────────────────────────────────────
export const SCORE = {
    BUMPER: 100,
    SLINGSHOT: 50,
    TRI_BUMPER: 30,
    REWARD_CHANNEL: 500,
    COMBO_BONUS: 500,
    ALL_BUMPERS: 1000,
    COMBO_WINDOW: 2,       // seconds for combo chain
    COMBO_HITS: 3,         // hits needed for combo
    BALL_SAVE_TIME: 15,    // seconds
    INITIAL_BALLS: 3,
    MULTIPLIER_STEP: 5000, // points per +0.1x
    MULTIPLIER_INCREMENT: 0.1,
    MULTIPLIER_MAX: 3.0,
    MULTIPLIER_COLOR: [1.0, 0.667, 0.0], // #FFAA00
};

// ── Colors ─────────────────────────────────────────────────────────────────
export const COLORS = {
    TABLE_BASE: [0x0d / 255, 0x0d / 255, 0x12 / 255],
    WALL: [0.15, 0.15, 0.2],
    GLASS: [0.6, 0.8, 1.0],
    BUMPER: [1.0, 0.133, 0.4],        // #FF2266
    BUMPER_TOP: [1.0, 0.4, 0.5],
    SLINGSHOT: [1.0, 0.4, 0.0],
    TRI_BUMPER: [0.2, 0.8, 1.0],      // Cyan
    FLIPPER: [0.7, 0.7, 0.75],
    PLUNGER: [0.6, 0.6, 0.65],
    LIGHT_STRIP_GREEN: [0.0, 1.0, 0.4],
    LIGHT_STRIP_YELLOW: [1.0, 0.9, 0.0],
    LIGHT_STRIP_RED: [1.0, 0.1, 0.1],
    NEON_PINK: [1.0, 0.133, 0.4],
    NEON_CYAN: [0.0, 0.9, 1.0],
    NEON_PURPLE: [0.6, 0.2, 1.0],
    BALL: [0.85, 0.85, 0.9],
    HUD_SCORE: [1.0, 1.0, 1.0],
    HUD_MULTIPLIER: [1.0, 0.667, 0.0],
};

// ── Camera ─────────────────────────────────────────────────────────────────
export const CAMERA = {
    FOV: 45,
    NEAR: 0.1,
    FAR: 200,
    POSITION: [0, 28, -8],
    TARGET: [0, 2, 0],
    SHAKE_COLLISION: 0.15,
    SHAKE_DRAIN: 0.3,
    SHAKE_DECAY: 8,       // How fast shake decays (per second)
};

// ── Bloom Post-Processing ──────────────────────────────────────────────────
export const BLOOM = {
    THRESHOLD: 0.5,
    BLUR_RADIUS: 1.0,
    STRENGTH: 0.6,
    BLOOM_DPR: 0.5,       // Half resolution for bloom passes
};

// ── Coordinate Conversion ──────────────────────────────────────────────────
// Convert 2D physics position (x, y on table surface) to 3D local position
// within the tilted table group transform.
export function physicsToLocal(x, y, height = 0) {
    return [x, height, y];
}

// Convert 2D physics position to world 3D position (including tilt).
export function physicsToWorld(x, y, height = 0) {
    const angle = TABLE.TILT_ANGLE;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    // Table is centered: shift Y by -HALF_L so center of table is at origin
    const cy = y - HALF_L;
    return [
        x,
        cy * sinA + height * cosA,
        -cy * cosA + height * sinA,
    ];
}

// ── Game States ────────────────────────────────────────────────────────────
export const GameState = {
    LAUNCH: 'launch',       // Ball in plunger, waiting for Space
    PLAYING: 'playing',     // Ball in play
    DRAINING: 'draining',   // Ball just drained, transitioning
    GAME_OVER: 'gameover',  // All balls lost
};
