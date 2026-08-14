import { createOpenAICompatible } from "npm:@ai-sdk/openai-compatible@1";

/**
 * Provider do Lovable AI Gateway para o AI SDK.
 * A chave nunca sai do servidor.
 */
export function createLovableAiGatewayProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "lovable-ai-gateway",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: {
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
  });
}
