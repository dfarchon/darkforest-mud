/* eslint-disable */
import { SpaceType } from "@df/types";
import React, { useEffect, useImperativeHandle, useRef } from "react";
import styled from "styled-components";

type Point = Readonly<{
  x: number;
  y: number;
}>;

type Square = Readonly<{
  origin: Point;
  size: number;
}>;

export type SpawnArea = Readonly<{
  key: string;
  // local point where top left of the map container is (0, 0), and the point is located at the center of drawn square
  point: Point;
  // normalized point where the center of the square container is (0, 0), and point is located at (+-x, +-y).
  normdPoint: Point;
  // scaled up normalized point onto the DF world map
  worldPoint: Point;
  // the square drawn for the spawn point
  square: Square;
  // the space type for this maybe spawn point
  spaceType: SpaceType;
  // allows us to mark the spawn area as invalid, which we will do if spawn takes more than 2min for the given area
  state: "valid" | "in-pink-zone" | "in-blue-zone" | "invalid";
}>;

type WritableSpawnAreaState = {
  state: SpawnArea["state"];
};

type Zone = {
  worldPoint: Point;
  worldRadius: number;
  point: Point;
  radius: number;
};

export interface MiniMapHandle {
  getSelectedSpawnArea(): SpawnArea | undefined;
  setSelectable(value: boolean): void;
}

const canvasSize = 600;
const canvasRadius = 300;
const canvasBorderSize = 2;

const dotSize = 5.5;
const stepSize = 10;

const Colors = {
  SquareBackground: "#505050" as const,
  InnerNebulaColor: "#00ADE1" as const, // '#21215d';
  OuterNebulaColor: "#505050" as const, // '#24247d';
  DeepSpaceColor: "#505050" as const, // '#000000';
  CorruptedSpaceColor: "#505050" as const, // '#460046';
  SelectedSpawnArea: "#00FF00" as const,
  Pink: "rgb(255, 180, 193, 1.0)" as const,
};

const StyledMiniMap = styled.div`
  posistion: relative;
`;

const StyledCoords = styled.div`
  font-size: 20px;
  text-align: center;
  padding: 1em;
`;

function point_on_circle(point: Point, radius: number): boolean {
  return Math.sqrt(point.x ** 2 + point.y ** 2) < radius;
}

function point_on_circle2(from: Point, to: Point, radius: number): boolean {
  return Math.sqrt((from.x - to.x) ** 2 + (from.y - to.y) ** 2) < radius;
}

function makeMousePoints(areas: SpawnArea[]): Record<string, SpawnArea> {
  const gapWooble = 3;
  const table: Record<string, SpawnArea> = {};
  for (const area of areas) {
    if (area.spaceType !== SpaceType.NEBULA) {
      continue;
    }
    if (area.state !== "valid") {
      continue;
    }

    const { origin, size } = area.square;
    const startPoint: Point = {
      x: Math.floor(origin.x) - gapWooble,
      y: Math.floor(origin.y) - gapWooble,
    };
    const stopPoint: Point = {
      x: Math.ceil(origin.x + size) + gapWooble,
      y: Math.ceil(origin.y + size) + gapWooble,
    };

    for (let x = startPoint.x; x < stopPoint.x; x++) {
      for (let y = startPoint.y; y < stopPoint.y; y++) {
        const key = `(${x},${y})`;
        table[key] = area;
      }
    }
  }

  return table;
}

function makeSquares(): Square[] {
  const squares = [];
  for (
    let x = -(stepSize / Math.PI);
    x < canvasSize + stepSize;
    x += stepSize
  ) {
    for (
      let y = -(stepSize / Math.PI);
      y < canvasSize + stepSize;
      y += stepSize
    ) {
      const square: Square = {
        origin: { x, y },
        size: dotSize,
      };
      squares.push(square);
    }
  }

  return squares;
}

