import { EMPTY_ADDRESS } from "@df/constants";
import {
  formatNumber,
  getRange,
  hasOwner,
  isLocatable,
  isSpaceShip,
} from "@df/gamelogic";
import {
  artifactImageTypeToNum,
  avatarTypeToNum,
  getOwnerColorVec,
  getPlanetCosmetic,
  isAvatar,
  isLogo,
  isMeme,
  logoTypeToNum,
  memeTypeToNum,
} from "@df/procedural";
import { isUnconfirmedMoveTx } from "@df/serde";
import type {
  Artifact,
  AvatarType,
  LocatablePlanet,
  LocationId,
  MemeType,
  Planet,
  PlanetRenderInfo,
  PlanetRenderManagerType,
  WorldCoords,
} from "@df/types";
import {
  ArtifactType,
  HatType,
  LogoType,
  PlanetType,
  RendererType,
  TextAlign,
  TextAnchor,
} from "@df/types";

import { avatars } from "../Avatars";
import { engineConsts } from "../EngineConsts";
import { logos } from "../Logos";
import { memes } from "../Memes";
import type { Renderer } from "../Renderer";
import type { GameGLManager } from "../WebGL/GameGLManager";

const { whiteA, barbsA, gold } = engineConsts.colors;
const { maxRadius } = engineConsts.planet;

/**
 * this guy is always going to call things in worldcoords, we'll convert them
 * to CanvasCoords. responsible for rendering planets by calling primitive renderers
 */
export class PlanetRenderManager implements PlanetRenderManagerType {
  renderer: Renderer;

  rendererType = RendererType.PlanetManager;

  HTMLImages: Record<number, HTMLImageElement> = {};
  constructor(gl: GameGLManager) {
    this.renderer = gl.renderer;
    this.loadHTMLImages();
    // this.loadNewHats();
  }

  loadHTMLImages(): void {
    const memeKeys = Object.keys(memes);
    const logoKeys = Object.keys(logos);
    const avatarKeys = Object.keys(avatars);

    {
      //set default image
      const img = new Image();
      img.src = logos[LogoType.DFARES].topLayer[0];

      img.onload = () => {
        this.HTMLImages[0] = img;
      };
    }

    for (let i = 0; i < memeKeys.length; ++i) {
      const memeKey = memeKeys[i];
      const meme = memes[Number(memeKey) as MemeType];
      const num = memeTypeToNum(Number(memeKey) as MemeType);

      const img = new Image();
      img.src = meme.topLayer[0];
      img.onload = () => {
        this.HTMLImages[num] = img;
      };
    }

    for (let i = 0; i < logoKeys.length; ++i) {
      const logoKey = logoKeys[i];
      const logo = logos[Number(logoKey) as LogoType];
      const num = logoTypeToNum(Number(logoKey) as LogoType);

      const img = new Image();
      img.src = logo.topLayer[0];
      img.onload = () => {
        this.HTMLImages[num] = img;
      };
    }

    for (let i = 0; i < avatarKeys.length; ++i) {
      const avatarKey = avatarKeys[i];
      const avatar = avatars[Number(avatarKey) as AvatarType];
      const num = avatarTypeToNum(Number(avatarKey) as AvatarType);
      const img = new Image();
      img.src = avatar.topLayer[0];
      img.onload = () => {
        this.HTMLImages[num] = img;
      };
    }
  }
  // loadNewHats(): void {
  //   const keys = Object.keys(hats);
  //   // for (let i = 0; i < keys.length; ++i) {
  //   //   const key = keys[i];
  //   //   const hat = hats[key as HatType];
  //   //   hat.image &&
  //   //     hat.image().then((img) => {
  //   //       this.newHats[key as HatType] = img;
  //   //     });
  //   // }

  //   for (let i = 0; i < keys.length; ++i) {
  //     const key = keys[i];

