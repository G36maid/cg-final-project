// scramble.js — Random scramble sequence generator with WCA constraints
import { parseMove, isSameAxis, isSameFace, sequenceToString } from './notation.js';

/**
 * @param {number} length - Number of moves (default 20)
 * @returns {{ moves: Array, notation: string }}
 */
export function generateScramble(length = 20) {
    const faces = ['R', 'U', 'F', 'D', 'L', 'B'];
    const modifiers = ['', "'", '2'];
    const moves = [];

    for (let i = 0; i < length; i++) {
        let move;
        let attempts = 0;

        do {
            const face = faces[Math.floor(Math.random() * faces.length)];
            const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];
            move = parseMove(face + modifier);
            attempts++;
            if (attempts > 50) break;
        } while (
            (i >= 1 && isSameFace(move, moves[i - 1])) ||
            (i >= 2 && isSameAxis(move, moves[i - 1]) && isSameAxis(move, moves[i - 2]))
        );

        moves.push(move);
    }

    return { moves, notation: sequenceToString(moves) };
}
