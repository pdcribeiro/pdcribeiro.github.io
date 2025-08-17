export function chain(...funcs) {
  return (...args) => funcs.forEach(f => f && f(...args))
}

export function debounce(func, duration) {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), duration)
  }
}
