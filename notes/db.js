import { getDatabase } from '/lib/database.js';

const NOTES_DATABASE = 'notes';
const NOTES_COLLECTION = 'notes';

const db = getDatabase(NOTES_DATABASE);

const migrations = [
  {
    timestamp: '2025-02-18T17:17:18.126Z',
    migrate: async () => {
      const notes = await db.findMany(NOTES_COLLECTION);
      await Promise.all(
        notes.map(({ id, name, content, pictures, tags }) =>
          db.updateOne(NOTES_COLLECTION, id, { name, content: content.split('\n'), pictures, tags }))
      );
    }
  },
  {
    timestamp: '2025-02-17T17:29:39.103Z',
    migrate: () => {
      db.updateMany(NOTES_COLLECTION, {
        filter: { description: { $exists: true } },
        update: {
          $set: { content: '$description' }, // note: didn't work. it set content to the string '$description'
          $unset: { description: '' }
        }
      });
    }
  },
];

export default {
  connect: (config) => db.connect(config, migrations),
  findNotes: () => db.findMany(NOTES_COLLECTION),
  createNote: (data) => db.insertOne(NOTES_COLLECTION, data),
  getNote: (id) => db.findOne(NOTES_COLLECTION, id),
  updateNote: (id, data) => db.updateOne(NOTES_COLLECTION, id, data),
  deleteNote: (id) => db.deleteOne(NOTES_COLLECTION, id),
};