function getSpawnAreas({
  squares,
  radius,
  rimRadius,
  scaleFactor,
}: {
  squares: Square[];
  radius: number;
  rimRadius: number;
  scaleFactor: number;
}): SpawnArea[] {
  const areas: SpawnArea[] = [];
  for (const square of squares) {
    // create point at the center of the square
    const point: Point = {
      x: square.origin.x - square.size / 2,
      y: square.origin.y - square.size / 2,
    };

    // normalize point onto a plane with with 0,0 as center and point can have coords (+-x, +-y)
    const normdPoint: Point = {
      x: point.x - radius,
      y: radius - point.y,
    };

    // skip points outside circle
    if (!point_on_circle(normdPoint, radius)) {
      continue;
    }

    // skip points inside rim
    if (point_on_circle(normdPoint, rimRadius)) {
      continue;
    }

    // map normalized point onto DF world map by scaling it up
    const worldPoint: Point = {
      x: normdPoint.x * scaleFactor,
      y: normdPoint.y * scaleFactor,
    };

    const distFromOrigin = Math.floor(
      Math.sqrt(worldPoint.x ** 2 + worldPoint.y ** 2),
    );
    const spaceType = df.spaceTypeFromPerlin(
      df.spaceTypePerlin(worldPoint, false),
      distFromOrigin,
    );

    areas.push({
      key: `(${point.x},${point.y})`,
      point,
      normdPoint,
      worldPoint,
      square,
      spaceType,
      state: "valid",
    });
  }

  return areas;
}

function mapZone(
  zone: { coords: Point; radius: number },
  options: { scaleFactor: number; radius: number },
): Zone {
  return {
    worldPoint: zone.coords,
    worldRadius: zone.radius,
    point: {
      x: zone.coords.x / options.scaleFactor + options.radius,
      y: (zone.coords.y / options.scaleFactor) * -1 + options.radius,
    },
    radius: zone.radius / options.scaleFactor,
  };
}

function getBlueZones(options: {
  scaleFactor: number;
  radius: number;
}): Zone[] {
  return [];
  // return Array.from(df.getBlueZones()).map((zone) => mapZone(zone, options));
}

function getPinkZones(options: {
  scaleFactor: number;
  radius: number;
}): Zone[] {
  return [];
  // return Array.from(df.getPinkZones()).map((zone) => mapZone(zone, options));
}

function updateSpawnAreas({
  spawnAreas,
  blueZones,
  pinkZones,
}: {
  spawnAreas: SpawnArea[];
  blueZones: Zone[];
  pinkZones: Zone[];
}) {
  for (const area of spawnAreas) {
    // skip areas that are no longer valid
    if (area.state !== "valid") {
      continue;
    }

    const inBlueZone = Boolean(
      blueZones.find((zone) =>
        point_on_circle2(area.worldPoint, zone.worldPoint, zone.worldRadius),
      ),
    );
    if (inBlueZone) {
      (area as WritableSpawnAreaState).state = "in-blue-zone";
      continue;
    }

    const inPinkZone = Boolean(
      pinkZones.find((zone) =>
        point_on_circle2(area.worldPoint, zone.worldPoint, zone.worldRadius),
      ),
    );
    if (inPinkZone) {
      (area as WritableSpawnAreaState).state = "in-pink-zone";
      continue;
    }
  }
}

