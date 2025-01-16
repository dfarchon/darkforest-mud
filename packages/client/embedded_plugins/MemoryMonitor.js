class MemoryMonitor {
  #element = document.createElement("memory-monitor", {
    is: "div",
  });
  #destroyed = false;

  render(container) {
    const element = this.#element;
    element.insertAdjacentHTML("afterbegin", this.renderHTML());

    container.appendChild(element);
    this.runUpdate();
  }

  async runUpdate() {
    while (!this.#destroyed) {
      const memory = window.performance.memory;
      const usedMB = Math.round(memory.usedJSHeapSize / (1024 * 1024));
      const totalMB = Math.round(memory.totalJSHeapSize / (1024 * 1024));
      const limitMB = Math.round(memory.jsHeapSizeLimit / (1024 * 1024));

      const element = this.#element;
      element.querySelector("td[data-memory-used]").innerHTML = `${usedMB}MB`;
      element.querySelector("td[data-memory-total]").innerHTML = `${totalMB}MB`;
      element.querySelector("td[data-memory-limit]").innerHTML = `${limitMB}MB`;
      element.querySelector("td[data-memory-usage]").innerHTML =
        `${Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)}%`;

      // sleep for a second
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // wait for next paint
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
  }

  destroy() {
    this.#element.parentElement?.remove(this.#element);
    this.#destroyed = true;
  }

  renderHTML() {
    return `
      <table>
        <tbody>
          <tr>
            <th scope="row">Used:</th>
            <td data-memory-used></td>
          </tr>
          <tr>
            <th scope="row">Total:</th>
            <td data-memory-total></td>
          </tr>
          <tr>
            <th scope="row">Limit:</th>
            <td data-memory-limit></td>
          </tr>
          <tr>
            <th scope="row">Usage:</th>
            <td data-memory-usage></td>
          </tr>
        </tbody>
      </table>
    `;
  }
}

export default MemoryMonitor;
