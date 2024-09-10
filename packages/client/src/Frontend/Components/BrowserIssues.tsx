import type { Incompatibility } from "@frontend/Utils/BrowserChecks";
import styled from "styled-components";

const BrowserIssue = styled.p`
  color: red;
  font-size: 24px;
  line-height: 1.2em;
  width: 1000%;
  padding: 1em 0.5em;
`;

export type BrowserCompatibleState = "unknown" | "unsupported" | "supported";

export function BrowserIssues({
  issues,
  state,
}: {
  issues: Incompatibility[];
  state: BrowserCompatibleState;
}): JSX.Element {
  if (state !== "unsupported") {
    return <></>;
  }

  if (issues.includes(Incompatibility.MobileOrTablet)) {
    return (
      <BrowserIssue>
        ERROR: Mobile or tablet device detected. Please use desktop.
      </BrowserIssue>
    );
  }

  if (issues.includes(Incompatibility.NoIDB)) {
    return (
      <BrowserIssue>
        ERROR: IndexedDB not found. Try using a different browser
      </BrowserIssue>
    );
  }

  if (issues.includes(Incompatibility.UnsupportedBrowser)) {
    return (
      <BrowserIssue>
        ERROR: Unsupported browser. Try using Brave, Firefox, or Chrome.
      </BrowserIssue>
    );
  }

  return (
    <BrowserIssue>ERROR: Unknonwn error, please refresh browser.</BrowserIssue>
  );
}
