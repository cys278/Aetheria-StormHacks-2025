import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";
import { OrbitControls, Stars } from "@react-three/drei";
import type { MoodType } from "../types";

export default function SceneCitadel({ sentiment }: { sentiment: MoodType }) {
  // ✨ Mood-driven palette
  const palette = useMemo(() => {
    switch (sentiment) {
      case "positive":
        return {
          fog: "#06281e",
          key: "#10b981",
          accent: "#34d399",
          emissive: "#22c55e",
          titleFrom: "from-emerald-300",
          titleVia: "via-green-400",
          titleTo: "to-teal-300",
        };
      case "negative":
        return {
          fog: "#1b0a0a",
          key: "#dc2626",
          accent: "#f87171",
          emissive: "#ef4444",
          titleFrom: "from-orange-400",
          titleVia: "via-red-500",
          titleTo: "to-yellow-400",
        };
      default:
        return {
          fog: "#0a1020",
          key: "#3b82f6",
          accent: "#06b6d4",
          emissive: "#60a5fa",
          titleFrom: "from-sky-300",
          titleVia: "via-blue-400",
          titleTo: "to-cyan-300",
        };
    }
  }, [sentiment]);

  return (
    <div className="absolute inset-0 bg-black">
      <Canvas camera={{ position: [0, 3, 6], fov: 50 }}>
        {/* Mood lights */}
        <ambientLight intensity={0.35} color={palette.accent} />
        <pointLight position={[3, 3, 3]} intensity={1.3} color={palette.key} />

        {/* Distant stars */}
        <Stars radius={100} depth={50} count={4000} factor={4} fade />

        {/* Citadel tower reacts to mood */}
        <CitadelTower emissive={palette.emissive} />

        {/* Mood fog */}
        <fog attach="fog" args={[palette.fog, 5, 18]} />

        <OrbitControls enablePan={false} enableZoom={false} />
      </Canvas>

      {/* On-screen title adopts the mood gradient */}
      <div
        className={`absolute bottom-10 w-full text-center text-3xl md:text-5xl font-semibold text-transparent bg-clip-text bg-gradient-to-r ${palette.titleFrom} ${palette.titleVia} ${palette.titleTo} drop-shadow-lg animate-gradient`}
      >
        The Citadel of Regret
      </div>
    </div>
  );
}

// 🏗️ Simple 3D Tower Model
function CitadelTower({ emissive }: { emissive: string }) {
  const towerRef = useRef<THREE.Group>(null);
  useFrame(() => {
    if (towerRef.current) {
      towerRef.current.rotation.y += 0.002;
    }
  });

  return (
    <group ref={towerRef} position={[0, -1, 0]}>
      {/* Main tower */}
      <mesh>
        <cylinderGeometry args={[1.5, 2, 5, 32]} />
        <meshStandardMaterial
          color="#1e293b"
          metalness={0.4}
          roughness={0.5}
          emissive={emissive}
          emissiveIntensity={0.25}
        />
      </mesh>

      {/* Spire */}
      <mesh position={[0, 3, 0]}>
        <coneGeometry args={[0.8, 2.5, 32]} />
        <meshStandardMaterial
          color="#222"
          metalness={0.8}
          roughness={0.2}
          emissive={emissive}
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* Floating orbs (glow with same mood) */}
      {Array.from({ length: 5 }).map((_, i) => (
        <Orb key={i} index={i} emissive={emissive} />
      ))}
    </group>
  );
}

// ✨ Floating orbs that circle the citadel
function Orb({ index, emissive }: { index: number; emissive: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime + index * 1.2;
      const radius = 3 + Math.sin(t * 0.3) * 0.5;
      ref.current.position.set(
        Math.cos(t) * radius,
        Math.sin(t * 1.2) * 1.5,
        Math.sin(t) * radius
      );
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.15, 32, 32]} />
      <meshStandardMaterial
        emissive={emissive}
        emissiveIntensity={1.2}
        color="#ffffff"
      />
    </mesh>
  );
}
