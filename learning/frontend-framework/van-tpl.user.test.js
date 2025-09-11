import { browserTest } from '/lib/test/runner.js'
import { renderHtml, visit } from '/lib/test/ui-helpers.js'

let frameworkTests = {
    'renders app template': () =>
        renderApp(`
            <p>foo</p>
        `)
            .has('foo'),
    'renders children': () =>
        renderApp(`
            <p>foo <span>bar</span></p>
        `)
            .has('foo bar'),
    'renders text template': () =>
        renderApp(`
            <script>
                let str = 'foo'
            </script>
            <p>({str})</p>
        `)
            .has('(foo)'),
    'renders attribute': () =>
        renderApp(`
            <input value="foo">
        `)
            .has('foo'),
    'renders attribute from variable': () =>
        renderApp(`
            <script>
                let str = 'foo'
            </script>
            <input :value="str">
        `)
            .has('foo'),
    'renders attribute from variable with same name': () =>
        renderApp(`
            <script>
                let value = 'foo'
            </script>
            <input :value>
        `)
            .has('foo'),
    'provides $state and $derive': () =>
        renderApp(`
            <script>
                let s = $state(0)
                let d = $derive(() => s.val + 1)
            </script>
            <p>({s.val},{d.val})</p>
        `)
            .has('(0,1)'),
    'binds text templates': () =>
        renderApp(`
            <script>
                let s = $state(0)
                setTimeout(() => s.val++)
            </script>
            <p>({s.val})</p>
        `)
            .has('(1)'),
    'binds attributes': () =>
        renderApp(`
            <script>
                let s = $state(0)
                let str = $derive(() => '(' + s.val + ')')
                setTimeout(() => s.val++)
            </script>
            <input :value="str.val">
        `)
            .has('(1)'),
}

let conditionalLogicTests = {
    'renders :if true': () =>
        renderApp(`
            <p :if="true">foo</p>
        `)
            .has('foo'),
    'renders :if false': () =>
        renderApp(`
            <p :if="false">foo</p>
        `)
            .hasNot('foo'),
    'renders :if true :else': () =>
        renderApp(`
            <p :if="true">foo</p>
            <p :else>bar</p>
        `)
            .has('foo')
            .hasNot('bar'),
    'renders :if false :else': () =>
        renderApp(`
            <p :if="false">foo</p>
            <p :else>bar</p>
        `)
            .hasNot('foo')
            .has('bar'),
    'renders :if true :elsif true': () =>
        renderApp(`
            <p :if="true">foo</p>
            <p :elsif="true">bar</p>
        `)
            .has('foo')
            .hasNot('bar'),
    'renders :if false :elsif true': () =>
        renderApp(`
            <p :if="false">foo</p>
            <p :elsif="true">bar</p>
        `)
            .hasNot('foo')
            .has('bar'),
    'renders :if false :elsif false': () =>
        renderApp(`
            <p :if="false">foo</p>
            <p :elsif="false">bar</p>
        `)
            .hasNot('foo')
            .hasNot('bar'),
    'renders :if true :elsif true :else': () =>
        renderApp(`
            <p :if="true">foo</p>
            <p :elsif="true">bar</p>
            <p :else>baz</p>
        `)
            .has('foo')
            .hasNot('bar')
            .hasNot('baz'),
    'renders :if false :elsif true :else': () =>
        renderApp(`
            <p :if="false">foo</p>
            <p :elsif="true">bar</p>
            <p :else>baz</p>
        `)
            .hasNot('foo')
            .has('bar')
            .hasNot('baz'),
    'renders :if false :elsif false :else': () =>
        renderApp(`
            <p :if="false">foo</p>
            <p :elsif="false">bar</p>
            <p :else>baz</p>
        `)
            .hasNot('foo')
            .hasNot('bar')
            .has('baz'),
}

let iterativeLogicTests = {
    'renders :for some': () =>
        renderApp(`
            <p :for="n in [1, 2, 3]">item {n}</p>
        `)
            .has('item 1')
            .has('item 2')
            .has('item 3'),
    'renders :for empty': () =>
        renderApp(`
            <p :for="n in []">item {n}</p>
        `)
            .hasNot('item'),
    'renders :for some :else': () =>
        renderApp(`
            <p :for="n in [1, 2, 3]">item {n}</p>
            <p :else>empty</p>
        `)
            .has('item 1')
            .has('item 2')
            .has('item 3')
            .hasNot('empty'),
    'renders :for empty :else': () =>
        renderApp(`
            <p :for="n in []">item {n}</p>
            <p :else>empty</p>
        `)
            .hasNot('item')
            .has('empty'),
}

let renderApp = (html) => render(`<template app>${html}</template>`)
let render = (html) => renderHtml(html + `
    <script type="module" src="./van-tpl.js"></script>
`)

let taskTrackerTests = {
    'loads app': () =>
        visit()
            .has('Task Tracker'),
}

browserTest({
    ...frameworkTests,
    ...conditionalLogicTests,
    ...iterativeLogicTests,
    ...taskTrackerTests,
})
