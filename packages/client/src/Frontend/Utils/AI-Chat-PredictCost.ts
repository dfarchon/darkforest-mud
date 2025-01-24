// Utility file to estimate token costs

// Define pricing constants for OpenAI models
const TOKEN_COSTS = {
  "gpt-3.5-turbo": 0.0015, // Cost per 1,000 tokens in USD
  "gpt-4": 0.03, // Cost per 1,000 tokens in USD
};

/**
 * Approximates the number of tokens in a given text.
 * Assumes 1 token = ~4 characters (including spaces and punctuation).
 * @param text - The input text to estimate tokens for.
 * @returns The approximate number of tokens in the text.
 */
export function approximateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Predicts the cost of processing a text prompt for a given OpenAI model.
 * @param prompt - The text prompt to estimate cost for.
 * @param model - The OpenAI model to use ("gpt-3.5-turbo" or "gpt-4").
 * @returns An object containing the token count and estimated cost in USD.
 */
export function predictTokenCost(
  prompt: string,
  model: "gpt-3.5-turbo" | "gpt-4",
): { aItokens: number; cost: number; credits: number } {
  // Approximate the token count + default prompt length by AI server
  const aItokens = approximateTokenCount(prompt) + 2426;

  // Calculate the cost based on the model's per-token pricing
  const costPerToken = TOKEN_COSTS[model] / 1000; // Cost per token in USD
  const cost = aItokens * costPerToken * 1.2;
  const credits = Math.ceil(cost / 0.032); // USDC cost 0.00001ETH ~0.032 USDC
  return {
    aItokens,
    cost,
    credits,
  };
}
