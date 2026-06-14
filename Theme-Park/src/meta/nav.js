// 黃昏樂園 — 場景切換導航模組
const fadeEl = document.getElementById('fade')

export function navigateTo(url) {
    if (!fadeEl) {
        location.href = url
        return
    }
    fadeEl.classList.add('visible')
    setTimeout(() => {
        location.href = url
    }, 450)
}

export function fadeOut() {
    if (fadeEl) fadeEl.classList.add('visible')
}

export function fadeIn() {
    if (fadeEl) fadeEl.classList.remove('visible')
}

// Build sub-game URLs with hub return flag
export function getArcadePinballURL() {
    return '../3D-Pinball/index.html?from=hub'
}

export function getArcadeRubiksURL() {
    return '../Rubik\'s-Cube/index.html?from=hub'
}

export function getArcadeTetrisURL() {
    return '../3D-Tetris/index.html?from=hub'
}

export function getCoasterURL() {
    return '../Roller-Coaster/index.html?from=hub'
}

// Check if we returned from a sub-game
export function cameFromSubGame() {
    const params = new URLSearchParams(location.search)
    return params.get('from') !== null
}