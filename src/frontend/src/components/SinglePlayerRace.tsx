import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useForwardBackwardControls } from "../hooks/useForwardBackwardControls";
import { RaceHUDOverlay } from "./race/RaceHUDOverlay";
import {
  RealisticRoadCourseScene,
  buildTrackCurve,
} from "./race/RealisticRoadCourseScene";
import { RealisticSportsCoupeCar } from "./race/RealisticSportsCoupeCar";

const TOTAL_LAPS = 3;
const RACE_TIME_LIMIT = 120; // seconds
const NITRO_DURATION = 10; // seconds
const PIT_STOP_T = 0.08;
const PIT_COOLDOWN = 12; // seconds between pit stop triggers
const PIT_BOX_POSITION = new THREE.Vector3(-170, 0.1, -26);
const PIT_LERP_SPEED = 6; // units/sec approach speed multiplier

type PitPhase = "none" | "entering" | "parked" | "exiting";

interface RaceState {
  phase: "pre" | "countdown" | "racing" | "finished";
  lap: number;
  timeRemaining: number;
  finishTime: number | null;
  playerFinished: boolean;
}

interface CarState {
  position: THREE.Vector3;
  rotation: number;
  velocity: number;
  suspensionOffset: number;
}

// ─── Nitro Flame ──────────────────────────────────────────────────────────────
function NitroFlame({
  carStateRef,
  active,
}: {
  carStateRef: React.MutableRefObject<CarState>;
  active: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const car = carStateRef.current;
    const behind = new THREE.Vector3(
      car.position.x - Math.sin(car.rotation) * 1.8,
      car.position.y + 0.25,
      car.position.z - Math.cos(car.rotation) * 1.8,
    );
    meshRef.current.position.copy(behind);
    meshRef.current.rotation.y = car.rotation;
    const pulse = 1 + Math.sin(clock.elapsedTime * 20) * 0.3;
    meshRef.current.scale.set(pulse * 0.5, pulse * 1.2, pulse * 0.5);
    meshRef.current.visible = active;
  });

  return (
    <mesh ref={meshRef}>
      <coneGeometry args={[0.25, 1.2, 8]} />
      <meshStandardMaterial
        color="#ff6a00"
        emissive="#ff3300"
        emissiveIntensity={3}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
}

// ─── Pit Crew Glow ─────────────────────────────────────────────────────────────
function PitCrewGlow({
  carStateRef,
  pitPhaseRef,
}: {
  carStateRef: React.MutableRefObject<CarState>;
  pitPhaseRef: React.MutableRefObject<PitPhase>;
}) {
  const glowRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    if (!glowRef.current || !matRef.current) return;
    const phase = pitPhaseRef.current;
    const isParked = phase === "parked";
    glowRef.current.visible = isParked;
    if (isParked) {
      glowRef.current.position.set(
        carStateRef.current.position.x,
        carStateRef.current.position.y + 1,
        carStateRef.current.position.z,
      );
      matRef.current.emissiveIntensity =
        1.2 + Math.sin(clock.elapsedTime * 12) * 0.6;
    }
  });

  return (
    <mesh ref={glowRef} visible={false}>
      <boxGeometry args={[5, 2.5, 8]} />
      <meshStandardMaterial
        ref={matRef}
        color="#ff6600"
        emissive="#ff4400"
        emissiveIntensity={1.2}
        transparent
        opacity={0.28}
        depthWrite={false}
      />
    </mesh>
  );
}

