import { EMPTY_ADDRESS } from "@df/constants";
import {
  address,
  artifactIdToDecStr,
  locationIdFromHexStr,
  locationIdToHexStr,
} from "@df/serde";
import type {
  Artifact,
  ArtifactId,
  ArtifactRarity,
  ArtifactStatus,
  ArtifactType,
  Biome,
  EthAddress,
  LocationId,
  Upgrade,
} from "@df/types";
import { getComponentValue } from "@latticexyz/recs";
import { encodeEntity } from "@latticexyz/store-sync/recs";
import type { ClientComponents } from "@mud/createClientComponents";
import type { ContractConstants } from "../../_types/darkforest/api/ContractsAPITypes";

interface ArtifactUtilsConfig {
  components: ClientComponents;
  contractConstants: ContractConstants;
}

export class ArtifactUtils {
  private components: ClientComponents;
  private contractConstants: ContractConstants;

  public constructor({ components, contractConstants }: ArtifactUtilsConfig) {
    this.components = components;
    this.contractConstants = contractConstants;
  }

  public getArtifactById(artifactId: ArtifactId): Artifact | undefined {
    const {
      Artifact,
      ArtifactOwner,
      PlanetOwner,
      PlanetConstants,
      PinkBombMetadata,
      BloomFilterMetadata,
      WormholeMetadata,
      CannonMetadata,
    } = this.components;

    const artifactEntity = encodeEntity(Artifact.metadata.keySchema, {
      id: Number(artifactIdToDecStr(artifactId)),
    });
    const artifactRec = getComponentValue(Artifact, artifactEntity);

    if (!artifactRec) {
      return undefined;
    }

    let planetId: LocationId = "0" as LocationId;
    let owner: EthAddress = EMPTY_ADDRESS;
    const artifactOwner = getComponentValue(ArtifactOwner, artifactEntity);

    if (artifactOwner) {
      planetId = locationIdFromHexStr(artifactOwner.planet.toString());

      const planetOwner = getComponentValue(
        PlanetOwner,
        encodeEntity(PlanetConstants.metadata.keySchema, {
          id: locationIdToHexStr(planetId) as `0x${string}`,
        }),
      );
      if (planetOwner) {
        owner = address(planetOwner.value);
      }
    }

    const metadata = getComponentValue(
      artifactRec.artifactIndex === 1
        ? PinkBombMetadata
        : artifactRec.artifactIndex === 4
          ? BloomFilterMetadata
          : artifactRec.artifactIndex === 5
            ? WormholeMetadata
            : CannonMetadata,
      encodeEntity(
        { rarity: "uint8" },
        {
          rarity: artifactRec.rarity,
        },
      ),
    );
    if (!metadata) {
      throw new Error(
        `artifact metadata not found, artifact index: ${artifactRec.artifactIndex}, rarity: ${artifactRec.rarity}`,
      );
    }

    return {
      isInititalized: true,
      imageType: 0,
      id: artifactId,
      planetDiscoveredOn: "0" as LocationId,
      rarity: artifactRec.rarity as ArtifactRarity,
      planetBiome: 0 as Biome,
      mintedAtTimestamp: 0,
      discoverer: EMPTY_ADDRESS,
      artifactType: this.getArtifactType(artifactRec.artifactIndex),
      controller: owner,
      currentOwner: owner,
      activations: 0,
      lastActivated: Number(artifactRec.activateTick),
      lastDeactivated: Number(artifactRec.cooldownTick),
      onPlanetId: planetId === "0" ? undefined : planetId,
      artifactIndex: artifactRec.artifactIndex,
      status: artifactRec.status as ArtifactStatus,
      chargeTick: Number(artifactRec.chargeTick),
      activateTick: Number(artifactRec.activateTick),
      cooldownTick: Number(artifactRec.cooldownTick),
      charge: metadata.charge,
      cooldown: metadata.cooldown,
      durable: metadata.durable,
      reusable: metadata.reusable,
      reqLevel: metadata.reqLevel,
      reqPopulation: metadata.reqPopulation,
      reqSilver: metadata.reqSilver,
    };
  }

  private getArtifactType(index: number): ArtifactType {
    if (index === 1) {
      // bomb
      return 13 as ArtifactType;
    } else if (index === 4) {
      // bloom filter
      return 8 as ArtifactType;
    } else if (index === 5) {
      // wormhole
      return 5 as ArtifactType;
    } else if (index === 6) {
      // photoid cannon
      return 7 as ArtifactType;
    }
    return 0 as ArtifactType;
  }
}
