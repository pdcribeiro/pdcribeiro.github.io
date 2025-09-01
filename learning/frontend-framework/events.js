let eventOptions = { bubbles: true, cancelable: true, composed: true }

let emit = function (type, detail) { this.dispatchEvent(new CustomEvent(type, { ...eventOptions, detail })) }

export { emit }
