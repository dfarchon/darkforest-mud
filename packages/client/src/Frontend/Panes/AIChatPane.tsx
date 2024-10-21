import { ModalName } from "@df/types";
import styled from "styled-components";
import { Spacer } from "../Components/CoreUI";
import { useAccount, usePlayer, useUIManager } from "../Utils/AppHooks";
import { ModalPane } from "../Views/ModalPane";

// Styled component for the main content area
const AIChatContent = styled.div`
  width: 500px;
  height: 600px;
  display: flex;
  flex-direction: column;
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
// Styled component for iframe
const ChatIframe = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
`;
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
  if (!account || !player) {
    return <></>;
  }
  return (
    <ModalPane
      id={ModalName.AIChat}
      title={"AI Chat"}
      visible={visible}
      onClose={onClose}
      helpContent={HelpContent}
    >
      <AIChatContent>
        <ChatIframe src="https://df-ai-chat.vercel.app/" />
      </AIChatContent>
    </ModalPane>
  );
}