function draw(
  ctx: CanvasRenderingContext2D,
  {
    squares,
    spawnAreas,
    rimRadius,
    selectedSpawnArea,
    blueZones,
    pinkZones,
  }: {
    squares: Square[];
    spawnAreas: SpawnArea[];
    rimRadius: number;
    selectedSpawnArea?: SpawnArea;
    blueZones: Zone[];
    pinkZones: Zone[];
  },
) {
  // clear background
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Draw mini-map background square
  ctx.fillStyle = "#151515";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // draw square pattern background by walking the square containing our circle
  for (const square of squares) {
    ctx.fillStyle = "#505050";
    ctx.fillRect(square.origin.x, square.origin.y, square.size, square.size);
  }

  // draw all the spawn areas that are of the spawnable space type NEBULA
  for (const { square, spaceType, state } of spawnAreas) {
    if (spaceType !== SpaceType.NEBULA) {
      continue;
    }

    if (state !== "valid") {
      continue;
    }

    ctx.fillStyle = Colors.InnerNebulaColor;
    ctx.fillRect(square.origin.x, square.origin.y, square.size, square.size);
  }

  // draw pink circles
  for (const zone of pinkZones) {
    ctx.beginPath();
    ctx.arc(zone.point.x, zone.point.y, zone.radius * 0.9, 0, 2 * Math.PI);
    // pink color
    ctx.strokeStyle = "rgb(255,180,193,1)";
    ctx.fillStyle = "rgb(255,180,193, 0.85)";
    ctx.lineWidth = 1;
    ctx.fill();
    ctx.stroke();
  }

  // draw blue circles
  for (const zone of blueZones) {
    ctx.beginPath();
    ctx.arc(zone.point.x, zone.point.y, zone.radius * 0.9, 0, 2 * Math.PI);
    // blue circle
    ctx.strokeStyle = "rgb(0, 173, 225, 1)";
    ctx.fillStyle = "rgb(0, 173, 225, 0.85)";
    ctx.lineWidth = 1;
    ctx.fill();
    ctx.stroke();
  }

  if (selectedSpawnArea) {
    const { origin, size } = selectedSpawnArea.square;
    ctx.fillStyle = Colors.SelectedSpawnArea;
    ctx.fillRect(origin.x, origin.y, size, size);
  }

  // draw rim radius
  const offset = canvasRadius - rimRadius + canvasBorderSize;
  ctx.beginPath();
  ctx.arc(rimRadius + offset, rimRadius + offset, rimRadius, 0, 2 * Math.PI);
  ctx.fillStyle = Colors.Pink;
  ctx.fill();
}

