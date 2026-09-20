import type { IntentSchema } from "./types.js";

export type IntentJsonSchema = {
  type: "object";
  properties: Record<string, unknown>;
  required: string[];
  additionalProperties: false;
};

export function createIntentJsonSchema(
  schema: IntentSchema,
): IntentJsonSchema {
  const properties: Record<string, unknown> = {};
  const required = Object.keys(schema);

  for (const [key, description] of Object.entries(schema)) {
    properties[key] = {
      type: "object",
      description,
      properties: {
        source: {
          type: "array",
          items: {
            type: "string",
          },
        },
        confidence: {
          type: "number",
          minimum: 0,
          maximum: 1,
        },
      },
      required: ["source", "confidence"],
      additionalProperties: false,
    };
  }

  return {
    type: "object",
    properties,
    required,
    additionalProperties: false,
  };
}
