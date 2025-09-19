import { Renderer } from "@df/renderer";
import { PlanetRenderManager } from "@df/renderer";
import type { QueuedArrival } from "@df/types";
import { CursorState, ModalManagerEvent, Setting } from "@df/types";
import { useMUD } from "@mud/MUDContext";
import type { ClientComponents } from "@mud/createClientComponents";
// import * as fabric from 'fabric'; // v6
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import styled from "styled-components";

import { SelectedVoyagePane } from "../Components/SelectedVoyagePane";
import { VoyageSelector } from "../Components/VoyageSelector";
import { useUIManager } from "../Utils/AppHooks";
import { useIsDown } from "../Utils/KeyEmitters";
import {
  MOVE_DOWN,
  MOVE_LEFT,
  MOVE_RIGHT,
  MOVE_UP,
} from "../Utils/ShortcutConstants";
import UIEmitter, { UIEmitterEvent } from "../Utils/UIEmitter";
import Viewport from "./Viewport";

// Type definitions for voyage renderer and renderer objects
interface VoyageRenderer {
  getVoyageData(): Array<{
    voyage: QueuedArrival;
    position: { x: number; y: number };
    isMyVoyage: boolean;
    canRevert: boolean;
  }>;
}

interface RendererWithComponents {
  components?: ClientComponents;
}

interface RendererInstance {
  voyageRenderManager?: VoyageRenderer;
}

const CanvasWrapper = styled.div`
  width: 100%;
  height: 100%;

  position: relative;

  canvas {
    width: 100%;
    height: 100%;

    position: absolute;

    &#buffer {
      width: auto;
      height: auto;
      display: none;
    }
  }
  // TODO put this into a global style
  canvas,
  img {
    image-rendering: -moz-crisp-edges;
    image-rendering: -webkit-crisp-edges;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
  }
`;

