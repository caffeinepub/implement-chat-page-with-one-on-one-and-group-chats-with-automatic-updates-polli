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

interface RaceState {
  phase: "pre" | "racing" | "finished";
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

// ─── Player Car Physics ───────────────────────────────────────────────────────
// Only writes to carStateRef (no setState = no re-render every frame)
function PlayerCarPhysics({
  carStateRef,
  speedRef,
  racePhase,
  onLapComplete,
}: {
  carStateRef: React.MutableRefObject<CarState>;
  speedRef: React.MutableRefObject<number>;
  racePhase: string;
  onLapComplete: () => void;
}) {
  const controls = useForwardBackwardControls();
  const physicsRef = useRef({ t: 0, speed: 0 });

  useFrame((state, delta) => {
    if (racePhase !== "racing") return;
    const physics = physicsRef.current;
    const curve = buildTrackCurve();

    const dt = Math.min(delta, 0.05);
    const maxSpeed = 0.0018;
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

    if (prevT > 0.95 && physics.t < 0.05) {
      onLapComplete();
    }

    const point = curve.getPointAt(physics.t);
    const tangent = curve.getTangentAt(physics.t).normalize();
    const rotation = Math.atan2(tangent.x, tangent.z);
    const speedKmh = Math.abs(physics.speed) * 60000;
    const suspensionOffset =
      Math.sin(state.clock.elapsedTime * 15 + point.x) *
      0.02 *
      (speedKmh / 100);

    // Write to ref only — no setState, no re-render
    carStateRef.current = {
      position: new THREE.Vector3(point.x, 0.15, point.z),
      rotation,
      velocity: speedKmh,
      suspensionOffset,
    };

    // Update speed ref for HUD polling
    speedRef.current = speedKmh;
  });

  return null;
}

// ─── AI Car Physics ───────────────────────────────────────────────────────────
// Only writes to aiCarRef (no setState = no re-render every frame)
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

    // Write to ref only — no setState, no re-render
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
// Reads carStateRef every frame and updates the Three.js group directly.
// This never causes a React re-render.
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
      {/* Pass zeroed-out values — the group ref handles positioning imperatively */}
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

// ─── Scene ────────────────────────────────────────────────────────────────────
function Scene({
  playerCarRef,
  aiCarRef,
  speedRef,
  racePhase,
  onLapComplete,
}: {
  playerCarRef: React.MutableRefObject<CarState>;
  aiCarRef: React.MutableRefObject<CarState>;
  speedRef: React.MutableRefObject<number>;
  racePhase: string;
  onLapComplete: () => void;
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

      {/* Imperative car meshes — read from refs, never re-render via state */}
      <ImperativeCarMesh carStateRef={playerCarRef} isPlayer />
      <ImperativeCarMesh carStateRef={aiCarRef} isPlayer={false} />

      {/* Physics updaters — only touch refs, not state */}
      <PlayerCarPhysics
        carStateRef={playerCarRef}
        speedRef={speedRef}
        racePhase={racePhase}
        onLapComplete={onLapComplete}
      />

      <AICarPhysics carStateRef={aiCarRef} racePhase={racePhase} />

      <ChaseCamera targetRef={playerCarRef} active={racePhase === "racing"} />
    </>
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

export default function SinglePlayerRace({ onBack }: { onBack?: () => void }) {
  const [raceState, setRaceState] = useState<RaceState>({
    phase: "pre",
    lap: 1,
    timeRemaining: RACE_TIME_LIMIT,
    finishTime: null,
    playerFinished: false,
  });

  // HUD speed — polled at 200ms intervals, not every frame
  const [hudSpeed, setHudSpeed] = useState(0);
  const speedRef = useRef(0);

  // Car state lives entirely in refs — no React state for 3D positions
  const playerCarRef = useRef<CarState>(getInitialCarState(0));
  const aiCarRef = useRef<CarState>(getInitialCarState(0.025));

  const raceStartTimeRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hudIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRace = useCallback(() => {
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

  // Wall-clock timer — 250ms polling, calculates from Date.now()
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

    // Poll speedRef for HUD display at 200ms — far cheaper than per-frame setState
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
        return {
          ...prev,
          phase: "finished",
          lap: TOTAL_LAPS,
          playerFinished: true,
          finishTime: elapsed,
        };
      }
      return { ...prev, lap: newLap };
    });
  }, []);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
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
          <p className="text-gray-400 mb-8">
            Use{" "}
            <kbd className="bg-gray-700 px-2 py-1 rounded text-white font-mono">
              W
            </kbd>{" "}
            to accelerate,{" "}
            <kbd className="bg-gray-700 px-2 py-1 rounded text-white font-mono">
              S
            </kbd>{" "}
            to brake
          </p>
          <button
            type="button"
            data-ocid="race.primary_button"
            onClick={startRace}
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
            onClick={startRace}
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

      {/* HUD — speed from polled ref, not per-frame state */}
      {raceState.phase === "racing" && (
        <RaceHUDOverlay
          currentLap={raceState.lap}
          totalLaps={TOTAL_LAPS}
          speed={hudSpeed}
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

      {/* 3D Canvas */}
      <Canvas
        shadows
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        camera={{ fov: 65, near: 0.1, far: 1200, position: [0, 10, 20] }}
      >
        <Scene
          playerCarRef={playerCarRef}
          aiCarRef={aiCarRef}
          speedRef={speedRef}
          racePhase={raceState.phase}
          onLapComplete={handleLapComplete}
        />
      </Canvas>
    </div>
  );
}
