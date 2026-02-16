import { useRef, useEffect, useState } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';

interface RealisticSportsCoupeCarProps {
  position: THREE.Vector3;
  rotation: number;
  velocity: number;
  suspensionOffset: number;
  isPlayer?: boolean;
}

export function RealisticSportsCoupeCar({
  position,
  rotation,
  velocity,
  suspensionOffset,
  isPlayer = false,
}: RealisticSportsCoupeCarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const wheelRotation = useRef(0);
  const [liveryTexture, setLiveryTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load('/assets/generated/sports-coupe-livery.dim_2048x1024.png', (tex) => {
      setLiveryTexture(tex);
    });
  }, []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.position.copy(position);
      groupRef.current.position.y += suspensionOffset;
      groupRef.current.rotation.y = rotation;
      
      wheelRotation.current += velocity * delta * 2;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main body - wide sports coupe */}
      <mesh castShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[2.2, 0.6, 4.5]} />
        <meshStandardMaterial
          color="#FFD700"
          metalness={0.8}
          roughness={0.2}
          map={liveryTexture}
        />
      </mesh>

      {/* Hood */}
      <mesh castShadow position={[0, 0.55, 1.8]}>
        <boxGeometry args={[2.0, 0.1, 1.2]} />
        <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Roof/Cabin */}
      <mesh castShadow position={[0, 1.0, -0.3]}>
        <boxGeometry args={[1.8, 0.6, 2.0]} />
        <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Windshield */}
      <mesh castShadow position={[0, 1.15, 0.6]}>
        <boxGeometry args={[1.7, 0.5, 0.8]} />
        <meshStandardMaterial
          color="#1a1a2e"
          metalness={0.9}
          roughness={0.05}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Rear window */}
      <mesh castShadow position={[0, 1.1, -1.2]}>
        <boxGeometry args={[1.7, 0.4, 0.6]} />
        <meshStandardMaterial
          color="#1a1a2e"
          metalness={0.9}
          roughness={0.05}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Rear spoiler */}
      <mesh castShadow position={[0, 1.4, -2.4]}>
        <boxGeometry args={[2.0, 0.1, 0.6]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh castShadow position={[-0.8, 1.1, -2.4]}>
        <boxGeometry args={[0.1, 0.5, 0.5]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh castShadow position={[0.8, 1.1, -2.4]}>
        <boxGeometry args={[0.1, 0.5, 0.5]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Side skirts */}
      <mesh castShadow position={[-1.15, 0.25, 0]}>
        <boxGeometry args={[0.15, 0.3, 4.0]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh castShadow position={[1.15, 0.25, 0]}>
        <boxGeometry args={[0.15, 0.3, 4.0]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Front bumper */}
      <mesh castShadow position={[0, 0.3, 2.5]}>
        <boxGeometry args={[2.2, 0.4, 0.3]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Rear bumper with gradient accent area */}
      <mesh castShadow position={[0, 0.4, -2.5]}>
        <boxGeometry args={[2.2, 0.5, 0.3]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Headlights */}
      <mesh position={[-0.7, 0.5, 2.6]}>
        <boxGeometry args={[0.3, 0.2, 0.1]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0.7, 0.5, 2.6]}>
        <boxGeometry args={[0.3, 0.2, 0.1]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
      </mesh>

      {/* Tail lights */}
      <mesh position={[-0.8, 0.5, -2.6]}>
        <boxGeometry args={[0.3, 0.2, 0.1]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0.8, 0.5, -2.6]}>
        <boxGeometry args={[0.3, 0.2, 0.1]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.4} />
      </mesh>

      {/* Front wheels */}
      <group position={[-1.0, 0.35, 1.5]} rotation={[wheelRotation.current, 0, 0]}>
        <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.4, 0.4, 0.35, 16]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} metalness={0.1} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.25, 0.25, 0.36, 16]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.7} metalness={0.3} />
        </mesh>
      </group>
      <group position={[1.0, 0.35, 1.5]} rotation={[wheelRotation.current, 0, 0]}>
        <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.4, 0.4, 0.35, 16]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} metalness={0.1} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.25, 0.25, 0.36, 16]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.7} metalness={0.3} />
        </mesh>
      </group>

      {/* Rear wheels - wider */}
      <group position={[-1.1, 0.4, -1.5]} rotation={[wheelRotation.current, 0, 0]}>
        <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.45, 0.45, 0.45, 16]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} metalness={0.1} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.28, 0.28, 0.46, 16]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.7} metalness={0.3} />
        </mesh>
      </group>
      <group position={[1.1, 0.4, -1.5]} rotation={[wheelRotation.current, 0, 0]}>
        <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.45, 0.45, 0.45, 16]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} metalness={0.1} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.28, 0.28, 0.46, 16]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.7} metalness={0.3} />
        </mesh>
      </group>

      {/* Side mirrors */}
      <mesh castShadow position={[-1.0, 1.0, 0.8]}>
        <boxGeometry args={[0.15, 0.1, 0.2]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh castShadow position={[1.0, 1.0, 0.8]}>
        <boxGeometry args={[0.15, 0.1, 0.2]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Player indicator */}
      {isPlayer && (
        <mesh position={[0, 2.5, 0]}>
          <coneGeometry args={[0.3, 0.8, 4]} />
          <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={0.8} />
        </mesh>
      )}
    </group>
  );
}
