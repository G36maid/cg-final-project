// cube-state.js — Pure-data Rubik's Cube state model (no OGL dependency)

const AXIS_VECTORS = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
];

const FACE_DEFS = [
    { normal: [0, 1, 0], rows: [1, 0, -1], cols: [-1, 0, 1], rowAxis: 2, colAxis: 0 },
    { normal: [1, 0, 0], rows: [1, 0, -1], cols: [1, 0, -1], rowAxis: 1, colAxis: 2 },
    { normal: [0, 0, 1], rows: [1, 0, -1], cols: [-1, 0, 1], rowAxis: 1, colAxis: 0 },
    { normal: [0, -1, 0], rows: [-1, 0, 1], cols: [-1, 0, 1], rowAxis: 2, colAxis: 0 },
    { normal: [-1, 0, 0], rows: [1, 0, -1], cols: [-1, 0, 1], rowAxis: 1, colAxis: 2 },
    { normal: [0, 0, -1], rows: [1, 0, -1], cols: [1, 0, -1], rowAxis: 1, colAxis: 0 },
];

function quatMultiply(a, b) {
    return [
        a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
        a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
        a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
        a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
    ];
}

function quatFromAxisAngle(axis, angle) {
    const half = angle / 2;
    const s = Math.sin(half);
    return [axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(half)];
}

function quatConjugate(q) {
    return [-q[0], -q[1], -q[2], q[3]];
}

function vec3ApplyQuat(v, q) {
    const uv = [
        q[1] * v[2] - q[2] * v[1],
        q[2] * v[0] - q[0] * v[2],
        q[0] * v[1] - q[1] * v[0],
    ];
    const uuv = [
        q[1] * uv[2] - q[2] * uv[1],
        q[2] * uv[0] - q[0] * uv[2],
        q[0] * uv[1] - q[1] * uv[0],
    ];
    return [
        v[0] + 2 * (uv[0] * q[3] + uuv[0]),
        v[1] + 2 * (uv[1] * q[3] + uuv[1]),
        v[2] + 2 * (uv[2] * q[3] + uuv[2]),
    ];
}

function quatNormalize(q) {
    const len = Math.sqrt(q[0] * q[0] + q[1] * q[1] + q[2] * q[2] + q[3] * q[3]);
    if (len === 0) return [0, 0, 0, 1];

    const normalized = [q[0] / len, q[1] / len, q[2] / len, q[3] / len];
    return normalized[3] < 0 ? normalized.map(value => -value) : normalized;
}

function rotatePosition(pos, axis, turns) {
    let [x, y, z] = pos;
    const times = ((turns % 4) + 4) % 4;
    for (let i = 0; i < times; i++) {
        if (axis === 0) [y, z] = [z, -y];
        else if (axis === 1) [x, z] = [z, -x];
        else [x, y] = [-y, x];
    }
    return [x, y, z];
}

function snapToCardinal(v) {
    const abs = [Math.abs(v[0]), Math.abs(v[1]), Math.abs(v[2])];
    const maxIdx = abs.indexOf(Math.max(...abs));
    const result = [0, 0, 0];
    result[maxIdx] = Math.sign(v[maxIdx]) || 1;
    return result;
}

function directionKey(dir) {
    if (dir[0] !== 0) return dir[0] > 0 ? '+x' : '-x';
    if (dir[1] !== 0) return dir[1] > 0 ? '+y' : '-y';
    return dir[2] > 0 ? '+z' : '-z';
}

function getStickerForFace(cubie, faceNormal) {
    const invOrient = quatConjugate(cubie.orientation);
    const localDir = vec3ApplyQuat(faceNormal, invOrient);
    const homeDir = snapToCardinal(localDir);
    return cubie.stickers[directionKey(homeDir)] || null;
}

function cubieAt(cubies, position) {
    return cubies.find(cubie =>
        cubie.position[0] === position[0] &&
        cubie.position[1] === position[1] &&
        cubie.position[2] === position[2]
    );
}

export class CubeState {
    constructor() {
        this.cubies = [];
        this._init();
    }

    _init() {
        this.cubies = [];

        for (const x of [-1, 0, 1]) {
            for (const y of [-1, 0, 1]) {
                for (const z of [-1, 0, 1]) {
                    if (x === 0 && y === 0 && z === 0) continue;

                    const stickers = {};
                    if (x === 1) stickers['+x'] = 'R';
                    else if (x === -1) stickers['-x'] = 'O';
                    if (y === 1) stickers['+y'] = 'W';
                    else if (y === -1) stickers['-y'] = 'Y';
                    if (z === 1) stickers['+z'] = 'G';
                    else if (z === -1) stickers['-z'] = 'B';

                    this.cubies.push({
                        homePosition: [x, y, z],
                        position: [x, y, z],
                        orientation: [0, 0, 0, 1],
                        stickers,
                    });
                }
            }
        }
    }

    rotateLayer(axis, layer, turns) {
        const axisVec = AXIS_VECTORS[axis];
        if (!axisVec) throw new RangeError('axis must be 0, 1, or 2');
        if (![-1, 0, 1].includes(layer)) throw new RangeError('layer must be -1, 0, or 1');
        if (![1, 2, -1].includes(turns)) throw new RangeError('turns must be 1, 2, or -1');

        const moveQuat = quatFromAxisAngle(axisVec, turns * (Math.PI / 2));
        for (const cubie of this.getLayer(axis, layer)) {
            cubie.position = rotatePosition(cubie.position, axis, turns);
            cubie.orientation = quatNormalize(quatMultiply(moveQuat, cubie.orientation));
        }
    }

    getLayer(axis, layer) {
        return this.cubies.filter(cubie => cubie.position[axis] === layer);
    }

    toFacelets() {
        const facelets = [];

        for (const face of FACE_DEFS) {
            for (const row of face.rows) {
                for (const col of face.cols) {
                    const position = [...face.normal];
                    position[face.rowAxis] = row;
                    position[face.colAxis] = col;

                    const cubie = cubieAt(this.cubies, position);
                    const sticker = cubie ? getStickerForFace(cubie, face.normal) : null;
                    facelets.push(sticker || '?');
                }
            }
        }

        return facelets.join('');
    }

    isSolved() {
        return this.cubies.every(cubie =>
            cubie.position[0] === cubie.homePosition[0] &&
            cubie.position[1] === cubie.homePosition[1] &&
            cubie.position[2] === cubie.homePosition[2] &&
            Math.abs(cubie.orientation[0]) < 0.01 &&
            Math.abs(cubie.orientation[1]) < 0.01 &&
            Math.abs(cubie.orientation[2]) < 0.01 &&
            Math.abs(Math.abs(cubie.orientation[3]) - 1) < 0.01
        );
    }

    reset() {
        for (const cubie of this.cubies) {
            cubie.position = [...cubie.homePosition];
            cubie.orientation = [0, 0, 0, 1];
        }
    }

    clone() {
        const copy = Object.create(CubeState.prototype);
        copy.cubies = this.cubies.map(cubie => ({
            homePosition: [...cubie.homePosition],
            position: [...cubie.position],
            orientation: [...cubie.orientation],
            stickers: { ...cubie.stickers },
        }));
        return copy;
    }

    applyMove(move) {
        this.rotateLayer(move.axis, move.layer, move.turns);
    }

    applyMoves(moves) {
        for (const move of moves) this.applyMove(move);
    }
}

export {
    quatMultiply,
    quatFromAxisAngle,
    quatConjugate,
    vec3ApplyQuat,
    quatNormalize,
    rotatePosition,
    snapToCardinal,
    getStickerForFace,
};
