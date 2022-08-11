interface Token {
  name: string
  value: string
}

// The element which holds all the tokens
// if it doesn't exist fall back on body
const elmTokensHolder = 
document.getElementById('blueprint')
|| 
document.body

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
          elmTokensHolder.style.removeProperty(prevToken.name)
        }
        elmTokensHolder.style.setProperty(name, value)
        return origSet.apply(tokensMap, arguments);
      };
    } else if (prop === "delete" && typeof obj === "function") {
      const origSet = obj;
      obj = function(key: string) {
        const prevToken = tokensMap.get(key)
        if (prevToken) {
          elmTokensHolder.style.removeProperty(prevToken.name)
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

export default internalApi;