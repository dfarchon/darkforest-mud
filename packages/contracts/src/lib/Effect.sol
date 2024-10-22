// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.24;

import { ResourceId } from "@latticexyz/store/src/ResourceId.sol";
import { Planet } from "./Planet.sol";
import { EffectType, ModifierType } from "../codegen/common.sol";
import { _effectTableId, _artifactIndexToNamespace } from "../modules/atfs/utils.sol";
import { Effect as EffectTable, EffectData as EffectTableData } from "../modules/atfs/tables/Effect.sol";

using EffectLib for Planet;

struct Effect {
  uint256 id;
  uint256 origin;
  EffectType effectType;
  uint256 internalId;
}

struct EffectData {
  uint256 modifierNumber;
  Modifier[] modifiers;
}

struct Modifier {
  ModifierType modifierType;
  uint256 value;
}

library EffectLib {
  function genEffectId(uint256 origin, EffectType effectType, uint256 internalId) internal pure returns (uint256) {
    return (origin << 16) | (uint256(effectType) << 8) | internalId;
  }

  function genEffectData(
    EffectType effectType,
    Modifier[] memory modifiers
  ) internal pure returns (EffectTableData memory) {
    uint256 modifierNumber = modifiers.length;
    uint256 modifiersData;
    for (uint256 i; i < modifierNumber; ) {
      unchecked {
        modifiersData <<= 32;
      }
      modifiersData += (uint256(uint8(modifiers[i].modifierType)) << 24) + modifiers[i].value;
      unchecked {
        ++i;
      }
    }
    return EffectTableData(effectType, uint8(modifierNumber), uint240(modifiersData));
  }

  function parseEffect(uint256 effectId) internal pure returns (Effect memory) {
    return Effect(effectId, effectId >> 16, EffectType(uint8((effectId >> 8))), uint8(effectId));
  }

  function getData(Effect memory effect) internal view returns (EffectData memory) {
    ResourceId effectTableId = _effectTableId(_artifactIndexToNamespace(effect.origin));
    EffectTableData memory effectData = EffectTable.get(effectTableId, uint8(effect.id));
    uint256 modifierNumber = effectData.modifierNumber;
    Modifier[] memory modifiers = new Modifier[](modifierNumber);
    uint256 modifiersData = effectData.modifiers;
    for (uint256 i; i < modifierNumber; ) {
      uint256 modifierData = uint32(modifiersData);
      modifiers[i] = Modifier(ModifierType(uint8(modifierData >> 24)), uint24(modifierData));
      unchecked {
        ++i;
        modifiersData >>= 32;
      }
    }
    return EffectData(modifierNumber, modifiers);
  }

  function applyModifier(Planet memory planet, Modifier memory modif) internal view {
    bool propsUpdated = false;
    if (modif.modifierType == ModifierType.MULTIPLY_DEFENSE) {
      planet.defense = (planet.defense * uint256(modif.value)) / 100;
      propsUpdated = true;
    } else if (modif.modifierType == ModifierType.MULTIPLY_RANGE) {
      planet.range = (planet.range * uint256(modif.value)) / 100;
      propsUpdated = true;
    } else if (modif.modifierType == ModifierType.MULTIPLY_SPEED) {
      planet.speed = (planet.speed * uint256(modif.value)) / 100;
      propsUpdated = true;
    } else if (modif.modifierType == ModifierType.MULTIPLY_POPULATION_GROWTH) {
      planet.populationGrowth = (planet.populationGrowth * uint256(modif.value)) / 100;
      propsUpdated = true;
    } else if (modif.modifierType == ModifierType.MULTIPLY_SILVER_GROWTH) {
      planet.silverGrowth = (planet.silverGrowth * uint256(modif.value)) / 100;
      propsUpdated = true;
    } else if (modif.modifierType == ModifierType.APPLY_EFFECT) {
      planet.applyEffect(modif.value);
    } else if (modif.modifierType == ModifierType.REMOVE_EFFECT) {
      planet.removeEffect(modif.value);
    }
    if (propsUpdated) {
      planet.updateProps = true;
    }
  }

  function removeModifier(Planet memory planet, Modifier memory modif) internal pure {
    bool propsUpdated = false;
    if (modif.modifierType == ModifierType.MULTIPLY_DEFENSE) {
      planet.defense = (planet.defense * 100) / uint256(modif.value);
      propsUpdated = true;
    } else if (modif.modifierType == ModifierType.MULTIPLY_RANGE) {
      planet.range = (planet.range * 100) / uint256(modif.value);
      propsUpdated = true;
    } else if (modif.modifierType == ModifierType.MULTIPLY_SPEED) {
      planet.speed = (planet.speed * 100) / uint256(modif.value);
      propsUpdated = true;
    } else if (modif.modifierType == ModifierType.MULTIPLY_POPULATION_GROWTH) {
      planet.populationGrowth = (planet.populationGrowth * 100) / uint256(modif.value);
      propsUpdated = true;
    } else if (modif.modifierType == ModifierType.MULTIPLY_SILVER_GROWTH) {
      planet.silverGrowth = (planet.silverGrowth * 100) / uint256(modif.value);
      propsUpdated = true;
    }
    if (propsUpdated) {
      planet.updateProps = true;
    }
  }

  function applyEffect(Planet memory planet, uint256 effectId) internal view {
    Effect memory effect = EffectLib.parseEffect(effectId);
    Effect[] memory effects = planet.effects;
    uint256 effectNumber = planet.effectNumber;
    Effect[] memory newEffects = new Effect[](effectNumber + 1);
    for (uint256 i; i < effectNumber; ) {
      newEffects[i] = effects[i];
      unchecked {
        ++i;
      }
    }
    newEffects[effectNumber] = effect;
    planet.effects = newEffects;
    unchecked {
      ++planet.effectNumber;
    }
    if (effect.effectType == EffectType.STAT) {
      EffectData memory effectData = EffectLib.getData(effect);
      for (uint256 i; i < effectData.modifierNumber; ) {
        planet.applyModifier(effectData.modifiers[i]);
        unchecked {
          ++i;
        }
      }
    }
  }

  function removeEffect(Planet memory planet, uint256 effectId) internal view {
    Effect memory effect = EffectLib.parseEffect(effectId);
    Effect[] memory effects = planet.effects;
    uint256 effectNumber = planet.effectNumber;
    if (effectNumber == 0) {
      return;
    }
    Effect[] memory newEffects = new Effect[](effectNumber - 1);
    uint256 j;
    for (uint256 i; i < effectNumber; ++i) {
      if (effects[i].id == effectId) {
        continue;
      } else {
        newEffects[j] = effects[i];
        unchecked {
          ++j;
        }
      }
    }
    planet.effects = newEffects;
    unchecked {
      --planet.effectNumber;
    }
    if (effect.effectType == EffectType.STAT) {
      EffectData memory effectData = EffectLib.getData(effect);
      for (uint256 i; i < effectData.modifierNumber; ) {
        planet.removeModifier(effectData.modifiers[i]);
        unchecked {
          ++i;
        }
      }
    }
  }

  function triggerEvent(Planet memory planet, Effect memory effect, EffectType effectType) internal view {
    if (effectType == effect.effectType) {
      EffectData memory effectData = EffectLib.getData(effect);
      for (uint256 i; i < effectData.modifierNumber; ) {
        planet.applyModifier(effectData.modifiers[i]);
        unchecked {
          ++i;
        }
      }
      planet.removeEffect(effect.id);
    }
  }

  function beforeMove(Planet memory planet) internal view {
    Effect[] memory effects = planet.effects;
    for (uint256 i; i < planet.effectNumber; ) {
      EffectLib.triggerEvent(planet, effects[i], EffectType.BEFORE_MOVE);
      unchecked {
        ++i;
      }
    }
  }

  function afterMove(Planet memory planet) internal view {
    Effect[] memory effects = planet.effects;
    for (uint256 i; i < planet.effectNumber; ) {
      EffectLib.triggerEvent(planet, effects[i], EffectType.AFTER_MOVE);
      unchecked {
        ++i;
      }
    }
  }
}
