import { kebabize } from '/lib/string.js'

export function cls(...classes) {
    return classes.filter(c => !!c).join(' ')
}

export function stl(styles) {
    return Object.entries(styles).map(([k, v]) => `${kebabize(k)}: ${v}`).join(';')
}
