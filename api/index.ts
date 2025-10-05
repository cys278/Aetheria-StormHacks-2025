// Express.js backend - V2 Narrative Engine (Granular Prompt Control)

import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { Readable } from "stream";

dotenv.config();
const ELEVENLABS_VOICE_ID = "a7vno2SJkTdglAq4liNI";
const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  throw new Error("GEMINI_API_KEY is not defined in the environment variables.");
}
const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;
if (!elevenLabsApiKey) {
  throw new Error("ELEVEN_LABS_API_KEY is not defined in the environment variables.");
}

type PulseRhythm = "steady" | "calm" | "erratic";
type MoodType = "positive" | "negative" | "neutral";
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
  deceptionActive: boolean;
  correctChallenges: number;
  keyForged: boolean;
  sentimentStreak: {
    type: "POSITIVE" | "NEGATIVE" | "NEUTRAL" | null;
    count: number;
  };
  lastChallengeTurn: number;
}
interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}

const sessions = new Map<string, SessionState>();

const genAI = new GoogleGenAI({ apiKey: geminiApiKey, apiVersion: "v1" });
const elevenlabs = new ElevenLabsClient({ apiKey: elevenLabsApiKey });

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
app.options("*", cors());

/* ----------------------------------------------------------------------- */
app.use(express.json());

/* ------------------------------ ROUTES BELOW --------------------------- */

// Root test route
app.get("/api", (_req: Request, res: Response) => {
  res.status(200).send("Aetheria AI V2 Narrative Engine (Granular Control) is alive!");
});

// ✨ Keep your existing /api/converse, /api/reflect, /api/ending, /api/speak routes here unchanged.
// (Everything below this section can stay exactly as you wrote it — logic, sessions, AI calls, etc.)

// Local development server
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🚀 Aetheria Server running on http://localhost:${PORT}`);
  });
}

// Vercel export
export default app;
