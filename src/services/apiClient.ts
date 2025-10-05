import axios from "axios";

// --- Type Definitions ---

export type PulseRhythm = "steady" | "calm" | "erratic";
export type MoodType = "positive" | "negative" | "neutral";
export type RebirthEvent = "REBIRTH_POSITIVE" | "REBIRTH_NEGATIVE" | null;
export type Persona = "genesis" | "zenith" | "nadir";

// Request structure - simplified (removed history and harmonyScore)
export interface ConverseRequest {
  sessionId: string;
  message: string;
  worldState?: string; // NEW: Optional world state
}

// Response structure - updated with all V2 features
export interface ConverseResponse {
  responseText: string;
  sentiment: MoodType; // Changed from uppercase enum
  updatedHarmonyScore: number;
  pulseRhythm: PulseRhythm;
  memories: string[]; // NEW: Core memories
  event: RebirthEvent; // NEW: Rebirth events
  persona: Persona; // NEW: Current AI persona
}

// --- Axios Instance Creation ---

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- API Service Function ---

export const postConverse = async (
  data: ConverseRequest
): Promise<ConverseResponse> => {
  try {
    const response = await apiClient.post<ConverseResponse>("/converse", data);
    return response.data;
  } catch (error) {
    console.error("Error calling /converse API:", error);
    throw error;
  }
};
