import { BLOCK_EXPLORER_URL } from "@df/constants";
import { ModalName } from "@df/types";
import React, { useEffect, useState } from "react";
import styled from "styled-components";

import { Btn } from "../Components/Btn";
import { Icon, IconType } from "../Components/Icons";
import { Green, Red, White } from "../Components/Text";
import { TextPreview } from "../Components/TextPreview";
import dfstyles from "../Styles/dfstyles";
import { useAccount, useUIManager } from "../Utils/AppHooks";
import { ModalPane } from "../Views/ModalPane";

const StyledOnboardingContent = styled.div`
  width: 36em;
  height: 32em;
  position: relative;
  color: ${dfstyles.colors.text};

  .btn {
    position: absolute;
    right: 0.5em;
    bottom: 0.5em;
  }

  .indent {
    margin-left: 1em;
  }

  & > p,
  & > div {
    margin: 1em 0;
  }

  & > div {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }
`;

const enum OnboardState {
  Money,
  Storage,
  Keys,
  Help,
  Finished,
}

function OnboardMoney({ advance }: { advance: () => void }) {
  const uiManager = useUIManager();
  const account = useAccount(uiManager);

  const explorerAddressLink = `${BLOCK_EXPLORER_URL}/address/${account}`;

  return (
    <StyledOnboardingContent>
      <p>
        Welcome to <Green>Dark Forest Ares</Green>!
      </p>
      <p>
        <Red>There is real money being transacted in-game!</Red> Game client
        have initialized a{" "}
        <a
          onClick={() =>
            window.open("https://github.com/austintgriffith/burner-wallet")
          }
        >
          burner wallet
        </a>{" "}
        for you.
        {/* and dripped 15c to it, courtesy of ${HOST_TEAM_NAME} Team, and ${BLOCKCHAIN_NAME}. */}
      </p>
      <p className="indent">
        Your burner wallet address is: <br />
        <White>
          <a onClick={() => window.open(explorerAddressLink)}>{account}</a>
        </White>
      </p>
      <p>
        This means that when you make moves on Dark Forest Ares,{" "}
        <White>
          {" "}
          you are authorizing the client to pay gas fees on your behalf
        </White>
        .
      </p>
      <p>
        To ensure the safety of your balance,{" "}
        <White>we require you to enable popups</White> so that all transactions
        may be confirmed by you. Note that you can disable popups for small
        transactions in settings. <Icon type={IconType.Settings} />
      </p>
      <p>
        <White>
          Make sure you understand all of the above before proceeding.
        </White>
      </p>

      <div>
        <span></span>
        <Btn className="btn" onClick={advance}>
          I understand, please proceed.
        </Btn>
      </div>
    </StyledOnboardingContent>
  );
}

function OnboardStorage({ advance }: { advance: () => void }) {
  return (
    <StyledOnboardingContent>
      <p>
        The game stores important information like your{" "}
        <White>private key</White>, <White>home coordinates</White>, and{" "}
        <White>map data</White> in your browser&apos;s local storage / cache.{" "}
        <Red>If you clear your browser history, you risk losing your data!</Red>
      </p>
      <p>
        Your <White>private key and home coordinates</White> act as your
        password. You can use them to access your Dark Forest Ares account on
        other browsers, or to continue playing if you accidentally clear local
        storage. But this also means{" "}
        <Red>they should never be viewed by anyone else!</Red>
      </p>
      <p>
        <White>Make sure you back them up</White> and keep them somewhere safe.
      </p>
      <p>
        On the next page, you will be able to view and copy your private key and
        home coordinates.{" "}
        <White>When you are ready to back them up, please proceed.</White>
      </p>
      <div>
        <span></span>
        <Btn className="btn" onClick={advance}>
          Proceed
        </Btn>
      </div>
    </StyledOnboardingContent>
  );
}
function OnboardKeys({ advance }: { advance: () => void }) {
  const uiManager = useUIManager();
  const [sKey, setSKey] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (!uiManager) {
      return;
    }
    setSKey(uiManager.getPrivateKey());
  }, [uiManager]);

  const [home, setHome] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (!uiManager) {
      return;
    }
    const coords = uiManager.getHomeCoords();
    setHome(coords ? `(${coords.x}, ${coords.y})` : "");
  }, [uiManager]);

  return (
    <StyledOnboardingContent>
      <p>
        Your private key is: <br />
        <TextPreview
          text={sKey}
          focusedWidth={"150px"}
          unFocusedWidth={"150px"}
        />
        <span style={{ color: "pink" }}>
          {" "}
          {" <= click here to copy the private key"}
        </span>
      </p>
      <p>
        Your home coordinates are: <br />
        <White>{home}</White>
      </p>

      <p>When you have backed up your key and coordinates, please proceed.</p>

      <div>
        <span></span>
        <Btn onClick={advance} className="btn">
          Proceed
        </Btn>
      </div>
    </StyledOnboardingContent>
  );
}

function OnboardHelp({ advance }: { advance: () => void }) {
  return (
    <StyledOnboardingContent>
      <p>
        For an overview of how to play, rules, and scoring, click the question
        mark icon on the left to open the <White>Help Pane</White>.
      </p>
      <div>
        <span></span>
        <Btn onClick={advance} className="btn">
          Proceed
        </Btn>
      </div>
    </StyledOnboardingContent>
  );
}

function OnboardFinished({ advance }: { advance: () => void }) {
  return (
    <StyledOnboardingContent>
      <p>That&apos;s all! You&apos;re now ready to play the game!</p>
      <p>
        We invite you to log into the universe. Click <White>Proceed</White> to
        join the world of <White>DARK FOREST ARES...</White>
      </p>
      <div>
        <span></span>
        <Btn onClick={advance} className="btn">
          Proceed
        </Btn>
      </div>
    </StyledOnboardingContent>
  );
}

export default function OnboardingPane({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [onboardState, setOnboardState] = useState<OnboardState>(
    OnboardState.Money,
  );

  const advance = () => setOnboardState((x) => x + 1);

  useEffect(() => {
    if (onboardState === OnboardState.Finished + 1) {
      onClose();
    }
  }, [onboardState, onClose]);

  return (
    <ModalPane
      id={ModalName.Onboarding}
      title={"Welcome to Dark Forest Ares"}
      hideClose
      visible={visible}
      onClose={onClose}
    >
      {onboardState === OnboardState.Money && (
        <OnboardMoney advance={advance} />
      )}
      {onboardState === OnboardState.Storage && (
        <OnboardStorage advance={advance} />
      )}
      {onboardState === OnboardState.Keys && <OnboardKeys advance={advance} />}
      {onboardState === OnboardState.Help && <OnboardHelp advance={advance} />}
      {onboardState === OnboardState.Finished && (
        <OnboardFinished advance={advance} />
      )}
    </ModalPane>
  );
}
