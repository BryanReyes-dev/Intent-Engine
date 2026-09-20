import test from "node:test";
import assert from "node:assert/strict";
import {
  IntentEngine,
  createIntentJsonSchema,
} from "../../dist/index.js";

const schema = {
  location: {
    field: "Where does the user want to live?",
    values: ["NYC", "Boston", "California"],
  },
  temperature: {
    field: "What temperature do they prefer?",
    values: [65, 70, 94],
  },
  reason: {
    field: "Why are they looking?",
  },
};

function createEngine(result) {
  return new IntentEngine({
    async extract() {
      return result;
    },
  });
}

test("generates canonical enum values and open-ended value schemas", () => {
  const jsonSchema = createIntentJsonSchema(schema);

  assert.deepEqual(jsonSchema.properties.location.properties.value.enum, [
    "NYC",
    "Boston",
    "California",
    null,
  ]);

  assert.deepEqual(
    jsonSchema.properties.temperature.properties.value.enum,
    [65, 70, 94, null],
  );

  assert.deepEqual(
    jsonSchema.properties.reason.properties.value.type,
    ["string", "number", "boolean", "null"],
  );

  assert.deepEqual(jsonSchema.required, [
    "location",
    "temperature",
    "reason",
  ]);

  assert.equal(jsonSchema.additionalProperties, false);
});

test("accepts valid canonical values, evidence, confidence, and null", async () => {
  const result = {
    location: {
      value: "Boston",
      source: ["preferably around Boston"],
      confidence: 0.96,
    },
    temperature: {
      value: 65,
      source: ["somewhere cold"],
      confidence: 0.91,
    },
    reason: {
      value: null,
      source: [],
      confidence: 0,
    },
  };

  const validated = await createEngine(result).extract(schema, "test input");

  assert.deepEqual(validated, result);
});

test("rejects a value outside the allowed canonical values", async () => {
  const result = {
    location: {
      value: "Seattle",
      source: ["Seattle"],
      confidence: 1,
    },
    temperature: {
      value: 65,
      source: ["cold"],
      confidence: 1,
    },
    reason: {
      value: "moving for work",
      source: ["moving for work"],
      confidence: 1,
    },
  };

  await assert.rejects(
    () => createEngine(result).extract(schema, "test input"),
    /location\.value.*allowed values/,
  );
});

test("rejects missing schema fields", async () => {
  const result = {
    location: {
      value: "Boston",
      source: ["Boston"],
      confidence: 1,
    },
    reason: {
      value: "moving for work",
      source: ["moving for work"],
      confidence: 1,
    },
  };

  await assert.rejects(
    () => createEngine(result).extract(schema, "test input"),
    /missing schema field "temperature"/,
  );
});

test("rejects unexpected fields", async () => {
  const result = {
    location: {
      value: "Boston",
      source: ["Boston"],
      confidence: 1,
    },
    temperature: {
      value: 65,
      source: ["cold"],
      confidence: 1,
    },
    reason: {
      value: "moving for work",
      source: ["moving for work"],
      confidence: 1,
    },
    extra: {
      value: "unexpected",
      source: [],
      confidence: 0,
    },
  };

  await assert.rejects(
    () => createEngine(result).extract(schema, "test input"),
    /unexpected field "extra"/,
  );
});

test("rejects invalid confidence values", async () => {
  const result = {
    location: {
      value: "Boston",
      source: ["Boston"],
      confidence: 1.1,
    },
    temperature: {
      value: 65,
      source: ["cold"],
      confidence: 1,
    },
    reason: {
      value: "moving for work",
      source: ["moving for work"],
      confidence: 1,
    },
  };

  await assert.rejects(
    () => createEngine(result).extract(schema, "test input"),
    /location\.confidence.*between 0 and 1/,
  );
});

test("rejects non-string evidence entries", async () => {
  const result = {
    location: {
      value: "Boston",
      source: ["Boston", 123],
      confidence: 1,
    },
    temperature: {
      value: 65,
      source: ["cold"],
      confidence: 1,
    },
    reason: {
      value: "moving for work",
      source: ["moving for work"],
      confidence: 1,
    },
  };

  await assert.rejects(
    () => createEngine(result).extract(schema, "test input"),
    /location\.source.*string array/,
  );
});
