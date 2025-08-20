let state = (target, path = [], listeners = []) => new Proxy(() => { }, {
    get(target_, prop, receiver_) {
        console.debug('get', prop, path)
        switch (prop) {
            case '_isState': return true
            case '_val': {
                const result = getCompute(target, path)()
                return result
            }
        }
        return state(target, [...path, { prop }], listeners)
    },
    apply(target_, thisArg_, args) {
        console.debug('apply', path.at(-1), args, path)
        switch (path.at(-1).prop) {
            case '_get': {
                const result = getCompute(target, path.slice(0, -1))()
                return result
            }
            case '_listen': {
                const callback = args[0]
                const compute = getCompute(target, path.slice(0, -1))
                const update = () => callback(compute())
                listeners.push({ path, update })
                return update()
            }
            case '_render': {
                path.pop()
                const update = createStateNode()
                const node = thisArg_._listen((v) => update(args[0](v)))
                return node
            }
        }
        return state(target, [...path, { args }], listeners)
    },
    set(target_, prop, value) {
        console.debug('set', prop, path)
        // TODO: prevent setting outside of target (eg s.a.toUpperCase().b = 1) (break on function?)
        const nested = path.reduce((o, p) => o[p.prop], target)
        const result = Reflect.set(nested, prop, value)
        // TODO: check if set on current path affects any listener
        // TODO: handle breaking other paths (eg. s.user = null -> s.user.name breaks)
        listeners.forEach(l => l.update())
        return result
    },
})

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

/**
 * 
 * @param {*} callback computes the value
 * @param {*} deps root state dependencies (can call )
 * @return {*} state object
 */
// function listen(callback, deps) {
//     const s = state()
//     s._listen()
// }

// derive(() => user.name.toUpperCase() + user.age + game.time, [user, game])
// run function

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
        firstName: '',
        lastName: '',
    },
})

const input1 = tags.input()
const input2 = tags.input()
input1.oninput = (e) => s.user.firstName = e.target.value
input2.oninput = (e) => s.user.lastName = e.target.value

const app = tags.div(
    input1,
    input2,
    tags.h1('hello ', s.user.firstName), // render text
    tags.h2('hello Mr. ', s.user.lastName, ', ', s.user.firstName), // handle multiple accesses
    tags.p(s.user.firstName.toUpperCase()), // render formatted text
    tags.p(s.user.firstName._render((v) => v === 'di' && tags.span('admin'))), // render conditional
)

add(document.body, app)
