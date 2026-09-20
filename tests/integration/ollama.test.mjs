import test from "node:test";
import assert from "node:assert/strict";
import {
  IntentEngine,
  OpenAICompatibleProvider,
} from "../../dist/index.js";

const provider = new OpenAICompatibleProvider({
  baseUrl: process.env.INTENT_ENGINE_BASE_URL ?? "http://127.0.0.1:11434/v1",
  model: process.env.INTENT_ENGINE_MODEL ?? "gemma4:26b",
});

const engine = new IntentEngine(provider);

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

const input =
  "I want somewhere cold, but still a busy city, preferably around Boston. I'm moving for work.";

test("maps natural language to schema values through Ollama", async () => {
  const result = await engine.extract(schema, input);

  console.log("\n");
  console.log("══════════════════════════════════════════════");
  console.log("INTENT ENGINE — OLLAMA INTEGRATION TEST");
  console.log("══════════════════════════════════════════════");

  console.log("\nSCHEMA");
  console.log(JSON.stringify(schema, null, 2));

  console.log("\nINPUT");
  console.log(JSON.stringify(input, null, 2));

  console.log("\nACTUAL OUTPUT");
  console.log(JSON.stringify(result, null, 2));

  assert.equal(result.location.value, "Boston");
  assert.equal(result.temperature.value, 65);
  assert.equal(result.reason.value, "moving for work");

  assert.ok(result.location.source.length > 0);
  assert.ok(result.temperature.source.length > 0);
  assert.ok(result.reason.source.length > 0);

  assert.ok(result.location.confidence >= 0);
  assert.ok(result.location.confidence <= 1);
  assert.ok(result.temperature.confidence >= 0);
  assert.ok(result.temperature.confidence <= 1);
  assert.ok(result.reason.confidence >= 0);
  assert.ok(result.reason.confidence <= 1);

  console.log("\nRESULT");
  console.log("✓ Schema mapping passed");
  console.log("✓ All values validated");
  console.log("══════════════════════════════════════════════\n");
});