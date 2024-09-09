import {
  buildContractCallArgs,
  type SnarkJSProofAndSignals,
  type WhitelistSnarkContractCallArgs,
  type WhitelistSnarkInput,
} from "../../Shared/snarks";
import whitelistCircuitPath from "../../Shared/snarks/whitelist.wasm";
import whitelistZkeyPath from "../../Shared/snarks/whitelist.zkey";
import type { EthAddress } from "../../Shared/types";
import bigInt, { type BigInteger } from "big-integer";
import { TerminalTextStyle } from "../../Frontend/Utils/TerminalTypes";
import type { TerminalHandle } from "../../Frontend/Views/Terminal";

/**
 * Helper method for generating whitelist SNARKS.
 * This is separate from the existing {@link SnarkArgsHelper}
 * because whitelist txs require far less setup compared
 * to SNARKS that are sent in context of the game.
 */
export const getWhitelistArgs = async (
  key: BigInteger,
  recipient: EthAddress,
  terminal?: React.MutableRefObject<TerminalHandle | undefined>,
): Promise<WhitelistSnarkContractCallArgs> => {
  try {
    const start = Date.now();
    terminal?.current?.println(
      "WHITELIST REGISTER: calculating witness and proof",
      TerminalTextStyle.Sub,
    );
    const input: WhitelistSnarkInput = {
      key: key.toString(),
      recipient: bigInt(recipient.substring(2), 16).toString(),
    };

    const fullProveResponse = await window.snarkjs.groth16.fullProve(
      input,
      whitelistCircuitPath,
      whitelistZkeyPath,
    );
    const { proof, publicSignals }: SnarkJSProofAndSignals = fullProveResponse;
    const ret = buildContractCallArgs(
      proof,
      publicSignals,
    ) as WhitelistSnarkContractCallArgs;
    const end = Date.now();
    terminal?.current?.println(
      `WHITELIST REGISTER: calculated witness and proof in ${end - start}ms`,
      TerminalTextStyle.Sub,
    );

    return ret;
  } catch (e) {
    throw e;
  }
};
