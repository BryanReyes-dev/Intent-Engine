import type { IntentResult, IntentSchema } from "./types.js";

export class IntentEngine {
  async extract(
    schema: IntentSchema,
    _input: string,
  ): Promise<IntentResult> {
    // Provider-backed extraction will be implemented in a later milestone.
    const result: IntentResult = {};

    for (const key in schema) {
      result[key] = {
        source: ["unknown"],
        confidence: 0,
      };
    }

    return result;
  }
}
