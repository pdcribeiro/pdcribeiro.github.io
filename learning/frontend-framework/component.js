import { parseAndBindChildren } from './binding.js'
import { emit } from './event.js'
import { state, derive } from './state.js'

export class Component extends HTMLElement {
    content
    scriptFn

    constructor() {
        super()
        console.debug('constructor', this.tagName)
        this.initProps()
    }
    initProps() {
        this._props = state({})
    }
    setProp(name, value) {
        this._props[name] = value
    }
    render() {
        console.debug('render', this.tagName)
        let content = this.content.cloneNode(true)
        let scope = this.scriptFn.call(this, {
            $props: this._props,
            $state: state,
            $derive: fn => derive(fn, this),
            $emit: emit.bind(this),
        })
        parseAndBindChildren(content, scope)
        this.attachShadow({ mode: 'open' })
            .appendChild(content)
    }
}
