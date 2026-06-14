import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { parseMove, parseSequence, moveToNotation, sequenceToString, isSameAxis, isSameFace } from '../src/notation.js';

describe('Notation', () => {
    test('parseMove R', () => {
        const m = parseMove('R');
        assert.equal(m.face, 'R');
        assert.equal(m.axis, 0);
        assert.equal(m.layer, 1);
        assert.equal(m.turns, 1);
    });

    test('parseMove U\'', () => {
        const m = parseMove("U'");
        assert.equal(m.face, 'U');
        assert.equal(m.axis, 1);
        assert.equal(m.layer, 1);
        assert.equal(m.turns, -1);
    });

    test('parseMove F2', () => {
        const m = parseMove('F2');
        assert.equal(m.face, 'F');
        assert.equal(m.axis, 2);
        assert.equal(m.layer, 1);
        assert.equal(m.turns, 2);
    });

    test('parseSequence', () => {
        const moves = parseSequence("R U' F2");
        assert.equal(moves.length, 3);
        assert.equal(moves[0].face, 'R');
        assert.equal(moves[1].face, 'U');
        assert.equal(moves[2].face, 'F');
    });

    test('moveToNotation', () => {
        assert.equal(moveToNotation({ face: 'R', turns: 1 }), 'R');
        assert.equal(moveToNotation({ face: 'U', turns: -1 }), "U'");
        assert.equal(moveToNotation({ face: 'F', turns: 2 }), 'F2');
    });

    test('isSameAxis R L → true', () => {
        assert.equal(isSameAxis(parseMove('R'), parseMove('L')), true);
    });

    test('isSameAxis R U → false', () => {
        assert.equal(isSameAxis(parseMove('R'), parseMove('U')), false);
    });

    test('isSameFace R R2 → true', () => {
        assert.equal(isSameFace(parseMove('R'), parseMove('R2')), true);
    });
});
