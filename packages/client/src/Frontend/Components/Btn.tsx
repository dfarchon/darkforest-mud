import {
  DarkForestButton,
  DarkForestShortcutButton,
  ShortcutPressedEvent,
} from "@df/ui";
import { createComponent } from "@lit-labs/react";
import React from "react";

customElements.define(DarkForestButton.tagName, DarkForestButton);
customElements.define(
  DarkForestShortcutButton.tagName,
  DarkForestShortcutButton,
);

export { DarkForestButton, DarkForestShortcutButton, ShortcutPressedEvent };

// This wraps the customElement in a React wrapper to make it behave exactly like a React component
// @ts-ignore: This method is deprecated, replace it in the future
export const Btn = createComponent<
  DarkForestButton,
  {
    onClick: (evt: Event & React.MouseEvent<DarkForestButton>) => void;
  }
>(React, DarkForestButton.tagName, DarkForestButton, {
  onClick: "click",
});

export const ShortcutBtn = createComponent<
  DarkForestShortcutButton,
  {
    onClick: (evt: Event & React.MouseEvent<DarkForestShortcutButton>) => void;
    onShortcutPressed: (evt: ShortcutPressedEvent) => void;
  }
>(React, DarkForestShortcutButton.tagName, DarkForestShortcutButton, {
  onClick: "click",
  onShortcutPressed: "shortcut-pressed",
});
