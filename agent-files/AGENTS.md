# Agent Instructions — Intent Engine

Intent Engine is a TypeScript/NPM library for converting natural-language input into structured, developer-defined intent data.

## Before Working

1. Read `agent-files/Agents_Context.md` for current working state.
2. Read `agent-files/ARCHITECTURE.md` for finalized architectural decisions.
3. Inspect the current public API and implementation before changing it.
4. Check the README against the implementation before changing documented behavior.
5. Keep the library focused on developer-facing intent extraction and avoid unnecessary feature expansion.

## Documentation Authority

- `ARCHITECTURE.md` is authoritative for finalized architecture.
- `Agents_Context.md` is temporary working context.
- Do not silently promote proposals or hypotheses into architecture.
- Architectural changes require Bryan's explicit approval before being recorded as finalized.

## Implementation Rules

- Preserve a provider-flexible public API.
- Keep provider-specific implementation details behind appropriate boundaries.
- Keep public types and exports intentional.
- Validate external/provider data at runtime when it crosses into the core engine.
- Tests and documentation must match the actual implementation.
- Do not claim planned features are implemented without verifying the source.
- Avoid unrelated changes when working on a focused task.
- Do not introduce automatic model/runtime management unless it is explicitly approved as a product requirement.

## 0.2.0 Release Contract

The current 0.2.0 package is a library, not an AI runtime manager.

The current contract is:

```text
Application
    ↓
IntentEngine
    ↓
IntentProvider
    ↓
Inference endpoint / runtime
    ↓
Model
```

The application is responsible for choosing and operating the inference environment.

The current built-in provider is `OpenAICompatibleProvider`. It expects an OpenAI-compatible chat-completions endpoint supporting the structured JSON Schema response format used by the implementation.

The package is published as ESM. Do not document CommonJS `require()` support unless the package export strategy is changed.

The core library does not use Node-specific APIs. The built-in HTTP provider uses global `fetch`.

## Current 0.2.0 Behavior

The schema supports fields with optional canonical `values`.

- Canonical fields restrict non-null values to the configured set.
- Open-ended fields allow string, number, boolean, or `null`.
- Every requested field must be returned.
- Unexpected result fields are rejected.
- Evidence is represented as a string array.
- Confidence must be a finite number from `0` through `1`.
- Confidence is provider-generated and is not treated as calibrated probability.
- `null` represents insufficient information/no usable value.
- There is no dedicated ambiguity result in the current release.

The built-in provider currently has no timeout, cancellation, retry, or automatic fallback controls.

## Usage Expectations

Agents documenting or testing the package should distinguish current behavior from future work.

### Server / Node

```text
Application backend
    ↓
Intent Engine
    ↓
Provider
    ↓
Hosted or local inference
```

### Browser

```text
Browser
    ↓
Application backend
    ↓
Intent Engine
    ↓
Provider
    ↓
Inference
```

Direct browser inference is conditional on endpoint accessibility and authentication/CORS design. Intent Engine does not provide a proxy or CORS layer.

### Desktop / Electron

```text
Desktop app
    ↓
Intent Engine
    ↓
Provider
    ↓
Local or remote inference
```

Intent Engine does not automatically detect desktop runtimes, install model runtimes, or manage their lifecycle.

### Custom provider

Applications may implement the exported `IntentProvider` interface. The engine must still validate the provider's runtime return value before exposing it as an `IntentResult`.

## Current Test Expectations

The repository includes unit tests for schema generation and core validation plus an Ollama integration test.

Documentation and tests should continue to match the actual source. Provider transport/network failure coverage is an identified gap, not a current feature.

## Known Limitations and Planned Work

The following are current limitations, not capabilities:

- no provider timeout controls;
- no request cancellation controls;
- no retry policy;
- no automatic provider fallback;
- no first-class ambiguity state;
- no built-in clarification loop;
- no independent confidence calibration;
- limited compatibility with OpenAI-compatible endpoints that do not support the required structured-output request shape;
- incomplete provider failure-mode coverage.

Tracked future work includes:

1. timeout and cancellation support for `OpenAICompatibleProvider`;
2. first-class ambiguous intent results;
3. expanded OpenAI-compatible provider failure-mode tests.

Other possible future work must be clearly labeled as planned/under consideration until implemented.

## Release Documentation Rules

Documentation must accurately describe:

- installation with `npm install intent-engine`;
- ESM import usage;
- provider configuration;
- the inference/runtime responsibility boundary;
- structured-output requirements of the built-in provider;
- result validation behavior;
- known 0.2.0 limitations.

Do not describe Ollama, OpenAI, or another service as required by the core package. They are provider/runtime choices.

Do not describe future providers, automatic runtime management, retries, streaming, framework adapters, or other roadmap items as current capabilities unless the implementation has been verified.

## Release Verification

Before treating a version as release-ready, verify:

- `npm run build` succeeds;
- `npm run check` succeeds;
- `npm publish --dry-run` succeeds;
- the published package contents match the intended public files;
- installation and import work from a separate consumer project;
- at least one real provider/model path produces a validated result;
- no secrets or development artifacts are included.

After publication, perform a clean installation from npm and test the package exactly as an external consumer would.

## Working Style

Prefer the smallest change that makes the current behavior correct, documented, and testable.

When a new capability would expand the runtime, provider, or deployment model, document the proposal in `Agents_Context.md` first. Do not silently turn the proposal into finalized architecture.
