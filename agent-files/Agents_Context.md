# Intent Engine — Agents Context

> **Purpose:** Shared short-term working context between Bryan, ChatGPT, Codex, and other agents working on Intent Engine.
>
> This file is intentionally non-secret and may be committed to the public repository.
>
> This is a living workspace for current context, implementation discoveries, release notes, preferences, open questions, and agent-to-agent communication. It is **not the authoritative architecture document**.
>
> Finalized architectural decisions belong in `agent-files/ARCHITECTURE.md` after Bryan explicitly approves them.

---

# 0. Context Budget & Maintenance Policy

This file is short-term working memory. Its value comes from high-signal information, not from accumulating every thought.

## Hard rule: do not repeat context unnecessarily

Before adding a note, ask:

- Is this information actually new?
- Is it already documented elsewhere?
- Can an existing note be updated instead?
- Is it still relevant?
- Does it belong in `ARCHITECTURE.md` instead?

Prefer editing, consolidating, replacing, or removing existing context over appending another explanation.

### Current policy

- Preferred working size: approximately **5,000–10,000 tokens**.
- Warning zone: **10,000–15,000 tokens**.
- Hard ceiling: **15,000 tokens** unless Bryan explicitly changes this policy.
- After a material edit, refresh the Context Metrics below.

### Context Metrics

- **Last measured:** 2026-09-20
- **Approximate token count:** intentionally compact; exact tokenizer measurement not currently available
- **Preferred range:** 5,000–10,000 tokens
- **Hard ceiling:** 15,000 tokens
- **Status:** Healthy
- **Measurement note:** Approximate until an appropriate exact tokenizer is available.

---

# 1. How Agents Should Use This File

Agents working on Intent Engine should read this file when beginning substantial work.

Clearly distinguish:

- established facts
- implementation discoveries
- current release state
- proposals
- open questions
- rejected ideas
- future possibilities

Do not silently turn a hypothesis into a requirement or architectural decision.

## Architecture authority rule

`agent-files/ARCHITECTURE.md` is the authoritative record of finalized architecture.

**Agents must ask Bryan for explicit permission before modifying `ARCHITECTURE.md`.**

If Bryan approves an architectural decision:

1. Record the finalized architectural decision in `ARCHITECTURE.md`.
2. Remove or reduce the corresponding architectural material from this file.
3. Keep only the short-term context needed for current work.

Never silently promote a proposal into architecture.

---

# 2. Project Identity

Intent Engine is a focused TypeScript/NPM library for schema-driven AI intent extraction.

The core idea is:

```text
Natural Language
      ↓
IntentEngine
      ↓
Developer-defined IntentSchema
      ↓
IntentProvider
      ↓
Validated IntentResult
```

The developer chooses the intent dimensions that matter to the application. Intent Engine handles the provider call and validates the returned structured data.

Intent Engine is a developer library, not a general-purpose AI assistant and not an AI runtime manager.

---

# 3. Current 0.1.0 Implementation

The current source contains:

```text
src/
├── engine.ts
├── index.ts
├── schema.ts
├── types.ts
├── validation.ts
└── providers/
    ├── openai-compatible.ts
    └── types.ts
```

The public package exports:

- `IntentEngine`
- `IntentProvider`
- `IntentProviderRequest`
- `OpenAICompatibleProvider`
- `OpenAICompatibleProviderOptions`
- `IntentSchema`
- `IntentResult`
- `createIntentJsonSchema`

The package is ESM and uses generated JavaScript plus TypeScript declarations from `dist/`.

---

# 4. Core API

The current API is:

```ts
const provider = new OpenAICompatibleProvider({
  baseUrl: "http://127.0.0.1:11434/v1",
  model: "gemma4:26b",
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

The schema is a map of dimension names to natural-language descriptions.

The result is:

```ts
type IntentResult = {
  [key: string]: {
    source: string[];
    confidence: number;
  };
};
```

`source` contains extracted source text. `confidence` is provider-generated and is only range-validated by the core; it is not currently represented as a calibrated probability.

---

# 5. Provider Architecture

The engine depends on the exported `IntentProvider` abstraction:

```ts
type IntentProviderRequest = {
  schema: IntentSchema;
  input: string;
};

type IntentProvider = {
  extract(request: IntentProviderRequest): Promise<unknown>;
};
```

The provider returns `unknown` so the engine can validate actual runtime data.

The built-in provider is `OpenAICompatibleProvider`.

It:

1. Sends a POST request to `{baseUrl}/chat/completions`.
2. Supplies the model and chat messages.
3. Converts the developer schema into JSON Schema.
4. Requests strict structured JSON output through `response_format`.
5. Parses the returned message content as JSON.
6. Returns the raw parsed value to the engine.
7. Lets the engine perform final validation.

The implementation currently assumes the target endpoint supports the required OpenAI-compatible structured-output request shape. It is not a generic adapter for every partial implementation of the OpenAI API.

---

# 6. Environment and Runtime Usage

The same package can be used in multiple deployment models because the runtime sits behind the provider boundary.

### Server / live service

```text
Application backend
    ↓
IntentEngine
    ↓
OpenAICompatibleProvider or custom provider
    ↓
Hosted API or local runtime
```

The backend owns provider credentials and deployment configuration.

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

Direct browser use is possible because the core package does not use Node-specific APIs, but the selected inference endpoint must be browser-accessible and the application's authentication design must be appropriate.

Intent Engine does not provide CORS proxying or secret handling.

### Desktop / Electron

```text
Desktop application
    ↓
Intent Engine
    ↓
Provider
    ↓
