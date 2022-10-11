// web component
class SingleColor extends HTMLElement {
  constructor() {
    super();
    this.color = '#000000';
    this.name = 'cc';
    this.shadow = this.attachShadow({ mode: 'closed' });
    const template = document
      .getElementById(`plugin-template-${instanceId}`)
      .content.cloneNode(true);

    this.shadow.append(template);
  }

  // component attributes
  static get observedAttributes() {
    return ['color', 'name'];
  }

  // attribute change
  attributeChangedCallback(property, oldValue, newValue) {
    if (oldValue === newValue) return;
    this[property] = newValue;
    this.render()

  }

  render() {
    const color = this.shadow.querySelector('input[name="base"]')
    const name = this.shadow.querySelector('input[name="color-name"]')
    color.setAttribute("value", this.color);
    name.setAttribute("value", this.name);
  }

  connectedCallback() {
    const { setColorToken } = geenes();

    const color = this.shadow.querySelector('input[name="base"]')
    const name = this.shadow.querySelector('input[name="color-name"]')

    name.addEventListener('change', (e) => {
      this.name = e.target.value
      this.render()
      setColorToken(`--${this.name}`, this.color);
    })
    color.addEventListener('input', (e) => {
      this.color = e.target.value
      this.render()
      setColorToken(`--${this.name}`, this.color);
    })

  }
}

// register component
customElements.define("single-color", SingleColor);