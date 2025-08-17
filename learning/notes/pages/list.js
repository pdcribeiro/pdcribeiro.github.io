import { visit } from '/lib/routing.js'
import { Fragment, waitPromise } from '/lib/ui/web/van-wrapper.js'
import { stl } from '/lib/ui/web/utils.js'

export default function NoteListPage({ notesManager }) {
    return Fragment(
        header(
            h1('notes'),
        ),
        main(
            waitPromise(notesManager.listNotes(), (notes) =>
                ul(notes.map(NoteListItem))
            ),
        ),
        footer(
            CreateNoteButton({ notesManager }),
        ),
    )
}

function NoteListItem(note) {
    return li({},
        a({
            href: `#!/view?id=${note.id}`,
            style: stl({
                display: 'inline-block',
                padding: '0.5rem',
                margin: '0.25rem 0',
            })
        },
            note.title || 'no title'
        ),
    )
}

function CreateNoteButton({ notesManager }) {
    return button({ onclick: startNewNote, class: 'border' }, '+')

    async function startNewNote() {
        const note = await notesManager.createNote()
        await visit(`#!/view?id=${note.id}`)
    }
}
