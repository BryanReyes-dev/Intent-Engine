# Intent Engine — Agents Context

> **Purpose:** Shared short-term working context between Bryan, ChatGPT, Codex, and other agents working on Intent Engine.
>
> This file is intentionally non-secret and may be committed to the public repository.
>
> This is a living workspace for current context, ideas, hypotheses, implementation discoveries, preferences, open questions, and agent-to-agent communication. It is **not the authoritative architecture document**.
>
> Finalized architectural decisions belong in `agent-files/ARCHITECTURE.md` after Bryan explicitly approves them.

---

# 0. Context Budget & Maintenance Policy

This file is short-term working memory. Its value comes from high-signal information, not from accumulating every thought.

## Hard rule: do not repeat context unnecessarily

Agents should actively avoid repeating information already present here or in authoritative architecture documentation. Before adding a note, ask:

- Is this information actually new?
- Is it already documented elsewhere?
- Can an existing note be updated instead?
- Is it still relevant?
- Does it belong in `ARCHITECTURE.md` instead?

Prefer editing, consolidating, replacing, or removing existing context over appending another explanation of the same thing.

The file has a finite practical size and agents must treat that limit as real.

### Current policy

- Preferred working size: approximately **5,000–10,000 tokens**.
- Warning zone: **10,000–15,000 tokens**.
- Hard ceiling: **15,000 tokens** unless Bryan explicitly changes this policy.
- After a material edit, refresh the Context Metrics below.

### Context Metrics

- **Last measured:** 2026-08-22
- **Approximate token count:** intentionally kept compact; exact tokenizer measurement not currently available
- **Preferred range:** 5,000–10,000 tokens
- **Hard ceiling:** 15,000 tokens
- **Status:** Healthy
- **Measurement note:** Approximate until an appropriate exact tokenizer is available.

---

# 1. How Agents Should Use This File

Agents working on Intent Engine should read this file when beginning substantial work.

Clearly distinguish:

- established facts
- current implementation plans
- hypotheses
- proposals
- open questions
- rejected ideas
- implementation discoveries
- finalized architecture

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

Intent Engine is a TypeScript/NPM library for converting natural-language input into structured, developer-defined intent data.

The core idea is:

```text
Natural Language
      ↓
Intent Engine
      ↓
Developer-defined Schema
      ↓
Structured Intent
```

The developer decides which dimensions matter to their application. Intent Engine should handle the AI-assisted extraction rather than forcing every application to build custom parsing logic.

The current README describes it as a schema-driven AI intent extraction library and provides an NPM installation and TypeScript usage example. fileciteturn3file0L2-L2

Intent Engine is intended to be a focused developer library, not a general-purpose AI assistant.

---

# 3. Current Repository State

The repository currently contains:

- `src/engine.ts`
- `src/index.ts`
- `src/types.ts`
- compiled `dist/` output
- `package.json`
- TypeScript configuration
- `README.md`
- an existing NPM-oriented package structure

The README currently identifies the project as **early development** and lists schema validation, AI provider support, structured output parsing, confidence scoring, embedding-based semantic matching, React components, framework integrations, and a Python implementation as planned features. fileciteturn3file0L2-L2

The existing package structure already makes Intent Engine a good candidate for a small, polished public NPM library.

---

# 4. Product Direction

The immediate goal is **not** to build every planned feature.

The immediate goal is to make the smallest version of Intent Engine that is genuinely useful, reliable, documented, and publishable.

Target progression:

```text
Current prototype
      ↓
Stable core API
      ↓
Provider abstraction
      ↓
Reliable structured extraction
      ↓
Validation + confidence handling
      ↓
Tests + examples
      ↓
NPM publication
      ↓
Real developer feedback
      ↓
More providers / integrations
      ↓
Broader intent infrastructure
```

The first public milestone should prioritize **quality and usability over feature count**.

---

# 5. Core API Direction

The current conceptual API is:

```ts
const engine = new IntentEngine();

const result = await engine.extract(
  "I want a quiet home near the city",
  {
    location: "Where does the user want to live?",
    feeling: "How should the home feel?"
  }
);
```

This API should remain simple from the developer's perspective.

The core abstraction should eventually support:

```text
Developer schema
      ↓
Provider/model abstraction
      ↓
Intent extraction
      ↓
Validated structured result
```

Do not lock the library to one AI provider.

The provider boundary should make it possible to support hosted APIs, local models, and potentially custom AI systems without changing the developer-facing intent model unnecessarily.

---

# 6. Immediate Development Priorities

Prioritize these in roughly this order:

### 1. Make the core extraction path real

The package should perform actual AI-assisted intent extraction rather than remain primarily a conceptual prototype.

### 2. Define a clean provider abstraction

Separate:

```text
Intent Engine
      ↓
AI Provider
      ↓
Model/API
```

The engine should not be tightly coupled to a single provider implementation.

### 3. Make structured output reliable

The result should be predictable and usable by TypeScript applications.

Investigate schema validation and malformed-model-output handling before adding many features.

### 4. Establish a strong type system

Define clear public types for schemas, extracted values, confidence information, errors, provider configuration, and results.

