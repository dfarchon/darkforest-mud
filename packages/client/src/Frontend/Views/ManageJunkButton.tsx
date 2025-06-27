import { EMPTY_ADDRESS } from "@df/constants";
import { isUnconfirmedAddJunkTx, isUnconfirmedClearJunkTx } from "@df/serde";
import type { Planet } from "@df/types";
import React, { useCallback, useMemo, useState } from "react";
import styled from "styled-components";

import type { Wrapper } from "../../Backend/Utils/Wrapper";
import { Btn } from "../Components/Btn";
import { LoadingSpinner } from "../Components/LoadingSpinner";
import { Row } from "../Components/Row";
import dfstyles from "../Styles/dfstyles";
import { useUIManager } from "../Utils/AppHooks";

const TextWrapper = styled.span`
  width: 300px;
  font-size: ${dfstyles.fontSizeXS};
  text-align: center;
`;

export function ManageJunkButton({
  wrapper,
}: {
  wrapper: Wrapper<Planet | undefined>;
}) {
  const uiManager = useUIManager();
  const planet = wrapper.value;
  const account = uiManager.getAccount();

  const preAddJunkCheck = useMemo(() => {
    if (!planet) {
      return;
    }
    if (planet.junkOwner === EMPTY_ADDRESS && planet.owner === account)
      return true;
    else if (planet.owner === account && planet.junkOwner !== account)
      return true;
    else return false;
  }, [planet, account]);

  const addJunk = useCallback(() => {
    if (!planet) {
      return;
    }
    uiManager.addJunk(planet.locationId);
  }, [planet, uiManager]);

  const adding = useMemo(
    () => !!wrapper.value?.transactions?.hasTransaction(isUnconfirmedAddJunkTx),
    [wrapper],
  );

  const preClearJunkCheck = useMemo(() => {
    if (!planet) {
      return;
    }
    return planet.junkOwner === account;
  }, [planet]);

  const clearJunk = useCallback(() => {
    if (!planet) {
      return;
    }
    uiManager.clearJunk(planet.locationId);
  }, [planet, uiManager]);

  const clearing = useMemo(
    () =>
      !!wrapper.value?.transactions?.hasTransaction(isUnconfirmedClearJunkTx),
    [wrapper],
  );

  return (
    <Row>
      {preAddJunkCheck && (
        <Btn onClick={addJunk} disabled={adding}>
          <TextWrapper>
            {adding ? (
              <LoadingSpinner initialText="Adding Junk..." />
            ) : (
              "Add Junk"
            )}
          </TextWrapper>
        </Btn>
      )}

      {preClearJunkCheck && (
        <Btn onClick={clearJunk} disabled={clearing}>
          <TextWrapper>
            {clearing ? (
              <LoadingSpinner initialText="Clearing Junk..." />
            ) : (
              "Clear Junk"
            )}
          </TextWrapper>
        </Btn>
      )}
    </Row>
  );
}
