# Intent Engine

A schema-driven AI intent extraction library that converts natural language into structured, developer-defined data.

## Overview

Intent Engine allows developers to define what information they want to extract from users and uses AI to transform natural language input into structured intent data.

Instead of creating custom parsing logic for every search system, developers define the dimensions they care about, and Intent Engine handles converting user input into those dimensions.

## The Problem

Traditional search systems rely heavily on keywords and predefined filters.

For example:

```
"quiet apartment near the city with good restaurants"
```

A traditional system may only see:

```
location = city
amenities = restaurants
```

Intent Engine aims to understand the deeper intent:

```
{
  location: "near the city",
  atmosphere: "quiet",
  lifestyle: "access to restaurants"
}
```

## Core Concept

Developers define a schema:

```ts
const schema = {
  location: "Where does the user want to be located?",
  atmosphere: "How does the user want the environment to feel?",
  budget: "What is the user's spending preference?"
};
```

The user provides natural language:

```text
"I want a peaceful apartment close to restaurants, but I can spend a little more."
```

Intent Engine returns structured intent:

```json
{
  "location": {
    "value": "close to restaurants",
    "confidence": 0.9
  },
  "atmosphere": {
    "value": "peaceful",
    "confidence": 0.95
  },
  "budget": {
    "value": "flexible",
    "confidence": 0.8
  }
}
```

## Installation

```bash
npm install intent-engine
```

## Basic Usage

```ts
import { IntentEngine } from "intent-engine";

const engine = new IntentEngine();

const result = await engine.extract(
  "I want a quiet home near the city",
  {
    location: "Where does the user want to live?",
    feeling: "How should the home feel?"
  }
);

console.log(result);
```

## Design Philosophy

Intent Engine is built around three principles:

### 1. Developer-defined intelligence

The developer decides what dimensions matter.

The library does not assume every application needs the same understanding of users.

---

### 2. Structured output

AI responses should not be unpredictable text.

Intent Engine converts natural language into reliable data structures applications can use.

---

### 3. Provider flexibility

The goal is to avoid locking developers into one AI provider.

Future support may include:

* OpenAI
* Anthropic
* Local models
* Custom AI systems

## Planned Features

* [ ] Schema validation
* [ ] AI provider support
* [ ] Structured output parsing
* [ ] Confidence scoring
* [ ] Embedding-based semantic matching
* [ ] React components
* [ ] Framework integrations
* [ ] Python implementation

## Project Status

🚧 Early development

The core architecture is currently being designed.

## Contributing

Contributions, ideas, and discussions are welcome.

## License

MIT License
