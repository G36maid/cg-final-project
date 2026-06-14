// ============================================================================
// 3D Pinball — DOM UI
// HUD overlay: score, ball icons, multiplier, messages, ball save, game over.
// ============================================================================

export class UI {
    constructor() {
        this._create();
    }

    _create() {
        // Root container
        this.root = document.getElementById('hud');

        // Score display
        this.scoreEl = document.getElementById('hud-score');
        this.scoreLabel = document.getElementById('hud-score-label');

        // Ball icons
        this.ballsEl = document.getElementById('hud-balls');

        // Multiplier
        this.multEl = document.getElementById('hud-multiplier');

        // Messages
        this.messagesEl = document.getElementById('hud-messages');

        // Ball save
        this.ballSaveEl = document.getElementById('hud-ballsave');

        // Game over
        this.gameOverEl = document.getElementById('hud-gameover');
        this.gameOverScoreEl = document.getElementById('hud-gameover-score');
        this.restartBtn = document.getElementById('hud-restart');

        // Title screen
        this.titleEl = document.getElementById('hud-title');
        this.startBtn = document.getElementById('hud-start');

        // Plunger power bar
        this.plungerBar = document.getElementById('hud-plunger-bar');
        this.plungerContainer = document.getElementById('hud-plunger');
    }

    updateScore(score) {
        this.scoreEl.textContent = score.toLocaleString();
    }

    updateBalls(balls, maxBalls) {
        let html = '';
        for (let i = 0; i < maxBalls; i++) {
            if (i < balls) {
                html += '<span class="ball-icon active"></span>';
            } else {
                html += '<span class="ball-icon lost"></span>';
            }
        }
        this.ballsEl.innerHTML = html;
    }

    updateMultiplier(mult) {
        this.multEl.textContent = `${mult.toFixed(1)}x`;
        this.multEl.style.opacity = mult > 1.0 ? '1' : '0.3';
    }

    updateMessages(messages) {
        let html = '';
        for (const msg of messages) {
            const age = performance.now() / 1000 - msg.time;
            const alpha = Math.max(0, 1 - age / msg.duration);
            const yOffset = age * 30;
            html += `<div class="hud-msg" style="color:${msg.color};opacity:${alpha};transform:translateY(-${yOffset}px)">${msg.text}</div>`;
        }
        this.messagesEl.innerHTML = html;
    }

    updateBallSave(seconds) {
        if (seconds > 0) {
            this.ballSaveEl.textContent = `BALL SAVE: ${seconds}s`;
            this.ballSaveEl.style.opacity = '1';
        } else {
            this.ballSaveEl.style.opacity = '0';
        }
    }

    updatePlunger(power) {
        if (power > 0) {
            this.plungerContainer.style.opacity = '1';
            this.plungerBar.style.height = `${power * 100}%`;
        } else {
            this.plungerContainer.style.opacity = '0';
        }
    }

    showGameOver(score) {
        this.gameOverScoreEl.textContent = score.toLocaleString();
        this.gameOverEl.style.display = 'flex';
    }

    hideGameOver() {
        this.gameOverEl.style.display = 'none';
    }

    showTitle() {
        this.titleEl.style.display = 'flex';
    }

    hideTitle() {
        this.titleEl.style.display = 'none';
    }
}
