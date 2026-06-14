// 黃昏樂園 — HUD 更新模組
import { loadState, hasWon } from './store.js'

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

    if (hasWon()) {
        showCelebration(state.coasterRides)
    }
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

let celebrationShown = false
let celebrationTimeout = null

function showCelebration(rides) {
    if (celebrationShown) return
    celebrationShown = true

    const overlay = document.createElement('div')
    overlay.id = 'celebration'
    Object.assign(overlay.style, {
        position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.6)', zIndex: '50',
        opacity: '0', transition: 'opacity 0.5s',
    })

    const title = document.createElement('h1')
    title.textContent = '🎉 導覽完成！'
    Object.assign(title.style, {
        fontSize: '42px', fontWeight: '200', letterSpacing: '6px',
        color: '#ffb878', textShadow: '0 0 20px rgba(255,184,120,0.5)',
        margin: '0 0 16px 0',
    })

    const subtitle = document.createElement('p')
    subtitle.textContent = `你完成了 ${rides} 趟雲霄飛車之旅`
    Object.assign(subtitle.style, {
        fontSize: '16px', color: 'rgba(255,255,255,0.7)', margin: '0 0 24px 0',
    })

    const continueBtn = document.createElement('button')
    continueBtn.textContent = '繼續探索'
    Object.assign(continueBtn.style, {
        padding: '10px 28px', background: 'transparent',
        border: '1px solid rgba(255,184,120,0.6)', borderRadius: '4px',
        color: '#ffb878', fontSize: '14px', letterSpacing: '2px',
        textTransform: 'uppercase', cursor: 'pointer',
    })
    continueBtn.addEventListener('click', () => {
        overlay.style.opacity = '0'
        setTimeout(() => overlay.remove(), 500)
    })

    overlay.appendChild(title)
    overlay.appendChild(subtitle)
    overlay.appendChild(continueBtn)
    document.body.appendChild(overlay)

    requestAnimationFrame(() => { overlay.style.opacity = '1' })

    celebrationTimeout = setTimeout(() => {
        if (document.body.contains(overlay)) {
            overlay.style.opacity = '0'
            setTimeout(() => overlay.remove(), 500)
        }
    }, 8000)
}