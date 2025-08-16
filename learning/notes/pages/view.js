import { diffArrays, DiffChecker } from '/lib/diff.js'
import { debounce } from '/lib/functions.js'
import { AsyncQueue } from '/lib/queue.js'
import DragAndDropList, { DragAndDropListManager } from '/lib/ui/components/DragAndDropList.js'
import van, { waitPromise } from '/lib/ui/van-wrapper.js'
import { now } from '../utils.js'

const SAVE_DEBOUNCE_TIME = 500

export default function NoteViewPage({ params, notesManager }) {
    return main(
        waitPromise(notesManager.viewNote(params.id), (note) =>
            Editor({ note, notesManager })
        ),
    )
}

// FIX: paste creates single item. must split into elements
// TODO: handle save errors
function Editor({ note, notesManager }) {
    const diff = new DiffChecker({
        read: () => listManager.children.map(c => c.innerText),
        diff: diffArrays,
    })
    const saveQueue = new AsyncQueue({
        handler: async (update) => notesManager.updateNote(note.id, update),
    })
    const saveChanges = debounce(() => saveQueue.push({
        changes: diff.run(),
        timestamp: now(),
    }), SAVE_DEBOUNCE_TIME)

    const editing = van.state(false)

    const listElement = new DragAndDropList({
        listProps: {
            enabled: () => editing.val ? '' : true,
            contenteditable: true,
            oninput: saveChanges,
        },
        listStyle: {
            flexGrow: 1, // allow clicking anywhere to edit even if note is smaller than screen
            paddingTop: '1rem',
            paddingBottom: '10vh',
            outline: 'none',
        },
        items: note.items.map(t => div(t.replace(/\n$/, '').length ? t : br())),
        onSelect: (i) => listManager.item(i).style.backgroundColor = 'gray',
        onDeselect: (i) => listManager.item(i).style.background = 'none',
        onDrop: saveChanges,
    })
    const listManager = new DragAndDropListManager(listElement)

    van.derive(diff.init)
    van.derive(focusEditorWhenEmpty)
    van.derive(toggleEditModeOnToggleVirtualKeyboard)
    van.derive(blurEditorOnLeaveEditMode)

    return listElement

    function focusEditorWhenEmpty() {
        if (note.items.length === 1 && !note.items[0].trim().length) {
            setTimeout(() => listElement.focus())
        }
    }

    function toggleEditModeOnToggleVirtualKeyboard() {
        const fullHeight = visualViewport.height
        visualViewport.addEventListener('resize', () =>
            visualViewport.height < fullHeight
                ? editing.val = true
                : editing.val = false
        )
    }

    function blurEditorOnLeaveEditMode() {
        if (!editing.val) {
            listElement.blur()
        }
    }
}
