import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { CubeState } from '../src/cube-state.js';
import { solveCube } from '../src/solver.js';
import { generateScramble } from '../src/scramble.js';

describe('Solver', () => {
    test('solves a simple R move', () => {
        const state = new CubeState();
        state.rotateLayer(0, 1, 1); // R
        const result = solveCube(state);
        assert.ok(result.moves.length <= 200, `Too many moves: ${result.moves.length}`);

        // Apply solution
        const solved = new CubeState();
        solved.rotateLayer(0, 1, 1);
        for (const m of result.moves) {
            solved.rotateLayer(m.axis, m.layer, m.turns);
        }
        assert.equal(solved.isSolved(), true);
    });

    test('solves a 20-move scramble', () => {
        const state = new CubeState();
        const scramble = generateScramble(20);
        for (const m of scramble.moves) {
            state.rotateLayer(m.axis, m.layer, m.turns);
        }
        const result = solveCube(state);
        assert.ok(result.moves.length <= 200, `Too many moves: ${result.moves.length}`);

        for (const m of result.moves) {
            state.rotateLayer(m.axis, m.layer, m.turns);
        }
        assert.equal(state.isSolved(), true);
    });

    test('solves 10 random scrambles', () => {
        for (let i = 0; i < 10; i++) {
            const state = new CubeState();
            const scramble = generateScramble(20);
            for (const m of scramble.moves) {
                state.rotateLayer(m.axis, m.layer, m.turns);
            }
            const result = solveCube(state);
            assert.ok(result.moves.length <= 200, `Scramble ${i}: too many moves (${result.moves.length})`);

            for (const m of result.moves) {
                state.rotateLayer(m.axis, m.layer, m.turns);
            }
            assert.equal(state.isSolved(), true, `Scramble ${i} not solved`);
        }
    });
});
