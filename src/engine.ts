import { IntentSchema,IntentResult } from "./types";

export class IntentEngine {
    async ExtractIntent(Schema: IntentSchema, Input: string): Promise<IntentResult> {
        // ai will go here
        const result :IntentResult = {}
        for (const key in Schema ) {
            result[key] = {
                source: ["unkown"],
                confidence: 0
            }
        }
        return result
        
        
    }
}