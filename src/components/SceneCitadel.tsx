import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { OrbitControls, Stars } from "@react-three/drei";

export default function SceneCitadel() {
  return (
    <div className="absolute inset-0 bg-black">
      <Canvas camera={{ position: [0, 3, 6], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[3, 3, 3]} intensity={1.2} color="#f97316" />

        {/* Distant stars */}
        <Stars radius={100} depth={50} count={4000} factor={4} fade />

        {/* Citadel tower */}
        <CitadelTower />

        {/* Floating fog */}
        <fog attach="fog" args={["#0a0a0a", 5, 18]} />

        {/* Optional camera controls */}
        <OrbitControls enablePan={false} enableZoom={false} />
      </Canvas>

      {/* On-screen title */}
      <div className="absolute bottom-10 w-full text-center text-3xl md:text-5xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-500 to-yellow-400 drop-shadow-lg animate-gradient">
        The Citadel of Regret
      </div>
    </div>
  );
}

// 🏗️ Simple 3D Tower Model
function CitadelTower() {
  const towerRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (towerRef.current) {
      towerRef.current.rotation.y += 0.002;
    }
  });

  return (
    <group ref={towerRef} position={[0, -1, 0]}>
      {/* Main tower */}
      <mesh>
        <cylinderGeometry args={[1.5, 2, 5, 32]} />
        <meshStandardMaterial color="#1e293b" metalness={0.4} roughness={0.5} emissive="#f97316" emissiveIntensity={0.2} />
      </mesh>

      {/* Spire */}
      <mesh position={[0, 3, 0]}>
        <coneGeometry args={[0.8, 2.5, 32]} />
        <meshStandardMaterial color="#fb923c" metalness={0.8} roughness={0.2} emissive="#f97316" emissiveIntensity={0.6} />
      </mesh>

      {/* Floating orbs */}
      {Array.from({ length: 5 }).map((_, i) => (
        <Orb key={i} index={i} />
      ))}
    </group>
  );
}

// ✨ Floating orbs that circle the citadel
function Orb({ index }: { index: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime + index * 1.2;
      const radius = 3 + Math.sin(t * 0.3) * 0.5;
      ref.current.position.set(Math.cos(t) * radius, Math.sin(t * 1.2) * 1.5, Math.sin(t) * radius);
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.15, 32, 32]} />
      <meshStandardMaterial emissive="#fbbf24" emissiveIntensity={1.2} color="#fde68a" />
    </mesh>
  );
}
