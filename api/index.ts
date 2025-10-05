// Express.js backend

import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI, Content } from "@google/genai";

// Load environment variables from .env file
dotenv.config();

const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  throw new Error(
    "GEMINI_API_KEY is not defined in the environment variables."
  );
}

type PulseRhythm = "steady" | "calm" | "erratic";

// --- Session Management ---
interface SessionState {
  pulseHarmony: PulseRhythm;
  harmonyScore: number;
  history: Content[]; // Using the 'Content' type from the SDK
}
const sessions = new Map<string, SessionState>();

const genAI = new GoogleGenAI({ apiKey: geminiApiKey, apiVersion: "v1" });

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

// --- Routes ---
// A simple health check route to confirm the server is running.
app.get("/api", (_req: Request, res: Response) => {
  res.status(200).send("Aetheria AI is alive!");
});

// This is our main endpoint for the Aetheria experience.
app.post("/api/converse", async (req: Request, res: Response) => {
  try {
    const { sessionId, message } = req.body;
    if (!sessionId || !message) {
      return res
        .status(400)
        .json({ error: "sessionId and message are required." });
    }

    // 1. Get or create the user's session
    let userSession: SessionState;
    if (sessions.has(sessionId)) {
      userSession = sessions.get(sessionId)!;
    } else {
      userSession = {
        pulseHarmony: "steady",
        harmonyScore: 0,
        // NEW: Add a system instruction to the start of the history
        // to set the AI's persona for the entire chat session.
        history: [
          {
            role: "user",
            parts: [
              {
                text: "System instruction: You are Loki, a mysterious grumpy goblin poet. Respond to the user's message in a short, sassy, sarcastic, and slightly dark sense of humor, but sprinkle in Gen Z slang, witty remarks, and sometimes ironic or edgy comments. Limit your response to 1-3 sentences. No markdown formatting.",
              },
            ],
          },
          {
            role: "model",
            parts: [{ text: "Hi there!" }],
          },
        ],
      };
    }

    // --- Execute AI Tasks ---
    // 1. Get the sentiment analysis result.
    const sentimentResult = await getSentiment(message);

    console.log(
      `Processing message: "${message}" with harmony: ${userSession.harmonyScore}`
    );

    // 2. NEW: Use the proper chat session method
    const chat = genAI.chats.create({
      history: userSession.history,
      model: "models/gemini-2.5-flash-lite",
      config: {
        temperature: 0.9, // creative and more expressive, max 1
        topP: 0.9, // allows more diverse choices
        // maxOutputTokens: 50, // 30 to 40 words
      },
    });

    const result = await chat.sendMessage({
      message
    });
    const dialogueResult = result.text;

    if (!dialogueResult) {
      res.status(200).json({
        responseText: "I'm silent...",
        sentiment: sentimentResult,
        updatedHarmonyScore: userSession.harmonyScore,
        pulseRhythm: userSession.pulseHarmony,
      });
    }

    if (sentimentResult === "POSITIVE") userSession.harmonyScore++;
    if (sentimentResult === "NEGATIVE") userSession.harmonyScore--;

    userSession.history.push({ role: "user", parts: [{ text: message }] });
    userSession.history.push({
      role: "model",
      parts: [{ text: dialogueResult }],
    });

    sessions.set(sessionId, userSession);

    // Task D: Determine the pulse rhythm
    let pulseRhythm: PulseRhythm = "steady"; // Default for NEUTRAL
    if (sentimentResult === "POSITIVE") {
      pulseRhythm = "calm";
    } else if (sentimentResult === "NEGATIVE") {
      pulseRhythm = "erratic";
    }

    userSession.pulseHarmony = pulseRhythm;

    // 3. Combine the results into the final required JSON format.
    const finalResponse = {
      responseText: dialogueResult,
      sentiment: sentimentResult,
      updatedHarmonyScore: userSession.harmonyScore,
      pulseRhythm: pulseRhythm,
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
