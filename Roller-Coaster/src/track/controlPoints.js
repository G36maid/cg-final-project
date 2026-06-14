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
    new Vec3(14, 10, -6),

    new Vec3(24, 10, -2),
    new Vec3(38, 12, 18),
    new Vec3(52, 20, 18),
    new Vec3(63, 18, 29),
    new Vec3(52, 16, 40),
    new Vec3(41, 14, 29),
    new Vec3(52, 12, 18),
    new Vec3(63, 10, 29),
    new Vec3(52, 8, 40),
    new Vec3(41, 6, 29),
    new Vec3(52, 5, 18),

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

    // Brake run: continue out of sCurve before the first wide semicircle
    new Vec3(-34, 8, 42),
    new Vec3(-36, 5, 50),
    new Vec3(-48, 3, 56),
    new Vec3(-62, 2, 54),
    new Vec3(-74, 2, 46),
    new Vec3(-80, 2, 32),
    new Vec3(-78, 2, 16),

    // Station straight (heading south, y=2)
    new Vec3(-76, 2, 0),
    new Vec3(-74, 2, -16),
    new Vec3(-72, 2, -30),

    // Second semicircle (SW turn back toward start)
    new Vec3(-74, 2, -42),
    new Vec3(-70, 2, -52),
    new Vec3(-62, 2, -56),
    new Vec3(-57, 2, -52),

    // Approach to lift hill start
    new Vec3(-55, 2, -45),
];

export const SEGMENTS = [
    { name: 'liftHill', startIndex: 0, endIndex: 5 },
    { name: 'drop', startIndex: 5, endIndex: 9 },
    { name: 'loop', startIndex: 9, endIndex: 20 },
    { name: 'helix', startIndex: 20, endIndex: 29 },
    { name: 'tunnel', startIndex: 29, endIndex: 34 },
    { name: 'camelHumps', startIndex: 34, endIndex: 41 },
    { name: 'sCurve', startIndex: 41, endIndex: 46 },
    { name: 'brakeRun', startIndex: 46, endIndex: 61 },
];
