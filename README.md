# Intent Engine

A schema-driven TypeScript library for extracting structured intent from natural-language input.

## Status

**0.1.0 — publishable baseline**

Intent Engine currently provides:

- A provider-agnostic intent extraction engine.
- A public `IntentProvider` abstraction.
- An OpenAI-compatible provider.
- Automatic conversion of `IntentSchema` into a JSON Schema for structured model output.
- Runtime validation of provider results.
- TypeScript declarations and an ESM package build.

The package has been verified to:

- Build successfully from source.
- Produce a valid npm package archive.
- Load from a separate consumer project using plain HTML, CSS, and JavaScript.
- Perform real extraction through a local Ollama instance using an OpenAI-compatible endpoint.
- Pass the returned result through the engine's runtime validation.

The package does **not** install, bundle, start, or manage an AI model runtime. The application chooses and configures the inference source through an `IntentProvider`.

## Core concept

Developers define the dimensions that matter to their application:

```ts
const schema = {
  location: "Where does the user want to live?",
  feeling: "How should the home feel?",
};
```

They create an inference provider and pass the schema and natural-language input to the engine:

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

A provider-backed extraction returns one result for every requested schema dimension:

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

The `confidence` field is a provider-generated number between `0` and `1`. Intent Engine validates the range and numeric format, but does not currently claim that the value is a calibrated statistical probability.

## Package architecture

Intent Engine separates intent extraction from inference infrastructure:

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

- accepts the developer's schema and input;
- calls the configured provider;
- validates the provider's runtime result;
- returns a typed `IntentResult`.

The provider:

- decides how inference is reached;
- converts the request into provider-specific network/API operations;
- returns the raw result to the engine for validation.

This allows the same core API to be used with hosted services, local model runtimes, or application-defined providers.

## Built-in provider

### `OpenAICompatibleProvider`

The built-in provider targets an OpenAI-compatible chat-completions endpoint.

It expects the configured base URL to expose:

```text
POST {baseUrl}/chat/completions
```

with support for:

- `model`
- chat `messages`
- `response_format.type = "json_schema"`
- strict structured JSON output

Example:

```ts
const provider = new OpenAICompatibleProvider({
  baseUrl: "https://example.com/v1",
  model: "example-model",
  apiKey: "your-api-key",
});
```

Not every service described as "OpenAI-compatible" implements the same feature set. The built-in provider specifically depends on the structured JSON Schema response format shown above.

Local runtimes can also be used when they expose the required compatible API. Intent Engine itself remains unaware of how that runtime is installed or managed.

## Installation

Install the published package:

```bash
npm install intent-engine
```

Intent Engine is published as an **ESM package**.

Use standard ESM imports:

```ts
import { IntentEngine } from "intent-engine";
```

The package does not expose a CommonJS `require()` entry point in 0.1.0.

## Usage by environment

### Server / Node application

A server application can use Intent Engine directly:

```ts
import {
  IntentEngine,
  OpenAICompatibleProvider,
} from "intent-engine";

const provider = new OpenAICompatibleProvider({
  baseUrl: process.env.AI_BASE_URL!,
  model: process.env.AI_MODEL!,
  apiKey: process.env.AI_API_KEY,
});

const engine = new IntentEngine(provider);

const result = await engine.extract(
  {
    location: "Where does the user want to live?",
    feeling: "How should the home feel?",
  },
  "I want somewhere quiet near the city.",
);
```

The server is responsible for storing provider credentials and configuring the inference endpoint.

The built-in provider uses the runtime's global `fetch`. The core engine itself does not require `fetch`; custom providers can use any transport they need.

### Live web application

A common production deployment is:

```text
Browser
    ↓
Application Backend
    ↓
Intent Engine
    ↓
IntentProvider
    ↓
AI API / Local Runtime
```

This keeps provider credentials on the application's server and lets the server choose the inference runtime.

Intent Engine can also be imported by browser applications because the package does not depend on Node-specific APIs. Direct browser inference additionally depends on the selected endpoint allowing browser requests and on the application's authentication design.

### Browser-only application

For a browser-only application, the package can be loaded with a JavaScript bundler or with a browser import map.

A direct browser integration still depends on the provider endpoint being browser-accessible. The built-in provider does not proxy requests or solve CORS configuration.

