// ============================================================================
// 3D Pinball — Audio System
// 8 Web Audio synthesized sound effects (no external audio files).
// ============================================================================

export class AudioSystem {
    constructor() {
        this.ctx = null;
        this.master = null;
        this.enabled = false;
    }

    // Must be called after user interaction (browser policy)
    init() {
        if (this.ctx) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.master = this.ctx.createGain();
            this.master.gain.value = 0.3;
            this.master.connect(this.ctx.destination);
            this.enabled = true;
        } catch (e) {
            console.warn('Web Audio not available', e);
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // ── Tone helper: oscillator with envelope ──────────────────────────────
    _tone(freq, dur, type = 'sine', vol = 0.5, when = 0, freqEnd = null) {
        if (!this.enabled) return;
        const t = this.ctx.currentTime + when;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        if (freqEnd !== null) {
            osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t + dur);
        }

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(vol, t + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        osc.connect(gain);
        gain.connect(this.master);
        osc.start(t);
        osc.stop(t + dur);
    }

    // ── Noise burst helper ─────────────────────────────────────────────────
    _noise(dur, vol = 0.3, filterFreq = 2000, when = 0) {
        if (!this.enabled) return;
        const t = this.ctx.currentTime + when;
        const bufferSize = this.ctx.sampleRate * dur;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = filterFreq;
        filter.Q.value = 2;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.master);
        source.start(t);
        source.stop(t + dur);
    }

    // ── Sound: Bumper Hit ──────────────────────────────────────────────────
    bumper() {
        this._tone(900, 0.15, 'sine', 0.4);
        this._tone(1350, 0.1, 'sine', 0.2, 0.01);
        this._noise(0.08, 0.15, 3000);
    }

    // ── Sound: Slingshot ───────────────────────────────────────────────────
    slingshot() {
        this._tone(500, 0.12, 'square', 0.25);
        this._tone(250, 0.15, 'sawtooth', 0.15, 0.01);
    }

    // ── Sound: Flipper ─────────────────────────────────────────────────────
    flipper() {
        this._tone(180, 0.06, 'square', 0.2);
        this._noise(0.04, 0.1, 800);
    }

    // ── Sound: Plunger Release ─────────────────────────────────────────────
    plunger() {
        this._tone(120, 0.3, 'sawtooth', 0.3, 0, 500);
        this._tone(240, 0.25, 'sine', 0.15, 0.05);
    }

    // ── Sound: Drain ───────────────────────────────────────────────────────
    drain() {
        this._tone(300, 0.6, 'sawtooth', 0.3, 0, 50);
        this._tone(150, 0.7, 'triangle', 0.15, 0.1, 30);
    }

    // ── Sound: Bonus ───────────────────────────────────────────────────────
    bonus() {
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        notes.forEach((f, i) => {
            this._tone(f, 0.2, 'sine', 0.3, i * 0.08);
        });
    }

    // ── Sound: Combo ───────────────────────────────────────────────────────
    combo() {
        this._tone(659, 0.15, 'sine', 0.3, 0);     // E5
        this._tone(880, 0.15, 'sine', 0.3, 0.08);  // A5
        this._tone(1047, 0.3, 'sine', 0.35, 0.16); // C6
        this._tone(1319, 0.3, 'sine', 0.25, 0.16); // E6
    }

    // ── Sound: Game Over ───────────────────────────────────────────────────
    gameOver() {
        const notes = [440, 392, 349, 262]; // A4, G4, F4, C4
        notes.forEach((f, i) => {
            this._tone(f, 0.4, 'sawtooth', 0.25, i * 0.2, f * 0.8);
        });
    }
}
