const { routeDefinitions } = require('./routeDefinitions');
const { routeMatcher } = require('./routeMatcher');

// We have to require all pages here so that Netlify's zip-it-and-ship-it
// method will bundle them. That makes them available for our dynamic require
// statement later.
// We wrap this require in if(false) to make sure it is *not* executed when the
// function runs.
if (false) {
  require('./pagesIndex');
}

// Look through all routes and check each regex against the request URL
const getRoute = (url) => {
  const { route, params, parsedUrl } = routeMatcher(url, routeDefinitions);

  // Return the route or the error page
  if (route) {
    return { route, params, parsedUrl };
  }
  return { route: { page: '_error.js' }, params, parsedUrl };
};

/*
`event` object
{
  "path": "Path parameter",
  "httpMethod": "Incoming request's method name"
  "headers": {Incoming request headers}
  "queryStringParameters": {
      "query": "1234ABCD"
  },
  "body": "A JSON string of the request payload."
  "isBase64Encoded": "A boolean flag to indicate if the applicable request payload is Base64-encode"
}
*/

exports.handler = async (event, context) => {
  // The following lines set event.path in development environments.
  // There is a difference in how Netlify handles redirects locally vs
  // production. Locally, event.path is set to the target of the redirect:
  // /.netlify/functions/nextRouter?_path=...
  // Deployed on Netlify, event.path is the source of the redirect: /posts/3
  const isProduction = context.hasOwnProperty('awsRequestId');
  if (!isProduction) {
    event.path = event.queryStringParameters._path;
  }

  // Get the request URL
  const path = ensureLeadingSlash(event.path);
  console.log('[request]', path);

  // Identify the file to render
  const { route, params } = getRoute(path);
  console.log('[render] ', route);

  // Load the page to render
  // Do not do this: const page = require(`./${file}`)
  // Otherwise, Netlify's zip-it-and-ship-it will attempt to bundle "./"
  // into the function's zip folder and the build will fail
  const pathToFile = `./pages/${route.page}`;
  const pageModule = require(pathToFile);
  const renderer = pageModule.renderReqToHTML;
  console.log('renderer', renderer);

  // TODO: ideally, we should set the `mockReq` body to the `event.body` value. This requires
  // creating `mockReq` as a writeable stream.
  const mockReq = {
    headers: event.headers,
    // TODO: url should include querystring params
    url: path,
  };
  console.log('mockReq.url', mockReq.url);

  // Allows the app to easily determine whether or not it is being rendered via JSS rendering host.
  // mockReq.isJssRenderingHostRequest = true;
  // Attach the parsed JSS data as an arbitrary property on the `req` object
  // mockReq.jssData = { route: appData, viewBag: { dictionary: null, language } };

  const headers = {};
  // let html = null;
  const mockRes = {
    setHeader(key, val) {
      headers[key] = val;
    },
    getHeader(key) {
      return headers[key];
    },
    // end(result) {
    //   html = result;
    // },
  };

  // Render the page

  try {
    const html = await renderer(mockReq, mockRes, false, {}, params);

    return {
      statusCode: 200,
      body: html,
    };
  } catch (error) {
    console.error('A rendering error occurred', error);
    return {
      statusCode: 500,
      body: error,
    };
  }

  // compat(page)(
  //   {
  //     ...event,
  //     // Required. Otherwise, compat() will complain
  //     requestContext: {},
  //     // Optional: Pass additional parameters to NextJS
  //     multiValueQueryStringParameters: {},
  //   },
  //   context,
  //   callback
  // );
};

function ensureLeadingSlash(route) {
  const formattedRoute = !route.startsWith('/') ? `/${route}` : route;
  return formattedRoute;
}
