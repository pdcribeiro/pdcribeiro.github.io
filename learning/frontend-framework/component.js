import van from '/lib/ui/web/van-wrapper.js'
import { emit } from './event.js'

export class Component extends HTMLElement {
    render
    #props

    constructor() {
        super()
        console.debug(this.tagName, 'constructor')
        this.#initProps()
    }
    connectedCallback() {
        van.add(this.attachShadow({ mode: 'open' }), this.render({
            $props: this.#props,
            $state: van.state,
            $derive: van.derive,
            $emit: emit.bind(this),
            $_emit: emit,
        }))
    }
    #initProps() {
        let proto = Object.getPrototypeOf(this)
        this.#props = {}
        Array.from(this.attributes)
            .filter(({ name }) => !name.startsWith('@') && !Object.getOwnPropertyDescriptor(proto, name))
            .map(({ name }) => name.startsWith(':') ? name.slice(1) : name)
            .forEach(name => Object.defineProperty(proto, name, {
                configurable: true,
                get() {
                    return this.#props[name].val
                },
                set(value) {
                    console.debug(this.tagName, 'set prop', name, value)
                    let prop = this.#props[name] ??= van.state()
                    prop.val = value
                },
            }))
    }
}
