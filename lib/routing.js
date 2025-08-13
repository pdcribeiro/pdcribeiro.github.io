import LifecycleManager from '/components/LifecycleManager.js'
import van, { waitPromise } from '/lib/ui/van-wrapper.js'
import { transformValues } from '/lib/utils.js'

const HASHBANG = '#!'
const QUERY_DELIMITER = '?'
const PAGES_FOLDER_NAME = 'pages'
const PAGE_FILE_SUFFIXES = ['.js', '/index.js']

const rootPathHash = HASHBANG + '/'

// note: must use hash based routing because apps are served as static files
export default {
  route(routes) {
    const getPath = (url) => (new URL(url).hash || rootPathHash).split(QUERY_DELIMITER)[0]
    const path = van.state(getPath(location.href))
    window.addEventListener('hashchange', (e) => (path.val = getPath(e.newURL)))

    return () => {
      console.debug('[router]', { path: path.val })
      for (const [pattern, handler] of getRoutesWithMatchPatterns(routes)) {
        const match = path.val.match(pattern)
        console.debug('[router]', { pattern, match })
        if (match) {
          return handler({ param: match[1] })
        }
      }
      throw new Error('[router] invalid path')
    }
  },
  redirect(path) {
    return () => LifecycleManager({ onmount: () => visit(path) })
  },
  getPathHelpers(paths) {
    return transformValues(paths, (path) => {
      const getPath = (param = null) => HASHBANG + (param ? path.replace(':param', param) : path)
      return {
        getPath,
        visit: (param = null) => visit(getPath(param)),
      }
    })
  },
}

function getRoutesWithMatchPatterns(routes) {
  return Object.entries(routes).map(([path, handler]) => [
    `^${path.replace(':param', '([\\w-]+)')}$`,
    handler,
  ])
}

export function visit(path) {
  location.hash = path
}

export function FileSystemRouter(props) {
  const url = van.state(location.href)
  const page = van.derive(() => fetchPageFromFileSystem(url.val))

  window.addEventListener('hashchange', (e) => url.val = e.newURL)

  return div(
    () => waitPromise(page.val, (p) => p({ ...props, params: getUrlParams() }))
  )
}


async function fetchPageFromFileSystem(url) {
  const path = getPageFileBasePath(url)
  const page = await findAndFetchPage(path)
  return page
}

function getPageFileBasePath(urlString) {
  const url = new URL(urlString)
  const urlPath = trimEndForwardSlash(url.pathname)
  const hash = url.hash || rootPathHash
  const hashPath = trimEndForwardSlash(
    hash.slice(HASHBANG.length).split(QUERY_DELIMITER)[0]
  )
  return urlPath + '/' + PAGES_FOLDER_NAME + hashPath
}

function trimEndForwardSlash(text) {
  return text.replace(/\/$/, '')
}

async function findAndFetchPage(basePath) {
  for (const suffix of PAGE_FILE_SUFFIXES) {
    const path = basePath + suffix
    if (await checkPageExists(path)) { // to distinguish page not found from other import errors
      return await importDefault(path)
    }
  }
  return h1('page not found')
}

const invalidPaths = {}

async function checkPageExists(path) {
  if (path in invalidPaths) {
    return false
  }
  const response = await fetch(path, { method: 'HEAD' })
  if (response.status === 404) {
    invalidPaths[path] = true
    return false
  }
  return true
}

async function importDefault(path) {
  const module = await import(path)
  return module.default
}

export function getUrlParams() {
  const query = location.hash.split(QUERY_DELIMITER)[1]
  if (!query) {
    return {}
  }
  return Object.fromEntries(
    new URLSearchParams(query).entries()
  )
}
