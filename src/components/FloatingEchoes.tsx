// src/components/FloatingEchoes.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Detailed, Text } from "@react-three/drei";
import * as THREE from "three";

type Sentiment = "POSITIVE" | "NEGATIVE" | "NEUTRAL";
type Msg = { id: string; text: string; sender: "user" | "loki"; timestamp: Date };

type Fragment = {
  id: string;
  text: string;
  start: number;        // performance.now()
  life: number;         // ms visible
  pos: THREE.Vector3;   // starting pos
  vel: THREE.Vector3;   // velocity per second
  color: string;        // based on sentiment
};

function colorFor(sentiment: Sentiment) {
  if (sentiment === "POSITIVE") return "#34d399"; // emerald-400
  if (sentiment === "NEGATIVE") return "#f43f5e"; // rose-500
  return "#22d3ee"; // cyan-400
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function FragmentMesh({
  frag,
  onExpired,
}: {
  frag: Fragment;
  onExpired: (id: string) => void;
}) {
  const group = useRef<THREE.Group>(null!);
  const textRef = useRef<any>(null);

  useFrame((_, delta) => {
    const age = performance.now() - frag.start;
    const t = Math.min(age / frag.life, 1);

    // Drift position
    group.current.position.x += frag.vel.x * delta;
    group.current.position.y += frag.vel.y * delta;
    group.current.position.z += frag.vel.z * delta;

    // Gentle bob for life
    group.current.rotation.z = Math.sin(age * 0.001) * 0.08;

    // Fade scale & opacity out near the end
    const fade = 1 - t;
    const scale = 1 + t * 0.15;
    group.current.scale.setScalar(scale);

    if (textRef.current && textRef.current.material) {
      textRef.current.material.transparent = true;
      textRef.current.material.opacity = Math.max(fade, 0);
    }

    if (t >= 1) onExpired(frag.id);
  });

  return (
    <group ref={group} position={frag.pos.clone()}>
      {/* Level of Detail: high → mid → tiny sprite */}
      <Detailed distances={[0, 12, 24]}>
        {/* High detail */}
        <Text
          ref={textRef}
          fontSize={0.42}
          maxWidth={4}
          lineHeight={1.15}
          anchorX="center"
          anchorY="middle"
          color={frag.color}
          outlineWidth={0.004}
          outlineColor="#000000"
        >
          {frag.text}
        </Text>

        {/* Mid detail */}
        <Text
          fontSize={0.28}
          maxWidth={3.2}
          lineHeight={1.1}
          anchorX="center"
          anchorY="middle"
          color={frag.color}
        >
          {frag.text}
        </Text>

        {/* Far: small glowing plane */}
        <mesh>
          <planeGeometry args={[0.6, 0.2]} />
          <meshBasicMaterial color={frag.color} transparent opacity={0.7} />
        </mesh>
      </Detailed>
    </group>
  );
}

export default function FloatingEchoes({
  messages,
  sentiment,
  maxFragments = 20,
  lifeMs = 30000,
}: {
  messages: Msg[];
  sentiment: Sentiment;
  maxFragments?: number;
  lifeMs?: number;
}) {
  const [frags, setFrags] = useState<Fragment[]>([]);
  const lastAddedId = useRef<string | null>(null);

  // Track last USER message and spawn a fragment when a new one arrives
  useEffect(() => {
    const lastUser = [...messages].reverse().find((m) => m.sender === "user");
    if (!lastUser || lastUser.id === lastAddedId.current) return;

    lastAddedId.current = lastUser.id;

    // random start around center & gentle drift
    const startPos = new THREE.Vector3(rand(-1.2, 1.2), rand(-0.4, 0.8), rand(-0.5, 0.2));
    const vel = new THREE.Vector3(rand(-0.15, 0.15), rand(0.05, 0.18), rand(-0.05, 0.05));

    const frag: Fragment = {
      id: lastUser.id,
      text: lastUser.text,
      start: performance.now(),
      life: lifeMs,
      pos: startPos,
      vel,
      color: colorFor(sentiment),
    };

    setFrags((prev) => {
      const next = [...prev, frag];
      // hard cap
      if (next.length > maxFragments) next.shift();
      return next;
    });
  }, [messages, sentiment, lifeMs, maxFragments]);

  return (
    <>
      {frags.map((f) => (
        <FragmentMesh
          key={f.id}
          frag={f}
          onExpired={(id) => setFrags((prev) => prev.filter((x) => x.id !== id))}
        />
      ))}
    </>
  );
}
