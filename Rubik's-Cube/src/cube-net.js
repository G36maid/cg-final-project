const COLORS = {
    W: '#ffffff',
    Y: '#ffd500',
    R: '#c41e3a',
    O: '#ff5800',
    G: '#009e60',
    B: '#0051ba',
};

export class CubeNet {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.cellSize = 14;
        this.gap = 1;
    }

    update(cubeState) {
        const facelets = cubeState.toFacelets();
        const ctx = this.ctx;
        const cs = this.cellSize;
        const gap = this.gap;

        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const faces = [
            { name: 'U', offset: [3, 0] },
            { name: 'L', offset: [0, 3] },
            { name: 'F', offset: [3, 3] },
            { name: 'R', offset: [6, 3] },
            { name: 'B', offset: [9, 3] },
            { name: 'D', offset: [3, 6] },
        ];

        const faceOrder = ['U', 'R', 'F', 'D', 'L', 'B'];

        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';

        for (let fi = 0; fi < 6; fi++) {
            const faceName = faceOrder[fi];
            const face = faces.find(entry => entry.name === faceName);
            const baseFaceletIdx = fi * 9;

            if (!face) continue;

            for (let row = 0; row < 3; row++) {
                for (let col = 0; col < 3; col++) {
                    const faceletIdx = baseFaceletIdx + row * 3 + col;
                    const char = facelets[faceletIdx];
                    const color = COLORS[char] || '#ff00ff';

                    const x = (face.offset[0] + col) * (cs + gap) + gap;
                    const y = (face.offset[1] + row) * (cs + gap) + gap;

                    ctx.fillStyle = color;
                    this._roundedRect(ctx, x, y, cs, cs, 2);
                    ctx.fill();
                    ctx.stroke();
                }
            }
        }
    }

    _roundedRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }
}
