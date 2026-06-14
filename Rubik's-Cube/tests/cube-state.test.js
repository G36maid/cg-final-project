import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { CubeState } from '../src/cube-state.js';

describe('CubeState', () => {
    test('should create 26 cubies in solved state', () => {
        const state = new CubeState();
        assert.equal(state.cubies.length, 26);
    });

    test('should be solved on init', () => {
        const state = new CubeState();
        assert.equal(state.isSolved(), true);
    });

    test('R x4 returns to solved', () => {
        const state = new CubeState();
        state.rotateLayer(0, 1, 1); // R
        state.rotateLayer(0, 1, 1); // R
        state.rotateLayer(0, 1, 1); // R
        state.rotateLayer(0, 1, 1); // R
        assert.equal(state.isSolved(), true);
    });

    test('(R U R\' U\') x6 returns to solved', () => {
        const state = new CubeState();
        for (let i = 0; i < 6; i++) {
            state.rotateLayer(0, 1, 1);  // R
            state.rotateLayer(1, 1, 1);  // U
            state.rotateLayer(0, 1, -1); // R'
            state.rotateLayer(1, 1, -1); // U'
        }
        assert.equal(state.isSolved(), true);
    });

    test('getLayer returns correct count', () => {
        const state = new CubeState();
        const topLayer = state.getLayer(1, 1); // y=1
        assert.equal(topLayer.length, 9);
    });

    test('rotateLayer changes positions', () => {
        const state = new CubeState();
        const before = state.cubies.map(c => [...c.position]);
        state.rotateLayer(0, 1, 1); // R
        const after = state.cubies.map(c => [...c.position]);
        // At least some positions should change
        const changed = before.some((b, i) =>
            b[0] !== after[i][0] || b[1] !== after[i][1] || b[2] !== after[i][2]
        );
        assert.equal(changed, true);
    });
});
