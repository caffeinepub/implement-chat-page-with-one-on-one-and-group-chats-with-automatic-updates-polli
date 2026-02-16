import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

interface RealisticRoadCourseSceneProps {
  weather?: 'sunny' | 'overcast' | 'rainy';
}

export function RealisticRoadCourseScene({ weather = 'sunny' }: RealisticRoadCourseSceneProps) {
  const [asphaltTexture, setAsphaltTexture] = useState<THREE.Texture | null>(null);
  const [grassTexture, setGrassTexture] = useState<THREE.Texture | null>(null);
  const [curbTexture, setCurbTexture] = useState<THREE.Texture | null>(null);
  const [guardrailTexture, setGuardrailTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    
    loader.load('/assets/generated/asphalt-realistic.dim_2048x2048.png', (tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(30, 30);
      setAsphaltTexture(tex);
    });
    
    loader.load('/assets/generated/grass-verge.dim_2048x2048.png', (tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(40, 40);
      setGrassTexture(tex);
    });
    
    loader.load('/assets/generated/curb-red-white-realistic.dim_2048x256.png', (tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      setCurbTexture(tex);
    });
    
    loader.load('/assets/generated/guardrail-texture.dim_2048x512.png', (tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      setGuardrailTexture(tex);
    });
  }, []);

  const trackRoughness = weather === 'rainy' ? 0.2 : 0.85;
  const trackMetalness = weather === 'rainy' ? 0.25 : 0.05;

  return (
    <group>
      {/* Main asphalt track surface - ring shape */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <ringGeometry args={[38, 62, 64]} />
        <meshStandardMaterial
          map={asphaltTexture}
          roughness={trackRoughness}
          metalness={trackMetalness}
        />
      </mesh>

      {/* Inner grass area */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <circleGeometry args={[38, 64]} />
        <meshStandardMaterial map={grassTexture} roughness={0.95} />
      </mesh>

      {/* Outer grass verge */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <ringGeometry args={[62, 100, 64]} />
        <meshStandardMaterial map={grassTexture} roughness={0.95} />
      </mesh>

      {/* Inner red/white curbs */}
      {[...Array(48)].map((_, i) => {
        const angle = (i / 48) * Math.PI * 2;
        const radius = 37.5;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        return (
          <mesh key={`curb-inner-${i}`} position={[x, 0.08, z]} rotation={[-Math.PI / 2, 0, angle]} receiveShadow castShadow>
            <planeGeometry args={[1.0, 3]} />
            <meshStandardMaterial map={curbTexture} />
          </mesh>
        );
      })}

      {/* Outer red/white curbs */}
      {[...Array(48)].map((_, i) => {
        const angle = (i / 48) * Math.PI * 2;
        const radius = 62.5;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        return (
          <mesh key={`curb-outer-${i}`} position={[x, 0.08, z]} rotation={[-Math.PI / 2, 0, angle]} receiveShadow castShadow>
            <planeGeometry args={[1.0, 3]} />
            <meshStandardMaterial map={curbTexture} />
          </mesh>
        );
      })}

      {/* Outer guardrails/barriers */}
      {[...Array(48)].map((_, i) => {
        const angle = (i / 48) * Math.PI * 2;
        const radius = 68;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        return (
          <mesh key={`barrier-${i}`} position={[x, 1.2, z]} rotation={[0, angle + Math.PI / 2, 0]} castShadow>
            <boxGeometry args={[4, 2.4, 0.3]} />
            <meshStandardMaterial map={guardrailTexture} roughness={0.6} metalness={0.2} />
          </mesh>
        );
      })}

      {/* Start/finish line */}
      <mesh position={[-50, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[24, 10]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.9} />
      </mesh>
      <mesh position={[-48, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2, 12]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.7} />
      </mesh>
      <mesh position={[-46, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2, 12]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.7} />
      </mesh>

      {/* Track markers */}
      {[...Array(12)].map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const radius = 50;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        return (
          <mesh key={`marker-${i}`} position={[x, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.6, 16]} />
            <meshStandardMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={0.2} />
          </mesh>
        );
      })}
    </group>
  );
}
