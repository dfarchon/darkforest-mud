// Voyage Time Plugin
//
// View estimated move time and energy for a voyage.

const secondsPerMinute = 60;
const secondsPerHour = 3600;

function debounce(fn, timeout) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, timeout);
  };
}

function formatEstimatedTime({ hours, minutes, seconds }) {
  switch (true) {
    case hours >= 1:
      return `${hours} hrs, ${minutes} mins, ${seconds} secs`;
    case minutes >= 1:
      return `${minutes} mins, ${seconds} secs`;
    default:
      return `${seconds} secs`;
  }
}

function formatEnergy(value) {
  switch (true) {
    case value > 1_000_000:
      return (value / 1000000).toFixed(1) + "M";
    case value > 1000:
      return (value / 1000).toFixed(1) + "K";
    default: {
      return value;
    }
  }
}

function computeVoyageTime({ planetFrom, planetTo }) {
  // Move time is in seconds with floating decimals, we normalize it and remove floating precision
  const time = parseInt(
    Math.ceil(df.getTimeForMove(planetFrom.locationId, planetTo.locationId)),
  );

  return {
    time,
    hours: Math.floor(time / secondsPerHour),
    minutes: Math.floor((time % secondsPerHour) / 60),
    seconds: (time % secondsPerHour) % secondsPerMinute,
  };
}

function computeVoyageEnergy({ planetFrom, planetTo, energyPercent }) {
  const energySent = (planetFrom.energyCap * energyPercent) / 100;
  let energyArriving = df.getEnergyArrivingForMove(
    planetFrom.locationId,
    planetTo.locationId,
    undefined,
    energySent,
  );

  if (planetTo.owner !== df.getAccount()) {
    energyArriving = (energyArriving * 100) / planetTo.defense;
  }

  return {
    sent: Math.ceil(energySent),
    arriving: Math.ceil(energyArriving),
  };
}

class VoyageTime {
  #energyPercent = 55;
  #element = document.createElement("voyage-time", {
    is: "div",
  });
  #debouncedUpdate = debounce(() => this.update(), 30);

  update() {
    const planetFrom = ui.getSelectedPlanet();
    const planetTo = ui.getHoveringOverPlanet();

    const shouldCompute =
      // both from and to planets must be set
      planetFrom &&
      planetTo &&
      // also planet from and to can't be the same
      planetFrom.locationId !== planetTo.locationId;

    const computedVoyageTime = shouldCompute
      ? computeVoyageTime({
          planetFrom,
          planetTo,
        })
      : undefined;
    const computedVoyageEnergy = shouldCompute
      ? computeVoyageEnergy({
          planetFrom,
          planetTo,
          energyPercent: this.#energyPercent,
        })
      : undefined;

    const timeElement = this.#element.querySelector("code[data-time]");
    timeElement.innerText = computedVoyageTime?.time
      ? `${computedVoyageTime.time} secs`
      : "n/a";

    const estimatedTimeElement = this.#element.querySelector(
      "code[data-estimated-time]",
    );
    estimatedTimeElement.innerText = computedVoyageTime
      ? formatEstimatedTime(computedVoyageTime)
      : "n/a";

    const energySentElement = this.#element.querySelector(
      "code[data-energy-sent]",
    );
    energySentElement.innerText = computedVoyageEnergy?.sent
      ? formatEnergy(computedVoyageEnergy?.sent)
      : "n/a";

    const energyArrivingElement = this.#element.querySelector(
      "code[data-energy-arriving]",
    );
    energyArrivingElement.innerText = computedVoyageEnergy?.arriving
      ? formatEnergy(computedVoyageEnergy?.arriving)
      : "n/a";
  }

  render(container) {
    const element = this.#element;

    element.insertAdjacentHTML(
      "afterbegin",
      `
      <style>
        voyage-time {
          display: block;
        }

        voyage-time h4 {
          font-size: 1.2em;
          text-decoration: underline;
        }

        voyage-time div[data-table] {
          display: grid;
          grid-template-columns: 100px auto;
          margin-bottom: 8px;
        }

        voyage-time div[data-table] p:nth-child(odd)  {
          color: rgb(131, 131, 131);
        }

        voyage-time div[data-table] p:nth-child(even)  {
          font-size: 10pt;
        }

        voyage-time div[data-slider] {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        voyage-time div[data-slider] p {
          height: 24px;
        }

        voyage-time div[data-slider] p:nth-child(odd)  {
          width: 200px;
        }

        voyage-time div[data-slider] p:nth-child(odd) input {
          width: 100%;
        }

        voyage-time div[data-slider] p:nth-child(even)  {
          font-size: 10pt;
          width: 80px;
        }
      </style>
    `,
    );

    element.insertAdjacentHTML(
      "afterbegin",
      `
      <h4>Time for move</h4>
      <div data-table>
        <p>Total:</p>
        <p><code data-time>n/a</code></p>

        <p>Estimated:</p>
        <p><code data-estimated-time>n/a</code></p>
      </div>

      <h4>Energy for move</h4>
      <div data-slider>
        <p><input type="range" min="0" max="100" step="5" value="${this.#energyPercent}" /></p>
        <p><code>${this.#energyPercent}%</code></p>
      </div>
      <div data-table>
        <p>Sending:</p>
        <p><code data-energy-sent>n/a</code></p>

        <p>Arriving:</p>
        <p><code data-energy-arriving>n/a</code></p>
      </div>
    `,
    );

    element
      .querySelector("[data-slider] input")
      .addEventListener("change", (event) => {
        const value = Number(event.target.value);

        element.querySelector("[data-slider] code").innerText = `${value}%`;
        this.#energyPercent = value;
      });

    // style parent container and insert our element
    container.parentElement.style.minHeight = "unset";
    container.style.width = "300px";
    container.style.minHeight = "unset";
    container.appendChild(element);

    window.addEventListener("mousemove", this.#debouncedUpdate);
  }

  destroy() {
    window.removeEventListener("mousemove", this.#debouncedUpdate);
    this.#element.parentElement?.removeChild(this.#element);
  }
}

export default VoyageTime;
