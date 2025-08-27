import { kebab } from '/lib/string.js'

export function cls(...classes) {
    return classes.filter(c => !!c).join(' ')
}

export function stl(styles) {
    return Object.entries(styles).map(([k, v]) => `${kebab(k)}: ${v}`).join(';')
}
