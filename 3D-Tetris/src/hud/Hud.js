import { COLORS } from '../core/constants.js';

export class Hud {
    constructor() {
        this.elScore = document.getElementById('score');
        this.elLevel = document.getElementById('level');
        this.elLines = document.getElementById('lines');
        this.elNext = document.getElementById('next');
        this.elHold = document.getElementById('hold');
        this.elOverlay = document.getElementById('overlay');
        this.elOverlayText = document.getElementById('overlay-text');
    }

    update(game) {
        this.elScore.textContent = game.score.score.toLocaleString();
        this.elLevel.textContent = game.score.level;
        this.elLines.textContent = game.score.lines;

        const next = game.getNextQueue(3);
        this.elNext.innerHTML = next.map((type) =>
            `<span class="piece-badge" style="color:${COLORS[type]}">${type}</span>`
        ).join('');

        const held = game.getHeldType();
        this.elHold.innerHTML = held
            ? `<span class="piece-badge" style="color:${COLORS[held]}">${held}</span>`
            : '<span class="piece-badge dim">--</span>';
    }

    showPause() {
        this.elOverlay.classList.add('visible');
        this.elOverlayText.textContent = 'PAUSED';
    }

    showGameOver() {
        this.elOverlay.classList.add('visible');
        this.elOverlayText.textContent = 'GAME OVER';
    }

    hideOverlay() {
        this.elOverlay.classList.remove('visible');
    }
}
