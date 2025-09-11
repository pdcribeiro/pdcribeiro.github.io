import '/lib/helpers.js'
import van from '/lib/ui/web/van-wrapper.js'
import { Component } from './component.js'
import { emit } from './event.js'
import { createRenderFunction } from './parser/index.js'

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
    let render = await createRenderFunction(content)
    customElements.define(name.kebabize(), class extends Component {
        render = render
    })
}

let extractTemplateContent = (template) => {
    let content = template.content
    template.remove()
    return content
}

let loadAndRenderApp = async () => {
    let template = document.querySelector('template[app]')
    let content = extractAppContent(template)
    let render = await createRenderFunction(content)
    van.add(document.body, render({
        $state: van.state,
        $derive: van.derive,
        $_emit: emit,
    }))
}

let extractAppContent = (template) => {
    let content = extractTemplateContent(template)
    document.adoptNode(content)
    customElements.upgrade(content)
    return content
}

init()
