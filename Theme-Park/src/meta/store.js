// 黃昏樂園 — localStorage 狀態持久化
import { ECONOMY } from '../constants.js'

const STORAGE_KEY = 'dusk-park-state'

const DEFAULT_STATE = {
    tokens: 0,
    coasterRides: 0,
    gamesPlayed: {
        pinball: 0,
        rubiks: 0,
        tetris: 0,
    },
    achievements: [],
}

export function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return { ...DEFAULT_STATE }
        const parsed = JSON.parse(raw)
        return {
            tokens: parsed.tokens ?? 0,
            coasterRides: parsed.coasterRides ?? 0,
            gamesPlayed: {
                pinball: parsed.gamesPlayed?.pinball ?? 0,
                rubiks: parsed.gamesPlayed?.rubiks ?? 0,
                tetris: parsed.gamesPlayed?.tetris ?? 0,
            },
            achievements: parsed.achievements ?? [],
        }
    } catch {
        return { ...DEFAULT_STATE }
    }
}

export function saveState(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
        // Storage full or unavailable — silently fail
    }
}

export function addTokens(amount) {
    const state = loadState()
    state.tokens = Math.max(0, state.tokens + amount)
    saveState(state)
    return state
}

export function spendTokens(amount) {
    const state = loadState()
    if (state.tokens < amount) return null
    state.tokens -= amount
    saveState(state)
    return state
}

export function recordCoasterRide() {
    const state = loadState()
    state.coasterRides++
    saveState(state)
    return state
}

export function recordGamePlayed(game) {
    const state = loadState()
    if (state.gamesPlayed[game] !== undefined) {
        state.gamesPlayed[game]++
    }
    saveState(state)
    return state
}

export function hasWon() {
    const state = loadState()
    return state.coasterRides >= ECONOMY.WIN_RIDES
}

// Hook for sub-games: read payout config
export { ECONOMY }