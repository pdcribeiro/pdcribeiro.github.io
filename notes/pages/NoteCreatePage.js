import { confirmAnd } from '/lib/utils.js';
import van from '/third-party/van.js';
import { routes } from '../app.js';
import NoteForm from '../components/NoteForm.js';
import db from '../db.js';
import images from '../images.js';

const { div, h1 } = van.tags;

export default function NoteCreatePage() {
  return div(
    h1('new note'),
    NoteForm({ onsubmit, oncancel: confirmAndCancel }),
  );

  async function onsubmit(noteData) {
    const pictures = await Promise.all(
      noteData.pictures.map(async ({ file, description }) => {
        const { id, url } = await images.upload(file);
        return { id, url, description };
      })
    );
    await db.createNote({ ...noteData, pictures });
    routes.noteList.visit();
  }

  async function confirmAndCancel() {
    confirmAnd(routes.noteList.visit);
  }
}
