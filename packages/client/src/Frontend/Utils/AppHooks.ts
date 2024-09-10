import type { GameUIManager } from "@backend/GameLogic/GameUIManager";
import { createDefinedContext } from "./createDefinedContext";

export const { useDefinedContext: useUIManager, provider: UIManagerProvider } =
  createDefinedContext<GameUIManager>();

export const {
  useDefinedContext: useTopLevelDiv,
  provider: TopLevelDivProvider,
} = createDefinedContext<HTMLDivElement>();
