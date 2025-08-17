export function cls(...classes) {
    return classes.filter(c => !!c).join(' ')
}

export function stl(styles) {
    return Object.entries(styles).map(([k, v]) => `${camelToKebab(k)}: ${v}`).join(';')
}

function camelToKebab(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}
