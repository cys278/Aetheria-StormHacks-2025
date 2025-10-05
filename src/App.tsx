// App.tsx
import { useState } from "react";
import SceneAwakening from "./components/SceneAwakening";
import LokiChatUI from "./components/LokiChatUI";
import SceneTransition from "./components/SceneTransition";
import { useSceneTransition } from "./hooks/useSceneTransition";
import SceneCitadel from "./components/SceneCitadel";

// 🌈 Shared types (you can move these to types.ts later)
type Sentiment = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
type Rhythm = 'calm' | 'erratic' | 'steady';

export default function App() {
  const [awakened, setAwakened] = useState(false);
  const [citadel, setCitadel] = useState(false);
  const { active, fadeToBlack } = useSceneTransition();

  // 🎭 Single source of truth for world emotion
  const [sentiment, setSentiment] = useState<Sentiment>('NEUTRAL');
  const [pulseRhythm, setPulseRhythm] = useState<Rhythm>('steady');

  // 🌀 NEW: function to exit the Citadel
  const handleExitCitadel = () => fadeToBlack(() => setCitadel(false));

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* Awakening scene */}
      {!awakened && <SceneAwakening onAwaken={() => setAwakened(true)} />}

      {/* Loki chat world */}
      {awakened && !citadel && (
        <LokiChatUI
          sentiment={sentiment}
          pulseRhythm={pulseRhythm}
          onSentimentChange={(s, r) => {
            setSentiment(s);
            setPulseRhythm(r);
          }}
          onTriggerCitadel={() => fadeToBlack(() => setCitadel(true))}
        />
      )}

      {/* Citadel of Regret scene */}
      {citadel && (
        <SceneCitadel
          sentiment={sentiment}
          onExitCitadel={handleExitCitadel} // 👈 added exit callback
        />
      )}

      {/* Fade transition overlay */}
      <SceneTransition active={active} />
    </div>
  );
}
