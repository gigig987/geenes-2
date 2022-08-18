export const uuidv4 = () => {
  // TODO check for browser support for cypto and randomUUID
  return self.crypto.randomUUID();
}
export const now = window.performance && performance.now ? function () {
	return performance.now();
} : function () {
	return +new Date();
};

export const clamp = (number : number, min : number, max : number) : number => Math.max(min, Math.min(number, max));

export const _requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || setTimeout;

export const roundNumberTo = (number: number, to: number) : number => Math.ceil(number/Math.round(to)) * Math.round(to);

// Kudos to https://gist.github.com/dfkaye/349ddd8f251091e0e0ee76e0da47dd80
export const flipString = (aString : string) : string => {	
    return String(aString)
      .split('')
      .map(c => flipTable[c] || c)
      .reverse()
      .join('')
  }
  
  const flipTable : any = {
  '\u0021' : '\u00A1',
  '\u0022' : '\u201E',
  '\u0026' : '\u214B',
  '\u0027' : '\u002C',
  '\u0028' : '\u0029',
  '\u002E' : '\u02D9',
  '\u0031' : '\u0196',
  '\u0032' : '\u1614',
  '\u0033' : '\u0190',
  '\u0034' : '\u152D',
  '\u0036' : '\u0039',
  '\u0037' : '\u2C62',
  '\u003B' : '\u061B',
  '\u003C' : '\u003E',
  '\u003F' : '\u00BF',
  '\u0041' : '\u2200',
  '\u0042' : '\u10412',
  '\u0043' : '\u2183',
  '\u0044' : '\u25D6',
  '\u0045' : '\u018E',
  '\u0046' : '\u2132',
  '\u0047' : '\u2141',
  '\u004A' : '\u017F',
  '\u004B' : '\u22CA',
  '\u004C' : '\u2142',
  '\u004D' : '\u0057',
  '\u004E' : '\u1D0E',
  '\u0050' : '\u0500',
  '\u0051' : '\u038C',
  '\u0052' : '\u1D1A',
  '\u0054' : '\u22A5',
  '\u0055' : '\u2229',
  '\u0056' : '\u1D27',
  '\u0059' : '\u2144',
  '\u005B' : '\u005D',
  '\u005F' : '\u203E',
  '\u0061' : '\u0250',
  '\u0062' : '\u0071',
  '\u0063' : '\u0254',
  '\u0064' : '\u0070',
  '\u0065' : '\u01DD',
  '\u0066' : '\u025F',
  '\u0067' : '\u0183',
  '\u0068' : '\u0265',
  '\u0069' : '\u0131',
  '\u006A' : '\u027E',
  '\u006B' : '\u029E',
  '\u006C' : '\u0283',
  '\u006D' : '\u026F',
  '\u006E' : '\u0075',
  '\u0072' : '\u0279',
  '\u0074' : '\u0287',
  '\u0076' : '\u028C',
  '\u0077' : '\u028D',
  '\u0079' : '\u028E',
  '\u007B' : '\u007D',
  '\u203F' : '\u2040',
  '\u2045' : '\u2046',
  '\u2234' : '\u2235'
  };

