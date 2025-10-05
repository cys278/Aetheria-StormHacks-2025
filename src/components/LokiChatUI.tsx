import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';



interface Message {
  id: string;
  text: string;
  sender: 'user' | 'loki';
  timestamp: Date;
}

async function fetchLokiResponse(userMessage: string): Promise<string> {
  const dummyReplies = [
    "The stars whisper your question, but only you hold the answer.",
    "Loki grins: 'Oh? You think you know truth?'",
    "The echo fades... 'Try again, mortal.'",
    "A flicker of mischief crosses Loki's eyes — 'Interesting choice of words.'",
    "Loki laughs softly, 'Careful what you wish for.'"
  ];
  const reply = dummyReplies[Math.floor(Math.random() * dummyReplies.length)];
  await new Promise(r => setTimeout(r, 1500));
  return reply;
}

export default function LokiChatUI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [sentiment, setSentiment] = useState<'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'>('NEUTRAL');
  const [pulseRhythm, setPulseRhythm] = useState<'calm' | 'erratic' | 'steady'>('steady');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);


  // 🎧 Reactive ambient sound system
useEffect(() => {
  const calm = new Howl({ src: ["/sounds/calm.mp3"], loop: true, volume: 0 });
  const tense = new Howl({ src: ["/sounds/tense.mp3"], loop: true, volume: 0 });
  const neutral = new Howl({ src: ["/sounds/neutral.mp3"], loop: true, volume: 0 });

  calm.play();
  tense.play();
  neutral.play();

  const fadeAudio = (target: "POSITIVE" | "NEGATIVE" | "NEUTRAL") => {
    calm.fade(calm.volume(), target === "POSITIVE" ? 0.6 : 0, 1500);
    tense.fade(tense.volume(), target === "NEGATIVE" ? 0.6 : 0, 1500);
    neutral.fade(neutral.volume(), target === "NEUTRAL" ? 0.5 : 0, 1500);
  };

  fadeAudio(sentiment); // start with current mood

  return () => {
    calm.unload();
    tense.unload();
    neutral.unload();
  };
}, [sentiment]);


  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    const response = await fetchLokiResponse(input);

// --- Dummy Sentiment Analysis ---
const moods = ['POSITIVE', 'NEGATIVE', 'NEUTRAL'] as const;
const randomMood = moods[Math.floor(Math.random() * moods.length)];
setSentiment(randomMood);
setPulseRhythm(randomMood === 'POSITIVE' ? 'calm' : randomMood === 'NEGATIVE' ? 'erratic' : 'steady');
// --------------------------------

const lokiMessage: Message = {
  id: (Date.now() + 1).toString(),
  text: response,
  sender: 'loki',
  timestamp: new Date()
};


    setIsTyping(false);
    setMessages(prev => [...prev, lokiMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
    case "POSITIVE":
      return "linear-gradient(135deg, #0f172a 0%, #10b981 40%, #6ee7b7 100%)";
    case "NEGATIVE":
      return "linear-gradient(135deg, #0f172a 0%, #dc2626 40%, #f43f5e 100%)";
    default:
      return "linear-gradient(135deg, #0f172a 0%, #3b82f6 40%, #06b6d4 100%)";
  }
};



  return (<div
  className="min-h-screen relative overflow-hidden transition-all duration-[2000ms] ease-in-out"
  style={{ background: getBackground() }}
>

      {/* Animated particles background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl animate-pulse"
             style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse"
             style={{ animationDuration: '6s', animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-magenta-500/5 rounded-full blur-3xl animate-pulse"
             style={{ animationDuration: '5s', animationDelay: '2s' }}></div>
      </div>

      {/* Main container */}
      <div className={`relative z-10 flex flex-col mx-auto transition-all duration-700 ease-out ${
        hasMessages
          ? 'h-screen max-w-4xl px-4'
          : 'h-screen max-w-2xl px-4 justify-center'
      }`}>

        {/* Welcome header - only show when no messages */}
        {!hasMessages && (
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
              Speak to Loki
            </h1>
            <p className="text-gray-400 text-lg">The trickster Goblin awaits your questions...</p>
          </div>
        )}
        {/* Harmony Meter */}
{/* Harmony Meter (Top Center Pulsing Ball) */}
<div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
  <div
    className={`w-8 h-8 md:w-10 md:h-10 rounded-full transition-all duration-500 ${
      sentiment === 'POSITIVE'
        ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg shadow-green-500/40'
        : sentiment === 'NEGATIVE'
        ? 'bg-gradient-to-r from-red-500 to-pink-600 shadow-lg shadow-pink-500/40'
        : 'bg-gradient-to-r from-blue-400 to-cyan-500 shadow-lg shadow-cyan-500/40'
    }`}
    style={{
      animation: pulseRhythm === 'calm'
        ? 'pulse 2s ease-in-out infinite'
        : pulseRhythm === 'erratic'
        ? 'pulse 0.8s ease-in-out infinite'
        : 'pulse 1.4s ease-in-out infinite'
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
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {message.sender === 'loki' && (
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center mr-3 shadow-lg shadow-cyan-500/30">
                    <span className="text-white font-bold text-sm">L</span>
                  </div>
                )}

                <div className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-5 py-3 ${
                  message.sender === 'user'
                    ? 'bg-[#1E293B] text-white shadow-lg'
                    : 'bg-gradient-to-br from-gray-900/90 to-gray-800/90 text-gray-100 border border-cyan-500/30 shadow-lg shadow-cyan-500/10 backdrop-blur-sm animate-glow'
                }`}>
                  <p className="text-sm md:text-base leading-relaxed">{message.text}</p>
                </div>

                {message.sender === 'user' && (
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
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input area */}
        <div className={`${hasMessages ? 'pb-6' : ''}`}>
         <div
  className={`relative rounded-2xl border-2 transition-all duration-500 backdrop-blur-xl ${
    sentiment === 'POSITIVE'
      ? 'bg-[#0f172a]/60 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
      : sentiment === 'NEGATIVE'
      ? 'bg-[#1a0e0e]/70 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)]'
      : 'bg-[#0a1020]/60 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
  } ${isFocused ? 'scale-[1.03]' : 'scale-[1.0]'}`}
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
              className="w-full px-6 py-4 bg-transparent text-white placeholder-gray-300 outline-none text-base"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all duration-300 ${
  input.trim()
    ? sentiment === 'POSITIVE'
      ? 'bg-gradient-to-r from-green-400 to-emerald-500 hover:shadow-lg hover:shadow-green-500/40 hover:scale-105'
      : sentiment === 'NEGATIVE'
      ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:shadow-lg hover:shadow-pink-500/40 hover:scale-105'
      : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:shadow-lg hover:shadow-cyan-500/40 hover:scale-105'
    : 'bg-gray-700/50 cursor-not-allowed'
}`}

            >
              <Send className={`w-4 h-4 ${input.trim() ? 'text-white' : 'text-gray-500'}`} />
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
          @keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.9;
  }
  50% {
    transform: scale(1.25);
    opacity: 1;
  }
}



@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.85;
    filter: blur(0px);
  }
  50% {
    transform: scale(1.3);
    opacity: 1;
    filter: blur(1px);
  }
}

/* Hide scrollbar but allow scrolling */

.no-scrollbar::-webkit-scrollbar {
  display: none; /* Chrome, Safari */
}
.no-scrollbar {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}


      `}</style>
    </div>
  );
}
