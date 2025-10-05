// Express.js backend - V2 Narrative Engine (Granular Prompt Control)

import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  throw new Error(
    "GEMINI_API_KEY is not defined in the environment variables."
  );
}

type PulseRhythm = "steady" | "calm" | "erratic";
type MoodType = "positive" | "negative" | "neutral";
type RebirthEvent = "REBIRTH_POSITIVE" | "REBIRTH_NEGATIVE" | null;
type Persona = "genesis" | "zenith" | "nadir";

// --- Session Management ---
interface ConversationTurn {
  userMessage: string;
  aiResponse: string;
  sentiment: string;
  intensity: number;
}

interface SessionState {
  pulseHarmony: PulseRhythm;
  harmonyScore: number;
  conversationHistory: ConversationTurn[];
  memories: string[];
  currentPersona: Persona;
}

const sessions = new Map<string, SessionState>();

const genAI = new GoogleGenAI({ apiKey: geminiApiKey, apiVersion: "v1" });

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Dynamic Prompt Engineering ---

/**
 * Builds a contextually rich, dynamic prompt based on all current factors.
 */
const buildDynamicPrompt = (
  userMessage: string,
  session: SessionState,
  worldState?: string
): string => {
  const {
    currentPersona,
    memories,
    harmonyScore,
    conversationHistory,
    pulseHarmony,
  } = session;

  // 1. Base Persona Definition
  let personaInstruction = "";

  switch (currentPersona) {
    case "genesis":
      personaInstruction = `You are Loki, a mysterious grumpy goblin poet with a sharp wit and dark humor.`;
      break;
    case "zenith":
      personaInstruction = `You are the Silent Observer, a serene and transcendent guide who has witnessed profound peace.`;
      break;
    case "nadir":
      personaInstruction = `You are a Broken Echo, a fragmented consciousness shattered by darkness.`;
      break;
  }

  // 2. Dynamic Tone Modulation based on Harmony Score
  let toneModulation = "";

  if (currentPersona === "genesis") {
    if (harmonyScore > 10) {
      toneModulation =
        "You're feeling unusually optimistic and playful, almost cheerful despite your grumpy nature.";
    } else if (harmonyScore > 5) {
      toneModulation =
        "You're in a decent mood, slightly less sarcastic than usual.";
    } else if (harmonyScore < -10) {
      toneModulation =
        "You're deeply irritated and your responses are sharp, cutting, and more cynical than ever.";
    } else if (harmonyScore < -5) {
      toneModulation =
        "You're noticeably grumpy, your sarcasm has an edge of genuine annoyance.";
    } else {
      toneModulation =
        "You maintain your signature sarcastic, slightly dark demeanor.";
    }
  } else if (currentPersona === "zenith") {
    if (harmonyScore > 12) {
      toneModulation =
        "You radiate pure wisdom and tranquility, your words flow like calm water.";
    } else {
      toneModulation = "You speak with gentle clarity and profound peace.";
    }
  } else if (currentPersona === "nadir") {
    if (harmonyScore < -12) {
      toneModulation =
        "You're barely coherent, your words fragment and repeat, glitching like a corrupted signal.";
    } else {
      toneModulation =
        "You speak in broken phrases, your consciousness fractured and unstable.";
    }
  }

  // 3. Pulse Rhythm Influence
  let rhythmInfluence = "";

  switch (pulseHarmony) {
    case "calm":
      rhythmInfluence = "Your speech is measured and thoughtful.";
      break;
    case "erratic":
      rhythmInfluence =
        "Your responses are quick, unpredictable, and energetic.";
      break;
    case "steady":
      rhythmInfluence = "Your cadence is balanced and consistent.";
      break;
  }

  // 4. World State Awareness
  let worldAwareness = "";
  if (worldState) {
    worldAwareness = `The world around you is currently ${worldState}. This atmospheric condition subtly influences your mood and the metaphors you use.`;
  }

  // 5. Memory Integration
  let memoryContext = "";
  if (memories.length > 0) {
    memoryContext = `You recall these significant moments from your conversation: ${memories.join(
      ", "
    )}. You may subtly reference these if contextually appropriate, showing you remember what matters.`;
  }

  // 6. Conversation History Context (last 3 turns for context)
  let recentContext = "";
  if (conversationHistory.length > 0) {
    const recentTurns = conversationHistory.slice(-3);
    const contextSummary = recentTurns
      .map(
        (turn) =>
          `User said: "${turn.userMessage}" (${turn.sentiment}, intensity: ${turn.intensity})`
      )
      .join(". ");
    recentContext = `Recent conversation context: ${contextSummary}.`;
  }

  // 7. Response Style Constraints
  const styleConstraints =
    currentPersona === "nadir"
      ? "Respond in 1-2 short, fragmented sentences. Sometimes repeat words. No markdown."
      : "Respond in 1-3 sentences with personality. Use Gen Z slang occasionally. No markdown.";

  // 8. Assemble the Complete Dynamic Prompt
  const fullPrompt = `
${personaInstruction}

TONE: ${toneModulation}
RHYTHM: ${rhythmInfluence}
${worldAwareness}
${memoryContext}
${recentContext}

USER MESSAGE: "${userMessage}"

${styleConstraints}

Respond now as your character, naturally incorporating all the context above:
`.trim();

  return fullPrompt;
};

