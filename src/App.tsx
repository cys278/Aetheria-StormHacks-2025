// App.tsx (sketch).
import { useState } from "react";
import SceneAwakening from "./components/SceneAwakening";
import LokiChatUI from "./components/LokiChatUI";
import SceneTransition from "./components/SceneTransition";
import { useSceneTransition } from "./hooks/useSceneTransition";
import SceneCitadel from "./components/SceneCitadel";
import type { MoodType, PulseRhythm } from "./types";

export default function App() {
  const [awakened, setAwakened] = useState(false);
  const [citadel, setCitadel] = useState(false);
  const { active, fadeToBlack } = useSceneTransition();

  //  ADD: single source of truth for mood
  const [sentiment, setSentiment] = useState<MoodType>("neutral");
  const [pulseRhythm, setPulseRhythm] = useState<PulseRhythm>("steady");

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
        />
      )}

      {/* Placeholder: Your second scene component */}
      {citadel && (
        // ✨ NEW: Citadel reacts to the same sentiment
        <SceneCitadel sentiment={sentiment} />
      )}

      <SceneTransition active={active} />
    </div>
  );
}
