export function cls(...classes) {
    return classes.filter(c => !!c).join(' ')
}
