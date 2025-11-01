import path from 'path';
import url from 'url';

import _ from 'lodash-es';

import fsExtra from 'fs-extra/esm';

import fs from 'fs/promises';

const getRouteConfig = async routesDir => {
  const routes = {};

  const content = await fs.readdir(routesDir, {recursive: true});

  for(const element of content) {
    const file = path.resolve(routesDir, element);
    const stat = await fs.stat(file);

    if(stat.isDirectory()) {
      // console.log(element, 'is dir', file, stat, stat.isDirectory())
    } else {
      // console.log(element, 'is file', file, stat, stat.isDirectory())
      routes[element] = (await import(url.pathToFileURL(path.join(routesDir, element)))).default;
    }
  }

  return routes;
}

const registerRoutes = async function(app, params) {
  const {logger} = params;

  const routes = await getRouteConfig('./routes/');

  for(const [key, value] of Object.entries(routes)) {
    const route = await value(params);
    const functions = [];

    // console.log(key, {route});

    if(typeof route.fn !== 'function') {
      throw new Error(`routes[${key}] is not a function`);
    }

    functions.push(route.fn);

    let finalUrl = '/api';

    if(route.path) {
      finalUrl += route.path;
    } else {
      finalUrl += `/` + key.split('\\').join('/').replace('.js', '');
    }

    app[route.method](finalUrl, functions);

    logger.debug(`Registered route ${route.method} - ${finalUrl}`);
  }
};

export default registerRoutes;
