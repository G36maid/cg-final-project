// 黃昏樂園 Dusk Park — 全域常數

// ===== Camera =====
export const CAMERA = {
    FOV: 65,
    NEAR: 0.1,
    FAR: 1000,
    INITIAL_POSITION: [0, 1.7, 18],
    INITIAL_LOOK_AT: [0, 1.7, 0],
};

// ===== Player (第一人稱控制器) =====
export const PLAYER = {
    EYE_HEIGHT: 1.7,
    MOVE_SPEED: 8,
    MOUSE_SENSITIVITY: 0.0022,
    THIRD_PERSON_DISTANCE: 6,
    THIRD_PERSON_HEIGHT: 3,
    COLLISION_RADIUS: 0.45,
};

// ===== World =====
export const WORLD = {
    GROUND_SIZE: 200,
    SKYBOX_SIZE: 500,
    CLEAR_COLOR: [0.04, 0.03, 0.06, 1],
};

// ===== 黃昏配色 =====
export const COLORS = {
    SKY_TOP: [0.04, 0.02, 0.09],
    SKY_HORIZON: [1.0, 0.63, 0.25],
    GROUND: [0.12, 0.10, 0.09],

    // 環境光（冷紫色調，呼應黃昏天空）
    AMBIENT: [0.12, 0.10, 0.18],

    // 方向填充光（低角度夕陽）
    SUN_DIR: [-0.4, 0.35, -0.7],
    SUN_COLOR: [1.0, 0.65, 0.38],
    SUN_INTENSITY: 0.35,

    // 路燈點光源
    LAMP_COLOR: [1.0, 0.85, 0.55],
    LAMP_INTENSITY: 1.8,

    // 噴泉裝飾光
    FOUNTAIN_COLOR: [0.45, 0.75, 1.0],
    FOUNTAIN_INTENSITY: 0.8,

    // 霓虹強調色
    NEON_PINK: [1.0, 0.3, 0.6],
    NEON_CYAN: [0.3, 0.9, 1.0],
    NEON_PURPLE: [0.7, 0.3, 1.0],
};

// ===== 點光源位置（路燈） =====
export const POINT_LIGHTS = [
    // 廣場周圍路燈
    { pos: [-12, 5, -8], color: COLORS.LAMP_COLOR, intensity: COLORS.LAMP_INTENSITY },
    { pos: [12, 5, -8], color: COLORS.LAMP_COLOR, intensity: COLORS.LAMP_INTENSITY },
    { pos: [-12, 5, 8], color: COLORS.LAMP_COLOR, intensity: COLORS.LAMP_INTENSITY },
    { pos: [12, 5, 8], color: COLORS.LAMP_COLOR, intensity: COLORS.LAMP_INTENSITY },
    // 中央噴泉裝飾光
    { pos: [0, 2.5, 0], color: COLORS.FOUNTAIN_COLOR, intensity: COLORS.FOUNTAIN_INTENSITY },
];

// ===== 設施位置與觸發區 =====
export const FACILITIES = {
    ARCADE_HALL: {
        pos: [-18, 0, -12],
        size: [14, 9, 12],
        trigger: { x: 8, z: 8 }, // 進門觸發半徑
        label: 'Arcade Hall',
        labelZh: '電子遊樂場',
        target: '../3D-Pinball/index.html?from=hub',
    },
    COASTER_STATION: {
        pos: [22, 0, -8],
        size: [12, 7, 10],
        trigger: { x: 8, z: 8 },
        label: 'Coaster Station',
        labelZh: '雲霄飛車站',
        target: '../Roller-Coaster/index.html?from=hub',
    },
    TOUR_TRAIN: {
        pos: [0, 0, -24],
        size: [10, 6, 8],
        trigger: { x: 8, z: 8 },
        label: 'Tour Train',
        labelZh: '繞園列車',
        target: null, // 內部場景，不跳頁
    },
    FOUNTAIN: {
        pos: [0, 0, 0],
        radius: 3.5,
    },
    INFO_BOARD: {
        pos: [0, 0, 22],
        size: [5, 3.5, 0.4],
    },
};

// ===== Token 經濟 =====
export const ECONOMY = {
    COASTER_COST: 20,
    WIN_RIDES: 3,
    PAYOUTS: {
        PINBALL_RATIO: 0.01, // 100 分 = 1 token
        RUBIKS_BASE: 30,
        TETRIS_PER_LINE: 3,
    },
};

// ===== Phong 材質預設值 =====
export const MATERIAL = {
    GROUND: {
        ambient: [0.15, 0.13, 0.16],
        diffuse: [0.35, 0.32, 0.30],
        specular: [0.15, 0.12, 0.10],
        shininess: 8,
    },
    BUILDING: {
        ambient: [0.20, 0.16, 0.20],
        diffuse: [0.55, 0.45, 0.50],
        specular: [0.30, 0.25, 0.28],
        shininess: 32,
    },
    METAL: {
        ambient: [0.10, 0.10, 0.12],
        diffuse: [0.30, 0.28, 0.32],
        specular: [0.90, 0.88, 0.92],
        shininess: 128,
    },
};
