export class IntentEngine {
    async ExtractIntent(Schema, Input) {
        // ai will go here
        const result = {};
        for (const key in Schema) {
            result[key] = {
                source: ["unkown"],
                confidence: 0
            };
        }
        return result;
    }
}
//# sourceMappingURL=engine.js.map