import { Vec3 } from '../../ogl/src/index.js';

export const CONTROL_POINTS = [
    new Vec3(-55, 2, -45),
    new Vec3(-52, 10, -38),
    new Vec3(-48, 24, -31),
    new Vec3(-43, 40, -24),
    new Vec3(-37, 60, -17),
    new Vec3(-30, 80, -10),

    new Vec3(-20, 68, -7),
    new Vec3(-8, 42, -4),
    new Vec3(2, 18, 0),
    new Vec3(10, 10, 4),

    new Vec3(14, 10, 8),
    new Vec3(14, 20, 25),
    new Vec3(14, 40, 28),
    new Vec3(14, 57, 18),
    new Vec3(14, 60, 0),
    new Vec3(14, 50, -17),
    new Vec3(14, 30, -20),
    new Vec3(14, 13, -10),
    new Vec3(14, 10, 8),

    new Vec3(30, 20, 8),
    new Vec3(41, 18, 19),
    new Vec3(30, 16, 30),
    new Vec3(19, 14, 19),
    new Vec3(30, 12, 8),
    new Vec3(41, 10, 19),
    new Vec3(30, 8, 30),
    new Vec3(19, 6, 19),
    new Vec3(30, 5, 8),

    new Vec3(35, 6, -2),
    new Vec3(40, 6, -18),
    new Vec3(44, 6, -34),
    new Vec3(47, 6, -50),
    new Vec3(50, 7, -60),

    new Vec3(34, 9, -56),
    new Vec3(22, 28, -50),
    new Vec3(10, 9, -46),
    new Vec3(-2, 27, -40),
    new Vec3(-14, 9, -36),
    new Vec3(-26, 26, -31),
    new Vec3(-38, 9, -27),

    new Vec3(-50, 10, -18),
    new Vec3(-58, 10, -4),
    new Vec3(-44, 10, 10),
    new Vec3(-56, 10, 24),
    new Vec3(-42, 10, 36),

    // Brake run: descend + first semicircle (NW turn, radius ~14)
    new Vec3(-50, 6, 33),
    new Vec3(-57, 3, 26),
    new Vec3(-63, 2, 18),
    new Vec3(-68, 2, 10),
    new Vec3(-70, 2, 0),
    new Vec3(-68, 2, -10),

    // Station straight (heading south, parallel to lift hill, offset west)
    new Vec3(-65, 2, -18),
    new Vec3(-64, 2, -28),

    // Second semicircle (SW turn, radius ~14)
    new Vec3(-67, 2, -35),
    new Vec3(-68, 2, -42),
    new Vec3(-65, 2, -48),
    new Vec3(-60, 2, -50),

    // Approach to lift hill start
    new Vec3(-55, 2, -45),
];

export const SEGMENTS = [
    { name: 'liftHill', startIndex: 0, endIndex: 5 },
    { name: 'drop', startIndex: 5, endIndex: 9 },
    { name: 'loop', startIndex: 9, endIndex: 18 },
    { name: 'helix', startIndex: 18, endIndex: 27 },
    { name: 'tunnel', startIndex: 27, endIndex: 32 },
    { name: 'camelHumps', startIndex: 32, endIndex: 39 },
    { name: 'sCurve', startIndex: 39, endIndex: 44 },
    { name: 'brakeRun', startIndex: 44, endIndex: 60 },
];