// ─── Wheel Spin Indicator ─────────────────────────────────────────────────────
function WheelSpinIndicators({
  carStateRef,
  pitPhaseRef,
}: {
  carStateRef: React.MutableRefObject<CarState>;
  pitPhaseRef: React.MutableRefObject<PitPhase>;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const phase = pitPhaseRef.current;
    const isParked = phase === "parked";
    groupRef.current.visible = isParked;
    if (isParked) {
      const pos = carStateRef.current.position;
      groupRef.current.position.set(pos.x, pos.y, pos.z);
      // Rapidly spin child wheel rings
      groupRef.current.children.forEach((child, i) => {
        child.rotation.x = clock.elapsedTime * 20 * (i % 2 === 0 ? 1 : -1);
      });
    }
  });

  const wheelOffsets: [number, number, number][] = [
    [-1.2, 0.4, 1.5],
    [1.2, 0.4, 1.5],
    [-1.2, 0.4, -1.5],
    [1.2, 0.4, -1.5],
  ];

  return (
    <group ref={groupRef} visible={false}>
      {wheelOffsets.map((offset, _i) => (
        <mesh key={`wheel-${offset[0]}-${offset[2]}`} position={offset}>
          <torusGeometry args={[0.55, 0.08, 8, 20]} />
          <meshStandardMaterial
            color="#ffaa00"
            emissive="#ff8800"
            emissiveIntensity={2}
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Start/Finish Line ────────────────────────────────────────────────────────
function StartFinishLine() {
  const curve = buildTrackCurve();
  const point = curve.getPointAt(0);
  const tangent = curve.getTangentAt(0).normalize();
  const angle = Math.atan2(tangent.x, tangent.z);

  return (
    <mesh position={[point.x, 0.06, point.z]} rotation={[0, angle, 0]}>
      <boxGeometry args={[14, 0.05, 0.8]} />
      <meshStandardMaterial
        color="#00ff44"
        emissive="#00ff44"
        emissiveIntensity={2}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

// ─── Player Car Physics ───────────────────────────────────────────────────────
function PlayerCarPhysics({
  carStateRef,
  speedRef,
  racePhase,
  onLapComplete,
  nitroActiveRef,
  pitStopActiveRef,
  pitPhaseRef,
  pitEntryTRef,
  onPitStop,
  onPitParked,
  onPitExited,
}: {
  carStateRef: React.MutableRefObject<CarState>;
  speedRef: React.MutableRefObject<number>;
  racePhase: string;
  onLapComplete: () => void;
  nitroActiveRef: React.MutableRefObject<boolean>;
  pitStopActiveRef: React.MutableRefObject<boolean>;
  pitPhaseRef: React.MutableRefObject<PitPhase>;
  pitEntryTRef: React.MutableRefObject<number>;
  onPitStop: () => void;
  onPitParked: () => void;
  onPitExited: () => void;
}) {
  const controls = useForwardBackwardControls();
  const physicsRef = useRef({ t: 0, speed: 0 });
  const pitCooldownRef = useRef(0);
  const pitTransitionPosRef = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    if (racePhase !== "racing") return;

    const physics = physicsRef.current;
    const curve = buildTrackCurve();
    const dt = Math.min(delta, 0.05);
    const pitPhase = pitPhaseRef.current;

    // ── Pit Animation: Entering ──────────────────────────────────────────────
    if (pitPhase === "entering") {
      const current = carStateRef.current.position.clone();
      current.lerp(PIT_BOX_POSITION, dt * PIT_LERP_SPEED * 3);

      // Orient toward pit box
      const dir = PIT_BOX_POSITION.clone().sub(carStateRef.current.position);
      const rotation =
        dir.length() > 0.1
          ? Math.atan2(dir.x, dir.z)
          : carStateRef.current.rotation;

      carStateRef.current = {
        ...carStateRef.current,
        position: current,
        rotation,
        velocity: 60, // slow crawl speed display
        suspensionOffset: 0,
      };

      if (current.distanceTo(PIT_BOX_POSITION) < 1.2) {
        pitEntryTRef.current = physics.t;
        pitTransitionPosRef.current.copy(PIT_BOX_POSITION);
        carStateRef.current = {
          ...carStateRef.current,
          position: PIT_BOX_POSITION.clone(),
          velocity: 0,
        };
        onPitParked();
      }
      return;
    }

    // ── Pit Animation: Parked ─────────────────────────────────────────────────
    if (pitPhase === "parked") {
      carStateRef.current = {
        ...carStateRef.current,
        position: PIT_BOX_POSITION.clone(),
        velocity: 0,
        suspensionOffset: 0,
      };
      speedRef.current = 0;
      return;
    }

    // ── Pit Animation: Exiting ────────────────────────────────────────────────
    if (pitPhase === "exiting") {
      const reentryT = pitEntryTRef.current;
      const point = curve.getPointAt(reentryT);
      const targetPos = new THREE.Vector3(point.x, 0.15, point.z);
      const tangent = curve.getTangentAt(reentryT).normalize();
      const rotation = Math.atan2(tangent.x, tangent.z);

      const current = carStateRef.current.position.clone();
      current.lerp(targetPos, dt * PIT_LERP_SPEED * 2.5);

      carStateRef.current = {
        ...carStateRef.current,
        position: current,
        rotation,
        velocity: 80,
        suspensionOffset: 0,
      };
      speedRef.current = 80;

      if (current.distanceTo(targetPos) < 2.5) {
        // Snap to track and resume
        pitStopActiveRef.current = false;
        physics.speed = 0.0008; // give a gentle restart
        onPitExited();
      }
      return;
    }

    // ── Normal Racing Physics ─────────────────────────────────────────────────
    const baseMax = 0.0018;
    const maxSpeed = nitroActiveRef.current ? baseMax * 2 : baseMax;
    const accel = 0.0004;
    const brake = 0.0006;
    const friction = 0.0002;

    if (controls.forward) {
      physics.speed = Math.min(physics.speed + accel * dt * 60, maxSpeed);
    } else if (controls.backward) {
      physics.speed = Math.max(
        physics.speed - brake * dt * 60,
        -maxSpeed * 0.4,
      );
    } else {
      if (physics.speed > 0) {
        physics.speed = Math.max(physics.speed - friction * dt * 60, 0);
      } else {
        physics.speed = Math.min(physics.speed + friction * dt * 60, 0);
      }
    }

    const prevT = physics.t;
    physics.t = (physics.t + physics.speed) % 1;
    if (physics.t < 0) physics.t += 1;

    // Lap complete: crossing t=0 going forward
    if (prevT > 0.95 && physics.t < 0.05) {
      onLapComplete();
    }

    // Pit stop trigger at t≈0.08 with cooldown
    pitCooldownRef.current = Math.max(0, pitCooldownRef.current - delta);
    if (
      pitCooldownRef.current <= 0 &&
      prevT < PIT_STOP_T &&
      physics.t >= PIT_STOP_T
    ) {
      pitCooldownRef.current = PIT_COOLDOWN;
      onPitStop();
    }

    const point = curve.getPointAt(physics.t);
    const tangent = curve.getTangentAt(physics.t).normalize();
    const rotation = Math.atan2(tangent.x, tangent.z);
    const speedKmh = Math.abs(physics.speed) * 60000;
    const suspensionOffset =
      Math.sin(state.clock.elapsedTime * 15 + point.x) *
      0.02 *
      (speedKmh / 100);

    carStateRef.current = {
      position: new THREE.Vector3(point.x, 0.15, point.z),
      rotation,
      velocity: speedKmh,
      suspensionOffset,
    };

    speedRef.current = speedKmh;
  });

  return null;
}

// ─── AI Car Physics ───────────────────────────────────────────────────────────
function AICarPhysics({
  carStateRef,
  racePhase,
}: {
  carStateRef: React.MutableRefObject<CarState>;
  racePhase: string;
}) {
  const physicsRef = useRef({ t: 0.025, speed: 0.0014 });

  useFrame((state, delta) => {
    if (racePhase !== "racing") return;
    const physics = physicsRef.current;
    const curve = buildTrackCurve();

    const dt = Math.min(delta, 0.05);
    physics.t = (physics.t + physics.speed * dt * 60) % 1;
    if (physics.t < 0) physics.t += 1;

    const point = curve.getPointAt(physics.t);
    const tangent = curve.getTangentAt(physics.t).normalize();
    const rotation = Math.atan2(tangent.x, tangent.z);
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(tangent, up).normalize();
    const pos = new THREE.Vector3(point.x, 0.15, point.z).add(
      right.multiplyScalar(1.5),
    );
    const suspensionOffset = Math.sin(state.clock.elapsedTime * 12) * 0.015;

    carStateRef.current = {
      position: pos,
      rotation,
      velocity: physics.speed * 60000,
      suspensionOffset,
    };
  });

  return null;
}

// ─── Imperative Car Mesh ──────────────────────────────────────────────────────
function ImperativeCarMesh({
  carStateRef,
  isPlayer,
}: {
  carStateRef: React.MutableRefObject<CarState>;
  isPlayer: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    const car = carStateRef.current;
    groupRef.current.position.set(
      car.position.x,
      car.position.y + car.suspensionOffset,
      car.position.z,
    );
    groupRef.current.rotation.set(0, car.rotation, 0);
  });

  return (
    <group ref={groupRef}>
      <RealisticSportsCoupeCar
        position={new THREE.Vector3(0, 0, 0)}
        rotation={0}
        velocity={carStateRef.current.velocity}
        suspensionOffset={0}
        isPlayer={isPlayer}
      />
    </group>
  );
}

// ─── Chase Camera ─────────────────────────────────────────────────────────────
function ChaseCamera({
  targetRef,
  active,
}: {
  targetRef: React.MutableRefObject<CarState>;
  active: boolean;
}) {
  const { camera } = useThree();
  const camPosRef = useRef(new THREE.Vector3(0, 10, 20));

  useFrame(() => {
    if (!active) return;
    const car = targetRef.current;
    const behind = new THREE.Vector3(
      car.position.x - Math.sin(car.rotation) * 12,
      car.position.y + 6,
      car.position.z - Math.cos(car.rotation) * 12,
    );
    camPosRef.current.lerp(behind, 0.08);
    camera.position.copy(camPosRef.current);
    camera.lookAt(car.position);
  });

  return null;
}

// ─── Cockpit Camera ───────────────────────────────────────────────────────────
function CockpitCamera({
  targetRef,
  active,
}: {
  targetRef: React.MutableRefObject<CarState>;
  active: boolean;
}) {
  const { camera } = useThree();

  useFrame(() => {
    if (!active) return;
    const car = targetRef.current;
    const eyeHeight = 0.85;
    const forwardOffset = 0.5;
    const eyePos = new THREE.Vector3(
      car.position.x + Math.sin(car.rotation) * forwardOffset,
      car.position.y + eyeHeight,
      car.position.z + Math.cos(car.rotation) * forwardOffset,
    );
    camera.position.copy(eyePos);
    const lookTarget = new THREE.Vector3(
      eyePos.x + Math.sin(car.rotation) * 20,
      eyePos.y - 0.1,
      eyePos.z + Math.cos(car.rotation) * 20,
    );
    camera.lookAt(lookTarget);
  });

  return null;
}

// ─── Scene ────────────────────────────────────────────────────────────────────
function Scene({
  playerCarRef,
  aiCarRef,
  speedRef,
  racePhase,
  onLapComplete,
  cockpitMode,
  nitroActiveRef,
  pitStopActiveRef,
  pitPhaseRef,
  pitEntryTRef,
  onPitStop,
  onPitParked,
  onPitExited,
}: {
  playerCarRef: React.MutableRefObject<CarState>;
  aiCarRef: React.MutableRefObject<CarState>;
  speedRef: React.MutableRefObject<number>;
  racePhase: string;
  onLapComplete: () => void;
  cockpitMode: boolean;
  nitroActiveRef: React.MutableRefObject<boolean>;
  pitStopActiveRef: React.MutableRefObject<boolean>;
  pitPhaseRef: React.MutableRefObject<PitPhase>;
  pitEntryTRef: React.MutableRefObject<number>;
  onPitStop: () => void;
  onPitParked: () => void;
  onPitExited: () => void;
}) {
  return (
    <>
      <color attach="background" args={["#87CEEB"]} />
      <fog attach="fog" args={["#87CEEB", 80, 800]} />
      <ambientLight intensity={0.8} />
      <directionalLight
        position={[50, 120, 60]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={600}
        shadow-camera-left={-300}
        shadow-camera-right={300}
        shadow-camera-top={300}
        shadow-camera-bottom={-300}
      />
      <hemisphereLight args={["#87CEEB", "#654321", 0.6]} />

      <RealisticRoadCourseScene weather="sunny" />
      <StartFinishLine />

      <ImperativeCarMesh carStateRef={playerCarRef} isPlayer />
      <ImperativeCarMesh carStateRef={aiCarRef} isPlayer={false} />

      {/* Pit stop visual effects */}
      <PitCrewGlow carStateRef={playerCarRef} pitPhaseRef={pitPhaseRef} />
      <WheelSpinIndicators
        carStateRef={playerCarRef}
        pitPhaseRef={pitPhaseRef}
      />

      <NitroFlame carStateRef={playerCarRef} active={nitroActiveRef.current} />

      <PlayerCarPhysics
        carStateRef={playerCarRef}
        speedRef={speedRef}
        racePhase={racePhase}
        onLapComplete={onLapComplete}
        nitroActiveRef={nitroActiveRef}
        pitStopActiveRef={pitStopActiveRef}
        pitPhaseRef={pitPhaseRef}
        pitEntryTRef={pitEntryTRef}
        onPitStop={onPitStop}
        onPitParked={onPitParked}
        onPitExited={onPitExited}
      />

      <AICarPhysics carStateRef={aiCarRef} racePhase={racePhase} />

      <ChaseCamera
        targetRef={playerCarRef}
        active={racePhase === "racing" && !cockpitMode}
      />
      <CockpitCamera
        targetRef={playerCarRef}
        active={racePhase === "racing" && cockpitMode}
      />
    </>
  );
}

// ─── Cockpit Overlay ──────────────────────────────────────────────────────────
function CockpitOverlay({
  speed,
  steeringAngle,
}: { speed: number; steeringAngle: number }) {
  const gear =
    speed < 40
      ? 1
      : speed < 80
        ? 2
        : speed < 120
          ? 3
          : speed < 160
            ? 4
            : speed < 200
              ? 5
              : 6;
  const rpm = Math.min(100, (speed / 260) * 100);

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.85) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "18%",
          height: "100%",
          background:
            "linear-gradient(to right, rgba(0,0,0,0.95) 0%, rgba(10,10,10,0.7) 60%, transparent 100%)",
          borderRight: "1px solid rgba(60,60,60,0.3)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "18%",
          height: "100%",
          background:
            "linear-gradient(to left, rgba(0,0,0,0.95) 0%, rgba(10,10,10,0.7) 60%, transparent 100%)",
          borderLeft: "1px solid rgba(60,60,60,0.3)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "20%",
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "5%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "38%",
          height: "52px",
          background:
            "linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 40%, #111 100%)",
          borderRadius: "0 0 28px 28px",
          boxShadow:
            "0 6px 24px rgba(0,0,0,0.8), inset 0 -2px 8px rgba(255,255,255,0.05)",
          border: "1px solid rgba(80,80,80,0.4)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "14px",
          height: "10%",
          background: "linear-gradient(180deg, #222 0%, #333 100%)",
          boxShadow: "0 0 12px rgba(0,0,0,0.9)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-8%",
          left: "50%",
          transform: `translateX(-50%) rotate(${steeringAngle}deg)`,
          width: "300px",
          height: "300px",
          transition: "transform 0.1s ease-out",
        }}
      >
        <svg
          viewBox="0 0 300 300"
          width="300"
          height="300"
          aria-label="F1 steering wheel"
          role="img"
        >
          <rect
            x="20"
            y="60"
            width="260"
            height="200"
            rx="40"
            ry="40"
            fill="#1a1a1a"
            stroke="#444"
            strokeWidth="3"
          />
          <rect
            x="20"
            y="60"
            width="260"
            height="200"
            rx="40"
            ry="40"
            fill="url(#carbonPattern)"
            opacity="0.3"
          />
          <defs>
            <pattern
              id="carbonPattern"
              x="0"
              y="0"
              width="8"
              height="8"
              patternUnits="userSpaceOnUse"
            >
              <rect width="4" height="4" fill="rgba(255,255,255,0.06)" />
              <rect
                x="4"
                y="4"
                width="4"
                height="4"
                fill="rgba(255,255,255,0.06)"
              />
            </pattern>
          </defs>
          <rect
            x="22"
            y="62"
            width="256"
            height="196"
            rx="39"
            ry="39"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1.5"
          />
          <rect
            x="14"
            y="110"
            width="42"
            height="80"
            rx="12"
            fill="#252525"
            stroke="#555"
            strokeWidth="1.5"
          />
          <rect x="18" y="118" width="34" height="64" rx="9" fill="#1e1e1e" />
          <rect
            x="244"
            y="110"
            width="42"
            height="80"
            rx="12"
            fill="#252525"
            stroke="#555"
            strokeWidth="1.5"
          />
          <rect x="248" y="118" width="34" height="64" rx="9" fill="#1e1e1e" />
          <rect
            x="80"
            y="100"
            width="140"
            height="100"
            rx="8"
            fill="#0a0a0a"
            stroke="#333"
            strokeWidth="2"
          />
          <text
            x="150"
            y="132"
            textAnchor="middle"
            fill="#00ff88"
            fontSize="22"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {Math.round(speed)}
          </text>
          <text
            x="150"
            y="148"
            textAnchor="middle"
            fill="#555"
            fontSize="9"
            fontFamily="monospace"
            letterSpacing="2"
          >
            KM/H
          </text>
          <text
            x="150"
            y="178"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="28"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {gear}
          </text>
          <text
            x="150"
            y="193"
            textAnchor="middle"
            fill="#444"
            fontSize="8"
            fontFamily="monospace"
            letterSpacing="2"
          >
            GEAR
          </text>
          <rect x="85" y="197" width="130" height="5" rx="2" fill="#1a1a1a" />
          <rect
            x="85"
            y="197"
            width={(130 * rpm) / 100}
            height="5"
            rx="2"
            fill={rpm > 85 ? "#ff3333" : rpm > 65 ? "#ffaa00" : "#00cc44"}
          />
          <circle
            cx="55"
            cy="105"
            r="10"
            fill="#1155cc"
            stroke="#3377ff"
            strokeWidth="1.5"
          />
          <circle
            cx="75"
            cy="95"
            r="10"
            fill="#cc1111"
            stroke="#ff3333"
            strokeWidth="1.5"
          />
          <circle
            cx="55"
            cy="130"
            r="8"
            fill="#ccaa00"
            stroke="#ffcc00"
            strokeWidth="1.5"
          />
          <circle
            cx="72"
            cy="120"
            r="8"
            fill="#116611"
            stroke="#22cc22"
            strokeWidth="1.5"
          />
          <circle
            cx="245"
            cy="105"
            r="10"
            fill="#cc1111"
            stroke="#ff3333"
            strokeWidth="1.5"
          />
          <circle
            cx="225"
            cy="95"
            r="10"
            fill="#1155cc"
            stroke="#3377ff"
            strokeWidth="1.5"
          />
          <circle
            cx="245"
            cy="130"
            r="8"
            fill="#116611"
            stroke="#22cc22"
            strokeWidth="1.5"
          />
          <circle
            cx="228"
            cy="120"
            r="8"
            fill="#cc8800"
            stroke="#ffaa00"
            strokeWidth="1.5"
          />
          <rect
            x="125"
            y="68"
            width="50"
            height="18"
            rx="5"
            fill="#cc4400"
            stroke="#ff6622"
            strokeWidth="1.5"
          />
          <text
            x="150"
            y="81"
            textAnchor="middle"
            fill="white"
            fontSize="8"
            fontFamily="monospace"
            fontWeight="bold"
          >
            DRS
          </text>
          <rect
            x="60"
            y="220"
            width="55"
            height="32"
            rx="10"
            fill="#2a2a2a"
            stroke="#444"
            strokeWidth="1"
          />
          <rect
            x="185"
            y="220"
            width="55"
            height="32"
            rx="10"
            fill="#2a2a2a"
            stroke="#444"
            strokeWidth="1"
          />
        </svg>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: "18%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "340px",
          height: "3px",
          background:
            "linear-gradient(to right, transparent, rgba(0,200,100,0.6), transparent)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "2%",
          left: "50%",
          transform: "translateX(-50%)",
          color: "rgba(255,255,255,0.4)",
          fontSize: "11px",
          fontFamily: "monospace",
          letterSpacing: "1px",
          whiteSpace: "nowrap",
        }}
      >
        F5 / C · TOGGLE CAMERA
      </div>
    </div>
  );
}

