import { RECOMMENDED_MODAL_WIDTH } from "@df/constants";
import { ModalName } from "@df/types";
import React, { useState } from "react";

import { Btn } from "../Components/Btn";
import { Expand, Spacer } from "../Components/CoreUI";
import type { DarkForestTextInput } from "../Components/Input";
import { TextInput } from "../Components/Input";
import { TwitterLink } from "../Components/Labels/Labels";
import { LoadingSpinner } from "../Components/LoadingSpinner";
import { Red } from "../Components/Text";
import { usePlayer, useUIManager } from "../Utils/AppHooks";
import { ModalPane } from "../Views/ModalPane";
import { TabbedView } from "../Views/TabbedView";

export function TwitterVerifyPane({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const uiManager = useUIManager();
  const user = usePlayer(uiManager);
  const [twitterHandleInputValue, setTwitterHandleInputValue] =
    useState<string>("");
  const [verifying, setVerifying] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState(false);

  const onTwitterInputChange = (newHandle: string) => {
    setTwitterHandleInputValue(newHandle.replace("@", ""));
  };

  /**
   * Called when the user clicks on the 'tweet' button. Opens up a popup that prompts them to tweet
   * the required verification tweet from the account that they entered into the pane.
   */
  const onTweetClick = async () => {
    if (uiManager) {
      const tweetText = await uiManager.generateVerificationTweet(
        twitterHandleInputValue,
      );
      // const str = `Verify my @dfares v0.6 account (https://zkga.me):
      // ${tweetText}`;

      // PUNK need to change later
      // const str = `Verifying my DF ARES v0.1  account (https://dfares.xyz/)🩷\n @darkforest_eth Community Round hosted by @DFArchon: ${tweetText}`;
      // const str = `Verifying my DFAres v0.1 Round 3 account (https://dfares.xyz/)🩷\n @darkforest_eth community round hosted by @DFArchon \n ${tweetText}`;
      // const str = `A new chapter unfold here! https://dfmud.xyz (🦑,🪐)\n\n Dark Forest MUD is community-driven development of @darkforest_eth game on @mud_dev engine. \n Follow @darkforest_mud to get latest udpates !`;

      const str =
        `Dark Forest MUD (🦑,🪐) on @Base Mainnet!\n` +
        `Decentralized, space-themed RTS built on @mud_dev and zkSNARKs\n` +
        `@darkforest_eth community round\n\n` +
        `🔗 dfmud.xyz 🔗\n\n` +
        `👉 Follow @darkforest_mud for updates!\n\n` +
        `@GamingOnBase @jessepollak\n\n` +
        `#darkforest `;

      window.open(
        `https://twitter.com/intent/tweet?hashtags=darkforest&text=${encodeURI(str)}`,
      );
    }
  };

  /**
   * Called when the user clicks on the 'verify' button. Asks the webserver whether or not the given
   * twitter account tweeted the correct verification tweet. If that happened, sets the twitter
   * account internally.
   */
  const onVerifyClick = async () => {
    try {
      setVerifying(true);
      await uiManager?.verifyTwitter(twitterHandleInputValue);
    } catch (e) {
      setError(true);
    } finally {
      setVerifying(false);
    }
  };

  /**
   * Called when the user clicks the 'disconnect' button. Allows them to disconnect their account from twitter.
   */
  const onDisconnectClick = async () => {
    if (confirm("are you sure you want to disconnect your twitter?")) {
      try {
        setDisconnecting(true);
        await uiManager?.disconnectTwitter(twitterHandleInputValue);
      } catch (e) {
        setError(true);
      } finally {
        setDisconnecting(false);
      }
    }
  };

  return (
    <ModalPane
      id={ModalName.TwitterVerify}
      title="Share Game on Twitter"
      visible={visible}
      onClose={onClose}
      initialPosition={{ y: 100, x: window.innerWidth / 2 - 300 }}
      width={RECOMMENDED_MODAL_WIDTH}
    >
      {user.value !== undefined && user.value.twitter === undefined && (
        <TabbedView
          // tabTitles={["Tweet Proof", "Verify Tweet"]}
          tabTitles={["share game website on twitter"]}
          tabContents={(i: number) => {
            if (i === 0) {
              return (
                <>
                  {/* Tweet a signed message, proving account ownership! */}
                  Send a tweet on social media to invite your friends to join
                  the game .
                  <br />
                  Thank you so much !
                  <Spacer height={8} />
                  <TextInput
                    placeholder="Your Twitter handle"
                    value={twitterHandleInputValue}
                    onChange={(
                      e: Event & React.ChangeEvent<DarkForestTextInput>,
                    ) => onTwitterInputChange(e.target.value)}
                  />
                  <Spacer height={8} />
                  <Expand />
                  <Btn size="stretch" onClick={onTweetClick}>
                    Tweet
                  </Btn>
                </>
              );
            }

            if (i === 1) {
              return (
                <>
                  After tweeting, click the button below to verify ownership!
                  <Spacer height={8} />
                  <TextInput
                    placeholder="Your Twitter handle"
                    value={twitterHandleInputValue}
                    onChange={(
                      e: Event & React.ChangeEvent<DarkForestTextInput>,
                    ) => onTwitterInputChange(e.target.value)}
                  />
                  <Spacer height={8} />
                  <Expand />
                  {error && (
                    <>
                      <Spacer height={8} />
                      <Red>error verifying ownership</Red>
                    </>
                  )}
                  <Btn
                    size="stretch"
                    disabled={verifying}
                    onClick={onVerifyClick}
                  >
                    {verifying ? (
                      <LoadingSpinner initialText={"Verifying..."} />
                    ) : (
                      "Verify"
                    )}
                  </Btn>
                </>
              );
            }
          }}
        />
      )}

      {user.value !== undefined && user.value.twitter && (
        <>
          You are connected, <TwitterLink twitter={user.value.twitter} />. You
          can disconnect from twitter anytime by clicking the button below.
          <Spacer height={16} />
          <Btn
            size="stretch"
            disabled={disconnecting}
            onClick={onDisconnectClick}
          >
            {verifying ? (
              <LoadingSpinner initialText={"Disconnecting Twitter..."} />
            ) : (
              "Disconnect Twitter"
            )}
          </Btn>
        </>
      )}
    </ModalPane>
  );
}
