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

## 0.1.0 Release Contract

The 0.1.0 package is a library, not an AI runtime manager.

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

## Usage Expectations

Agents documenting or testing the package should distinguish these environments:

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

Direct browser inference is possible only when the selected endpoint and authentication design permit it. Intent Engine does not provide a proxy or CORS layer.

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

## Release Documentation Rules

Documentation must accurately describe:

- installation with `npm install intent-engine`;
- ESM import usage;
- provider configuration;
- the inference/runtime responsibility boundary;
- structured-output requirements of the built-in provider;
- result validation behavior;
- known 0.1.0 limitations.

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
