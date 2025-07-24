import LifecycleManager from '/components/LifecycleManager.js'
import van from '/lib/ui/van-wrapper.js'
import { transformValues } from '/lib/utils.js'

const HASHBANG = '#!'
const QUERY_DELIMITER = '?'
const PAGES_FOLDER_NAME = 'pages'

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

function visit(path) {
  location.hash = path
}

// TODO: receive loading and error components
export function getFileSystemRouter() {
  let root = document.createElement('div') // this is rendered while loading the initial page

  window.addEventListener('hashchange', (e) => renderFromFileSystem(e.newURL))
  renderFromFileSystem(location.href)

  return () => root

  async function renderFromFileSystem(url) {
    const path = getBasePath(url)
    const page = await fetchPage(path)
    const pageElement = page()
    root.replaceWith(pageElement)
    root = pageElement
  }
}

function getBasePath(urlString) {
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
  let page = await importDefault(path + '.js')
  if (page) {
    return page
  }

  page = await importDefault(path + '/index.js')
  if (page) {
    return page
  }

  const param = getParam(path)
  if (param) {
    const basePath = path.slice(0, -param.length)
    page = await importDefault(basePath + '_param.js')
    if (page) {
      return () => page({ param })
    }
  }

  return () => h1('page not found')
}

const invalidPaths = {}

async function importDefault(path) {
  if (path in invalidPaths) {
    return null
  }

  const response = await fetch(path)
  if (response.status === 404) {
    invalidPaths[path] = true
    return null
  }

  const module = await import(path)
  return module.default
}

function getParam(path) {
  const paramIndex = path.lastIndexOf('/') + 1
  const param = path.slice(paramIndex)
  return param || null
}
