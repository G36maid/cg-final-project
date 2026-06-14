import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { generateScramble } from '../src/scramble.js';
import { parseSequence, isSameAxis, isSameFace } from '../src/notation.js';

describe('Scramble', () => {
    test('generates 20 moves', () => {
        const result = generateScramble(20);
        assert.equal(result.moves.length, 20);
        assert.equal(typeof result.notation, 'string');
    });

    test('no consecutive same face', () => {
        const result = generateScramble(20);
        const moves = result.moves;
        for (let i = 1; i < moves.length; i++) {
            assert.equal(
                isSameFace(moves[i], moves[i - 1]),
                false,
                `Consecutive same face at ${i}: ${JSON.stringify(moves[i])} after ${JSON.stringify(moves[i - 1])}`
            );
        }
    });

    test('no three consecutive same axis', () => {
        const result = generateScramble(20);
        const moves = result.moves;
        for (let i = 2; i < moves.length; i++) {
            const sameAxis01 = isSameAxis(moves[i], moves[i - 1]);
            const sameAxis12 = isSameAxis(moves[i - 1], moves[i - 2]);
            assert.equal(
                sameAxis01 && sameAxis12,
                false,
                `Three consecutive same axis at ${i}`
            );
        }
    });

    test('different calls produce different sequences', () => {
        const a = generateScramble(20);
        const b = generateScramble(20);
        assert.notEqual(a.notation, b.notation);
    });
});
