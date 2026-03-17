import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Eye, Radio } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { buildTrackCurve } from "../components/race/RealisticRoadCourseScene";

const AI_CARS = [
  {
    id: 0,
    name: "Hamilton",
    team: "Mercedes",
    color: "#00d2be",
    progress: 0.0,
  },
  {
    id: 1,
    name: "Verstappen",
    team: "Red Bull",
    color: "#1e41ff",
    progress: 0.05,
  },
  { id: 2, name: "Leclerc", team: "Ferrari", color: "#dc0000", progress: 0.1 },
  { id: 3, name: "Norris", team: "McLaren", color: "#ff8000", progress: 0.15 },
];

const AI_SPEED = 0.00035;

function SpectatorScene({ followTarget }: { followTarget: number | null }) {
  const { camera } = useThree();
  const aiProgressRef = useRef(AI_CARS.map((c) => c.progress));
  const carMeshesRef = useRef<THREE.Mesh[]>([]);
  const freePos = useRef(new THREE.Vector3(0, 30, 0));
  const freeKeys = useRef<Set<string>>(new Set());
  const curve = buildTrackCurve();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => freeKeys.current.add(e.code);
    const onKeyUp = (e: KeyboardEvent) => freeKeys.current.delete(e.code);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useFrame((_, delta) => {
    for (let i = 0; i < aiProgressRef.current.length; i++) {
      aiProgressRef.current[i] =
        (aiProgressRef.current[i] + AI_SPEED * (1 - i * 0.03)) % 1;
      const pos = curve.getPoint(aiProgressRef.current[i]);
      const mesh = carMeshesRef.current[i];
      if (mesh) {
        mesh.position.set(pos.x, 0.6, pos.z);
        const tangent = curve.getTangent(aiProgressRef.current[i]);
        mesh.rotation.y = Math.atan2(tangent.x, tangent.z);
      }
    }

    if (followTarget !== null && carMeshesRef.current[followTarget]) {
      const target = carMeshesRef.current[followTarget];
      const tangent = curve.getTangent(aiProgressRef.current[followTarget]);
      const offset = new THREE.Vector3(-tangent.x * 12, 5, -tangent.z * 12);
      camera.position.lerp(target.position.clone().add(offset), 0.08);
      camera.lookAt(target.position);
    } else {
      const speed = 25 * delta;
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      dir.y = 0;
      dir.normalize();
      const right = new THREE.Vector3().crossVectors(
        dir,
        new THREE.Vector3(0, 1, 0),
      );

      if (freeKeys.current.has("KeyW"))
        freePos.current.addScaledVector(dir, speed);
      if (freeKeys.current.has("KeyS"))
        freePos.current.addScaledVector(dir, -speed);
      if (freeKeys.current.has("KeyA"))
        freePos.current.addScaledVector(right, -speed);
      if (freeKeys.current.has("KeyD"))
        freePos.current.addScaledVector(right, speed);
      if (freeKeys.current.has("Space")) freePos.current.y += speed;
      if (freeKeys.current.has("ShiftLeft")) freePos.current.y -= speed;

      camera.position.lerp(freePos.current, 0.15);
    }
  });

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[600, 600]} />
        <meshStandardMaterial color="#1a3a1a" roughness={1} />
      </mesh>

      {Array.from({ length: 300 }).map((_, i) => {
        const t0 = i / 300;
        const p0 = curve.getPoint(t0);
        const p1 = curve.getPoint((i + 1) / 300);
        const tangent = curve.getTangent(t0);
        const mid = p0.clone().lerp(p1, 0.5);
        const len = p0.distanceTo(p1);
        const angle = Math.atan2(tangent.x, tangent.z);
        return (
          <mesh
            key={`tseg-${(i * 0.1).toFixed(1)}`}
            position={[mid.x, 0.01, mid.z]}
            rotation={[0, angle, 0]}
            receiveShadow
          >
            <planeGeometry args={[len + 0.1, 12]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
          </mesh>
        );
      })}

      {AI_CARS.map((car, i) => (
        <mesh
          key={car.id}
          ref={(el) => {
            if (el) carMeshesRef.current[i] = el;
          }}
          castShadow
        >
          <boxGeometry args={[1.8, 0.5, 4]} />
          <meshStandardMaterial
            color={car.color}
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>
      ))}

      <ambientLight intensity={0.4} />
      <directionalLight position={[50, 100, 50]} intensity={1.2} castShadow />
      <pointLight position={[0, 20, 0]} intensity={0.5} />
    </>
  );
}

export default function SpectatorMode() {
  const navigate = useNavigate();
  const [followTarget, setFollowTarget] = useState<number | null>(null);
  const [lapCount, setLapCount] = useState([1, 1, 1, 1]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLapCount((prev) =>
        prev.map((l) => (Math.random() < 0.01 ? l + 1 : l)),
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleTabCycle = useCallback(() => {
    setFollowTarget((prev) => {
      if (prev === null) return 0;
      if (prev >= AI_CARS.length - 1) return null;
      return prev + 1;
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Tab") {
        e.preventDefault();
        handleTabCycle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleTabCycle]);

  return (
    <div
      className="relative w-full h-[calc(100vh-4rem)] bg-black"
      data-ocid="spectator.page"
    >
      <Canvas
        shadows
        camera={{ position: [0, 30, 60], fov: 60, near: 0.1, far: 2000 }}
        style={{ width: "100%", height: "100%" }}
      >
        <SpectatorScene followTarget={followTarget} />
      </Canvas>

      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-2 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/" })}
            className="text-white hover:text-white hover:bg-white/10"
            data-ocid="spectator.cancel_button"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Exit
          </Button>
          <Badge
            variant="outline"
            className="bg-red-600/20 text-red-400 border-red-500/50 flex items-center gap-1"
          >
            <Radio className="h-3 w-3 animate-pulse" />
            LIVE
          </Badge>
          <span className="text-white/70 text-sm font-medium">
            Grand Prix Champions — Spectator View
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-blue-400" />
          <span className="text-white/70 text-sm">
            {followTarget !== null
              ? `Following: ${AI_CARS[followTarget].name}`
              : "Free Camera"}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleTabCycle}
            className="border-white/20 text-white hover:bg-white/10 text-xs"
            data-ocid="spectator.toggle"
          >
            Tab — Cycle Car
          </Button>
        </div>
      </div>

      {/* Race Position Board */}
      <div className="absolute top-16 right-4 bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg p-3 min-w-[200px]">
        <div className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2 flex items-center gap-1">
          <span>🏁</span> Race Positions
        </div>
        {AI_CARS.map((car, i) => (
          <button
            type="button"
            key={car.id}
            onClick={() => setFollowTarget(followTarget === i ? null : i)}
            data-ocid={`spectator.car.item.${i + 1}`}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
              followTarget === i ? "bg-white/20" : "hover:bg-white/10"
            }`}
          >
            <span className="text-white/50 w-4 text-center font-mono">
              {i + 1}
            </span>
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: car.color }}
            />
            <span className="text-white font-medium flex-1 text-left">
              {car.name}
            </span>
            <span className="text-white/40 text-xs">L{lapCount[i]}</span>
          </button>
        ))}
      </div>

      {/* Spectator label */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white/70 text-xs px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
        <Eye className="h-3 w-3" />
        You are spectating — WASD to fly, Tab to follow a car
      </div>
    </div>
  );
}
