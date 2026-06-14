import { Transform } from '../../../ogl/src/index.js';
import { GridWireframe } from './GridWireframe.js';
import { Floor } from './Floor.js';
import { CornerBars } from './CornerBars.js';
import { PlacedBlocks } from './PlacedBlocks.js';
import { ActivePiece } from './ActivePiece.js';
import { GhostPiece } from './GhostPiece.js';
import { Particles } from './Particles.js';
import { DropRing } from './DropRing.js';

export class Scene {
    constructor(gl, tweenManager) {
        this.root = new Transform();
        this.tweenManager = tweenManager;

        this.cage = new GridWireframe(gl);
        this.floor = new Floor(gl);
        this.cornerBars = new CornerBars(gl);
        this.placedBlocks = new PlacedBlocks(gl);
        this.activePiece = new ActivePiece(gl, tweenManager);
        this.ghostPiece = new GhostPiece(gl);
        this.particles = new Particles(gl);
        this.dropRing = new DropRing(gl);

        this.cage.setParent(this.root);
        this.floor.setParent(this.root);
        this.cornerBars.setParent(this.root);
        this.placedBlocks.setParent(this.root);
        this.activePiece.setParent(this.root);
        this.ghostPiece.setParent(this.root);
        this.particles.setParent(this.root);
        this.dropRing.setParent(this.root);
    }

    sync(game) {
        this.placedBlocks.rebuild(game.grid.getOccupiedCells());

        if (game.piece && game.state === 'playing') {
            this.activePiece.sync(game.piece.getCells(), game.piece.color);
            this.ghostPiece.sync(game.piece.getGhostCells(game.grid), game.piece.color);
        } else {
            this.activePiece.sync(null);
            this.ghostPiece.sync(null);
        }
    }

    update(dt, time) {
        this.cornerBars.update(dt, time);
        this.placedBlocks.update(dt, time);
        this.activePiece.update(dt, time);
        this.ghostPiece.update(dt, time);
        this.particles.update(dt);
        this.dropRing.update(dt, time);
    }
}
