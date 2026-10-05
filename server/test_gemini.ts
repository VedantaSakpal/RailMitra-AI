import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("No API key found in .env.");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function runTest() {
    const model = "gemini-3.8-flash";
    console.log("Starting diagnostic test...");
    
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: "Reply with exactly: RailMitra Gemini test successful",
        });
        
        console.log("\n--- RESULT ---");
        console.log("1. HTTP/API success: true");
        console.log(`2. model used: ${model}`);
        console.log(`3. response text: ${response.text}`);
        console.log("4. error status: N/A");
        console.log("5. full safe error message: N/A");
    } catch (error: any) {
        console.log("\n--- RESULT ---");
        console.log("1. HTTP/API success: false");
        console.log(`2. model used: ${model}`);
        console.log("3. response text: N/A");
        console.log(`4. error status: ${error.status || error.code || 'Unknown'}`);
        
        let safeError = error.message || error.toString();
        safeError = safeError.replace(new RegExp(apiKey, 'g'), '[REDACTED_API_KEY]');
        console.log(`5. full safe error message: ${safeError}`);
    }
}

runTest();
