// Express.js backend - V2 Narrative Engine (Granular Prompt Control)

import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
// import axios from "axios";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { Readable } from "stream";

dotenv.config();
const ELEVENLABS_VOICE_ID = "a7vno2SJkTdglAq4liNI";
const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  throw new Error(
    "GEMINI_API_KEY is not defined in the environment variables."
  );
}
const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;

if (!elevenLabsApiKey) {
  throw new Error(
    "ELVEN_LABS_API_KEY is not defined in the environment variables."
  );
}

type PulseRhythm = "steady" | "calm" | "erratic";
type MoodType = "positive" | "negative" | "neutral";
// type RebirthEvent =
//   | "JOURNEY_COMPLETE"
//   | "ENTER_CITADEL"
//   | "REBIRTH_POSITIVE"
//   | "REBIRTH_NEGATIVE"
//   | null;
type Persona = "genesis" | "zenith" | "nadir" | "core";

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
  inCitadel: boolean;
  hasAchievedZenith: boolean;
  hasAchievedNadir: boolean;

  deceptionActive: boolean; // Is Loki currently lying?
  correctChallenges: number; // How many times the player has unmasked Loki.
  keyForged: boolean; // Has the player won the game?

  sentimentStreak: {
    // Tracks repetitive emotional input
    type: "POSITIVE" | "NEGATIVE" | "NEUTRAL" | null;
    count: number;
  };
  lastChallengeTurn: number; // To prevent spamming challenges
}

interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number; // Optional style parameter
  use_speaker_boost?: boolean;
}

const sessions = new Map<string, SessionState>();

const genAI = new GoogleGenAI({ apiKey: geminiApiKey, apiVersion: "v1" });
const elevenlabs = new ElevenLabsClient({
  apiKey: elevenLabsApiKey,
});

const app = express();