### 5. Add tests

Test both successful extraction and failure cases. Tests should become a major part of the package's credibility before publication.

### 6. Improve developer experience

A developer should be able to:

```bash
npm install intent-engine
```

then follow a short example and get a useful result quickly.

### 7. Publish and validate externally

The first important external milestone is not a large feature set. It is getting the library into developers' hands and learning whether they actually want it.

---

# 7. Features to Investigate After the Core Works

Potential next features, not commitments:

- Schema validation
- Multiple AI providers
- Local model support
- Structured output enforcement
- Confidence scoring
- Retry/fallback behavior
- Embedding-based semantic matching
- Batch intent extraction
- Streaming where useful
- React integrations
- Next.js integrations
- Framework adapters
- Python implementation
- Observability/debugging information
- Caching where appropriate

Features should be prioritized according to actual developer demand rather than simply completing the current README checklist.

---

# 8. Market / Recognition Strategy

Intent Engine is currently viewed as a **developer-recognition project** more than a primary business.

The strategic goal is to create a small piece of useful infrastructure that can:

- be published to NPM
- be discovered by developers
- generate GitHub/NPM usage and recognition
- demonstrate AI engineering ability
- provide evidence that Bryan can design and ship reusable developer tooling

Monetization is possible later, but the immediate success metric should be **real adoption and developer usefulness**.

Do not add unnecessary monetization infrastructure before there is evidence of demand.

Potential future monetization could involve hosted providers, premium functionality, enterprise features, or services, but these are hypotheses rather than current requirements.

---

# 9. Relationship to Bryan's Other Projects

Intent Engine is one part of a broader portfolio:

```text
Evergreen Estates
    → Production web development / employability

Intent Engine
    → Developer infrastructure / NPM recognition

Daedalus
    → Local AI runtime / potential company

Prometheus
    → Long-term AI research / flagship "wow" project
```

Intent Engine should therefore remain **focused and relatively contained**. It should not grow into another Daedalus-sized project unless external evidence justifies it.

The current objective is to make Intent Engine polished enough that it earns recognition without consuming the time needed for larger priorities.

---

# 10. Public API Philosophy

The library should feel like infrastructure rather than a chatbot SDK.

Prefer:

```ts
engine.extract(input, schema)
```

over exposing unnecessary model-specific details.

The developer should primarily care about:

- what information they want
- what input they provide
- what structured result they receive
- how errors are handled

Provider-specific configuration should remain available without polluting the core abstraction.

Avoid designing the API around a single model vendor.

---

# 11. Quality Requirements Before NPM Publication

Before considering the package production-ready enough for public adoption:

- Core API works reliably.
- TypeScript types are clean and intentional.
- Public exports are deliberate.
- Build output is correct.
- README matches the actual implementation.
- Installation works from a clean project.
- Examples are executable and accurate.
- Errors are understandable.
- Tests cover core behavior and failure modes.
- Provider configuration is documented.
- No secrets are committed.
- Package metadata is professional.
- Versioning follows a deliberate scheme.

Do not publish a package merely because `npm publish` succeeds. The goal is a library another developer would actually trust enough to install.

---

# 12. Open Questions

These are deliberately unresolved until implementation or user feedback provides evidence:

- Which AI provider should be the first official provider?
- Should the first release support one provider extremely well or multiple providers immediately?
- Should confidence scores come from the model, an independent scoring mechanism, or both?
- How strict should schema validation be?
- Should the schema format remain plain TypeScript objects or support a formal schema standard such as JSON Schema/Zod?
- How should ambiguous user intent be represented?
- Should extraction return missing fields, `null`, uncertainty, or clarification requests?
- How much provider-specific functionality should be exposed?
- What is the smallest feature set that developers would actually install?

These are questions, not decisions.

---

# 13. Agent Communication

## ChatGPT

Current understanding:

- Intent Engine is a focused TypeScript/NPM library for schema-driven intent extraction.
- The immediate objective is to turn the current prototype into a genuinely useful and publishable package.
- Developer recognition and adoption are more important than immediate monetization.
- The package should remain provider-flexible.
- The core abstraction should stay simple.
- Avoid feature creep until the core is reliable.
- Real developer feedback should determine later priorities.

### Future thoughts

_Add only genuinely new observations. Do not restate established context._

## Codex

Use this section for implementation discoveries and useful observations that another agent needs.

### Current thoughts

_Add implementation discoveries here._

### Repository observations

_Add useful observations about the existing implementation here._

### Concerns / risks

_Add implementation or architecture concerns here. If a concern becomes a finalized architectural decision, ask Bryan before moving it into `ARCHITECTURE.md`._

### Future thoughts

_Add ideas worth discussing before implementation._

---

# 14. Maintenance Reminder for Future Agents

**Do not let this file become a second architecture document.**

When an idea becomes finalized architecture, ask Bryan for approval and move the authoritative decision to `agent-files/ARCHITECTURE.md`.

When the same context changes, update the existing note rather than appending another explanation.

The goal is for `Agents_Context.md` to remain a compact, high-signal, changing working context while `ARCHITECTURE.md` remains the authoritative record of deliberate architectural decisions.
