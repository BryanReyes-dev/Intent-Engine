# Intent Engine

A schema-driven TypeScript library for mapping natural-language intent to canonical application values.

## Status

**0.2.0 — schema/value mapping release**

Intent Engine provides:

- A provider-agnostic intent engine.
- A schema where each field describes a dimension and can optionally define allowed canonical values.
- Natural-language interpretation through an inference provider.
- Canonical value mapping when allowed values are supplied.
- Open-ended values when a field does not define allowed values.
- Evidence/source text and provider-generated confidence for every field.
- Automatic JSON Schema generation for structured model output.
- Runtime validation of provider results.
- TypeScript declarations and an ESM package build.

The repository also contains unit tests and a real Ollama integration test. Test files are kept in the Git repository and are not included in the published npm package.

## Core concept

A developer defines the dimensions that matter to the application.

The `field` describes **what the dimension means**.

The optional `values` array defines the **canonical values the model is allowed to choose from**.

When `values` is omitted, the field is open-ended and the provider can infer a string, number, boolean, or `null` value.

```ts
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
```

The application can then pass natural-language input:

```ts
const result = await engine.extract(
  schema,
  "I want somewhere cold, but still a busy city, preferably around Boston. I'm moving for work.",
);
```

A provider can map natural language onto the application's canonical values:

```ts
{
  location: {
    value: "Boston",
    source: ["preferably around Boston"],
    confidence: 1,
  },
  temperature: {
    value: 65,
    source: ["I want somewhere cold"],
    confidence: 0.8,
  },
  reason: {
    value: "moving for work",
    source: ["I'm moving for work."],
    confidence: 1,
  },
}
```

This lets the application work with a stable vocabulary instead of handling every natural-language variation itself.

For example:

```text
"around Boston"
"near Boston"
"the Boston area"
```

can all map to the canonical value:

```text
Boston
```

Likewise, a schema can map concepts such as:

```text
"cold"       -> 65
"mild"       -> 70
"really hot" -> 94
```

The mapping is performed by the configured inference provider. Intent Engine validates that a provider never returns a non-null value outside the schema's allowed values.

## Result contract

Every requested field returns:

```ts
type IntentResult = Record<string, {
  value: string | number | boolean | null;
  source: string[];
  confidence: number;
}>;
```

### `value`

The interpreted value.

When a field has `values`, the value must be one of those canonical values or `null`.

When a field has no `values`, the value may be a string, number, boolean, or `null`.

`null` represents insufficient information or no usable value.

### `source`

The relevant evidence from the user's input.

The built-in integration test verifies that returned source entries are exact substrings of the original input.

### `confidence`

A provider-generated number from `0` to `1`.

Intent Engine validates the range, but does not claim that confidence is a calibrated statistical probability.

## Installation

```bash
npm install intent-engine
```

Intent Engine is published as an **ESM package**:

```ts
import {
  IntentEngine,
  OpenAICompatibleProvider,
} from "intent-engine";
```

The package has no runtime dependencies. TypeScript is used only as a development/build dependency.

## Built-in provider

### `OpenAICompatibleProvider`

The built-in provider targets an OpenAI-compatible chat-completions endpoint.

It sends requests to:

```text
POST {baseUrl}/chat/completions
```

and requires support for:

- `model`
- chat `messages`
- `response_format.type = "json_schema"`
- strict structured JSON output

Example with a local Ollama endpoint:

```ts
const provider = new OpenAICompatibleProvider({
  baseUrl: "http://127.0.0.1:11434/v1",
  model: "gemma4:26b",
});

const engine = new IntentEngine(provider);
```

The library does not install, start, download, or manage the model runtime.

"OpenAI-compatible" refers to the API protocol. The model itself can be a local or hosted model as long as the endpoint supports the required structured-output behavior.

## Architecture

```text
Application
    ↓
IntentEngine
    ↓
IntentProvider
    ↓
Inference API / Runtime
    ↓
Model
```

The core engine:

- accepts the developer-defined schema and user input;
- calls the configured provider;
- validates the provider's runtime result;
- returns a typed `IntentResult`.

The provider controls how inference is reached.

This keeps model/runtime infrastructure outside the core package.

## Custom provider

The package exports the `IntentProvider` interface so applications can use inference systems that do not fit the built-in provider.

