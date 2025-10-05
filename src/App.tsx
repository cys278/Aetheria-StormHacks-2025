import { useState } from "react";
import SceneAwakening from "./components/SceneAwakening";
import LokiChatUI from "./components/LokiChatUI";

export default function App() {
  const [awakened, setAwakened] = useState(false);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {!awakened && <SceneAwakening onAwaken={() => setAwakened(true)} />}
      {awakened && <LokiChatUI />}
    </div>
  );
}
