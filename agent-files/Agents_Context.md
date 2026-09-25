# Intent Engine — Agents Context

> **Purpose:** Shared short-term working context between Bryan, ChatGPT, Codex, and other agents working on Intent Engine.
>
> This file is intentionally non-secret and may be committed to the public repository.
>
> This is a living workspace for current context, implementation discoveries, release notes, open questions, and agent-to-agent communication. It is **not the authoritative architecture document**.
>
> Finalized architectural decisions belong in `agent-files/ARCHITECTURE.md` after Bryan explicitly approves them.

---

# 0. Context Budget & Maintenance Policy

This file is short-term working memory. Its value comes from high-signal information, not from accumulating every thought.

Before adding a note:

- check whether the information is already documented elsewhere;
- update or consolidate an existing note instead of duplicating it;
- remove stale release information rather than preserving historical implementation claims;
- keep finalized architecture in `ARCHITECTURE.md`.

### Current policy

- Preferred working size: approximately **5,000–10,000 tokens**.
- Warning zone: **10,000–15,000 tokens**.
- Hard ceiling: **15,000 tokens** unless Bryan explicitly changes this policy.
- Keep context focused on current implementation, active work, and clearly labeled future work.

### Context Metrics

- **Last measured:** 2026-09-20
- **Approximate token count:** intentionally compact; exact tokenizer measurement not currently available
- **Preferred range:** 5,000–10,000 tokens
- **Hard ceiling:** 15,000 tokens
- **Status:** Healthy

---

# 1. How Agents Should Use This File

Agents working on Intent Engine should read this file when beginning substantial work.

Always distinguish:

- **Current implementation** — verified in the repository.
- **Known limitation** — a capability the current implementation does not provide.
- **Planned work** — an approved or tracked future change that is not implemented yet.
- **Open question** — a design/research question without a finalized answer.
- **Rejected idea** — something intentionally not being pursued.

Do not silently turn a proposal into a requirement or architectural decision.

## Architecture authority rule

`agent-files/ARCHITECTURE.md` is the authoritative record of finalized architecture.

**Agents must ask Bryan for explicit permission before modifying `ARCHITECTURE.md`.**

If Bryan approves an architectural decision:

1. Record the finalized architectural decision in `ARCHITECTURE.md`.
2. Remove or reduce duplicate architectural material from this file.
3. Keep only the short-term context needed for current work.

---

# 2. Project Identity

Intent Engine is a focused TypeScript/NPM library for schema-driven AI intent extraction.

The current flow is:

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

The developer defines the intent dimensions that matter to the application. Intent Engine invokes the configured provider and validates the returned structured data.

Intent Engine is a developer library, not a general-purpose AI assistant, hosted inference service, or AI runtime manager.

---

# 3. Current 0.2.0 Implementation

The current source includes:

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

The package is ESM and produces compiled JavaScript plus TypeScript declarations in `dist/`.

## Current schema behavior

Each schema field contains:

```ts
type IntentField = {
  field: string;
  values?: readonly IntentValue[];
};
```

When `values` is present, the generated JSON Schema restricts the value to those canonical values plus `null`.

When `values` is omitted, the generated value schema accepts string, number, boolean, or `null`.

## Current result behavior

Each result field contains:

```ts
{
  value: IntentValue | null;
  source: string[];
  confidence: number;
}
```

The core validates:

- all requested fields are present;
- no unexpected result fields are returned;
- canonical values stay inside their configured allowed set;
- `source` is a string array;
- `confidence` is finite and between `0` and `1`.

The current result contract has no dedicated ambiguity state or candidate-value list.

---

# 4. Current Provider Behavior

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

Providers return `unknown` so the engine validates actual runtime data at the core boundary.

The built-in `OpenAICompatibleProvider` currently:

1. sends a POST request to `{baseUrl}/chat/completions`;
2. supplies the configured model and chat messages;
3. converts the schema to JSON Schema;
4. requests strict structured JSON through `response_format`;
5. parses `choices[0].message.content` as JSON;
6. returns the parsed result to the engine for final validation.

Current provider options are:

```ts
type OpenAICompatibleProviderOptions = {
  baseUrl: string;
  model: string;
  apiKey?: string;
};
```

The provider currently throws for non-successful HTTP responses, missing message content, and invalid JSON.

It does **not** currently expose built-in timeout, cancellation, retry, or automatic fallback controls.

The provider also assumes the target endpoint supports the structured-output request shape used by the implementation. "OpenAI-compatible" does not mean every partial implementation of the API is supported.

