import { ModalName } from "@df/types";
import { useState } from "react";
import styled from "styled-components";

import Button from "../Components/Button";
import { Spacer } from "../Components/CoreUI";
import { TextInput } from "../Components/Input";
import { useAccount, usePlayer, useUIManager } from "../Utils/AppHooks";
import { ModalPane } from "../Views/ModalPane";

// Styled component for the main content area
const AIChatContent = styled.div`
  width: 500px;
  height: 600px;
  overflow-y: scroll;
  display: flex;
  flex-direction: column;
`;

// Styled component for chat messages
const ChatMessage = styled.div`
  margin-bottom: 10px;
  padding: 5px;
  border-radius: 5px;
  background-color: #f0f0f0;
`;

// Help content component
function HelpContent() {
  return (
    <div>
      <p>Chat with AI assistant.</p>
      <Spacer height={8} />
      <p>Ask questions or get help with game strategies.</p>
    </div>
  );
}

// Main AIChatPane component
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

  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState<string[]>([]);

  if (!account || !player) {
    return <></>;
  }

  // Handler for sending messages
  const handleSend = () => {
    if (input.trim()) {
      // TODO: Implement actual AI chat API call here
      setChatHistory([...chatHistory, `You: ${input}`]);
      setInput("");
    }
  };

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
          <ChatMessage key={index}>{message}</ChatMessage>
        ))}
        <Spacer height={16} />
        <TextInput
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message here..."
        />
        <Spacer height={8} />
        <Button onClick={handleSend}>Send</Button>
      </AIChatContent>
    </ModalPane>
  );
}
