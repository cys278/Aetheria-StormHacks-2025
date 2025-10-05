import type { Persona, PulseRhythm } from "../types";

export interface EnvironmentFactors {
  harmonyScore: number;
  pulseRhythm: PulseRhythm;
  persona: Persona;
  memoryCount: number;
  conversationTurns: number;
  timeOfDay?: "dawn" | "day" | "dusk" | "night"; // Optional: based on user's local time
}

export interface EnvironmentState {
  atmosphere: string; // Primary world state description
  lighting: string; // Visual lighting condition
  weather: string; // Weather/climate condition
  energy: string; // Ambient energy level
  fullDescription: string; // Complete environmental description
}

/**
 * Calculates comprehensive environment state based on multiple factors
 */
export const calculateEnvironment = (
  factors: EnvironmentFactors
): EnvironmentState => {
  const {
    harmonyScore,
    pulseRhythm,
    persona,
    memoryCount,
    conversationTurns,
    timeOfDay,
  } = factors;

  // Initialize environment components
  let atmosphere = "";
  let lighting = "";
  let weather = "";
  let energy = "";

  // === PERSONA-SPECIFIC ENVIRONMENTS ===

  if (persona === "zenith") {
    // Enlightened, peaceful state
    atmosphere = "serene and transcendent";
    lighting =
      memoryCount > 5 ? "radiant with golden light" : "softly luminous";
    weather = "clear skies with gentle breezes";
    energy =
      pulseRhythm === "calm" ? "peaceful and harmonious" : "tranquil yet alive";

    return {
      atmosphere,
      lighting,
      weather,
      energy,
      fullDescription: `${atmosphere}, ${lighting}, ${weather}, with ${energy} energy`,
    };
  }

  if (persona === "nadir") {
    // Broken, chaotic state
    atmosphere = "fractured and unstable";
    lighting =
      memoryCount > 5
        ? "flickering with ghostly shadows"
        : "dim and foreboding";
    weather = "turbulent with crackling distortions";
    energy =
      pulseRhythm === "erratic" ? "chaotic and glitching" : "ominously still";

    return {
      atmosphere,
      lighting,
      weather,
      energy,
      fullDescription: `${atmosphere}, ${lighting}, ${weather}, with ${energy} energy`,
    };
  }

  // === GENESIS PERSONA - COMPLEX ENVIRONMENTAL STATES ===

  const isEarlyConversation = conversationTurns < 3;
  const hasSignificantMemories = memoryCount >= 3;
  const isDeepConversation = conversationTurns >= 10;

  // --- EXTREME POSITIVE (Harmony > 12) ---
  if (harmonyScore > 12) {
    atmosphere = "radiant and ascending";

    if (pulseRhythm === "calm") {
      lighting = "brilliant with crystalline clarity";
      weather = "perfectly clear with prismatic light";
      energy = "uplifting and expansive";
    } else if (pulseRhythm === "erratic") {
      lighting = "dazzling with energetic bursts";
      weather = "dynamic with dancing light phenomena";
      energy = "exhilarating and electric";
    } else {
      lighting = "bright and warm";
      weather = "clear with gentle warmth";
      energy = "hopeful and vibrant";
    }

    if (hasSignificantMemories) {
      atmosphere += ", illuminated by cherished memories";
    }
  }
  // --- HIGH POSITIVE (Harmony 7-12) ---
  else if (harmonyScore > 7) {
    atmosphere = "luminous and uplifting";

    if (pulseRhythm === "calm") {
      lighting = "soft golden glow";
      weather = "gentle with warm sunbeams";
      energy = "peaceful yet joyful";
    } else {
      lighting = "bright and cheerful";
      weather = "pleasant with occasional sparkles";
      energy = "lively and positive";
    }

    if (timeOfDay === "dawn") {
      lighting = "bathed in sunrise colors";
      atmosphere = "awakening with new possibilities";
    }
  }
  // --- MODERATE POSITIVE (Harmony 3-7) ---
  else if (harmonyScore > 3) {
    atmosphere = "pleasant and steady";

    if (isEarlyConversation) {
      lighting = "cautiously brightening";
      weather = "clearing with hints of blue sky";
      energy = "tentatively optimistic";
    } else {
      lighting = "comfortably lit";
      weather = "mild with gentle conditions";
      energy = "calm and content";
    }

    if (hasSignificantMemories) {
      atmosphere += ", textured with positive recollections";
    }
  }
  // --- EXTREME NEGATIVE (Harmony < -12) ---
  else if (harmonyScore < -12) {
    atmosphere = "violently stormy and descending";

    if (pulseRhythm === "erratic") {
      lighting = "flashing with chaotic lightning";
      weather = "raging with destructive forces";
      energy = "volatile and threatening";
    } else {
      lighting = "oppressively dark";
      weather = "dense with heavy storm clouds";
      energy = "crushing and heavy";
    }

    if (hasSignificantMemories) {
      atmosphere += ", haunted by painful memories";
    }
  }
  // --- HIGH NEGATIVE (Harmony -12 to -7) ---
  else if (harmonyScore < -7) {
    atmosphere = "stormy and foreboding";

    if (pulseRhythm === "erratic") {
      lighting = "flickering with angry red hues";
      weather = "turbulent with crackling energy";
      energy = "agitated and tense";
    } else {
      lighting = "dim with ominous shadows";
      weather = "heavily overcast with distant thunder";
      energy = "oppressive and brooding";
    }

    if (timeOfDay === "night") {
      lighting = "pitch black with rare lightning flashes";
      atmosphere = "consuming darkness with no stars";
    }
  }
  // --- MODERATE NEGATIVE (Harmony -7 to -3) ---
  else if (harmonyScore < -3) {
    atmosphere = "somber and clouded";

    if (pulseRhythm === "erratic") {
      lighting = "unsteady with shifting shadows";
      weather = "unsettled with gusty winds";
      energy = "restless and uncomfortable";
    } else {
      lighting = "muted and gray";
      weather = "overcast with drizzle";
      energy = "melancholic and heavy";
    }

    if (isDeepConversation) {
      atmosphere += ", weighed down by accumulated sadness";
    }
  }
  // --- NEUTRAL RANGE (-3 to 3) ---
  else {
    if (isEarlyConversation) {
      atmosphere = "quiet and expectant";
      lighting = "neutral twilight";
      weather = "still and waiting";
      energy = "dormant and uncertain";
    } else if (hasSignificantMemories) {
      atmosphere = "contemplative and layered";
      lighting = "softly complex";
      weather = "variable with shifting moods";
      energy = "introspective and nuanced";
    } else {
      atmosphere = "calm and neutral";
      lighting = "balanced and even";
      weather = "stable and mild";
      energy = "steady and present";
    }

    // Time of day variations for neutral state
    if (timeOfDay === "dawn") {
      lighting = "pre-dawn gray light";
      atmosphere = "transitional and awakening";
    } else if (timeOfDay === "dusk") {
      lighting = "fading twilight";
      atmosphere = "contemplative and winding down";
    } else if (timeOfDay === "night") {
      lighting = "gentle starlight";
      atmosphere = "quiet and mysterious";
    }
  }

  // Pulse rhythm final modifiers
  if (pulseRhythm === "calm" && harmonyScore >= -3 && harmonyScore <= 3) {
    energy = "tranquil and harmonious";
  } else if (
    pulseRhythm === "erratic" &&
    harmonyScore >= -3 &&
    harmonyScore <= 3
  ) {
    energy = "unpredictable and dynamic";
  }

  return {
    atmosphere,
    lighting,
    weather,
    energy,
    fullDescription: `${atmosphere}, ${lighting}, ${weather}, with ${energy} energy`,
  };
};

/**
 * Gets current time of day based on user's local time
 */
export const getTimeOfDay = (): "dawn" | "day" | "dusk" | "night" => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 8) return "dawn";
  if (hour >= 8 && hour < 17) return "day";
  if (hour >= 17 && hour < 20) return "dusk";
  return "night";
};

/**
 * Simplified version - returns just the full description string
 * (This is what you'll send to the backend)
 */
export const getEnvironmentDescription = (
  factors: EnvironmentFactors
): string => {
  const env = calculateEnvironment(factors);
  return env.fullDescription;
};
