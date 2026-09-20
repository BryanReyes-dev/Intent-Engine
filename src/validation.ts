import type { IntentResult, IntentSchema } from "./types.js";

export function validateIntentResult(
  schema: IntentSchema,
  value: unknown,
): IntentResult {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Intent provider returned an invalid result.");
  }

  const record = value as Record<string, unknown>;
  const schemaKeys = Object.keys(schema);
  const resultKeys = Object.keys(record);

  for (const key of schemaKeys) {
    if (!(key in record)) {
      throw new Error(
        `Intent provider result is missing schema field "${key}".`,
      );
    }

    const field = record[key];

    if (
      typeof field !== "object" ||
      field === null ||
      Array.isArray(field)
    ) {
      throw new Error(
        `Intent provider result field "${key}" must be an object.`,
      );
    }

    const fieldRecord = field as Record<string, unknown>;

    if (
      !Array.isArray(fieldRecord.source) ||
      !fieldRecord.source.every(
        (source): source is string => typeof source === "string",
      )
    ) {
      throw new Error(
        `Intent provider result field "${key}.source" must be a string array.`,
      );
    }

    if (
      typeof fieldRecord.confidence !== "number" ||
      !Number.isFinite(fieldRecord.confidence) ||
      fieldRecord.confidence < 0 ||
      fieldRecord.confidence > 1
    ) {
      throw new Error(
        `Intent provider result field "${key}.confidence" must be a number between 0 and 1.`,
      );
    }
  }

  for (const key of resultKeys) {
    if (!(key in schema)) {
      throw new Error(
        `Intent provider result contains unexpected field "${key}".`,
      );
    }
  }

  return value as IntentResult;
}