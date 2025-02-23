import { confirmAnd } from '/lib/utils.js';
import van from '/third-party/van.js';
import { routes } from '../app.js';
import db from '../db.js';
import images from '../images.js';
import NoteForm from '../components/NoteForm.js';

const { div, h1, p } = van.tags;

export default function NoteEditPage({ param: id }) {
  const note = van.state(null);
  db.getNote(id).then((data) => (note.val = data));

  return div(
    () => note.val
      ? div(
        h1(note.val.name),
        NoteForm({
          initialData: { ...note.val, content: note.val.content.join('\n') },
          onsubmit,
          oncancel: confirmAndCancel
        }),
      )
      : p('loading note data...')
  );

  async function onsubmit({ id, name, tags, ...rest }) {
    const content = rest.content.split('\n');
    const pictures = await Promise.all(
      rest.pictures.map(async (pic) => {
        if (pic.unsaved) {
          const { id, url } = await images.upload(pic.file);
          return { id, url, description: pic.description };
        } else {
          return pic;
        }
      })
    );
    await db.updateNote(id, { id, name, content, pictures, tags });
    routes.noteDetails.visit(id);
  }

  function confirmAndCancel() {
    confirmAnd(() => routes.noteDetails.visit(id));
  }
}