  //     const hat = hats[Number(key) as HatType];
  //     if (!hat.legacy) {
  //       const img = new Image();
  //       img.src = hat.topLayer[0];
  //       img.onload = () => {
  //         this.newHats[Number(key) as HatType] = img;
  //       };
  //     }
  //   }
  // }

  queueLocation(
    renderInfo: PlanetRenderInfo,
    now: number,
    highPerfMode: boolean,
    disableEmojis: boolean,
    disableHats: boolean,
  ): void {
    const { context: uiManager, circleRenderer: cR } = this.renderer;
    const planet = renderInfo.planet;
    const renderAtReducedQuality =
      renderInfo.radii.radiusPixels <= 5 && highPerfMode;
    const isHovering =
      uiManager.getHoveringOverPlanet()?.locationId === planet.locationId;
    const isSelected =
      uiManager.getSelectedPlanet()?.locationId === planet.locationId;

    let textAlpha = 255;
    if (renderInfo.radii.radiusPixels < 2 * maxRadius) {
      // text alpha scales a bit faster
      textAlpha *= renderInfo.radii.radiusPixels / (2 * maxRadius);
    }

    const artifacts = uiManager
      .getArtifactsWithIds(planet.heldArtifactIds)
      .filter((a) => !!a) as Artifact[];
    const color = uiManager.isOwnedByMe(planet)
      ? whiteA
      : getOwnerColorVec(planet);

    // draw planet body
    this.queuePlanetBody(
      planet,
      planet.location.coords,
      renderInfo.radii.radiusWorld,
    );
    this.queueAsteroids(
      planet,
      planet.location.coords,
      renderInfo.radii.radiusWorld,
    );
    this.queueArtifactsAroundPlanet(
      planet,
      artifacts,
      planet.location.coords,
      renderInfo.radii.radiusWorld,
      now,
      textAlpha,
    );

    this.queueRings(
      planet,
      planet.location.coords,
      renderInfo.radii.radiusWorld,
    );

    // render black domain
    if (planet.destroyed) {
      this.queueBlackDomain(
        planet,
        planet.location.coords,
        renderInfo.radii.radiusWorld,
      );

      return;
    }

    // draw hp bar
    let cA = 1.0; // circle alpha
    if (renderInfo.radii.radiusPixels < 2 * maxRadius) {
      cA *= renderInfo.radii.radiusPixels / (2 * maxRadius);
    }

    if (hasOwner(planet)) {
      color[3] = cA * 120;

      cR.queueCircleWorld(
        planet.location.coords,
        renderInfo.radii.radiusWorld * 1.1,
        color,
        0.5,
      );
      const pct = planet.energy / planet.energyCap;
      color[3] = cA * 255;
      cR.queueCircleWorld(
        planet.location.coords,
        renderInfo.radii.radiusWorld * 1.1,
        color,
        2,
        pct,
      );
    }

    if (!disableHats && planet.canShow) {
      const activatedAvatar = artifacts.find(
        (a) =>
          a.artifactType === ArtifactType.Avatar &&
          a.lastActivated > a.lastDeactivated,
      );

      //MyTodo: change the limit for logoHat & memeHat

      if (activatedAvatar) {
        // artifact image
        this.queueArtifactImage(
          planet.location.coords,
          renderInfo.radii.radiusWorld * 2,
          activatedAvatar,
        );
      } else if (isMeme(planet.hatType)) {
        this.queueMemeImage(
          planet.location.coords,
          renderInfo.radii.radiusWorld * 2,
          planet.hatType as HatType,
          planet.hatLevel as number,
        );
      } else if (isLogo(planet.hatType)) {
        this.queueLogoImage(
          planet.location.coords,
          renderInfo.radii.radiusWorld * 2,
          planet.hatType as number,
          planet.hatLevel as number,
          planet.adminProtect as boolean,
        );
      } else if (isAvatar(planet.hatType)) {
        this.queueAvatarImage(
          planet.location.coords,
          renderInfo.radii.radiusWorld * 2,
          planet.hatType as HatType,
          planet.hatLevel as number,
        );
      } else {
        // normal hat
        this.queueHat(
          planet,
          planet.location.coords,
          renderInfo.radii.radiusWorld,
          planet.hatType,
          planet.hatLevel,
        );
      }
    }

    /* draw text */
    if (!renderAtReducedQuality) {
      this.queuePlanetEnergyText(
        planet,
        planet.location.coords,
        renderInfo.radii.radiusWorld,
        textAlpha,
      );

      this.queuePlanetSilverText(
        planet,
        planet.location.coords,
        renderInfo.radii.radiusWorld,
        textAlpha,
      );

      this.queueArtifactIcon(
        planet,
        planet.location.coords,
        renderInfo.radii.radiusWorld,
      );

      if (!disableEmojis) {
        this.drawPlanetMessages(
          renderInfo,
          planet.location.coords,
          renderInfo.radii.radiusWorld,
          isHovering ? 0.2 : textAlpha,
        );
      }
    }

    if (isHovering && !isSelected && !planet.frozen) {
      this.queueRangeRings(planet);
    }

    //render Ice Link
    if (planet.frozen) {
      this.queueBlackDomain(
        planet,
        planet.location.coords,
        renderInfo.radii.radiusWorld,
      );
    }
  }

