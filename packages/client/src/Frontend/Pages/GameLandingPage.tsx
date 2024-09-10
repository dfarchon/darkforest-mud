import { useLocation, useParams } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { Terminal, type TerminalHandle } from "../Views/Terminal";
import type { GameManager } from "@backend/GameLogic/GameManager";
import type { GameUIManager } from "@backend/GameLogic/GameUIManager";
import {
  GameWindowWrapper,
  InitRenderState,
  TerminalToggler,
  TerminalWrapper,
  Wrapper,
} from "@frontend/Components/GameLandingPageComponents";
import {
  type BrowserCompatibleState,
  BrowserIssues,
} from "@frontend/Components/BrowserIssues";
import {
  type Incompatibility,
  unsupportedFeatures,
} from "@frontend/Utils/BrowserChecks";
import UIEmitter, { UIEmitterEvent } from "@frontend/Utils/UIEmitter";
import { MythicLabelText } from "../Components/Labels/MythicLabel";
import { TerminalTextStyle } from "../Utils/TerminalTypes";
import WalletButton from "@wallet/WalletButton";
import { useMUD } from "@mud/MUDContext";
import { useWalletClient } from "wagmi";
import { zeroAddress } from "viem";
import {
  BLOCKCHAIN_BRIDGE,
  BLOCK_EXPLORER_URL,
  HOW_TO_ENABLE_POPUPS,
  HOW_TO_TRANSFER_ETH_FROM_L2_TO_REDSTONE,
  PLAYER_GUIDE,
  TOKEN_NAME,
} from "@df/constants";
import {
  TopLevelDivProvider,
  UIManagerProvider,
} from "@frontend/Utils/AppHooks";
// import { GameWindowLayout } from '../Views/GameWindowLayout';

const enum TerminalPromptStep {
  NONE,
  COMPATIBILITY_CHECKS_PASSED,
  DISPLAY_ACCOUNTS,
  GENERATE_ACCOUNT,
  IMPORT_ACCOUNT,
  ACCOUNT_SET,
  ASKING_HAS_WHITELIST_KEY,
  ASKING_WAITLIST_EMAIL,
  ASKING_WHITELIST_KEY,
  ASKING_PLAYER_EMAIL,
  FETCHING_ETH_DATA,
  ASK_ADD_ACCOUNT,
  ADD_ACCOUNT,
  NO_HOME_PLANET,
  SEARCHING_FOR_HOME_PLANET,
  ALL_CHECKS_PASS,
  COMPLETE,
  TERMINATED,
  ERROR,
  SPECTATING,
}

type TerminalStateOptions = {
  showHelp: boolean;
};

