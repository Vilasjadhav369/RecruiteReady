import app from '../app.js';

function extractEndpoints(app) {
  const routes = [];

  function processMiddleware(middleware, prefix = '') {
    if (middleware.route) {
      const path = prefix + (middleware.route.path === '/' && prefix ? '' : middleware.route.path);
      const methods = Object.keys(middleware.route.methods)
        .map((m) => m.toUpperCase())
        .join(', ');
      routes.push(`${methods.padEnd(7)} ${path}`);
    } else if (middleware.name === 'router' && middleware.handle?.stack) {
      let routerPrefix = prefix;
      // Extract path prefix from regex
      if (middleware.regexp) {
        const match = middleware.regexp.source
          .replace('^\\', '')
          .replace('\\/?(?=\\/|$)', '')
          .replace('?(?=\\/|$)', '')
          .replace(/\\\//g, '/')
          .replace(/\^/g, '')
          .replace(/\$/g, '')
          .replace(/\/\?\(\?=\/\|\$\)/g, '')
          .replace(/\/\?\(\?=\\\/\|\$\)/g, '')
          .replace(/\(\?:\([^\)]+\)\)\?/g, '')
          .replace(/\\/g, '');
        if (match && match !== '/') {
          routerPrefix = prefix + match;
        }
      }
      middleware.handle.stack.forEach((subLayer) => {
        processMiddleware(subLayer, routerPrefix);
      });
    }
  }

  app._router.stack.forEach((layer) => {
    processMiddleware(layer);
  });

  return routes.sort();
}

const routes = extractEndpoints(app);
console.log(`Total registered routes: ${routes.length}`);
routes.forEach((r) => console.log(`  ${r}`));
