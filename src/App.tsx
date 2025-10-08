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

      {/* --- Main Game Area (Post-Awakening) --- */}
      {/* We render this block as soon as the user has awakened */}
      {awakened && (
        <>
          {/* The Chat UI is ALWAYS present as the interactive layer, unless an ending is active */}
          {!endingKey && (
            <LokiChatUI
              sentiment={sentiment}
              pulseRhythm={pulseRhythm}
              onSentimentChange={(s: MoodType, r: PulseRhythm) => {
                setSentiment(s);
                setPulseRhythm(r);
              }}
              onTriggerCitadel={() => fadeToBlack(() => setCitadel(true))}
              onExitCitadel={handleExitCitadel}
              onJourneyComplete={(key: string) =>
                fadeToBlack(() => setEndingKey(key))
              }
            />
          )}

          {/* The Citadel is a CONDITIONAL visual background layer */}
          {/* It renders ON TOP of the Chat UI's background, but BEHIND its text bubbles */}
          {citadel && (
            <SceneCitadel
              sentiment={sentiment}
             
            />
          )}
        </>
      )}

      {/* The Ending Screen is a FINAL overlay that covers everything else */}
      {endingKey && (
        <EndingScreen
          endingKey={endingKey}
          sentiment={sentiment}
          onClose={() =>
            fadeToBlack(() => {
              setEndingKey(null);
              setCitadel(false); // Ensure we are not in the citadel after an ending
            })
          }
        />
      )}

      <SceneTransition active={active} />
    </div>
  );
}
