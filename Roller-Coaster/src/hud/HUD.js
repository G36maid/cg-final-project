export class HUD {
    constructor({ canvas }) {
        this.ctx = canvas.getContext('2d');
        this.w = 0;
        this.h = 0;
        this.paused = false;
    }

    resize(w, h) {
        this.w = w;
        this.h = h;
    }

    setPaused(p) {
        this.paused = !!p;
    }

    update({ speed = 0, height = 0, gForce = 0, completion = 0, mode = 1 } = {}) {
        const ctx = this.ctx;
        const w = this.w;
        const h = this.h;

        ctx.clearRect(0, 0, w, h);

        const x = 12;
        const y = 12;
        const boxW = 220;
        const boxH = 140;
        const pad = 12;
        const textX = x + pad;
        const modeY = y + pad;
        const lineGap = 20;

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(x, y, boxW, boxH);

        ctx.fillStyle = '#fff';
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        ctx.font = '14px monospace';

        const modeNames = {
            1: 'First Person',
            2: 'Third Person',
            3: 'Side Track',
            4: 'Free Orbit',
            5: 'Cinematic',
        };

        ctx.fillText(modeNames[mode] || 'Unknown', textX, modeY);

        const speedKmh = Math.round(speed * 3.6 * 3.0); // SPEED_SCALE = 3.0 from config
        const heightM = Math.round(height);
        const completionPct = Math.round(completion * 100);

        ctx.fillText(`Speed:    ${speedKmh} km/h`, textX, modeY + lineGap);
        ctx.fillText(`Height:   ${heightM} m`, textX, modeY + lineGap * 2);
        ctx.fillText(`G-Force:  ${gForce.toFixed(2)} G`, textX, modeY + lineGap * 3);
        ctx.fillText(`Track:    ${completionPct}%`, textX, modeY + lineGap * 4);

        ctx.restore();

        if (this.paused) {
            ctx.save();
            ctx.fillStyle = 'rgba(255, 80, 80, 0.85)';
            ctx.font = 'bold 16px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⏸ PAUSED  (press P to resume)', w / 2, 24);
            ctx.restore();
        }
    }
}
