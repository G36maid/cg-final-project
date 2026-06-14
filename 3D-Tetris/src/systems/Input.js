const KEY_MAP = {
    ArrowLeft: 'moveX_-1',
    ArrowRight: 'moveX_1',
    ArrowUp: 'moveZ_-1',
    ArrowDown: 'moveZ_1',
    KeyQ: 'rotateY_-1',
    KeyE: 'rotateY_1',
    KeyW: 'rotateX_1',
    KeyS: 'rotateX_-1',
    KeyA: 'rotateZ_-1',
    KeyD: 'rotateZ_1',
    Space: 'hardDrop',
    ShiftLeft: 'softDrop',
    ShiftRight: 'softDrop',
    KeyC: 'hold',
    KeyP: 'togglePause',
    KeyR: 'restart',
};

const REPEATABLE_ACTIONS = new Set([
    'moveX_-1',
    'moveX_1',
    'moveZ_-1',
    'moveZ_1',
    'rotateY_-1',
    'rotateY_1',
    'rotateX_1',
    'rotateX_-1',
    'rotateZ_-1',
    'rotateZ_1',
]);

const DAS_DELAY = 170;
const ARR_RATE = 50;

export class Input {
    constructor(game) {
        this.game = game;
        this.enabled = true;
        this.heldKeys = new Map();
        this._softDropHeld = 0;
        this._onKeyDown = this._onKeyDown.bind(this);
        this._onKeyUp = this._onKeyUp.bind(this);
        this._attached = false;
        this.attach();
    }

    attach() {
        if (this._attached) return;
        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('keyup', this._onKeyUp);
        this._attached = true;
    }

    detach() {
        if (!this._attached) return;
        window.removeEventListener('keydown', this._onKeyDown);
        window.removeEventListener('keyup', this._onKeyUp);
        this._attached = false;
    }

    _onKeyDown(e) {
        if (!this.enabled) return;

        const action = KEY_MAP[e.code];
        if (!action) return;

        e.preventDefault();

        if (action === 'softDrop') {
            if (this._softDropHeld === 0) this.game.actions.softDrop(true);
            this._softDropHeld += 1;
            return;
        }

        if (!REPEATABLE_ACTIONS.has(action)) {
            if (!e.repeat) this._dispatchAction(action);
            return;
        }

        if (this.heldKeys.has(e.code)) return;

        this.heldKeys.set(e.code, {
            action,
            timer: 0,
            phase: 'das',
        });
        this._dispatchAction(action);
    }

    _onKeyUp(e) {
        if (!this.enabled) return;

        const action = KEY_MAP[e.code];
        if (!action) return;

        e.preventDefault();

        if (action === 'softDrop') {
            this._softDropHeld = Math.max(0, this._softDropHeld - 1);
            if (this._softDropHeld === 0) this.game.actions.softDrop(false);
            return;
        }

        this.heldKeys.delete(e.code);
    }

    _dispatchAction(action) {
        const [name, rawDir] = action.split('_');
        const dir = rawDir ? parseInt(rawDir, 10) : 0;

        switch (name) {
            case 'moveX':
                this.game.actions.moveX(dir);
                break;
            case 'moveZ':
                this.game.actions.moveZ(dir);
                break;
            case 'rotateY':
                this.game.actions.rotateY(dir);
                break;
            case 'rotateX':
                this.game.actions.rotateX(dir);
                break;
            case 'rotateZ':
                this.game.actions.rotateZ(dir);
                break;
            case 'hardDrop':
                this.game.actions.hardDrop();
                break;
            case 'hold':
                this.game.actions.hold();
                break;
            case 'togglePause':
                this.game.actions.togglePause();
                break;
            case 'restart':
                this.game.actions.restart();
                break;
        }
    }

    update(dt) {
        if (!this.enabled) return;

        for (const state of this.heldKeys.values()) {
            state.timer += dt;

            if (state.phase === 'das') {
                if (state.timer >= DAS_DELAY) {
                    state.phase = 'arr';
                    state.timer = 0;
                    this._dispatchAction(state.action);
                }
            } else if (state.timer >= ARR_RATE) {
                state.timer = 0;
                this._dispatchAction(state.action);
            }
        }
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.heldKeys.clear();
            if (this._softDropHeld > 0) this.game.actions.softDrop(false);
            this._softDropHeld = 0;
        }
    }

    destroy() {
        this.detach();
        this.heldKeys.clear();
        if (this._softDropHeld > 0) this.game.actions.softDrop(false);
        this._softDropHeld = 0;
    }
}
