import { extractAndParseScript } from './script.js'
import { parseChildren } from './template.js'

export let createRenderFunction = async (content) => {
    let code = parseContent(content)
    console.debug('createRenderFunction code', code)
    let blob = createBlob(code)
    let url = URL.createObjectURL(blob)
    let exports = await import(url)
    URL.revokeObjectURL(url)
    return exports.default
}

let parseContent = (content) => {
    let { imports, logic } = extractAndParseScript(content)
    let template = parseChildren(content)
    return `
    ${imports}
    export default function render({ $props, $state, $derive, $emit, $_emit }) {
        ${logic}
        return ${template}
    }`
}

let createBlob = (code) => new Blob([code], { type: 'application/javascript' })
