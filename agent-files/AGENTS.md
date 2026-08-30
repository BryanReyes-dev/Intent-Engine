# Agent Instructions — Intent Engine

Intent Engine is a TypeScript/NPM library for converting natural-language input into structured, developer-defined intent data.

## Before Working

1. Read `agent-files/Agents_Context.md` for current working state.
2. Read `agent-files/ARCHITECTURE.md` for finalized architectural decisions.
3. Inspect the current public API and implementation before changing it.
4. Keep the library focused on developer-facing intent extraction and avoid unnecessary feature expansion.

## Documentation Authority

- `ARCHITECTURE.md` is authoritative for finalized architecture.
- `Agents_Context.md` is temporary working context.
- Do not silently promote proposals or hypotheses into architecture.
- Architectural changes require Bryan's explicit approval before being recorded as finalized.

## Implementation Rules

- Preserve a provider-flexible public API.
- Keep provider-specific implementation details behind appropriate boundaries.
- Keep public types and exports intentional.
- Tests and documentation should match the actual implementation.
- Do not claim planned features are implemented without verifying the source.
- Avoid unrelated changes when working on a focused task.
