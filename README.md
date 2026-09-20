# Intent Engine

A schema-driven TypeScript library for extracting structured intent from natural-language input.

## Status

**0.1.0 — publishable baseline**

The repository currently contains the public package foundation and a small, stable API surface. AI provider integration and the actual extraction implementation are intentionally not included in this baseline yet.

The goal of this milestone is to make the package structure, public API, documentation, build, and distribution model ready before implementing provider-specific behavior.

## Core concept

Developers define the dimensions that matter to their application:

```ts
const schema = {
  location: "Where does the user want to live?",
  feeling: "How should the home feel?"
};
```

They then pass natural-language input to the engine:

```ts
import { IntentEngine } from "intent-engine";

const engine = new IntentEngine();

const result = await engine.extract(
  schema,
  "I want a quiet home near the city"
);
```

The current baseline returns the correct structural shape but uses placeholder values until provider-backed extraction is implemented.

## Package architecture

The package is intentionally split conceptually into:

```text
Application
    ↓
IntentEngine
    ↓
Provider abstraction
    ↓
AI runtime / API
    ↓
Model
```

The provider/runtime boundary is **not finalized yet**.

Intent Engine should not require Ollama specifically. A web application, desktop runtime, server application, or another NPM package may need different deployment strategies. Future architecture work will determine how hosted APIs, local runtimes such as Ollama, bundled/managed runtimes, and application-provided providers fit behind the same developer-facing API.

This is an architectural question for the next milestone, not a requirement for the current baseline.

## Installation

```bash
npm install intent-engine
```

## Build from source

```bash
npm install
npm run build
```

To verify the package can build and produce an npm archive:

```bash
npm run check
```

## Current public API

### `IntentEngine`

```ts
class IntentEngine {
  extract(
    schema: IntentSchema,
    input: string
  ): Promise<IntentResult>;
}
```

### `IntentSchema`

A developer-defined map of intent dimensions to natural-language descriptions.

### `IntentResult`

A map containing the extracted source values and confidence information for each requested dimension.

The exact extraction semantics, validation rules, provider configuration, and confidence strategy remain intentionally open until the architecture is finalized.

## Roadmap

The first real implementation milestone will focus on:

1. Define the provider abstraction.
2. Implement the first provider.
3. Produce reliable structured model output.
4. Validate provider output against the developer's schema.
5. Define error and ambiguity behavior.
6. Add automated tests.
7. Add executable examples.
8. Verify installation and usage from a clean consumer project.
9. Publish an initial release and gather developer feedback.

Potential later work includes additional providers, local-model support, semantic matching, React/framework integrations, batch extraction, streaming, observability, and other integrations. These are not commitments for the first release.

## Architecture and agent files

The `agent-files/` directory contains the project's working architecture and agent guidance:

- `AGENTS.md` — agent instructions and repository rules
- `ARCHITECTURE.md` — finalized architectural decisions
- `Agents_Context.md` — short-term implementation context and open questions
- `CLAUDE.md` — Claude entry point

Architectural decisions should be finalized deliberately rather than inferred from implementation convenience.

## License

MIT