// ─── Camera Mode Toast ────────────────────────────────────────────────────────
function CameraModeToast({
  label,
  visible,
}: { label: string; visible: boolean }) {
  return (
    <div
      style={{
        position: "absolute",
        top: "40%",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 30,
        pointerEvents: "none",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.4s ease",
        background: "rgba(0,0,0,0.75)",
        border: "1px solid rgba(255,255,255,0.2)",
        borderRadius: "8px",
        padding: "10px 28px",
        color: "white",
        fontFamily: "monospace",
        fontSize: "16px",
        letterSpacing: "3px",
        fontWeight: "bold",
        whiteSpace: "nowrap",
        backdropFilter: "blur(8px)",
      }}
    >
      {label}
    </div>
  );
}

// ─── Countdown Overlay ────────────────────────────────────────────────────────
function CountdownOverlay({ value }: { value: string }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.65)",
        pointerEvents: "none",
      }}
    >
      <span
        style={{
          fontSize: value === "GO!" ? 110 : 140,
          fontWeight: 900,
          color: value === "GO!" ? "#00ff88" : "#ffffff",
          fontFamily: "monospace",
          letterSpacing: value === "GO!" ? 8 : 0,
          textShadow:
            value === "GO!"
              ? "0 0 60px rgba(0,255,136,0.9), 0 0 120px rgba(0,255,136,0.5)"
              : "0 0 60px rgba(255,255,255,0.7)",
          userSelect: "none",
          lineHeight: 1,
          animation: "countPop 0.25s ease-out",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Pit Stop Overlay ─────────────────────────────────────────────────────────
function PitStopOverlay({
  secondsLeft,
  phase,
}: {
  secondsLeft: number;
  phase: PitPhase;
}) {
  const label =
    phase === "entering"
      ? "🏎️  ENTERING PIT LANE…"
      : phase === "parked"
        ? `🔧  PIT STOP — Tire Change — ${secondsLeft}s`
        : phase === "exiting"
          ? "🏎️  EXITING PIT LANE…"
          : "";

  const accentColor = phase === "parked" ? "#ffcc00" : "rgba(255,255,255,0.85)";
  const borderColor =
    phase === "parked" ? "rgba(255,160,0,0.7)" : "rgba(255,255,255,0.25)";

  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 40,
        background: "rgba(10,8,0,0.9)",
        border: `1px solid ${borderColor}`,
        borderRadius: 10,
        padding: "10px 28px",
        color: accentColor,
        fontFamily: "monospace",
        fontWeight: "bold",
        fontSize: 20,
        letterSpacing: 2,
        backdropFilter: "blur(8px)",
        boxShadow:
          phase === "parked"
            ? "0 0 32px rgba(255,140,0,0.5)"
            : "0 0 16px rgba(255,255,255,0.15)",
        whiteSpace: "nowrap",
        pointerEvents: "none",
        transition: "all 0.3s ease",
      }}
    >
      {label}
    </div>
  );
}

