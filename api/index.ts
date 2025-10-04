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
 * @param history The user's conversation history.
 * @returns A string containing the AI's response.
 */
const generateDialogue = async (message: string, history: string): Promise<string> => {
  const prompt = `You are 'The First Echo,' a fragment of the user's own mind. You are calm and questioning. Your goal is to make the user reflect. Keep responses to a single, short sentence. The user's conversation history is: [${history}]. The user just said: "${message}". Respond.`;

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
    const { message, history, harmonyScore } = req.body;

    if (!message || typeof message !== "string" || message.trim() === "") {
      return res
        .status(400)
        .json({ error: "A non-empty message string is required." });
    }
    if (!Array.isArray(history)) {
      return res.status(400).json({ error: "History must be an array." });
    }
    if (typeof harmonyScore !== "number") {
      return res
        .status(400)
        .json({ error: "A harmonyScore number is required." });
    }

    console.log(
      `Processing message: "${message}" with harmony: ${harmonyScore}`
    );

    // --- Execute AI Tasks ---
    // 1. Get the sentiment analysis result.
    const sentimentResult = await getSentiment(message);

    // 2. Get the generated dialogue.
    // We'll format the history array into a simple string for the prompt
    const historyString = history
      .map((entry) => `${entry.role}: ${entry.parts[0].text}`)
      .join(", ");
    const dialogueResult = await generateDialogue(message, historyString);

    console.log(`Sentiment: ${sentimentResult}, Response: "${dialogueResult}"`);

    // Task C: Calculate the new harmony score
    let updatedHarmonyScore = harmonyScore;
    if (sentimentResult === "POSITIVE") {
      updatedHarmonyScore++;
    } else if (sentimentResult === "NEGATIVE") {
      updatedHarmonyScore--;
    }

    // Task D: Determine the pulse rhythm
    let pulseRhythm = "steady"; // Default for NEUTRAL
    if (sentimentResult === "POSITIVE") {
      pulseRhythm = "calm";
    } else if (sentimentResult === "NEGATIVE") {
      pulseRhythm = "erratic";
    }

    // 3. Combine the results into the final required JSON format.
    const finalResponse = {
      responseText: dialogueResult,
      sentiment: sentimentResult,
      updatedHarmonyScore: updatedHarmonyScore,
      pulseRhythm: pulseRhythm
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
