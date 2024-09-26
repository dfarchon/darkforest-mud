// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.21;

import { Script } from "forge-std/Script.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { stdJson } from "forge-std/StdJson.sol";

contract WorldAddressHelper is Script {
  using Strings for uint256;
  using stdJson for string;

  string private constant worldJSONPath = "./worlds.json";
  function getWorldAddress() public view returns (address) {
    string memory json = vm.readFile(worldJSONPath);
    return json.readAddress(string.concat(".", block.chainid.toString(), ".address"));
  }
}
