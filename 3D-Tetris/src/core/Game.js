import { Grid } from './Grid.js';
import { Piece } from './Piece.js';
import { PieceBag } from './PieceBag.js';
import { Score } from './Score.js';

export class Game {
    constructor() {
        this.grid = new Grid();
        this.bag = new PieceBag();
        this.score = new Score();
        this.piece = null;
        this.heldPieceType = null;
        this.canHold = true;
        this.softDropActive = false;
        this.state = 'playing';

        this.onPieceSpawn = null;
        this.onPieceMove = null;
        this.onPieceLock = null;
        this.onLayersCleared = null;
        this.onHardDrop = null;
        this.onGameOver = null;
        this.onStateChange = null;

        this._spawnNext();
    }

    get actions() {
        const self = this;
        return {
            moveX(dx) { self._moveX(dx); },
            moveZ(dz) { self._moveZ(dz); },
            rotateY(dir) { self._rotate('y', dir); },
            rotateX(dir) { self._rotate('x', dir); },
            rotateZ(dir) { self._rotate('z', dir); },
            hardDrop() { self._hardDrop(); },
            softDrop(active) { self._softDrop(active); },
            hold() { self._hold(); },
            togglePause() { self._togglePause(); },
            restart() { self._restart(); },
        };
    }

    _spawnNext() {
        const type = this.bag.next();
        this.piece = new Piece(type);
        this.canHold = true;

        if (!this.grid.isValid(this.piece.getCells())) {
            this._setGameOver();
            return;
        }

        if (this.onPieceSpawn) this.onPieceSpawn(this.piece);
    }

    _checkPlaying() {
        return this.state === 'playing';
    }

    _moveX(dx) {
        if (!this._checkPlaying()) return;
        if (this.piece.tryMove(dx, 0, this.grid) && this.onPieceMove) this.onPieceMove(this.piece);
    }

    _moveZ(dz) {
        if (!this._checkPlaying()) return;
        if (this.piece.tryMove(0, dz, this.grid) && this.onPieceMove) this.onPieceMove(this.piece);
    }

    _rotate(axis, dir) {
        if (!this._checkPlaying()) return;
        if (this.piece.tryRotate(axis, dir, this.grid) && this.onPieceMove) this.onPieceMove(this.piece);
    }

    _hardDrop() {
        if (!this._checkPlaying()) return;

        let dropCells = 0;
        while (this.piece.tryDescend(this.grid)) dropCells++;
        this.score.addHardDrop(dropCells);

        if (this.onHardDrop) this.onHardDrop(this.piece.y, this.piece.color, this.piece);

        this._lockPiece();
    }

    _softDrop(active) {
        this.softDropActive = active;
    }

    _hold() {
        if (!this._checkPlaying() || !this.canHold) return;

        const currentType = this.piece.type;
        if (this.heldPieceType) {
            this.piece = new Piece(this.heldPieceType);
            this.heldPieceType = currentType;
            this.canHold = false;

            if (!this.grid.isValid(this.piece.getCells())) {
                this._setGameOver();
                return;
            }

            if (this.onPieceSpawn) this.onPieceSpawn(this.piece);
            return;
        }

        this.heldPieceType = currentType;
        this._spawnNext();
        this.canHold = false;
    }

    _togglePause() {
        if (this.state === 'playing') {
            this.state = 'paused';
            if (this.onStateChange) this.onStateChange('paused');
        } else if (this.state === 'paused') {
            this.state = 'playing';
            if (this.onStateChange) this.onStateChange('playing');
        }
    }

    _restart() {
        this.grid.clear();
        this.score.reset();
        this.heldPieceType = null;
        this.canHold = true;
        this.softDropActive = false;
        this.state = 'playing';
        this.bag = new PieceBag();

        if (this.onStateChange) this.onStateChange('playing');
        this._spawnNext();
    }

    stepGravity() {
        if (this.state !== 'playing') return;

        if (this.piece.tryDescend(this.grid)) {
            if (this.softDropActive) this.score.addSoftDrop(1);
            if (this.onPieceMove) this.onPieceMove(this.piece);
        } else {
            this._lockPiece();
        }
    }

    _lockPiece() {
        const cells = this.piece.getCells();
        this.grid.lock(cells, this.piece.typeId);

        if (this.onPieceLock) this.onPieceLock(this.piece, cells);

        const cleared = this.grid.clearFullLayers();
        if (cleared.length > 0) {
            this.score.addClear(cleared.length);
            if (this.onLayersCleared) this.onLayersCleared(cleared);
        }

        this._spawnNext();
    }

    _setGameOver() {
        this.state = 'gameover';
        this.softDropActive = false;
        if (this.onStateChange) this.onStateChange('gameover');
        if (this.onGameOver) this.onGameOver();
        window.dispatchEvent(new CustomEvent('dusk-park-gameover', { detail: { lines: this.score.lines } }));
    }

    getNextQueue(n = 3) {
        return this.bag.peek(n);
    }

    getHeldType() {
        return this.heldPieceType;
    }
}
