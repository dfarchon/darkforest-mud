import { PlanetUtils } from "@backend/GameLogic/PlanetUtils";
import { TickerUtils } from "@backend/GameLogic/TickerUtils";
import { isLocatable } from "@df/gamelogic";
import type { EthConnection } from "@df/network";
import type {
  ArtifactId,
  EthAddress,
  LocatablePlanet,
  LocationId,
  Planet,
  WorldLocation,
} from "@df/types";
import type { Biome, SpaceType } from "@df/types";
import type { ClientComponents } from "@mud/createClientComponents";

import type { ContractConstants } from "../../_types/darkforest/api/ContractsAPITypes";
import type { AddressTwitterMap } from "../../_types/darkforest/api/UtilityServerAPITypes";
import { arrive, updatePlanetToTick } from "../GameLogic/ArrivalUtils";
import type { ContractsAPI } from "../GameLogic/ContractsAPI";
import { makeContractsAPI } from "../GameLogic/ContractsAPI";
import { getAllTwitters } from "../Network/UtilityServerAPI";
import PersistentChunkStore from "./PersistentChunkStore";

export const enum SinglePlanetDataStoreEvent {
  REFRESHED_PLANET = "REFRESHED_PLANET",
  REFRESHED_ARTIFACT = "REFRESHED_ARTIFACT",
}

interface ReaderDataStoreConfig {
  contractAddress: EthAddress;
  viewer: EthAddress | undefined;
  addressTwitterMap: AddressTwitterMap;
  contractConstants: ContractConstants;
  contractsAPI: ContractsAPI;
  persistentChunkStore: PersistentChunkStore | undefined;
  components: ClientComponents;
}

/**
 * A data store that allows you to retrieve data from the contract,
 * and combine it with data that is stored in this browser about a
 * particular user.
 */
class ReaderDataStore {
  private readonly viewer: EthAddress | undefined;
  private readonly addressTwitterMap: AddressTwitterMap;
  private readonly contractConstants: ContractConstants;
  private readonly contractsAPI: ContractsAPI;
  private readonly persistentChunkStore: PersistentChunkStore | undefined;
  private planetUtils: PlanetUtils;
  private tickerUtils: TickerUtils;

  private constructor({
    viewer,
    addressTwitterMap,
    contractConstants,
    contractsAPI,
    persistentChunkStore,
    components,
  }: ReaderDataStoreConfig) {
    this.viewer = viewer;
    this.addressTwitterMap = addressTwitterMap;
    this.contractConstants = contractConstants;
    this.contractsAPI = contractsAPI;
    this.persistentChunkStore = persistentChunkStore;
    this.planetUtils = new PlanetUtils({
      components: components,
      contractConstants: this.contractsAPI.getConstants(),
    });
    this.tickerUtils = new TickerUtils({ components });
  }

  public destroy(): void {
    this.contractsAPI.destroy();
    this.persistentChunkStore?.destroy();
  }

  public static async create({
    connection,
    viewer,
    contractAddress,
    components,
  }: {
    connection: EthConnection;
    viewer: EthAddress | undefined;
    contractAddress: EthAddress;
    components: ClientComponents;
  }): Promise<ReaderDataStore> {
    const contractsAPI = await makeContractsAPI({
      connection,
      contractAddress,
      components,
    });
    const addressTwitterMap = await getAllTwitters();
    const contractConstants = await contractsAPI.getConstants();
    const persistentChunkStore =
      viewer &&
      (await PersistentChunkStore.create({ account: viewer, contractAddress }));

    const singlePlanetStore = new ReaderDataStore({
      contractAddress,
      viewer,
      addressTwitterMap,
      contractConstants,
      contractsAPI,
      persistentChunkStore,
      components,
    });

    return singlePlanetStore;
  }

  public getViewer(): EthAddress | undefined {
    return this.viewer;
  }

  public getTwitter(owner: EthAddress | undefined): string | undefined {
    if (owner) {
      return this.addressTwitterMap[owner];
    }
  }

  private setPlanetLocationIfKnown(planet: Planet): void {
    let planetLocation = undefined;

    if (planet && isLocatable(planet)) {
      // clear the location of the LocatablePlanet, turning it back into a planet
      /* eslint-disable @typescript-eslint/no-unused-vars */
      const { location, biome, ...nonLocatable } = planet;
      /* eslint-enable @typescript-eslint/no-unused-vars */
      planet = nonLocatable;
    }

    if (this.persistentChunkStore) {
      for (const chunk of this.persistentChunkStore.allChunks()) {
        for (const loc of chunk.planetLocations) {
          if (loc.hash === planet.locationId) {
            planetLocation = loc;
            break;
          }
        }
        if (planetLocation) {
          break;
        }
      }
    }

    if (planetLocation && planet) {
      (planet as LocatablePlanet).location = planetLocation;
      (planet as LocatablePlanet).biome = this.getBiome(planetLocation);
    }
  }

  public async loadPlanetFromContract(
    planetId: LocationId,
  ): Promise<Planet | LocatablePlanet> {
    const planet = this.contractsAPI.getPlanetById(planetId);
    const contractConstants = this.contractsAPI.getConstants();

    if (!planet) {
      throw new Error(`unable to load planet with id ${planetId}`);
    }

    const arrivals = this.contractsAPI.getArrivalsForPlanet(planetId);

    arrivals.sort((a, b) => a.arrivalTick - b.arrivalTick);

    const currentTick = this.tickerUtils.getCurrentTick();

    for (const arrival of arrivals) {
      if (currentTick < arrival.arrivalTick) {
        break;
      }
      arrive(planet, [], arrival, undefined, contractConstants);
    }

    updatePlanetToTick(planet, [], currentTick, contractConstants);
    this.setPlanetLocationIfKnown(planet);

    return planet;
  }

  // public async loadArtifactFromContract(artifactId: ArtifactId) {
  //   const artifact = await this.contractsAPI.getArtifactById(artifactId);
  //   if (!artifact) {
  //     throw new Error(`unable to load artifact with id ${artifactId}`);
  //   }
  //   return artifact;
  // }
  // copied from GameEntityMemoryStore. needed to determine biome if we know planet location

  public spaceTypeFromPerlin(
    perlin: number,
    distFromOrigin: number,
  ): SpaceType {
    const distSquare = distFromOrigin ** 2;
    const universeZone = this.planetUtils._initZone(distSquare);

    const spaceType = this.planetUtils._initSpaceType(universeZone, perlin);
    return spaceType;
  }

  // copied from GameEntityMemoryStore. needed to determine biome if we know planet location
  private getBiome(loc: WorldLocation): Biome {
    return this.planetUtils.getBiome(loc);
  }
}

export default ReaderDataStore;
