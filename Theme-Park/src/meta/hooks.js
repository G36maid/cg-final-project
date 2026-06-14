// 黃昏樂園 — 子遊戲共用 hook 模組
// 各子遊戲透過相對路徑 import 此模組
// 例：import { ... } from '../../Theme-Park/src/meta/hooks.js'

import { ECONOMY } from './store.js'

const STATE_KEY = 'dusk-park-state'
const FROM_HUB_PARAM = 'from'

export function isFromHub() {
    const params = new URLSearchParams(location.search)
    return params.get(FROM_HUB_PARAM) === 'hub'
}

export function getHubURL() {
    return '../Theme-Park/index.html?from=subgame'
}

export function returnToHub() {
    const fade = document.getElementById('fade')
    if (fade) {
        fade.classList.add('visible')
        setTimeout(() => { location.href = getHubURL() }, 450)
    } else {
        location.href = getHubURL()
    }
}

function loadState() {
    try {
        const raw = localStorage.getItem(STATE_KEY)
        if (!raw) return { tokens: 0, coasterRides: 0, gamesPlayed: { pinball: 0, rubiks: 0, tetris: 0 }, achievements: [] }
        return JSON.parse(raw)
    } catch {
        return { tokens: 0, coasterRides: 0, gamesPlayed: { pinball: 0, rubiks: 0, tetris: 0 }, achievements: [] }
    }
}

function saveState(state) {
    try { localStorage.setItem(STATE_KEY, JSON.stringify(state)) } catch {}
}

export function addTokens(amount) {
    const state = loadState()
    state.tokens = Math.max(0, state.tokens + amount)
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

export function injectBackButton(onBeforeReturn) {
    if (!isFromHub()) return null

    const btn = document.createElement('button')
    btn.textContent = '↩ 返回樂園'
    btn.id = 'back-to-hub'
    Object.assign(btn.style, {
        position: 'fixed',
        top: '16px',
        right: '16px',
        padding: '8px 16px',
        background: 'rgba(20, 15, 35, 0.85)',
        border: '1px solid rgba(255, 180, 120, 0.5)',
        borderRadius: '6px',
        color: '#ffb878',
        fontSize: '14px',
        cursor: 'pointer',
        zIndex: '1000',
        fontFamily: 'sans-serif',
    })
    btn.addEventListener('click', () => {
        if (typeof onBeforeReturn === 'function') onBeforeReturn()
        returnToHub()
    })
    document.body.appendChild(btn)
    return btn
}

export function showPayoutToast(amount) {
    const info = document.createElement('div')
    Object.assign(info.style, {
        position: 'fixed',
        bottom: '60px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '12px 24px',
        background: 'rgba(20, 15, 35, 0.9)',
        borderRadius: '8px',
        border: '1px solid rgba(255, 180, 120, 0.5)',
        color: '#ffb878',
        fontSize: '18px',
        fontWeight: '700',
        zIndex: '1001',
        fontFamily: 'sans-serif',
        textAlign: 'center',
    })
    info.textContent = `+ ${amount} Tokens`
    document.body.appendChild(info)
    setTimeout(() => { info.remove() }, 3000)
}

export { ECONOMY }
