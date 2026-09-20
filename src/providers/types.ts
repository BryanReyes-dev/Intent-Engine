import type { IntentSchema } from "../types.js";

export type IntentProviderRequest = {
  schema: IntentSchema;
  input: string;
};

export type IntentProvider = {
  extract(request: IntentProviderRequest): Promise<unknown>;
};