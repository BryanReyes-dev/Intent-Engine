import type { IntentProvider } from "./providers/types.js";
import type { IntentResult, IntentSchema } from "./types.js";
import { validateIntentResult } from "./validation.js";

export class IntentEngine {
  constructor(private readonly provider: IntentProvider) {}

  async extract(
    schema: IntentSchema,
    input: string,
  ): Promise<IntentResult> {
    const result = await this.provider.extract({
      schema,
      input,
    });

    return validateIntentResult(schema, result);
  }
}