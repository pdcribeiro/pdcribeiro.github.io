import { visit } from '/lib/routing.js'
import { waitPromise } from '/lib/ui/van-wrapper.js'

export default function NoteListPage({ notesManager }) {
    return waitPromise(notesManager.listNotes(), (notes) => {
        return div(
            header(
                h1('notes'),
            ),
            main(
                ul(notes.map(NoteListItem)),
            ),
            footer(
                CreateNoteButton({ notesManager }),
            ),
        )
    })
}

function NoteListItem(note) {
    return li(
        a({ href: `#!/view?id=${note.id}` }, note.title || 'no title'),
    )
}

function CreateNoteButton({ notesManager }) {
    return button({ onclick: startNewNote, class: 'border' }, '+')

    async function startNewNote() {
        const note = await notesManager.createNote()
        await visit(`#!/view?id=${note.id}`)
    }
}