export default function ControllableCanvas() {
  // html canvas element width and height. viewport dimensions are tracked by viewport obj
  const [width, setWidth] = useState(window.innerWidth);
  const [height, setHeight] = useState(window.innerHeight);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<HTMLCanvasElement | null>(null);
  const bufferRef = useRef<HTMLCanvasElement | null>(null);

  const evtRef = canvasRef;

  // const [fCanvas, setFCanvas] = useState<fabric.Canvas | null>(null);

  const gameUIManager = useUIManager();
  const { components } = useMUD();

  const modalManager = gameUIManager.getModalManager();
  const [targeting, setTargeting] = useState<boolean>(false);
  const [selectedVoyage, setSelectedVoyage] = useState<
    QueuedArrival | undefined
  >(undefined);
  const [voyageData, setVoyageData] = useState<
    Array<{
      voyage: QueuedArrival;
      position: { x: number; y: number };
      isMyVoyage: boolean;
      canRevert: boolean;
    }>
  >([]);

  useEffect(() => {
    const updateTargeting = (newstate: CursorState) => {
      setTargeting(newstate === CursorState.TargetingExplorer);
    };
    modalManager.on(ModalManagerEvent.StateChanged, updateTargeting);
    return () => {
      modalManager.removeListener(
        ModalManagerEvent.StateChanged,
        updateTargeting,
      );
    };
  }, [modalManager]);

  // Update voyage data when renderer changes
  useEffect(() => {
    if (Renderer.instance) {
      const rendererInstance = Renderer.instance as RendererInstance;
      const voyageRenderer = rendererInstance.voyageRenderManager;
      if (
        voyageRenderer &&
        typeof voyageRenderer.getVoyageData === "function"
      ) {
        const data = voyageRenderer.getVoyageData();
        setVoyageData(data);
      }
    }
  }, [gameUIManager, components]); // Re-run when game state changes

  // Update voyage data more frequently to catch voyage changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (Renderer.instance) {
        const rendererInstance = Renderer.instance as RendererInstance;
        const voyageRenderer = rendererInstance.voyageRenderManager;
        if (
          voyageRenderer &&
          typeof voyageRenderer.getVoyageData === "function"
        ) {
          const data = voyageRenderer.getVoyageData();
          setVoyageData(data);
        }
      }
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  const doResize = useCallback(() => {
    const uiEmitter: UIEmitter = UIEmitter.getInstance();
    if (canvasRef.current) {
      setWidth(canvasRef.current.clientWidth);
      setHeight(canvasRef.current.clientHeight);
      uiEmitter.emit(UIEmitterEvent.WindowResize);
    }
  }, [canvasRef]);

  // TODO fix this
  useLayoutEffect(() => {
    if (canvasRef.current) {
      doResize();
    }
  }, [
    // dep array gives eslint issues, but it's fine i tested it i swear - Alan
    canvasRef,
    doResize,
    canvasRef.current?.offsetWidth,
    canvasRef.current?.offsetHeight,
  ]);

  useEffect(() => {
    if (!gameUIManager) {
      return;
    }
    // if (!fCanvas && canvasRef.current) {
    //   // setFCanvas(new fabric.Canvas(canvasRef.current));
    // }

    const uiEmitter: UIEmitter = UIEmitter.getInstance();

    function onResize() {
      doResize();
      uiEmitter.emit(UIEmitterEvent.WindowResize);
    }

    const onWheel = (e: WheelEvent): void => {
      e.preventDefault();
      const { deltaY } = e;
      uiEmitter.emit(UIEmitterEvent.CanvasScroll, deltaY);
    };

    // const canvas = fCanvas?.getSelectionElement();
    const canvas = evtRef.current;
    if (!canvas || !canvasRef.current || !glRef.current || !bufferRef.current) {
      return;
    }

    // This zooms your home world in really close to show the awesome details
    // TODO: Store this as it changes and re-initialize to that if stored
    const defaultWorldUnits = 4;
    Viewport.initialize(gameUIManager, defaultWorldUnits, canvas);
    const renderer = Renderer.initialize(
      canvasRef.current,
      glRef.current,
      bufferRef.current,
      Viewport.getInstance(),
      gameUIManager,
      {
        spaceColors: {
          innerNebulaColor: gameUIManager.getStringSetting(
            Setting.RendererColorInnerNebula,
          ),
          nebulaColor: gameUIManager.getStringSetting(
            Setting.RendererColorNebula,
          ),
          spaceColor: gameUIManager.getStringSetting(
            Setting.RendererColorSpace,
          ),
          deepSpaceColor: gameUIManager.getStringSetting(
            Setting.RendererColorDeepSpace,
          ),
          deadSpaceColor: gameUIManager.getStringSetting(
            Setting.RendererColorDeadSpace,
          ),
        },
      },
    );

    // Set MUD components for PlanetRenderManager after Renderer is initialized
    PlanetRenderManager.setComponents(components);

    // Also set components on the renderer for dynamic access
    (renderer as RendererWithComponents).components = components;

    // We can't attach the wheel event onto the canvas due to:
    // https://www.chromestatus.com/features/6662647093133312
    canvas.addEventListener("wheel", onWheel);
    // fCanvas.on("mouse:wheel", onWheel);
    window.addEventListener("resize", onResize);

    uiEmitter.on(UIEmitterEvent.UIChange, doResize);

    return () => {
      Viewport.destroyInstance();
      Renderer.destroy();
      canvas.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
      uiEmitter.removeListener(UIEmitterEvent.UIChange, doResize);
    };
  }, [gameUIManager, doResize, canvasRef, glRef, bufferRef, evtRef]);

  // attach event listeners
  useEffect(() => {
    if (!evtRef.current) {
      return;
    }
    const canvas = evtRef.current;

    const uiEmitter: UIEmitter = UIEmitter.getInstance();

    function onMouseEvent(
      emitEventName: UIEmitterEvent,
      mouseEvent: MouseEvent,
    ) {
      const rect = canvas.getBoundingClientRect();
      const canvasX = mouseEvent.clientX - rect.left;
      const canvasY = mouseEvent.clientY - rect.top;
      uiEmitter.emit(emitEventName, { x: canvasX, y: canvasY });
    }

    const onMouseDown = (e: MouseEvent) => {
      onMouseEvent(UIEmitterEvent.CanvasMouseDown, e);
    };
    // this is the root of the mousemove event
    const onMouseMove = (e: MouseEvent) => {
      onMouseEvent(UIEmitterEvent.CanvasMouseMove, e);
    };
    const onMouseUp = (e: MouseEvent) => {
      onMouseEvent(UIEmitterEvent.CanvasMouseUp, e);
    };
    // TODO convert this to mouseleave
    const onMouseOut = () => {
      uiEmitter.emit(UIEmitterEvent.CanvasMouseOut);
    };

    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseout", onMouseOut);
    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mouseout", onMouseOut);
    };
  }, [evtRef]);

  // Keyboard movement handlers with continuous movement supportAdd commentMore actions
  const isUpPressed = useIsDown(MOVE_UP);
  const isDownPressed = useIsDown(MOVE_DOWN);
  const isLeftPressed = useIsDown(MOVE_LEFT);
  const isRightPressed = useIsDown(MOVE_RIGHT);

  // Continuous movement using animation frame
  useEffect(() => {
    let animationId: number;

    const moveCamera = () => {
      const uiEmitter = UIEmitter.getInstance();

      if (isUpPressed) {
        uiEmitter.emit(UIEmitterEvent.MoveUp);
      }
      if (isDownPressed) {
        uiEmitter.emit(UIEmitterEvent.MoveDown);
      }
      if (isLeftPressed) {
        uiEmitter.emit(UIEmitterEvent.MoveLeft);
      }
      if (isRightPressed) {
        uiEmitter.emit(UIEmitterEvent.MoveRight);
      }

      // Continue the animation loop if any key is pressed
      if (isUpPressed || isDownPressed || isLeftPressed || isRightPressed) {
        animationId = requestAnimationFrame(moveCamera);
      }
    };

    // Start movement if any key is pressed
    if (isUpPressed || isDownPressed || isLeftPressed || isRightPressed) {
      animationId = requestAnimationFrame(moveCamera);
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isUpPressed, isDownPressed, isLeftPressed, isRightPressed]);

  return (
    <CanvasWrapper style={{ cursor: targeting ? "crosshair" : undefined }}>
      <canvas ref={glRef} width={width} height={height} />
      <canvas ref={canvasRef} width={width} height={height} />
      <canvas ref={bufferRef} id="buffer" />
      {/* Render voyage UI elements over the canvas */}
      {voyageData.map((data) => {
        const viewport = Renderer.instance?.getViewport();
        if (!viewport) return null;

        return (
          <div key={`voyage-${data.voyage.eventId}`}>
            {/* Voyage Selector */}
            <VoyageSelector
              voyage={data.voyage}
              worldCoords={data.position}
              viewport={viewport}
              onSelect={(voyage) => {
                // Toggle selection - if same voyage is clicked, deselect it
                if (
                  selectedVoyage &&
                  selectedVoyage.eventId === voyage.eventId
                ) {
                  setSelectedVoyage(undefined);
                  gameUIManager.setSelectedVoyage(undefined);
                } else {
                  setSelectedVoyage(voyage);
                  gameUIManager.setSelectedVoyage(voyage);
                }
              }}
            />
          </div>
        );
      })}

      {/* Selected Voyage Pane */}
      {selectedVoyage && (
        <SelectedVoyagePane
          voyage={selectedVoyage}
          onClose={() => {
            setSelectedVoyage(undefined);
            gameUIManager.setSelectedVoyage(undefined);
          }}
        />
      )}
    </CanvasWrapper>
  );
}
