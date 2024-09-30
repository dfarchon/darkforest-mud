import type { LocationId, Planet } from "@df/types";
import type { ClientComponents } from "@mud/createClientComponents";
import bigInt, { BigInteger } from "big-integer";
import { LOCATION_ID_UB } from "@df/constants";

interface MoveUtilsConfig {
  components: ClientComponents;
}

export class MoveUtils {
  private components: ClientComponents;

  public constructor({ components }: MoveUtilsConfig) {
    this.components = components;
  }

  //TODO refer to the implementation logic of src/lib/Move.sol
}
