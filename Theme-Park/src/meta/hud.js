// 黃昏樂園 — HUD 更新模組
import { loadState } from './store.js'

const tokenCountEl = document.getElementById('token-count')
const ridesCountEl = document.getElementById('rides-count')
const promptEl = document.getElementById('prompt')
const crosshairEl = document.getElementById('crosshair')
const infoPanelEl = document.getElementById('info-panel')

let currentPrompt = null

export function updateHUD() {
    const state = loadState()
    if (tokenCountEl) tokenCountEl.textContent = state.tokens
    if (ridesCountEl) ridesCountEl.textContent = `Coaster rides: ${state.coasterRides}`
}

export function showPrompt(text) {
    if (promptEl && currentPrompt !== text) {
        promptEl.innerHTML = text
        promptEl.classList.add('visible')
        currentPrompt = text
    }
}

export function hidePrompt() {
    if (promptEl && currentPrompt !== null) {
        promptEl.classList.remove('visible')
        currentPrompt = null
    }
}

export function showCrosshair() {
    if (crosshairEl) crosshairEl.classList.add('visible')
}

export function hideCrosshair() {
    if (crosshairEl) crosshairEl.classList.remove('visible')
}

export function toggleInfoPanel() {
    if (infoPanelEl) {
        infoPanelEl.classList.toggle('visible')
    }
}

export function hideInfoPanel() {
    if (infoPanelEl) {
        infoPanelEl.classList.remove('visible')
    }
}

export function isInfoPanelVisible() {
    return infoPanelEl && infoPanelEl.classList.contains('visible')
}