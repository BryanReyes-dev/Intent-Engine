import type { IntentResult, IntentSchema, IntentValue } from "./types.js";

function isIntentValue(value: unknown): value is IntentValue | null {
  return value === null ||
    typeof value === "string" ||
    (typeof value === "number" && Number.isFinite(value)) ||
    typeof value === "boolean";
}

export function validateIntentResult(schema: IntentSchema, value: unknown): IntentResult {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Intent provider returned an invalid result.");
  }

  const record = value as Record<string, unknown>;

  for (const key of Object.keys(schema)) {
    if (!(key in record)) {
      throw new Error(`Intent provider result is missing schema field "${key}".`);
    }

    const field = record[key];
    if (typeof field !== "object" || field === null || Array.isArray(field)) {
      throw new Error(`Intent provider result field "${key}" must be an object.`);
    }

    const fieldRecord = field as Record<string, unknown>;

    if (!isIntentValue(fieldRecord.value)) {
      throw new Error(`Intent provider result field "${key}.value" must be a string, number, boolean, or null.`);
    }

    const allowedValues = schema[key]?.values;
    if (
      fieldRecord.value !== null &&
      allowedValues !== undefined &&
      !allowedValues.some((allowed) => Object.is(allowed, fieldRecord.value))
    ) {
      throw new Error(`Intent provider result field "${key}.value" is not one of the allowed values.`);
    }

    if (
      !Array.isArray(fieldRecord.source) ||
      !fieldRecord.source.every((source): source is string => typeof source === "string")
    ) {
      throw new Error(`Intent provider result field "${key}.source" must be a string array.`);
    }

    if (
      typeof fieldRecord.confidence !== "number" ||
      !Number.isFinite(fieldRecord.confidence) ||
      fieldRecord.confidence < 0 ||
      fieldRecord.confidence > 1
    ) {
      throw new Error(`Intent provider result field "${key}.confidence" must be a number between 0 and 1.`);
    }
  }

  for (const key of Object.keys(record)) {
    if (!(key in schema)) {
      throw new Error(`Intent provider result contains unexpected field "${key}".`);
    }
  }

  return value as IntentResult;
}
