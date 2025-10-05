// App.tsx (sketch). 
import { useState } from "react";
import SceneAwakening from "./components/SceneAwakening";
import LokiChatUI from "./components/LokiChatUI";
import SceneTransition from "./components/SceneTransition";
import { useSceneTransition } from "./hooks/useSceneTransition";
import SceneCitadel from "./components/SceneCitadel";

//  ADD: shared types (or extract to a types file later)
type Sentiment = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
type Rhythm = 'calm' | 'erratic' | 'steady';



export default function App() {
  const [awakened, setAwakened] = useState(false);
  const [citadel, setCitadel] = useState(false);
  const { active, fadeToBlack } = useSceneTransition();

  //  ADD: single source of truth for mood
const [sentiment, setSentiment] = useState<Sentiment>('NEUTRAL');
const [pulseRhythm, setPulseRhythm] = useState<Rhythm>('steady');


  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {!awakened && <SceneAwakening onAwaken={() => setAwakened(true)} />}

      {awakened && !citadel && (
        <LokiChatUI
          //  NEW: pass mood down + setter callback
  sentiment={sentiment}
  pulseRhythm={pulseRhythm}
  onSentimentChange={(s: Sentiment, r: Rhythm) => {
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
