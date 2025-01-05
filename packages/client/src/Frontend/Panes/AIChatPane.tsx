import type { GameManager } from "@backend/GameLogic/GameManager";
import { type ArtifactId, type LocationId, ModalName } from "@df/types";
import { Btn } from "@frontend/Components/Btn";
import { useEffect, useState } from "react";
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

const API_URL = import.meta.env.VITE_AI_API_URL;

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
      <p>Chat with Sophon, your AI assistant in the Dark Forest universe.</p>
      <Spacer height={8} />
      <p>
        Ask questions, strategize, or explore the game's lore and mechanics.
      </p>
    </div>
  );
}

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
  const [agentResponse, setAgentResponse] = useState<string>(""); // For AIAgentContent

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

      initializeChat();
      setTemp(false);
    }
  }, [visible]);
  // Btn Send AIchat question
  const handleSend = async () => {
    if (input.trim()) {
      const userMessage = { message: input, isUser: true };
      setChatHistory((prev) => [...prev, userMessage]);
      saveMessageToIndexedDB(userMessage);
      const history = await loadConversationFromIndexedDB();

      try {
        await uiManager.spendGPTTokens();
      } catch (error) {
        console.error("Error sending message tokens not spend:", error);
        return;
      }

      try {
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
        }
      } catch (error) {
        console.error("Error sending message:", error);
      }

      setInput("");
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
  // Btn Send AIAgent request
  const handleAgentSend = async () => {
    if (input.trim()) {
      try {
        const response = await fetch(`${API_URL}/api/agent/agent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: player?.name,
            message: input,
          }),
        });

        if (response.ok) {
          const { aiResponse } = await response.json();
          // Validate and filter df_fcName and args

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
              `Error executing client function: ${df_fcName}`,
              error,
            );
            setAgentResponse(
              `An error occurred while executing the function: ${df_fcName}.`,
            );
          }
        } else {
          console.error("Failed to fetch agent response:", response.statusText);
          setAgentResponse("The server failed to process your request.");
        }
      } catch (error) {
        console.error("Error in AIAgentContent:", error);
        setAgentResponse("An error occurred while processing your request.");
      }

      // setInput("");
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
        arg3: number,
        arg4: number,
        arg5: ArtifactId,
        arg6: boolean,
      ) => {
        // Example implementation
        // from.locationId, to.locationId, forces, silver, artifact?.id, abandoning,
        // arg1 , arg2 , arg3, arg4, arg5, arg6
        if (arg5 == "null" || arg5 == "0") {
          arg5 = null;
        }
        const agentAnswer = `Moving from ${arg1} to ${arg2} with forces: ${arg3} silver: ${arg4} artID: ${arg5} abandoning: ${arg6}`;
        setAgentResponse(agentAnswer);
        gameManager.move(arg1, arg2, arg3, arg4, arg5, arg6);
      },
      revealLocation: (arg1: LocationId) => {
        const agentAnswer = `Revealing location: ${arg1}`;
        setAgentResponse(agentAnswer);
        gameManager.revealLocation(arg1);
      },
      upgradePlanet: (arg1: LocationId, arg2: number) => {
        const agentAnswer = `Upgrading planet ${arg1} with branch ${arg2}`;
        setAgentResponse(agentAnswer);
        gameManager.upgrade(arg1, arg2);
      },
      setPlanetEmoji: (arg1: LocationId, arg2: string) => {
        const agentAnswer = `Setting emoji ${arg2} for location ${arg1}`;
        setAgentResponse(agentAnswer);
        gameManager.setPlanetEmoji(arg1, arg2);
      },
      withdrawSilver: (arg1: LocationId, arg2: number) => {
        const agentAnswer = `Withdrawing ${arg2} silver from ${arg1}`;
        setAgentResponse(agentAnswer);
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
      title={"AI Chat"}
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
          AI Chat
        </Btn>
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
            <Btn onClick={handleSend}>Send</Btn>
            <Btn onClick={handleClearChat}>Clear</Btn>
          </div>
        </AIChatContent>
      ) : (
        <AIAgentContent>
          <MultiLineTextInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter a command or query for the agent..."
          />
          <Spacer height={16} />
          <AgentResponseContainer>
            {agentResponse || "No response yet. Please enter a message."}
          </AgentResponseContainer>

          <div className="flex items-center justify-between p-2">
            <Btn onClick={handleAgentSend}>Send</Btn>
            <Btn onClick={() => setAgentResponse("")}>Clear</Btn>
          </div>
        </AIAgentContent>
      )}
      <CurrencyView />
    </ModalPane>
  );
}
