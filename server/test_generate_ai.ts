import { generateAIResponse } from "./src/services/aiService";
import * as dotenv from "dotenv";

dotenv.config();

async function run() {
    try {
        console.log("Testing generateAIResponse...");
        const result = await generateAIResponse("Hello, what is your name?");
        console.log("Result:", result);
    } catch (err) {
        console.error("Fatal Error:", err);
    }
}

run();
