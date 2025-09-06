/**
 * WIP
 * - cleanup
 *
 * TODO
 * - write tests
 *
 * LATER
 * - allow defining component in html file and importing it into another html / component file
 */

import { kebab } from '/lib/string.js'
import { parseAndBindChildren } from './binding.js'
import { Component } from './component.js'
import { createScriptFunction } from './script.js'
import { state, derive } from './state.js'

let init = async () => {
    await loadAllComponents()
    await loadAndRenderApp()
}

let loadAllComponents = () => Promise.all(
    [...document.querySelectorAll('template[component]')].map(loadComponent)
)

let loadComponent = async (template) => {
    let name = template.getAttribute('component')
    let content = extractTemplateContent(template)
    let scriptFn = await extractScriptAndCreateFunction(content)
    customElements.define(kebab(name), class extends Component {
        content = content
        scriptFn = scriptFn
    })
}

let extractTemplateContent = (template) => {
    let content = template.content
    template.remove()
    return content
}

let extractScriptAndCreateFunction = (content) => createScriptFunction(extractScript(content))

let extractScript = (root) => {
    let script = root.querySelector('script')
    script?.remove()
    return script
}

let loadAndRenderApp = async () => {
    let template = document.querySelector('template[app]')
    let content = extractAppContent(template)
    let scriptFn = await extractScriptAndCreateFunction(content)
    let scope = await scriptFn({
        $state: state,
        $derive: derive,
    })
    parseAndBindChildren(content, scope)
    document.body.append(content)
}

let extractAppContent = (template) => {
    let content = extractTemplateContent(template)
    document.adoptNode(content)
    customElements.upgrade(content)
    return content
}

init()
