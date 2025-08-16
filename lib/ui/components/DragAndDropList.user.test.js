// Browser tests for the DragAndDropList component

import { browserTest } from '/lib/test/runner.js'
import { visit } from '/lib/test/ui-helpers.js'
import DragAndDropList, { DragAndDropListManager } from '/lib/ui/components/DragAndDropList.js'
import { range, transformValues } from '/lib/utils.js'

const ITEM_COUNT = 5
const MANY_COUNT = 50
const SELECTED_COLOR = 'gray'

const testItems = range(ITEM_COUNT).map(i => 'item ' + i)
const newItem = 'new item'

browserTest({
    'renders items': () =>
        visit()
            .has('item 0')
            .has('item 1')
            .has(`item ${ITEM_COUNT - 1}`),
    'adds item': () =>
        visit()
            .find('', { selector: 'input' })
            .type(newItem)
            .root()
            .click('add')
            .find('', { selector: 'main > div' })
            .has(newItem),
    'removes item': () =>
        visit()
            .find('item 0', { selector: 'div' })
            .click('remove')
            .root()
            .hasNot('item 0'),
    'selects item': async () =>
        visit()
            .find('item 0')
            .emit('mousedown')
            .wait(600)
            .assert(isSelected),
    'deselects item': async () =>
        visit()
            .find('item 0')
            .emit('mousedown')
            .wait(600)
            .emit('mouseup')
            .wait(100)
            .click()
            .assert(el => !isSelected(el)),
    'selects multiple items': async () =>
        visit()
            .find('item 0')
            .emit('mousedown')
            .wait(600)
            .root()
            .find('item 1')
            .click()
            .assert(el => isSelected(el)),
    'drags and drops item 0 to before 0': async () =>
        visit()
            .pipe(page => dragAndDrop(0, 'before', 0, page))
            .has(order(0, 1)),
    'drags and drops item 0 to before 1': async () =>
        visit()
            .pipe(page => dragAndDrop(0, 'before', 1, page))
            .has(order(0, 1)),
    'drags and drops item 0 to after 1': async () =>
        visit()
            .pipe(page => dragAndDrop(0, 'after', 1, page))
            .has(order(1, 0)),
    'drags and drops item 0 to after 1 and back': async () =>
        visit()
            .pipe(page => dragAndDrop(0, 'after', 1, page))
            .pipe(page => dragAndDrop(1, 'before', 0, page))
            .has(order(0, 1)),
    'drags and drops item -1 to after -1': async () =>
        visit()
            .pipe(page => dragAndDrop(-1, 'after', -1, page))
            .has(order(-2, -1)),
    'drags and drops item -1 to after -2': async () =>
        visit()
            .pipe(page => dragAndDrop(-1, 'after', -2, page))
            .has(order(-2, -1)),
    'drags and drops item -1 to before -2': async () =>
        visit()
            .pipe(page => dragAndDrop(-1, 'before', -2, page))
            .has(order(-1, -2)),
    'drags and drops item -1 to before -2 and back': async () =>
        visit()
            .pipe(page => dragAndDrop(-1, 'before', -2, page))
            .pipe(page => dragAndDrop(-1, 'before', -2, page))
            .has(order(-2, -1)),
    'removes correct item after drag and drop': () =>
        visit()
            .pipe(page => dragAndDrop(0, 'after', 1, page))
            .pipe(page => dragAndDrop(1, 'before', 0, page))
            .find('item 0', { selector: 'div' })
            .click('remove')
            .root()
            .hasNot('item 0')
            .has('item 1'),
    'drags and drops multiple items': () =>
        visit()
            .find('item 0')
            .emit('mousedown')
            .wait(600)
            .emit('mouseup')
            .wait(100)
            .root()
            .find('item 1')
            .click()
            .root()
            .pipe(page => dragAndDrop(0, 'after', 2, page))
            .has(order(2, 0, 1, 3)),
    'selects unselected item when drag and dropping multiple items': () =>
        visit()
            .find('item 0')
            .emit('mousedown')
            .wait(600)
            .emit('mouseup')
            .wait(100)
            .root()
            .pipe(page => dragAndDrop(1, 'after', 2, page))
            .has(order(2, 0, 1, 3)),
    'ignores drag movement under threshold': () =>
        visit()
            .find('item 0')
            .get(el => emitMouseEvent(el, 'mousedown', getElementEdge(el, 'before')))
            .wait(600)
            .emit('pointerover')
            .get(el => emitMouseEvent(el, 'mousemove', getElementEdge(el, 'before') + 2))
            .root()
            .hasNot('', { selector: 'hr' }),
    'shows placeholder on drag movement above threshold': () =>
        visit()
            .find('item 0')
            .get(el => emitMouseEvent(el, 'mousedown', getElementEdge(el, 'before')))
            .wait(600)
            .emit('pointerover')
            .get(el => emitMouseEvent(el, 'mousemove', getElementEdge(el, 'before') + 5))
            .root()
            .has('', { selector: 'hr' }),
})

