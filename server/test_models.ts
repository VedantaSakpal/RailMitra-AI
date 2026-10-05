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
    const modelsToTest = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"];
    
    for (const model of modelsToTest) {
        console.log(`\nTesting model: ${model}`);
        try {
            const response = await ai.models.generateContent({
                model: model,
                contents: "Reply with exactly: test",
            });
            console.log(`Success! Response: ${response.text}`);
        } catch (error: any) {
            console.log(`Failed. Error status: ${error.status || error.code || 'Unknown'}`);
            console.log(error.message || error.toString());
        }
    }
}

runTest();
