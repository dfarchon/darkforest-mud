import { DarkForestModal, PositionChangedEvent } from "@df/ui";
import { createComponent } from "@lit-labs/react";
import React from "react";

customElements.define(DarkForestModal.tagName, DarkForestModal);

export { DarkForestModal, PositionChangedEvent };

// This wraps the customElement in a React wrapper to make it behave exactly like a React component
export const Modal = createComponent<
  DarkForestModal,
  {
    onMouseDown: (evt: Event & React.MouseEvent<DarkForestModal>) => void;
    onPositionChanged: (evt: PositionChangedEvent) => void;
  }
>(React, DarkForestModal.tagName, DarkForestModal, {
  onMouseDown: "mousedown",
  onPositionChanged: "position-changed",
});
