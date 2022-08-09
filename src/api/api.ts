import createVirtualEnvironment from '@locker/near-membrane-dom';

interface Plugin {
  name: string
  exec: Function
}

interface PluginRegistry {
  [key: string]: Function;
}

interface Token {
  name: string
  value: string
}

const pluginHtml = `<h1>Ciao</h1>`

const pluginCode = `
const { setToken, removeToken } = geenes();
function ciao () {
  console.log('ciao', document)
  removeToken()
}
setToken("--color-rnd", "hsl("+ Math.random() * 360 +"deg, 50%, 40%)");
// setInterval(ciao, 5000);
// const elm = document.createElement('p');
// document.querySelector('h1').innerHTML = 'wee zio'
`

// TODO:create core tokens engine and move these  
const setToken = (id: string, {name, value} : Token): void => {
  tokens.set(id, {name, value})
}
const removeToken = (id: string): void => {
  tokens.delete(id)
}
const tokensMap = new Map<string, Token>();
const tokens = new Proxy(tokensMap, {
  get(target, prop, receiver) {
    var obj = Reflect.get(target, prop, receiver);
    if (prop === "set" && typeof obj === "function") {
      // When `proxy.set` is accessed, return your own
      // fake implementation that implements the custom behaviour, then
      // calls the original .set() behavior.
      const origSet = obj;
      obj = function(key: string, {name, value}: Token) {
        const prevToken = tokensMap.get(key)
        if (prevToken) {
          document.getElementById('blueprint')!.style.removeProperty(prevToken.name)
        }
        document.getElementById('blueprint')!.style.setProperty(name, value)
        return origSet.apply(tokensMap, arguments);
      };
    } else if (prop === "delete" && typeof obj === "function") {
      const origSet = obj;
      obj = function(key: string) {
        const prevToken = tokensMap.get(key)
        if (prevToken) {
          document.getElementById('blueprint')!.style.removeProperty(prevToken.name)
        }
        return origSet.apply(tokensMap, arguments);
      };
    }
    return obj;
  }
});

const internalApi = new Map<string, Function>();
// Register the core functions
internalApi.set('setToken', setToken)
internalApi.set('removeToken', removeToken)


// listening for pluginMessage from outer realm
// The plugin core API will dispatch a pluginMessage event that invoce a core function.
// the core functions are mapped in the internalApi map.

window.addEventListener("message", (event) => {
  // Do we trust the sender of this message?  (might be
  // different from what we originally opened, for example).
  if (event.origin !== window.location.origin || typeof event.data !== 'string')
    return;

  const { pluginMessage } =  JSON.parse(event.data)
  if (!pluginMessage)
    return;
  const { funcName, funcValue } =  pluginMessage
  console.log('hey message', funcName, funcValue)
  const func = internalApi.get(funcName)
  const {name, val} = JSON.parse(funcValue)
  func!(instanceID, {name, value: val})

}, false);

// This distortion maps will allow to filter out certain features that pose a security issue
const { value } = Object.getOwnPropertyDescriptor(Element.prototype, 'remove') as {value: Function};

const distortionMap = new Map([
  [
    value,
      () => {
          console.error('forbidden');
          return null;
      },
  ],
]);

// Instantiate a new plugin
// Let's start by the plugin UI into a new iframe
var iframe = document.createElement('iframe')
// Let's hide it
iframe.setAttribute('hidden', '')
// Let's add the plugin html ui into the iframe
iframe.contentDocument?.open()
iframe.contentDocument?.write(pluginHtml)
iframe.contentDocument?.close()
// finally let's add it to the dom so it's available
document.body.appendChild(iframe)
// Let's use the iframe window object to create a new realm
const realm = createVirtualEnvironment(iframe.contentWindow as Window & typeof globalThis, {
  distortionCallback(v) {
    return distortionMap.get(v as Function) ?? v;
  },
});

// Plugin framework
// This code is created by the core Geenes team and exposes certain APIs in a geenes function object
// dispatch is not exposed so calling it from a code into a realm will trow an error
const framework = `
'use strict';
class GeenesPluginEvent extends CustomEvent {};
const dispatch = ({funcName, funcValue}) => {
  window.parent.postMessage(JSON.stringify({pluginMessage: {funcName, funcValue}}), '*', );
}

const setToken = (name, val) => {
  const funcName = 'setToken';
  const funcValue = JSON.stringify({name, val});
  dispatch({funcName, funcValue});
};

const removeToken = () => {
  const funcName = 'removeToken';
  dispatch({funcName});
};

globalThis.geenes = () => {
  return {
    setToken,
    removeToken
  }
};
`
realm.evaluate(framework)

// Plugin configuration
// This is the id coming from the file
const instanceID = 'xxx'

// Plugin code
try {
  realm.evaluate(pluginCode)
} catch (error) {
  console.error(error)
}
