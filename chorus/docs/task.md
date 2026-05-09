TASK T4 storage (IndexedDB)

GOAL
persist takes (blobs) + meta. async safe.

DB
- name: "recorderDB"
- version: 1
- store: "takes"
- keyPath: "id" (autoIncrement)

SCHEMA (record)
{
  id,            // number
  blob,          // Blob (audio)
  createdAt,     // timestamp ms
  duration,      // seconds
  peak,          // float 0..1
  gain           // float
}

STEP 1 init db
- open indexedDB("recorderDB",1)
- onupgradeneeded → createObjectStore("takes",{keyPath:"id",autoIncrement:true})
- store db ref (singleton)

STEP 2 helpers
- fn tx(mode) → db.transaction("takes",mode).objectStore("takes")

STEP 3 saveTake(blob, meta)
- build record {blob, createdAt:Date.now(), ...meta}
- tx("readwrite").add(record)
- return id (onsuccess)

STEP 4 getAllTakes()
- tx("readonly").getAll()
- return array ordered by id

STEP 5 deleteLastTake()
- getAll → last.id
- tx("readwrite").delete(last.id)

STEP 6 clearAll() (dev only)
- tx("readwrite").clear()

STEP 7 sizeEstimate()
- getAll → sum blob.size
- return bytes

STEP 8 chunk (optional guard)
- if blob.size > ~10MB → skip (future split)

ACs (no console; use alert)
- on SAVE (temp button):
  alert("saved id:"+id)

- on LIST (temp button):
  getAll → alert("takes:"+len)

- on DELETE LAST:
  after delete → alert("takes:"+newLen)

- on SIZE:
  alert("bytes:"+totalBytes)

- reload page:
  LIST shows persisted count >0

- offline mode:
  SAVE then reload → LIST stable

DONE