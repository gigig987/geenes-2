// web component
class DrawElements extends HTMLElement {
  constructor() {
    super();

    this.shadow = this.attachShadow({ mode: 'closed' });
    const template = document
      .getElementById(`plugin-template-${instanceId}`)
      .content.cloneNode(true);

    this.shadow.append(template);
  }

  // component attributes
  static get observedAttributes() {
    return [];
  }

  // attribute change
  attributeChangedCallback(property, oldValue, newValue) {
    if (oldValue === newValue) return;
    this[property] = newValue;
    this.render()

  }

  render() {

  }

  connectedCallback() {

  }
}

// register component
customElements.define("draw-elements", DrawElements);