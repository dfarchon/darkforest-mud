class MinimapSpawnPlugin {
  constructor() {
    this.minDensity = 1000;
    this.maxDensity = 10000;
    this.selectedCoords = { x: 0, y: 0 }; // Initial coordinates
    this.canvas = document.createElement("canvas");
    this.coordsDiv = document.createElement("div");
    this.coordsDiv.style.textAlign = "center";
    this.sizeFactor = 500;
    this.clickOccurred = false;
    this.step = 3000; //1500;
    this.dot = 5.5;
    this.canvasSize = 600;
    this.InnerNebulaColor = "#00ADE1"; // '#21215d';
    this.OuterNebulaColor = "#505050"; //'#24247d';
    this.DeepSpaceColor = "#505050"; //'#000000';
    this.CorruptedSpaceColor = "#505050"; //'#460046';
    this.xWorld = undefined;
    this.yWorld = undefined;
    this.formatCoords = "(???,???)";
    this.coordsDiv.style.fontSize = "20px";
  }

  async render(div) {
    // Default values

    div.style.width = "600px";
    div.style.height = "600px";

    const radius = ui.getWorldRadius();
    // const rim = Math.sqrt(df.getContractConstants().SPAWN_RIM_AREA);
    this.step = Math.floor((df.getWorldRadius() * 1.0) / 30);

    const image = new Image();
    image.src = "../../../../public/DFARESLogo-v3.svg";

    // Wait for the image to load
    await new Promise((resolve) => {
      image.onload = resolve;
    });

    const normalize = (val) => {
      return Math.floor(((val + radius) * this.sizeFactor) / (radius * 2));
    };

    const checkBounds = (a, b, x, y, r) => {
      let dist = (a - x) * (a - x) + (b - y) * (b - y);
      r *= r;
      return dist < r;
    };

    // Sample points in a grid and determine space type

    const generate = () => {
      div.style.width = "100%";
      div.style.height = "100%";
      this.canvas.width = this.canvasSize;
      this.canvas.height = this.canvasSize;
      this.sizeFactor = this.canvasSize - 18;
      let radiusNormalized = normalize(radius) / 2;

      let data = [];

      // Generate x coordinates
      for (let i = radius * -1; i < radius; i += this.step) {
        // Generate y coordinates
        for (let j = radius * -1; j < radius; j += this.step) {
          // Filter points within map circle

          if (checkBounds(0, 0, i, j, radius)) {
            const distFromOrigin = Math.floor(Math.sqrt(i ** 2 + j ** 2));
            // Store coordinate and space type
            data.push({
              x: i,
              y: j,
              type: df.spaceTypeFromPerlin(
                df.spaceTypePerlin({ x: i, y: j }),
                distFromOrigin,
              ),
            });
          }
        }
      }

      // Draw mini-map

      const ctx = this.canvas.getContext("2d");

      ctx.fillStyle = "#151515";
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Create a circular clipping path
      ctx.arc(
        radiusNormalized + 2,
        radiusNormalized + 3,
        radiusNormalized,
        0,
        Math.PI * 2,
        true,
      );
      ctx.clip();

      for (let i = 0; i < data.length; i++) {
        if (data[i].type === 0) {
          ctx.fillStyle = this.InnerNebulaColor; // Inner nebula
        } else if (data[i].type === 1) {
          ctx.fillStyle = this.OuterNebulaColor; // Outer nebula
        } else if (data[i].type === 2) {
          ctx.fillStyle = this.DeepSpaceColor; // Deep space
        } else if (data[i].type === 3) {
          ctx.fillStyle = this.CorruptedSpaceColor; // Corrupted slightly brighter for better visibility
        }
        ctx.fillRect(
          normalize(data[i].x) - 1,
          normalize(data[i].y * -1) + 1,
          this.dot,
          this.dot,
        );
      }

      // Recenter viewport based on click location

      this.canvas.style = "cursor: pointer;";

      // draw outside of map

      ctx.beginPath();
      ctx.arc(
        radiusNormalized + 2,
        radiusNormalized + 3,
        radiusNormalized,
        0,
        2 * Math.PI,
      );
      ctx.strokeStyle = "rgb(255,180,193,1)";
      ctx.fillStyle = "rgb(255,180,193,0.5)";
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.closePath();

      //draw pink circles
      const pinkZones = Array.from(df.getPinkZones());
      for (let i = 0; i < pinkZones.length; i++) {
        // console.log(pinkZones[i]);
        let coords = pinkZones[i].coords;
        let pinkZoneRadius = pinkZones[i].radius;
        let normalizeX = normalize(coords.x);
        let normalizeY = normalize(coords.y * -1);
        // let normalizePinkCircleRadius = radius / radiusNormalized
        let normalizePinkCircleRadius =
          (pinkZoneRadius * radiusNormalized) / radius;

        ctx.beginPath();
        ctx.arc(
          normalizeX,
          normalizeY,
          normalizePinkCircleRadius,
          0,
          2 * Math.PI,
        );
        // pink color
        ctx.strokeStyle = "rgb(255,180,193,1)";
        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();
      }
      // draw blue circles
      const blueZones = Array.from(df.getBlueZones());
      for (let i = 0; i < blueZones.length; i++) {
        let coords = blueZones[i].coords;
        let blueZoneRadius = blueZones[i].radius;
        let normalizeX = normalize(coords.x);
        let normalizeY = normalize(coords.y * -1);
        let normalizeBlueCircleRadius =
          (blueZoneRadius * radiusNormalized) / radius;
        ctx.beginPath();
        ctx.arc(
          normalizeX,
          normalizeY,
          normalizeBlueCircleRadius,
          0,
          2 * Math.PI,
        );
        // blue circle
        ctx.strokeStyle = "rgb(0, 173, 225, 1)";
        ctx.fillStyle = "rgb(0, 173, 225, 0.6)";

        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();
      }

      // NOTE:
      // draw inner circle of map
      // let rimNormalized = (normalize(rim) / 2) * 0.91; // idk why here need
      // to be corection??
      const MAX_LEVEL_DIST = df.getContractConstants().MAX_LEVEL_DIST;
      const normalizeRadius = (MAX_LEVEL_DIST[3] * radiusNormalized) / radius;

      ctx.beginPath();
      ctx.arc(
        radiusNormalized + 2, // centerX
        radiusNormalized + 3, // centerY
        normalizeRadius, // rimNormalized, // radius
        0,
        2 * Math.PI,
      );
      ctx.fillStyle = "rgb(255,180,193,1)"; //#ffb4c1'; // Fill color
      ctx.fill();

      // draw img to centre
      const drawImageAtCenter = (ctx, image, worldRadius) => {
        // Calculate the position and size for the image
        const centerX = ctx.canvas.width / 2;
        const centerY = ctx.canvas.height / 2;
        const trueWidth = worldRadius * 0.5; // Adjust as needed
        const trueHeight = worldRadius * 0.5; // Adjust as needed

        // Draw the image at the center
        ctx.drawImage(
          image,
          centerX - trueWidth / 2 - 10,
          centerY - trueHeight / 2 - 10,
          trueWidth,
          trueHeight,
        );
      };

      // Draw the image at the center with the specified rim radius
      drawImageAtCenter(ctx, image, radiusNormalized);
    };

    const toWorldCoord = (val) => {
      return Math.floor((val * radius * 2) / this.sizeFactor - radius);
    };

    const onMouseMove = (event) => {
      const x = event.offsetX;
      const y = event.offsetY;
      const xWorld = toWorldCoord(x);
      const yWorld = toWorldCoord(y) * -1;
      // console.log(`onMouseMove [${xWorld}, ${yWorld}]`);
      if (this.clickOccurred === false) {
        this.xWorld = xWorld;
        this.yWorld = yWorld;
        let formatX =
          this.xWorld === undefined ? "???" : this.xWorld.toString();
        let formatY =
          this.yWorld === undefined ? "???" : this.yWorld.toString();
        let formatCoords = "(" + formatX + "," + formatY + ")";
        this.formatCoords = formatCoords;
      }

      const radius = ui.getWorldRadius();
      // const rim = Math.sqrt(df.getContractConstants().SPAWN_RIM_AREA);
      const MAX_LEVEL_DIST = df.getContractConstants().MAX_LEVEL_DIST;
      const rim = MAX_LEVEL_DIST[3];

      const checkIfCoordsInPinkZones = (x, y) => {
        const pinkZones = Array.from(df.getPinkZones());
        for (const pinkZone of pinkZones) {
          const coords = pinkZone.coords;
          const radius = pinkZone.radius;

          const dis = df.getDistCoords({ x: x, y: y }, coords);

          if (dis <= radius) return true;
        }
        return false;
      };

      if (checkBounds(0, 0, xWorld, yWorld, rim)) {
        // Inside the rim, change cursor to 'move'
        this.canvas.style.cursor = "no-drop";
        this.moveInsideRim = false; // Set a flag
        this.coordsDiv.innerText = "Can't Spawn Here 😅";
        this.coordsDiv.style.color = "pink";
      } else if (checkBounds(0, 0, xWorld, yWorld, radius)) {
        // Inside the world radius but outside the rim, change cursor to
        // 'pointer'
        const distFromOrigin = Math.floor(Math.sqrt(xWorld ** 2 + yWorld ** 2));
        const spaceType = df.spaceTypeFromPerlin(
          df.spaceTypePerlin({ x: xWorld, y: yWorld }),
          distFromOrigin,
        );

        // Check if the space type is inner nebula (type 0)
        if (spaceType === 0) {
          if (checkIfCoordsInPinkZones(xWorld, yWorld)) {
            this.canvas.style.cursor = "pointer";
            this.moveInsideRim = false;
            this.coordsDiv.innerText =
              this.formatCoords + " is dangerous to spawn 😣";
            this.coordsDiv.style.color = "pink";
          } else {
            this.canvas.style.cursor = "pointer";
            this.moveInsideRim = false;
            this.coordsDiv.innerText = this.formatCoords;
            this.coordsDiv.style.color = this.InnerNebulaColor;
          }
        } else {
          this.canvas.style.cursor = "no-drop";
          this.moveInsideRim = true; // Reset the flag
          this.coordsDiv.innerText = "Can't Spawn Here 😅";
          this.coordsDiv.style.color = "pink";
        }
      } else {
        // Outside both world radius and rim, change cursor to 'default'
        this.canvas.style.cursor = "default";
        this.moveInsideRim = false; // Reset the flag
        this.coordsDiv.innerText = "";
        this.coordsDiv.style.color = "";
      }
    };

    this.canvas.addEventListener("mousemove", onMouseMove);

    generate();

    div.appendChild(this.canvas);
    div.appendChild(this.coordsDiv);
  }

  destroy() {
    const ctx = this.canvas.getContext("2d");
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  async runAndGetUserCoords() {
    // Create an object to store selected coordinates
    let selectedCoords = { x: 0, y: 0 };

    const radius = ui.getWorldRadius();

    const checkBounds = (a, b, x, y, r) => {
      let dist = (a - x) * (a - x) + (b - y) * (b - y);
      r *= r;
      return dist < r;
    };

    const toWorldCoord = (val) => {
      return Math.floor((val * radius * 2) / this.sizeFactor - radius);
    };

    // reset click
    this.clickOccurred = false;
    const onCanvasClick = (/** @type {MouseEvent} */ event) => {
      let x = event.offsetX;
      let y = event.offsetY;
      let xWorld = toWorldCoord(x);
      let yWorld = toWorldCoord(y) * -1;
      const radius = ui.getWorldRadius();
      const rim = Math.sqrt(df.getContractConstants().SPAWN_RIM_AREA);

      if (checkBounds(0, 0, xWorld, yWorld, rim)) {
        console.log(`WRONG SELECTION TO CLOSE!!`);
      }
      // Check if the cursor is in the 'pointer' area
      else if (checkBounds(0, 0, xWorld, yWorld, radius)) {
        // Inside the world radius but outside the rim, change cursor to
        // 'pointer'

        const distFromOrigin = Math.floor(Math.sqrt(xWorld ** 2 + yWorld ** 2));
        const spaceType = df.spaceTypeFromPerlin(
          df.spaceTypePerlin({ x: xWorld, y: yWorld }),
          distFromOrigin,
        );

        // Check if the space type is inner nebula (type 0)
        if (spaceType === 0) {
          selectedCoords = { x: xWorld, y: yWorld };
          console.log(`[${xWorld}, ${yWorld}]`);
          this.clickOccurred = true;
        } else {
          console.log(`WRONG SELECTION TO NOT A SPACE TYPE INNER NEBULA!!`);
        }
      } else {
        console.log(`WRONG SELECTION TO MUCH OUT!!`);
      }
    };

    // Add a click event listener to the canvas
    this.canvas.addEventListener("click", onCanvasClick);

    // Wait for the click event to occur, and it should have happened not is
    while (!this.clickOccurred || this.moveInsideRim) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.canvas.style.cursor = "default";
    this.canvas.removeEventListener("click", onCanvasClick);

    // Return the selected coordinates
    return selectedCoords;
  }
}

export default MinimapSpawnPlugin;
