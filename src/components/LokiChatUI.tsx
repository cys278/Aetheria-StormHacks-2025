import { Canvas } from "@react-three/fiber";
import FloatingEchoes from "./FloatingEchoes";
import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Skull } from "lucide-react";
import { postConverse } from "../services/apiClient";
import {
  type Persona,
  type RebirthEvent,
  type PulseRhythm,
  type MoodType,
  type Message,
} from "../types";
import { v4 } from "uuid";
import {
  getEnvironmentDescription,
  getTimeOfDay,
} from "../utils/environmentCalculator";
import { PERSONA_CONFIG } from "../utils/helpers";

const getSessionId = (): string => {
  let sessionId = localStorage.getItem("aetheria-session-id");
  if (!sessionId) {
    sessionId = v4();
    localStorage.setItem("aetheria-session-id", sessionId);
  }
  return sessionId;
};

// NEW: Persona configurations for dynamic UI

export default function LokiChatUI({
  onTriggerCitadel,
  sentiment,
  pulseRhythm,
  onSentimentChange,
}: {
  onTriggerCitadel?: () => void;
  sentiment: MoodType;
  pulseRhythm: PulseRhythm;
  onSentimentChange: (s: MoodType, r: PulseRhythm) => void;
}) {
  const [harmonyScore, setHarmonyScore] = useState<number>(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  // const [sentiment, setSentiment] = useState<MoodType>("neutral");

  const [memories, setMemories] = useState<string[]>([]);
  const [persona, setPersona] = useState<Persona>("genesis");
  // const [pulseRhythm, setPulseRhythm] = useState<PulseRhythm>("steady"); // NEW: Track pulse rhythm
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

  // 🎧 Reactive ambient sound system
  useEffect(() => {
    const calm = new Howl({ src: ["/sounds/calm.mp3"], loop: true, volume: 0 });
    const tense = new Howl({
      src: ["/sounds/tense.mp3"],
      loop: true,
      volume: 0,
    });
    const neutral = new Howl({
      src: ["/sounds/neutral.mp3"],
      loop: true,
      volume: 0,
    });

    calm.play();
    tense.play();
    neutral.play();

    const fadeAudio = (target: MoodType) => {
      calm.fade(calm.volume(), target === "positive" ? 0.6 : 0, 1500);
      tense.fade(tense.volume(), target === "negative" ? 0.6 : 0, 1500);
      neutral.fade(neutral.volume(), target === "neutral" ? 0.5 : 0, 1500);
    };
    fadeAudio(sentiment);

    return () => {
      calm.unload();
      tense.unload();
      neutral.unload();
    };
  }, [sentiment]);

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
      id: Date.now().toString(),
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

      if (input.toLowerCase().includes("citadel")) {
        onTriggerCitadel?.();
      }

      const response = await postConverse({
        sessionId,
        message: input,
        worldState: environmentDescription, // Send rich environment description
      });

      // Update all state from response
      setHarmonyScore(response.updatedHarmonyScore);
      setMemories(response.memories);
      const rhythm: PulseRhythm = response.pulseRhythm;
      onSentimentChange(response.sentiment, rhythm);
      // setPulseRhythm(response.pulseRhythm); // NEW: Update pulse rhythm
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
        id: (Date.now() + 1).toString(),
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

  const hasMessages = messages.length > 0 || isTyping;
  // 🎨 Dynamic background gradient based on sentiment
  const getBackground = () => {
    // Before chat starts → your old dark mystical look
    if (!hasMessages) {
      return "linear-gradient(135deg, #0a0a0a 0%, #121212 40%, #1a1a1a 100%)";
    }

    // After chat begins → reactive mood colors
    switch (sentiment) {
      case "positive":
        return "linear-gradient(135deg, #0f172a 0%, #10b981 40%, #6ee7b7 100%)";
      case "negative":
        return "linear-gradient(135deg, #0f172a 0%, #dc2626 40%, #f43f5e 100%)";
      default:
        return "linear-gradient(135deg, #0f172a 0%, #3b82f6 40%, #06b6d4 100%)";
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const currentEnvironment = getEnvironmentDescription({
    harmonyScore,
    pulseRhythm,
    persona,
    memoryCount: memories.length,
    conversationTurns,
    timeOfDay: getTimeOfDay(),
  });

  return (
    <div
      className="min-h-screen relative overflow-hidden transition-all duration-[2000ms] ease-in-out"
      style={{ background: getBackground() }}
    >
      {/* 3D layer: floating text fragments */}
      <div className="absolute inset-0 -z-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 4] }} dpr={[1, 2]}>
          <ambientLight intensity={0.4} />
          <pointLight position={[2, 2, 2]} intensity={1.2} />
          {/* Fog gives depth so tiny far texts feel atmospheric */}
          <fog attach="fog" args={["#000000", 6, 14]} />
          <FloatingEchoes messages={messages} sentiment={sentiment} />
        </Canvas>
      </div>
      <div className="min-h-screen relative overflow-hidden">
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
                  <p className="text-cyan-300 mt-2">
                    You have found harmony...
                  </p>
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
        {/* <div className="absolute inset-0 overflow-hidden pointer-events-none">
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
      </div> */}

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
              <p className="text-xs text-gray-600 italic">
                {currentEnvironment}
              </p>
            </div>
          )}
          {/* Harmony Meter */}
          {/* Harmony Meter (Top Center Pulsing Ball) */}
          <div className="absolute top-1 left-1/2 -translate-x-1/2 z-20">
            <div
              className={`w-8 h-8 md:w-10 md:h-10 rounded-full transition-all duration-500 ${
                sentiment === "positive"
                  ? "bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg shadow-green-500/40"
                  : sentiment === "negative"
                  ? "bg-gradient-to-r from-red-500 to-pink-600 shadow-lg shadow-pink-500/40"
                  : "bg-gradient-to-r from-blue-400 to-cyan-500 shadow-lg shadow-cyan-500/40"
              }`}
              style={{
                animation:
                  pulseRhythm === "calm"
                    ? "pulse 2s ease-in-out infinite"
                    : pulseRhythm === "erratic"
                    ? "pulse 0.8s ease-in-out infinite"
                    : "pulse 1.4s ease-in-out infinite",
              }}
            ></div>
          </div>

          {/* Messages area */}
          {hasMessages && (
            <div
              className="flex-1 mb-4 space-y-4 py-6 overflow-y-scroll no-scrollbar"
              style={{
                scrollbarWidth: "none", // for Firefox
                msOverflowStyle: "none", // for IE & Edge
              }}
            >
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
              className={`relative rounded-2xl border-2 transition-all duration-500 backdrop-blur-xl ${
                sentiment === "positive"
                  ? "bg-[#0f172a]/60 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                  : sentiment === "negative"
                  ? "bg-[#1a0e0e]/70 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)]"
                  : "bg-[#0a1020]/60 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
              } ${isFocused ? "scale-[1.03]" : "scale-[1.0]"}`}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
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
                    ? sentiment === "positive"
                      ? "bg-gradient-to-r from-green-400 to-emerald-500 hover:shadow-lg hover:shadow-green-500/40 hover:scale-105"
                      : sentiment === "negative"
                      ? "bg-gradient-to-r from-red-500 to-pink-600 hover:shadow-lg hover:shadow-pink-500/40 hover:scale-105"
                      : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:shadow-lg hover:shadow-cyan-500/40 hover:scale-105"
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
      </div>
    </div>
  );
}
