import { ModalName } from "@df/types";
// import { Document } from "@langchain/core/documents";
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
// import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { useEffect, useState } from "react";
import styled from "styled-components";

import { Spacer } from "../Components/CoreUI";
import { TextInput } from "../Components/Input";
import {
  AI_BOOK_TEXT,
  AI_BOT_CHARACTER,
  AIChatGameConfig,
} from "../Utils/AI-Chat-Constants";
import { useAccount, usePlayer, useUIManager } from "../Utils/AppHooks";
import {
  clearChatHistoryFromIndexedDB,
  loadConversationFromIndexedDB,
  saveMessageToIndexedDB,
} from "../Utils/IndexedDB-ChatMemory";
import { ModalPane } from "../Views/ModalPane";

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
  background-color: ${(props) =>
    props.isUser
      ? "#ffffff"
      : "#2c2f33"}; /* Bright white for user, dark gray for AI */
  color: ${(props) =>
    props.isUser
      ? "#000000"
      : "#f5f5f5"}; /* Black for user, light gray for AI */
  align-self: ${(props) => (props.isUser ? "flex-end" : "flex-start")};
  border: 1px solid ${(props) => (props.isUser ? "#e0e0e0" : "#4a4a4d")}; /* Subtle border for differentiation */
  box-shadow: ${(props) =>
    props.isUser
      ? "0px 4px 8px rgba(255, 255, 255, 0.2)"
      : "0px 4px 8px rgba(0, 0, 0, 0.2)"}; /* Subtle shadow for depth */
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
  const [qaModel, setQaModel] = useState<ChatOpenAI | null>(null);
  const [charPrompt, setCharPrompt] = useState<PromptTemplate | null>(null);

  const handleClearChat = async () => {
    try {
      await clearChatHistoryFromIndexedDB();
      console.log("Chat history cleared successfully.");
      setChatHistory([]);
    } catch (error) {
      console.error("Error clearing chat history:", error);
    }
  };

  useEffect(() => {
    const initializeAI = async () => {
      // const embeddings = new OpenAIEmbeddings({
      //   apiKey: import.meta.env.VITE_OPENAI_API_KEY, // Your OpenAI API key
      //   model: "text-embedding-ada-002",
      //   batchSize: 512,
      //   configuration: {
      //    baseUrl: "https://dfares.notion.site/Final-Version-126a4dc2343380278789c15d206e5016";
      //   }
      // });

      // const embeddings = new OpenAIEmbeddings({
      //   apiKey: import.meta.env.VITE_OPENAI_API_KEY, // Your OpenAI API key
      //   modelName: "text-embedding-ada-002", // Default embedding model
      // });

      // const memoryStore = new MemoryVectorStore(embeddings);

      // const documents = [
      //   new Document({
      //     pageContent: AI_BOOK_TEXT.DecentralizedGame,
      //     metadata: { source: "pink-book-DecentralizedGame" },
      //   }),
      //   new Document({
      //     pageContent: AI_BOOK_TEXT.ExploreForgotten,
      //     metadata: { source: "pink-book-ExploreForgotten" },
      //   }),
      // ];

      // const documents = [
      //   new Document({
      //     pageContent: AIChatGameConfig,
      //     metadata: { source: "game-config" },
      //   }),
      // ];

      // // Add documents to the vector store
      // await memoryStore.addDocuments(documents);

      const model = new ChatOpenAI({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
        model: "gpt-3.5-turbo",
        temperature: 0.7,
        maxTokens: 100,
        maxRetries: 3,
      });

      // DEFINE DEFAULT PROMT FOR CHARACTER
      const prompt = PromptTemplate.fromTemplate(AI_BOT_CHARACTER.chatPrompt);

      setCharPrompt(prompt);
      setQaModel(model);
    };

    const loadChatHistory = async () => {
      const history = await loadConversationFromIndexedDB();
      setChatHistory(history || []);
    };

    loadChatHistory();
    initializeAI();
  }, []);

  const handleSend = async () => {
    if (input.trim() && qaModel && charPrompt) {
      const userMessage = { message: input, isUser: true };
      setChatHistory((prev) => [...prev, userMessage]);
      saveMessageToIndexedDB(userMessage);
      // Prepare the chat history context
      const formattedChatHistory = chatHistory
        .map((msg) => `${msg.isUser ? "User:" : "Sophon:"} ${msg.message}`)
        .join("\n");

      // Format the prompt dynamically
      const formattedPrompt = await charPrompt.format({
        chat_history: formattedChatHistory,
        gameConfig: AIChatGameConfig,
        customText: AI_BOOK_TEXT,
        user: player?.name,
        input,
      });

      try {
        // Invoke the model with the formatted prompt
        const response = await qaModel.invoke(formattedPrompt);

        const aiMessage = { message: response.text, isUser: false };
        setChatHistory((prev) => [...prev, aiMessage]);
        saveMessageToIndexedDB(aiMessage);
      } catch (error) {
        console.error("Error during model invocation:", error);
      }

      setInput("");
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
          <df-button onClick={handleSend}>Send</df-button>
          <df-button onClick={handleClearChat}>Clean</df-button>
        </div>
      </AIChatContent>
    </ModalPane>
  );
}
