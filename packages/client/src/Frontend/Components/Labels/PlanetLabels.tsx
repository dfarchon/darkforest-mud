import { EMPTY_ADDRESS } from "@df/constants";
import {
  formatCompact,
  formatCompact2,
  formatEtherToNumber,
  formatNumber,
} from "@df/gamelogic";
import { getPlayerColor } from "@df/procedural";
import type { Planet } from "@df/types";
import type { MaterialType } from "@df/types";
import { PlanetType, PlanetTypeNames } from "@df/types";
import {
  getMaterialColor,
  getMaterialIcon,
  getMaterialName,
} from "@frontend/Panes/PlanetMaterialsPane";
import styled from "styled-components";
import React from "react";

import { getPlanetRank } from "../../../Backend/Utils/Utils";
import dfstyles from "../../Styles/dfstyles";
import { useAccount, usePlayer, useUIManager } from "../../Utils/AppHooks";
import { EmSpacer } from "../CoreUI";
import { Colored, Sub, Subber, White } from "../Text";
import { TextPreview } from "../TextPreview";
import { OptionalPlanetBiomeLabelAnim } from "./BiomeLabels";
import { TwitterLink } from "./Labels";
import { SpacetimeRipLabel } from "./SpacetimeRipLabel";

const MaterialBar = styled.div<{
  percentage: number;
  materialID: MaterialType;
}>`
  width: 100%;
  height: 8px;
  background-color: ${dfstyles.colors.borderDarker};
  border-radius: 4px;
  overflow: hidden;
  position: relative;

  &::after {
    content: "";
    display: block;
    width: ${(props) => props.percentage}%;
    height: 100%;
    background-color: ${(props) => getMaterialColor(props.materialID)};
    transition: width 0.3s ease;
  }
`;

const MaterialBarText = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 10px;
  font-weight: bold;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  z-index: 1;
  pointer-events: none;
