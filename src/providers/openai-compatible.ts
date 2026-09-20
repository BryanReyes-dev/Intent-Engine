import type { IntentResult } from "../types.js";
import type {
  IntentProvider,
  IntentProviderRequest,
} from "./types.js";
import { createIntentJsonSchema } from "../schema.js";

export type OpenAICompatibleProviderOptions = {
  baseUrl: string;
  model: string;
  apiKey?: string;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

export class OpenAICompatibleProvider implements IntentProvider {
  constructor(
    private readonly options: OpenAICompatibleProviderOptions,
  ) {}

  async extract(
    request: IntentProviderRequest,
  ): Promise<IntentResult> {
    const response = await fetch(
      `${this.options.baseUrl.replace(/\/$/, "")}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.options.apiKey
            ? { Authorization: `Bearer ${this.options.apiKey}` }
            : {}),
        },
        body: JSON.stringify({
          model: this.options.model,
          messages: [
            {
              role: "system",
              content:
                "Extract the requested intent dimensions from the user's input. Return only valid JSON matching the requested structure.",
            },
            {
              role: "user",
              content: JSON.stringify({
                schema: request.schema,
                input: request.input,
              }),
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
                name: "intent_result",
                strict: true,
                schema: createIntentJsonSchema(request.schema),
            },
        },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Intent provider request failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as ChatCompletionResponse;

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Intent provider returned no content.");
    }

    try {
      return JSON.parse(content) as IntentResult;
    } catch {
      throw new Error("Intent provider returned invalid JSON.");
    }
  }
}
