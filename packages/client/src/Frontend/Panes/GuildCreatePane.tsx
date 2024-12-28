import { TOKEN_NAME } from "@df/constants";
import { weiToEth } from "@df/network";
import { Setting } from "@df/types";
import { BigNumber } from "ethers";
import React, { useEffect, useState } from "react";
import styled from "styled-components";

import { Btn } from "../Components/Btn";
import { Spacer } from "../Components/CoreUI";
import type { DarkForestTextInput } from "../Components/Input";
import { TextInput } from "../Components/Input";
import { LoadingSpinner } from "../Components/LoadingSpinner";
import { Sub } from "../Components/Text";
import { useAccount, usePlayer, useUIManager } from "../Utils/AppHooks";
import { useEmitterValue } from "../Utils/EmitterHooks";
import { useBooleanSetting } from "../Utils/SettingsHooks";

const GuildCreateContent = styled.div`
  width: 600px;
  /* height: 300px; */
  overflow-y: scroll;
  display: flex;
  flex-direction: column;

  /* text-align: justify; */
  margin-top: 1em;
  margin-left: 1em;
  margin-right: 1em;
`;

const StyledGuildCreatePane = styled.div`
  & > div {
    display: flex;
    flex-direction: row;
    justify-content: space-between;

    &:last-child > span {
      margin-top: 1em;
      text-align: center;
      flex-grow: 1;
    }

    &.margin-top {
      margin-top: 0.5em;
    }
  }
`;

type SetNumberFunction = (value: number) => void;
type SetStateFunction = (value: string) => void;

export function GuildCreatePane({
  setSelectedGuildId,
  setActiveFrame,
}: {
  setSelectedGuildId: SetNumberFunction;
  setActiveFrame: SetStateFunction;
}) {
  const uiManager = useUIManager();
  const gameManager = uiManager.getGameManager();
  const account = useAccount(uiManager);
  const player = usePlayer(uiManager).value;

  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [guildCreateFee, setGuildCreateFee] = useState<number | undefined>(
    undefined,
  );
  const [guildNameText, setGuildNameText] = useState("");

  const [savedSettingValue, setSavedSettingValue] = useState(false);
  const [settingValue, setSettingValue] = useBooleanSetting(
    uiManager,
    Setting.DisableDefaultShortcuts,
  );

  const balanceEth = weiToEth(
    useEmitterValue(
      uiManager.getEthConnection().myBalance$,
      BigNumber.from("0"),
    ),
  );

  const getGuildCreateFee = () => {
    const guildCreateFee = gameManager.getGuildCreateFee();
    return weiToEth(BigNumber.from(guildCreateFee));
  };

  const checkGuild = (): boolean => {
    if (!account) return false;
    const guildId = gameManager.getPlayerGuildId(account);
    return guildId === undefined;
  };

  const checkEth = (): boolean => {
    if (guildCreateFee === undefined) return false;
    return balanceEth >= guildCreateFee;
  };

  const handleKeyDown = () => {
    console.log("handle key down");
    console.log(settingValue);
    setSettingValue(true);
    console.log("become true");
  };

  const handleKeyUp = () => {
    console.log("handle key up");
    console.log(savedSettingValue);
    setSettingValue(savedSettingValue);
  };

  const handleCreateGuild = async () => {
    setIsProcessing(true);
    try {
      await gameManager.createGuild(guildNameText);
    } catch (err) {
      console.error("Error creating guild: " + err);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const fee = getGuildCreateFee();
        setGuildCreateFee(fee);
      } catch (err) {
        console.error("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    setSavedSettingValue(settingValue);
  }, []);

  if (!account || !player) return <></>;

  if (loading) return <LoadingSpinner initialText={"Loading..."} />;

  let buttonContent = <></>;

  if (isProcessing) {
    buttonContent = <LoadingSpinner initialText="Processing..." />;
  } else if (!checkEth()) {
    buttonContent = <div> {"Not Enough " + TOKEN_NAME}</div>;
  } else if (!checkGuild()) {
    buttonContent = <div> {"Already in other guild"}</div>;
  } else {
    buttonContent = <div>{"Create Guild"}</div>;
  }

  return (
    <GuildCreateContent>
      <StyledGuildCreatePane>
        <div>
          <Sub> Player GuildId: </Sub>
          <span>
            {gameManager.getPlayerGuildId(account) === undefined
              ? "n/a"
              : gameManager.getPlayerGuildId(account)}
          </span>
        </div>
        <div>
          <Sub> Creation Cost: </Sub>
          <span>
            {guildCreateFee} ${TOKEN_NAME}
          </span>
        </div>

        <div>
          <Sub>Current Balance: </Sub>
          <span>
            {balanceEth} ${TOKEN_NAME}
          </span>
        </div>

        <div>
          <span>
            <TextInput
              placeholder="Guild Name"
              value={guildNameText ?? ""}
              onKeyDown={handleKeyDown}
              onKeyUp={handleKeyUp}
              onChange={(e: Event & React.ChangeEvent<DarkForestTextInput>) => {
                setGuildNameText(e.target.value);
              }}
            />
          </span>
          <Btn
            onClick={handleCreateGuild}
            disabled={!(checkGuild() && checkEth())}
          >
            {buttonContent}
          </Btn>
        </div>

        {!checkGuild() && (
          <div>
            <Btn
              size="large"
              onClick={() => {
                setSelectedGuildId(gameManager.getPlayerGuildId(account));
                console.log(gameManager.getPlayerGuildId(account));
                setActiveFrame("detail");
              }}
            >
              Jump to My Guild 🌸
            </Btn>
          </div>
        )}
        <Spacer height={8} />
      </StyledGuildCreatePane>
    </GuildCreateContent>
  );
}
