# Intent Engine Architecture

## Document Authority

This file is the authoritative record of finalized Intent Engine architectural decisions.

`agent-files/Agents_Context.md` is short-term working context. It may contain hypotheses, implementation discoveries, open questions, and current work, but finalized architecture belongs here after Bryan explicitly approves it.

## Current Direction

Intent Engine is a focused TypeScript/NPM library for schema-driven AI intent extraction. The intended developer-facing abstraction is centered on extracting structured intent from natural-language input using a developer-defined schema.

The provider boundary should remain separate from the core intent model so the library is not unnecessarily coupled to one AI provider.

## Unfinalized Areas

Provider selection, validation strategy, confidence scoring, schema format, ambiguity handling, and other future capabilities remain subject to implementation and explicit architectural decisions.
