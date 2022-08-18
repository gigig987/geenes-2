// web component
class SingleColor extends HTMLElement {
  constructor() {
    super();
    this.color = "#000000";
    this.shadow = this.attachShadow({ mode: "closed" });
    const template = document
      .getElementById(`plugin-template-${instanceId}`)
      .content.cloneNode(true);

    this.shadow.append(template);
  }

  // component attributes
  static get observedAttributes() {
    return ["color"];
  }

  // attribute change
  attributeChangedCallback(property, oldValue, newValue) {
    if (oldValue === newValue) return;
    this[property] = newValue;
  }
  connectedCallback() {
    const { setToken } = geenes();

    const input = this.shadow.querySelector("input")
    const label = this.shadow.querySelector("label")

    input.setAttribute("value", this.color);
    input.addEventListener('input', (e) => {
      input.setAttribute("value", this.color);
      setToken('--ciccio', e.target.value);
    })

    // document.body.innerHTML = '<div>uee</div>'

  }
}

// register component
customElements.define("single-color", SingleColor);