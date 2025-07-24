import LifecycleManager from '/components/LifecycleManager.js'
import van from '/lib/ui/van-wrapper.js'
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
    `^${path.replace(':param', '(\\w+)')}$`,
    handler,
  ])
}

export function visit(path) {
  location.hash = path
}

// TODO: receive loading and error components
export function getFileSystemRouter() {
  let root = document.createElement('div') // this is rendered while loading the initial page

  window.addEventListener('hashchange', (e) => renderFromFileSystem(e.newURL))
  renderFromFileSystem(location.href)

  return () => root

  async function renderFromFileSystem(url) {
    const path = getPageFileBasePath(url)
    const page = await fetchPage(path)
    root.replaceWith(page)
    root = page
  }
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

async function fetchPage(path) {
  for (const suffix of PAGE_FILE_SUFFIXES) {
    const page = await importDefault(path + suffix)
    if (page) {
      return page()
    }
  }
  return h1('page not found')
}

const invalidPaths = {}

async function importDefault(path) {
  if (path in invalidPaths) {
    return null
  }

  // prefetch to distinguish page not found from other import errors
  const response = await fetch(path)
  if (response.status === 404) {
    invalidPaths[path] = true
    return null
  }

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
