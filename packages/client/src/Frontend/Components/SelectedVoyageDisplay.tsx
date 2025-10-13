import { useEffect, useState, useRef } from "react";
import type { QueuedArrival } from "@df/types";
import { useUIManager } from "../Utils/AppHooks";
import { SelectedVoyagePane } from "./SelectedVoyagePane";

// Position storage key
const VOYAGE_PANE_POSITION_KEY = "voyagePanePosition";
// Hover delay in milliseconds
const HOVER_DELAY = 500;

export function SelectedVoyageDisplay() {
  const uiManager = useUIManager();
  const [selectedVoyage, setSelectedVoyage] = useState<
    QueuedArrival | undefined
  >(uiManager.getSelectedVoyage());
  const [, setHoveredVoyage] = useState<QueuedArrival | undefined>(
    uiManager.getHoveringVoyage(),
  );
  const [delayedHoveredVoyage, setDelayedHoveredVoyage] = useState<
    QueuedArrival | undefined
  >();
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [panePosition, setPanePosition] = useState<{
    x: number;
    y: number;
  } | null>(() => {
    // Load saved position from localStorage
    try {
      const saved = localStorage.getItem(VOYAGE_PANE_POSITION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { x: parsed.x, y: parsed.y };
      }
    } catch (error) {
      console.warn("Failed to load voyage pane position:", error);
    }
    return null;
  });

  useEffect(() => {
    const unsubscribeSelected = uiManager.selectedVoyage$.subscribe(
      (voyage) => {
        setSelectedVoyage(voyage);
      },
    );
    const unsubscribeHover = uiManager.hoverVoyage$.subscribe((voyage) => {
      setHoveredVoyage(voyage);

      // Clear existing timeout
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }

      if (voyage) {
        // Set delayed hover after 0.5s
        hoverTimeoutRef.current = setTimeout(() => {
          setDelayedHoveredVoyage(voyage);
        }, HOVER_DELAY);
      } else {
        // Clear delayed hover immediately when no voyage
        setDelayedHoveredVoyage(undefined);
      }
    });

    return () => {
      unsubscribeSelected.unsubscribe();
      unsubscribeHover.unsubscribe();
      // Clear timeout on cleanup
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, [uiManager]);

  const handleClose = () => {
    uiManager.setSelectedVoyage(undefined);
  };

  const handlePositionChange = (position: { x: number; y: number }) => {
    setPanePosition(position);
    // Save position to localStorage
    try {
      localStorage.setItem(VOYAGE_PANE_POSITION_KEY, JSON.stringify(position));
    } catch (error) {
      console.warn("Failed to save voyage pane position:", error);
    }
  };

  // Show selected voyage if available, otherwise show delayed hovered voyage
  const displayVoyage = selectedVoyage || delayedHoveredVoyage;

  if (!displayVoyage) {
    return null;
  }

  // If it's a hovered voyage (not selected), don't show close button
  const isHovered = !selectedVoyage && Boolean(delayedHoveredVoyage);

  return (
    <SelectedVoyagePane
      voyage={displayVoyage}
      onClose={isHovered ? undefined : handleClose}
      showCloseButton={!isHovered}
      fixedPosition={true}
      isHovered={isHovered}
      initialPosition={panePosition}
      onPositionChange={handlePositionChange}
    />
  );
}
