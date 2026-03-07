import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";

interface RealisticSportsCoupeCarProps {
  position: THREE.Vector3;
  rotation: number;
  velocity: number;
  suspensionOffset: number;
  isPlayer?: boolean;
}

// F1 car modelled after the Aston Martin AMR – dark British racing green livery
// with sponsor accent stripes and proper open-wheel proportions.
export function RealisticSportsCoupeCar({
  position,
  rotation,
  velocity,
  suspensionOffset,
  isPlayer = false,
}: RealisticSportsCoupeCarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const wheelRotRef = useRef(0);

  // Livery colours
  const bodyGreen = "#004225"; // Aston Martin dark green
  const accentGold = "#A6863A"; // gold stripe / diffuser
  const carbonBlack = "#111111";
  const silverMetal = "#C0C0C0";
  const tyreBlack = "#1a1a1a";
  const rimSilver = "#888888";

  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.position.copy(position);
      groupRef.current.position.y += suspensionOffset;
      groupRef.current.rotation.y = rotation;
      wheelRotRef.current += (velocity / 100) * delta * 8;
    }
  });

  // Reusable materials
  const bodyMat = (
    <meshStandardMaterial color={bodyGreen} metalness={0.85} roughness={0.15} />
  );
  const accentMat = (
    <meshStandardMaterial color={accentGold} metalness={0.9} roughness={0.15} />
  );
  const carbonMat = (
    <meshStandardMaterial color={carbonBlack} metalness={0.5} roughness={0.4} />
  );
  const glassMat = (
    <meshStandardMaterial
      color="#1a2a3a"
      metalness={0.9}
      roughness={0.05}
      transparent
      opacity={0.35}
    />
  );
  const tyreMat = (
    <meshStandardMaterial color={tyreBlack} roughness={0.95} metalness={0.0} />
  );
  const rimMat = (
    <meshStandardMaterial color={rimSilver} metalness={0.9} roughness={0.2} />
  );
  const lightMat = (
    <meshStandardMaterial
      color="#ffffff"
      emissive="#ffffff"
      emissiveIntensity={0.6}
    />
  );
  const tailMat = (
    <meshStandardMaterial
      color="#ff2200"
      emissive="#ff2200"
      emissiveIntensity={0.5}
    />
  );

  const wr = wheelRotRef.current;

  return (
    <group ref={groupRef}>
      {/* ── Chassis / floor ─────────────────────────────── */}
      <mesh castShadow position={[0, 0.18, 0]}>
        <boxGeometry args={[1.7, 0.12, 4.6]} />
        {bodyMat}
      </mesh>

      {/* Gold side pod stripes */}
      <mesh castShadow position={[-0.86, 0.28, 0.2]}>
        <boxGeometry args={[0.04, 0.18, 2.4]} />
        {accentMat}
      </mesh>
      <mesh castShadow position={[0.86, 0.28, 0.2]}>
        <boxGeometry args={[0.04, 0.18, 2.4]} />
        {accentMat}
      </mesh>

      {/* ── Sidepods ────────────────────────────────────── */}
      <mesh castShadow position={[-1.0, 0.3, 0.2]}>
        <boxGeometry args={[0.35, 0.36, 2.2]} />
        {bodyMat}
      </mesh>
      <mesh castShadow position={[1.0, 0.3, 0.2]}>
        <boxGeometry args={[0.35, 0.36, 2.2]} />
        {bodyMat}
      </mesh>

      {/* Sidepod inlet (dark opening) */}
      <mesh position={[-1.18, 0.35, 0.9]}>
        <boxGeometry args={[0.04, 0.2, 0.4]} />
        {carbonMat}
      </mesh>
      <mesh position={[1.18, 0.35, 0.9]}>
        <boxGeometry args={[0.04, 0.2, 0.4]} />
        {carbonMat}
      </mesh>

      {/* ── Nose cone ────────────────────────────────────── */}
      {/* Narrow tapered nose */}
      <mesh castShadow position={[0, 0.25, 2.4]}>
        <boxGeometry args={[0.55, 0.2, 0.8]} />
        {bodyMat}
      </mesh>
      <mesh castShadow position={[0, 0.28, 3.05]}>
        <boxGeometry args={[0.3, 0.14, 0.5]} />
        {carbonMat}
      </mesh>

      {/* Nose tip */}
      <mesh castShadow position={[0, 0.3, 3.4]}>
        <boxGeometry args={[0.18, 0.1, 0.4]} />
        {carbonMat}
      </mesh>

      {/* ── Cockpit surround ────────────────────────────── */}
      <mesh castShadow position={[0, 0.52, -0.2]}>
        <boxGeometry args={[0.72, 0.36, 1.4]} />
        {bodyMat}
      </mesh>

      {/* Halo (safety device over cockpit) */}
      <mesh castShadow position={[0, 0.88, -0.1]}>
        <torusGeometry args={[0.36, 0.04, 8, 20, Math.PI]} />
        {carbonMat}
      </mesh>

      {/* Cockpit opening / visor */}
      <mesh position={[0, 0.6, -0.0]}>
        <boxGeometry args={[0.6, 0.22, 0.8]} />
        {glassMat}
      </mesh>

      {/* ── Engine cover / airbox ─────────────────────────*/}
      <mesh castShadow position={[0, 0.7, -0.9]}>
        <boxGeometry args={[0.5, 0.4, 1.0]} />
        {bodyMat}
      </mesh>
      {/* Air intake fin */}
      <mesh castShadow position={[0, 1.02, -0.7]}>
        <boxGeometry args={[0.14, 0.28, 0.7]} />
        {carbonMat}
      </mesh>

      {/* ── Rear section / diffuser ─────────────────────── */}
      <mesh castShadow position={[0, 0.22, -2.0]}>
        <boxGeometry args={[1.3, 0.16, 0.9]} />
        {accentMat}
      </mesh>
      <mesh castShadow position={[0, 0.14, -2.3]}>
        <boxGeometry args={[1.5, 0.1, 0.35]} />
        {carbonMat}
      </mesh>

      {/* ── Front wing ──────────────────────────────────── */}
      {/* Main plane */}
      <mesh castShadow position={[0, 0.1, 3.2]}>
        <boxGeometry args={[2.6, 0.06, 0.7]} />
        {carbonMat}
      </mesh>
      {/* Upper flap */}
      <mesh castShadow position={[0, 0.22, 3.05]}>
        <boxGeometry args={[2.2, 0.05, 0.45]} />
        {bodyGreen ? (
          <meshStandardMaterial
            color={bodyGreen}
            metalness={0.8}
            roughness={0.2}
          />
        ) : (
          bodyMat
        )}
      </mesh>
      {/* Endplates */}
      <mesh castShadow position={[-1.3, 0.16, 3.1]}>
        <boxGeometry args={[0.06, 0.22, 0.7]} />
        {carbonMat}
      </mesh>
      <mesh castShadow position={[1.3, 0.16, 3.1]}>
        <boxGeometry args={[0.06, 0.22, 0.7]} />
        {carbonMat}
      </mesh>

      {/* ── Rear wing ───────────────────────────────────── */}
      {/* Main element */}
      <mesh castShadow position={[0, 1.35, -2.15]}>
        <boxGeometry args={[2.0, 0.07, 0.55]} />
        {bodyGreen ? (
          <meshStandardMaterial
            color={bodyGreen}
            metalness={0.8}
            roughness={0.2}
          />
        ) : (
          bodyMat
        )}
      </mesh>
      {/* Upper flap / DRS */}
      <mesh castShadow position={[0, 1.48, -2.1]}>
        <boxGeometry args={[1.9, 0.05, 0.3]} />
        {carbonMat}
      </mesh>
      {/* Rear wing endplates */}
      <mesh castShadow position={[-1.0, 1.2, -2.15]}>
        <boxGeometry args={[0.06, 0.45, 0.6]} />
        {carbonMat}
      </mesh>
      <mesh castShadow position={[1.0, 1.2, -2.15]}>
        <boxGeometry args={[0.06, 0.45, 0.6]} />
        {carbonMat}
      </mesh>
      {/* Rear wing supports */}
      <mesh castShadow position={[-0.4, 0.9, -2.1]}>
        <boxGeometry args={[0.06, 0.55, 0.08]} />
        {carbonMat}
      </mesh>
      <mesh castShadow position={[0.4, 0.9, -2.1]}>
        <boxGeometry args={[0.06, 0.55, 0.08]} />
        {carbonMat}
      </mesh>

      {/* ── Wheels ───────────────────────────────────────── */}
      {/* Front Left */}
      <group position={[-1.2, 0.38, 1.6]}>
        <mesh castShadow rotation={[wr, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.38, 0.38, 0.34, 20]} />
          {tyreMat}
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.22, 0.36, 16]} />
          {rimMat}
        </mesh>
      </group>

      {/* Front Right */}
      <group position={[1.2, 0.38, 1.6]}>
        <mesh castShadow rotation={[wr, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.38, 0.38, 0.34, 20]} />
          {tyreMat}
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.22, 0.36, 16]} />
          {rimMat}
        </mesh>
      </group>

      {/* Rear Left */}
      <group position={[-1.22, 0.42, -1.55]}>
        <mesh castShadow rotation={[wr, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.42, 0.42, 0.44, 20]} />
          {tyreMat}
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.24, 0.24, 0.46, 16]} />
          {rimMat}
        </mesh>
      </group>

      {/* Rear Right */}
      <group position={[1.22, 0.42, -1.55]}>
        <mesh castShadow rotation={[wr, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.42, 0.42, 0.44, 20]} />
          {tyreMat}
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.24, 0.24, 0.46, 16]} />
          {rimMat}
        </mesh>
      </group>

      {/* Front suspension arms (simplified) */}
      <mesh castShadow position={[-0.82, 0.35, 1.62]}>
        <boxGeometry args={[0.35, 0.04, 0.04]} />
        {carbonMat}
      </mesh>
      <mesh castShadow position={[0.82, 0.35, 1.62]}>
        <boxGeometry args={[0.35, 0.04, 0.04]} />
        {carbonMat}
      </mesh>
      <mesh castShadow position={[-0.82, 0.42, -1.55]}>
        <boxGeometry args={[0.35, 0.04, 0.04]} />
        {carbonMat}
      </mesh>
      <mesh castShadow position={[0.82, 0.42, -1.55]}>
        <boxGeometry args={[0.35, 0.04, 0.04]} />
        {carbonMat}
      </mesh>

      {/* ── Lights ───────────────────────────────────────── */}
      {/* Headlights */}
      <mesh position={[-0.5, 0.28, 3.45]}>
        <boxGeometry args={[0.22, 0.1, 0.06]} />
        {lightMat}
      </mesh>
      <mesh position={[0.5, 0.28, 3.45]}>
        <boxGeometry args={[0.22, 0.1, 0.06]} />
        {lightMat}
      </mesh>

      {/* Tail lights */}
      <mesh position={[-0.55, 0.35, -2.4]}>
        <boxGeometry args={[0.28, 0.1, 0.06]} />
        {tailMat}
      </mesh>
      <mesh position={[0.55, 0.35, -2.4]}>
        <boxGeometry args={[0.28, 0.1, 0.06]} />
        {tailMat}
      </mesh>

      {/* Rear blinky safety light */}
      <mesh position={[0, 0.55, -2.25]}>
        <boxGeometry args={[0.1, 0.07, 0.06]} />
        <meshStandardMaterial
          color="#ff4400"
          emissive="#ff4400"
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* ── Sponsor decal placeholders ──────────────────── */}
      {/* aramco text area on sidepod */}
      <mesh position={[-1.18, 0.35, 0.15]}>
        <boxGeometry args={[0.03, 0.1, 0.7]} />
        <meshStandardMaterial color="#ffffff" metalness={0.2} roughness={0.6} />
      </mesh>
      <mesh position={[1.18, 0.35, 0.15]}>
        <boxGeometry args={[0.03, 0.1, 0.7]} />
        <meshStandardMaterial color="#ffffff" metalness={0.2} roughness={0.6} />
      </mesh>

      {/* Silver mirror stalks */}
      <mesh castShadow position={[-0.9, 0.7, 0.6]}>
        <boxGeometry args={[0.06, 0.06, 0.3]} />
        <meshStandardMaterial
          color={silverMetal}
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>
      <mesh castShadow position={[0.9, 0.7, 0.6]}>
        <boxGeometry args={[0.06, 0.06, 0.3]} />
        <meshStandardMaterial
          color={silverMetal}
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>
      {/* Mirror head */}
      <mesh castShadow position={[-0.95, 0.74, 0.76]}>
        <boxGeometry args={[0.14, 0.09, 0.16]} />
        {carbonMat}
      </mesh>
      <mesh castShadow position={[0.95, 0.74, 0.76]}>
        <boxGeometry args={[0.14, 0.09, 0.16]} />
        {carbonMat}
      </mesh>

      {/* Player indicator beacon */}
      {isPlayer && (
        <mesh position={[0, 2.0, 0]}>
          <coneGeometry args={[0.22, 0.6, 4]} />
          <meshStandardMaterial
            color="#00ff44"
            emissive="#00ff44"
            emissiveIntensity={1.0}
          />
        </mesh>
      )}
    </group>
  );
}