function DFMUDLogo({ rimRadius }: { rimRadius: number }) {
  const size = rimRadius * 1.25; // adjust size as needed
  const offset = (canvasSize + canvasBorderSize * 2 - size) / 2;

  return (
    <div
      style={{
        position: "absolute",
        top: `${offset}px`,
        left: `${offset}px`,
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      <img src="/darkforest_mud_logo.png" width={size} height={size} />;
    </div>
  );
}

type InfoOptions = {
  type: "none" | "no-drop" | "coords" | "selected";
  point?: Point;
};

function MiniMapImpl({}, ref: React.Ref<MiniMapHandle>) {
  const canvasRef = useRef(null);
  const infoOptionsRef = useRef(null);
  const overlayRef = useRef(null);

  const MAX_LEVEL_DIST = df.getContractConstants().MAX_LEVEL_DIST[3];

  const worldRadius = df.getWorldRadius();
  const rimRadius = canvasRadius * (MAX_LEVEL_DIST / worldRadius);
  const radius = canvasRadius;
  const scaleFactor = worldRadius / radius;

  const squares = makeSquares();
  const spawnAreas = getSpawnAreas({
    squares,
    radius,
    rimRadius,
    scaleFactor,
  });
  const blueZones = getBlueZones({
    scaleFactor,
    radius,
  });
  const pinkZones = getPinkZones({
    scaleFactor,
    radius,
  });
  updateSpawnAreas({
    spawnAreas,
    blueZones,
    pinkZones,
  });

  let mousePoints = makeMousePoints(spawnAreas);
  let selectable = true;
  let selectedSpawnArea: SpawnArea | undefined = undefined;

  // render loop
  useEffect(() => {
    const canvas = canvasRef.current! as HTMLCanvasElement;
    const ctx = canvas.getContext("2d")! as CanvasRenderingContext2D;

    let animationFrameId: number;
    const render = () => {
      draw(ctx, {
        squares,
        spawnAreas,
        rimRadius,
        selectedSpawnArea,
        blueZones,
        pinkZones,
      });

      animationFrameId = window.requestAnimationFrame(render);
    };
    render();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // handle canvas mouse events
  useEffect(() => {
    const canvas = canvasRef.current! as HTMLCanvasElement;
    const ctx = canvas.getContext("2d")! as CanvasRenderingContext2D;

    const updateInfoOptions = ({ type, point }: InfoOptions) => {
      const element = infoOptionsRef.current! as HTMLDivElement;
      switch (type) {
        case "no-drop": {
          element.style.color = Colors.Pink;
          element.innerText = "Can't spawn here 😅";
          break;
        }
        case "coords": {
          element.style.color = Colors.InnerNebulaColor;
          element.innerText = `(${point!.x.toFixed(0)}, ${point!.y.toFixed(0)})`;
          break;
        }
        case "selected": {
          element.style.color = Colors.SelectedSpawnArea;
          element.innerText = `Selected spawn point: (${point!.x.toFixed(0)}, ${point!.y.toFixed(
            0,
          )}) 🚀`;
          break;
        }
        default: {
          element.style.color = "";
          element.innerText = "";
        }
      }
    };

    // add mouse move listener
    let timeoutId = 0;
    const handleMouseMove = (event: MouseEvent) => {
      const [x, y] = [event.offsetX, event.offsetY];
      const key = `(${x},${y})`;
      const area = mousePoints[key];

      let infoOptions: InfoOptions;
      let cursorStyle = "pointer";
      switch (true) {
        case !point_on_circle(
          { x: x - canvasRadius, y: y - canvasRadius },
          radius,
        ): {
          infoOptions = { type: "none" };
          break;
        }
        case Boolean(area): {
          infoOptions = {
            type: "coords",
            point: area.worldPoint,
          };
          break;
        }
        default: {
          cursorStyle = "no-drop";
          infoOptions = { type: "no-drop" };
          break;
        }
      }
      canvas.style.cursor = cursorStyle;
      updateInfoOptions(infoOptions);
      clearTimeout(timeoutId);

      timeoutId = window.setTimeout(() => {
        updateInfoOptions(
          selectedSpawnArea
            ? { type: "selected", point: selectedSpawnArea.worldPoint }
            : { type: "none" },
        );
      }, 500);
    };

    // add mouse click listener
    const handleClick = (event: MouseEvent) => {
      const [x, y] = [event.offsetX, event.offsetY];
      const key = `(${x},${y})`;
      const area = mousePoints[key];

      if (!area) {
        return;
      }

      if (selectedSpawnArea) {
        const { origin, size } = selectedSpawnArea.square;
        ctx.fillStyle = Colors.InnerNebulaColor;
        ctx.fillRect(origin.x, origin.y, size, size);
      }

      const { origin, size } = area.square;
      ctx.fillStyle = Colors.SelectedSpawnArea;
      ctx.fillRect(origin.x, origin.y, size, size);

      updateInfoOptions({
        type: "selected",
        point: area.worldPoint,
      });

      selectedSpawnArea = area;
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("click", handleClick);

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("click", handleClick);
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const oneMinuteInMs = 60_000;
    const updateZones = () => {
      // empty and update the blue zones
      blueZones.splice(0, blueZones.length);
      blueZones.push(...getBlueZones({ scaleFactor, radius }));

      // empty and update the pink zones
      pinkZones.splice(0, pinkZones.length);
      pinkZones.push(...getPinkZones({ scaleFactor, radius }));

      updateSpawnAreas({
        spawnAreas,
        blueZones,
        pinkZones,
      });

      // update mouse points
      mousePoints = makeMousePoints(spawnAreas);

      timeoutId = window.setTimeout(updateZones, oneMinuteInMs);
    };

    let timeoutId = window.setTimeout(updateZones, oneMinuteInMs);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  // implement api
  useImperativeHandle(
    ref,
    () => ({
      getSelectedSpawnArea: () => selectedSpawnArea,
      setSelectable: (value: boolean) => {
        selectable = value;
        (overlayRef.current! as HTMLDivElement).style.display = selectable
          ? "none"
          : "block";
      },
    }),
    [],
  );

  return (
    <StyledMiniMap>
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        style={{
          border: `${canvasBorderSize}px solid ${Colors.Pink}`,
          borderRadius: "50%",
        }}
      />
      <DFMUDLogo rimRadius={rimRadius} />

      <StyledCoords ref={infoOptionsRef}></StyledCoords>
      <div
        ref={overlayRef}
        style={{
          display: "none",
          position: "absolute",
          top: 0,
          left: 0,
          width: `${canvasSize}px`,
          height: `${canvasSize}px`,
          backgroundColor: "rgb(0, 0, 0, 0)",
        }}
      />
    </StyledMiniMap>
  );
}

export const MiniMap = React.forwardRef<MiniMapHandle | undefined>(MiniMapImpl);
