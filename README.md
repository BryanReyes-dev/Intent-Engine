# Intent Engine

A schema-driven TypeScript library for extracting structured intent from natural-language input.

## Status

**0.1.0 — publishable baseline**

Intent Engine now contains a working provider abstraction, an OpenAI-compatible provider, structured JSON output generation, provider-result validation, and a stable public API.

The package has been verified to:

* Build successfully from source.
* Produce an npm package archive.
* Load successfully from a separate consumer project using plain HTML, CSS, and JavaScript.
* Perform real intent extraction using a local Ollama model through its OpenAI-compatible API.
* Validate the returned structure against the developer-defined intent schema.

The package does not require Ollama specifically. The provider layer is designed so different inference runtimes and APIs can be used behind the same developer-facing engine.

## Core concept

Developers define the dimensions that matter to their application:

```ts
const schema = {
  location: "Where does the user want to live?",
  feeling: "How should the home feel?",
};
```

They provide an inference provider and pass natural-language input to the engine:

```ts
import {
  IntentEngine,
  OpenAICompatibleProvider,
} from "intent-engine";

const provider = new OpenAICompatibleProvider({
  baseUrl: "http://127.0.0.1:11434/v1",
  model: "gemma4:26b",
});

const engine = new IntentEngine(provider);

const result = await engine.extract(
  schema,
  "I want to live somewhere close to the city, but I want my home to be quiet and peaceful.",
);

console.log(result);
```

A provider-backed extraction returns one result for each requested intent dimension:

```ts
{
  location: {
    source: ["close to the city"],
    confidence: 1,
  },
  feeling: {
    source: ["quiet and peaceful"],
    confidence: 1,
  },
}
```

The `source` field contains the text identified as relevant to the requested dimension.

The `confidence` field is a provider-generated confidence value between `0` and `1`. Intent Engine validates that the value is within that range, but does not currently claim that it represents a calibrated statistical probability.

## Package architecture

The package is intentionally split into a core engine and a provider layer:

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

The core engine is responsible for the intent-extraction workflow and validating provider output.

The provider is responsible for communicating with the inference system and returning structured data.

The current architecture includes:

```text
IntentEngine
    ↓
IntentProvider
    ↓
OpenAICompatibleProvider
    ↓
OpenAI-compatible API
    ↓
Model
```

An OpenAI-compatible endpoint may point to a hosted service or a local runtime such as Ollama.

Intent Engine itself does not manage or bundle a model runtime. The application using the package is responsible for providing an appropriate inference source.

Future providers can implement the same `IntentProvider` interface without changing the core engine API.

## Structured output

Intent Engine converts the developer-defined `IntentSchema` into a JSON Schema representation.

The OpenAI-compatible provider uses that schema when requesting structured model output.

The core engine then validates the returned result to ensure that:

* Every requested schema field is present.
* No unexpected fields are returned.
* Each field contains a `source` string array.
* Each field contains a finite `confidence` number.
* Each confidence value is between `0` and `1`.

Invalid provider output causes the extraction request to fail rather than silently returning malformed intent data.

## Installation

```bash
npm install intent-engine
```

## Build from source

```bash
npm install
npm run build
```

To run the package checks, including the build and npm package validation:

```bash
npm run check
```

## Current public API

### `IntentEngine`

Creates the main extraction engine using an application-provided provider.

```ts
class IntentEngine {
  constructor(provider: IntentProvider);

  extract(
    schema: IntentSchema,
    input: string,
  ): Promise<IntentResult>;
}
```

### `IntentProvider`

The provider abstraction used by `IntentEngine`.

```ts
type IntentProviderRequest = {
  schema: IntentSchema;
  input: string;
};

type IntentProvider = {
  extract(request: IntentProviderRequest): Promise<unknown>;
};
```

Providers return `unknown` at the abstraction boundary so that the core engine can validate the provider's actual runtime output.

### `OpenAICompatibleProvider`

A provider for inference endpoints exposing an OpenAI-compatible chat-completions API.

```ts
const provider = new OpenAICompatibleProvider({
  baseUrl: "http://127.0.0.1:11434/v1",
  model: "gemma4:26b",
});
```

An API key can be supplied for services that require authentication:

```ts
const provider = new OpenAICompatibleProvider({
  baseUrl: "https://example.com/v1",
  model: "example-model",
  apiKey: "your-api-key",
});
```

### `IntentSchema`

A developer-defined map of intent dimensions to natural-language descriptions.

```ts
type IntentSchema = {
  [key: string]: string;
};
```

Example:

```ts
const schema = {
  location: "Where does the user want to live?",
  feeling: "How should the home feel?",
  budget: "What budget does the user imply?",
};
```

### `IntentResult`

The structured result returned after provider extraction and validation.

```ts
type IntentResult = {
  [key: string]: {
    source: string[];
    confidence: number;
  };
};
```

## Browser and application usage

Intent Engine is designed to work as a normal npm package and does not depend on Node-specific APIs.

It can therefore be consumed by different JavaScript environments, provided that the selected provider and runtime support the required APIs.

For browser applications, provider authentication should generally be handled by the application's backend rather than exposing private API credentials directly in browser code.

A typical web architecture is:

```text
Browser
    ↓
Application Backend
    ↓
Intent Engine
    ↓
Provider
    ↓
AI API / Runtime
```

A server, desktop application, Electron application, or other runtime may instead use Intent Engine directly.

## Roadmap

The current implementation establishes the first working provider-backed architecture.

Next development will focus on:

1. Define and document error and ambiguity behavior.
2. Add automated tests for the core engine, validation, schema generation, and provider behavior.
3. Add executable examples for common usage patterns.
4. Improve provider configuration and compatibility handling.
5. Verify installation and usage from clean consumer projects.
6. Publish the initial npm release and gather developer feedback.

Potential later work includes additional providers, local-model integrations, semantic matching, React/framework integrations, batch extraction, streaming, observability, and other integrations.

These are possible future directions rather than commitments for the current release.

## Architecture and agent files

The `agent-files/` directory contains the project's working architecture and agent guidance:

* `AGENTS.md` — agent instructions and repository rules
* `ARCHITECTURE.md` — finalized architectural decisions
* `Agents_Context.md` — short-term implementation context and open questions
* `CLAUDE.md` — Claude entry point

Architectural decisions should be finalized deliberately rather than inferred from implementation convenience.

## License

MIT
