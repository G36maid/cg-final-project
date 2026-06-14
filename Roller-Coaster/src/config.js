// Physics constants
export const GRAVITY = 9.8;
export const SPEED_MIN = 1.0;
export const SPEED_MAX = 80.0;
export const CHAIN_LIFT_SPEED = 3.0;
export const SPEED_SCALE = 3.0; // scene-units → m/s scaling

// Track resolution
export const TRACK_DIVISIONS = 512;

// Tunnel dimensions
export const TUNNEL_HALF_WIDTH = 6;   // bottom half-width → full width 12
export const TUNNEL_HEIGHT = 10;
export const TUNNEL_LIGHT_SPACING = 5; // orange light every 5 units

// Rail dimensions
export const RAIL_HALF_GAUGE = 0.7;
export const RAIL_RADIUS = 0.12;

// Vehicle
export const CAR_COUNT = 4;
export const CAR_LENGTH = 2.2;

// Camera transition
export const CAMERA_TRANSITION_DURATION = 0.5; // seconds

// Colors (linear RGB 0-1)
export const COLORS = {
    ROCK: [0.2, 0.133, 0.067],     // #332211
    RAIL: [0.6, 0.6, 0.65],
    CAR_BODY: [0.8, 0.15, 0.15],
    CAR_SEAT: [0.1, 0.1, 0.12],
    CAR_WHEEL: [0.08, 0.08, 0.08],
    TUNNEL_LIGHT: [1.0, 0.533, 0.0], // orange #ff8800
    GROUND: [0.15, 0.2, 0.12],
    SKY: [0.03, 0.05, 0.08],
};

// Skybox
export const SKYBOX_SIZE = 500;

// Light configuration
export const MAX_LIGHTS = 32;
