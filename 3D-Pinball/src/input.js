// ============================================================================
// 3D Pinball — Input Handler
// Keyboard: Z=left flipper, M=right flipper, Space=plunger charge/release.
// ============================================================================

import { FLIPPER, PLUNGER } from './constants.js';

export class Input {
    constructor() {
        this.keys = {};
        this.flipperLeft = false;
        this.flipperRight = false;
        this.plungerCharging = false;
        this.plungerChargeStart = 0;
        this.plungerPower = 0;
        this.onPlungerRelease = null; // callback(power: 0-1)

        this._bind();
    }

    _bind() {
        window.addEventListener('keydown', (e) => {
            // Prevent default for game keys
            if (['KeyZ', 'KeyM', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
            if (this.keys[e.code]) return; // Ignore key repeat
            this.keys[e.code] = true;

            switch (e.code) {
                case 'KeyZ':
                case 'ArrowLeft':
                    this.flipperLeft = true;
                    break;
                case 'KeyM':
                case 'ArrowRight':
                    this.flipperRight = true;
                    break;
                case 'Space':
                    if (!this.plungerCharging) {
                        this.plungerCharging = true;
                        this.plungerChargeStart = performance.now() / 1000;
                    }
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            switch (e.code) {
                case 'KeyZ':
                case 'ArrowLeft':
                    this.flipperLeft = false;
                    break;
                case 'KeyM':
                case 'ArrowRight':
                    this.flipperRight = false;
                    break;
                case 'Space':
                    if (this.plungerCharging) {
                        this.plungerCharging = false;
                        const chargeTime = performance.now() / 1000 - this.plungerChargeStart;
                        const power = Math.min(1, chargeTime / PLUNGER.MAX_CHARGE_TIME);
                        if (this.onPlungerRelease) {
                            this.onPlungerRelease(power);
                        }
                        this.plungerPower = 0;
                    }
                    break;
            }
        });
    }

    // Get current plunger charge level (0-1)
    getPlungerCharge() {
        if (!this.plungerCharging) return 0;
        const chargeTime = performance.now() / 1000 - this.plungerChargeStart;
        return Math.min(1, chargeTime / PLUNGER.MAX_CHARGE_TIME);
    }
}
