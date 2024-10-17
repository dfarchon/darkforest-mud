// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { EffectType } from "../../../codegen/common.sol";
import { EffectLib } from "../../../lib/Effect.sol";

uint8 constant ARTIFACT_INDEX = 6;

uint8 constant COMMON_CHARGE_ID = 0;
uint8 constant RARE_CHARGE_ID = 1;
uint8 constant EPIC_CHARGE_ID = 2;
uint8 constant LEGENDARY_CHARGE_ID = 3;
uint8 constant MYTHIC_CHARGE_ID = 4;

uint8 constant COMMON_ACTIVATE_ID = 5;
uint8 constant RARE_ACTIVATE_ID = 6;
uint8 constant EPIC_ACTIVATE_ID = 7;
uint8 constant LEGENDARY_ACTIVATE_ID = 8;
uint8 constant MYTHIC_ACTIVATE_ID = 9;

uint8 constant COMMON_ACTIVATE_AFTER_MOVE_ID = 10;
uint8 constant RARE_ACTIVATE_AFTER_MOVE_ID = 11;
uint8 constant EPIC_ACTIVATE_AFTER_MOVE_ID = 12;
uint8 constant LEGENDARY_ACTIVATE_AFTER_MOVE_ID = 13;
uint8 constant MYTHIC_ACTIVATE_AFTER_MOVE_ID = 14;

uint24 constant COMMON_CHARGE = 0x06_01_00;
uint24 constant RARE_CHARGE = 0x06_01_01;
uint24 constant EPIC_CHARGE = 0x06_01_02;
uint24 constant LEGENDARY_CHARGE = 0x06_01_03;
uint24 constant MYTHIC_CHARGE = 0x06_01_04;

uint24 constant COMMON_ACTIVATE = 0x06_01_05;
uint24 constant RARE_ACTIVATE = 0x06_01_06;
uint24 constant EPIC_ACTIVATE = 0x06_01_07;
uint24 constant LEGENDARY_ACTIVATE = 0x06_01_08;
uint24 constant MYTHIC_ACTIVATE = 0x06_01_09;

uint24 constant COMMON_ACTIVATE_AFTER_MOVE = 0x06_01_0A;
uint24 constant RARE_ACTIVATE_AFTER_MOVE = 0x06_01_0B;
uint24 constant EPIC_ACTIVATE_AFTER_MOVE = 0x06_01_0C;
uint24 constant LEGENDARY_ACTIVATE_AFTER_MOVE = 0x06_01_0D;
uint24 constant MYTHIC_ACTIVATE_AFTER_MOVE = 0x06_01_0E;
