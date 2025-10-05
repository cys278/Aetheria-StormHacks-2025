// App.tsx (sketch).
import { useState } from "react";
import SceneAwakening from "./components/SceneAwakening";
import LokiChatUI from "./components/LokiChatUI";
import SceneTransition from "./components/SceneTransition";
import { useSceneTransition } from "./hooks/useSceneTransition";
import SceneCitadel from "./components/SceneCitadel";
import EndingScreen from "./components/EndingScreen";
import type { MoodType, PulseRhythm } from "./types";

export default function App() {
  const [awakened, setAwakened] = useState(false);
  const [citadel, setCitadel] = useState(false);
  const [endingKey, setEndingKey] = useState<string | null>(null);
  const { active, fadeToBlack } = useSceneTransition();

  //  ADD: single source of truth for mood
  const [sentiment, setSentiment] = useState<MoodType>("neutral");
  const [pulseRhythm, setPulseRhythm] = useState<PulseRhythm>("steady");

  const handleExitCitadel = () => fadeToBlack(() => setCitadel(false));

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {!awakened && <SceneAwakening onAwaken={() => setAwakened(true)} />}

      {awakened && !citadel && (
        <LokiChatUI
          //  NEW: pass mood down + setter callback
          sentiment={sentiment}
          pulseRhythm={pulseRhythm}
          onSentimentChange={(s: MoodType, r: PulseRhythm) => {
            setSentiment(s);
            setPulseRhythm(r);
          }}
          onTriggerCitadel={() => fadeToBlack(() => setCitadel(true))}
          onJourneyComplete={(key: string) =>
            fadeToBlack(() => setEndingKey(key))
          }
        />
      )}

      {/* Placeholder: Your second scene component */}
      {citadel && (
        // ✨ NEW: Citadel reacts to the same sentiment
        <SceneCitadel sentiment={sentiment} onExitCitadel={handleExitCitadel} />
      )}

      {/* Ending overlay takes precedence */}
      {endingKey && (
        <EndingScreen
          endingKey={endingKey}
          sentiment={sentiment}
          onClose={() =>
            fadeToBlack(() => {
              setEndingKey(null);
              setCitadel(false); // ensure we land back in chat
            })
          }
        />
      )}

      <SceneTransition active={active} />
    </div>
  );
}
