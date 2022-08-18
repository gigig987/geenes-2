  // getting reference to the function to be distorted
const { get: ShadowRootHostGetter } = Object.getOwnPropertyDescriptor(
  ShadowRoot.prototype,
  "host"
);

const { get: innerHTMLGetter } = Object.getOwnPropertyDescriptor(
 Element.prototype,
 'innerHTML'
);
const { set: innerHTMLSetter } = Object.getOwnPropertyDescriptor(
 Element.prototype,
 'innerHTML'
);
const { assignedNodes, assignedElements } = HTMLSlotElement.prototype;

const distortionMap = new Map();
distortionMap.set(ShadowRootHostGetter, () => {
  throw new Error(`Forbidden`);
});
distortionMap.set(innerHTMLGetter, () => {
  throw new Error(`Forbidden`);
});
distortionMap.set(innerHTMLSetter, () => {
  throw new Error(`Forbidden`);
});
distortionMap.set(assignedNodes, () => {
  throw new Error(`Forbidden`);
});
distortionMap.set(assignedElements, () => {
  throw new Error(`Forbidden`);
});
export default distortionMap
