import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { postConverse } from "../services/apiClient";

interface ChatTurn {
  user: string;
  bot: string;
}

interface Message {
  // id: string;
  text: string;
  // sender: 'user' | 'loki';
  // timestamp: Date;
}

// async function fetchLokiResponse(userMessage: string): Promise<string> {
//   const dummyReplies = [
//     "The stars whisper your question, but only you hold the answer.",
//     "Loki grins: 'Oh? You think you know truth?'",
//     "The echo fades... 'Try again, mortal.'",
//     "A flicker of mischief crosses Loki's eyes — 'Interesting choice of words.'",
//     "Loki laughs softly, 'Careful what you wish for.'",
//   ];
//   const reply = dummyReplies[Math.floor(Math.random() * dummyReplies.length)];
//   await new Promise((r) => setTimeout(r, 1500));
//   return reply;
// }

export default function LokiChatUI() {
  const [harmonyScoreNumber, setHarmonyScoreNumber] = useState<number>(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      // id: Date.now().toString(),
      text: input,
      // sender: 'user',
      // timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    const response = await postConverse({
      history,
      message: input,
      harmonyScore: harmonyScoreNumber,
    });
    setHarmonyScoreNumber(response.updatedHarmonyScore);

    const lokiMessage: Message = {
      // id: (Date.now() + 1).toString(),
      text: response.responseText,
      // sender: 'loki',
      // timestamp: new Date()
    };

    const chatTurn: ChatTurn = {
      user: userMessage.text,
      bot: lokiMessage.text,
    };

    setIsTyping(false);
    setMessages((prev) => [...prev, lokiMessage]);
    setHistory((prev) => [...prev, chatTurn]);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasMessages = messages.length > 0 || isTyping;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#121212] to-[#1a1a1a] relative overflow-hidden">
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
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
              Speak to Loki
            </h1>
            <p className="text-gray-400 text-lg">
              The trickster Goblin awaits your questions...
            </p>
          </div>
        )}

        {/* Messages area */}
        {hasMessages && (
          <div className="flex-1 overflow-y-auto mb-4 space-y-4 py-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  index % 2 === 0 ? "justify-end" : "justify-start"
                } animate-slide-in`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {index % 2 !== 0 && (
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center mr-3 shadow-lg shadow-cyan-500/30">
                    <span className="text-white font-bold text-sm">L</span>
                  </div>
                )}

                <div
                  className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-5 py-3 ${
                    index % 2 === 0
                      ? "bg-[#1E293B] text-white shadow-lg"
                      : "bg-gradient-to-br from-gray-900/90 to-gray-800/90 text-gray-100 border border-cyan-500/30 shadow-lg shadow-cyan-500/10 backdrop-blur-sm animate-glow"
                  }`}
                >
                  <p className="text-sm md:text-base leading-relaxed">
                    {message.text}
                  </p>
                </div>

                {index % 2 === 0 && (
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center ml-3">
                    <span className="text-white font-bold text-sm">Y</span>
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start animate-slide-in">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center mr-3 shadow-lg shadow-cyan-500/30">
                  <span className="text-white font-bold text-sm">L</span>
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
              placeholder="Speak to Loki..."
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
