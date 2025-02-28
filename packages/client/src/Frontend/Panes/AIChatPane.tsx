import type { GameManager } from "@backend/GameLogic/GameManager";
import { getPlanetName } from "@df/procedural";
import {
  type ArtifactId,
  type LocationId,
  ModalName,
  type Planet,
  type WorldCoords,
} from "@df/types";
import { Btn } from "@frontend/Components/Btn";
import { predictTokenCost } from "@frontend/Utils/AI-Chat-PredictCost";
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";

import { Spacer } from "../Components/CoreUI";
import { TextInput } from "../Components/Input";
import { useAccount, usePlayer, useUIManager } from "../Utils/AppHooks";
import {
  clearChatHistoryFromIndexedDB,
  loadConversationFromIndexedDB,
  saveMessageToIndexedDB,
} from "../Utils/IndexedDB-ChatMemory";
import { ModalPane } from "../Views/ModalPane";
import { CurrencyView } from "./AIChatTokensBar";
import { LevelFilter } from "./LevelFilter";
const API_URL = import.meta.env.VITE_AI_API_URL;
const PLANET_LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

const AIChatContent = styled.div`
  width: 500px;
  height: 600px;
  overflow-y: scroll;
  display: flex;
  flex-direction: column;
`;

const ChatMessage = styled.div<{ isUser: boolean }>`
  margin-bottom: 10px;
  padding: 10px;
  border-radius: 5px;
  background-color: ${(props) => (props.isUser ? "#ffffff" : "#2c2f33")};
  color: ${(props) => (props.isUser ? "#000000" : "#f5f5f5")};
  align-self: ${(props) => (props.isUser ? "flex-end" : "flex-start")};
  border: 1px solid ${(props) => (props.isUser ? "#e0e0e0" : "#4a4a4d")};
  box-shadow: ${(props) =>
    props.isUser
      ? "0px 4px 8px rgba(255, 255, 255, 0.2)"
      : "0px 4px 8px rgba(0, 0, 0, 0.2)"};
`;

const AIAgentContent = styled.div`
  width: 550px;
  height: 600px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const MultiLineTextInput = styled.textarea`
  width: 100%;
  height: calc(1.5em * 12 + 10px); /* 6 lines with padding */
  padding: 8px;
  resize: none; /* Prevent resizing */
  border: 1px solid #777;
  border-radius: 5px;
  font-size: 1rem;
  background-color: #151515;
  color: #bbbbbb;
  box-sizing: border-box;
  line-height: 1.5;
  overflow-y: auto; /* Add scrolling for large inputs */
`;

const AgentResponseContainer = styled.div`
  flex: 0 0 30%; /* Flex shorthand to enforce fixed height of 30% */
  max-height: 30%; /* Ensure it doesn't exceed 30% */
  background-color: #2c2f33;
  color: rgba(
    255,
    255,
    255,
    0.8
  ); /* Slightly brighter text for better readability */
  padding: 10px;
  border: 1px solid #4a4a4d;
  border-radius: 5px;
  margin-bottom: 16px;
  overflow-y: auto;
  box-sizing: border-box; /* Ensures padding doesn't add to height */
