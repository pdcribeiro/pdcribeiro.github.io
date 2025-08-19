function state(target) {
    let path = []
    const listeners = []
    const proxy = new Proxy(() => { }, {
        get(target_, prop, receiver_) {
            console.debug('get', prop, path)
            switch (prop) {
                case '_isState': return true
                case '_val': {
                    const result = getCompute(target, path)()
                    path = []
                    return result
                }
            }
            path.push({ prop })
            return proxy
        },
        apply(target_, thisArg_, args) {
            console.debug('apply', path.at(-1), args, path)
            switch (path.at(-1).prop) {
                case '_get': {
                    const result = getCompute(target, path.slice(0, -1))()
                    path = []
                    return result
                }
                case '_listen': {
                    const callback = args[0]
                    const compute = getCompute(target, path.slice(0, -1))
                    const update = () => callback(compute())
                    listeners.push({ path, update })
                    path = []
                    return update()
                }
                case '_render': {
                    path.pop()
                    const update = createStateNode()
                    const node = thisArg_._listen((v) => update(args[0](v)))
                    return node
                }
            }
            path.push({ args })
            return proxy
        },
        set(target_, prop, value) {
            console.debug('set', prop, path)
            // TODO: prevent setting outside of target (eg s.a.toUpperCase().b = 1) (break on function?)
            const nested = path.reduce((o, p) => o[p.prop], target)
            const result = Reflect.set(nested, prop, value)
            // TODO: check if set on current path affects any listener
            // TODO: handle breaking other paths (eg. s.user = null -> s.user.name breaks)
            listeners.forEach(l => l.update())
            path = []
            return result
        },
    })
    return proxy
}

function getCompute(target, path) {
    return () => {
        console.debug('compute', target, path)
        let prevResult
        return path.reduce((r, p) => {
            console.debug({ r, p, prevResult })
            const newResult = p.prop ? r[p.prop] : r.apply(prevResult, ...p.args)
            prevResult = r
            return newResult
        }, target)
    }
}

// DOM

function createStateNode() {
    let node = document.createTextNode('')
    return (v) => {
        let newNode
        if (!v) newNode = document.createTextNode('')
        else if (v instanceof Element) newNode = v
        else newNode = document.createTextNode(v)
        node.replaceWith(newNode)
        node = newNode
        return node
    }
}

const tags = new Proxy({}, {
    get(_, name) {
        return tag.bind(undefined, name)
    }
})

function tag(name, ...args) {
    const [props, ...children] = args.length && Object.getPrototypeOf(args[0]) === Object.prototype ? args : [{}, ...args]
    const dom = document.createElement(name)
    for (let [k, v] of Object.entries(props)) {
        // TODO
    }
    add(dom, children)
    return dom
}

function add(dom, ...children) {
    for (const c of children.flat(Infinity)) {
        if (c._isState) {
            const update = createStateNode()
            const node = c._listen(update)
            dom.append(node)
        } else {
            dom.append(c)
        }
    }
}

// TEST

var s = state({
    user: {
        name: '',
    },
})

const input = tags.input()
input.oninput = (e) => s.user.name = e.target.value

const app = tags.div(
    input,
    tags.h1('hello ', s.user.name),
    tags.p(s.user.name.toUpperCase()),
    tags.p(s.user.name._render((v) => v === 'di' && tags.span('admin'))),
)

add(document.body, app)
