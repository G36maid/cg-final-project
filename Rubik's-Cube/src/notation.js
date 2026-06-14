// notation.js — Standard Rubik's cube move notation parser
// Handles R, U', F2, D, L', B... etc.

/**
 * @typedef {Object} MoveSpec
 * @property {'R'|'U'|'F'|'D'|'L'|'B'} face
 * @property {0|1|2} axis
 * @property {-1|0|1} layer
 * @property {1|2|-1} turns
 */

export const FACE_MAP = {
    R: { axis: 0, layer: 1 },
    L: { axis: 0, layer: -1 },
    U: { axis: 1, layer: 1 },
    D: { axis: 1, layer: -1 },
    F: { axis: 2, layer: 1 },
    B: { axis: 2, layer: -1 },
};

const VALID_TURNS = new Set([1, 2, -1]);

function makeMove(face, turns) {
    const mapping = FACE_MAP[face];
    if (!mapping) {
        throw new Error(`Invalid face: ${face}`);
    }
    if (!VALID_TURNS.has(turns)) {
        throw new Error(`Invalid turns: ${turns}`);
    }
    return {
        face,
        axis: mapping.axis,
        layer: mapping.layer,
        turns,
    };
}

export function parseMove(notation) {
    if (typeof notation !== 'string') {
        throw new Error('Move notation must be a string');
    }

    if (notation.length < 1 || notation.length > 2) {
        throw new Error(`Invalid move notation: ${notation}`);
    }

    const face = notation[0];
    const mapping = FACE_MAP[face];
    if (!mapping) {
        throw new Error(`Invalid move face: ${face}`);
    }

    let turns = 1;
    if (notation.length === 2) {
        const modifier = notation[1];
        if (modifier === "'") {
            turns = -1;
        } else if (modifier === '2') {
            turns = 2;
        } else {
            throw new Error(`Invalid move modifier: ${modifier}`);
        }
    }

    return makeMove(face, turns);
}

export function parseSequence(str) {
    if (str === '') {
        return [];
    }
    if (typeof str !== 'string') {
        throw new Error('Sequence must be a string');
    }

    const trimmed = str.trim();
    if (trimmed === '') {
        return [];
    }

    return trimmed.split(/\s+/).map(parseMove);
}

export function moveToNotation(move) {
    if (!move || typeof move.face !== 'string') {
        throw new Error('Invalid move object');
    }

    const turns = move.turns;
    if (turns === 1) return move.face;
    if (turns === -1) return `${move.face}'`;
    if (turns === 2) return `${move.face}2`;
    throw new Error(`Invalid move turns: ${turns}`);
}

export function sequenceToString(moves) {
    if (!Array.isArray(moves)) {
        throw new Error('Moves must be an array');
    }
    return moves.map(moveToNotation).join(' ');
}

export function isSameAxis(a, b) {
    return a.axis === b.axis;
}

export function isSameFace(a, b) {
    return a.face === b.face;
}

export function inverseMove(move) {
    if (!move || !VALID_TURNS.has(move.turns)) {
        throw new Error('Invalid move object');
    }

    const turns = move.turns === 1 ? -1 : move.turns === -1 ? 1 : 2;
    return {
        face: move.face,
        axis: move.axis,
        layer: move.layer,
        turns,
    };
}
