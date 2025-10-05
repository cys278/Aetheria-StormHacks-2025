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

// NEW: Sophisticated World State Calculator
export interface WorldStateFactors {
  harmonyScore: number;
  pulseRhythm: PulseRhythm;
  persona: Persona;
  memoryCount: number;
  conversationTurns: number;
}


export interface Message {
    id: string;
  text: string;
  sender: "user" | "loki";
}