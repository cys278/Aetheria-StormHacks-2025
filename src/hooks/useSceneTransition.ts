// src/hooks/useSceneTransition.ts
import { useState } from "react";

export function useSceneTransition() {
  const [active, setActive] = useState(false);

  function fadeToBlack(then: () => void) {
    setActive(true);
    setTimeout(() => {
      then();             // swap scene here (setState / navigate)
      setTimeout(() => setActive(false), 350); // optional fade-in
    }, 700);              // matches transition duration
  }

  return { active, fadeToBlack };
}
