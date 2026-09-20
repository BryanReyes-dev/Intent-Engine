import type { IntentField, IntentSchema } from "./types.js";

export type IntentJsonSchema = {
  type: "object";
  properties: Record<string, unknown>;
  required: string[];
  additionalProperties: false;
};

function createValueSchema(field: IntentField): Record<string, unknown> {
  if (field.values !== undefined) {
    return { enum: [...field.values, null] };
  }

  return { type: ["string", "number", "boolean", "null"] };
}

export function createIntentJsonSchema(schema: IntentSchema): IntentJsonSchema {
  const properties: Record<string, unknown> = {};
  const required = Object.keys(schema);

  for (const [key, definition] of Object.entries(schema)) {
    properties[key] = {
      type: "object",
      description: definition.field,
      properties: {
        value: createValueSchema(definition),
        source: { type: "array", items: { type: "string" } },
        confidence: { type: "number", minimum: 0, maximum: 1 },
      },
      required: ["value", "source", "confidence"],
      additionalProperties: false,
    };
  }

  return { type: "object", properties, required, additionalProperties: false };
}
