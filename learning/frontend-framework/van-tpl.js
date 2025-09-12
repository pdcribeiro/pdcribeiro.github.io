import '/lib/helpers.js'
import van from '/lib/ui/web/van-wrapper.js'
import { Component } from './component.js'
import { emit } from './event.js'
import { createRenderFunction } from './parser/index.js'

let init = async () => {
    await loadAllComponents()
    await loadAndRenderApp()
    upgradeAllComponents()
}

let loadAllComponents = () => Promise.all(
    [...document.querySelectorAll('template[component]')].map(loadComponent)
)

let loadComponent = async (template) => {
    let name = template.getAttribute('component')
    let render = await createRenderFunction(template.content)
    customElements.define(name.kebabize(), class extends Component {
        render = render
    })
}

let loadAndRenderApp = async () => {
    let template = document.querySelector('template[app]')
    let render = await createRenderFunction(template.content)
    van.add(document.body, render({
        $state: van.state,
        $derive: van.derive,
        $_emit: emit,
    }))
}

let upgradeAllComponents = () =>
    [...document.querySelectorAll('template')].forEach(template => {
        document.adoptNode(template.content)
        customElements.upgrade(template.content)
        template.remove()
    })

init()
