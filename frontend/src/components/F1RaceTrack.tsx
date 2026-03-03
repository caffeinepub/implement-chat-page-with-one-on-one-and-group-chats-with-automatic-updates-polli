import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RealisticRoadCourseScene, buildTrackCurve } from './race/RealisticRoadCourseScene';
import { RealisticSportsCoupeCar } from './race/RealisticSportsCoupeCar';
import { RaceHUDOverlay } from './race/RaceHUDOverlay';
import { useForwardBackwardControls } from '../hooks/useForwardBackwardControls';

const TOTAL_LAPS = 3;
const RACE_TIME_LIMIT = 120; // seconds

interface RacePhase {
  status: 'pre' | 'countdown' | 'racing' | 'finished';
  countdown: number;
  lap: number;
  timeRemaining: number;
  playerFinished: boolean;
  finishTime: number | null;
}

interface CarState {
  position: THREE.Vector3;
  rotation: number;
  velocity: number;
  suspensionOffset: number;
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

function PlayerCarPhysics({
  carStateRef,
  setCarState,
  raceStatus,
  onLapComplete,
}: {
  carStateRef: React.MutableRefObject<CarState>;
  setCarState: React.Dispatch<React.SetStateAction<CarState>>;
  raceStatus: string;
  onLapComplete: () => void;
}) {
  const controls = useForwardBackwardControls();
  const physicsRef = useRef({ t: 0, speed: 0 });

  useFrame((state, delta) => {
    if (raceStatus !== 'racing') return;
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
      physics.speed = Math.max(physics.speed - brake * dt * 60, -maxSpeed * 0.4);
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
      Math.sin(state.clock.elapsedTime * 15 + point.x) * 0.02 * (speedKmh / 100);

    const next: CarState = {
      position: new THREE.Vector3(point.x, 0.15, point.z),
      rotation,
      velocity: speedKmh,
      suspensionOffset,
    };
    carStateRef.current = next;
    setCarState({ ...next });
  });

  return null;
}

function AICarPhysics({
  carStateRef,
  setCarState,
  raceStatus,
}: {
  carStateRef: React.MutableRefObject<CarState>;
  setCarState: React.Dispatch<React.SetStateAction<CarState>>;
  raceStatus: string;
}) {
  const physicsRef = useRef({ t: 0.03, speed: 0.00125 });

  useFrame((state, delta) => {
    if (raceStatus !== 'racing') return;
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
    const pos = new THREE.Vector3(point.x, 0.15, point.z).add(right.multiplyScalar(1.5));
    const suspensionOffset = Math.sin(state.clock.elapsedTime * 12) * 0.015;

    const next: CarState = {
      position: pos,
      rotation,
      velocity: physics.speed * 60000,
      suspensionOffset,
    };
    carStateRef.current = next;
    setCarState({ ...next });
  });

  return null;
}

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
      car.position.z - Math.cos(car.rotation) * 12
    );
    camPosRef.current.lerp(behind, 0.08);
    camera.position.copy(camPosRef.current);
    camera.lookAt(car.position);
  });

  return null;
}

