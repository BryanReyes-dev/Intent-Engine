export type IntentValue = string | number | boolean;

export type IntentField = {
  field: string;
  values?: readonly IntentValue[];
};

export type IntentSchema = Record<string, IntentField>;

export type IntentResult = Record<string, {
  value: IntentValue | null;
  source: string[];
  confidence: number;
}>;