const namendColors = {
  "aliceblue": "#f0f8ff",
  "antiquewhite": "#faebd7",
  "aqua": "#00ffff",
  "aquamarine": "#7fffd4",
  "azure": "#f0ffff",
  "beige": "#f5f5dc",
  "bisque": "#ffe4c4",
  "black": "#000000",
  "blanchedalmond": "#ffebcd",
  "blue": "#0000ff",
  "blueviolet": "#8a2be2",
  "brown": "#a52a2a",
  "burlywood": "#deb887",
  "cadetblue": "#5f9ea0",
  "chartreuse": "#7fff00",
  "chocolate": "#d2691e",
  "coral": "#ff7f50",
  "cornflowerblue": "#6495ed",
  "cornsilk": "#fff8dc",
  "crimson": "#dc143c",
  "cyan": "#00ffff",
  "darkblue": "#00008b",
  "darkcyan": "#008b8b",
  "darkgoldenrod": "#b8860b",
  "darkgray": "#a9a9a9",
  "darkgreen": "#006400",
  "darkgrey": "#a9a9a9",
  "darkkhaki": "#bdb76b",
  "darkmagenta": "#8b008b",
  "darkolivegreen": "#556b2f",
  "darkorange": "#ff8c00",
  "darkorchid": "#9932cc",
  "darkred": "#8b0000",
  "darksalmon": "#e9967a",
  "darkseagreen": "#8fbc8f",
  "darkslateblue": "#483d8b",
  "darkslategray": "#2f4f4f",
  "darkslategrey": "#2f4f4f",
  "darkturquoise": "#00ced1",
  "darkviolet": "#9400d3",
  "deeppink": "#ff1493",
  "deepskyblue": "#00bfff",
  "dimgray": "#696969",
  "dimgrey": "#696969",
  "dodgerblue": "#1e90ff",
  "firebrick": "#b22222",
  "floralwhite": "#fffaf0",
  "forestgreen": "#228b22",
  "fuchsia": "#ff00ff",
  "gainsboro": "#dcdcdc",
  "ghostwhite": "#f8f8ff",
  "goldenrod": "#daa520",
  "gold": "#ffd700",
  "gray": "#808080",
  "green": "#008000",
  "greenyellow": "#adff2f",
  "grey": "#808080",
  "honeydew": "#f0fff0",
  "hotpink": "#ff69b4",
  "indianred": "#cd5c5c",
  "indigo": "#4b0082",
  "ivory": "#fffff0",
  "khaki": "#f0e68c",
  "lavenderblush": "#fff0f5",
  "lavender": "#e6e6fa",
  "lawngreen": "#7cfc00",
  "lemonchiffon": "#fffacd",
  "lightblue": "#add8e6",
  "lightcoral": "#f08080",
  "lightcyan": "#e0ffff",
  "lightgoldenrodyellow": "#fafad2",
  "lightgray": "#d3d3d3",
  "lightgreen": "#90ee90",
  "lightgrey": "#d3d3d3",
  "lightpink": "#ffb6c1",
  "lightsalmon": "#ffa07a",
  "lightseagreen": "#20b2aa",
  "lightskyblue": "#87cefa",
  "lightslategray": "#778899",
  "lightslategrey": "#778899",
  "lightsteelblue": "#b0c4de",
  "lightyellow": "#ffffe0",
  "lime": "#00ff00",
  "limegreen": "#32cd32",
  "linen": "#faf0e6",
  "magenta": "#ff00ff",
  "maroon": "#800000",
  "mediumaquamarine": "#66cdaa",
  "mediumblue": "#0000cd",
  "mediumorchid": "#ba55d3",
  "mediumpurple": "#9370db",
  "mediumseagreen": "#3cb371",
  "mediumslateblue": "#7b68ee",
  "mediumspringgreen": "#00fa9a",
  "mediumturquoise": "#48d1cc",
  "mediumvioletred": "#c71585",
  "midnightblue": "#191970",
  "mintcream": "#f5fffa",
  "mistyrose": "#ffe4e1",
  "moccasin": "#ffe4b5",
  "navajowhite": "#ffdead",
  "navy": "#000080",
  "oldlace": "#fdf5e6",
  "olive": "#808000",
  "olivedrab": "#6b8e23",
  "orange": "#ffa500",
  "orangered": "#ff4500",
  "orchid": "#da70d6",
  "palegoldenrod": "#eee8aa",
  "palegreen": "#98fb98",
  "paleturquoise": "#afeeee",
  "palevioletred": "#db7093",
  "papayawhip": "#ffefd5",
  "peachpuff": "#ffdab9",
  "peru": "#cd853f",
  "pink": "#ffc0cb",
  "plum": "#dda0dd",
  "powderblue": "#b0e0e6",
  "purple": "#800080",
  "rebeccapurple": "#663399",
  "red": "#ff0000",
  "rosybrown": "#bc8f8f",
  "royalblue": "#4169e1",
  "saddlebrown": "#8b4513",
  "salmon": "#fa8072",
  "sandybrown": "#f4a460",
  "seagreen": "#2e8b57",
  "seashell": "#fff5ee",
  "sienna": "#a0522d",
  "silver": "#c0c0c0",
  "skyblue": "#87ceeb",
  "slateblue": "#6a5acd",
  "slategray": "#708090",
  "slategrey": "#708090",
  "snow": "#fffafa",
  "springgreen": "#00ff7f",
  "steelblue": "#4682b4",
  "tan": "#d2b48c",
  "teal": "#008080",
  "thistle": "#d8bfd8",
  "tomato": "#ff6347",
  "turquoise": "#40e0d0",
  "violet": "#ee82ee",
  "wheat": "#f5deb3",
  "white": "#ffffff",
  "whitesmoke": "#f5f5f5",
  "yellow": "#ffff00",
  "yellowgreen": "#9acd32"
}

