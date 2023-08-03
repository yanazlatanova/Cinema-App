// Simplify states, contexts and binding to forms
// as well as fetching data from an API and storing
// it in the state

// To fully understand this code you need to understand:
// 1. How React useState works
// 2. How React useEffect works
// 3. How proxies work in JS
// 4. That you can spread objects into attributes in React
// 5. How fetch works
// Otherwise you can just use it and be happy :)

// ironboy (Thomas Frank) 2022

import { useState, useDebugValue, useEffect } from 'react';

// an object in which we save states that has contextNames
// making it possible to use them across components
// in a way very similar to useContext - but with much
// less boiler plate code needed than for useContext
const savedStates = {};
const initializedWhere = {};

export function useStates(initObj, contextName) {

  // make it possible to send the context name as first
  // argument and the init obj (initial object/state) as the
  // second argument - i.e. switching the order of arguments
  // (practical since, depending on use case, we often just 
  //  want to send one of them)
  typeof initObj === 'string'
    && ([initObj, contextName] = [contextName, initObj]);

  // for easier viewing with named states in React dev tools
  // note: since you don't have to use a contextName if
  // the state should be local to one component we then set
  // the name to 'local state'
  useDebugValue(contextName || 'local state');

  // if trying to use an named state before initialization
  // throw an error
  if (contextName && !initObj && !savedStates[contextName]) {
    throwNiceError(`The named state "${contextName}"`
      + ` was accessed before initialization.`);
    return {};
  }

  // get the state from the savedStates if no initObj is sent
  // if useStates is called with just a contextName
  const [state, setState] = initObj ?
    useState({ state: initObj }) : savedStates[contextName];

  // if a contextName is provided then save the state in savedStates
  initObj && contextName && (savedStates[contextName] = [state, setState]);

  // if this is the initial setting of the state then log that
  if (state.state === initObj) {
    try { throw (new Error('get stack')) } catch (e) {
      let stack = e.stack.split('\n');
      let index = stack.findIndex(x => x.includes('react-dom')) - 1;
      let where = stack[index];
      if (initializedWhere[contextName] && where != initializedWhere[contextName]) {
        throwNiceError(`The named state "${contextName}"`
          + ` has already been initialized elsewhere.`);
        return {};
      }
      initializedWhere[contextName] = where;
    }
    debugLog('initialize', state, initObj, '', initObj, undefined, contextName);
  }

  // traps used by our recursive proxy when use get, set and delete
  // properties in the state - they call setState which
  // makes it possible to just change values (even in sub objects)
  // rather than callning a setter, but still React will rerender
  const proxyHandler = {
    get(obj, key) {
      debugLog('get', state, obj, key, obj[key], undefined, contextName);
      return { /* special keys */
        _isProxy: true,
        bind: (...args) => bind(makeProxy(obj), ...args)
      }[key]
        || makeProxy(obj[key]);
    },
    set(obj, key, val) {
      let valBefore = obj[key];
      obj[key] = val;
      setState({ ...state });
      debugLog('set', state, obj, key, val, valBefore, contextName);
      return true;
    },
    deleteProperty(obj, key) {
      let valBefore = obj[key];
      delete obj[key];
      setState({ ...state });
      debugLog('delete', state, obj, key, undefined, valBefore, contextName);
      return true;
    }
  };

  // a function that creates a proxy using the proxyHandler
  // it also makes sure that we don't 'double proxy' an object
  const makeProxy = x => x instanceof Object && !x._isProxy ?
    new Proxy(x, proxyHandler) : x;

  // proxied state
  const proxiedState = makeProxy(state.state);

  // check if we should fetch things
  // TODO: Can vi stop using initObj and use state instead?
  // So that we can add fetch after initial creation?
  checkForFetch(initObj, proxiedState);

  // return the state as a proxy
  return proxiedState;
}

// simplify binding of input fields to state ('controlled components')
//
// example, if your state is
// const s = useStates('main', { username: ''}, likesDogs: 'yes')

