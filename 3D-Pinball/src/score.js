// ============================================================================
// 3D Pinball — Scoring System
// Points, combos, ALL BUMPERS bonus, multiplier, ball save, ball count.
// ============================================================================

import { SCORE } from './constants.js';

export class ScoreSystem {
    constructor() {
        this.reset();
    }

    reset() {
        this.score = 0;
        this.balls = SCORE.INITIAL_BALLS;
        this.multiplier = 1.0;
        this.comboHits = 0;
        this.lastHitTime = -10;
        this.bumpersHitThisBall = new Set();
        this.allBumpersBonus = false;
        this.ballSaveTime = 0;
        this.ballSaveActive = false;
        this.messages = []; // {text, time, duration, color}
        this.scoreDisplay = 0; // Animated score for smooth counting
    }

    // Start ball save timer
    startBallSave() {
        this.ballSaveTime = SCORE.BALL_SAVE_TIME;
        this.ballSaveActive = true;
    }

    // Add points with multiplier
    addPoints(basePoints) {
        const points = Math.floor(basePoints * this.multiplier);
        this.score += points;

        // Update multiplier (every 5000 points = +0.1x, max 3.0x)
        const newMult = Math.min(
            SCORE.MULTIPLIER_MAX,
            1.0 + Math.floor(this.score / SCORE.MULTIPLIER_STEP) * SCORE.MULTIPLIER_INCREMENT
        );
        if (newMult > this.multiplier) {
            this.multiplier = newMult;
            this.addMessage(`MULTIPLIER ${newMult.toFixed(1)}x`, '#FFAA00', 2);
        }

        return points;
    }

    // Register a bumper hit (for combo and ALL BUMPERS tracking)
    registerBumperHit(bumperIndex, time) {
        // Combo tracking
        if (time - this.lastHitTime < SCORE.COMBO_WINDOW) {
            this.comboHits++;
        } else {
            this.comboHits = 1;
        }
        this.lastHitTime = time;

        // ALL BUMPERS tracking
        this.bumpersHitThisBall.add(bumperIndex);
        if (this.bumpersHitThisBall.size >= 3 && !this.allBumpersBonus) {
            this.allBumpersBonus = true;
            this.addPoints(SCORE.ALL_BUMPERS);
            this.addMessage('ALL BUMPERS! +1000', '#FF66AA', 2.5);
            return { combo: false, allBumpers: true };
        }

        // Combo bonus (3 hits within 2s)
        if (this.comboHits >= SCORE.COMBO_HITS) {
            this.comboHits = 0;
            this.addPoints(SCORE.COMBO_BONUS);
            this.addMessage(`COMBO! +${SCORE.COMBO_BONUS}`, '#FFFF44', 1.5);
            return { combo: true, allBumpers: false };
        }

        return { combo: false, allBumpers: false };
    }

    // Register reward channel completion
    registerRewardChannel() {
        this.addPoints(SCORE.REWARD_CHANNEL);
        this.addMessage('BONUS! +500', '#AA66FF', 2.5);
    }

    // Add a floating message
    addMessage(text, color, duration = 2) {
        this.messages.push({ text, color, time: performance.now() / 1000, duration });
    }

    // Get active messages (not expired)
    getActiveMessages(time) {
        return this.messages.filter(m => time - m.time < m.duration);
    }

    // Update ball save timer
    updateBallSave(dt) {
        if (this.ballSaveActive) {
            this.ballSaveTime -= dt;
            if (this.ballSaveTime <= 0) {
                this.ballSaveActive = false;
                this.ballSaveTime = 0;
            }
        }
    }

    // Called when ball drains
    onBallDrain() {
        if (this.ballSaveActive && this.ballSaveTime > 0) {
            // Ball saved!
            this.ballSaveActive = false;
            this.ballSaveTime = 0;
            this.addMessage('BALL SAVED!', '#44FF44', 2);
            return false; // Ball was saved, no life lost
        }

        // Lose a ball
        this.balls--;
        this.multiplier = 1.0; // Reset multiplier on drain
        this.comboHits = 0;
        this.bumpersHitThisBall.clear();
        this.allBumpersBonus = false;
        return true; // Ball was lost
    }

    // Animate score display
    updateScoreDisplay(dt) {
        if (this.scoreDisplay < this.score) {
            const diff = this.score - this.scoreDisplay;
            this.scoreDisplay += Math.max(1, diff * dt * 8);
            if (this.scoreDisplay > this.score) this.scoreDisplay = Math.floor(this.score);
        }
        return Math.floor(this.scoreDisplay);
    }

    get isGameOver() {
        return this.balls <= 0;
    }

    get ballSaveSeconds() {
        return Math.max(0, Math.ceil(this.ballSaveTime));
    }
}