function mulberry32(a: number) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

function xmur3(str: string) {
  for(var i = 0, h = 1779033703 ^ str.length; i < str.length; i++)
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353),
      h = h << 13 | h >>> 19;
  return function() {
      h = Math.imul(h ^ h >>> 16, 2246822507);
      h = Math.imul(h ^ h >>> 13, 3266489909);
      return (h ^= h >>> 16) >>> 0;
  }
}

export const randomNamedColor = (seed: number | string): string => {
  const rng = mulberry32(typeof seed === 'string' ? xmur3(seed)(): seed);
  
  const rnd = (lo: number, hi: number, defaultHi=1) => {
    if (hi === undefined) {
      hi = lo === undefined ? defaultHi : lo;
      lo = 0;
    }
    
    return rng() * (hi - lo) + lo;
  };
  const colorArray = Object.keys(namendColors);
  const rndInt = (lo = 0, hi = colorArray.length) => Math.floor(rnd(lo, hi, 2));
  return colorArray[rndInt()];
}

export const findColorName = (hex: string) => {
  // TODO, implement the real thing
  return 'white'
}

export const hexToRgb = (hex: string): colorTuple | null => {
  // If 3 digit hexcode then double each digit 6 digit
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function(_m, r, g, b) {
    return r + r + g + g + b + b;
  });
  // Use built-in base16 parser to convert to rgb
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  // Cant use map since first element of result is the whole matched string
  // Do not need to add 0 since parseInt converts -0 to 0
  return result ?
    [parseInt(result[1], 16), parseInt(result[2], 16),
      parseInt(result[3], 16)] :
    null;
}

export const rgbToHsl = (rgb: colorTuple): colorTuple => {
  // Normalize rgb tuple to [0,1]
  const r1 = rgb[0] / 255;
  const g1 = rgb[1] / 255;
  const b1 = rgb[2] / 255;
  // Lightness is average of max and min normalized rgb values
  const maxColor = Math.max(r1, g1, b1);
  const minColor = Math.min(r1, g1, b1);
  let L = (maxColor + minColor) / 2;
  // Hue and saturation are only non zero if color is grey
  // A color is grey if all r,g,b are all the same (maxColor===minColor)
  let S = 0;
  let H = 0;
  if (maxColor !== minColor) {
    if (L < 0.5) {
      S = (maxColor - minColor) / (maxColor + minColor);
    } else {
      S = (maxColor - minColor) / (2.0 - maxColor - minColor);
    }
    if (r1 === maxColor) {
      H = (g1 - b1) / (maxColor - minColor);
    } else if (g1 === maxColor) {
      H = 2.0 + (b1 - r1) / (maxColor - minColor);
    } else {
      H = 4.0 + (r1 - g1) / (maxColor - minColor);
    }
  }
  // Scale up to [0,100] for Lightnexx and saturation, [0,360) for Hue
  L = L * 100;
  S = S * 100;
  H = H * 60;
  // Hue has a period of 360deg, if hue is negative, get positive hue
  // by scaling h to (-360,0) and adding 360
  H = (H < 0) ? H % 360 + 360 : H;
  // Add zero to prevent signed zeros (force 0 rather than -0)
  return [H + 0, S + 0, L + 0];
}