`;

function HelpContent() {
  return (
    <div>
      <p>
        {" "}
        Chat with AI Sophon, your intelligent assistant and agent in the Dark
        Forest universe.{" "}
      </p>{" "}
      <Spacer height={8} />{" "}
      <p>
        {" "}
        Ask questions, plan strategies, or dive into the game's lore and
        mechanics with ease.{" "}
      </p>{" "}
      <Spacer height={12} />{" "}
      <p>
        {" "}
        To use the AI Sophon Agent, start by selecting the top-left corner of
        your desired range using "Start Range Selection." Then, select the
        bottom-right corner on the map. Planets within this range will be
        automatically filtered and included in the input prompt.{" "}
      </p>{" "}
      <Spacer height={8} />{" "}
      <p>
        {" "}
        Additionally, you can use the planet level filter bar to pre-select your
        desired planet levels for more precise results.{" "}
      </p>
    </div>
  );
}
// PUNK! for fun - could be setup in option
const speak = (text: string) => {
  if ("speechSynthesis" in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US"; // Set language (change as needed)
    utterance.pitch = 0; // Range: 0 to 2 - 1.5 / 0 / 1
    utterance.rate = 0.6; // Range: 0.1 to 10 - 0.7 / 0 / 0.75
    utterance.voice = speechSynthesis.getVoices()[0]; // Choose a specific voice 1 / 0 / 2
    speechSynthesis.speak(utterance);
  } else {
    console.error("Speech synthesis not supported in this browser.");
  }
};
//speak("hello, how are you today?");
export function AIChatPane({
  visible,
  onClose,
  gameManager,
}: {
  visible: boolean;
  onClose: () => void;
  gameManager: GameManager;
}) {
  const uiManager = useUIManager();
  const account = useAccount(uiManager);
  const player = usePlayer(uiManager).value;

  const [activeTab, setActiveTab] = useState<"chat" | "agent">("chat");
  const [selectedRange, setSelectedRange] = useState<{
    begin: WorldCoords | null;
    end: WorldCoords | null;
  }>({ begin: null, end: null });

  const [planetsCount, setPlanetsCount] = useState<number>(0);
  const [planetsFilteredCount, setPlanetsFilteredCount] = useState<number>(0);
  const [selectedPlanets, setSelectedPlanets] = useState<Planet[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<number[]>([
    3, 4, 5, 6, 7, 8, 9,
  ]); // Default to 3-9 (all levels)
  const [predictedCost, setPredictedCost] = useState<{
    aItokens: number;
    cost: number;
    credits: number;
  }>({
    aItokens: 0,
    cost: 0,
    credits: 0,
  });
  const [agentResponse, setAgentResponse] = useState<string>(""); // For AIAgentContent
  const [isSelectionActive, setIsSelectionActive] = useState<boolean>(false);
  const [input, setInput] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<
    { message: string; isUser: boolean }[]
  >([]);

  const [temp, setTemp] = useState(true);

  // Initilized if visible
  useEffect(() => {
    if (visible && temp) {
      const initializeChat = async () => {
        const history = await loadConversationFromIndexedDB();

        if (history && history.length === 0) {
          try {
            const response = await fetch(`${API_URL}/api/conversation/start`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                username: player?.name,
                message: "Hello!",
                indexedHistory: history.map((h) => h.message).join("\n"),
              }),
            });

            if (response.ok) {
              const aiResponse = await response.json();

              const aiMessage = { message: aiResponse, isUser: false };
              setChatHistory((prev) => [...prev, aiMessage]);
              saveMessageToIndexedDB(aiMessage);
            }
          } catch (error) {
            console.error("Error starting chat:", error);
          }
        } else if (history && history.length > 0) {
          const loadChatHistory = async () => {
            const historyIndexedDB = await loadConversationFromIndexedDB();
            setChatHistory(historyIndexedDB || []);
          };
          loadChatHistory();
        }
      };

      const intializeSelectedRange = async () => {
        const aiZone = JSON.parse(localStorage.getItem("aiselectedRange"));
        if (!aiZone) {
          return;
        }
        setSelectedRange({ begin: aiZone.begin, end: aiZone.end });
      };
      initializeChat();
      intializeSelectedRange();
      setTemp(false);
    }
    if (visible) {
      localStorage.setItem("iaselectedRangeVissible", "1");
    } else {
      localStorage.setItem("iaselectedRangeVissible", "0");
    }
  }, [visible]);
  // any change for selectedLevels, selectedRange, uiManager, gameManager, input
  // do a refresh of filtered planets per planet level filter bar & range selection
  useEffect(() => {
    if (selectedRange.begin && selectedRange.end) {
      const chunks = uiManager.getExploredChunks(); // Fetch explored chunks from the UI
      const chunksAsArray = Array.from(chunks);

      // Filter chunks within the selected range all planets in inpacted chunks
      const filteredChunks = chunksAsArray.filter((chunk) => {
        if (!chunk.chunkFootprint || !chunk.chunkFootprint.bottomLeft) {
          console.warn("Invalid chunk structure:", chunk);
          return false;
        }

        const chunkLeft = chunk.chunkFootprint.bottomLeft.x;
        const chunkRight = chunkLeft + chunk.chunkFootprint.sideLength;
        const chunkBottom = chunk.chunkFootprint.bottomLeft.y;
        const chunkTop = chunkBottom + chunk.chunkFootprint.sideLength;
        if (selectedRange.begin && selectedRange.end)
          return (
            chunkRight > selectedRange.begin.x &&
            chunkLeft < selectedRange.end.x &&
            chunkBottom < selectedRange.begin.y &&
            chunkTop > selectedRange.end.y
          );
      });

      // Generate planet hashes for the selected range only planets
      const planetData = filteredChunks.flatMap((chunk) =>
        chunk.planetLocations
          .filter((planet) => {
            if (selectedRange.begin && selectedRange.end) {
              const planetX = planet.coords.x;
              const planetY = planet.coords.y;

              return (
                planetX >
                  Math.min(selectedRange.begin.x, selectedRange.end.x) &&
                planetX <
                  Math.max(selectedRange.begin.x, selectedRange.end.x) &&
                planetY <
                  Math.max(selectedRange.begin.y, selectedRange.end.y) &&
                planetY > Math.min(selectedRange.begin.y, selectedRange.end.y)
              );
            }
            return false;
          })
          .map((planet) => ({
            hash: planet.hash,
            coords: planet.coords,
          })),
      );
      // Set selected planet count
      setPlanetsCount(planetData.length);

      // Filter planets by selected levels
      const filteredPlanets = gameManager
        .getPlanetsWithIds(planetData.map((planet) => planet.hash))
        .filter(
          (planet) =>
            planet.planetLevel >= Math.min(...selectedLevels) &&
            planet.planetLevel <= Math.max(...selectedLevels),
        );
      // Set filtered planets as selected planets
      setSelectedPlanets(filteredPlanets);
      // Set filtered planet count
      setPlanetsFilteredCount(filteredPlanets.length);
      // Transform planets for cost calculation
      const reducedPlanets = reducePlanets(filteredPlanets);
      const forCost = {
        username: player?.name,
        message: input,
        selectedPlanets: reducedPlanets,
      };
      // Repair issue with big number for JSON
      const stringForCost = JSON.stringify(forCost, (key, value) =>
        typeof value === "bigint" ? value.toString() : value,
      );

      //console.log("String:", stringForCost);
      // Predict cost for default input + selected filtered planets + msg input
      const predictedCost_ = predictTokenCost(stringForCost, "gpt-3.5-turbo");
      setPredictedCost(predictedCost_);
    }
  }, [selectedLevels, selectedRange, uiManager, gameManager, input]);

  // Function step by step for Btn Start Range selection and handlers
  const handleStartSelection = () => {
    // Set disable for btn
    setIsSelectionActive(true);
    // Reset the selected range before starting a new selection
    setSelectedRange({ begin: null, end: null });

    // Define the click handler for Start Range Selection
    const handleClick = (event: MouseEvent) => {
      const coords = uiManager.getHoveringOverCoords();
      if (coords) {
        setSelectedRange((prev) => {
          if (!prev.begin) {
            console.log("Begin coordinates set:", coords);
            const updatedRange = { ...prev, begin: coords };
            return updatedRange;
          } else if (!prev.end) {
            console.log("End coordinates set:", coords);
            const updatedRange = { ...prev, end: coords };
            // Call generatePlanetArray with the selected range once both begin and end are set
            if (updatedRange.begin && updatedRange.end) {
              console.log("Both begin and end are filled. Stopping listener.");
              window.removeEventListener("click", handleClick);
              localStorage.setItem(
                "aiselectedRange",
                JSON.stringify(updatedRange),
              );
              uiManager.getAIZones();
              const chunks = uiManager.getExploredChunks(); // Fetch explored chunks from the UI
              const chunksAsArray = Array.from(chunks);

              // Filter whole player map chunks
              const filteredChunks = chunksAsArray.filter((chunk) => {
                // Validate chunk structure
                if (!chunk.chunkFootprint || !chunk.chunkFootprint.bottomLeft) {
                  console.warn("Invalid chunk structure:", chunk);
                  return false;
                }

                const chunkLeft = chunk.chunkFootprint.bottomLeft.x;
                const chunkRight = chunkLeft + chunk.chunkFootprint.sideLength;
                const chunkBottom = chunk.chunkFootprint.bottomLeft.y;
                const chunkTop = chunkBottom + chunk.chunkFootprint.sideLength;
                if (updatedRange.begin && updatedRange.end)
                  return (
                    chunkRight >
                      Math.min(updatedRange.begin.x, updatedRange.end.x) &&
                    chunkLeft <
                      Math.max(updatedRange.begin.x, updatedRange.end.x) &&
                    chunkBottom <
                      Math.max(updatedRange.begin.y, updatedRange.end.y) &&
                    chunkTop >
                      Math.min(updatedRange.begin.y, updatedRange.end.y)
                  );
              });

              // Generate planet hashes for the selected range
              const planetData = filteredChunks.flatMap((chunk) =>
                chunk.planetLocations
                  .filter((planet) => {
                    if (updatedRange.begin && updatedRange.end) {
                      const planetX = planet.coords.x;
                      const planetY = planet.coords.y;

                      return (
                        planetX >
                          Math.min(updatedRange.begin.x, updatedRange.end.x) &&
                        planetX <
                          Math.max(updatedRange.begin.x, updatedRange.end.x) &&
                        planetY <
                          Math.max(updatedRange.begin.y, updatedRange.end.y) &&
                        planetY >
                          Math.min(updatedRange.begin.y, updatedRange.end.y)
                      );
                    }
                    return false;
                  })
                  .map((planet) => ({
                    hash: planet.hash,
                    coords: planet.coords,
                  })),
              );

              // console.log("Filtered Planet Hashes:", planetData);

              setPlanetsCount(planetData.length);

              // Fetch full planet data filtered by level filter bar
              const filteredPlanets = gameManager
                .getPlanetsWithIds(planetData.map((planet) => planet.hash))
                .filter(
                  (planet) =>
                    planet.planetLevel >= Math.min(...selectedLevels) &&
                    planet.planetLevel <= Math.max(...selectedLevels),
                );
              //     console.log("NOT-Filtered Planets:", planetsFullData);

              // console.log("Filtered Planets:", filteredPlanets);
              setSelectedPlanets(filteredPlanets);
              setPlanetsFilteredCount(filteredPlanets.length);

              // Transform planets for cost calculation
              const reducedPlanets = reducePlanets(filteredPlanets);
              // Buld forCost constant for prediction function
              const forCost = {
                username: player?.name,
                message: input,
                selectedPlanets: reducedPlanets,
              };

              const stringForCost = JSON.stringify(forCost, (key, value) =>
                typeof value === "bigint" ? value.toString() : value,
              );
              // console.log("String:", stringForCost);
              // Predict cost for default input + selected filtered planets + msg input
              const predictedCost_ = predictTokenCost(
                stringForCost,
                "gpt-3.5-turbo",
              );
              //console.log("Price:", predictedCost_);
              setPredictedCost(predictedCost_);
            }
            setIsSelectionActive(false);
            return updatedRange;
          }

          return prev;
        });
      }
    };

    console.log("Map selection started.");
    // Clean up any previous event listener before adding a new one
    window.removeEventListener("click", handleClick);
    window.addEventListener("click", handleClick);
  };

  // Btn Send AIchat Assistan Q.
  const handleSendChat = async () => {
    if (input.trim()) {
      const userMessage = { message: input, isUser: true };
      setChatHistory((prev) => [...prev, userMessage]);
      saveMessageToIndexedDB(userMessage);
      const history = await loadConversationFromIndexedDB();

      try {
        // Spend tokens and handle fetch within the same try block
        const responseSpendGPTTokens = await gameManager.spendGPTTokens(1);
        await responseSpendGPTTokens.confirmedPromise;

        const response = await fetch(`${API_URL}/api/conversation/step`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: player?.name,
            message: input,
            indexedHistory: history.map((h) => h.message).join("\n"),
          }),
        });

        if (response.ok) {
          const aiResponse = await response.json();
          const aiMessage = { message: aiResponse, isUser: false };
          setChatHistory((prev) => [...prev, aiMessage]);
          saveMessageToIndexedDB(aiMessage);
          speak(aiResponse);
        } else {
          console.error("Error fetching AI response:", response.statusText);
        }
      } catch (error) {
        console.error("Error in AI chat process:", error);
      } finally {
        setInput(""); // Clear input regardless of outcome
      }
    }
  };

  // Btn Clear AIchat history
  const handleClearChat = async () => {
    try {
      await clearChatHistoryFromIndexedDB();
      setChatHistory([]);
    } catch (error) {
      console.error("Error clearing chat history:", error);
    }
  };
  // Function to reduce the selectedPlanets to minized chat tokens needs
  function reducePlanets(selectedPlanets: Planet[]) {
    return selectedPlanets.map((planet) => [
      planet.locationId,
      getPlanetName(planet), // Extract name using the provided function
      planet.isHomePlanet ? 1 : 0,
      //planet.syncedWithContract ? 1 : 0,
      //planet.perlin,
      planet.owner === "0x0000000000000000000000000000000000000000"
        ? "0x0"
        : planet.owner, // Simplify owner field
      planet.ownerName === "0x0000000000000000000000000000000000000000"
        ? "0x0"
        : gameManager.getPlayer(planet.owner)?.name || "", // Simplify owner field
      planet.spaceType,
      planet.planetType,
      planet.planetLevel,
      planet.universeZone,
      planet.distSquare,
      planet.range,
      planet.speed,
      planet.defense,
      planet.energy.toFixed(0),
      planet.energyCap,
      planet.energyGrowth,
      planet.silver.toFixed(0),
      planet.silverCap,
      planet.silverGrowth,
      planet.upgradeState,
      // planet.lastUpdated,
      // planet.isInContract ? 1 : 0,
      planet.coordsRevealed ? 1 : 0,
      //planet.silverSpent,
      planet.bonus.map((b) => (b ? 1 : 0)),
      planet.energyGroDoublers,
      planet.silverGroDoublers,
      planet.hasTriedFindingArtifact ? 1 : 0,
      planet.heldArtifactIds,
      planet.destroyed ? 1 : 0,
      // planet.frozen ? 1 : 0,
      planet.effects,
      planet.flags,
      planet.transactions,
      planet.location.coords.x,
      planet.location.coords.y,
      // planet.location.hash,
      // planet.location.perlin,
      // planet.location.biomebase,
      planet.biome,
      // planet.loadingServerState ? 1 : 0,
      // planet.needsServerRefresh ? 1 : 0,
    ]);
  }

  // Btn Send AIAgent request
  const handleAgentSend = async () => {
    if (input.trim()) {
      const reducedPlanets = reducePlanets(selectedPlanets);

      try {
        const forCost = {
          username: player?.name,
          message: input,
          selectedPlanets: reducedPlanets,
        };

        const stringForCost = JSON.stringify(forCost, (key, value) =>
          typeof value === "bigint" ? value.toString() : value,
        );

        const predictedCost_ = predictTokenCost(stringForCost, "gpt-3.5-turbo");

        // Spend tokens and handle fetch within the same try block
        const responseSpendGPTTokens = await gameManager.spendGPTTokens(
          predictedCost_.credits,
        );
        await responseSpendGPTTokens.confirmedPromise;
      } catch (error) {
        console.error("Error sending message tokens not spend:", error);
        setAgentResponse("Error sending message tokens not spend.");
        return;
      }

      try {
        const stringReducedPlanets = JSON.stringify(
          reducedPlanets,
          (key, value) =>
            typeof value === "bigint" ? value.toString() : value,
        );
        const response = await fetch(`${API_URL}/api/agent/agent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: player?.name,
            ownerAddress: player?.address,
            message: input,
            selectedPlanets: stringReducedPlanets,
          }),
        });

        if (response.ok) {
          const { aiResponse } = await response.json();
          // Validate and filter df_fcName and args
          console.log("response:", aiResponse);
          const { df_fcName, args } = aiResponse;
          if (!df_fcName || !Array.isArray(args)) {
            console.error(
              "Invalid AI response: missing function name or arguments.",
            );
            setAgentResponse(
              "The agent's response was invalid. Please try again.",
            );
            return;
          }

          // Client-side execution of the validated function
          try {
            executeClientFunction(df_fcName, args);
          } catch (error) {
            console.error(
              ` Error executing client function: ${df_fcName}`,
              error,
            );
            setAgentResponse(
              ` An error occurred while executing the function: ${df_fcName}.`,
            );
          }
        } else {
          console.error("Failed to fetch agent response:", response.statusText);
          setAgentResponse("The server failed to process your request.");
        }
      } catch (error) {
        console.error("Error in AIAgentContent:", error);
        setAgentResponse("An error occurred while processing your request.");
      } finally {
        //setInput(""); // Clear input regardless of outcome
      }
    } else {
      setAgentResponse("Put some input msg Sophon agent!");
    }
  };

  /**
   * Executes a client function based on the agent's response.
   * @param {string} functionName - The name of the client function to call.
   * @param {any[]} args - The arguments to pass to the function.
   */
  const executeClientFunction = (functionName: string, args: never[]) => {
    const clientFunctions: Record<string, (...args: never[]) => void> = {
      move: (
        arg1: LocationId,
        arg2: LocationId,
        arg3: number | string,
        arg4: number | string,
        arg5: ArtifactId | undefined,
        arg6: boolean,
      ) => {
        // Example implementation
        // from.locationId, to.locationId, forces, silver, artifact?.id, abandoning,
        // arg1 , arg2 , arg3, arg4, arg5, arg6

        if (arg5 == "null" || arg5 == "0") {
          arg5 = undefined;
        }
        if (arg3 == typeof "string") {
          arg3 = Number(arg3);
        }
        if (arg4 == typeof "string") {
          arg4 = Number(arg4);
        }
        const agentAnswer = `Moving from ${getPlanetName(gameManager.getPlanetWithId(arg1))} to ${getPlanetName(gameManager.getPlanetWithId(arg2))} with forces: ${arg3} silver: ${arg4} artID: ${arg5} abandoning: ${arg6}`;
        setAgentResponse(agentAnswer);
        //speak(agentAnswer);
        gameManager.move(arg1, arg2, Number(arg3), Number(arg4), arg5, false);
      },
      revealLocation: (arg1: LocationId) => {
        const agentAnswer = `Revealing location: ${getPlanetName(gameManager.getPlanetWithId(arg1))}`;
        setAgentResponse(agentAnswer);
        //speak(agentAnswer);
        gameManager.revealLocation(arg1);
      },
      upgrade: (arg1: LocationId, arg2: number) => {
        const agentAnswer = `Upgrading planet ${getPlanetName(gameManager.getPlanetWithId(arg1))} with branch ${arg2}`;
        setAgentResponse(agentAnswer);
        // speak(agentAnswer);
        gameManager.upgrade(arg1, arg2);
      },
      upgradePlanet: (arg1: LocationId, arg2: number) => {
        const agentAnswer = `Upgrading planet ${getPlanetName(gameManager.getPlanetWithId(arg1))} with branch ${arg2}`;
        setAgentResponse(agentAnswer);
        // speak(agentAnswer);
        gameManager.upgrade(arg1, arg2);
      },
      setPlanetEmoji: (arg1: LocationId, arg2: string) => {
        const agentAnswer = `Setting emoji ${arg2} for location ${getPlanetName(gameManager.getPlanetWithId(arg1))}`;
        setAgentResponse(agentAnswer);
        gameManager.setPlanetEmoji(arg1, arg2);
      },
      withdrawSilver: (arg1: LocationId, arg2: number) => {
        const agentAnswer = `Withdrawing ${arg2} silver from ${getPlanetName(gameManager.getPlanetWithId(arg1))}`;
        setAgentResponse(agentAnswer);
        //speak(agentAnswer);
        gameManager.withdrawSilver(arg1, arg2);
      },
      refreshPlanet: (arg1: LocationId) => {
        const agentAnswer = `Refreshing planet ${arg1}`;
        setAgentResponse(agentAnswer);
        gameManager.refreshPlanet(arg1);
      },
    };

    if (functionName in clientFunctions) {
      clientFunctions[functionName](...args);
    } else {
      throw new Error(`Function ${functionName} is not defined.`);
    }
  };

  // Btn Clear AIAGent history
  const handleAgentTabOpen = () => {
    setAgentResponse(""); // Clear agent response when switching to the Agent tab
  };

  if (!account || !player) return null;

  return (
    <ModalPane
      id={ModalName.AIChat}
      title={"AI Sophons"}
      visible={visible}
      onClose={onClose}
      helpContent={HelpContent}
    >
      <div className="mb-4 flex items-center justify-between">
        <Btn
          onClick={() => {
            setActiveTab("chat");
          }}
          disabled={activeTab === "chat"}
        >
          AI Assistant
        </Btn>
        {/* Add AIRangeOfMap to the header for range selection */}

        <Btn
          onClick={() => {
            setActiveTab("agent");
            handleAgentTabOpen();
          }}
          disabled={activeTab === "agent"}
        >
          AI Agent
        </Btn>
      </div>
      {activeTab === "chat" ? (
        <AIChatContent>
          {chatHistory.map((message, index) => (
            <ChatMessage key={index} isUser={message.isUser}>
              {message.message}
            </ChatMessage>
          ))}
          <Spacer height={16} />
          <TextInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message here..."
          />
          <div className="flex items-center justify-between p-2">
            <Btn onClick={handleSendChat}>Send</Btn>
            <Btn onClick={handleClearChat}>Clear</Btn>
          </div>
        </AIChatContent>
      ) : (
        <AIAgentContent>
          <div>
            <div className="flex items-center justify-between">
              {/* Column 1: Begin and End Text */}
              <div className="flex flex-col items-start justify-center">
                <Btn
                  onClick={handleStartSelection}
                  disabled={isSelectionActive}
                >
                  Start Range Selection
                </Btn>
              </div>

              {/* Column 2: Button Centered */}
              <div className="flex flex-col items-center justify-center p-1">
                <div>
                  Begin:{" "}
                  {selectedRange.begin
                    ? `(${selectedRange.begin.x}, ${selectedRange.begin.y})`
                    : "Not Set. Click #1"}
                </div>
                <div>
                  End:{" "}
                  {selectedRange.end
                    ? `(${selectedRange.end.x}, ${selectedRange.end.y})`
                    : "Not Set. Click #2"}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div> Selected Planets: {planetsCount} </div>{" "}
              <div>
                {" "}
                Cost: {predictedCost.cost.toFixed(8)} ChatTokens:
                {predictedCost.aItokens.toFixed(0)} Credits:
                {predictedCost.credits.toFixed(0)}{" "}
              </div>
              <div> Filtered Planets: {planetsFilteredCount} </div>
            </div>

            <LevelFilter
              levels={PLANET_LEVELS}
              selectedLevels={selectedLevels}
              onSelectLevel={(levels) => {
                setSelectedLevels(levels);
              }}
            />
          </div>
          <MultiLineTextInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter a command or query for the agent..."
          />
          <div className="flex items-center justify-between p-2">
            <Btn onClick={handleAgentSend}>Send</Btn>
            <Btn onClick={() => setAgentResponse("")}>Clear</Btn>
          </div>
          <AgentResponseContainer>
            {agentResponse || "No response yet. Please enter a message."}
          </AgentResponseContainer>
        </AIAgentContent>
      )}
      <CurrencyView />
    </ModalPane>
  );
}