// all you need to do to bind an input field is
// <input type="text" {...s.bind('username')} />

// (and this translates automatically to [no need to write]:
// <input type="text" name="username" onChange={e => s.name = e.target.value} />)
//
// special case, radio buttons:
// Do you like dogs?
// <input type="radio" {...s.bind('likesDogs', 'yes')} /> Yes
// <input type="radio" {...s.bind('likesDogs', 'no')} /> No
//
// special case, checkbutton
// <input type="checkbox" {...s.bind('likesDogs', 'yes', 'no')} /> I like dogs.

function bind(obj, name, value = obj[name], altValue) {
  return {
    name,
    value,
    checked: obj[name] === value,
    onChange: ({ target: t }) =>
      t.type === 'checkbox' ?
        obj[name] = t.checked ? value : altValue :
        obj[name] = t.type === 'number' ?
          (isNaN(+t.value) ? t.value : +t.value) : t.value
  }
}

// Helpers for fetch use like this
// useStates({
//  animals: fetch('/api/animals.json')
// });
// 
// you can also specify type of data (default is json)
// so in this case we fetch text instead of json
//
// useStates({
//  hamlet: fetch('/api/hamlet.txt', 'text')
// });

const fetchSymbol = {}, fetchedMemory = {};

export function useFetch(url, type = 'json') {
  // return an array initially since an empty array renders
  // without error in React (and since it is common to except
  // an array in return if the data format is json)
  // but make the array special so we can find it in checkForFetch
  // (in js arrays are objects and can have properties as well as items)
  return Object.assign([], { x: fetchSymbol, url, type, unfetched: true });
}

async function checkForFetch(initObj, state) {
  useEffect(() => {
    // use JSON.stringify to recursively; go through
    // initObj and find all useFetch objects we will want to use fetch on
    let mem = [];
    JSON.stringify(initObj, function (key, val) {
      let path = (mem.find(x => x.val === this) || { path: [] }).path;
      mem.push({ obj: this, key, val, path: [...path, key] });
      return val;
    });
    let useFetchOn = mem
      .filter(({ val }) => val && val.x === fetchSymbol)
      .map(x => ({ path: x.path.slice(1), url: x.val.url, type: x.val.type }));
    let memKeys = {};
    // loop through the useFetch objects and fetch if
    // we have not done so already since mount
    for (let { path, url, type } of useFetchOn) {
      let memKey = [path.join('/'), url, type].join('***');
      if (fetchedMemory[memKey]) { continue; }
      fetchedMemory[memKey] = true;
      memKeys[memKey] = true;
      (async () => {
        // fetch
        let result = await (await fetch(url))[type]();
        // change the state
        let s = state, p = [...path];
        while (p.length > 1) { s = s[p.shift()]; }
        s[p[0]] = result;
      })();
    }
    // un unmount clear the memory of things fetched
    // (also unbounce so that we don't fetch twice in React StrictMode,
    //  since StrictMdoe runs mount, unmount twice...)
    let mounted = Date.now();
    return () => {
      // debounce React StrictMode
      if (Date.now() - mounted < 100) {
        return;
      }
      for (let key in memKeys) {
        delete fetchedMemory[key];
      }
    }
  }, []);
}

// useInterval = setInterval that starts on mounts and ends on unmount
export function useInterval(_function, milliseconds) {
  let interval;
  useEffect(() => {
    _function(); // call intially as well
    interval = setInterval(_function, milliseconds);
    return () => clearInterval(interval);
  }, []);
  return interval;
}

// Returns a method that resets a form connected to a state obj
const formOrgStateMem = {};
function formReset(stateObj) {
  useEffect(() => {
    formOrgStateMem[Object.keys(stateObj)] = { ...stateObj };
    return () => {
      delete formOrgStateMem[Object.keys(stateObj)];
    }
  }, []);
  return () => {
    Object.assign(stateObj, formOrgStateMem[Object.keys(stateObj)]);
  }
}

