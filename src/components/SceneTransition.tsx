// src/components/SceneTransition.tsx
// import { useEffect } from "react";

export default function SceneTransition({
  active,
}: {
  active: boolean;
}) {
  return (
    <div
      className={`fixed inset-0 z-[999] bg-black transition-opacity duration-700 pointer-events-none ${
        active ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}