---

# 5. Runtime and Environment Boundary

The core package is runtime-agnostic and does not import Node-specific APIs.

The built-in HTTP provider uses global `fetch`.

Applications are responsible for:

- the inference endpoint;
- model/runtime installation and lifecycle;
- provider credentials;
- deployment;
- environment-specific networking;
- browser authentication/CORS decisions.

Intent Engine does not install, download, start, detect, or manage model runtimes.

Browser use is possible when the selected endpoint is reachable from the browser and the application's authentication design permits it. Private API credentials should remain on the application's backend.

Custom providers can use a different transport while keeping the same core engine validation boundary.

---

# 6. Current Test / Verification State

The repository contains:

- unit tests for JSON Schema generation and core validation;
- an Ollama integration test using an OpenAI-compatible endpoint;
- build and package-check scripts.

The unit tests currently cover cases including:

- canonical values outside the allowed set;
- missing schema fields;
- unexpected result fields;
- invalid confidence values;
- malformed evidence entries.

The Ollama integration path verifies real provider-backed extraction and validates canonical values, evidence, confidence, and the final runtime result.

Provider HTTP/network failure coverage is less comprehensive than the schema/validation coverage and is a tracked improvement area.

---

# 7. Known Limitations — Current 0.2.0

These are facts about the current implementation:

- no built-in timeout configuration;
- no built-in request cancellation/AbortSignal option;
- no built-in retry policy;
- no automatic provider fallback;
- no first-class ambiguity result model;
- no built-in clarification/follow-up loop;
- confidence is provider-generated and range-validated rather than independently calibrated;
- OpenAI-compatible provider support is limited to endpoints supporting the structured-output request shape;
- provider failure-mode tests are not yet comprehensive.

Do not document any of these as implemented capabilities.

---

# 8. Planned Work / Tracked Issues

The following are future changes and must remain distinct from current implementation:

1. **Timeout and cancellation support for `OpenAICompatibleProvider`**
   - Add explicit request lifecycle controls without changing existing behavior for callers that do not opt in.
   - Retry behavior is a separate design decision.

2. **First-class ambiguous intent results**
   - Design how ambiguity between multiple valid interpretations should differ from unknown/insufficient information.
   - Candidate values, evidence, and confidence handling should be decided as part of the design rather than assumed.

3. **OpenAI-compatible provider failure-mode test coverage**
   - Expand automated coverage for relevant HTTP, network, malformed-response, and structured-output failure cases.

These items are planned/tracked work. They are not part of 0.2.0 until implemented, tested, and documented.

---

# 9. Open Research Questions

These questions are intentionally unresolved:

- Should confidence eventually be independently calibrated rather than accepted directly from the provider?
- How should clarification questions interact with an ambiguity result?
- Which OpenAI-compatible structured-output variations should the built-in provider support?
- Which provider errors should be retried automatically, and under what caller-controlled policy?
- Should provider lifecycle controls belong directly in `OpenAICompatibleProviderOptions` or in a broader transport abstraction?

Do not record answers here as finalized architecture without explicit approval.

---

# 10. Packaging / Release Notes

The package is published as ESM with compiled output and TypeScript declarations.

The npm package contains the intended public distribution files rather than the repository's tests and agent documentation.

Development verification includes:

```bash
npm run build
npm run check
npm publish --dry-run
```

A real provider/model path should be verified before a release is treated as production-ready.

---

# 11. Important Files

- `README.md` — human-facing package documentation; current capabilities only plus clearly labeled limitations and future work.
- `agent-files/ARCHITECTURE.md` — authoritative finalized architecture.
- `agent-files/AGENTS.md` — agent workflow and repository rules.
- `agent-files/Agents_Context.md` — short-term implementation context and tracked work.
- `src/engine.ts` — core extraction orchestration.
- `src/schema.ts` — JSON Schema generation.
- `src/validation.ts` — runtime result validation.
- `src/providers/openai-compatible.ts` — built-in OpenAI-compatible HTTP provider.
- `tests/unit/intent-engine.test.mjs` — core unit coverage.
- `tests/integration/ollama.test.mjs` — real Ollama integration coverage.

---

# 12. Agent Working Rule

When documenting or implementing a change:

1. inspect the source and tests first;
2. state whether the behavior is current, planned, or unresolved;
3. keep README claims aligned with the implementation;
4. keep finalized architecture separate from proposals;
5. avoid unrelated changes;
6. do not mark planned work as complete until source and tests verify it.

