import { findColorName, hexToRgb, rgbToHsl } from '@/utilities/utilities'

interface Token {
  name: string
  value: string
}
interface Color extends Token {
  opacity: number
  hex: string,
  rgb: {
    original: {
      _array: colorTuple,
      r: number,
      g: number,
      b: number,
    },
    norm: {
      _array: colorTuple,
      r: number,
      g: number,
      b: number,
    },
    css: string
  }
  hsl: {
    original: {
      _array: colorTuple,
      h: number,
      s: number,
      l: number,
    },
    norm: {
      _array: colorTuple,
      h: number,
      s: number,
      l: number,
    },
    css: string
  }
}

const makeColor = (value: string, name?: string): Color => {
  // TODO check all valid values for color
  // e.g. #FFF or #FFFFFF or white or rgb(255,255,255)
  // get hex color value
  
  // if name is set use it, if not automatically lookup for it
  
  name = name || findColorName(value)
  // initiate new color object
  const color: Color = {
    name,
    hex: value,
    opacity: 1,
    rgb: {
      original: {
        _array: [0,0,0],
        r: 0,
        g: 0,
        b: 0
      },
      norm: {
        _array: [0,0,0],
        r: 0,
        g: 0,
        b: 0
      },
      css: ''
    },
    hsl: {
      original: {
        _array: [0,0,0],
        h: 0,
        s: 0,
        l: 0
      },
      norm: {
        _array: [0,0,0],
        h: 0,
        s: 0,
        l: 0
      },
      css: ''
    },
    value: ''
  }
  
  // rgb object
  // transform hex into rgb values
  const rgb = hexToRgb(value)
  // populate original rgb part
  color.rgb.original._array =  rgb? rgb : [0,0,0] 
  color.rgb.original.r = rgb![0]
  color.rgb.original.g = rgb![1]
  color.rgb.original.b = rgb![2]
  color.rgb.css = `rgba(${color.rgb.original.r}, ${color.rgb.original.g}, ${color.rgb.original.b}, ${color.opacity})`
  // normalise rgb values 0 to 100
  color.rgb.norm._array =  color.rgb.original._array.map(_ => _ / 255) as colorTuple
  // populate norm part of rgb object
  color.rgb.norm.r = color.rgb.norm._array[0]
  color.rgb.norm.g = color.rgb.norm._array[1]
  color.rgb.norm.b = color.rgb.norm._array[2]
  
  // hsl object
  // transform hex into hsl values
  const hsl = rgbToHsl(rgb!)
  // populate original hsl part
  color.hsl.original._array =  hsl? hsl : [0,0,0]
  color.hsl.original.h = hsl![0]
  color.hsl.original.s = hsl![1]
  color.hsl.original.l = hsl![2]
  color.hsl.css = `hsla(${color.hsl.original.h}deg, ${color.hsl.original.s}%, ${color.hsl.original.l}%, ${color.opacity})`

  // normalise hsl values 0 to 100
  color.hsl.norm._array =  [color.hsl.original.h / 360, color.hsl.original.s / 100, color.hsl.original.l / 100]
  // populate norm part of hsl object
  color.hsl.norm.h = color.hsl.norm._array[0]
  color.hsl.norm.s = color.hsl.norm._array[1]
  color.hsl.norm.l = color.hsl.norm._array[2]

  // update value with favorite css value
  color.value = color.hsl.css
  return color
}
// The element which holds all the tokens
// if it doesn't exist fall back on body
const elmTokensHolder = 
document.getElementById('blueprint')
|| 
document.body

const setToken = (id: string, token : Token): void => {
  console.log('core set Token', token, id)
  tokens.set(id, token)
}
const removeToken = (id: string): void => {
  tokens.delete(id)
}

const setColorToken = (id: string, {name, value} : Token): void => {
  const color = makeColor(value, name)
  setToken(id, color)
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
internalApi.set('setColorToken', setColorToken)

export default internalApi;