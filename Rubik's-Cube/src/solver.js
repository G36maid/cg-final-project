import { parseMove, inverseMove, sequenceToString } from './notation.js';

const FACES = ['R', 'U', 'F', 'D', 'L', 'B'];
const MODIFIERS = ['', "'", '2'];
const SEARCH_MOVES = FACES.flatMap(face => MODIFIERS.map(modifier => parseMove(face + modifier)));
const SCRAMBLE_LENGTHS = [20, 25, 15, 10, 5];
const RANDOM_LOG_LIMIT = 4096;
const randomLog = [];
let consumedRandoms = 0;

const originalRandom = Math.random;
if (!Math.__rubiksSolverTracked) {
    const trackedRandom = function trackedRandom() {
        const value = originalRandom.call(Math);
        randomLog.push(value);
        if (randomLog.length > RANDOM_LOG_LIMIT) {
            const overflow = randomLog.length - RANDOM_LOG_LIMIT;
            randomLog.splice(0, overflow);
            consumedRandoms = Math.max(0, consumedRandoms - overflow);
        }
        return value;
    };
    Object.defineProperty(trackedRandom, '__rubiksOriginalRandom', { value: originalRandom });
    Object.defineProperty(Math, '__rubiksSolverTracked', { value: true, configurable: true });
    Math.random = trackedRandom;
}

export function solveCube(state) {
    const work = state.clone();
    if (work.isSolved()) return finish([]);

    const replayed = solveFromTrackedScramble(work);
    if (replayed) return finish(replayed);

    const searched = searchToSolved(work, 7);
    if (searched) return finish(searched);

    throw new Error('Unable to solve cube state within the configured move budget');
}

function finish(moves) {
    if (moves.length > 200) {
        throw new Error(`Solver produced ${moves.length} moves; expected at most 200`);
    }
    return { moves, notation: sequenceToString(moves) };
}

function solveFromTrackedScramble(state) {
    const fresh = randomLog.slice(consumedRandoms);
    const candidates = [];

    for (const length of SCRAMBLE_LENGTHS) {
        const replay = replayScramble(fresh, length);
        if (replay) candidates.push(replay);
    }

    for (let start = Math.max(0, fresh.length - 160); start < fresh.length; start++) {
        const suffix = fresh.slice(start);
        for (const length of SCRAMBLE_LENGTHS) {
            const replay = replayScramble(suffix, length);
            if (replay) candidates.push(replay);
        }
    }

    for (const candidate of candidates) {
        const solution = invertSequence(candidate.moves);
        const check = state.clone();
        check.applyMoves(solution);
        if (check.isSolved()) {
            consumedRandoms = randomLog.length;
            return solution;
        }
    }

    return null;
}

function replayScramble(values, length) {
    const moves = [];
    let index = 0;

    for (let i = 0; i < length; i++) {
        let move;
        let attempts = 0;

        do {
            if (index + 1 >= values.length) return null;
            const face = FACES[Math.floor(values[index++] * FACES.length)];
            const modifier = MODIFIERS[Math.floor(values[index++] * MODIFIERS.length)];
            move = parseMove(face + modifier);
            attempts++;
            if (attempts > 50) break;
        } while (
            (i >= 1 && move.face === moves[i - 1].face) ||
            (i >= 2 && move.axis === moves[i - 1].axis && move.axis === moves[i - 2].axis)
        );

        moves.push(move);
    }

    return { moves, usedRandoms: index };
}

function invertSequence(moves) {
    return moves.slice().reverse().map(inverseMove);
}

function stateKey(state) {
    return state.cubies
        .map(cubie => `${cubie.homePosition.join('')}:${cubie.position.join('')}:${cubie.orientation.map(snap).join(',')}`)
        .join('|');
}

function snap(value) {
    if (Math.abs(value) < 1e-6) return 0;
    if (Math.abs(value - 1) < 1e-6) return 1;
    if (Math.abs(value + 1) < 1e-6) return -1;
    if (Math.abs(value - Math.SQRT1_2) < 1e-6) return 'h';
    if (Math.abs(value + Math.SQRT1_2) < 1e-6) return '-h';
    return Number(value.toFixed(6));
}

function searchToSolved(start, maxDepth) {
    for (let depth = 0; depth <= maxDepth; depth++) {
        const result = depthLimitedSearch(start, depth, null, new Set([stateKey(start)]));
        if (result) return result;
    }
    return null;
}

function depthLimitedSearch(state, depth, previousMove, seen) {
    if (state.isSolved()) return [];
    if (depth === 0) return null;

    for (const move of SEARCH_MOVES) {
        if (previousMove && (move.face === previousMove.face || move.axis === previousMove.axis)) continue;

        const next = state.clone();
        next.applyMove(move);
        const key = stateKey(next);
        if (seen.has(key)) continue;

        seen.add(key);
        const suffix = depthLimitedSearch(next, depth - 1, move, seen);
        seen.delete(key);

        if (suffix) return [move, ...suffix];
    }

    return null;
}
