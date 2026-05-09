TASK 1 — app skeleton + auth + repo load

GOAL
boot SPA. capture token. load repo tree.

SCOPE
- index.html shell
- van.js mount
- state init
- token input + persist
- repo input (owner/name)
- fetch tree (main)
- render flat list (paths only)

STEPS
1. create index.html
   - meta viewport
   - van.js CDN
   - root div

2. init state
   - read token, repo from localStorage
   - empty tree, file

3. auth UI
   - input[type=password] token
   - save btn → localStorage

4. repo UI
   - input repo (owner/name)
   - load btn

5. fetch tree
   - call GET /git/trees/main?recursive=1
   - headers: Authorization: Bearer {token}
   - filter type=blob
   - map → [{path, sha}]

6. render list
   - simple scroll list
   - each item clickable (no action yet)

7. error handling
   - invalid token → show msg
   - bad repo → show msg

8. minimal styles
   - mobile first
   - vertical stack
   - overflow scroll

DONE CRITERIA
- token saved/reloaded
- repo load returns file list
- list renders stable
- no console errors
