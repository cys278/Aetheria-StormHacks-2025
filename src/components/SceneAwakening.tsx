import { Canvas, useFrame } from "@react-three/fiber";
import { useState, useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "@react-three/drei";
import { Howl } from "howler";

export default function SceneAwakening({ onAwaken }: { onAwaken: () => void }) {
  const [phase, setPhase] = useState<"dark" | "text" | "ready">("dark");
  const [opacity, setOpacity] = useState(0);
  const [clicked, setClicked] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  // Awakening sequence (fade-in text)
  useEffect(() => {
    const seq = async () => {
      await new Promise((r) => setTimeout(r, 1000)); // pause before fade
      setPhase("text");

      let o = 0;
      const fade = setInterval(() => {
        o += 0.02;
        setOpacity(o);
        if (o >= 1) {
          clearInterval(fade);
          setTimeout(() => setPhase("ready"), 2000);
        }
      }, 50);
    };
    seq();
  }, []);

  // 🔊 Play ambient sound after user interaction
  useEffect(() => {
    if (!clicked) return; // only play when user clicks
    const ambient = new Howl({
      src: ["/sounds/awakening.mp3"],
      loop: true,
      volume: 0.4,
    });

    ambient.play();

    return () => {
      ambient.fade(0.4, 0, 1500);
      setTimeout(() => ambient.stop(), 1500);
    };
  }, [clicked]);

  // 🚀 Transition to LokiChatUI after a delay
  useEffect(() => {
    if (clicked && phase === "ready") {
      const timer = setTimeout(() => onAwaken(), 4000); // give a moment of ambience
      return () => clearTimeout(timer);
    }
  }, [clicked, phase, onAwaken]);

  // 🟣 Floating pulsing sphere
  const Echo = () => {
    const mesh = useRef<THREE.Mesh>(null);
    useFrame((state) => {
      if (mesh.current) {
        const t = state.clock.elapsedTime;
        mesh.current.scale.setScalar(1 + Math.sin(t * 2) * 0.05);
        mesh.current.rotation.y += 0.004;
        mesh.current.position.y = Math.sin(t) * 0.2;
      }
    });
    return (
      <mesh ref={mesh}>
        <sphereGeometry args={[1.5, 64, 64]} />
        <meshStandardMaterial
          color="#a855f7"
          emissive="#9333ea"
          emissiveIntensity={0.8}
          roughness={0.3}
          metalness={0.5}
        />
      </mesh>
    );
  };

  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center bg-black transition-all duration-1000 cursor-pointer"
      onClick={() => setClicked(true)} // 👈 start audio + awakening on click
    >
      <Canvas camera={{ position: [0, 0, 4] }}>
        <fog attach="fog" args={["#000000", 4, 10]} />
        <ambientLight intensity={0.3} />
        <pointLight position={[2, 2, 2]} color="#a855f7" intensity={1.5} />
        <Echo />
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>

      {/* 🧠 Text overlay */}
      {phase !== "dark" && (
        <div
          ref={textRef}
          className="absolute text-center select-none"
          style={{ opacity, transition: "opacity 1.5s ease-in-out" }}
        >
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
            {clicked ? "Where am I?" : "Click to awaken"}
          </h1>
        </div>
      )}
    </div>
  );
}
