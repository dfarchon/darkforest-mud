import { isLocatable } from "@df/gamelogic";
import { type Planet, PlanetType } from "@df/types";
import { css, keyframes } from "styled-components";

import { BiomeBackgroundColors } from "./Colors";

const scrolling = keyframes`
  from {
    background-position: 0 0;
  }
  to {
    background-position: 200px 200px;
  }
`;

export function planetBackground({ planet }: { planet: Planet | undefined }) {
  if (!planet || planet.planetType === PlanetType.TRADING_POST) {
    return css`
      background: url("/img/spacebg.jpg");
      background-size: 200px 200px;
      background-repeat: repeat;
      animation: ${scrolling} 10s linear infinite;
    `;
  } else {
    return isLocatable(planet)
      ? css`
          background: ${BiomeBackgroundColors[planet.biome]};
        `
      : ``;
  }
}