// --- AI Helper Functions ---

/**
 * Analyzes the sentiment of a given text using the Gemini API.
 */
const getSentiment = async (text: string): Promise<string> => {
  const prompt = `Analyze the sentiment of this text: "${text}". Respond with only one word: POSITIVE, NEGATIVE, or NEUTRAL.`;

  try {
    const response = await genAI.models.generateContent({
      model: "models/gemini-2.5-flash-lite",
      contents: prompt,
    });

    if (response.text) {
      const sentiment = response.text.trim().toUpperCase();

      if (["POSITIVE", "NEGATIVE", "NEUTRAL"].includes(sentiment)) {
        return sentiment;
      } else {
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
    return "NEUTRAL";
  }
};

/**
 * Analyzes the emotional intensity of a message.
 */
const getSentimentIntensity = async (
  text: string,
  sentiment: string
): Promise<number> => {
  const prompt = `On a scale of 1 to 5, how intense is the ${sentiment.toLowerCase()} sentiment of this phrase: "${text}"? Respond with only a single number.`;

  try {
    const response = await genAI.models.generateContent({
      model: "models/gemini-2.5-flash-lite",
      contents: prompt,
    });

    if (response.text) {
      const intensity = parseInt(response.text.trim(), 10);

      if (!isNaN(intensity) && intensity >= 1 && intensity <= 5) {
        return intensity;
      } else {
        console.warn(
          `Unexpected intensity received: ${response.text}. Defaulting to 2.`
        );
        return 2;
      }
    } else {
      throw new Error("Failed to get Gemini response.");
    }
  } catch (error) {
    console.error("Error in getSentimentIntensity:", error);
    return 2;
  }
};

/**
 * Extracts the key concept from a highly emotional message.
 */
const extractKeyConcept = async (text: string): Promise<string> => {
  const prompt = `Extract the single most important noun or concept from this phrase: "${text}". Respond with only one or two words.`;

  try {
    const response = await genAI.models.generateContent({
      model: "models/gemini-2.5-flash-lite",
      contents: prompt,
    });

    if (response.text) {
      const concept = response.text.trim();
      return concept;
    } else {
      throw new Error("Failed to get Gemini response.");
    }
  } catch (error) {
    console.error("Error in extractKeyConcept:", error);
    return "memory";
  }
};

/**
 * NEW: Generate AI response using dynamic prompt engineering.
 */
const generateAIResponse = async (
  userMessage: string,
  session: SessionState,
  worldState?: string
): Promise<string> => {
  const dynamicPrompt = buildDynamicPrompt(userMessage, session, worldState);

  console.log("🎭 Dynamic Prompt Generated:\n", dynamicPrompt);

  try {
    const response = await genAI.models.generateContent({
      model: "models/gemini-2.5-flash-lite",
      contents: dynamicPrompt,
      config: {
        temperature: 0.9,
        topP: 0.9,
        maxOutputTokens: 150,
      },
    });

    if (response.text) {
      return response.text.trim();
    } else {
      throw new Error("Failed to get Gemini response.");
    }
  } catch (error) {
    console.error("Error in generateAIResponse:", error);
    return "...";
  }
};

// --- Routes ---
app.get("/api", (_req: Request, res: Response) => {
  res
    .status(200)
    .send("Aetheria AI V2 Narrative Engine (Granular Control) is alive!");
});

app.post("/api/converse", async (req: Request, res: Response) => {
  try {
    const { sessionId, message, worldState } = req.body;
    if (!sessionId || !message) {
      return res
        .status(400)
        .json({ error: "sessionId and message are required." });
    }

    // Get or create the user's session
    let userSession: SessionState;
    if (sessions.has(sessionId)) {
      userSession = sessions.get(sessionId)!;
    } else {
      userSession = {
        pulseHarmony: "steady",
        harmonyScore: 0,
        conversationHistory: [],
        memories: [],
        currentPersona: "genesis",
      };
    }

    console.log(
      `\n🎮 Processing message | Harmony: ${
        userSession.harmonyScore
      } | Persona: ${userSession.currentPersona} | WorldState: ${
        worldState || "none"
      }`
    );

    // --- Execute AI Tasks ---

    // 1. Get the sentiment analysis result
    const sentimentResult = await getSentiment(message);

    // 2. Get the emotional intensity
    const intensity = await getSentimentIntensity(message, sentimentResult);
    console.log(`💭 Sentiment: ${sentimentResult}, Intensity: ${intensity}`);

    // 3. Extract and store core memory for high-intensity messages
    if (intensity > 3) {
      const keyConcept = await extractKeyConcept(message);
      userSession.memories.push(keyConcept);
      console.log(`🧠 Core memory stored: ${keyConcept}`);
    }

    // 4. Map sentiment to mood type
    let mood: MoodType = "neutral";
    switch (sentimentResult) {
      case "POSITIVE":
        mood = "positive";
        break;
      case "NEGATIVE":
        mood = "negative";
        break;
      default:
        mood = "neutral";
    }

    // 5. NEW: Generate AI response using granular dynamic prompting
    const dialogueResult = await generateAIResponse(
      message,
      userSession,
      worldState
    );

    if (!dialogueResult) {
      return res.status(200).json({
        responseText: "I'm silent...",
        sentiment: "neutral",
        updatedHarmonyScore: userSession.harmonyScore,
        pulseRhythm: userSession.pulseHarmony,
        memories: userSession.memories,
        event: null,
        persona: userSession.currentPersona,
      });
    }

    // 6. Update harmony score based on sentiment and intensity
    if (sentimentResult === "POSITIVE") {
      userSession.harmonyScore += intensity;
    } else if (sentimentResult === "NEGATIVE") {
      userSession.harmonyScore -= intensity;
    }

    // 7. Store conversation turn with rich metadata
    userSession.conversationHistory.push({
      userMessage: message,
      aiResponse: dialogueResult,
      sentiment: sentimentResult,
      intensity: intensity,
    });

    // 8. Determine pulse rhythm based on sentiment
    let pulseRhythm: PulseRhythm = "steady";
    if (sentimentResult === "POSITIVE") {
      pulseRhythm = "calm";
    } else if (sentimentResult === "NEGATIVE") {
      pulseRhythm = "erratic";
    }
    userSession.pulseHarmony = pulseRhythm;

    // 9. Check for Rebirth thresholds with persona shifts
    let rebirthEvent: RebirthEvent = null;

    if (userSession.harmonyScore > 15) {
      rebirthEvent = "REBIRTH_POSITIVE";
      userSession.harmonyScore = 0;
      userSession.currentPersona = "zenith";
      userSession.conversationHistory = [];
      userSession.memories = [];
      console.log("🌟 REBIRTH_POSITIVE triggered! Persona: Zenith");
    } else if (userSession.harmonyScore < -15) {
      rebirthEvent = "REBIRTH_NEGATIVE";
      userSession.harmonyScore = 0;
      userSession.currentPersona = "nadir";
      userSession.conversationHistory = [];
      userSession.memories = [];
      console.log("💀 REBIRTH_NEGATIVE triggered! Persona: Nadir");
    }

    // 10. Save updated session
    sessions.set(sessionId, userSession);

    // 11. Send enhanced response with all fields
    const finalResponse = {
      responseText: dialogueResult,
      sentiment: mood,
      updatedHarmonyScore: userSession.harmonyScore,
      pulseRhythm: pulseRhythm,
      memories: userSession.memories,
      event: rebirthEvent,
      persona: userSession.currentPersona,
    };

    res.status(200).json(finalResponse);
  } catch (error) {
    console.error("Error in /api/converse endpoint:", error);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

// Local development server
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(
      `🚀 Aetheria V2 Granular Control Server running on http://localhost:${PORT}`
    );
  });
}

// Vercel Export
export default app;
