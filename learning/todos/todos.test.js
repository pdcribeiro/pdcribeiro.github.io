// Tests for the todo app

// TODO: add browser tests

import { test, eq } from '../test.js'
import { TODO_ITEM_STATES, todoItem, todoList } from './todos.js'

const title = 'Buy bread'
const otherTitle = 'Buy bananas'

test({
    // item logic
    'creates todo': () => {
        const timestamp = 1234567890123
        const deps = { now: () => timestamp }
        const todo = todoItem.create(title, deps)
        eq(todo.title, title)
        eq(todo.createdAt, timestamp)
        eq(todo.done, false)
        eq(typeof todo.id, 'string')
    },
    'toggles todo': () => {
        const original = todoItem.create(title)
        const toggled = original.toggle()
        eq(toggled.done, true)
        eq(original.done, false) // original item should not be mutated
    },
    'updates todo title': () => {
        const original = todoItem.create(title)
        const updated = original.updateTitle(otherTitle)
        eq(updated.title, otherTitle)
        eq(original.title, title)
    },
    // list logic
    'creates empty list': () => {
        const todos = todoList.create()
        eq(todos.length, 0)
    },
    'creates list with one item': () => {
        const todos = todoList.create([
            todoItem.create(title),
        ])
        eq(todos.length, 1)
        eq(todos[0].title, title)
    },
    'adds todo to list': () => {
        const original = todoList.create()
        const updated = original.add(title)
        eq(updated.length, 1)
        eq(updated[0].title, title)
        eq(original.length, 0) // original list should not be mutated
    },
    'toggles todo in list': () => {
        const original = todoList.create().add(title)
        const updated = original.toggle(original[0].id)
        eq(updated[0].done, true)
        eq(original[0].done, false)
    },
    'filters todos by state': () => {
        let original = todoList.create()
            .add(title)
            .add(otherTitle)
        original = original.toggle(original[0].id)

        const all = original.filter(TODO_ITEM_STATES.all)
        eq(all.length, 2)

        const active = original.filter(TODO_ITEM_STATES.active)
        eq(active.length, 1)
        eq(active[0].title, otherTitle)

        const completed = original.filter(TODO_ITEM_STATES.completed)
        eq(completed.length, 1)
        eq(completed[0].title, title)

        eq(original.length, 2)
    },
    'deletes todo from list': () => {
        const original = todoList.create().add(title)
        const updated = original.delete(original[0].id)
        eq(updated.length, 0)
        eq(original.length, 1)
    },
})
