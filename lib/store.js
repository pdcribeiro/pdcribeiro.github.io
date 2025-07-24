const store = {
  get(key) {
    const json = localStorage.getItem(key)
    return JSON.parse(json)
  },
  set(key, value) {
    const json = JSON.stringify(value)
    localStorage.setItem(key, json)
  },
}

export default store

export function getStore(key) {
  return {
    get: () => store.get(key),
    set: val => store.set(key, val)
  }
}
