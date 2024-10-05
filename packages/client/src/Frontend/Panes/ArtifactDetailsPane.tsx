import { EMPTY_ADDRESS } from "@df/constants";
import {
  artifactCooldownHoursMap,
  dateMintedAt,
  hasStatBoost,
  isActivated,
  isSpaceShip,
} from "@df/gamelogic";
import { artifactName, getPlanetName, getPlanetNameHash } from "@df/procedural";
import type {
  Artifact,
  ArtifactId,
  EthAddress,
  LocationId,
  Upgrade,
} from "@df/types";
import { ArtifactRarityNames, ArtifactType, TooltipName } from "@df/types";
import _ from "lodash-es";
import styled from "styled-components";

import type { ContractConstants } from "../../_types/darkforest/api/ContractsAPITypes";
import type { StatIdx } from "../../_types/global/GlobalTypes";
import { getUpgradeStat } from "../../Backend/Utils/Utils";
import { ArtifactImage } from "../Components/ArtifactImage";
import { Spacer } from "../Components/CoreUI";
import { StatIcon } from "../Components/Icons";
import {
  ArtifactRarityLabelAnim,
  ArtifactTypeText,
} from "../Components/Labels/ArtifactLabels";
import { ArtifactBiomeLabelAnim } from "../Components/Labels/BiomeLabels";
import { AccountLabel } from "../Components/Labels/Labels";
import { ReadMore } from "../Components/ReadMore";
import { Green, Red, Sub, Text, Text2, White } from "../Components/Text";
import { TextPreview } from "../Components/TextPreview";
import { TimeUntil } from "../Components/TimeUntil";
import dfstyles from "../Styles/dfstyles";
import { useAccount, useArtifact, useUIManager } from "../Utils/AppHooks";
import type { ModalHandle } from "../Views/ModalPane";
import { ArtifactActions } from "./ManagePlanetArtifacts/ArtifactActions";
import { ArtifactChangeImageType } from "./ManagePlanetArtifacts/ArtifactChangeImageType";
import { TooltipTrigger } from "./Tooltip";

const StatsContainer = styled.div`
  flex-grow: 1;
`;

const ArtifactDetailsHeader = styled.div`
  min-height: 128px;
  display: flex;
  flex-direction: row;

  & > div::last-child {
    flex-grow: 1;
  }

  .statrow {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;

    & > span:first-child {
      margin-right: 1.5em;
    }

    & > span:last-child {
      text-align: right;
      width: 6em;
      flex-grow: 1;
    }
  }
`;

export function UpgradeStatInfo({
  upgrades,
  stat,
}: {
  upgrades: (Upgrade | undefined)[];
  stat: StatIdx;
}) {
  let mult = 100;

  for (const upgrade of upgrades) {
    if (upgrade) {
      mult *= getUpgradeStat(upgrade, stat) / 100;
    }
  }

  const statName = [
    TooltipName.Energy,
    TooltipName.EnergyGrowth,
    TooltipName.Range,
    TooltipName.Speed,
    TooltipName.Defense,
  ][stat];

  return (
    <div className="statrow">
      <TooltipTrigger name={statName}>
        <StatIcon stat={stat} />
      </TooltipTrigger>
      <span>
        {mult > 100 && <Green>+{Math.round(mult - 100)}%</Green>}
        {mult === 100 && <Sub>no effect</Sub>}
        {mult < 100 && <Red>-{Math.round(100 - mult)}%</Red>}
      </span>
    </div>
  );
}

const StyledArtifactDetailsBody = styled.div`
  & > div:first-child p {
    text-decoration: underline;
  }

  & .row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;

    & > span:first-child {
      color: ${dfstyles.colors.subtext};
    }

    & > span:last-child {
      text-align: right;
    }
  }

  & .link {
    &:hover {
      cursor: pointer;
      text-decoration: underline;
    }
  }
`;

const ArtifactName = styled.div`
  color: ${dfstyles.colors.text};
  font-weight: bold;
`;

const ArtifactNameSubtitle = styled.div`
  color: ${dfstyles.colors.subtext};
  margin-bottom: 8px;
`;

