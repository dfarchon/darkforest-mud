import { RECOMMENDED_MODAL_WIDTH } from "@df/constants";
import { ModalName } from "@df/types";
import React from "react";

import { Spacer } from "../Components/CoreUI";
import { useMyArtifactsNotBroken, useUIManager } from "../Utils/AppHooks";
import type { ModalHandle } from "../Views/ModalPane";
import { ModalPane } from "../Views/ModalPane";
import { AllArtifacts } from "./ArtifactsList";

function HelpContent() {
  return (
    <div>
      <p>These are all the artifacts you currently own.</p>
      <Spacer height={8} />
      <p>
        The table is interactive, and allows you to sort the artifacts by
        clicking each column&apos;s header. You can also view more information
        about a particular artifact by clicking on its name.
      </p>
    </div>
  );
}

export function PlayerArtifactsPane({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const uiManager = useUIManager();
  const artifacts = useMyArtifactsNotBroken(uiManager);

  const render = (handle: ModalHandle) => (
    <AllArtifacts modal={handle} artifacts={artifacts} />
  );

  return (
    <ModalPane
      id={ModalName.YourArtifacts}
      title={"Your Inventory"}
      visible={visible}
      onClose={onClose}
      helpContent={HelpContent}
      width={RECOMMENDED_MODAL_WIDTH}
    >
      {render}
    </ModalPane>
  );
}
