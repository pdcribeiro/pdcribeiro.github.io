// vanjs fork https://github.com/vanjs-org/van
// thank you Tao! :)

// TODO: refactor dependencies to avoid handling sets inside map. idea: use map with two keys

let protoOf = Object.getPrototypeOf
let changedStates, derivedStates, curDeps, curNewDerives, alwaysConnectedDom = { isConnected: 1 }
let gcCycleInMs = 1000, statesToGc, propSetterCache = {}
let objProto = protoOf(alwaysConnectedDom), funcProto = protoOf(protoOf), _undefined

let states = new WeakMap()
let { isArray } = Array
let isObject = val => val && typeof val === 'object' && !isArray(val)
let cloneObject = obj =>
    isArray(obj) ? obj.slice() : Object.assign(Object.create(protoOf(obj)), obj)
let addToSetInMap = (map, key, val) => {
    let set = map.get(key) ?? new Set()
    set.add(val)
    map.set(key, set)
    return map
}
let pushToArrayInObject = (obj, key, val) => {
    let arr = obj[key] ?? []
    arr.push(val)
    obj[key] = arr
    return obj
}
let flattenMapOfSets = (map) => Array.from(map).flatMap(([k, set]) => Array.from(set).map(v => [k, v]))

let addAndScheduleOnFirst = (map, state, prop, f, waitMs) => {
    if (!map) {
        setTimeout(f, waitMs)
        map = new Map()
    }
    addToSetInMap(map, state, prop)
    return map
}

let runAndCaptureDeps = (f, deps, arg) => {
    let prevDeps = curDeps
    curDeps = deps
    try {
        return f(arg)
    } catch (e) {
        console.error(e)
        return arg
    } finally {
        curDeps = prevDeps
    }
}

let keepConnected = l => l ? l.filter(b => b._dom?.isConnected) : []

let addStatesToGc = (state, prop) => statesToGc = addAndScheduleOnFirst(statesToGc, state, prop, () => {
    for (let [s, p] of flattenMapOfSets(statesToGc))
        s._bindings[p] = keepConnected(s._bindings[p]),
            s._listeners[p] = keepConnected(s._listeners[p])
    statesToGc = _undefined
}, gcCycleInMs)

const oldPrefix = '$old_'

// TODO: cleanup deleted props. in updateDoms?
// TODO: handle: deleteProperty, ownKeys (https://github.com/vanjs-org/van/blob/main/x/src/van-x.js)
let state = (obj) => {
    if (isObject(obj)) {
        let existing = states.get(obj)
        if (existing) return existing
    } else {
        obj = { val: obj }
    }

    let _raw = cloneObject(obj)
    let _old = cloneObject(obj)

    let stateObj = {
        _raw,
        _old,
        _bindings: {},
        _listeners: {},
        _set: (props) => {
            isObject(props) || (props = { val: props })
            let propsAndDels = { ...props }
            Object.keys(_raw).forEach(k => k in props || (propsAndDels[k] = undefined))
            Object.assign(proxy, propsAndDels)
        },
    }
    let proxy = new Proxy(stateObj, {
        get(stateObj, prop, proxy) {
            if (prop in protoOf(_raw)) return _raw[prop]
            if (prop.startsWith('_')) return Reflect.get(...arguments)
            if (prop === 'isState') return true

            let isOld = prop.startsWith(oldPrefix)
            if (isOld) prop = prop.slice(oldPrefix.length)

            curDeps && addToSetInMap(curDeps._getters, proxy, prop)

            let val = (isOld ? _old : _raw)[prop]
            return isObject(val) ? state(val) : val
        },
        set(stateObj, prop, val, proxy) {
            if (prop in protoOf(_raw)) {
                _raw[prop] = val
                return true
            }
            if (prop.startsWith('_')) return Reflect.set(...arguments)

            curDeps && addToSetInMap(curDeps._setters, proxy, prop)

            if (val !== _raw[prop]) {
                _raw[prop] = val
                let len = obj => obj[prop]?.length ?? 0
                if (len(stateObj._bindings) + len(stateObj._listeners)) {
                    changedStates = addAndScheduleOnFirst(changedStates, proxy, prop, updateDoms)
                    derivedStates && addToSetInMap(derivedStates, proxy, prop)
                } else {
                    _old[prop] = val
                }
            }

            return true
        },
    })
    states.set(obj, proxy)

    return proxy
}

let bind = (f, dom) => {
    let deps = { _getters: new Map(), _setters: new Map() }, binding = { f }, prevNewDerives = curNewDerives
    curNewDerives = []
    let newDom = runAndCaptureDeps(f, deps, dom)
    newDom = (newDom ?? document).nodeType ? newDom : new Text(newDom)
    for (let [s, p] of flattenMapOfSets(deps._getters))
        deps._setters.get(s)?.has(p) || (addStatesToGc(s, p), pushToArrayInObject(s._bindings, p, binding))
    for (let l of curNewDerives) l._dom = newDom
    curNewDerives = prevNewDerives
    return binding._dom = newDom
}

// TODO: test _set: check doesn't log: let s = state({a:1}); let d = derive(() => ({a:s.a, b:2})); derive(() => console.log(d.b))
let derive = (f, derived = state(), dom) => {
    let deps = { _getters: new Map(), _setters: new Map() }, listener = { f, s: derived }
    listener._dom = dom ?? curNewDerives?.push(listener) ?? alwaysConnectedDom
    derived._set(runAndCaptureDeps(f, deps))
    for (let [s, p] of flattenMapOfSets(deps._getters))
        deps._setters.get(s)?.has(p) || (addStatesToGc(s, p), pushToArrayInObject(s._listeners, p, listener))
    return derived
}

let updateDoms = () => {
    let iter = 0, derivedStatesArray = flattenMapOfSets(changedStates).filter(([s, p]) => s._raw[p] !== s._old[p])
    do {
        derivedStates = new Map()
        for (let l of new Set(derivedStatesArray.flatMap(([s, p]) => s._listeners[p] = keepConnected(s._listeners[p]))))
            derive(l.f, l.s, l._dom), l._dom = _undefined
    } while (++iter < 100 && (derivedStatesArray = flattenMapOfSets(derivedStates)).length)
    let changedStatesArray = flattenMapOfSets(changedStates).filter(([s, p]) => s._raw[p] !== s._old[p])
    changedStates = _undefined
    derivedStates = _undefined
    for (let b of new Set(changedStatesArray.flatMap(([s, p]) => s._bindings[p] = keepConnected(s._bindings[p]))))
        bind(b.f, b._dom), b._dom = _undefined
    for (let [s, p] of changedStatesArray) s._old[p] = s._raw[p]
}

export { state, derive, bind }
