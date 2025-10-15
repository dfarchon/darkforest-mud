import { ModalName } from "@df/types";
import { useLocation } from "react-router-dom";

import { WalletComponent } from "../Components/WalletComponent";
import { ModalPane } from "../Views/ModalPane";
import { BuyJunkPane } from "./BuyJunkPane";

export function WalletPane({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const location = useLocation();
  // Don't show wallet if URL starts with /redpill
  const hideWallet = location.pathname.startsWith("/redpill/");

  return (
    <ModalPane
      id={ModalName.Wallet}
      title="Wallet & Trade"
      visible={visible}
      onClose={onClose}
      width="50em"
    >
      {!hideWallet && <WalletComponent showRegisterPlayer={false} />}
      <BuyJunkPane />
    </ModalPane>
  );
}
