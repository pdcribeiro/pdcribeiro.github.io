// Browser tests for the DragAndDropList component

import { browserTest } from '/lib/test/runner.js'
import { visit } from '/lib/test/ui-helpers.js'
import { DragAndDropList } from '/lib/ui/components/DragAndDropList.js'

const URL = '/lib/ui/components/drag_and_drop_list.html'

const ITEM_COUNT = 5
const SELECTED_COLOR = 'gray'

const testItems = [...Array(ITEM_COUNT).keys()].map(i => 'item ' + i)
const newItem = 'new item'

browserTest({
    'renders items': () =>
        visit(URL)
            .has('item 0')
            .has('item 1')
            .has(`item ${ITEM_COUNT - 1}`),
    'adds item': () =>
        visit(URL)
            .find('', { selector: 'input' })
            .type(newItem)
            .root()
            .click('add')
            .find('', { selector: 'ul' })
            .has(newItem),
    'removes item': () =>
        visit(URL)
            .find('item 0', { selector: 'li' })
            .click('remove')
            .root()
            .hasNot('item 0'),
    'selects item': async () =>
        visit(URL)
            .find('item 0')
            .emit('mousedown')
            .wait(600)
            .assert(isSelected),
    'deselects item': async () =>
        visit(URL)
            .find('item 0')
            .emit('mousedown')
            .wait(600)
            .emit('mouseup')
            .wait(100)
            .click()
            .assert(el => !isSelected(el)),
    'selects multiple items': async () =>
        visit(URL)
            .find('item 0')
            .emit('mousedown')
            .wait(600)
            .root()
            .find('item 1')
            .click()
            .assert(el => isSelected(el)),
    'drags and drops item 0 to before 0': async () =>
        visit(URL)
            .pipe(page => dragAndDrop(0, 'before', 0, page))
            .has(order(0, 1)),
    'drags and drops item 0 to before 1': async () =>
        visit(URL)
            .pipe(page => dragAndDrop(0, 'before', 1, page))
            .has(order(0, 1)),
    'drags and drops item 0 to after 1': async () =>
        visit(URL)
            .pipe(page => dragAndDrop(0, 'after', 1, page))
            .has(order(1, 0)),
    'drags and drops item 0 to after 1 and back': async () =>
        visit(URL)
            .pipe(page => dragAndDrop(0, 'after', 1, page))
            .pipe(page => dragAndDrop(1, 'before', 0, page))
            .has(order(0, 1)),
    'drags and drops item -1 to after -1': async () =>
        visit(URL)
            .pipe(page => dragAndDrop(-1, 'after', -1, page))
            .has(order(-2, -1)),
    'drags and drops item -1 to after -2': async () =>
        visit(URL)
            .pipe(page => dragAndDrop(-1, 'after', -2, page))
            .has(order(-2, -1)),
    'drags and drops item -1 to before -2': async () =>
        visit(URL)
            .pipe(page => dragAndDrop(-1, 'before', -2, page))
            .has(order(-1, -2)),
    'drags and drops item -1 to before -2 and back': async () =>
        visit(URL)
            .pipe(page => dragAndDrop(-1, 'before', -2, page))
            .pipe(page => dragAndDrop(-1, 'before', -2, page))
            .has(order(-2, -1)),
    'removes correct item after drag and drop': () =>
        visit(URL)
            .pipe(page => dragAndDrop(0, 'after', 1, page))
            .pipe(page => dragAndDrop(1, 'before', 0, page))
            .find('item 0', { selector: 'li' })
            .click('remove')
            .root()
            .hasNot('item 0')
            .has('item 1'),
    'drags and drops multiple items': () =>
        visit(URL)
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
        visit(URL)
            .find('item 0')
            .emit('mousedown')
            .wait(600)
            .emit('mouseup')
            .wait(100)
            .root()
            .pipe(page => dragAndDrop(1, 'after', 2, page))
            .has(order(2, 0, 1, 3)),
})

function isSelected(element) {
    return element.closest('li').style.backgroundColor === SELECTED_COLOR
}

function dragAndDrop(index, position, siblingIndex, page) {
    if (index < 0) index += ITEM_COUNT
    if (siblingIndex < 0) siblingIndex += ITEM_COUNT

    return page
        .find('', { selector: `li:nth-child(${index + 1})` }) // don't rely on item text as items might have moved
        .emit('mousedown')
        .wait(600)
        .root()
        .find('', { selector: `li:nth-child(${siblingIndex + 1})` })
        .emit('pointerenter')
        .root()
        .find('', { selector: `li:nth-child(${index + 1})` })
        .get(el => emitMouseMove(el, position, siblingIndex))
        .emit('mouseup')
        .root()
}

function emitMouseMove(element, position, siblingIndex) {
    const sibling = element.parentElement.children[siblingIndex]
    const rect = sibling.getBoundingClientRect()
    const clientY = {
        before: rect.top + 1,
        after: rect.bottom - 1,
    }[position]
    const event = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientY,
    })
    element.dispatchEvent(event)
}

function order(...indexes) {
    const regexString = indexes
        .map(i => i < 0 ? ITEM_COUNT + i : i)
        .map(i => `item ${i}`)
        .join('.+')
    return new RegExp(regexString)
}

export function TestDragAndDropList() {
    const newItemInput = input({ style: 'margin-bottom: 1rem' })

    let itemsData = testItems

    const itemsList = new DragAndDropList({
        items: itemsData.map(itemText => Item({ id: itemText }, itemText)),
        onSelect(index) {
            itemsList.getElement(index).style.backgroundColor = SELECTED_COLOR
        },
        onDeselect(index) {
            itemsList.getElement(index).style.background = 'none'
        },
        onDrop: (selectedIndexes, droppedIndex) => {
            itemsData = DragAndDropList.applyDrop(itemsData, selectedIndexes, droppedIndex)
        },
    })

    return main(
        newItemInput,
        button({ onclick: () => addItem() }, 'add'),
        itemsList.element,
    )

    function Item({ id }, text) {
        return [
            span(text),
            button({ onclick: () => removeItem(id) }, 'remove'),
        ]
    }

    function addItem() {
        const itemText = newItemInput.value
        if (itemText.length === 0) return
        itemsList.addItem(
            Item({ id: itemText }, itemText)
        )
        itemsData.push(itemText)
        newItemInput.value = ''
    }

    function removeItem(id) {
        itemsList.removeItem(itemsData.indexOf(id))
        itemsData = itemsData.filter(it => it !== id)
    }
}
