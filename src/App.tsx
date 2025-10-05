// App.tsx (sketch). # have to change this 
import { useState } from "react";
import SceneAwakening from "./components/SceneAwakening";
import LokiChatUI from "./components/LokiChatUI";
import SceneTransition from "./components/SceneTransition";
import { useSceneTransition } from "./hooks/useSceneTransition";
import SceneCitadel from "./components/SceneCitadel";


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


          onTriggerCitadel={() => fadeToBlack(() => setCitadel(true))}
        />
      )}

      {/* Placeholder: Your second scene component */}
      {citadel && <SceneCitadel />}


      <SceneTransition active={active} />
    </div>
  );
}