`;

/* note that we generally prefer `Planet | undefined` over `Planet` because it
   makes it easier to pass in selected / hovering planet from the emitters      */

/* stat stuff */

export function StatText({
  planet,
  getStat,
  style,
  buff,
}: {
  planet: Planet | undefined;
  getStat: (p: Planet) => number;
  style?: React.CSSProperties;
  buff?: number;
}) {
  const textStyle = {
    ...style,
    color: buff ? dfstyles.colors.dforange : undefined,
  };

  let content;
  if (planet) {
    let stat = getStat(planet);
    if (buff) {
      stat *= buff;
    }
    content = formatNumber(stat, 2);
  } else {
    content = "n/a";
  }
  return <span style={textStyle}>{content}</span>;
}

export function GrowthText({
  planet,
  getStat,
  style,
}: {
  planet: Planet | undefined;
  getStat: (p: Planet) => number;
  style?: React.CSSProperties;
}) {
  const paused = planet && planet.pausers > 0;
  const statStyle = {
    ...style,
    textDecoration: paused ? "line-through" : "none",
  };

  return <StatText style={statStyle} planet={planet} getStat={getStat} />;
}

const getSilver = (p: Planet) => p.silver;
export const SilverText = ({ planet }: { planet: Planet | undefined }) => (
  <StatText planet={planet} getStat={getSilver} />
);

const getSilverCap = (p: Planet) => p.silverCap;
export const SilverCapText = ({ planet }: { planet: Planet | undefined }) => (
  <StatText planet={planet} getStat={getSilverCap} />
);

const getEnergy = (p: Planet) => p.energy;
export const EnergyText = ({ planet }: { planet: Planet | undefined }) => (
  <StatText planet={planet} getStat={getEnergy} />
);

const getEnergyCap = (p: Planet) => p.energyCap;
export const EnergyCapText = ({ planet }: { planet: Planet | undefined }) => (
  <StatText planet={planet} getStat={getEnergyCap} />
);

export function PlanetEnergyLabel({ planet }: { planet: Planet | undefined }) {
  return (
    <span>
      <EnergyText planet={planet} /> <Subber>/</Subber>{" "}
      <EnergyCapText planet={planet} />
    </span>
  );
}

export function PlanetSilverLabel({ planet }: { planet: Planet | undefined }) {
  return (
    <span>
      <SilverText planet={planet} /> <Subber>/</Subber>{" "}
      <SilverCapText planet={planet} />
    </span>
  );
}

const getDefense = (p: Planet) => p.defense;
export const DefenseText = ({ planet }: { planet: Planet | undefined }) => (
  <StatText planet={planet} getStat={getDefense} />
);

const getRange = (p: Planet) => p.range;
export const RangeText = ({
  planet,
  buff,
}: {
  planet: Planet | undefined;
  buff?: number;
}) => <StatText planet={planet} getStat={getRange} buff={buff} />;

const getJunk = (p: Planet) => p.spaceJunk;
export const JunkText = ({ planet }: { planet: Planet | undefined }) => (
  <StatText planet={planet} getStat={getJunk} />
);

const getSpeed = (p: Planet) => p.speed;
export const SpeedText = ({
  planet,
  buff,
}: {
  planet: Planet | undefined;
  buff?: number;
}) => <StatText planet={planet} getStat={getSpeed} buff={buff} />;

const getEnergyGrowth = (p: Planet) => p.energyGrowth;
export const EnergyGrowthText = ({
  planet,
}: {
  planet: Planet | undefined;
}) => <GrowthText planet={planet} getStat={getEnergyGrowth} />;

const getSilverGrowth = (p: Planet) => p.silverGrowth;
export const SilverGrowthText = ({
  planet,
}: {
  planet: Planet | undefined;
}) => <GrowthText planet={planet} getStat={getSilverGrowth} />;

// level and rank stuff
export const PlanetLevelText = ({ planet }: { planet: Planet | undefined }) =>
  planet ? <>Level {planet.planetLevel}</> : <></>;

export const PlanetRankText = ({ planet }: { planet: Planet | undefined }) =>
  planet ? <>Rank {getPlanetRank(planet)}</> : <></>;

export const LevelRankText = ({
  planet,
  delim,
}: {
  planet: Planet | undefined;
  delim?: string;
}) => (
  <>
    <PlanetLevelText planet={planet} />
    {delim || ", "}
    <PlanetRankText planet={planet} />
  </>
);

export const LevelRankTextEm = ({
  planet,
  delim,
}: {
  planet: Planet | undefined;
  delim?: string;
}) =>
  planet ? (
    <Sub>
      lvl <White>{planet.planetLevel}</White>
      {delim || ", "}
      rank <White>{getPlanetRank(planet)}</White>
    </Sub>
  ) : (
    <></>
  );

export const PlanetTypeLabelAnim = ({
  planet,
}: {
  planet: Planet | undefined;
}) => (
  <>
    {planet &&
      (planet.planetType === PlanetType.TRADING_POST ? (
        <SpacetimeRipLabel />
      ) : (
        PlanetTypeNames[planet.planetType]
      ))}
  </>
);

export const PlanetBiomeTypeLabelAnim = ({
  planet,
}: {
  planet: Planet | undefined;
}) => (
  <>
    {planet?.planetType !== PlanetType.TRADING_POST && (
      <>
        <OptionalPlanetBiomeLabelAnim planet={planet} />
        <EmSpacer width={0.5} />
      </>
    )}
    <PlanetTypeLabelAnim planet={planet} />
  </>
);

export const PlanetLevel = ({ planet }: { planet: Planet | undefined }) => {
  if (!planet) {
    return <></>;
  }
  return (
    <>
      <Sub>{"Level "}</Sub>
      {planet.planetLevel}
    </>
  );
};

export const PlanetRank = ({ planet }: { planet: Planet | undefined }) => {
  if (!planet) {
    return <></>;
  }
  return (
    <>
      <Sub>{"Rank "}</Sub>
      {getPlanetRank(planet)}
    </>
  );
};

/**
 * Either 'yours' in green text,
 */
export function PlanetOwnerLabel({
  planet,
  abbreviateOwnAddress,
  colorWithOwnerColor,
}: {
  planet: Planet | undefined;
  abbreviateOwnAddress?: boolean;
  colorWithOwnerColor?: boolean;
}) {
  const uiManager = useUIManager();
  const account = useAccount(uiManager);
  const owner = usePlayer(uiManager, planet?.owner);

  const defaultColor = dfstyles.colors.subtext;

  if (!planet) {
    return <>/</>;
  }

  if (planet.owner === EMPTY_ADDRESS) {
    return <Sub>Unclaimed</Sub>;
  }

  if (abbreviateOwnAddress && planet.owner === account) {
    return <Colored color={dfstyles.colors.dfgreen}>yours!</Colored>;
  }

  const color = colorWithOwnerColor
    ? defaultColor
    : getPlayerColor(planet.owner);
  if (planet.owner && owner.value?.twitter) {
    return <TwitterLink color={color} twitter={owner.value.twitter} />;
  }

  return (
    <Colored color={color}>
      <TextPreview text={planet.owner} />
    </Colored>
  );
}

export function MaterialsText({
  planet,
  style,
}: {
  planet: Planet | undefined;
  style?: React.CSSProperties;
}) {
  if (!planet || !planet.materials || planet.materials.length === 0) {
    return <span style={style}>No materials</span>;
  }

  // Filter out materials with 0 amount and UNKNOWN type
  const activeMaterials = planet.materials.filter(
    (mat) => mat.materialId !== 0 && Number(mat.materialAmount) > 0,
  );

  if (activeMaterials.length === 0) {
    return <span style={style}>No materials</span>;
  }

  return (
    <span style={style}>
      {activeMaterials.map((mat, index) => (
        <span key={mat.materialId}>
          {index > 0 && ", "}
          {getMaterialName(mat.materialId)}:{" "}
          {formatEtherToNumber(mat.materialAmount)}
        </span>
      ))}
    </span>
  );
}

export function MaterialsDisplay({
  planet,
  style,
}: {
  planet: Planet | undefined;
  style?: React.CSSProperties;
}) {
  if (!planet || !planet.materials || planet.materials.length === 0) {
    return null;
  }

  // Filter out materials with 0 amount and UNKNOWN type
  const activeMaterials = planet.materials.filter(
    (mat) => mat.materialId !== 0 && Number(mat.materialAmount) > 0,
  );

  if (activeMaterials.length === 0) {
    return null;
  }

  return (
    <div style={style}>
      <div
        style={{
          fontSize: "0.9em",
          color: dfstyles.colors.subtext,
          marginBottom: "4px",
          textAlign: "center",
        }}
      >
        Materials
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: "4px",
          fontSize: "0.8em",
        }}
      >
        {activeMaterials.map((mat) => {
          const percentage =
            Number(mat.cap) > 0
              ? Math.min(
                  (Number(mat.materialAmount) / Number(mat.cap)) * 100,
                  100,
                )
              : 0;

          return (
            <div
              key={mat.materialId}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                padding: "4px",
                backgroundColor: dfstyles.colors.backgroundlighter,
                borderRadius: "4px",
                border: `1px solid ${dfstyles.colors.borderDarker}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "0.8em",
                }}
              >
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    backgroundColor: getMaterialColor(mat.materialId),
                    borderRadius: "2px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    lineHeight: "1",
                  }}
                >
                  {getMaterialIcon(mat.materialId)}
                </div>
                <span
                  style={{
                    color: getMaterialColor(mat.materialId),
                    fontSize: "12px",
                  }}
                >
                  {getMaterialName(mat.materialId)}
                </span>
                {mat.growth && (
                  <span
                    style={{
                      color: getMaterialColor(mat.materialId),
                      fontSize: "12px",
                    }}
                  >
                    + {""} {formatCompact2(Number(mat.growthRate) / 1e18)}
                  </span>
                )}
              </div>

              <MaterialBar percentage={percentage} materialID={mat.materialId}>
                <MaterialBarText>
                  {formatCompact(Number(mat.materialAmount) / 1e18)} /{" "}
                  {formatCompact(Number(mat.cap) / 1e18)}
                </MaterialBarText>
              </MaterialBar>
            </div>
          );
        })}
      </div>
    </div>
  );
}
