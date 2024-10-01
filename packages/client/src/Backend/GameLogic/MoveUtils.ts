import type {
  EthAddress,
  LocationId,
  QueuedArrival,
  VoyageId,
  ArtifactId,
} from "@df/types";
import { ArrivalType } from "@df/types";
import type { ClientComponents } from "@mud/createClientComponents";
import { encodeEntity } from "@latticexyz/store-sync/recs";
import { getComponentValue } from "@latticexyz/recs";

interface MoveUtilsConfig {
  components: ClientComponents;
}

export class MoveUtils {
  private components: ClientComponents;

  public constructor({ components }: MoveUtilsConfig) {
    this.components = components;
  }

  public getArrivalsForPlanet(planetId: LocationId): QueuedArrival[] {
    const { Move, PendingMove } = this.components;
    const pendingMoveEntity = encodeEntity(PendingMove.metadata.keySchema, {
      to: planetId as `0x${string}`,
    });
    const pendingMove = getComponentValue(PendingMove, pendingMoveEntity);
    const indexes = Array(30).fill(0);
    if (pendingMove) {
      let indexesBigInt = pendingMove.indexes;
      for (let i = 29; i >= 0; i--) {
        indexes[i] = indexesBigInt % 256n;
        indexesBigInt = indexesBigInt / 256n;
      }
      const res: QueuedArrival[] = [];
      for (
        let i = pendingMove.head;
        i < pendingMove.head + pendingMove.number;
        i++
      ) {
        const moveEntity = encodeEntity(Move.metadata.keySchema, {
          to: planetId as `0x${string}`,
          index: indexes[i],
        });
        const move = getComponentValue(Move, moveEntity);
        if (!move) {
          throw new Error("Move not found");
        }
        res.push({
          eventId: move.id.toString() as VoyageId,
          player: move.captain as EthAddress,
          fromPlanet: move.from as LocationId,
          toPlanet: planetId,
          energyArriving: Number(move.population),
          silverMoved: Number(move.silver),
          artifactId:
            move.artifact === 0n
              ? undefined
              : (move.artifact.toString() as ArtifactId),
          departureTime: Number(move.departureTime),
          distance: 0, // TODO: calculate distance
          arrivalTime: Number(move.arrivalTime),
          arrivalType: ArrivalType.Normal,
          unionId: 0, // TODO: calculate unionId
          name: "", // TODO: calculate name
          leader: move.captain as EthAddress,
          level: 0, // TODO: calculate level
          members: [], // TODO: calculate members
          invitees: [], // TODO: calculate invitees
        });
      }
      return res;
    } else {
      return [];
    }
  }

  public getAllArrivals(
    planetsToLoad: LocationId[],
    onProgress?: (fractionCompleted: number) => void,
  ): QueuedArrival[] {
    const res: QueuedArrival[] = [];
    for (let i = 0; i < planetsToLoad.length; i++) {
      const planetId = planetsToLoad[i];
      res.push(...this.getArrivalsForPlanet(planetId));
      if (onProgress) {
        onProgress((i + 1) / planetsToLoad.length);
      }
    }
    return res;
  }
}