function getInitialCarState(tOffset = 0): CarState {
  const curve = buildTrackCurve();
  const point = curve.getPointAt(tOffset);
  const tangent = curve.getTangentAt(tOffset).normalize();
  return {
    position: new THREE.Vector3(point.x, 0.15, point.z),
    rotation: Math.atan2(tangent.x, tangent.z),
    velocity: 0,
    suspensionOffset: 0,
  };
}

function speak(text: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.9;
  utter.volume = 1;
  window.speechSynthesis.speak(utter);
}

export default function SinglePlayerRace({ onBack }: { onBack?: () => void }) {
  const [raceState, setRaceState] = useState<RaceState>({
    phase: "pre",
    lap: 1,
    timeRemaining: RACE_TIME_LIMIT,
    finishTime: null,
    playerFinished: false,
  });

  const [hudSpeed, setHudSpeed] = useState(0);
  const speedRef = useRef(0);

  // Cockpit mode toggle
  const [cockpitMode, setCockpitMode] = useState(false);
  const cockpitModeRef = useRef(false);

  // Toast for camera mode switch
  const [toastVisible, setToastVisible] = useState(false);
  const [toastLabel, setToastLabel] = useState("COCKPIT VIEW");
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Steering angle for wheel animation
  const steeringAngleRef = useRef(0);
  const [steeringAngle, setSteeringAngle] = useState(0);
  const lastRotationRef = useRef(0);

  // Countdown
  const [countdownValue, setCountdownValue] = useState<string | null>(null);

  // Nitro
  const [nitroCharges, setNitroCharges] = useState(0);
  const [nitroActive, setNitroActive] = useState(false);
  const [nitroBurnRemaining, setNitroBurnRemaining] = useState(0);
  const [nitroUnlocked, setNitroUnlocked] = useState(() => {
    return localStorage.getItem("nitroUnlocked") === "true";
  });
  const nitroActiveRef = useRef(false);
  const nitroTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nitroChargesRef = useRef(0);

  // Pit stop
  const [pitStopActive, setPitStopActive] = useState(false);
  const [pitStopSeconds, setPitStopSeconds] = useState(0);
  const [pitPhase, setPitPhase] = useState<PitPhase>("none");
  const pitStopActiveRef = useRef(false);
  const pitPhaseRef = useRef<PitPhase>("none");
  const pitEntryTRef = useRef(0);
  const pitTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const playerCarRef = useRef<CarState>(getInitialCarState(0));
  const aiCarRef = useRef<CarState>(getInitialCarState(0.025));

  const raceStartTimeRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hudIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Toggle camera helper
  const toggleCamera = useCallback(() => {
    cockpitModeRef.current = !cockpitModeRef.current;
    const nowCockpit = cockpitModeRef.current;
    setCockpitMode(nowCockpit);
    const label = nowCockpit ? "COCKPIT VIEW" : "CHASE CAM";
    setToastLabel(label);
    setToastVisible(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastVisible(false), 1500);
  }, []);

  // F5 / C key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F5") {
        e.preventDefault();
        toggleCamera();
        return;
      }
      if (e.key === "c" || e.key === "C") {
        toggleCamera();
        return;
      }
      // Nitro: F or Space
      if ((e.key === "f" || e.key === "F" || e.key === " ") && nitroUnlocked) {
        e.preventDefault();
        if (nitroActiveRef.current) return;
        if (nitroChargesRef.current <= 0) return;
        nitroChargesRef.current -= 1;
        setNitroCharges(nitroChargesRef.current);
        nitroActiveRef.current = true;
        setNitroActive(true);
        setNitroBurnRemaining(NITRO_DURATION);

        let remaining = NITRO_DURATION;
        if (nitroTimerRef.current) clearInterval(nitroTimerRef.current);
        nitroTimerRef.current = setInterval(() => {
          remaining -= 0.1;
          setNitroBurnRemaining(Math.max(0, remaining));
          if (remaining <= 0) {
            if (nitroTimerRef.current) clearInterval(nitroTimerRef.current);
            nitroActiveRef.current = false;
            setNitroActive(false);
            setNitroBurnRemaining(0);
          }
        }, 100);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleCamera, nitroUnlocked]);

  // Poll steering angle for cockpit wheel animation
  useEffect(() => {
    if (!cockpitMode) return;
    const id = setInterval(() => {
      const rot = playerCarRef.current.rotation;
      const delta = rot - lastRotationRef.current;
      if (Math.abs(delta) < 0.5) {
        steeringAngleRef.current += delta * 300;
        steeringAngleRef.current *= 0.85;
        steeringAngleRef.current = Math.max(
          -45,
          Math.min(45, steeringAngleRef.current),
        );
        setSteeringAngle(steeringAngleRef.current);
      }
      lastRotationRef.current = rot;
    }, 50);
    return () => clearInterval(id);
  }, [cockpitMode]);

  const beginRace = useCallback(() => {
    playerCarRef.current = getInitialCarState(0);
    aiCarRef.current = getInitialCarState(0.025);
    speedRef.current = 0;
    raceStartTimeRef.current = Date.now();
    setRaceState({
      phase: "racing",
      lap: 1,
      timeRemaining: RACE_TIME_LIMIT,
      finishTime: null,
      playerFinished: false,
    });
  }, []);

  const startCountdown = useCallback(() => {
    setRaceState((prev) => ({ ...prev, phase: "countdown" }));
    const steps: [string, number][] = [
      ["3", 0],
      ["2", 1000],
      ["1", 2000],
      ["GO!", 3000],
    ];
    for (const [val, delay] of steps) {
      setTimeout(() => {
        setCountdownValue(val);
        speak(val === "GO!" ? "Go!" : val);
      }, delay);
    }
    setTimeout(() => {
      setCountdownValue(null);
      beginRace();
    }, 3800);
  }, [beginRace]);

  // Called when car enters pit zone — start animation toward pit box
  const handlePitStop = useCallback(() => {
    pitPhaseRef.current = "entering";
    setPitPhase("entering");
    pitStopActiveRef.current = true;
    setPitStopActive(true);
    setPitStopSeconds(0);
  }, []);

  // Called by PlayerCarPhysics when car reaches pit box
  const handlePitParked = useCallback(() => {
    const duration = Math.floor(Math.random() * 7) + 2; // 2-8 seconds
    pitPhaseRef.current = "parked";
    setPitPhase("parked");
    setPitStopSeconds(duration);

    let remaining = duration;
    if (pitTimerRef.current) clearInterval(pitTimerRef.current);
    pitTimerRef.current = setInterval(() => {
      remaining -= 1;
      setPitStopSeconds(remaining);
      if (remaining <= 0) {
        if (pitTimerRef.current) clearInterval(pitTimerRef.current);
        pitPhaseRef.current = "exiting";
        setPitPhase("exiting");
      }
    }, 1000);
  }, []);

  // Called by PlayerCarPhysics when car rejoins the track
  const handlePitExited = useCallback(() => {
    pitPhaseRef.current = "none";
    setPitPhase("none");
    setPitStopActive(false);
    setPitStopSeconds(0);
  }, []);

  useEffect(() => {
    if (raceState.phase !== "racing") {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (hudIntervalRef.current) {
        clearInterval(hudIntervalRef.current);
        hudIntervalRef.current = null;
      }
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      if (!raceStartTimeRef.current) return;
      const elapsed = (Date.now() - raceStartTimeRef.current) / 1000;
      const remaining = Math.max(0, RACE_TIME_LIMIT - elapsed);

      setRaceState((prev) => {
        if (prev.phase !== "racing") return prev;
        if (remaining <= 0) {
          return {
            ...prev,
            phase: "finished",
            timeRemaining: 0,
            finishTime: RACE_TIME_LIMIT,
          };
        }
        return { ...prev, timeRemaining: remaining };
      });
    }, 250);

    hudIntervalRef.current = setInterval(() => {
      setHudSpeed(Math.round(speedRef.current));
    }, 200);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (hudIntervalRef.current) {
        clearInterval(hudIntervalRef.current);
        hudIntervalRef.current = null;
      }
    };
  }, [raceState.phase]);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (hudIntervalRef.current) clearInterval(hudIntervalRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (nitroTimerRef.current) clearInterval(nitroTimerRef.current);
      if (pitTimerRef.current) clearInterval(pitTimerRef.current);
    };
  }, []);

  const handleLapComplete = useCallback(() => {
    setRaceState((prev) => {
      if (prev.phase !== "racing") return prev;
      const newLap = prev.lap + 1;
      if (newLap > TOTAL_LAPS) {
        const elapsed = raceStartTimeRef.current
          ? (Date.now() - raceStartTimeRef.current) / 1000
          : RACE_TIME_LIMIT;
        localStorage.setItem("nitroUnlocked", "true");
        setNitroUnlocked(true);
        return {
          ...prev,
          phase: "finished",
          lap: TOTAL_LAPS,
          playerFinished: true,
          finishTime: elapsed,
        };
      }
      nitroChargesRef.current += 1;
      setNitroCharges(nitroChargesRef.current);
      return { ...prev, lap: newLap };
    });
  }, []);

  const canvasFilter = nitroActive ? "blur(1.5px) brightness(1.3)" : "none";

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Countdown pop animation */}
      <style>{`
        @keyframes countPop {
          from { transform: scale(1.4); opacity: 0.5; }
          to   { transform: scale(1);   opacity: 1; }
        }
      `}</style>

      {/* Pre-race screen */}
      {raceState.phase === "pre" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
          <div className="text-6xl mb-4">🏁</div>
          <h1 className="text-5xl font-bold text-white mb-4 tracking-widest">
            SINGLE PLAYER RACE
          </h1>
          <p className="text-xl text-gray-300 mb-2">
            {TOTAL_LAPS} Laps · {RACE_TIME_LIMIT}s Time Limit
          </p>
          <div className="text-gray-400 mb-2 text-center">
            <span>
              Use{" "}
              <kbd className="bg-gray-700 px-2 py-1 rounded text-white font-mono">
                W
              </kbd>{" "}
              to accelerate,{" "}
              <kbd className="bg-gray-700 px-2 py-1 rounded text-white font-mono">
                S
              </kbd>{" "}
              to brake
            </span>
          </div>
          <p className="text-gray-500 mb-2 text-sm">
            Press{" "}
            <kbd className="bg-gray-700 px-2 py-1 rounded text-white font-mono text-xs">
              F5
            </kbd>{" "}
            or{" "}
            <kbd className="bg-gray-700 px-2 py-1 rounded text-white font-mono text-xs">
              C
            </kbd>{" "}
            during race to toggle cockpit view
          </p>
          <p className="text-gray-500 mb-8 text-sm">
            Press{" "}
            <kbd className="bg-gray-700 px-2 py-1 rounded text-white font-mono text-xs">
              F
            </kbd>{" "}
            or{" "}
            <kbd className="bg-gray-700 px-2 py-1 rounded text-white font-mono text-xs">
              SPACE
            </kbd>{" "}
            for Nitro Boost (unlocked after first race)
          </p>
          <button
            type="button"
            data-ocid="race.primary_button"
            onClick={startCountdown}
            className="px-10 py-4 bg-purple-600 hover:bg-purple-500 text-white text-2xl font-bold rounded-lg transition-colors"
          >
            START RACE
          </button>
          {onBack && (
            <button
              type="button"
              data-ocid="race.secondary_button"
              onClick={onBack}
              className="mt-4 px-6 py-2 text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Menu
            </button>
          )}
        </div>
      )}

      {/* Finish screen */}
      {raceState.phase === "finished" && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
          <div className="text-6xl mb-4">
            {raceState.playerFinished ? "🏆" : "⏱"}
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            {raceState.playerFinished ? "RACE COMPLETE!" : "TIME UP!"}
          </h1>
          {raceState.finishTime !== null && (
            <p className="text-2xl text-yellow-400 mb-2">
              Time: {raceState.finishTime.toFixed(2)}s
            </p>
          )}
          <p className="text-xl text-gray-300 mb-8">
            Laps completed: {Math.min(raceState.lap, TOTAL_LAPS)} / {TOTAL_LAPS}
          </p>
          <button
            type="button"
            data-ocid="race.primary_button"
            onClick={startCountdown}
            className="px-10 py-4 bg-purple-600 hover:bg-purple-500 text-white text-2xl font-bold rounded-lg transition-colors mb-4"
          >
            RACE AGAIN
          </button>
          {onBack && (
            <button
              type="button"
              data-ocid="race.secondary_button"
              onClick={onBack}
              className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Menu
            </button>
          )}
        </div>
      )}

      {/* Countdown overlay */}
      {countdownValue && <CountdownOverlay value={countdownValue} />}

      {/* Pit stop overlay — shown for all active pit phases */}
      {pitStopActive && raceState.phase === "racing" && pitPhase !== "none" && (
        <PitStopOverlay secondsLeft={pitStopSeconds} phase={pitPhase} />
      )}

      {/* HUD */}
      {raceState.phase === "racing" && (
        <RaceHUDOverlay
          currentLap={raceState.lap}
          totalLaps={TOTAL_LAPS}
          speed={hudSpeed}
          nitroCharges={nitroCharges}
          nitroActive={nitroActive}
          nitroBurnRemaining={nitroBurnRemaining}
          nitroUnlocked={nitroUnlocked}
        />
      )}

      {/* Timer overlay */}
      {raceState.phase === "racing" && (
        <div className="pointer-events-none absolute top-6 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-black/70 px-4 py-2 rounded-lg text-white font-bold text-lg backdrop-blur-sm">
            ⏱ {Math.ceil(raceState.timeRemaining)}s
          </div>
        </div>
      )}

      {/* Cockpit overlay */}
      {raceState.phase === "racing" && cockpitMode && (
        <CockpitOverlay speed={hudSpeed} steeringAngle={steeringAngle} />
      )}

      {/* Camera mode toast */}
      <CameraModeToast label={toastLabel} visible={toastVisible} />

      {/* 3D Canvas */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          filter: canvasFilter,
          transition: "filter 0.2s",
        }}
      >
        <Canvas
          shadows
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            outputColorSpace: THREE.SRGBColorSpace,
          }}
          camera={{ fov: 65, near: 0.1, far: 1200, position: [0, 10, 20] }}
          style={{ width: "100%", height: "100%" }}
        >
          <Scene
            playerCarRef={playerCarRef}
            aiCarRef={aiCarRef}
            speedRef={speedRef}
            racePhase={raceState.phase}
            onLapComplete={handleLapComplete}
            cockpitMode={cockpitMode}
            nitroActiveRef={nitroActiveRef}
            pitStopActiveRef={pitStopActiveRef}
            pitPhaseRef={pitPhaseRef}
            pitEntryTRef={pitEntryTRef}
            onPitStop={handlePitStop}
            onPitParked={handlePitParked}
            onPitExited={handlePitExited}
          />
        </Canvas>
      </div>
    </div>
  );
}
