import { moveToNotation } from './notation.js';

export class UI {
    constructor() {
        this.timerEl = document.getElementById('timer');
        this.movesEl = document.getElementById('moves-count');
        this.scrambleBtn = document.getElementById('btn-scramble');
        this.solveBtn = document.getElementById('btn-solve');
        this.undoBtn = document.getElementById('btn-undo');
        this.redoBtn = document.getElementById('btn-redo');
        this.scrambleFormulaEl = document.getElementById('scramble-formula');
        this.solutionFormulaEl = document.getElementById('solution-formula');
        this.solutionBarEl = document.getElementById('solution-bar');
        this.scrambleBarEl = document.getElementById('scramble-bar');

        this.startTime = null;
        this.timerRunning = false;
        this.timerRAF = null;

        this.onScramble = null;
        this.onSolve = null;
        this.onUndo = null;
        this.onRedo = null;

        this.solutionMoves = [];
        this.solutionCurrentIndex = 0;

        this._bindEvents();
        this.resetTimer();
    }

    _bindEvents() {
        this.scrambleBtn.addEventListener('click', () => {
            if (this.onScramble) this.onScramble();
        });
        this.solveBtn.addEventListener('click', () => {
            if (this.onSolve) this.onSolve();
        });
        this.undoBtn.addEventListener('click', () => {
            if (this.onUndo) this.onUndo();
        });
        this.redoBtn.addEventListener('click', () => {
            if (this.onRedo) this.onRedo();
        });
    }

    startTimer() {
        if (this.timerRunning) return;
        this.startTime = performance.now();
        this.timerRunning = true;
        this._tickTimer();
    }

    _tickTimer() {
        if (!this.timerRunning) return;
        const elapsed = performance.now() - this.startTime;
        this.timerEl.textContent = this._formatTime(elapsed);
        this.timerRAF = requestAnimationFrame(() => this._tickTimer());
    }

    stopTimer() {
        this.timerRunning = false;
        if (this.timerRAF) {
            cancelAnimationFrame(this.timerRAF);
            this.timerRAF = null;
        }
    }

    resetTimer() {
        this.stopTimer();
        this.startTime = null;
        this.timerEl.textContent = '0:00.00';
    }

    _formatTime(ms) {
        const totalSeconds = ms / 1000;
        const m = Math.floor(totalSeconds / 60);
        const s = Math.floor(totalSeconds % 60);
        const cs = Math.floor((ms % 1000) / 10);
        return `${m}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
    }

    setMoveCount(n) {
        this.movesEl.textContent = n;
    }

    setButtonsEnabled(scramble, solve, undo, redo) {
        this.scrambleBtn.disabled = !scramble;
        this.solveBtn.disabled = !solve;
        this.undoBtn.disabled = !undo;
        this.redoBtn.disabled = !redo;
    }

    setBusy(busy) {
        this.scrambleBtn.disabled = busy;
        this.solveBtn.disabled = busy;
        if (busy) {
            this.undoBtn.disabled = true;
            this.redoBtn.disabled = true;
        }
    }

    setScrambleFormula(notation) {
        this.scrambleFormulaEl.textContent = notation;
        this.scrambleBarEl.style.display = notation ? 'block' : 'none';
    }

    setSolutionFormula(moves, currentIndex = 0) {
        this.solutionMoves = Array.isArray(moves) ? moves : [];
        this.solutionCurrentIndex = currentIndex;
        this._renderSolution();
        this.solutionBarEl.style.display = this.solutionMoves.length ? 'block' : 'none';
    }

    updateSolutionHighlight(index) {
        this.solutionCurrentIndex = index;
        this._renderSolution();
    }

    _renderSolution() {
        const html = this.solutionMoves.map((move, i) => {
            const notation = typeof move === 'string' ? move : moveToNotation(move);
            const cls = i < this.solutionCurrentIndex
                ? 'executed'
                : i === this.solutionCurrentIndex
                    ? 'current'
                    : 'pending';
            return `<span class="${cls}">${notation}</span>`;
        }).join(' ');

        this.solutionFormulaEl.innerHTML = html;
    }

    hideSolution() {
        this.solutionBarEl.style.display = 'none';
    }
}
