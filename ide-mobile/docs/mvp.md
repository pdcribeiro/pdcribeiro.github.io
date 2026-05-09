MVP SPEC — minimal mobile-first secure web IDE (no backend)

GOAL
single-page PWA. edit repo files. commit/push main. zero server.

STACK
- FE: van.js
- APIs: GitHub REST v3
- Auth: GitHub fine-grained PAT (user input, stored local)
- Storage: localStorage (token, lastRepo)

SCOPE
- single repo active
- file CRUD (read/create/update/delete)
- commit + push main
- no branches, no PRs, no multi-repo state

FLOW
1. open app
2. paste token
3. input repo (owner/name)
4. load tree
5. select file → edit
6. save → commit → push main
7. switch repo → reset state

SECURITY
- token never leaves browser
- no external calls except api.github.com
- CSP strict (default-src 'self')
- no eval, no deps except van.js

UI (mobile-first)
- top bar: repo, switch btn
- left drawer: file tree
- main: textarea editor
- bottom bar: save/delete/new
- minimal CSS, no frameworks

DATA MODEL
state = {
  token: string,
  repo: string,
  tree: [{path, sha, type}],
  file: {path, content, sha}
}

API OPS
- GET /repos/{owner}/{repo}/git/trees/main?recursive=1
- GET /repos/{owner}/{repo}/contents/{path}
- PUT /repos/{owner}/{repo}/contents/{path}
- DELETE /repos/{owner}/{repo}/contents/{path}

CONSTRAINTS
- base64 encode content
- include sha for updates/deletes
- commit msg fixed: "update via ide"

BUILD
- single index.html
- inline JS (van.js CDN)
- no bundler

DELIVERABLE NEXT
task breakdown → implement skeleton + auth + repo load
