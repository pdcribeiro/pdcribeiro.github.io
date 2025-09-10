let eventOptions = { bubbles: true, cancelable: true, composed: true }

export let emit = function (type, detail) {
    this.dispatchEvent(new CustomEvent(type, { ...eventOptions, detail }))
}

export let wrap = (handler) => (e) => {
    let result = handler(e, emit.bind(e.target))
    result instanceof Function && result(e)
}