function Scene({
  playerCarRef,
  playerCarState,
  setPlayerCarState,
  aiCarRef,
  aiCarState,
  setAiCarState,
  raceStatus,
  onLapComplete,
}: {
  playerCarRef: React.MutableRefObject<CarState>;
  playerCarState: CarState;
  setPlayerCarState: React.Dispatch<React.SetStateAction<CarState>>;
  aiCarRef: React.MutableRefObject<CarState>;
  aiCarState: CarState;
  setAiCarState: React.Dispatch<React.SetStateAction<CarState>>;
  raceStatus: string;
  onLapComplete: () => void;
}) {
  return (
    <>
      <color attach="background" args={['#87CEEB']} />
      <fog attach="fog" args={['#87CEEB', 60, 320]} />
      <ambientLight intensity={0.8} />
      <directionalLight
        position={[50, 80, 30]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={200}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />
      <hemisphereLight args={['#87CEEB', '#654321', 0.6]} />

      <RealisticRoadCourseScene weather="sunny" />

      <RealisticSportsCoupeCar
        position={playerCarState.position}
        rotation={playerCarState.rotation}
        velocity={playerCarState.velocity}
        suspensionOffset={playerCarState.suspensionOffset}
        isPlayer
      />

      <RealisticSportsCoupeCar
        position={aiCarState.position}
        rotation={aiCarState.rotation}
        velocity={aiCarState.velocity}
        suspensionOffset={aiCarState.suspensionOffset}
        isPlayer={false}
      />

      <PlayerCarPhysics
        carStateRef={playerCarRef}
        setCarState={setPlayerCarState}
        raceStatus={raceStatus}
        onLapComplete={onLapComplete}
      />

      <AICarPhysics
        carStateRef={aiCarRef}
        setCarState={setAiCarState}
        raceStatus={raceStatus}
      />

      <ChaseCamera targetRef={playerCarRef} active={raceStatus === 'racing'} />
    </>
  );
}

export default function F1RaceTrack({ onBack }: { onBack?: () => void }) {
  const [phase, setPhase] = useState<RacePhase>({
    status: 'pre',
    countdown: 3,
    lap: 1,
    timeRemaining: RACE_TIME_LIMIT,
    playerFinished: false,
    finishTime: null,
  });

  const [playerCarState, setPlayerCarState] = useState<CarState>(() => getInitialCarState(0));
  const [aiCarState, setAiCarState] = useState<CarState>(() => getInitialCarState(0.03));
  const playerCarRef = useRef<CarState>(getInitialCarState(0));
  const aiCarRef = useRef<CarState>(getInitialCarState(0.03));

  const raceStartTimeRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCountdown = useCallback(() => {
    setPhase(prev => ({ ...prev, status: 'countdown', countdown: 3 }));
    let count = 3;
    countdownIntervalRef.current = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(countdownIntervalRef.current!);
        countdownIntervalRef.current = null;
        raceStartTimeRef.current = Date.now();
        setPhase(prev => ({ ...prev, status: 'racing', countdown: 0 }));
      } else {
        setPhase(prev => ({ ...prev, countdown: count }));
      }
    }, 1000);
  }, []);

  // Wall-clock timer — fires every 250ms, calculates elapsed from Date.now()
  useEffect(() => {
    if (phase.status !== 'racing') {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      if (!raceStartTimeRef.current) return;
      const elapsed = (Date.now() - raceStartTimeRef.current) / 1000;
      const remaining = Math.max(0, RACE_TIME_LIMIT - elapsed);

      setPhase(prev => {
        if (prev.status !== 'racing') return prev;
        if (remaining <= 0) {
          return { ...prev, status: 'finished', timeRemaining: 0, finishTime: RACE_TIME_LIMIT };
        }
        return { ...prev, timeRemaining: remaining };
      });
    }, 250);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [phase.status]);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  const handleLapComplete = useCallback(() => {
    setPhase(prev => {
      if (prev.status !== 'racing') return prev;
      const newLap = prev.lap + 1;
      if (newLap > TOTAL_LAPS) {
        const elapsed = raceStartTimeRef.current
          ? (Date.now() - raceStartTimeRef.current) / 1000
          : RACE_TIME_LIMIT;
        return {
          ...prev,
          status: 'finished',
          lap: TOTAL_LAPS,
          playerFinished: true,
          finishTime: elapsed,
        };
      }
      return { ...prev, lap: newLap };
    });
  }, []);

  const resetRace = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    raceStartTimeRef.current = null;
    const initPlayer = getInitialCarState(0);
    const initAI = getInitialCarState(0.03);
    playerCarRef.current = initPlayer;
    aiCarRef.current = initAI;
    setPlayerCarState(initPlayer);
    setAiCarState(initAI);
    setPhase({
      status: 'pre',
      countdown: 3,
      lap: 1,
      timeRemaining: RACE_TIME_LIMIT,
      playerFinished: false,
      finishTime: null,
    });
  }, []);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Pre-race */}
      {phase.status === 'pre' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
          <div className="text-6xl mb-4">🏎️</div>
          <h1 className="text-5xl font-bold text-white mb-4 tracking-widest">MULTIPLAYER RACE</h1>
          <p className="text-xl text-gray-300 mb-2">
            {TOTAL_LAPS} Laps · {RACE_TIME_LIMIT}s Time Limit
          </p>
          <p className="text-gray-400 mb-8">
            Use <kbd className="bg-gray-700 px-2 py-1 rounded text-white font-mono">W</kbd> to accelerate,{' '}
            <kbd className="bg-gray-700 px-2 py-1 rounded text-white font-mono">S</kbd> to brake
          </p>
          <button
            onClick={startCountdown}
            className="px-10 py-4 bg-yellow-500 hover:bg-yellow-400 text-black text-2xl font-bold rounded-lg transition-colors"
          >
            START RACE
          </button>
          {onBack && (
            <button
              onClick={onBack}
              className="mt-4 px-6 py-2 text-gray-400 hover:text-white transition-colors"
            >
              ← Back
            </button>
          )}
        </div>
      )}

      {/* Countdown */}
      {phase.status === 'countdown' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <span className="text-9xl font-black text-yellow-400 drop-shadow-2xl animate-pulse">
            {phase.countdown}
          </span>
        </div>
      )}

      {/* Finished */}
      {phase.status === 'finished' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
          <div className="text-6xl mb-4">
            {phase.playerFinished ? '🏆' : '⏱'}
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            {phase.playerFinished ? 'RACE COMPLETE!' : 'TIME UP!'}
          </h1>
          {phase.finishTime !== null && (
            <p className="text-2xl text-yellow-400 mb-2">Time: {phase.finishTime.toFixed(2)}s</p>
          )}
          <p className="text-xl text-gray-300 mb-8">
            Laps: {Math.min(phase.lap, TOTAL_LAPS)} / {TOTAL_LAPS}
          </p>
          <button
            onClick={resetRace}
            className="px-10 py-4 bg-yellow-500 hover:bg-yellow-400 text-black text-2xl font-bold rounded-lg transition-colors mb-4"
          >
            RACE AGAIN
          </button>
          {onBack && (
            <button
              onClick={onBack}
              className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
            >
              ← Back
            </button>
          )}
        </div>
      )}

      {/* HUD */}
      {phase.status === 'racing' && (
        <>
          <RaceHUDOverlay
            currentLap={phase.lap}
            totalLaps={TOTAL_LAPS}
            speed={Math.round(Math.abs(playerCarState.velocity))}
          />
          <div className="pointer-events-none absolute top-6 left-1/2 -translate-x-1/2 z-10">
            <div className="bg-black/70 px-4 py-2 rounded-lg text-white font-bold text-lg backdrop-blur-sm">
              ⏱ {Math.ceil(phase.timeRemaining)}s
            </div>
          </div>
        </>
      )}

      <Canvas
        shadows
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, outputColorSpace: THREE.SRGBColorSpace }}
        camera={{ fov: 65, near: 0.1, far: 500, position: [0, 10, 20] }}
      >
        <Scene
          playerCarRef={playerCarRef}
          playerCarState={playerCarState}
          setPlayerCarState={setPlayerCarState}
          aiCarRef={aiCarRef}
          aiCarState={aiCarState}
          setAiCarState={setAiCarState}
          raceStatus={phase.status}
          onLapComplete={handleLapComplete}
        />
      </Canvas>
    </div>
  );
}