export function GameLandingPage() {
  const { contract } = useParams();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const queryParam = params.toString();
  const { data: walletClient } = useWalletClient();
  const {
    network: { walletClient: burnerWalletClient },
  } = useMUD();

  const mainAccount = walletClient?.account?.address ?? zeroAddress;
  const gameAccount = burnerWalletClient.account.address ?? zeroAddress;

  const topLevelContainer = useRef<HTMLDivElement>(null);
  const terminalHandle = useRef<TerminalHandle>(null);
  // const miniMapRef = useRef<MiniMapHandle>();

  const [gameManager, setGameManager] = useState<GameManager | undefined>();
  const gameUIManagerRef = useRef<GameUIManager | undefined>();

  const [terminalVisible, setTerminalVisible] = useState(true);
  const [initRenderState, setInitRenderState] = useState(InitRenderState.NONE);
  const [step, setStep] = useState(TerminalPromptStep.NONE);

  const [browserCompatibleState, setBrowserCompatibleState] =
    useState<BrowserCompatibleState>("unknown");

  const [browserIssues, setBrowserIssues] = useState<Incompatibility[]>([]);
  const [isMiniMapOn, setMiniMapOn] = useState(false);
  const [spectate, setSpectate] = useState(false);

  useEffect(() => {
    unsupportedFeatures().then((issues) => {
      const supported = issues.length === 0;
      setBrowserIssues(issues);
      if (supported) {
        setBrowserCompatibleState("supported");
        setStep(TerminalPromptStep.COMPATIBILITY_CHECKS_PASSED);
      } else {
        setBrowserCompatibleState("unsupported");
      }
    });
  }, []);

  const advanceStateFromCompatibilityPassed = useCallback(
    async (
      terminal: React.MutableRefObject<TerminalHandle | null>,
      { showHelp }: TerminalStateOptions = {
        showHelp: true,
      },
    ) => {
      if (showHelp) {
        terminal.current?.newline();
        terminal.current?.newline();

        terminal.current?.print("Player guide: ", TerminalTextStyle.Pink);

        terminal.current?.printLink(
          "Please Click Here",
          () => {
            window.open(PLAYER_GUIDE);
          },
          TerminalTextStyle.Blue,
        );

        terminal.current?.println(
          " <= New player please check this guide !!!",
          TerminalTextStyle.Pink,
        );

        terminal.current?.newline();
        terminal.current?.println(
          "Login or create an account.",
          TerminalTextStyle.Green,
        );
        terminal.current?.println(
          "Choose an option, type its symbol and press ENTER.",
        );
        terminal.current?.newline();
      }

      if (mainAccount === zeroAddress) {
        terminal.current?.println(``);

        terminal.current?.println(
          `(a) Please connect to your wallet`,
          TerminalTextStyle.Sub,
        );
      }

      terminal.current?.println(`(s) Spectate.`, TerminalTextStyle.Sub);
      terminal.current?.println(``);

      terminal.current?.println(
        "Select one of the options above [a] or [s], then press [enter].",
        TerminalTextStyle.Sub,
      );

      const userInput = (await terminal.current?.getInput())?.trim() ?? "";

      // stop options, go to next step
      switch (true) {
        case userInput === "a":
          setStep(TerminalPromptStep.DISPLAY_ACCOUNTS);
          return;
        case userInput === "s":
          setStep(TerminalPromptStep.SPECTATING);
          return;
      }

      // continue waiting for user input
      switch (true) {
        case userInput === "clear": {
          terminal.current?.clear();
          showHelp = false;
          advanceStateFromCompatibilityPassed(terminal, {
            showHelp,
          });
          break;
        }
        case userInput === "h" || userInput === "help": {
          showHelp = true;
          advanceStateFromCompatibilityPassed(terminal, {
            showHelp,
          });
          break;
        }
        default: {
          terminal.current?.println(
            "Invalid option, please try press [help]",
            TerminalTextStyle.Pink,
          );
          showHelp = false;
          advanceStateFromCompatibilityPassed(terminal, {
            showHelp,
          });
        }
      }
    },
    [],
  );

  const advanceState = useCallback(
    (terminal: React.MutableRefObject<TerminalHandle | null>) => {
      if (browserCompatibleState !== "supported") {
        return;
      }

      switch (true) {
        case step === TerminalPromptStep.COMPATIBILITY_CHECKS_PASSED:
          advanceStateFromCompatibilityPassed(terminal);
          return;
      }
    },
    [step, browserCompatibleState, advanceStateFromCompatibilityPassed],
  );

  useEffect(() => {
    const uiEmitter = UIEmitter.getInstance();
    uiEmitter.emit(UIEmitterEvent.UIChange);
  }, [initRenderState]);

  // useEffect(() => {
  //   const gameUiManager = gameUIManagerRef.current;
  //   if (!terminalVisible && gameUiManager) {
  //     const tutorialManager = TutorialManager.getInstance(gameUiManager);
  //     tutorialManager.acceptInput(TutorialState.Terminal);
  //   }
  // }, [terminalVisible]);

  useEffect(() => {
    if (terminalHandle.current && topLevelContainer.current) {
      advanceState(terminalHandle);
    }
  }, [terminalHandle, topLevelContainer, advanceState]);

  return (
    <Wrapper initRender={initRenderState} terminalEnabled={terminalVisible}>
      {/* <GameWindowWrapper initRender={initRenderState} terminalEnabled={terminalVisible}>
        {gameUIManagerRef.current && topLevelContainer.current && gameManager && (
          <TopLevelDivProvider value={topLevelContainer.current}>
            <UIManagerProvider value={gameUIManagerRef.current}>
              <GameWindowLayout
                terminalVisible={terminalVisible}
                setTerminalVisible={setTerminalVisible} />
            </UIManagerProvider>
          </TopLevelDivProvider>
        )}
        <TerminalToggler
          terminalEnabled={terminalVisible}
          setTerminalEnabled={setTerminalVisible}
        />
      </GameWindowWrapper> */}

      <TerminalWrapper
        initRender={initRenderState}
        terminalEnabled={terminalVisible}
      >
        <MythicLabelText
          text={`Welcome To Dark Forest MUD`}
          style={{
            fontFamily: "'Start Press 2P', sans-serif",
            display:
              initRenderState !== InitRenderState.COMPLETE ? "block" : "none",
          }}
        />

        <WalletButton />

        <BrowserIssues issues={browserIssues} state={browserCompatibleState} />

        <div>
          <p>Contract: {contract}</p>
          <p>Location: {location.pathname}</p>
          <p>Search: {queryParam}</p>
          <p> Main Account: {mainAccount}</p>
          <p> Game Account: {gameAccount}</p>
          <br />
        </div>

        <Terminal
          ref={terminalHandle}
          promptCharacter={">"}
          visible={browserCompatibleState === "supported"}
          useCaretElement={initRenderState !== InitRenderState.COMPLETE}
        />
      </TerminalWrapper>
      <div ref={topLevelContainer}></div>
    </Wrapper>
  );
}
