const notes = [];
let id = 1;

const db = {
  async findNotes() {
    return [...notes];
  },
  async createNote(data) {
    const note = { id: id++, ...data };
    notes.push(note);
    console.debug('[dev db] note created', note);
    return note;
  },
  async getNote(id) {
    const note = notes.find((s) => s.id === id);
    if (!note) {
      throw new Error('note not found');
    }
    console.debug('[dev db] note found', note);
    return note;
  },
  async updateNote(id, data) {
    const index = notes.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error('note not found');
    }
    const note = { ...notes[index], ...data };
    notes[index] = note;
    console.debug('[dev db] note updated', note);
    return note;
  },
  async deleteNote(id) {
    const index = notes.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error('note not found');
    }
    const note = notes[index];
    notes.splice(index, 1);
    console.debug('[dev db] note deleted', note);
  },
};

// await db.createNote({ name: 'hip key', content: 'just do it' });

export default db;