// Submits a form connected to a state obj to an url,
// can run a method (then) after submit
export function useFormSubmit(
  stateObj,
  url = '/',
  then = () => { },
  method = 'POST',
  type = 'json'
) {
  async function onSubmit(e) {
    let body;
    if (type === 'json') {
      body = JSON.stringify(stateObj);
    }
    else {
      body = new FormData();
      for (let [key, val] of Object.entries(stateObj)) {
        body.append(key, val);
      }
    }
    e.preventDefault();
    let result;
    result = await fetch(url, {
      method,
      ...(type === 'json' ? { headers: { 'Content-Type': 'application/json' } } : {}),
      body
    }).catch(e => result = { _error: e + '' });
    let kindaError = result && result.status && (result.status + '')[0] !== 2 && {
      _status: {
        status: result.status,
        statusText: result.statusText,
      }
    };
    result.json && (
      result = await result.json().catch(e => result = { _error: e + '' })
    );
    if (result._error && kindaError) {
      result = { ...result, ...kindaError };
    }
    then(result);
  }
  return [{ onSubmit }, formReset(stateObj)];
}

// debug what is changed in a state and which component that made the change
// to get the stack throw an error and catch it, go through the error stack
// and find the file/component that made the state change...
// - note that Error.stack is non-standardized and different depending on browser

export function useDebug(includeGet = false) {
  window.___debugStates___ = true;
  window.___debugStattesIncludeGet___ = includeGet;
}

let debounceMem = []; // since React.StrictMode runs mount/unmount x 2

