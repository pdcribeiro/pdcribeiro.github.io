// note: currently not being used

import van from '/third-party/van.js';

class LifecycleManager extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    this.dispatchEvent(new Event('mount'));
  }
  disconnectedCallback() {
    this.dispatchEvent(new Event('unmount'));
  }
}

customElements.define('lifecycle-manager', LifecycleManager);

export default van.tags['lifecycle-manager'];