  private queueArtifactsAroundPlanet(
    planet: Planet,
    artifacts: Artifact[],
    centerW: WorldCoords,
    radiusW: number,
    now: number,
    alpha: number,
  ) {
    const numArtifacts = artifacts.length;

    const MS_PER_ROTATION = 10 * 1000 * (planet.planetLevel + 1);
    const anglePerArtifact = (Math.PI * 2) / numArtifacts;
    const startingAngle = 0 - Math.PI / 2;
    const nowAngle = (Math.PI * 2 * (now % MS_PER_ROTATION)) / MS_PER_ROTATION;
    const artifactSize = 0.67 * radiusW;
    const distanceRadiusScale = 1.5;
    const distanceFromCenterOfPlanet =
      radiusW * distanceRadiusScale + artifactSize;

    for (let i = 0; i < artifacts.length; i++) {
      const x =
        Math.cos(anglePerArtifact * i + startingAngle + nowAngle) *
          distanceFromCenterOfPlanet +
        centerW.x;
      const y =
        Math.sin(anglePerArtifact * i + startingAngle + nowAngle) *
          distanceFromCenterOfPlanet +
        centerW.y;
      if (
        artifacts[i].artifactType === ArtifactType.Avatar
        // && artifacts[i].lastActivated <= artifacts[i].lastDeactivated
      ) {
        //draw special hat
        const avatarType = artifactImageTypeToNum(artifacts[i].imageType);

        this.HTMLImages[avatarType] &&
          this.renderer.overlay2dRenderer.drawHTMLImage(
            this.HTMLImages[avatarType],
            { x, y },
            artifactSize * 1.2,
            artifactSize * 1.2,
            radiusW,
            false,
          );
      } else if (artifacts[i].artifactType !== ArtifactType.Avatar) {
        this.renderer.spriteRenderer.queueArtifactWorld(
          artifacts[i],
          { x, y },
          artifactSize,
          alpha,
          undefined,
          undefined,
          undefined,
          this.renderer.getViewport(),
        );
      }
    }
  }

  private drawPlanetMessages(
    renderInfo: PlanetRenderInfo,
    coords: WorldCoords,
    radiusW: number,
    textAlpha: number,
  ) {
    if (!renderInfo.planet.messages) {
      return;
    }
    const { overlay2dRenderer: cM } = this.renderer;
    cM.drawPlanetMessages(coords, radiusW, renderInfo, textAlpha);
  }

  private queueArtifactIcon(
    planet: Planet,
    { x, y }: WorldCoords,
    radius: number,
  ) {
    const { overlay2dRenderer: cM } = this.renderer;

    if (!isLocatable(planet)) {
      return;
    }
    const mineable = planet.planetType === PlanetType.RUINS;

    const iconLoc = { x: x - radius, y: y + radius };

    if (mineable && !planet.hasTriedFindingArtifact) {
      const viewport = this.renderer.getViewport();
      const screenRadius = viewport.worldToCanvasDist(radius);
      const scale = Math.min(1, screenRadius / 20);
      if (screenRadius > 4) {
        cM.drawArtifactIcon(iconLoc, scale);
      }
    }
  }