async function debugLog(action, state, obj, key, newValue, oldValue, contextName, stack) {
  if (!window.___debugStates___) { return; }
  if (!window.___debugStattesIncludeGet___ && action === 'get') { return; }
  // no need to see setting of length
  if (obj instanceof Array && key === 'length') {
    return;
  }
  // get the stack
  if (!stack) {
    try { throw (new Error('No real error. Getting the stack.')) }
    catch (e) {
      stack = e.stack.split('\n');
      // no need to keep react-dom part
      let index = stack.findIndex(x => x.includes('react-dom'));
      stack = stack.slice(0, index);
    }
  }
  // don't start a new debugLog before the previous one has finished
  if (window.___debugLock___) {
    setTimeout(() => debugLog(...arguments, stack), 10);
    return;
  }
  // important: no more returns from here on 
  // unless you reset ___debugLock___ to false
  window.___debugLock___ = true;
  // only keep items < 100 ms old in debounceMem
  debounceMem = debounceMem.filter(x => Date.now() - x.time < 100);
  // if stack in debounceMem then don't do anything
  let debounce = debounceMem.find(x => x.stack === stack.join('\n'));
  if (debounce) { window.___debugLock___ = false; return; }
  debounceMem.push({ time: Date.now(), stack: stack.join('\n') });
  // main parsing starts
  let isFirefox = 'netscape' in window;
  let isSafari = navigator['ven' + 'dor'].includes('Apple');
  let mem = [];
  JSON.stringify(state, function (key, val) {
    let path = (mem.find(x => x.val === this) || { path: [] }).path;
    mem.push({ obj: this, key, val, path: [...path, key] });
    return val;
  });
  let path = '';
  try {
    path = mem.find(x => x.obj === obj)
      .path.slice(2, -1).concat(key);
  } catch (e) { }
  let output;
  try {
    // Get detailed info from the stack
    let finders = {
      'get': x => x.indexOf('get@') === 0
        || x.includes('at Object.get '),
      'set': x => x.indexOf('set@') === 0
        || x.includes('at Object.set '),
      'delete': x => x.indexOf('@deleteProperty') === 0
        || x.includes('at Object.deleteProperty'),
      'initialize': x => x.indexOf('@useStates') === 0 ||
        x.includes('at useStates')
    };
    let details = stack.slice(-1)[0];
    let endIndex = Math.max(...['?', '.jsx', 'js'].map(x => details.lastIndexOf(x) + (x.length < 2 ? 0 : x.length)));
    let url = details.slice(details.indexOf('http'), endIndex);
    let [line, column] = details.split(':').slice(-2);
    // Read source map from transpiled file
    let fileContent = url.split('src/')[1] ? await (await fetch(url)).text() : '';
    let sourceMap = fileContent.slice(fileContent.indexOf('//# source' + 'MappingURL'));
    // Create output
    output = [
      'state name', contextName || 'none, local state',
      'action', action + (action === 'initialize' ? '' : (' ' + path
        .map(x => isNaN(+x) ? '.' + x : '[' + x + ']').join('').slice(1))),
      '', '',
      'file', url.split('src/')[1] || 'Only available in dev mode.',
      'time', new Date().toISOString(),
      '', '',
      ...(action === 'initialize' ? [] : action === 'get' ?
        ['value', '%O'] : ['old value', '%O', 'new value', '%O']),
      'state', '%O'
    ];
    // format and color console output
    let font = isSafari ? "font-family: monospace;" : '';
    let styleAlts = [
      'color: rgb(19, 105, 42);' + font,
      'color: rgb(11, 30, 124);'
    ];
    let styles = [];
    output = '\n' + output.map((x, i) => {
      styles.push(styleAlts[i % 2]);
      x = i % 2 === 0 ? x.padEnd(14, ' ') : x + '\n';
      return '%c' + x;
    }).join('');
    // insert old and new values
    if (action !== 'initialize') {
      if (action !== 'get') { styles.splice(styles.length - 4, 0, oldValue); }
      styles.splice(styles.length - 2, 0, newValue);
    }
    styles.push(state.state);
    // final merge of output and styles
    output = [output, ...styles];
    window.___stateDebugOutput___ = output;
    // gives us source mapping:
    let src = '\n'.repeat(line - 1) + ' '.repeat(column - 1)
      + 'console.log(...window.___stateDebugOutput___);'
      + 'delete window.___debugLock___;/*remover*/\n'
      + (sourceMap.length > 10 ? sourceMap : '');
    // Now console.log from our temp script with the mapping
    // we borrowed from the transpiled file
    if (isFirefox) {
      // Firefox - just eval
      window['lave'.split('').reverse().join('')](src);
    }
    else {
      // Create a temp script and load - better for Chrome, a must in Safari
      let script = document.createElement('script');
      let className = 'a' + (Math.random() + '').split('.')[1];
      script.classList.add(className);
      script.type = 'module';
      src = src.replace('/*remover*/',
        ';document.querySelector(".' + className + '").remove();\n');
      script.src = 'data:application/javascript;base64,' + window.btoa(src);
      document.body.append(script);
    }
  }
  // if something goes wrong in our debug code
  catch (e) {
    console.log(...(output ? output : ['Could not extract debug details.']));
  }
}

async function throwNiceError(message) {
  throw (new Error(message))
  window.___debugLock___ = true;
  try {
    throw (new Error('stack trace'));
  }
  catch (e) {
    let stack = e.stack.split('\n');
    let index = stack.findIndex(x => x.includes('react-dom'));
    stack = stack.slice(0, index);
    let details = stack.slice(-1)[0];
    let endIndex = Math.max(...['?', '.jsx', 'js'].map(x => details.lastIndexOf(x) + (x.length < 2 ? 0 : x.length)));
    let url = details.slice(details.indexOf('http'), endIndex);
    let [line, column] = details.split(':').slice(-2);
    // Read source map from transpiled file
    let fileContent = url.split('src/')[1] ? await (await fetch(url)).text() : '';
    let sourceMap = fileContent.slice(fileContent.indexOf('//# source' + 'MappingURL'));
    let src = '\n'.repeat(line - 1) + ' '.repeat(column - 1)
      + 'console.log(...window.___stateDebugOutput___);'
      + 'delete window.___debugLock___;/*remover*/\n'
      + (sourceMap.length > 10 ? sourceMap : '');
    console.log(src);
  }
}