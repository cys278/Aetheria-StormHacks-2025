// App.tsx (sketch). # have to change this 
import { useState } from "react";
import SceneAwakening from "./components/SceneAwakening";
import LokiChatUI from "./components/LokiChatUI";
import SceneTransition from "./components/SceneTransition";
import { useSceneTransition } from "./hooks/useSceneTransition";

export default function App() {
  const [awakened, setAwakened] = useState(false);
  const [citadel, setCitadel] = useState(false);
  const { active, fadeToBlack } = useSceneTransition();

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {!awakened && <SceneAwakening onAwaken={() => setAwakened(true)} />}

      {awakened && !citadel && (
        <LokiChatUI
          // Example: trigger transition when you want (button, score, etc.)

          
          //onTriggerCitadel={() => fadeToBlack(() => setCitadel(true))}
        />
      )}

      {/* Placeholder: Your second scene component */}
      {citadel && (
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <h1 className="text-4xl">Citadel of Regret (WIP)</h1>
        </div>
      )}

      <SceneTransition active={active} />
    </div>
  );
}