For hosted services that require secret credentials, the recommended architecture is to call the application's backend rather than embed a private API key in frontend code.

### Desktop / Electron application

Desktop applications can bundle Intent Engine normally:

```text
Desktop / Electron Application
          ↓
     Intent Engine
          ↓
    IntentProvider
          ↓
 Local or Remote Inference
```

A desktop application may choose a local model runtime or a hosted endpoint.

Intent Engine does not automatically detect Electron, download a model, start a local runtime, or package one. Those responsibilities remain with the desktop application and its deployment system.

### Custom provider

Applications can implement the exported `IntentProvider` interface when the built-in provider does not fit their environment:

```ts
import {
  IntentEngine,
  type IntentProvider,
} from "intent-engine";

const provider: IntentProvider = {
  async extract({ schema, input }) {
    // Call your own inference system.
    // Return data matching the IntentResult structure.
    return {
      location: {
        source: ["near the city"],
        confidence: 0.9,
      },
      feeling: {
        source: ["quiet"],
        confidence: 0.8,
      },
    };
  },
};

const engine = new IntentEngine(provider);

const result = await engine.extract(
  {
    location: "Where does the user want to live?",
    feeling: "How should the home feel?",
  },
  "I want somewhere quiet near the city.",
);
```

The engine validates the returned value regardless of which provider created it.

## Structured output and validation

Intent Engine converts the developer-defined `IntentSchema` into a JSON Schema representation for providers that support structured JSON output.

The generated structure requires:

- every requested schema field;
- a `source` string array;
- a `confidence` number between `0` and `1`;
- no unexpected result fields.

The core engine performs the final runtime validation.

Invalid provider output causes `extract()` to reject with an error rather than silently returning malformed data.

## Current result contract

```ts
type IntentSchema = {
  [key: string]: string;
};

type IntentResult = {
  [key: string]: {
    source: string[];
    confidence: number;
  };
};
```

A schema value is a natural-language description of what should be extracted for that dimension.

For example:

```ts
const schema = {
  location: "Where does the user want to live?",
  feeling: "How should the home feel?",
  budget: "What budget does the user imply?",
};
```

## Current error behavior

In 0.1.0, provider failures and malformed results are surfaced as thrown errors.

The built-in provider currently reports failures for cases including:

- non-successful HTTP responses;
- missing provider response content;
- invalid JSON returned by the provider.

The core engine additionally rejects results with:

- missing schema fields;
- unexpected fields;
- invalid `source` arrays;
- non-finite confidence values;
- confidence values outside the `0` to `1` range.

Retry logic, timeout configuration, clarification flows, and richer ambiguity handling are not included in 0.1.0.

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

There is no automatic runtime detection or runtime management in 0.1.0.

This separation is intentional: the library can remain small and provider-flexible while applications choose the deployment model appropriate to their environment.

## Build from source

For repository development:

```bash
npm install
npm run build
```

To run the package checks:

```bash
npm run check
```

Before publishing, the package can also be inspected without actually publishing:

```bash
npm publish --dry-run
```

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

### `IntentSchema`

```ts
type IntentSchema = {
  [key: string]: string;
};
```

### `IntentResult`

```ts
type IntentResult = {
  [key: string]: {
    source: string[];
    confidence: number;
  };
};
```

### `createIntentJsonSchema`

The package also exports the function used to transform an `IntentSchema` into the JSON Schema structure used by the built-in provider.

## Roadmap

The 0.1.0 release establishes the first provider-backed architecture.

Post-0.1.0 work will be driven by implementation needs and developer feedback. Potential areas include:

- automated test coverage;
- better timeout, retry, and cancellation controls;
- broader provider compatibility;
- additional official providers;
- richer ambiguity and clarification behavior;
- batch extraction;
- streaming;
- observability;
- local-model integrations;
- framework integrations.

These are possible future directions, not promises for the current release.

## Architecture and agent files

The `agent-files/` directory contains the project's working architecture and agent guidance:

- `AGENTS.md` — agent instructions and repository rules
- `ARCHITECTURE.md` — finalized architectural decisions
- `Agents_Context.md` — short-term implementation context and release state
- `CLAUDE.md` — Claude entry point

Architectural decisions should be finalized deliberately rather than inferred from implementation convenience.

## License

MIT
