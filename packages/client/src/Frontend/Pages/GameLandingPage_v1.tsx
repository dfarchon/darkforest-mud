// import type { GameManager } from "@backend/GameLogic/GameManager";
// import type { GameUIManager } from "@backend/GameLogic/GameUIManager";
import {
  BLOCK_EXPLORER_URL,
  // BLOCKCHAIN_BRIDGE,
  // HOW_TO_ENABLE_POPUPS,
  // HOW_TO_TRANSFER_ETH_FROM_L2_TO_REDSTONE,
  PLAYER_GUIDE,
  // TOKEN_NAME,
} from "@df/constants";
import type { EthConnection } from "@df/network";
import { address } from "@df/serde";
import {
  type BrowserCompatibleState,
  BrowserIssues,
} from "@frontend/Components/BrowserIssues";
import {
  // GameWindowWrapper,
  InitRenderState,
  // TerminalToggler,
  TerminalWrapper,
  Wrapper,
} from "@frontend/Components/GameLandingPageComponents";
// import {
//   TopLevelDivProvider,
//   UIManagerProvider,
// } from "@frontend/Utils/AppHooks";
import {
  type Incompatibility,
  unsupportedFeatures,
} from "@frontend/Utils/BrowserChecks";
import UIEmitter, { UIEmitterEvent } from "@frontend/Utils/UIEmitter";
import { hexToResource } from "@latticexyz/common";
// import { GameWindowLayout } from '../Views/GameWindowLayout';
import { useComponentValue } from "@latticexyz/react";
import {
  type Entity,
  getComponentValue,
  getComponentValueStrict,
  Has,
  runQuery,
} from "@latticexyz/recs";
import { encodeEntity, singletonEntity } from "@latticexyz/store-sync/recs";
import { useMUD } from "@mud/MUDContext";
import WalletButton from "@wallet/WalletButton";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { zeroAddress } from "viem";
import { useWalletClient } from "wagmi";

