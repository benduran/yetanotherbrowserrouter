# yetanotherbrowserrouter
Yet Another Browser Router, or YABR for short. For those that want a simple, easy-to-understand client-side URL router.

## Why?
I know, I know, there are a million different ways to handle client-side URL routing for making a responsive, single-page application.
For me, a lover of all things ReactJS, I was offput by the way [React Router](https://github.com/ReactTraining/react-router) conflated UI components with URLs and browser history. To me, those seemed like incompatible items. I also wanted to react (no pun intended) when a route was entered or exited, yet I hadn't found a routing solution that made me happy. Enter [yabr](https://github.com/benduran/yetanotherbrowserrouter).

## Installation
`npm install yabr --save`

## Usage
```
const router = require('yabr');

router.init({
  '/user/:userId': {
    onEnter({ params, router }) {
      const { userId } = params;
      if (!db.userExists(userId)) {
        // User didn't exist, let's just go back to the index
        router.navigate('/');
      } else {
        const history = db.fetchUserHistory(userId);
        // TODO: Do some more stuff
      }
    },
    onExit() {
      alert('Leaving user editor');
    }
  },
  '/': {
    onEnter({ query }) {
      console.log('Hey, I am an index route with a querystring of ${query}');
    },
  },
});

```

## API
- `init(routes, onchange, useBrowserHistory = false)`
  - Initializes the router.
  - **Params**
    - `routes` - `Object` - Routes object, where the key is the route, in any format that is accepted by the [path-to-regexp](https://www.npmjs.com/package/path-to-regexp) format (which is famously used by [Express](https://expressjs.com/en/guide/routing.html)). The value of the key-value pair is an object that accepts three properties:
      - `onEnter({ pathname, query, params, router }, ...injectedParams)`
        - Function that is called when a route is entered. An object containing the current route `pathname`, `query` object, route `params` object, and current instance of `router`. Optionally, additional injected params are provided to the function, if these have been configured via the `inject` property (listed below).
      - `onExit({ router }, ...injectedParams)`
        - Function is called when a route has been left and a new route has taken over as the current route. An object containing the current instance of `router` is provided, as well as an optional injected set of params, if they've been configured with the `inject` property.
      - `inject` - `Array`
        - An array of parameters that you want to become applied as params to the `onEnter` and `onExit` functions. Useful if you want to keep your routes definitions in a separate module for better organization. Helps to avoid monolithic, massive JS files containing a ton of application logic.
          - ```
            router.init({
              '/user/:userId`: {
                onEnter({ params }, db, config) {
                  const results = db.query(config.userQuery);
                },
                inject: [ db, config ],
              },
            });
            ```
    - `onchange` - `Function` - Defaults to `undefined`
      - If a function is provided, it will be called whenever the URL changes in any way, regardless of whether
      a matching route was found. Function will be executed with one `Object` as its argument, containing the `pathname` and `search` of the URL.
      - ```
        router.init({ /* my routes here */ }, ({ pathname, search }) => {
          console.log(`URL path has changed to ${pathname}`);
          console.log(`Query string is now ${search}`);
        });
        ```
    - `useBrowserHistory` - `Boolean` - Defaults to `false`
      - If set to `true`, uses the HTML5 Browser History API to handle the URL routing. Defaults to `false`, which causes Hash History to be used instead.
        - See the [history](https://www.npmjs.com/package/history) package for information on these two history types.
- `start()`
  - Activates the router so that it can start responding to history / url changes. Fires off an initial URL change event when called, which will attempt to capture and match the current URL route present when `start()` is called.
- `navigate(url, query, merge = false)`
  - Creates a new history entry, updates the browser's current URL, and attempts to execute a matching route. Function accepts two parameters:
    - `url` - `String`
      - URL to set as current
    - `query` - `String` or `Object`
      - Either query string or query object to append to the URL you've provided.
    - `merge` - `Boolean` - Defaults to `false`
      - If `true`, attempts to merge the incoming query with the current query present in the browser's URL.
- `appendQuery(query, merge = false)`
  - Appends a new query string to the current URL. Accepts two parameters:
    - `query` - `Object`
      - Object containing key / values that will be serialized to the query string.
    - `merge` - `Boolean` - Defaults to `false`
      - If `true`, merges the `query` object you provide with the existing query string that is present in the current URL.
- `updatePropInQuery(prop, val)`
  - Updates a single property that is present in the current query string. If property does not already exist, it is added. Accepts two parameters:
    - `prop` - `String` - String name of the query property to update
    - `val` - `String` or `Number` - Value that will replace the current value
  `removePropFromQuery(prop)`
    - Removes a single property from the current query string. Accepts one parameter:
      - `prop` - `String` - Property to be removed from the query string.

## License
[MIT](https://opensource.org/licenses/MIT)
