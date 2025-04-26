export async function fetchArtifacts(marketplaceAddress: string) {
  try {
    let allArtifacts = [];
    let nextParams = "";

    do {
      const apiUrl = `https://base.blockscout.com/api/v2/tokens/${marketplaceAddress}/instances${nextParams ? "?" + nextParams : ""}`;

      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error("Base API fetch failed");

      const result = await response.json();
      if (!result.items) break; // no more items

      // 0x83F67792A72B0b2dF543318162362f71376c08af
      allArtifacts = allArtifacts.concat(
        result.items
          .filter(
            (token: never) =>
              token.owner?.hash?.toLowerCase() !==
              "0x83f67792a72b0b2df543318162362f71376c08af",
          )
          .map((token: never) => ({
            tokenId: token.id,
            owner: token.owner?.hash || "...",
            metadata: token.metadata || {},
          })),
      );

      if (result.next_page_params) {
        // build next params from response
        const params = new URLSearchParams(result.next_page_params).toString();
        nextParams = params;
      } else {
        nextParams = ""; // stop
      }
    } while (nextParams);

    return allArtifacts;
  } catch (error) {
    console.error("Failed to fetch all artifacts:", error);
    return [];
  }
}

export async function fetchOwnedArtifacts(
  marketplaceAddress: string,
  owner: string,
) {
  try {
    let artifacts = [];
    let nextParams = `holder_address_hash=${owner}`;

    while (nextParams) {
      const apiUrl = `https://base.blockscout.com/api/v2/tokens/${marketplaceAddress}/instances?${nextParams}`;
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error("Blockscout API fetch failed");

      const result = await response.json();
      if (!result.items) break;

      artifacts = artifacts.concat(
        result.items.map((token: never) => ({
          tokenId: token.id,
          owner: token.owner.hash || "...",
          metadata: token.metadata || {},
        })),
      );

      if (result.next_page_params) {
        const { holder_address_hash, unique_token } = result.next_page_params;
        nextParams = `holder_address_hash=${holder_address_hash}&unique_token=${unique_token}`;
      } else {
        nextParams = null;
      }
    }

    return artifacts;
  } catch (error) {
    console.error("Failed to fetch owned artifacts completely:", error);
    return [];
  }
}

export async function fetchOnSaleArtifacts(marketplaceAddress: string) {
  //   const data = await publicClient.readContract({
  //     address: marketplaceAddress,
  //     abi: ABI,
  //     functionName: "getOnSaleArtifacts",
  //   });
  //   return data;
}

export async function buyArtifact(
  marketplaceAddress: string,
  artifactId: number,
) {
  //   const tx = await walletClient.writeContract({
  //     address: marketplaceAddress,
  //     abi: ABI,
  //     functionName: "buyArtifact",
  //     args: [artifactId],
  //     value: BigInt(0), // or artifact price if needed
  //   });
  //   return tx;

  return;
}
