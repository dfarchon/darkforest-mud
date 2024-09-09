import { Providers } from "@wallet/Providers";
import mudConfig from "contracts/mud.config";
import ReactDOM from "react-dom/client";

import { App } from "./App";
import { MUDProvider } from "./mud/MUDContext";
import { setup } from "./mud/setup";

const rootElement = document.getElementById("react-root");
if (!rootElement) {
  throw new Error("React root not found");
}
const root = ReactDOM.createRoot(rootElement);

// TODO: figure out if we actually want this to be async or if we should render something else in the meantime
setup().then(async (result) => {
  root.render(
    <MUDProvider value={result}>
      <Providers>
        <App />
      </Providers>
    </MUDProvider>,
  );

  // https://vitejs.dev/guide/env-and-mode.html
  if (import.meta.env.DEV) {
    const { mount: mountDevTools } = await import("@latticexyz/dev-tools");
    mountDevTools({
      config: mudConfig,
      publicClient: result.network.publicClient,
      walletClient: result.network.walletClient,
      latestBlock$: result.network.latestBlock$,
      storedBlockLogs$: result.network.storedBlockLogs$,
      worldAddress: result.network.worldContract.address,
      worldAbi: result.network.worldContract.abi,
      write$: result.network.write$,
      recsWorld: result.network.world,
    });
  }
});
