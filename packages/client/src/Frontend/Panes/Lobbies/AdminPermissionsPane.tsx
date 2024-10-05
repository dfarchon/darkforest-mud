import React from "react";

import type { DarkForestCheckbox } from "../../Components/Input";
import { Checkbox } from "../../Components/Input";
import { Row } from "../../Components/Row";
import type { LobbiesPaneProps } from "./LobbiesUtils";
import { Warning } from "./LobbiesUtils";

export function AdminPermissionsPane({ config, onUpdate }: LobbiesPaneProps) {
  return (
    <>
      <Row>
        <Checkbox
          label="Admin can add planets?"
          checked={config.ADMIN_CAN_ADD_PLANETS.displayValue}
          onChange={(e: Event & React.ChangeEvent<DarkForestCheckbox>) =>
            onUpdate({ type: "ADMIN_CAN_ADD_PLANETS", value: e.target.checked })
          }
        />
      </Row>
      <Row>
        <Warning>{config.ADMIN_CAN_ADD_PLANETS.warning}</Warning>
      </Row>
      <Row>
        <Checkbox
          label="Is whitelist enabled?"
          checked={config.WHITELIST_ENABLED.displayValue}
          onChange={(e: Event & React.ChangeEvent<DarkForestCheckbox>) =>
            onUpdate({ type: "WHITELIST_ENABLED", value: e.target.checked })
          }
        />
      </Row>
      <Row>
        <Warning>{config.WHITELIST_ENABLED.warning}</Warning>
      </Row>
    </>
  );
}
