export function transformValues(object, callback) {
  const transformed = Object.entries(object).map(([k, v]) => [k, callback(v)]);
  return Object.fromEntries(transformed);
}

export function bind(state, ...props) {
  return props.length ? {
    value: () => getNested(state.val, props),
    oninput: (e) => state.val = setNested(state.val, props, e.target.value),
  } : {
    value: state,
    oninput: (e) => state.val = e.target.value,
  };
}

function getNested(obj, path) {
  return path.reduce((o, key) => (o && o[key] !== undefined ? o[key] : ''), obj);
}

function setNested(obj, path, value) {
  if (path.length === 0) return value;
  const [key, ...rest] = path;
  return {
    ...obj,
    [key]: setNested(obj[key] || {}, rest, value),
  };
}

export function confirmAnd(callback) {
  return confirm('Are you sure?') && callback();
}

export function parseComponentArgs(args) {
  if (Object.getPrototypeOf(args[0]) === Object.prototype) {
    return [args[0], ...args.slice(1).flat(Infinity)];
  } else {
    return [{}, ...args.flat(Infinity)];
  }
}

export function range(n) {
  return Array.from(Array(n).keys());
}

export function wait(duration) {
  return new Promise((r) => setTimeout(r, duration));
}
