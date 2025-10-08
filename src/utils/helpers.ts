
// src/utils/helper.ts

import {v4 as uuidv4} from 'uuid';
import { type WorldStateFactors } from '../types';

export const getSessionId = (): string => {
  let sessionId = localStorage.getItem("aetheria-session-id");
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem("aetheria-session-id", sessionId);
  }
  return sessionId;
};


export const PERSONA_CONFIG = {
  core: {
    title: "The Core Echo",
    subtitle: "A moment of truth.",
    gradient: "from-gray-400 via-gray-200 to-white",
    avatar: "●", // A simple, pure symbol.
    avatarBg: "from-gray-700 to-gray-900",
  },
  genesis: {
    title: "Speak to Loki",
    subtitle: "The trickster Goblin awaits your questions...",
    gradient: "from-cyan-400 via-purple-400 to-pink-400",
    avatar: "L",
    avatarBg: "from-cyan-500 to-purple-600",
  },
  zenith: {
    title: "The Silent Observer",
    subtitle: "Peace has been achieved. Speak with the wise guide...",
    gradient: "from-blue-300 via-cyan-300 to-teal-300",
    avatar: "✨",
    avatarBg: "from-blue-400 to-cyan-500",
  },
  nadir: {
    title: "The Broken Echo",
    subtitle: "Fragments remain. Speak with what's left...",
    gradient: "from-red-500 via-orange-500 to-yellow-500",
    avatar: "💀",
    avatarBg: "from-red-600 to-orange-600",
  },
};



export const calculateWorldState = (factors: WorldStateFactors): string => {
  const { harmonyScore, pulseRhythm, persona, memoryCount, conversationTurns } =
    factors;

  // Persona-specific base states
  if (persona === "zenith") {
    if (memoryCount > 5) return "transcendent and memory-laden";
    if (pulseRhythm === "calm") return "serene and luminous";
    return "peaceful and enlightened";
  }

  if (persona === "nadir") {
    if (memoryCount > 5) return "fractured with haunting echoes";
    if (pulseRhythm === "erratic") return "chaotic and deteriorating";
    return "dark and fragmented";
  }

  // Genesis persona - most complex state calculation
  const isEarlyConversation = conversationTurns < 3;
  const hasSignificantMemories = memoryCount >= 3;

  // Extreme states
  if (harmonyScore > 12) {
    if (pulseRhythm === "calm") return "radiant and ascending";
    if (hasSignificantMemories) return "brightening with remembered joy";
    return "vibrant and hopeful";
  }

  if (harmonyScore < -12) {
    if (pulseRhythm === "erratic") return "violently stormy and descending";
    if (hasSignificantMemories) return "darkening with remembered pain";
    return "ominous and turbulent";
  }

  // High positive harmony (7-12)
  if (harmonyScore > 7) {
    if (pulseRhythm === "calm") return "warm and crystalline";
    if (hasSignificantMemories) return "glowing with cherished moments";
    return "luminous and uplifting";
  }

  // Moderate positive harmony (3-7)
  if (harmonyScore > 3) {
    if (pulseRhythm === "calm") return "gentle and clear";
    if (isEarlyConversation) return "cautiously optimistic";
    return "pleasant and steady";
  }

  // High negative harmony (-12 to -7)
  if (harmonyScore < -7) {
    if (pulseRhythm === "erratic") return "tempestuous and crackling";
    if (hasSignificantMemories) return "heavy with dark recollections";
    return "stormy and foreboding";
  }

  // Moderate negative harmony (-7 to -3)
  if (harmonyScore < -3) {
    if (pulseRhythm === "erratic") return "unsettled and tense";
    if (isEarlyConversation) return "wary and overcast";
    return "somber and clouded";
  }

  // Neutral range (-3 to 3)
  if (isEarlyConversation) {
    return "quiet and expectant";
  }

  if (hasSignificantMemories) {
    return "contemplative and layered";
  }

  if (pulseRhythm === "calm") {
    return "tranquil and balanced";
  }

  if (pulseRhythm === "erratic") {
    return "restless and shifting";
  }

  // Default neutral
  return "calm and neutral";
};