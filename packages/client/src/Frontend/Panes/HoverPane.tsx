import React, { useLayoutEffect, useRef } from "react";
import styled from "styled-components";

import { snips } from "../Styles/dfstyles";
import { DFZIndex } from "../Utils/constants";

const StyledHoverPane = styled.div`
  position: absolute;
  pointer-events: none;
  z-index: ${DFZIndex.Tooltip};
  ${snips.absoluteTopLeft}
  ${snips.defaultBackground}
  ${snips.roundedBordersWithEdge}
  width: 350px;
  opacity: 0; /* Start with opacity 0 */
`;

/**
 * This is the pane that is rendered when you hover over a planet.
 */
export function HoverPane({
  style,
  visible,
  element,
}: {
  style?: React.CSSProperties;
  visible: boolean;
  element: React.ReactChild;
}) {
  const paneRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!paneRef.current) {
      return;
    }

    let leftOffset;
    let topOffset;

    // Hide pane immediately when component re-renders
    if (paneRef.current) {
      paneRef.current.style.opacity = "0";
    }

    const doMouseMove = (e: MouseEvent) => {
      if (!paneRef.current) {
        return;
      }

      const width = paneRef.current.offsetWidth;
      const height = paneRef.current.offsetHeight;

      // Calculate position
      if (e.clientX < window.innerWidth / 2) {
        leftOffset = 10;
      } else {
        leftOffset = -10 - width;
      }

      if (e.clientY < window.innerHeight / 2) {
        topOffset = 10;
      } else {
        topOffset = -10 - height;
      }

      const top = e.clientY + topOffset;
      const left = e.clientX + leftOffset;

      // Set position
      paneRef.current.style.top = top + "px";
      paneRef.current.style.left = left + "px";

      // Show panel with a slight delay to ensure position is correct
      if (visible && paneRef.current.style.opacity === "0") {
        paneRef.current.style.opacity = "1";
      }

      // Debug logging
      // if (visible) {
      //   console.log(top, left, e.clientX, window.innerWidth / 2, e.clientX < window.innerWidth / 2, e.clientY < window.innerHeight / 2);
      // }
    };

    window.addEventListener("mousemove", doMouseMove);

    return () => {
      window.removeEventListener("mousemove", doMouseMove);
    };
  }, [paneRef, visible]);

  return (
    <StyledHoverPane
      ref={paneRef}
      style={{
        display: visible ? undefined : "none",
        zIndex: DFZIndex.Tooltip,
        ...style,
      }}
    >
      {element}
    </StyledHoverPane>
  );
}
