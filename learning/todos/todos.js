// A todo app

// TODO: add support for toggling and deleting by title (if not found search by id. if duplicate throw error)

export const TODO_ITEM_STATES = {
    all: 'all',
    active: 'active',
    completed: 'completed',
}

// Chainable API

export const todoItem = {
    create(title, {
        now = Date.now,
        makeId = () => Math.random().toString(36).slice(2)
    } = {}) {
        const itemData = {
            title,
            done: false,
            createdAt: now(),
            id: makeId(),
        }
        return addItemMethods(itemData)
    },
    normalize(rawItemData) {
        checkTypes(rawItemData, {
            title: 'string',
            done: 'boolean',
            createdAt: 'number',
            id: 'string',
        })
        return addItemMethods(rawItemData)
    },
}

function addItemMethods(itemData) {
    return {
        ...itemData,
        toggle() {
            return {
                ...this,
                done: !this.done,
            }
        },
        updateTitle(newTitle) {
            return {
                ...this,
                title: newTitle,
            }
        },
    }
}

function checkTypes(data, expectedTypes) {
    for (const key in data) {
        if (typeof data[key] !== expectedTypes[key]) {
            throw new Error(`Invalid type for ${key}: expected ${expectedTypes[key]}, got ${typeof data[key]}`)
        }
    }
}

export const todoList = {
    create(items = []) {
        return addListMethods(items)
    },
    normalize(rawListData) {
        if (!Array.isArray(rawListData)) {
            throw new Error('List data must be an array')
        }
        const normalizedItems = rawListData.map(todoItem.normalize)
        return addListMethods(normalizedItems)
    },
}

function addListMethods(itemsArray) {
    return Object.assign([...itemsArray], {
        add(title, deps) {
            const item = todoItem.create(title, deps)
            return addListMethods([...itemsArray, item])
        },
        toggle(id) {
            const updated = itemsArray.map(item => item.id === id ? item.toggle() : item)
            return addListMethods(updated)
        },
        filter(state) {
            return addListMethods(filterItems(itemsArray, state))
        },
        delete(id) {
            const updated = itemsArray.filter(item => item.id !== id)
            return addListMethods(updated)
        },
    })
}

function filterItems(itemsArray, state) {
    switch (state) {
        case TODO_ITEM_STATES.all:
            return [...itemsArray]
        case TODO_ITEM_STATES.active:
            return itemsArray.filter(item => !item.done)
        case TODO_ITEM_STATES.completed:
            return itemsArray.filter(item => item.done)
        default:
            throw new Error('Invalid filter')
    }
}
