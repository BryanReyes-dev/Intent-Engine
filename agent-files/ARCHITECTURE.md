# Intent Engine Architecture

## Document Authority

This file is the authoritative record of finalized Intent Engine architectural decisions.

`agent-files/Agents_Context.md` is short-term working context. It may contain implementation discoveries, open questions, and planned work, but it must not silently promote a proposal into finalized architecture.

Architectural changes require Bryan's explicit approval before being recorded here.

---

## 1. Product Boundary

Intent Engine is a focused TypeScript/NPM library for schema-driven AI intent extraction.

The core package is responsible for:

- accepting a developer-defined intent schema and natural-language input;
- invoking an application-selected `IntentProvider`;
- validating the provider's runtime result;
- returning the validated `IntentResult`.

Intent Engine is **not** an AI runtime manager, hosted inference service, model lifecycle manager, or provider-operations platform.

The application is responsible for choosing and operating inference infrastructure, including hosted APIs, local model runtimes, credentials, deployment, and environment-specific networking.

---

## 2. Current 0.2.0 Architecture

The implemented dependency flow is:

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

The provider boundary is the extension point between the core library and inference infrastructure.

The core engine does not depend on a specific model runtime.

---

## 3. Intent Schema

The current public schema is:

```ts
type IntentValue = string | number | boolean;

type IntentField = {
  field: string;
  values?: readonly IntentValue[];
};

type IntentSchema = Record<string, IntentField>;
```

A field describes the intent dimension in natural language.

When `values` is supplied, those values are the application's canonical vocabulary for that dimension.

When `values` is omitted, the field is open-ended.

The schema is converted into a JSON Schema for the built-in structured-output provider.

---

## 4. Provider Abstraction

The current public provider contract is:

```ts
type IntentProviderRequest = {
  schema: IntentSchema;
  input: string;
};

type IntentProvider = {
  extract(request: IntentProviderRequest): Promise<unknown>;
};
```

Providers return `unknown` at the abstraction boundary. This is intentional: the engine must validate runtime data instead of trusting provider-specific TypeScript types.

The first built-in provider is `OpenAICompatibleProvider`.

It sends a chat-completions request to:

```text
{baseUrl}/chat/completions
```

using the configured model and the structured-output JSON Schema generated from the developer's intent schema.

The current provider options are:

```ts
type OpenAICompatibleProviderOptions = {
  baseUrl: string;
  model: string;
  apiKey?: string;
};
```

The built-in provider requires the target endpoint to support the structured-output request shape used by the implementation, including `response_format.type = "json_schema"` and strict structured output.

"OpenAI-compatible" therefore describes the protocol target, not universal compatibility with every endpoint that implements only part of the API.

---

## 5. Result and Validation Boundary

The current result contract is:

```ts
type IntentResult = Record<string, {
  value: IntentValue | null;
  source: string[];
  confidence: number;
}>;
```

The generated schema and runtime validation enforce the following:

- every requested field is present;
- no unexpected top-level result fields are present;
- canonical values stay inside their configured allowed set;
- open-ended values may be string, number, boolean, or `null`;
- `source` is a string array;
- `confidence` is a finite number between `0` and `1`.

`null` is the current representation for insufficient information or no usable value.

There is currently no first-class ambiguity state or candidate-value collection in the result contract.

Confidence is supplied by the provider and only type/range validated by Intent Engine. It is not treated by the architecture as a calibrated statistical probability.

Malformed provider output must fail validation rather than silently becoming a valid-looking result.

---

## 6. Provider Error Boundary

The built-in provider currently surfaces:

- non-successful HTTP responses;
- missing `choices[0].message.content`;
- invalid JSON content.

The engine then performs result validation on the parsed provider result.

The current provider API does not expose built-in timeout, cancellation, retry, or automatic fallback controls.

This is a current implementation boundary, not a statement that these features are architecturally prohibited.

---

## 7. Runtime and Environment Strategy

The core package is runtime-agnostic and does not use Node-specific APIs.

The built-in HTTP provider uses global `fetch`.

Applications own:

- provider credentials;
- inference endpoint/runtime installation;
- model lifecycle;
- deployment;
- environment-specific networking;
- browser authentication/CORS decisions.

### Server applications

```text
Application backend
    ↓
Intent Engine
    ↓
Provider
    ↓
Hosted API or local runtime
```

### Browser applications

The package can run in a browser environment that provides `fetch`, but direct browser inference depends on endpoint accessibility and an appropriate authentication/CORS design.

Intent Engine does not provide a CORS proxy or secret-management layer. Private hosted API credentials should remain on the application's backend.

### Desktop / Electron applications

```text
Desktop application
    ↓
Intent Engine
    ↓
Provider
    ↓
Local or remote inference
```

The application may separately package or manage a local runtime. Intent Engine does not install, download, start, detect, or manage model runtimes.

### Custom providers

Applications may implement `IntentProvider` for a different inference service or transport. The core validation boundary remains unchanged.

---

## 8. Current Test Architecture

The repository currently contains:

- unit tests for schema generation and runtime validation;
- an integration test against an Ollama OpenAI-compatible endpoint;
- build/package verification scripts.

The unit tests cover canonical-value validation, missing fields, unexpected fields, confidence validation, and evidence-shape validation.

The Ollama integration path verifies real provider-backed extraction and checks canonical values, evidence, confidence, and runtime validation.

Provider transport/network failure coverage is not yet comprehensive.

Tests are part of the repository and are not part of the published npm package.

---

## 9. Current Public Boundary

The current public package exports:

- `IntentEngine`;
- `IntentProvider`;
- `IntentProviderRequest`;
- `OpenAICompatibleProvider`;
- `OpenAICompatibleProviderOptions`;
- `IntentSchema`;
- `IntentResult`;
- `createIntentJsonSchema`.

The package is ESM.

The package does not bundle an AI model or model runtime.

---

## 10. Explicitly Not Implemented in 0.2.0

The following are **not** current architecture capabilities:

- timeout configuration;
- request cancellation controls;
- retry policies;
- automatic provider fallback;
- first-class ambiguity results;
- built-in clarification/follow-up loops;
- independently calibrated confidence;
- streaming;
- batch extraction;
- telemetry/observability hooks;
- framework-specific integrations;
- automatic model/runtime management.

These items must not be described as implemented features.

---

## 11. Planned Architectural Work

The following are planned or tracked areas, not finalized 0.2.0 architecture:

### Timeout and cancellation

A future provider lifecycle design may add explicit timeout and cancellation controls to `OpenAICompatibleProvider`.

The design should preserve existing behavior for callers that do not opt in. Retry semantics should be designed separately.

### First-class ambiguity

A future result-model design may distinguish ambiguity between multiple valid interpretations from unknown/insufficient information.

The design still needs to determine how candidate values, evidence, and confidence should be represented.

### Provider failure-mode coverage

The test architecture should expand to cover relevant HTTP, network, malformed-response, and structured-output failure cases for the built-in provider.

### Other future areas

Other possible work includes clarification/follow-up flows, confidence calibration research, broader provider compatibility, streaming, batching, observability, and framework integrations.

None of these are finalized architecture until explicitly approved and implemented.

---

## 12. Architectural Invariants

The following are current architectural invariants:

1. The core engine remains provider-flexible.
2. Provider responses are treated as untrusted runtime data at the core boundary.
3. Runtime validation remains a core-engine responsibility.
4. Model/runtime lifecycle remains outside the core package.
5. The npm package remains focused on developer-facing intent extraction rather than becoming an AI runtime manager.
6. Documentation must distinguish implemented behavior from planned behavior.

