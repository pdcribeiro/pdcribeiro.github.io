import LifecycleManager from '/components/LifecycleManager.js';
import { transformValues } from '/lib/utils.js';
import van from '/third-party/van.js';

// note: must use hash based routing because apps are served as static files
export default {
  route(routes) {
    const getPath = (url) => (new URL(url).hash || '#!/').split('?')[0];
    const path = van.state(getPath(location.href));
    window.addEventListener('hashchange', (e) => (path.val = getPath(e.newURL)));

    return () => {
      console.debug('[router]', { path: path.val });
      for (const [pattern, handler] of getRoutesWithMatchPatterns(routes)) {
        const match = path.val.match(pattern);
        console.debug('[router]', { pattern, match });
        if (match) {
          return handler({ param: match[1] });
        }
      }
      throw new Error('[router] invalid path');
    };
  },
  redirect(path) {
    return () => LifecycleManager({ onmount: () => visit(path) });
  },
  getPathHelpers(paths) {
    return transformValues(paths, (path) => {
      const getPath = (param = null) => `#!${param ? path.replace(':param', param) : path}`;
      return {
        getPath,
        visit: (param = null) => visit(getPath(param)),
      };
    });
  },
};

function getRoutesWithMatchPatterns(routes) {
  return Object.entries(routes).map(([path, handler]) => [
    `^${path.replace(':param', '(\\w+)')}$`,
    handler,
  ]);
}

function visit(path) {
  location.hash = path;
}