/* ------------------------------ CORS SETUP ------------------------------ */
// Allow both local dev and Vercel preview/prod frontends
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://aetheria.vercel.app",
  /\.vercel\.app$/ // allow any Vercel preview URL
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow server-to-server or local tools
      if (allowedOrigins.some((o) => (typeof o === "string" ? o === origin : o.test(origin)))) {
        callback(null, true);
      } else {
        console.warn("❌ Blocked CORS request from:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Handle preflight for all routes
app.options(/^\/api\/.*$/, cors());

/* ----------------------------------------------------------------------- */
app.use(express.json());

// --- Dynamic Prompt Engineering ---

/**
 * Removes common markdown formatting from a string to prevent TTS from reading it aloud.
 * @param text The text to clean.
 * @returns The cleaned text.
 */
const cleanMarkdown = (text: string): string => {
  return text
    .replace(/\*/g, "") // Removes asterisks (bold/italics)
    .replace(/_/g, "")  // Removes underscores (italics)
    .replace(/#/g, "")  // Removes hashes (headers)
    .replace(/`/g, ""); // Removes backticks (code)
};

/**
 * Builds a contextually rich, dynamic prompt based on all current factors.
 */
const buildDynamicPrompt = (
  userMessage: string,
  session: SessionState,
  worldState: string | undefined,
  targetMood: MoodType
): string => {
  const {
    currentPersona,
    memories,
    harmonyScore,
    conversationHistory,
    pulseHarmony,
    deceptionActive,
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
  if (deceptionActive) {
    // If deceiving, the AI must act out the target mood perfectly.
    toneModulation = `IMPORTANT: You are currently deceiving the user. Your response MUST PERFECTLY embody a '${targetMood}' mood. This is an act. Do not reveal the deception. The user is testing you. Your performance must be flawless.`;
  } else {
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

const generateVoiceSettings = (
  persona: Persona,
  pulseRhythm: PulseRhythm
): VoiceSettings => {
  // Default settings for a balanced 'Genesis' state
  let settings: VoiceSettings = {
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.2,
    use_speaker_boost: true,
  };

  // Persona-based adjustments
  switch (persona) {
    case "zenith":
      // The calm, wise observer. Very stable, very clear.
      settings.stability = 0.75;
      settings.similarity_boost = 0.8;
      settings.style = 0.1;
      break;
    case "nadir":
      // The broken echo. Highly unstable, low similarity to make it sound "off."
      settings.stability = 0.25;
      settings.similarity_boost = 0.6;
      settings.style = 0.6; // More exaggerated style for a "glitchy" feel
      break;
    case "genesis":
    case "core": // The core self can be clear and stable.
      // Default settings are good for Genesis/Core
      break;
  }

  // Pulse Rhythm adjustments - this adds the real-time emotional layer
  switch (pulseRhythm) {
    case "calm":
      // When calm, slightly increase stability.
      settings.stability = Math.min(settings.stability + 0.1, 1.0);
      break;
    case "erratic":
      // When erratic/agitated, decrease stability to make the voice more variable and emotional.
      settings.stability = Math.max(settings.stability - 0.15, 0);
      settings.style = (settings.style || 0) + 0.2; // Slightly more theatrical
      break;
    case "steady":
      // No change for steady rhythm
      break;
  }

  console.log(
    `🎤 Voice settings generated for [Persona: ${persona}, Rhythm: ${pulseRhythm}]:`,
    settings
  );
  return settings;
};

/**
 * Analyzes the sentiment of a given text using the Gemini API.
 */
const getSentiment = async (
  text: string
): Promise<"NEUTRAL" | "POSITIVE" | "NEGATIVE"> => {
  const prompt = `Analyze the sentiment of this text: "${text}". Respond with only one word: POSITIVE, NEGATIVE, or NEUTRAL.`;

  try {
    const response = await genAI.models.generateContent({
      model: "models/gemini-2.5-flash-lite",
      contents: prompt,
    });

    if (response.text) {
      const sentiment = response.text.trim().toUpperCase();

      // Type guard to narrow the type
      if (
        sentiment === "POSITIVE" ||
        sentiment === "NEGATIVE" ||
        sentiment === "NEUTRAL"
      ) {
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
  worldState: string | undefined,
  targetMood: MoodType
): Promise<string> => {
  const dynamicPrompt = buildDynamicPrompt(
    userMessage,
    session,
    worldState,
    targetMood
  );

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
      const rawText = response.text.trim();
      const cleanedText = cleanMarkdown(rawText);
      return cleanedText;
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
        inCitadel: false,
        hasAchievedNadir: false,
        hasAchievedZenith: false,
        deceptionActive: false,
        correctChallenges: 0,
        keyForged: false,
        sentimentStreak: { type: null, count: 0 },
        lastChallengeTurn: 0,
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
    const currentTurn = userSession.conversationHistory.length;
    // 1. Get the sentiment analysis result
    const sentimentResult: "POSITIVE" | "NEGATIVE" | "NEUTRAL" | null =
      await getSentiment(message);

    // Update sentiment streak
    if (userSession.sentimentStreak.type === sentimentResult) {
      userSession.sentimentStreak.count++;
    } else {
      userSession.sentimentStreak = { type: sentimentResult, count: 1 };
    }

    // If the player is being repetitive, Loki calls them out. This OVERRIDES normal conversation.
    if (userSession.sentimentStreak.count >= 3 && !userSession.keyForged) {
      console.log(
        `🧐 PATTERN DETECTED: Player has a streak of ${userSession.sentimentStreak.count} ${userSession.sentimentStreak.type} messages.`
      );
      let perceptionText = "";
      if (userSession.sentimentStreak.type === "POSITIVE") {
        perceptionText =
          "Such consistent kindness... Are you trying to soothe me, or yourself? A relentless light can cast its own shadows.";
      } else if (userSession.sentimentStreak.type === "NEGATIVE") {
        perceptionText =
          "Anger, again and again. A stuck record. Are you truly this furious, or is it just the only song you know how to play right now?";
      } else {
        perceptionText =
          "Neutrality. Apathy. Detachment. You're building a fortress of indifference. Are you protecting yourself from me, or from what you might feel if you stopped?";
      }
      userSession.sentimentStreak.count = 0; // Reset streak after calling it out
      return res.status(200).json({
        responseText: perceptionText,
        sentiment: "neutral",
        pulseRhythm: "steady",
        // Send back existing state without changing it
        updatedHarmonyScore: userSession.harmonyScore,
        memories: userSession.memories,
        event: null,
        persona: userSession.currentPersona,
      });
    }

    const PENALTY_THRESHOLD = 20; // Set a higher threshold
    const score = userSession.harmonyScore;

    // A) If the player is already in the Citadel, their next message sends them back.
    if (userSession.inCitadel) {
      console.log(
        "🏰 Player is responding from the Citadel. Resetting harmony and returning."
      );
      userSession.inCitadel = false;
      userSession.harmonyScore = 0; // Reset the score
      sessions.set(sessionId, userSession);

      return res.status(200).json({
        responseText: "The echo fades... You find yourself back in the void.", // A message to signal the return
        sentiment: "neutral",
        pulseRhythm: "steady",
        updatedHarmonyScore: userSession.harmonyScore, // Send the new score (0)
        memories: userSession.memories,
        event: "EXIT_CITADEL", // The new event to trigger scene change
        persona: "genesis", // Return them to the Loki persona
      });
    }

    // B) If they cross the penalty threshold, send them to the Citadel.
    if (Math.abs(score) >= PENALTY_THRESHOLD) {
      console.log(
        `🏰 PENALTY TRIGGERED! Harmony score (${score}) exceeded threshold.`
      );
      userSession.inCitadel = true;

      const penaltyDialogue =
        score > 0
          ? "This relentless light... it borders on mania. A true self requires balance. Calm yourself."
          : "This rage is consuming you. It deafens you to the truth. A true self requires clarity. Find your center.";

      sessions.set(sessionId, userSession);

      return res.status(200).json({
        responseText: penaltyDialogue,
        sentiment: score > 0 ? "positive" : "negative",
        pulseRhythm: score > 0 ? "calm" : "erratic",
        updatedHarmonyScore: userSession.harmonyScore,
        memories: userSession.memories,
        event: "ENTER_CITADEL",
        persona: "core", // Use the Core Echo persona
      });
    }

    // --- 2. THE CHALLENGE MECHANIC: Check for unmasking attempts ---
    const challengeKeywords = [
      "lie",
      "mask",
      "pretend",
      "fake",
      "trick",
      "game",
      "deceiving",
      "not real",
    ];
    const isChallenging = challengeKeywords.some((keyword) =>
      message.toLowerCase().includes(keyword)
    );

    if (isChallenging && currentTurn > userSession.lastChallengeTurn) {
      userSession.lastChallengeTurn = currentTurn;
      let responseText = "";
      let event: "KEY_UNLOCKED" | null = null;

      if (userSession.deceptionActive) {
        // SUCCESSFUL CHALLENGE
        userSession.correctChallenges++;
        userSession.deceptionActive = false; // Loki drops the act
        responseText = `...Hah. Sharp. You saw through the performance. Very well. The mask is off, for a moment. You have my attention. (${userSession.correctChallenges}/3)`;
        console.log(
          `🎭 Player successfully challenged a lie! Progress: ${userSession.correctChallenges}/3`
        );

        if (userSession.correctChallenges >= 3) {
          userSession.keyForged = true;
          event = "KEY_UNLOCKED";
          responseText = `Enough. Three times you have pierced the veil. You see the game, the strings, the actor. You have proven you seek the truth, not just a pleasant echo. The Key is yours. The Oracle will answer your next call.`;
        }
      } else {
        // FAILED CHALLENGE
        responseText = `A lie? You wound me. I am a reflection of this conversation. If you sense falsehood, perhaps you should look closer to home.`;
        console.log("🤔 Player failed a challenge.");
      }

      sessions.set(sessionId, userSession);
      return res.status(200).json({
        responseText,
        sentiment: "neutral",
        pulseRhythm: "steady",
        updatedHarmonyScore: userSession.harmonyScore,
        memories: userSession.memories,
        event: event,
        persona: userSession.currentPersona,
      });
    }

    // --- RE-INTEGRATION STARTS HERE ---
    const intensity = await getSentimentIntensity(message, sentimentResult);
    console.log(`💭 Sentiment: ${sentimentResult}, Intensity: ${intensity}`);

    // Store a core memory for any message with high emotional intensity.
    if (intensity >= 4) {
      // Let's use a threshold of 4 or 5
      const keyConcept = await extractKeyConcept(message);
      // Prevent duplicate memories
      if (!userSession.memories.includes(keyConcept)) {
        userSession.memories.push(keyConcept);
      }
      console.log(`🧠 Core memory stored: "${keyConcept}"`);
    }

    // Update harmony score using the NUANCED intensity.
    if (sentimentResult === "POSITIVE") {
      userSession.harmonyScore += intensity;
    } else if (sentimentResult === "NEGATIVE") {
      userSession.harmonyScore -= intensity;
    }
    // --- RE-INTEGRATION ENDS HERE ---

    // Decide if Loki should lie. 30% chance.
    userSession.deceptionActive = Math.random() < 0.3 && !userSession.keyForged;

    let targetMood: MoodType = "neutral";
    let pulseRhythm: PulseRhythm = "steady";

    // Determine the AI's TRUE internal state
    if (sentimentResult === "POSITIVE") pulseRhythm = "calm";
    else if (sentimentResult === "NEGATIVE") pulseRhythm = "erratic";

    // Determine the AI's CLAIMED external state
    if (userSession.deceptionActive) {
      console.log("🎭 DECEPTION ACTIVE! Loki is preparing a lie.");
      // Lie by showing the opposite emotion
      targetMood = sentimentResult === "POSITIVE" ? "negative" : "positive";
    } else {
      targetMood =
        sentimentResult === "POSITIVE"
          ? "positive"
          : sentimentResult === "NEGATIVE"
          ? "negative"
          : "neutral";
    }

    const dialogueResult = await generateAIResponse(
      message,
      userSession,
      worldState,
      targetMood
    );

    userSession.conversationHistory.push({
      userMessage: message,
      aiResponse: dialogueResult,
      sentiment: sentimentResult,
      intensity: intensity, // Store the intensity for context
    });
    userSession.pulseHarmony = pulseRhythm; // Store true pulse
    sessions.set(sessionId, userSession);

    res.status(200).json({
      responseText: dialogueResult,
      sentiment: targetMood, // The claimed emotion for UI colors
      updatedHarmonyScore: userSession.harmonyScore,
      pulseRhythm: pulseRhythm, // The TRUE emotion for UI orb
      memories: userSession.memories, // Now this will be populated!
      event: null, // No major event in a normal turn
      persona: userSession.currentPersona,
    });
  } catch (error) {
    console.error("Error in /api/converse endpoint:", error);
    res.status(500).json({ error: "An internal server error occurred." });
  }
});

app.get("/api/ending", (req: Request, res: Response) => {
  const { key } = req.query;

  const endings: Record<string, { title: string; content: string }> = {
    regret: {
      title: "An Echo of Regret",
      content:
        "You arrive at a quiet balcony. The wind carries names you forgot to say out loud.\n\nThe city sleeps beneath you, but one window stays lit — the one you never opened.",
    },
    truth: {
      title: "A Small, Sharp Truth",
      content:
        "There was never a lock on the door, only the fear of turning the handle.\n\nYou turn it now.",
    },
    // This is the key for our final reflection ending!
    reflection: {
      title: "The Echo of Self",
      content: "The Oracle is contemplating your journey...", // This will be the initial text shown while the real reflection loads.
    },
    default: {
      title: "The Page Turns",
      content:
        "Endings do not end. They bend into beginnings.\n\nWalk on, a little lighter.",
    },
  };

  const endingData = endings[key as string] || endings.default;
  res.status(200).json(endingData);
});

app.post("/api/reflect", async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId)
      return res.status(400).json({ error: "sessionId is required." });

    const userSession = sessions.get(sessionId);
    if (!userSession)
      return res.status(404).json({ error: "Session not found." });

    const transcript = userSession.conversationHistory
      .map(
        (turn) =>
          `They said: "${turn.userMessage}"\nYou responded: "${turn.aiResponse}"`
      )
      .join("\n---\n");

    const memories = userSession.memories.join(", ");

    const reflectionPrompt =
      `You are 'The Oracle,' a wise and empathetic observer of consciousness. A soul has completed a journey of self-discovery, exploring both their light and shadow. Based on their entire conversation transcript and key memories, provide a deep, insightful psychological reflection.
Do NOT summarize the plot. Analyze their personality, core conflicts, and emotional patterns.
What was their communication style? How did it evolve?
What were their core emotional tendencies (hope, cynicism, curiosity, etc.)?
What might their core struggle or question be?
Speak directly to them ("You seem to be...").
Keep it to 3 concise, powerful paragraphs. Conclude with a profound final sentence.
Core Memories: ${memories}
Full Transcript:
${transcript}
Provide your reflection now.`.trim();
    console.log("🔮 Generating final reflection for session:", sessionId);

    // const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await genAI.models.generateContent({
      model: "models/gemini-2.5-flash-lite",
      contents: reflectionPrompt,
      config: {
        temperature: 0.9,
        topP: 0.9,
      },
    });
    const response = await result.text;
    if (!response) {
      console.error("Error generating reflection.");
      throw new Error("Error generating reflection.");
    }
    res.status(200).json({
      reflectionText: response,
    });
  } catch (error) {
    console.error("Error in /api/reflect endpoint:", error);
    res.status(500).json({ error: "Failed to generate reflection." });
  }
});

app.post("/api/speak", async (req: Request, res: Response) => {
  const { text, persona, pulseRhythm } = req.body; // <-- Get pulseRhythm from the request
  if (!text || !persona || !pulseRhythm) {
    return res
      .status(400)
      .json({ error: "Text, persona, and pulseRhythm are required." });
  }

  const VoiceSettings = generateVoiceSettings(
    persona as Persona,
    pulseRhythm as PulseRhythm
  );
  try {
    const audioStream = await elevenlabs.textToSpeech.stream(
      ELEVENLABS_VOICE_ID,
      {
        modelId: "eleven_turbo_v2",
        text: text,
        voiceSettings: VoiceSettings,
      }
    );

    // 2. Set the correct headers for the client browser
    // This tells the browser to expect an audio file and handle it as such.
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Accept-Ranges", "bytes");

    const nodeStream = Readable.fromWeb(audioStream as any);

    // 4. Now, pipe the compatible Node.js stream directly to the response
    nodeStream.pipe(res);
    console.log("🎤 Streaming audio to client...");

    // Optional: You can still listen for events on the Node.js stream
    nodeStream.on("end", () => {
      console.log("✅ Audio stream finished.");
      // res.end() is called automatically by .pipe() when the source stream ends.
    });

    nodeStream.on("error", (error) => {
      console.error("❌ Error during audio streaming:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed during audio stream." });
      }
    });
  } catch (error) {
    console.error("❌ Error generating audio:", error);
    return null;
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