  private queuePlanetSilverText(
    planet: Planet,
    center: WorldCoords,
    radius: number,
    alpha: number,
  ) {
    const { textRenderer: tR } = this.renderer;
    const silver = planet ? Math.ceil(planet.silver) : 0;
    if (planet.silverGrowth > 0 || planet.silver > 0) {
      tR.queueTextWorld(
        formatNumber(silver),
        { x: center.x, y: center.y + 1.1 * radius + 0.75 },
        [...gold, alpha],
        0,
        TextAlign.Center,
        TextAnchor.Bottom,
      );
    }
  }

  // calculates energy in that is queued to leave planet
  private getLockedEnergy(planet: Planet): number {
    let lockedEnergy = 0;
    for (const unconfirmedMove of planet.transactions?.getTransactions(
      isUnconfirmedMoveTx,
    ) ?? []) {
      lockedEnergy += unconfirmedMove.intent.forces;
    }

    return lockedEnergy;
  }

  // calculates attack value of mouse-drag action
  private getMouseAtk(): number | undefined {
    const { context } = this.renderer;

    const fromPlanet = context.getMouseDownPlanet();
    const toPlanet = context.getHoveringOverPlanet();

    if (!fromPlanet || !toPlanet) {
      return undefined;
    }

    let effectiveEnergy = fromPlanet.energy;
    for (const unconfirmedMove of fromPlanet.transactions?.getTransactions(
      isUnconfirmedMoveTx,
    ) ?? []) {
      effectiveEnergy -= unconfirmedMove.intent.forces;
    }
    const shipsMoved =
      (context.getForcesSending(fromPlanet.locationId) / 100) * effectiveEnergy;

    const myAtk: number = context.getEnergyArrivingForMove(
      fromPlanet.locationId,
      toPlanet.locationId,
      undefined,
      shipsMoved,
    );

    return myAtk;
  }

  private queueRings(planet: Planet, center: WorldCoords, radius: number) {
    const { ringRenderer } = this.renderer;
    let idx = 0;

    const { defense, range, speed } = engineConsts.colors.belt;

    for (let i = 0; i < planet.upgradeState[0]; i++) {
      ringRenderer.queueRingAtIdx(planet, center, radius, defense, idx++);
    }
    for (let i = 0; i < planet.upgradeState[1]; i++) {
      ringRenderer.queueRingAtIdx(planet, center, radius, range, idx++);
    }
    for (let i = 0; i < planet.upgradeState[2]; i++) {
      ringRenderer.queueRingAtIdx(planet, center, radius, speed, idx++);
    }
  }

  private queuePlanetBody(
    planet: Planet,
    centerW: WorldCoords,
    radiusW: number,
  ) {
    const {
      quasarRenderer: qR,
      planetRenderer: pR,
      spacetimeRipRenderer: sR,
      ruinsRenderer: rR,
      mineRenderer: mR,
    } = this.renderer;

    const { planetType } = planet;

    if (planetType === PlanetType.SILVER_MINE) {
      mR.queueMine(planet, centerW, radiusW);
    } else if (planetType === PlanetType.TRADING_POST) {
      sR.queueRip(planet, centerW, radiusW);
    } else if (planetType === PlanetType.SILVER_BANK) {
      qR.queueQuasar(planet, centerW, radiusW);
    } else if (planetType === PlanetType.RUINS) {
      rR.queueRuins(planet, centerW, radiusW);
    } else {
      pR.queuePlanetBody(planet, centerW, radiusW);
    }
  }

