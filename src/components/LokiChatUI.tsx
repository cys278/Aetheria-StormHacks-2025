import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Skull } from "lucide-react";
import {
  postConverse,
  type Persona,
  type RebirthEvent,
  type PulseRhythm,
} from "../services/apiClient";
import { v4 } from "uuid";
import { getEnvironmentDescription, getTimeOfDay } from "../utils/environmentCalculator";

interface Message {
  text: string;
  sender: "user" | "loki";
}

const getSessionId = (): string => {
  let sessionId = localStorage.getItem("aetheria-session-id");
  if (!sessionId) {
    sessionId = v4();
    localStorage.setItem("aetheria-session-id", sessionId);
  }
  return sessionId;
};

// NEW: Persona configurations for dynamic UI
const PERSONA_CONFIG = {
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

// NEW: Sophisticated World State Calculator
interface WorldStateFactors {
  harmonyScore: number;
  pulseRhythm: PulseRhythm;
  persona: Persona;
  memoryCount: number;
  conversationTurns: number;
}

const calculateWorldState = (factors: WorldStateFactors): string => {
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

export default function LokiChatUI() {
  const [harmonyScore, setHarmonyScore] = useState<number>(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [memories, setMemories] = useState<string[]>([]);
  const [persona, setPersona] = useState<Persona>("genesis");
  const [pulseRhythm, setPulseRhythm] = useState<PulseRhythm>("steady"); // NEW: Track pulse rhythm
  const [showRebirthAnimation, setShowRebirthAnimation] = useState(false);
  const [rebirthType, setRebirthType] = useState<RebirthEvent>(null);
  const [conversationTurns, setConversationTurns] = useState<number>(0); // NEW: Track conversation depth

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sessionId = getSessionId();
  const currentPersona = PERSONA_CONFIG[persona];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (showRebirthAnimation) {
      const timer = setTimeout(() => {
        setShowRebirthAnimation(false);
        setRebirthType(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showRebirthAnimation]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      text: input,
      sender: "user",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      // NEW: Calculate comprehensive environment state
      const environmentDescription = getEnvironmentDescription({
        harmonyScore,
        pulseRhythm,
        persona,
        memoryCount: memories.length,
        conversationTurns,
        timeOfDay: getTimeOfDay(), // Optional: adds time-based variation
      });

      console.log(`🌍 Environment: "${environmentDescription}"`);

      const response = await postConverse({
        sessionId,
        message: input,
        worldState: environmentDescription, // Send rich environment description
      });

      // Update all state from response
      setHarmonyScore(response.updatedHarmonyScore);
      setMemories(response.memories);
      setPulseRhythm(response.pulseRhythm); // NEW: Update pulse rhythm
      setConversationTurns((prev) => prev + 1); // NEW: Increment turn counter

      // Handle persona changes
      if (response.persona !== persona) {
        setPersona(response.persona);
      }

      // Handle rebirth events
      if (response.event) {
        setRebirthType(response.event);
        setShowRebirthAnimation(true);
        setMessages([]); // Clear messages on rebirth
        setConversationTurns(0); // NEW: Reset turn counter on rebirth
      }

      const lokiMessage: Message = {
        text: response.responseText,
        sender: "loki",
      };

      setIsTyping(false);

      if (!response.event) {
        setMessages((prev) => [...prev, lokiMessage]);
      } else {
        setMessages([lokiMessage]);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasMessages = messages.length > 0 || isTyping;

  // NEW: Get current environment for display (optional)
  const currentEnvironment = getEnvironmentDescription({
    harmonyScore,
    pulseRhythm,
    persona,
    memoryCount: memories.length,
    conversationTurns,
    timeOfDay: getTimeOfDay(),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#121212] to-[#1a1a1a] relative overflow-hidden">
      {/* Rebirth Animation Overlay */}
      {showRebirthAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="text-center animate-pulse">
            {rebirthType === "REBIRTH_POSITIVE" ? (
              <>
                <Sparkles className="w-24 h-24 mx-auto mb-4 text-cyan-400" />
                <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  REBIRTH
                </h2>
                <p className="text-cyan-300 mt-2">You have found harmony...</p>
              </>
            ) : (
              <>
                <Skull className="w-24 h-24 mx-auto mb-4 text-red-500" />
                <h2 className="text-4xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                  REBIRTH
                </h2>
                <p className="text-red-400 mt-2">Darkness consumes...</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Animated particles background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "4s" }}
        ></div>
        <div
          className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "6s", animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 right-1/3 w-48 h-48 bg-magenta-500/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "5s", animationDelay: "2s" }}
        ></div>
      </div>

      {/* Main container */}
      <div
        className={`relative z-10 flex flex-col mx-auto transition-all duration-700 ease-out ${
          hasMessages
            ? "h-screen max-w-4xl px-4"
            : "h-screen max-w-2xl px-4 justify-center"
        }`}
      >
        {/* Welcome header - only show when no messages */}
        {!hasMessages && (
          <div className="text-center mb-8 animate-fade-in">
            <h1
              className={`text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r ${currentPersona.gradient} bg-clip-text text-transparent animate-gradient`}
            >
              {currentPersona.title}
            </h1>
            <p className="text-gray-400 text-lg">{currentPersona.subtitle}</p>

            {/* Harmony Score Display */}
            <div className="mt-6 inline-block px-6 py-3 rounded-full bg-white/5 border border-gray-700/50">
              <span className="text-gray-400 text-sm">Harmony: </span>
              <span
                className={`font-bold ${
                  harmonyScore > 10
                    ? "text-cyan-400"
                    : harmonyScore < -10
                    ? "text-red-400"
                    : "text-gray-300"
                }`}
              >
                {harmonyScore}
              </span>
            </div>

            {/* NEW: World State Display (optional - shows on welcome screen) */}
            <div className="mt-3">
              <p className="text-xs text-gray-500 italic">
                The world is {currentEnvironment}
              </p>
            </div>
          </div>
        )}

        {/* Memory Pills (show when messages exist) */}
        {hasMessages && memories.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2 animate-fade-in">
            {memories.map((memory, idx) => (
              <span
                key={idx}
                className="px-3 py-1 text-xs rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300"
              >
                {memory}
              </span>
            ))}
          </div>
        )}

        {/* Compact Harmony Score + World State (when chat is active) */}
        {hasMessages && (
          <div className="mb-2 text-center space-y-1">
            <div>
              <span className="text-xs text-gray-500">Harmony: </span>
              <span
                className={`text-sm font-bold ${
                  harmonyScore > 10
                    ? "text-cyan-400"
                    : harmonyScore < -10
                    ? "text-red-400"
                    : "text-gray-400"
                }`}
              >
                {harmonyScore}
              </span>
            </div>
            {/* NEW: World State indicator */}
            <p className="text-xs text-gray-600 italic">{currentEnvironment}</p>
          </div>
        )}

        {/* Messages area */}
        {hasMessages && (
          <div className="flex-1 overflow-y-auto mb-4 space-y-4 py-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                } animate-slide-in`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {message.sender === "loki" && (
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br ${currentPersona.avatarBg} flex items-center justify-center mr-3 shadow-lg shadow-cyan-500/30`}
                  >
                    <span className="text-white font-bold text-sm">
                      {currentPersona.avatar}
                    </span>
                  </div>
                )}

                <div
                  className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-5 py-3 ${
                    message.sender === "user"
                      ? "bg-[#1E293B] text-white shadow-lg"
                      : "bg-gradient-to-br from-gray-900/90 to-gray-800/90 text-gray-100 border border-cyan-500/30 shadow-lg shadow-cyan-500/10 backdrop-blur-sm animate-glow"
                  }`}
                >
                  <p className="text-sm md:text-base leading-relaxed">
                    {message.text}
                  </p>
                </div>

                {message.sender === "user" && (
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center ml-3">
                    <span className="text-white font-bold text-sm">Y</span>
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start animate-slide-in">
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br ${currentPersona.avatarBg} flex items-center justify-center mr-3 shadow-lg shadow-cyan-500/30`}
                >
                  <span className="text-white font-bold text-sm">
                    {currentPersona.avatar}
                  </span>
                </div>
                <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-cyan-500/30 rounded-2xl px-5 py-4 shadow-lg shadow-cyan-500/10 backdrop-blur-sm">
                  <div className="flex space-x-2">
                    <div
                      className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input area */}
        <div className={`${hasMessages ? "pb-6" : ""}`}>
          <div
            className={`relative backdrop-blur-sm bg-white/5 rounded-2xl border transition-all duration-300 ${
              isFocused
                ? "border-cyan-400/50 shadow-lg shadow-cyan-500/20"
                : "border-gray-700/50"
            }`}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={`Speak to ${currentPersona.title.replace(
                "Speak to ",
                ""
              )}...`}
              className="w-full px-6 py-4 bg-transparent text-white placeholder-gray-500 outline-none text-sm md:text-base"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all duration-300 ${
                input.trim()
                  ? "bg-gradient-to-r from-cyan-500 to-purple-600 hover:shadow-lg hover:shadow-cyan-500/30 hover:scale-105"
                  : "bg-gray-700/50 cursor-not-allowed"
              }`}
            >
              <Send
                className={`w-4 h-4 ${
                  input.trim() ? "text-white" : "text-gray-500"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(6, 182, 212, 0.1);
          }
          50% {
            box-shadow: 0 0 30px rgba(6, 182, 212, 0.2);
          }
        }

        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .animate-slide-in {
          animation: slide-in 0.4s ease-out forwards;
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }

        .animate-glow {
          animation: glow 3s ease-in-out infinite;
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 8s ease infinite;
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 3px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #4B5563;
        }
      `}</style>
    </div>
  );
}
