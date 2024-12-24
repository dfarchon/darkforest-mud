import { ModalName } from "@df/types";
import { Btn } from "@frontend/Components/Btn";
import { LoadingSpinner } from "@frontend/Components/LoadingSpinner";
import dfstyles from "@frontend/Styles/dfstyles";
import { type Entity, getComponentValue } from "@latticexyz/recs";
import { useMUD } from "@mud/MUDContext";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { zeroAddress } from "viem";
import { useWalletClient } from "wagmi";

import { Spacer } from "../Components/CoreUI";
import { TextInput } from "../Components/Input";
import { Blue, Green, Red, Sub, White } from "../Components/Text";
import { useAccount, usePlayer, useUIManager } from "../Utils/AppHooks";
import {
  clearChatHistoryFromIndexedDB,
  loadConversationFromIndexedDB,
  saveMessageToIndexedDB,
} from "../Utils/IndexedDB-ChatMemory";
import { ModalPane } from "../Views/ModalPane";

const API_URL = import.meta.env.VITE_AI_API_URL;

// Styled component for Currency View
const CurrencyViewContainer = styled(Sub)`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

export function CurrencyView() {
  const {
    network: { playerEntity, waitForTransaction },
    components: components, //{ SyncProgress },
  } = useMUD();
  const { data: walletClient } = useWalletClient();
  const { GPTTokens } = components;

  const currentGptCredits =
    getComponentValue(GPTTokens, playerEntity)?.amount || 0;

  const currentCreditPrice = 0.001;

  const isBuyingCredits = false;

  const [buyAmount, _setBuyAmount] = useState(5);
  const buyMore = false;

  return (
    <CurrencyViewContainer>
      <span>
        You have{" "}
        {currentGptCredits === 0 ? (
          <Red>0</Red>
        ) : (
          <Green>{currentGptCredits.toString()}</Green>
        )}{" "}
        credits
      </span>
      <span>
        for Price: <Green>{currentCreditPrice.toString()} ETH each</Green>
      </span>
      <Btn onClick={buyMore} disabled={isBuyingCredits}>
        {isBuyingCredits ? (
          <LoadingSpinner initialText="buying credits..." />
        ) : (
          <span>Buy {buyAmount} Credits</span>
        )}
      </Btn>
    </CurrencyViewContainer>
  );
}

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
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const uiManager = useUIManager();
  const account = useAccount(uiManager);
  const player = usePlayer(uiManager).value;

  const [input, setInput] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<
    { message: string; isUser: boolean }[]
  >([]);

  const [temp, setTemp] = useState(true);
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

  const handleSend = async () => {
    if (input.trim()) {
      const userMessage = { message: input, isUser: true };
      setChatHistory((prev) => [...prev, userMessage]);
      saveMessageToIndexedDB(userMessage);
      try {
        const response = await fetch(`${API_URL}/api/conversation/step`, {
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

  const handleClearChat = async () => {
    try {
      await clearChatHistoryFromIndexedDB();
      setChatHistory([]);
    } catch (error) {
      console.error("Error clearing chat history:", error);
    }
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
      <CurrencyView />
    </ModalPane>
  );
}