  private queueBlackDomain(
    planet: Planet,
    center: WorldCoords,
    radius: number,
  ) {
    // @ts-expect-error - Remove circleRenderer if not needed later one
    const { blackDomainRenderer: bR, circleRenderer: cR } = this.renderer;

    bR.queueBlackDomain(planet, center, radius);

    // cR.queueCircleWorld(center, radius * 1.2, [255, 192, 203, 160]);
  }

  private queueAsteroids(planet: Planet, center: WorldCoords, radius: number) {
    const { asteroidRenderer: aR } = this.renderer;

    const { bonus } = engineConsts.colors;

    if (planet.bonus[0]) {
      aR.queueAsteroid(planet, center, radius, bonus.energyCap);
    }
    if (planet.bonus[1]) {
      aR.queueAsteroid(planet, center, radius, bonus.energyGro);
    }
    if (planet.bonus[2]) {
      aR.queueAsteroid(planet, center, radius, bonus.range);
    }
    if (planet.bonus[3]) {
      aR.queueAsteroid(planet, center, radius, bonus.speed);
    }
    if (planet.bonus[4]) {
      aR.queueAsteroid(planet, center, radius, bonus.defense);
    }
    if (planet.bonus[5]) {
      aR.queueAsteroid(planet, center, radius, bonus.spaceJunk);
    }
  }

  queueHat(
    planet: Planet,
    center: WorldCoords,
    radius: number,
    hatType: number,
    hatLevel: number,
  ) {
    const { context } = this.renderer;
    const hoveringPlanet = context.getHoveringOverPlanet() !== undefined;
    const myRotation = 0;
    const cosmetic = getPlanetCosmetic(planet);

    //MyTodo: determine the size limit
    hatLevel = Math.min(hatLevel, 3);

    if (hatLevel > 0) {
      const hoverCoords = context.getHoveringOverCoords();

      let bg = cosmetic.bgStr;
      let base = cosmetic.baseStr;
      if (cosmetic.hatType === HatType.SantaHat) {
        bg = "red";
        base = "white";
      }

      const hatScale = 1.65 ** (hatLevel - 1);
      this.renderer.overlay2dRenderer.drawHat(
        hatType as number, // cosmetic.hatType,
        512,
        512,
        center,
        1.2 * radius * hatScale,
        1.2 * radius * hatScale,
        radius,
        myRotation,
        hoveringPlanet,
        bg,
        base,
        hoverCoords,
      );
    }
  }

  queueArtifactImage(center: WorldCoords, radius: number, artifact?: Artifact) {
    if (!artifact) {
      return;
    }
    const { context } = this.renderer;
    const hoveringPlanet = context.getHoveringOverPlanet() !== undefined;
    const hoverCoords = context.getHoveringOverCoords();

    // const avatarType = avatarFromArtifactIdAndImageType(artifact.id,
    // artifact.imageType, false);

    const imageType = artifactImageTypeToNum(artifact.imageType);

    //NOTE: artifact image

    const hatScale = 1;

    this.HTMLImages[imageType] &&
      this.renderer.overlay2dRenderer.drawHTMLImage(
        this.HTMLImages[imageType],
        center,
        // radius === 1 ? 2 : 1.2 * 1.3 ** (artifact.rarity - 1) * radius,
        // radius === 1 ? 2 : 1.2 * 1.3 ** (artifact.rarity - 1) * radius,
        // radius === 1 ? 1.5 : 1.3 ** (artifact.rarity - 1) * radius,
        radius * hatScale,
        radius * hatScale,
        radius * hatScale,
        hoveringPlanet,
        hoverCoords,
      );
  }

  queueMemeImage(
    center: WorldCoords,
    radius: number,
    hatType: HatType,
    hatLevel: number,
  ) {
    if (isMeme(hatType) === false) {
      return;
    }

    // MyTodo: determine the size limit
    hatLevel = Math.min(hatLevel, 1);

    const { context } = this.renderer;
    const hoveringPlanet = context.getHoveringOverPlanet() !== undefined;
    const hoverCoords = context.getHoveringOverCoords();
    const hatScale = 1.65 ** (hatLevel - 1);

    this.HTMLImages[hatType] &&
      this.renderer.overlay2dRenderer.drawHTMLImage(
        this.HTMLImages[hatType],
        center,
        // 1.2 * radius * hatScale,
        // 1.2 * radius * hatScale,
        radius * hatScale,
        radius * hatScale,
        radius,
        hoveringPlanet,
        hoverCoords,
      );
  }