export function ArtifactDetailsHelpContent() {
  return (
    <div>
      <p>
        In this pane, you can see specific information about a particular
        artifact. You can also initiate a conversation with the artifact! Try
        talking to your artifacts. Make some new friends (^:
      </p>
    </div>
  );
}

export function ArtifactDetailsBody({
  artifactId,
  contractConstants,
  depositOn,
  noActions,
}: {
  artifactId: ArtifactId;
  contractConstants: ContractConstants;
  modal?: ModalHandle;
  depositOn?: LocationId;
  noActions?: boolean;
}) {
  const uiManager = useUIManager();
  const myAccount = useAccount(uiManager);
  const artifactWrapper = useArtifact(uiManager, artifactId);
  const artifact = artifactWrapper.value;

  // const currentBlockNumber = useEmitterValue(uiManager.getEthConnection().blockNumber$, undefined);

  if (!artifact) {
    return null;
  }

  const activateArtifactCooldownPassed =
    uiManager.getNextActivateArtifactAvailableTimestamp() <= Date.now();

  // console.log(ArtifactType);

  const account = (addr: EthAddress) => {
    const twitter = uiManager?.getTwitter(addr);
    if (twitter) {
      return "@" + twitter;
    }
    return <TextPreview text={addr} />;
  };

  const owner = () => {
    if (!artifact) {
      return "";
    }
    return account(artifact.currentOwner);
  };

  const discoverer = () => {
    if (!artifact) {
      return "";
    }
    return account(artifact.discoverer);
  };

  // TODO make this common with playerartifactspane
  const planetArtifactName = (a: Artifact): string | undefined => {
    const onPlanet = uiManager?.getArtifactPlanet(a);
    if (!onPlanet) {
      return undefined;
    }
    return getPlanetName(onPlanet);
  };

  const planetClicked = (): void => {
    if (artifact.onPlanetId) {
      uiManager?.setSelectedId(artifact.onPlanetId);
    }
  };

  let readyInStr = undefined;

  if (
    artifact.artifactType === ArtifactType.PhotoidCannon &&
    isActivated(artifact)
  ) {
    readyInStr = (
      <TimeUntil
        timestamp={
          artifact.lastActivated * 1000 +
          contractConstants.PHOTOID_ACTIVATION_DELAY * 1000
        }
        ifPassed={"now!"}
      />
    );
  }

  if (
    artifact.artifactType === ArtifactType.StellarShield &&
    isActivated(artifact)
  ) {
    readyInStr = (
      <TimeUntil
        timestamp={
          artifact.lastActivated * 1000 +
          contractConstants.STELLAR_ACTIVATION_DELAY * 1000
        }
        ifPassed={"now!"}
      />
    );
  }

  // // about activate artifact block limit pane
  // //myTodo: 2 min 1 artifact
  // const deltaTime = 2;

  // const maxAmount = currentBlockNumber
  //   ? Math.floor(
  //       ((currentBlockNumber - uiManager.contractConstants.GAME_START_BLOCK) * 2.0) /
  //         (60 * deltaTime)
  //     )
  //   : 0;

  // const activateArtifactAmountInContract = myAccount
  //   ? uiManager.getPlayerActivateArtifactAmount(myAccount)
  //   : 0;
  // const activateArtifactAmount = activateArtifactAmountInContract
  //   ? activateArtifactAmountInContract
  //   : 0;

  return (
    <div className="artifact-details-pane-body">
      <div style={{ display: "inline-block" }}>
        <ArtifactImage artifact={artifact} size={32} />
      </div>
      <Spacer width={8} />
      <div style={{ display: "inline-block" }}>
        {isSpaceShip(artifact.artifactType) ? (
          <>
            <ArtifactName>
              <ArtifactTypeText artifact={artifact} />
            </ArtifactName>
            <ArtifactNameSubtitle>
              {artifactName(artifact)}
            </ArtifactNameSubtitle>
          </>
        ) : (
          <>
            <ArtifactName>{artifactName(artifact)}</ArtifactName>
            <ArtifactNameSubtitle>
              <ArtifactRarityLabelAnim rarity={artifact.rarity} />{" "}
              <ArtifactBiomeLabelAnim artifact={artifact} />{" "}
              <ArtifactTypeText artifact={artifact} />
            </ArtifactNameSubtitle>
          </>
        )}
      </div>

      {hasStatBoost(artifact.artifactType) && (
        <ArtifactDetailsHeader>
          <StatsContainer>
            {_.range(0, 5).map((val) => (
              <UpgradeStatInfo
                upgrades={[artifact.upgrade, artifact.timeDelayedUpgrade]}
                stat={val}
                key={val}
              />
            ))}
          </StatsContainer>
        </ArtifactDetailsHeader>
      )}

      {isSpaceShip(artifact.artifactType) && (
        <ArtifactDescription collapsable={false} artifact={artifact} />
      )}

      <StyledArtifactDetailsBody>
        {!isSpaceShip(artifact.artifactType) && (
          <ArtifactDescription artifact={artifact} />
        )}
        <Spacer height={8} />

        <div className="row">
          <span>Located On</span>
          {planetArtifactName(artifact) ? (
            <span className="link" onClick={planetClicked}>
              {planetArtifactName(artifact)}
            </span>
          ) : (
            <span>n / a</span>
          )}
        </div>

        {!isSpaceShip(artifact.artifactType) && (
          <>
            <div className="row">
              <span>Minted At</span>
              <span>{dateMintedAt(artifact)}</span>
            </div>
            <div className="row">
              <span>Discovered On</span>
              <span>{getPlanetNameHash(artifact.planetDiscoveredOn)}</span>
            </div>
            <div className="row">
              <span>Discovered By</span>
              <span>{discoverer()}</span>
            </div>
          </>
        )}

        {artifact.controller === EMPTY_ADDRESS && (
          <div className="row">
            <span>Owner</span>
            <span>{owner()}</span>
          </div>
        )}
        <div className="row artifact-id-container">
          <span>ID</span>
          <TextPreview text={artifact.id} />
        </div>

        {artifact.controller !== EMPTY_ADDRESS && (
          <div className="row">
            <span>Controller</span>
            <span>
              <AccountLabel ethAddress={artifact.controller} />
            </span>
          </div>
        )}
        {readyInStr && (
          <div className="row">
            <span>Ready In</span>
            <span>{readyInStr}</span>
          </div>
        )}

        <ArtifactChangeImageType
          artifactId={artifactWrapper.value?.id}
          depositOn={depositOn}
        />

        {/* {artifact.artifactType !== ArtifactType.Avatar &&
          false === isSpaceShip(artifact.artifactType) && (
            <div>
              <div>block number: {currentBlockNumber}</div>
              <div> activate artifact amount: {activateArtifactAmount}</div>
              <div> max artifact amount: {maxAmount} </div>
            </div>
          )} */}

        {/* {!isSpaceShip(artifact.artifactType) && (
          <div>
            <br />
            You can only activate artifact once every{' '}
            <White>
              {formatDuration(uiManager.contractConstants.ACTIVATE_ARTIFACT_COOLDOWN * 1000)}
            </White>
            .
            <br />
          </div>
        )} */}

        {/* {!isSpaceShip(artifact.artifactType) && !activateArtifactCooldownPassed && (
          <p>
            <Blue>INFO:</Blue> You must wait{' '}
            <TimeUntil
              timestamp={uiManager.getNextActivateArtifactAvailableTimestamp()}
              ifPassed={'now!'}
            />{' '}
            to activate artifact.
          </p>
        )} */}

        {!noActions && (
          <ArtifactActions
            artifactId={artifactWrapper.value?.id}
            depositOn={depositOn}
          />
        )}
      </StyledArtifactDetailsBody>
    </div>
  );
}

export function ArtifactDetailsPane({
  modal,
  artifactId,
  depositOn,
}: {
  modal: ModalHandle;
  artifactId: ArtifactId;
  depositOn?: LocationId;
}) {
  const uiManager = useUIManager();
  const contractConstants = uiManager.contractConstants;

  return (
    <ArtifactDetailsBody
      modal={modal}
      artifactId={artifactId}
      contractConstants={contractConstants}
      depositOn={depositOn}
    />
  );
}

function ArtifactDescription({
  artifact,
  collapsable,
}: {
  artifact: Artifact;
  collapsable?: boolean;
}) {
  let content;
  const rarityName = ArtifactRarityNames[artifact.rarity];

  const wormholeShrinkLevels = [0, 2, 4, 8, 16, 32];

  const maxLevelsPlanetaryShield = [0, 2, 4, 6, 8, 9];
  const maxLevelPlanetaryShield = maxLevelsPlanetaryShield[artifact.rarity];

  const maxLevelsBlackDomain = [0, 2, 4, 6, 8, 9];
  const maxLevelBlackDomain = maxLevelsBlackDomain[artifact.rarity];

  const maxLevelsBloomFilter = [0, 2, 4, 6, 8, 9];
  const maxLevelBloomFilter = maxLevelsBloomFilter[artifact.rarity];

  const photoidRanges = [0, 2, 2, 2, 2, 2];
  const photoidSpeeds = [0, 5, 10, 15, 20, 25];

  const maxLevelsIceLink = [0, 2, 4, 6, 8, 9];
  const maxLevelIceLink = maxLevelsIceLink[artifact.rarity];

  const maxLevelsFireLink = [0, 2, 4, 6, 8, 9];
  const maxLevelFireLink = maxLevelsFireLink[artifact.rarity];

  const maxLevelsStellarShield = [0, 2, 4, 6, 8, 9];
  const maxLevelStellarShield = maxLevelsStellarShield[artifact.rarity];

  const genericSpaceshipDescription = (
    <>Can move between planets without sending energy.</>
  );

  switch (artifact.artifactType) {
    case ArtifactType.Wormhole:
      content = (
        <Text>
          <div>
            <Green>INTRO: </Green>When activated, shortens the distance between
            this planet and another one. All moves between those two planets
            decay less energy, and complete faster.
          </div>
          <div>
            <Green>DETIAL: </Green>Because this one is{" "}
            <White>{rarityName}</White>, it shrinks the distance by a factor of{" "}
            <White>{wormholeShrinkLevels[artifact.rarity]}</White>x.
          </div>

          <div>
            <Green>ACTIVATION: </Green> The source planet and target planet must
            be yours.
          </div>

          <div>
            <Green>DEACTIVATION: </Green>The artifact does not disappear after
            deactivation, but you have to wait for{" "}
            <White>{artifactCooldownHoursMap[ArtifactType.Wormhole]}</White> hrs
            before activating it again.
          </div>

          <div>
            <Red>
              NOTE: Energy sent through your wormhole to a planet you do not
              control does not arrive.
            </Red>
          </div>
        </Text>
      );
      break;

    case ArtifactType.PlanetaryShield:
      content = (
        <Text>
          <div>
            <Green>INTRO: </Green>Activate the planetary shield to gain a
            defense bonus on your planet, at the expense of range and speed.
          </div>
          <div>
            <Green>LEVEL: </Green>Because this one is{" "}
            <White>{rarityName}</White>, it can activate on planets up to level{" "}
            <White>{maxLevelPlanetaryShield}</White>.
          </div>
          <div>
            <Green>DEACTIVATION: </Green>When this artifact is deactivated, it
            will disappear and your planet&apos;s stats are reverted--so use it
            wisely!
          </div>

          {/* <Text2>
            Planet with activated planetary shield can defend against black domain's attack when
            planetary shield's rarity {'>='} block domain rarity.{' '}
          </Text2> */}
          {/* <Text>
            Planet with activated planetary shield can defend against ice link's attack when
            planetary shield's rarity {'>='} ice link's rarity.
          </Text> */}
        </Text>
      );
      break;
    case ArtifactType.BlackDomain:
      content = (
        <Text>
          <div>
            <Green>INTRO: </Green>When activated, permanently disables target
            planet. It&apos;ll still be others, but the owner won&apos;t be able
            to do anything with it. It turns completely black too. Just ...
            gone.
          </div>
          <div>
            <Green>LEVEL: </Green>Because this one is{" "}
            <White>{rarityName}</White>, it can activate on planets up to level{" "}
            <White>{maxLevelBlackDomain}</White>.
          </div>
          <div>
            <Green>ACTIVATION: </Green>This artifact is consumed on activation.
          </div>

          {/* <Text2>The target planet must be owned by others. </Text2> */}
          {/* <Text>The target planet level must {'>='} source planet level. </Text> */}
          {/* <Text>Block domain can be defended by planerary shield. </Text> */}
        </Text>
      );
      break;

    case ArtifactType.PhotoidCannon:
      content = (
        <Text>
          <div>
            <Green>INTRO: </Green> Ahh, the Photoid Canon. Activate it, wait
            four hours. Because this one is <White>{rarityName}</White>, the
            next move you send will be able to go{" "}
            <White>{photoidRanges[artifact.rarity]}</White>x further and{" "}
            <White>{photoidSpeeds[artifact.rarity]}</White>x faster. During the
            4 hour waiting period, your planet&apos;s defense is temporarily
            decreased. This artifact is consumed once the canon is fired.
          </div>

          <div>
            <Green>DEACTIVATION: </Green>When this artifact is deactivated, it
            will disappear and your planet&apos;s stats are reverted--so use it
            wisely!
          </div>
          {/* <Text2>
            Because this one is <White>{rarityName}</White>, it can activate on planets up to level{' '}
            <White>{maxLevelPhotoidCannon}</White>.
          </Text2> */}
          <div>
            <Green>NOTE: </Green>If target planet with active Stellar Shield,
            Photoid Canon rarity need {">="} Stellar Sheild rarity.
          </div>
        </Text>
      );
      // content = (
      //   <Text>
      //     <Text>
      //       Ahh, the Photoid Canon. Activate it, wait for sometimes. The next move you send will be
      //       able to arrive in a very short time. During the waiting period, your planet's defense is
      //       temporarily decreased.
      //     </Text>
      //     <Text2> This artifact is consumed once the canon is fired. </Text2>
      //     <Text>The quick move can be defended by stellar Shield. </Text>
      //   </Text>
      // );
      break;

    case ArtifactType.BloomFilter:
      // content = (
      //   <Text>
      //     When activated refills your planet's energy and silver to their respective maximum values.
      //     How it does this, we do not know. Because this one is <White>{rarityName}</White>, it
      //     works on planets up to level <White>{maxLevelBloomFilter}</White>. This artifact is
      //     consumed on activation.
      //   </Text>
      // );
      content = (
        <Text>
          <div>
            <Green>INTRO: </Green> When activated refills your planet&apos;s
            energy to their respective maximum values.
          </div>
          <div>
            <Green>LEVEL: </Green>Because this one is{" "}
            <White>{rarityName}</White>, it works on planets up to level{" "}
            <White>{maxLevelBloomFilter}</White>.
          </div>
          <div>
            <Green>ACTIVATION: </Green>This artifact is consumed on activation.
          </div>
          {/* When activated refills your planet's energy to their respective maximum values. How it
          does this, we do not know. Because this one is <White>{rarityName}</White>, it works on
          planets up to level <White>{maxLevelBloomFilter}</White>. This artifact is consumed on
          activation. */}
        </Text>
      );
      break;

    case ArtifactType.IceLink:
      content = (
        <Text>
          <Text>
            When activated, source planet & target planet will be frozen.
          </Text>
          <Text>
            Because this one is <White>{rarityName}</White>, it can be activated
            on planets up to level <White>{maxLevelIceLink}</White>.
          </Text>

          <Text2>
            {" "}
            Source planet level must be {">="} target planet level.
          </Text2>

          <Text> Target planet must be owned by others.</Text>

          <Text2>
            You can choose to deactivate this artifact. However, ice link will
            disappear after deactivation.
          </Text2>
        </Text>
      );
      break;

    case ArtifactType.FireLink:
      content = (
        <Text>
          <Text>
            Activate on your own planet, can only connect to a planet where
            someone else has activated iceLink
          </Text>
          <Text>
            Because this one is <White>{rarityName}</White>, it can be activated
            on planets up to level <White>{maxLevelFireLink}</White>.
          </Text>
          <Text2>
            {" "}
            Source planet level must be {">="} target planet level.
          </Text2>

          <Text>
            The effect of a fire link activation is: cancel the effect of ice
            link activation.
          </Text>
          <Text2> Fire link will disappear after activation.</Text2>
        </Text>
      );
      break;

    case ArtifactType.Kardashev:
      content = (
        <Text>
          <div>
            <Green>INTRO: </Green> after activating Kardashev artifact then you
            can do kardashev operation on this planet to create blue circle.
          </div>

          <div>
            <Green>DEACTIVATION: </Green>This artifact will not disappear after
            deactivation.
          </div>
          <div>
            <Green>NOTE: </Green> When doing kardashev operation on this planet,
            the Kardashev artifact will disappear.
          </div>
        </Text>
      );
      break;

    case ArtifactType.Bomb:
      content = (
        <Text>
          <div>
            <Green>INTRO: </Green> after activating Bomb artifact then you can
            drop bomb on this planet to create pink circle.
          </div>

          <div>
            <Green>DEACTIVATION: </Green>This artifact will not disappear after
            deactivation.
          </div>

          <div>
            <Green>NOTE: </Green> When dropping bomb on this planet, the Bomb
            artifact will disappear.
          </div>
        </Text>
      );
      break;

    case ArtifactType.StellarShield:
      content = (
        <Text>
          <div>
            <Green>INTRO-1: </Green> If Stellar Shield is activated on the
            target planet, it can resist a photoid cannon&apos;s quick move
            attack.
          </div>
          <div>
            <Green>INTRO-2: </Green> When a planet is within the pink circle,
            activating this artifact on that planet prevents it from being
            pinked(destroyed).
          </div>
          <div>
            <Green>LEVEL: </Green> Because this one is{" "}
            <White>{rarityName}</White>, it can be activated on planets up to
            level <White>{maxLevelStellarShield}</White>.
          </div>
          <div>
            <Green>DEACTIVATION: </Green>This artifact will not disappear after
            deactivation.
          </div>

          {/* <Text>
                If stellar shield is activated on the target planet, it can resist a photoid cannon's
                quick move attack.
              </Text>

              <Text>
                Because this one is <White>{rarityName}</White>, it can be activated on planets up to
                level <White>{maxLevelStellarShield}</White>.
              </Text>
              <Text> Stellar Shield will not disappear after deactivation.</Text> */}
        </Text>
      );
      break;

    case ArtifactType.Avatar:
      content = (
        <Text>
          <div>
            <Green>INTRO: </Green> can choose to show different avatars on
            planet.
          </div>

          <div>
            <Green>DEACTIVATION: </Green>This artifact will not disappear after
            deactivation.
          </div>

          {/* <Text>
                  If stellar shield is activated on the target planet, it can resist a photoid cannon's
                  quick move attack.
                </Text>

                <Text>
                  Because this one is <White>{rarityName}</White>, it can be activated on planets up to
                  level <White>{maxLevelStellarShield}</White>.
                </Text>
                <Text> Stellar Shield will not disappear after deactivation.</Text> */}
        </Text>
      );
      break;
    case ArtifactType.ShipMothership:
      content = (
        <Text>
          Doubles energy regeneration of the planet that it is currently on.{" "}
          {genericSpaceshipDescription}
        </Text>
      );
      break;
    case ArtifactType.ShipCrescent:
      content = (
        <Text>
          Activate to convert an un-owned planet whose level is more than 0 into
          an Asteroid Field. <Red>Can only be used once.</Red>{" "}
          {genericSpaceshipDescription}
        </Text>
      );
      break;
    case ArtifactType.ShipGear:
      content = (
        <Text>
          Allows you to prospect planets, and subsequently find artifacts on
          them. {genericSpaceshipDescription}
        </Text>
      );
      break;
    case ArtifactType.ShipTitan:
      content = (
        <Text>
          Pauses energy and silver regeneration on the planet it&apos;s on.{" "}
          {genericSpaceshipDescription}
        </Text>
      );
      break;

    case ArtifactType.ShipPink:
      content = (
        <Text>
          Activate Pink Ship to drop a nuclear bomb. This nuclear bomb will put
          all planets in the pink circle area in danger.
          {genericSpaceshipDescription}
        </Text>
      );
      break;

    case ArtifactType.ShipWhale:
      content = (
        <Text>
          Doubles the silver regeneration of the planet that it is currently on.{" "}
          {genericSpaceshipDescription}
        </Text>
      );
      break;
  }

  if (content) {
    return (
      <div>
        {collapsable ? (
          <ReadMore height={"1.2em"} toggleButtonMargin={"0em"}>
            {content}
          </ReadMore>
        ) : (
          content
        )}
      </div>
    );
  }

  return null;
}
