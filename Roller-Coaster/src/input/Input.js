export class Input {
    constructor({ element = document } = {}) {
        this.element = element;
        this.modeCallback = null;
        this.mouseDownCallback = null;
        this.mouseMoveCallback = null;
        this.mouseUpCallback = null;
        this.pauseCallback = null;

        this._onKeyDown = this._onKeyDown.bind(this);
        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);

        this.element.addEventListener('keydown', this._onKeyDown);
        this.element.addEventListener('mousedown', this._onMouseDown);
        this.element.addEventListener('mousemove', this._onMouseMove);
        this.element.addEventListener('mouseup', this._onMouseUp);
    }

    onModeChange(callback) {
        this.modeCallback = callback;
    }

    onPauseToggle(callback) {
        this.pauseCallback = callback;
    }

    onMouseDown(callback) {
        this.mouseDownCallback = callback;
    }

    onMouseMove(callback) {
        this.mouseMoveCallback = callback;
    }

    onMouseUp(callback) {
        this.mouseUpCallback = callback;
    }

    destroy() {
        this.element.removeEventListener('keydown', this._onKeyDown);
        this.element.removeEventListener('mousedown', this._onMouseDown);
        this.element.removeEventListener('mousemove', this._onMouseMove);
        this.element.removeEventListener('mouseup', this._onMouseUp);
    }

    _onKeyDown(event) {
        const mode = Number(event.key);
        if (mode >= 1 && mode <= 5 && this.modeCallback) {
            this.modeCallback(mode);
        }
        if ((event.key === 'p' || event.key === 'P') && this.pauseCallback) {
            this.pauseCallback();
        }
    }

    _onMouseDown(event) {
        if (this.mouseDownCallback) {
            this.mouseDownCallback(event);
        }
    }

    _onMouseMove(event) {
        if (this.mouseMoveCallback) {
            this.mouseMoveCallback(event);
        }
    }

    _onMouseUp(event) {
        if (this.mouseUpCallback) {
            this.mouseUpCallback(event);
        }
    }
}
