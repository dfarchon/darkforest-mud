import type { NetworkHealthSummary } from "@df/types";

/**
 * The Dark Forest webserver keeps track of network health, this function loads that information
 * from the webserver.
 */
export async function loadNetworkHealth(): Promise<NetworkHealthSummary> {
  if (!import.meta.env.VITE_WEBSERVER_URL) {
    return [];
  }

  const result = await fetch(
    `${import.meta.env.VITE_WEBSERVER_URL}/network-health`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    },
  ).then((x) => x.json());

  return result as NetworkHealthSummary;
}