```ts
import {
  IntentEngine,
  type IntentProvider,
} from "intent-engine";

const provider: IntentProvider = {
  async extract({ schema, input }) {
    // Call your own inference system.

    return {
      location: {
        value: "Boston",
        source: ["near Boston"],
        confidence: 0.9,
      },
      reason: {
        value: "moving for work",
        source: ["moving for work"],
        confidence: 0.95,
      },
    };
  },
};

const engine = new IntentEngine(provider);
```

The engine validates custom-provider output using the same rules as the built-in provider.

## Structured output and validation

Intent Engine converts the developer-defined schema into JSON Schema for providers that support structured output.

For fields with canonical values:

```ts
{
  values: ["NYC", "Boston", "California"]
}
```

the generated JSON Schema constrains `value` to those values plus `null`.

For open-ended fields, the generated value schema accepts:

```text
string
number
boolean
null
```

The runtime validator additionally requires:

- every schema field to be present;
- values with `values` to stay within the allowed set;
- `source` to be a string array;
- `confidence` to be a finite number from `0` through `1`;
- no unexpected result fields.

Malformed provider output causes `extract()` to reject instead of silently returning invalid data.

## Usage by environment

Intent Engine does not import Node-specific APIs in the runtime package and uses the runtime's global `fetch` only in the built-in HTTP provider.

That makes the package usable in environments such as:

- Node.js/server applications
- Browser applications
- Electron/desktop applications
- other JavaScript runtimes that provide `fetch`

Browser use still depends on the selected inference endpoint being reachable from the browser and on the application's authentication/CORS design.

For private hosted API credentials, keep provider authentication on the application's backend.

## Testing

### Unit tests

Run the library validation/schema tests:

```bash
npm test
```

These tests do not require a model.

### Ollama integration test

The repository includes a real end-to-end test using an Ollama OpenAI-compatible endpoint:

```bash
npm run test:ollama
```

By default it uses:

```text
baseUrl: http://127.0.0.1:11434/v1
model: gemma4:26b
```

You can override those values with environment variables.

The integration test prints the schema, input, and actual provider output, then verifies:

- canonical values;
- exact evidence matches;
- confidence ranges;
- runtime validation.

### Package check

Run:

```bash
npm run check
```

This runs the unit tests and then performs an npm package dry-run.

The published package is restricted by the `files` field in `package.json`:

```json
[
  "dist",
  "README.md",
  "LICENSE"
]
```

Repository tests and development files therefore remain available on GitHub without being included in the npm consumer package.

## Current public API

### `IntentEngine`

```ts
class IntentEngine {
  constructor(provider: IntentProvider);

  extract(
    schema: IntentSchema,
    input: string,
  ): Promise<IntentResult>;
}
```

### `IntentField`

```ts
type IntentField = {
  field: string;
  values?: readonly IntentValue[];
};
```

### `IntentSchema`

```ts
type IntentSchema = Record<string, IntentField>;
```

### `IntentValue`

```ts
type IntentValue = string | number | boolean;
```

### `IntentResult`

```ts
type IntentResult = Record<string, {
  value: IntentValue | null;
  source: string[];
  confidence: number;
}>;
```

### `IntentProvider`

```ts
type IntentProviderRequest = {
  schema: IntentSchema;
  input: string;
};

type IntentProvider = {
  extract(request: IntentProviderRequest): Promise<unknown>;
};
```

Providers return `unknown` at the abstraction boundary so the engine can validate actual runtime output.

### `OpenAICompatibleProvider`

```ts
type OpenAICompatibleProviderOptions = {
  baseUrl: string;
  model: string;
  apiKey?: string;
};
```

### `createIntentJsonSchema`

The package also exports:

```ts
createIntentJsonSchema(schema)
```

which converts an `IntentSchema` into the JSON Schema used by the built-in provider.

## Runtime responsibility boundary

Intent Engine provides:

```text
Schema
  ↓
IntentEngine
  ↓
IntentProvider
  ↓
Validated IntentResult
```

The application provides:

```text
Inference endpoint
Model runtime
Provider credentials
Deployment strategy
Environment-specific networking
```

There is no automatic model/runtime management in the package.

## Roadmap

Future work should be driven by real application needs and developer feedback.

Potential areas include:

- richer ambiguity/clarification behavior;
- timeout, retry, and cancellation controls;
- broader provider compatibility;
- batch extraction;
- streaming;
- observability;
- framework integrations.

These are possible future directions, not requirements of the current release.

## License

MIT
