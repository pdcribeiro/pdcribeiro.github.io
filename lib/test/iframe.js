const IFRAME_ID = 'test-iframe'
const TOGGLE_ID = 'test-toggle-button'
const MAX_Z_INDEX = 2147483647

let iframe

export let load = (url) => new Promise((resolve, reject) => {
    iframe = getOrCreateIframe()
    iframe.onload = () => resolve(iframe)
    iframe.onerror = () => reject(new Error(`Failed to load ${url}.`))
    iframe.removeAttribute('srcdoc')
    iframe.src = url
})

export let reload = () => new Promise((resolve, reject) => {
    iframe = getOrCreateIframe()
    iframe.onload = () => resolve(iframe)
    iframe.onerror = () => reject(new Error('Failed to reload.'))
    iframe.contentWindow.location.reload()
})

export let setHtml = (html) => new Promise((resolve, reject) => {
    iframe = getOrCreateIframe()
    iframe.onload = () => resolve(iframe)
    iframe.onerror = () => reject(new Error('Failed to set HTML.'))
    iframe.srcdoc = `
        <!doctype html>
        <html lang="en">
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body>${html}</body>
        </html>
    `
})

export let remove = () => {
    document.getElementById(IFRAME_ID)?.remove()
    document.getElementById(TOGGLE_ID)?.remove()
    iframe = null
}

function getOrCreateIframe() {
    return document.getElementById(IFRAME_ID) ?? createIframe()
}

const iframeStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    visibility: 'hidden',
    zIndex: MAX_Z_INDEX,
    width: '100vw',
    height: '100vh',
    border: '0.5rem dashed gray',
}
const toggleButtonStyle = {
    position: 'absolute',
    top: '2rem',
    left: '50%',
    zIndex: MAX_Z_INDEX,
    padding: '0.5rem 1rem',
    margin: 0,
    fontSize: '1rem',
    border: '1px solid gray',
    opacity: '50%',
    transform: 'translateX(-50%)',
}

function createIframe() {
    const iframe = document.createElement('iframe')
    iframe.id = IFRAME_ID
    setStyle(iframe, iframeStyle)
    document.body.appendChild(iframe)

    const toggleButton = document.createElement('button')
    toggleButton.id = TOGGLE_ID
    toggleButton.textContent = 'toggle test'
    setStyle(toggleButton, toggleButtonStyle)
    toggleButton.addEventListener('click', () =>
        iframe.style.visibility = iframe.style.visibility === 'hidden' ? 'visible' : 'hidden'
    )
    document.body.appendChild(toggleButton)

    return iframe
}

function setStyle(element, style) {
    Object.assign(element.style, style)
}
