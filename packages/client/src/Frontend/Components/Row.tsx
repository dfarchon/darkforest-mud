import { createComponent } from "@lit-labs/react";
import React from "react";

import { DarkForestRow } from "@df/ui";

customElements.define(DarkForestRow.tagName, DarkForestRow);

// This wraps the customElement in a React wrapper to make it behave exactly like a React component
export const Row = createComponent(React, DarkForestRow.tagName, DarkForestRow);
