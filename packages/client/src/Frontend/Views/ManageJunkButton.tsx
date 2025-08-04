import { EMPTY_ADDRESS } from "@df/constants";
import { isUnconfirmedAddJunkTx, isUnconfirmedClearJunkTx } from "@df/serde";
import type { Planet } from "@df/types";
import { useCallback, useMemo } from "react";
import styled from "styled-components";

import type { Wrapper } from "../../Backend/Utils/Wrapper";
import { LoadingSpinner } from "../Components/LoadingSpinner";
import { MaybeShortcutButton } from "../Components/MaybeShortcutButton";
import { useUIManager } from "../Utils/AppHooks";
import { TOGGLE_MANAGE_JUNK } from "../Utils/ShortcutConstants";

const TextWrapper = styled.span`
  text-align: center;
  display: block;
  width: 100%;
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-top: 4px;
  margin-bottom: 4px;
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
    const confirmed = confirm(
      "If you are the owner of this planet, clearing junk will cause you to lose ownership. Are you sure you want to clear the junk?",
    );
    if (confirmed) {
      uiManager.clearJunk(planet.locationId);
    }
  }, [planet, uiManager]);

  const clearing = useMemo(
    () =>
      !!wrapper.value?.transactions?.hasTransaction(isUnconfirmedClearJunkTx),
    [wrapper],
  );

  const handleAction = () => {
    if (preAddJunkCheck) {
      addJunk();
    } else if (preClearJunkCheck) {
      clearJunk();
    }
  };

  if (!preAddJunkCheck && !preClearJunkCheck) {
    return null;
  } else {
    return (
      <ButtonContainer>
        <MaybeShortcutButton
          size="stretch"
          shortcutKey={TOGGLE_MANAGE_JUNK}
          shortcutText={TOGGLE_MANAGE_JUNK}
          onClick={handleAction}
          onShortcutPressed={handleAction}
          disabled={adding || clearing}
        >
          {preAddJunkCheck && (
            <TextWrapper>
              {adding ? (
                <LoadingSpinner initialText="Adding Junk..." />
              ) : (
                "Add Junk"
              )}
            </TextWrapper>
          )}

          {preClearJunkCheck && (
            <TextWrapper>
              {clearing ? (
                <LoadingSpinner initialText="Clearing Junk..." />
              ) : (
                "Clear Junk"
              )}
            </TextWrapper>
          )}
        </MaybeShortcutButton>
      </ButtonContainer>
    );
  }
}