import { makeContractsAPI } from "../../Backend/GameLogic/ContractsAPI";
import {
  getEthConnection,
  loadDiamondContract,
} from "../../Backend/Network/Blockchain";
import { MythicLabelText } from "../Components/Labels/MythicLabel";
import { TerminalTextStyle } from "../Utils/TerminalTypes";
import { Terminal, type TerminalHandle } from "../Views/Terminal";

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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function GameLandingPage_v1() {
  const { contract } = useParams();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const queryParam = params.toString();
  const { data: walletClient } = useWalletClient();
  const {
    systemCalls: { getMsgSender },
    network: { walletClient: burnerWalletClient },
    components: components,
  } = useMUD();

  const syncProgress = useComponentValue(
    components.SyncProgress,
    singletonEntity,
    {
      message: "Connecting",
      percentage: 0,
      step: "Initialize",
      latestBlockNumber: 0n,
      lastBlockNumberProcessed: 0n,
    },
  );

  const syncSign = useMemo(() => {
    console.log(syncProgress);
    return syncProgress.step === "live" && syncProgress.percentage == 100;
  }, [syncProgress]);

  const mainAccount = walletClient?.account?.address ?? zeroAddress;
  const gameAccount = burnerWalletClient.account.address ?? zeroAddress;
  const contractAddress = contract ? address(contract) : address(zeroAddress);

  const topLevelContainer = useRef<HTMLDivElement>(null);
  const terminalHandle = useRef<TerminalHandle>(null);
  // const miniMapRef = useRef<MiniMapHandle>();

  // const [gameManager, setGameManager] = useState<GameManager | undefined>();
  // const gameUIManagerRef = useRef<GameUIManager | undefined>();
  const [ethConnection, setEthConnection] = useState<
    EthConnection | undefined
  >();

  const [
    terminalVisible,
    // setTerminalVisible
  ] = useState(true);
  const [
    initRenderState,
    // setInitRenderState
  ] = useState(InitRenderState.NONE);
  const [step, setStep] = useState(TerminalPromptStep.NONE);

  const [browserCompatibleState, setBrowserCompatibleState] =
    useState<BrowserCompatibleState>("unknown");

  const [browserIssues, setBrowserIssues] = useState<Incompatibility[]>([]);
  // const [isMiniMapOn, setMiniMapOn] = useState(false);
  // const [spectate, setSpectate] = useState(false);
  const [spectate, setSpectate] = useState(false);

  useEffect(() => {
    getEthConnection()
      .then((ethConnection) => setEthConnection(ethConnection))
      .catch((e) => {
        alert("error connecting to blockchain");
        console.log(e);
      });
  }, []);

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
    [mainAccount],
  );

  const advanceStateFromSpectating = useCallback(
    async (terminal: React.MutableRefObject<TerminalHandle | null>) => {
      try {
        if (!ethConnection) {
          throw new Error("not logged in");
        }

        setSpectate(true);
        // setMiniMapOn(false);
        console.log("specatate:", spectate);
        // console.log("isMiniMapOn:", isMiniMapOn);

        setStep(TerminalPromptStep.FETCHING_ETH_DATA);
      } catch (e) {
        console.error(e);
        setStep(TerminalPromptStep.ERROR);
        terminal.current?.print(
          "Network under heavy load. Please refresh the page, and check ",
          TerminalTextStyle.Red,
        );
        terminal.current?.printLink(
          BLOCK_EXPLORER_URL,
          () => {
            window.open(BLOCK_EXPLORER_URL);
          },
          TerminalTextStyle.Red,
        );
        terminal.current?.println("");
        return;
      }
    },
    [ethConnection, spectate],
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
        case step === TerminalPromptStep.SPECTATING:
          advanceStateFromSpectating(terminal);
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

  const showNamespace = () => {
    console.log("--------- [TEST] NamespaceOwner ---------");
    const { NamespaceOwner } = components;
    console.log(NamespaceOwner);

    for (const entity of NamespaceOwner.entities()) {
      console.log("-------------------");
      console.log(entity);
      console.log(hexToResource(entity as `0x${string}`).namespace);
      const res = getComponentValue(NamespaceOwner, entity);
      console.log(res);
      console.log(res?.owner);
    }
  };

  const testContractsAPI = async () => {
    if (!ethConnection) {
      throw new Error("not logged in");
    }
    showNamespace();

    const contractsAPI = await makeContractsAPI({
      connection: ethConnection,
      contractAddress,
      components,
    });
    const playerMap = contractsAPI.getPlayers();
    console.log(playerMap);
  };

  const testWorker = () => {
    const worker = new Worker(new URL("./test.work.ts", import.meta.url), {
      type: "module",
    });

    worker.postMessage(34);

    worker.onmessage = (event) => {
      console.log("Worker return data:", event.data);
    };
  };

  const testPlayer = async () => {
    const { Player } = components;
    console.log(Player);

    const msgSender = await getMsgSender();
    console.log("msg sender");
    console.log(msgSender);
  };

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
      {!syncSign && (
        <div>
          step: {syncProgress.step} percent: {syncProgress.percentage} %
        </div>
      )}

      {syncSign && (
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
          <BrowserIssues
            issues={browserIssues}
            state={browserCompatibleState}
          />
          <div>
            <p>Contract: {contract}</p>
            <p>Location: {location.pathname}</p>
            <p>Search: {queryParam}</p>
            <p> Main Account: {mainAccount}</p>
            <p> Game Account: {gameAccount}</p>
            <br />
          </div>

          <div>
            <button onClick={testContractsAPI}> Test Contracts API</button>
          </div>

          <div>
            <button onClick={testWorker}> Test Worker</button>
          </div>

          <div>
            <button onClick={testPlayer}> Test Player</button>
          </div>
          <Terminal
            ref={terminalHandle}
            promptCharacter={">"}
            visible={browserCompatibleState === "supported"}
            useCaretElement={initRenderState !== InitRenderState.COMPLETE}
          />
        </TerminalWrapper>
      )}
      <div ref={topLevelContainer}></div>
    </Wrapper>
  );
}