  queueLogoImage(
    center: WorldCoords,
    radius: number,
    hatType: number,
    hatLevel: number,
    ifAdminSet: boolean,
  ) {
    if (isLogo(hatType) === false) {
      return;
    }

    //MyTodo: determine the size limit
    if (ifAdminSet === false) {
      hatLevel = Math.min(hatLevel, 1);
    }

    const { context } = this.renderer;
    const hoveringPlanet = context.getHoveringOverPlanet() !== undefined;
    const hoverCoords = context.getHoveringOverCoords();
    const hatScale = 1.65 ** (hatLevel - 1);

    this.HTMLImages[hatType] &&
      this.renderer.overlay2dRenderer.drawHTMLImage(
        this.HTMLImages[hatType],
        center,
        radius * hatScale,
        radius * hatScale,
        radius,
        hoveringPlanet,
        hoverCoords,
      );
  }

  queueAvatarImage(
    center: WorldCoords,
    radius: number,
    hatType: number,
    hatLevel: number,
  ) {
    if (isAvatar(hatType) === false) {
      return;
    }

    //MyTodo: determine the size limit
    hatLevel = Math.min(hatLevel, 1);

    const { context } = this.renderer;
    const hoveringPlanet = context.getHoveringOverPlanet() !== undefined;
    const hoverCoords = context.getHoveringOverCoords();
    const hatScale = 1.65 ** (hatLevel - 1);

    this.HTMLImages[hatType] &&
      this.renderer.overlay2dRenderer.drawHTMLImage(
        this.HTMLImages[hatType],
        center,
        // 1.2 * radius * hatScale,
        // 1.2 * radius * hatScale,
        radius * hatScale,
        radius * hatScale,
        radius,
        hoveringPlanet,
        hoverCoords,
      );
  }

  private queuePlanetEnergyText(
    planet: Planet,
    center: WorldCoords,
    radius: number,
    alpha: number,
  ) {
    const { context: uiManager, textRenderer: tR } = this.renderer;
    const energy = planet ? Math.ceil(planet.energy) : 0;
    const lockedEnergy = this.getLockedEnergy(planet);

    // construct base energy string
    let energyString = energy <= 0 ? "" : formatNumber(energy);
    if (lockedEnergy > 0) {
      energyString += ` (-${formatNumber(lockedEnergy)})`;
    }

    const playerColor = hasOwner(planet) ? getOwnerColorVec(planet) : barbsA;
    const color = uiManager.isOwnedByMe(planet) ? whiteA : playerColor;
    color[3] = alpha;

    const textLoc: WorldCoords = {
      x: center.x,
      y: center.y - 1.1 * radius - 0.75,
    };

    tR.queueTextWorld(energyString, textLoc, color);

    // now display atk string
    const fromPlanet = uiManager.getMouseDownPlanet();
    const toPlanet = uiManager.getHoveringOverPlanet();

    const myAtk = this.getMouseAtk();

    const moveHereInProgress =
      myAtk &&
      fromPlanet?.locationId !== toPlanet?.locationId &&
      toPlanet?.locationId === planet.locationId &&
      !uiManager.getIsChoosingTargetPlanet();

    if (moveHereInProgress && myAtk && toPlanet) {
      let atkString = "";
      if (
        uiManager.isOwnedByMe(planet) ||
        // uiManager.isOwnedByPlayerInMyUnion(planet) ||
        planet.energy === 0
      ) {
        atkString += ` (+${formatNumber(myAtk)})`;
      } else {
        atkString += ` (-${formatNumber((myAtk * 100) / toPlanet.defense)})`;
      }

      tR.queueTextWorld(atkString, textLoc, color, 1);
      // if (planet.spaceJunk !== 0) {
      //   const spaceJunkString = `(+${planet.spaceJunk} junk)`;
      //   tR.queueTextWorld(
      //     spaceJunkString,
      //     { x: center.x, y: center.y - 1.1 * radius - 0.75 },
      //     color,
      //     2
      //   );
      // }
    }
  }

