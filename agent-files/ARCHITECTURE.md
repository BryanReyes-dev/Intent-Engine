# Intent Engine Architecture

## Document Authority

This file is the authoritative record of finalized Intent Engine architectural decisions.

`agent-files/Agents_Context.md` is short-term working context. It may contain hypotheses, implementation discoveries, open questions, and current work, but finalized architecture belongs here after Bryan explicitly approves it.

## Product Boundary

Intent Engine is a focused TypeScript/NPM library for schema-driven AI intent extraction.

The core package is responsible for:

- accepting a developer-defined intent schema and natural-language input;
- invoking an application-selected `IntentProvider`;
- validating the provider's runtime result;
- returning the validated `IntentResult`.

Intent Engine is **not** an AI runtime manager, hosted inference service, or model lifecycle manager.

The application is responsible for choosing and operating the inference environment, including hosted APIs, local model runtimes, credentials, deployment, and environment-specific networking.

## Core Architecture

The finalized dependency flow is:

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

The core engine must remain independent of any single AI provider or model runtime.

The provider boundary is the extension point between Intent Engine and inference infrastructure.

## Provider Abstraction

The public provider contract is:

```ts
type IntentProviderRequest = {
  schema: IntentSchema;
  input: string;
};

type IntentProvider = {
  extract(request: IntentProviderRequest): Promise<unknown>;
};
```

Providers return `unknown` at the abstraction boundary. Intent Engine performs runtime validation before exposing the result as an `IntentResult`.

This prevents provider-specific TypeScript typing from being treated as proof that an external response is valid.

The first built-in provider is `OpenAICompatibleProvider`.

It targets an OpenAI-compatible chat-completions endpoint and is specifically designed around the structured JSON Schema response format used by the implementation. "OpenAI-compatible" is not treated as a guarantee that every compatible service supports every feature; the built-in provider requires the structured-output capability it sends.

## Structured Output

The developer-facing schema is:

```ts
type IntentSchema = {
  [key: string]: string;
};
```

Each key represents an intent dimension and its value describes what should be extracted.

Intent Engine converts this schema into a JSON Schema representation for providers that support structured JSON output.

The current generated result structure requires:

```ts
type IntentResult = {
  [key: string]: {
    source: string[];
    confidence: number;
  };
};
```

The generated JSON Schema requires every requested dimension and disallows unexpected top-level result fields.

## Runtime Validation

Runtime validation is part of the core engine rather than delegated to individual providers.

A provider result is rejected when it is not an object, when schema dimensions are missing, when unexpected dimensions are present, or when a dimension has an invalid `source` array or `confidence` value.

Confidence must be a finite number between `0` and `1`.

The `confidence` value is currently provider-generated. Intent Engine validates its type and range but does not treat it as a calibrated statistical probability.

Malformed provider output must fail rather than silently becoming a valid-looking `IntentResult`.

## Environment Strategy

The core package is runtime-agnostic and does not require Node-specific APIs.

The package is published as ESM.

The built-in `OpenAICompatibleProvider` uses the environment's global `fetch`. Custom providers may use another transport.

The same core API can therefore be used by:

### Server / Live Applications

```text
Application Backend
    ↓
Intent Engine
    ↓
Provider
    ↓
Hosted API or Local Runtime
```

Provider credentials and deployment configuration belong to the application.

### Browser Applications

```text
Browser
    ↓
Application Backend
    ↓
Intent Engine
    ↓
Provider
    ↓
Inference
```

The core package contains no Node-specific dependency that prevents browser use. Direct browser inference is conditional on the selected provider endpoint supporting browser access and an appropriate authentication design.

Intent Engine does not provide a CORS proxy or secret-management layer.

### Desktop / Electron Applications

```text
Desktop Application
    ↓
Intent Engine
    ↓
Provider
    ↓
Local or Remote Inference
```

Desktop applications may separately package or manage local inference runtimes. Intent Engine does not automatically detect Electron, install models, download runtimes, start runtimes, or manage their lifecycle.

## Extensibility

Applications may implement `IntentProvider` for their own inference service, transport, or runtime.

New providers should be added behind the provider boundary without changing the core `IntentEngine` contract unless a deliberate architectural change is approved.

Framework-specific integrations are not part of the core architecture.

## Error Boundary

Provider transport/API failures and malformed provider output are surfaced as errors.

The core engine is responsible for validating provider output after the provider returns.

Retry policies, timeout controls, cancellation, clarification flows, ambiguity models, telemetry, and automatic provider fallback are not part of the finalized 0.1.0 architecture.

These may be considered in future architectural changes.

## Packaging Boundary

The npm package publishes the compiled `dist/` output, README, LICENSE, and package metadata.

The package does not bundle an AI model or model runtime.

The application determines how inference infrastructure is installed, configured, and deployed.

## Finalized 0.1.0 Contract

For the 0.1.0 release:

```text
Intent Engine
    = schema-driven intent extraction

IntentProvider
    = inference boundary

OpenAICompatibleProvider
    = first built-in provider

Application
    = runtime and deployment owner
```

This separation is intentional. It allows the core package to remain small and provider-flexible while supporting server, browser, desktop, local-runtime, hosted-inference, and custom-provider deployment strategies without coupling the core to one runtime.