function isSelected(element) {
    return element.closest('div').style.backgroundColor === SELECTED_COLOR
}

function dragAndDrop(index, position, newIndex, page) {
    if (index < 0) index += ITEM_COUNT
    if (newIndex < 0) newIndex += ITEM_COUNT

    return page
        .find('', { selector: `div div:nth-child(${index + 1})` }) // don't rely on item text as items might have moved
        .emit('mousedown')
        .wait(600)
        .root()
        .find('', { selector: `div div:nth-child(${newIndex + 1})` })
        .emit('pointerover')
        .root()
        .find('', { selector: `div div:nth-child(${index + 1})` })
        .get(el => {
            const newEl = el.parentElement.children[newIndex]
            emitMouseEvent(el, 'mousemove', getElementEdge(newEl, position))
        })
        .emit('mouseup')
        .root()
}

function emitMouseEvent(target, type, clientY) {
    target.dispatchEvent(new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        clientY,
    }))
}

function getElementEdge(element, position) {
    const rect = element.getBoundingClientRect()
    return {
        before: rect.top + 1,
        after: rect.bottom - 1,
    }[position]
}

function order(...indexes) {
    const regexString = indexes
        .map(i => i < 0 ? ITEM_COUNT + i : i)
        .map(i => `item ${i}`)
        .join('.+')
    return new RegExp(regexString)
}

const styles = transformValues({
    button: 'margin: 0.5rem 1rem',
}, style => ({ style }))

export function TestDragAndDropList() {
    const newItemInput = input({ style: 'margin-bottom: 1rem' })

    let itemsData = testItems

    const listElement = DragAndDropList({
        items: itemsData.map(itemText => Item({ id: itemText }, itemText)),
        onSelect(index) {
            listManager.item(index).style.backgroundColor = SELECTED_COLOR
        },
        onDeselect(index) {
            listManager.item(index).style.background = 'none'
        },
        onDrop: (selectedIndexes, droppedIndex) => {
            itemsData = DragAndDropListManager.applyDrop(itemsData, selectedIndexes, droppedIndex)
        },
    })
    const listManager = new DragAndDropListManager(listElement)

    return main(
        newItemInput,
        button({ onclick: () => add(1), ...styles.button }, 'add'),
        button({ onclick: () => add(MANY_COUNT), ...styles.button }, 'add many'),
        listElement,
    )

    function Item({ id }, text) {
        return div(
            span(text),
            button({ onclick: () => remove(id), ...styles.button }, 'remove'),
        )
    }

    function add(count) {
        const itemText = newItemInput.value
        if (itemText.length > 0) {
            range(count).forEach(() => addToList(itemText))
            newItemInput.value = ''
        }
    }

    function addToList(itemText) {
        listManager.append(
            Item({ id: itemText }, itemText)
        )
        itemsData.push(itemText)
    }

    function remove(id) {
        listManager.remove(itemsData.indexOf(id))
        itemsData = itemsData.filter(it => it !== id)
    }
}
