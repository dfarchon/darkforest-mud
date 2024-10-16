import { BLOCK_EXPLORER_URL } from "@df/constants";
import { ModalName } from "@df/types";
import React from "react";
import styled from "styled-components";

import { Link, Section, SectionHeader } from "../Components/CoreUI";
import { Pink } from "../Components/Text";
import dfstyles from "../Styles/dfstyles";
import { useUIManager } from "../Utils/AppHooks";
import { ModalPane } from "../Views/ModalPane";

const WalletContent = styled.div`
  width: 500px;
  height: 700px;
  max-height: 700px;
  max-width: 500px;
  overflow-y: scroll;
  text-align: justify;
  color: ${dfstyles.colors.text};
`;

export function WalletPane({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <ModalPane
      id={ModalName.Wallet}
      title="Help"
      visible={visible}
      onClose={onClose}
    >
      <WalletContent>Wallet Component</WalletContent>
    </ModalPane>
  );
}
