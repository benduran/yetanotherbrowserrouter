
import createHashHistory from 'history/createHashHistory';
import createBrowserHistory from 'history/createBrowserHistory';
import pathToRegexp from 'path-to-regexp';
import qs from 'query-string';
import equal from 'deep-equal';

function omit(obj, ...toOmit) {
  const clone = {};
  /* eslint-disable no-restricted-syntax */
  for (const prop in obj) {
    if (toOmit.indexOf(prop) === -1) clone[prop] = obj[prop];
  }
  /* eslint-enable no-restricted-syntax */
  return clone;
}

/**
 * A simple URL router for the browser.
 * Rather than using the React Router, which conflates UI state with URL state,
 * this simply allows us to bind functions to route matches to trigger different
 * actions in our application.
 * @class Router
 */
class Router {
  /**
   * Creates an instance of Router.
   * @constructs Router
   * @memberof Router
   */
  constructor() {
    /**
     * Type of history to use with the URL router.
     * Supports either hashHistory or browserHistory
     * @memberof Router
     */
    this.history = null;
    /**
     * Route that was executed and is currently loaded in the browser
     * @memberof Router
     * @type {Object}
     */
    this.currentRoute = null;
    /**
     * Route that was last executed before the current route because active.
     * @memberof Router
     * @type {Object}
     */
    this.lastRoute = null;
    /**
     * Whether or not the router has been started and will begin listening to URL changes.
     * @type {Boolean}
     * @memberof Router
     */
    this.started = false;
    /**
     * Fired whenever the URL is changed, regardles of whether or not there is a matching route defined.
     * @type {Function}
     * @memberof Router
     */
    this.onchange = null;
  }
  /**
   * Initializes the router
   * @param {Object} [routes={}] - Routes path to function dictionary
   * @param {Function} onchange - (Optional) - If provided, will be executed whenever the URL changes for any reason.
   * @param {Boolean} [useBrowserHistory=false] - (Optional) If true, uses the HTML5 browser history, rather than legacy hash history.
   * @memberof Router
   */
  init(routes = {}, onchange, useBrowserHistory = false) {
    if (!routes) {
      throw new Error('No routes object was provided when initializing the router.');
    }
    this.onchange = onchange;
    this.history = useBrowserHistory ? createBrowserHistory() : createHashHistory();
    this.history.listen(this.onUrlChange.bind(this));
    this.routes = this._processRoutes(routes);
  }
  /**
   * Map the routes dictionary to an array of route objects
   * @param {Object} routes - Routes dictionary provided when router is constructed
   * @returns [Object[]] - Array of mapped route objects with format { onEnter, onExit, regexp, keys }
   * @private
   * @memberof Router
   */
  _processRoutes(routes) {
    return Object.keys(routes).map((route) => {
      const { onEnter, onExit, inject = [] } = routes[route];
      const keys = [];
      return {
        route,
        onEnter,
        onExit,
        inject, // Variables to inject into the onEnter and onExit methods, provided by calling application
        regexp: pathToRegexp(route, keys),
        keys, // Pass by reference to pathToRegexp, so this is safe
      };
    });
  }
  /**
   * Loops over all routes when the history has changed,
   * finds a matching route and fires its onEnter (if a match is found)
   * @param {Object} args
   * @param {String} args.pathname - Path that triggered the history change
   * @param {String} args.search - Query string when URL path changed
   * @param {String} args.hash - Hash state when URL path changed (Don't really need this in most cases)
   * @memberof Router
   */
  onUrlChange({ pathname, search }) {
    // Test against route regexes and see which one is currently matching
    if (this.started) {
      if (typeof this.onchange === 'function') this.onchange({ pathname, search });
      this.lastRoute = this.currentRoute;
      let onEnter = null;
      let found = false;
      for (let i = 0; i < this.routes.length; i++) {
        const routeObj = this.routes[i];
        const matches = routeObj.regexp.exec(pathname);
        if (matches && matches.length) {
          found = true;
          // Execute the onenter
          const params = {};
          for (let j = 1; j < matches.length; j++) {
            params[routeObj.keys[j - 1].name] = matches[j];
          }
          this.currentRoute = Object.assign({}, routeObj, { params });
          onEnter = () => { routeObj.onEnter({ pathname, query: qs.parse(search), params, router: this }, ...routeObj.inject); };
          break;
        }
      }
      if (!found) this.currentRoute = null; // If we didn't find a match, blank out the current route because the URL still changed
      const toOmit = ['inject', 'onEnter', 'onExit'];
      const shouldExecute = !this.lastRoute || (this.lastRoute && !this.currentRoute) || !equal(omit(this.lastRoute, ...toOmit), omit(this.currentRoute, ...toOmit));
      // Execute onexit for the last route, but only if the new route is different than the old one
      if (shouldExecute && this.lastRoute && this.lastRoute.onExit) this.lastRoute.onExit({ router: this }, ...this.lastRoute.inject);

      // Execute onenter if the current is different than the last route
      if (shouldExecute && onEnter) onEnter();
    }
  }
  /**
   * Starts the router and triggers whichever route is active on startup (if a match is found)
   * @memberof Router
   */
  start() {
    // Navigate to whichever route is currently active in the URL to kick off everything
    this.started = true;
    this.onUrlChange(this.history.location);
  }
  /**
   * Navigates to a desired url in the browser's history
   * @param {String} url - URL to navigate to.
   * @param {Object|String} query - Either query string or query object to be applied to URL.
   * @param {Boolean} [merge=false] - If true, attempts to merge the new query.
   * @memberof Router
   */
  navigate(url, query, merge = false) {
    if (!url) throw new Error('No url was provided when navigate was called on this instance of Router.');
    let urlToPush = url;
    const incomingQuery = typeof query === 'string' ? qs.parse(query) : query;
    const strQuery = qs.stringify(merge ? Object.assign({}, qs.parse(this.history.location.search), incomingQuery) : incomingQuery);
    if (strQuery) urlToPush += `?${strQuery}`;
    this.history.push(urlToPush);
  }
  /**
   * Appends a query string to the current route
   * @param {String|Object} query - Query string to append to current route. If object, will be converted to a query string.
   * @param {Boolean} [merge=false] - If true, merges the query string into the current query string. Defaults to false, which is a replacement.
   * @memberof Router
   */
  appendQuery(query, merge = false) {
    if (!query) throw new Error('No query string or object was provided when appendQuery was called on this instance of Router.');
    this.navigate(this.history.location.pathname, query, merge);
  }
}

const singletonRouter = new Router();

export default singletonRouter;
