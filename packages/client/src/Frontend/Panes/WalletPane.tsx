import { BLOCK_EXPLORER_URL } from "@df/constants";
import { ModalName } from "@df/types";
import React from "react";
import styled from "styled-components";

import { Link, Section, SectionHeader } from "../Components/CoreUI";
import { Pink } from "../Components/Text";
import { WalletComponent } from "../Components/WalletComponent";
import dfstyles from "../Styles/dfstyles";
import { useUIManager } from "../Utils/AppHooks";
import { ModalPane } from "../Views/ModalPane";

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
      title="Wallet Management"
      visible={visible}
      onClose={onClose}
      width="50em"
    >
      <WalletComponent showRegisterPlayer={false} />
    </ModalPane>
  );
}
