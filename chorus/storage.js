let db = null;

export function initDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('recorderDB', 1);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore('takes', { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = (e) => {
      db = e.target.result;
      resolve(db);
    };
    req.onerror = (e) => reject(e.target.error);
  });
}

function tx(mode) {
  return db.transaction('takes', mode).objectStore('takes');
}

export function saveTake(blob, meta) {
  if (blob.size > 10 * 1024 * 1024) return Promise.reject(new Error('blob too large'));
  return new Promise((resolve, reject) => {
    const record = { blob, createdAt: Date.now(), ...meta };
    const req = tx('readwrite').add(record);
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

export function updateTakeOffset(id, offset) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('takes', 'readwrite');
    const store = transaction.objectStore('takes');
    const req = store.get(id);
    req.onsuccess = (e) => {
      const record = e.target.result;
      if (!record) return reject(new Error('take not found'));
      record.offset = offset;
      const putReq = store.put(record);
      putReq.onsuccess = () => resolve();
      putReq.onerror = (ev) => reject(ev.target.error);
    };
    req.onerror = (e) => reject(e.target.error);
  });
}

export function getAllTakes() {
  return new Promise((resolve, reject) => {
    const req = tx('readonly').getAll();
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

export function deleteLastTake() {
  return new Promise((resolve, reject) => {
    getAllTakes().then((takes) => {
      if (!takes.length) return resolve([]);
      const last = takes[takes.length - 1];
      const req = tx('readwrite').delete(last.id);
      req.onsuccess = () => getAllTakes().then(resolve).catch(reject);
      req.onerror = (e) => reject(e.target.error);
    }).catch(reject);
  });
}

export function clearAll() {
  return new Promise((resolve, reject) => {
    const req = tx('readwrite').clear();
    req.onsuccess = () => resolve();
    req.onerror = (e) => reject(e.target.error);
  });
}

export function sizeEstimate() {
  return getAllTakes().then((takes) => takes.reduce((sum, t) => sum + t.blob.size, 0));
}
