export type IntentSchema = {
    [key: string]: string;
}

export type IntentResult = {
    [key: string]: {
        source: string[];
        confidence: number;
    }
}