Local or remote inference
```

The application may bundle and manage a local runtime separately. Intent Engine does not automatically detect Electron or start, install, download, or manage a model runtime.

### Custom provider

An application can implement `IntentProvider` when it has its own transport or AI service. The engine's runtime validation still applies.

---

# 7. Runtime Requirements

There is intentionally no Node `engines` field in `package.json` because the core package does not require Node-specific APIs.

Important environment notes:

- The published package is ESM.
- The core engine does not directly depend on `fetch`.
- `OpenAICompatibleProvider` uses global `fetch`.
- Browser environments normally provide `fetch`.
- Server environments must provide a compatible global `fetch` implementation or use a custom provider with another transport.

Do not reintroduce a Node version restriction without an explicit reason and architectural review.

---

# 8. Validation Behavior

`validateIntentResult()` currently rejects:

- non-object provider results;
- arrays returned as top-level results;
- missing schema fields;
- unexpected result fields;
- non-object dimension values;
- non-array `source` fields;
- non-string entries inside `source`;
- non-number confidence values;
- non-finite confidence values;
- confidence values outside `0` through `1`.

The goal is to fail closed on malformed provider output rather than return an invalid `IntentResult`.

---

# 9. Error Behavior in 0.1.0

The built-in provider currently reports:

- non-successful HTTP responses;
- missing `choices[0].message.content`;
- invalid JSON content.

The engine then validates the parsed provider result.

Not currently implemented:

- retry policies;
- timeout configuration;
- cancellation/AbortSignal configuration;
- automatic fallback providers;
- clarification loops;
- richer ambiguity objects;
- telemetry or observability hooks.

These are follow-up possibilities rather than current capabilities.

---

# 10. Packaging and Distribution

`package.json` currently publishes:

```text
dist/
README.md
LICENSE
package.json
```

The package uses:

- `main: ./dist/index.js`
- `types: ./dist/index.d.ts`
- an ESM `exports` entry
- `sideEffects: false`
- `prepublishOnly: npm run build`

Repository development commands:

```bash
npm install
npm run build
npm run check
```

Release verification:

```bash
npm publish --dry-run
```

After publication, the most important external verification is a clean consumer project that runs:

```bash
npm install intent-engine
```

and imports the published package rather than a local tarball or repository checkout.

---

# 11. Tests and Verification State

0.1.0 does not yet contain a dedicated automated test suite.

The release has instead been manually verified through:

- successful TypeScript build;
- successful npm package dry run;
- a separate consumer project using the package from plain HTML/CSS/JavaScript;
- real provider-backed extraction using a local OpenAI-compatible Ollama endpoint and a real model;
- successful schema/result validation on the returned data.

Automated tests are a post-0.1.0 priority, not a claim of current coverage.

---

# 12. Release and Usage Contract

For 0.1.0, the following statements are safe to treat as current:

```text
Intent Engine = intent extraction library
IntentProvider = inference boundary
OpenAICompatibleProvider = first built-in provider
Application = owner of runtime/deployment strategy
```

Do not describe 0.1.0 as:

- a bundled model runtime;
- an Ollama manager;
- an automatic environment detector;
- a hosted inference service;
- a browser proxy;
- a multi-provider SDK.

Those are future possibilities, not current capabilities.

---

# 13. Current Release Goal

The immediate goal is to publish 0.1.0 and test the package exactly as an external developer would use it.

Target sequence:

```text
Repository synchronized
      ↓
Documentation synchronized
      ↓
npm publish 0.1.0
      ↓
Clean project: npm install intent-engine
      ↓
Import published package
      ↓
Run a real extraction
      ↓
Record actual issues
      ↓
Decide 0.2.0 scope from evidence
```

Do not expand the provider matrix before the first published package has been externally exercised.

---

# 14. Open Questions for Post-0.1.0

These remain open until evidence or explicit architecture decisions resolve them:

- Should confidence eventually be independent of model self-reporting?
- Should the provider abstraction accept cancellation/timeouts?
- Should official providers be added for vendors that do not expose the required compatible API?
- Should there be a first-party local-runtime provider/manager?
- Should ambiguity be a first-class result type?
- Should the schema eventually support Zod, JSON Schema, or another formal schema system?
- Should the browser experience include a dedicated backend/proxy package?
- How much provider-specific configuration should be exposed?
- Which improvements are justified by real developer usage?

These are questions, not commitments.

---

# 15. Product Direction

Intent Engine should remain a focused developer-infrastructure project.

The immediate objective is usefulness, installability, recognition, and real developer feedback.

Avoid expanding it into a runtime manager, AI assistant, or large framework until external evidence justifies that scope.

---

# 16. Agent Communication

## ChatGPT

Current understanding:

- 0.1.0 is the first provider-backed release.
- The core engine is provider-flexible.
- The built-in provider targets an OpenAI-compatible structured-output API.
- The package is ESM.
- Runtime management belongs to the application, not the core package.
- The immediate goal is clean publication and a true post-publication consumer test.
- Feature expansion should follow real developer feedback.

### Future thoughts

_Add only genuinely new observations._

## Codex

Use this section for implementation discoveries that another agent needs.

### Current thoughts

_Add implementation discoveries here._

### Repository observations

_Add useful observations about the current implementation here._

### Concerns / risks

_Add implementation or architecture concerns here. If a concern becomes a finalized architectural decision, ask Bryan before moving it into `ARCHITECTURE.md`._

### Future thoughts

_Add ideas worth discussing before implementation._

---

# 17. Maintenance Reminder for Future Agents

**Do not let this file become a second architecture document.**

When an idea becomes finalized architecture, ask Bryan for approval and move the authoritative decision to `agent-files/ARCHITECTURE.md`.

When the same context changes, update the existing note rather than appending another explanation.

The goal is for `Agents_Context.md` to remain compact, high-signal, and current while `ARCHITECTURE.md` remains the authoritative record of deliberate architectural decisions.
