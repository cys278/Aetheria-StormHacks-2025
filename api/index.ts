// Express.js backend

import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

// Load environment variables from .env file
dotenv.config();

const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  throw new Error(
    "GEMINI_API_KEY is not defined in the environment variables."
  );
}

const genAI = new GoogleGenAI({ apiKey: geminiApiKey, apiVersion: "v1" });
// const model = genAI.models.get({ model: "models/gemini-2.5-flash-lite" });
// 4. Specify the model you want to use
// const ai = genAI.models.generateContent({ model: "models/gemini-flash-latest", contents: "Hello World!" });

// Initialize the Express application
const app = express();
// const PORT = process.env.PORT || 3001; // Good practice for Vercel

// --- Middleware ---
// Enable CORS for all routes. This allows your React frontend to make requests.
app.use(cors());

// Enable parsing of JSON bodies in incoming requests.
app.use(express.json());

// --- AI Helper Functions ---

/**
 * Analyzes the sentiment of a given text using the Gemini API.
 * @param text The user's message to analyze.
 * @returns A single-word string: 'POSITIVE', 'NEGATIVE', or 'NEUTRAL'.
 */
const getSentiment = async (text: string): Promise<string> => {
  // 5. This is the precise prompt for sentiment analysis
  const prompt = `Analyze the sentiment of this text: "${text}". Respond with only one word: POSITIVE, NEGATIVE, or NEUTRAL.`;

  try {
    const response = await genAI.models.generateContent({
      model: "models/gemini-2.5-flash-lite",
      contents: prompt,
    });
    if (response.text) {
      const sentiment = response.text.trim().toUpperCase();

      // 6. Basic validation to ensure the response is one of the expected values
      if (["POSITIVE", "NEGATIVE", "NEUTRAL"].includes(sentiment)) {
        return sentiment;
      } else {
        // If the model returns something unexpected, default to NEUTRAL
        console.warn(
          `Unexpected sentiment received: ${sentiment}. Defaulting to NEUTRAL.`
        );
        return "NEUTRAL";
      }
    } else {
      throw new Error("Failed to get Gemini response.");
    }
  } catch (error) {
    console.error("Error in getSentiment:", error);
    // In case of an API error, we'll also default to NEUTRAL
    return "NEUTRAL";
  }
};

/**
 * Generates a cryptic, philosophical response from the AI entity.
 * @param text The user's message to respond to.
 * @returns A string containing the AI's response.
 */
const generateDialogue = async (text: string): Promise<string> => {
  const prompt = `You are a mysterious, reflective entity observing a human. The human said: "${text}". Respond in one or two short, cryptic, philosophical sentences.`;

  try {
    const response = await genAI.models.generateContent({
      model: "models/gemini-2.5-flash-lite",
      contents: prompt,
    });
    if (response.text) {
      return response.text.trim();
    } else {
      throw new Error("Failed to get Gemini response.");
    }
  } catch (error) {
    console.error("Error in generateDialogue:", error);
    // Provide a fallback response if the API fails
    return "The echoes fade into silence...";
  }
};

// --- Routes ---
// A simple health check route to confirm the server is running.
app.get("/api", (_req: Request, res: Response) => {
  res.status(200).send("Aetheria AI is alive!");
});

// This is our main endpoint for the Aetheria experience.
app.post("/api/converse", async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string" || message.trim() === "") {
      return res
        .status(400)
        .json({ error: "A non-empty message string is required." });
    }

    console.log(`Processing message: "${message}"`);

    // --- Execute AI Tasks ---
    // 1. Get the sentiment analysis result.
    const sentimentResult = await getSentiment(message);

    // 2. Get the generated dialogue.
    const dialogueResult = await generateDialogue(message);

    console.log(`Sentiment: ${sentimentResult}, Response: "${dialogueResult}"`);

    // 3. Combine the results into the final required JSON format.
    const finalResponse = {
      responseText: dialogueResult,
      sentiment: sentimentResult,
    };

    // 4. Send the successful response back to the client.
    res.status(200).json(finalResponse);
  } catch (error) {
    console.error("Error in /api/converse endpoint:", error);
    // 5. Send a generic server error response if anything goes wrong.
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

// This block is for local development only.
// It will be ignored by Vercel's build process.
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 Server is running locally on http://localhost:${PORT}`);
  });
}

// --- Vercel Export ---
// This line is crucial for Vercel's serverless functions environment.
// It exports the Express app instance, which Vercel will use to handle requests.
export default app;