  /**
   * Renders rings around planet that show how far sending the given percentage of this planet's
   * energy would be able to travel.
   */
  drawRangeAtPercent(planet: LocatablePlanet, pct: number) {
    const { circleRenderer: cR, textRenderer: tR } = this.renderer;
    const range = getRange(planet, pct);
    const {
      range: { dash },
    } = engineConsts.colors;
    cR.queueCircleWorld(
      planet.location.coords,
      range,
      [...dash, 255],
      1,
      1,
      true,
    );
    tR.queueTextWorld(
      `${pct}%`,
      { x: planet.location.coords.x, y: planet.location.coords.y + range },
      [...dash, 255],
    );
  }

  /**
   * Renders three rings around the planet that show the player how far this planet can attack.
   */
  queueRangeRings(planet: LocatablePlanet) {
    const { circleRenderer: cR, context, textRenderer: tR } = this.renderer;
    const {
      range: { energy },
    } = engineConsts.colors;
    const { x, y } = planet.location.coords;
    const sendingArtifact = this.renderer.context.getArtifactSending(
      planet.locationId,
    );
    const sendingSpaceShip = isSpaceShip(sendingArtifact?.artifactType);

    if (sendingSpaceShip) {
      return;
    }

    const abandonRangeBoost =
      this.renderer.context.getAbandonRangeChangePercent() / 100;

    if (!context.isAbandoning()) {
      this.drawRangeAtPercent(planet, 100);
      this.drawRangeAtPercent(planet, 50);
      this.drawRangeAtPercent(planet, 25);
    }

    if (planet.owner === EMPTY_ADDRESS) {
      return;
    }

    const percentForces = context.getForcesSending(planet.locationId); // [0, 100]
    const forces = (percentForces / 100) * planet.energy;
    const scaledForces = (percentForces * planet.energy) / planet.energyCap;
    const range = getRange(
      planet,
      scaledForces,
      context.isAbandoning() ? abandonRangeBoost : 1,
    );

    if (range > 1) {
      cR.queueCircleWorld({ x, y }, range, [...energy, 255], 1, 1, true);

      tR.queueTextWorld(
        `${formatNumber(forces)}`,
        { x, y: y + range },
        [...energy, 255],
        0,
        TextAlign.Center,
        TextAnchor.Bottom,
      );
    }

    // so that it draws below the planets
    cR.flush();
  }

  queuePlanets(
    cachedPlanets: Map<LocationId, PlanetRenderInfo>,
    now: number,
    highPerfMode: boolean,
    disableEmojis: boolean,
    disableHats: boolean,
  ): void {
    for (const entry of cachedPlanets.entries()) {
      this.queueLocation(
        entry[1],
        now,
        highPerfMode,
        disableEmojis,
        disableHats,
      );
    }
  }

  flush() {
    const {
      planetRenderer,
      asteroidRenderer,
      beltRenderer,
      mineRenderer,
      quasarRenderer,
      spacetimeRipRenderer,
      ruinsRenderer,
      ringRenderer,
      blackDomainRenderer,
      glManager: { gl },
    } = this.renderer;

    // we use depth testing here because it's super speedy for GPU sorting
    gl.enable(gl.DEPTH_TEST);
    planetRenderer.flush();
    asteroidRenderer.flush();
    beltRenderer.flush();
    mineRenderer.flush();
    spacetimeRipRenderer.flush();
    ruinsRenderer.flush();
    ringRenderer.flush();
    gl.disable(gl.DEPTH_TEST);

    quasarRenderer.flush();
    blackDomainRenderer.flush();
  }
}
