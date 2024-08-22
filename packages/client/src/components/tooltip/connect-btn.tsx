import { Network } from "lucide-react";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export const ConnectBtn = () => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");
        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    className="btn btn-secondary btn-sm rounded"
                    onClick={openConnectModal}
                    type="button"
                  >
                    Connect Wallet
                  </button>
                );
              }
              if (chain.unsupported) {
                return (
                  <button
                    className="btn btn-error btn-sm rounded"
                    onClick={openChainModal}
                    type="button"
                  >
                    Wrong network
                  </button>
                );
              }
              return (
                <div className="flex items-center rounded bg-zinc-900/25">
                  <div className="tooltip tooltip-bottom" data-tip={chain.name}>
                    <button
                      onClick={openChainModal}
                      className="btn btn-square btn-secondary btn-sm rounded"
                      type="button"
                    >
                      <Network width={16} height={16} />
                    </button>
                  </div>
                  <button
                    onClick={openAccountModal}
                    className="btn btn-sm relative rounded"
                    type="button"
                  >
                    <span className="text-sm">{account.displayName}</span>
                    {account.displayBalance ? (
                      <span className="text-nowrap rounded-sm bg-secondary px-1 py-0.5 text-xs text-black">
                        {account.displayBalance}
                      </span>
                    ) : (
                      ""
                    )}
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};
