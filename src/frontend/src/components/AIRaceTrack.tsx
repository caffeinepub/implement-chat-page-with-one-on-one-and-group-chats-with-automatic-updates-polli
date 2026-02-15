import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStartAIRace, useCompleteAIRace, useProgressSRByAI } from '../hooks/useQueries';
import { useRaceAudio } from '../hooks/useRaceAudio';
import { useEngineAudio } from '../hooks/useEngineAudio';
import { Flag, Trophy, Clock, Volume2, VolumeX, Cloud, CloudRain, Sun, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface CarData {
  position: THREE.Vector3;
  rotation: number;
  velocity: number;
  laps: number;
  suspensionOffset: number;
}

type WeatherType = 'sunny' | 'overcast' | 'rainy';

function F1Car({ 
  position, 
  rotation, 
  isPlayer, 
  velocity,
  suspensionOffset 
}: { 
  position: THREE.Vector3; 
  rotation: number; 
  isPlayer: boolean; 
  velocity: number;
  suspensionOffset: number;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const texture = useLoader(THREE.TextureLoader, isPlayer ? '/assets/generated/race-car-blue.dim_64x32.png' : '/assets/generated/race-car-red.dim_64x32.png');
  const wheelRotation = useRef(0);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.position.copy(position);
      meshRef.current.position.y += suspensionOffset;
      meshRef.current.rotation.y = rotation;
      
      wheelRotation.current += velocity * delta * 0.5;
    }
  });

  return (
    <group ref={meshRef}>
      <mesh castShadow position={[0, 0.4, 0]}>
        <boxGeometry args={[1.4, 0.5, 3.5]} />
        <meshStandardMaterial map={texture} metalness={0.7} roughness={0.3} />
      </mesh>

      <mesh castShadow position={[0, 0.8, -0.3]}>
        <boxGeometry args={[0.9, 0.4, 1.2]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.1} />
      </mesh>

      <mesh castShadow position={[0, 0.2, 1.9]}>
        <boxGeometry args={[2.2, 0.1, 0.4]} />
        <meshStandardMaterial color={isPlayer ? '#0066ff' : '#ff0000'} metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh castShadow position={[0, 0.15, 2.1]}>
        <boxGeometry args={[2.0, 0.05, 0.2]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.1} />
      </mesh>

      <mesh castShadow position={[0, 1.2, -1.8]}>
        <boxGeometry args={[1.8, 0.8, 0.1]} />
        <meshStandardMaterial color={isPlayer ? '#0066ff' : '#ff0000'} metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh castShadow position={[-0.7, 0.8, -1.8]}>
        <boxGeometry args={[0.1, 0.5, 0.1]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh castShadow position={[0.7, 0.8, -1.8]}>
        <boxGeometry args={[0.1, 0.5, 0.1]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.1} />
      </mesh>

      <mesh castShadow position={[-0.8, 0.3, 1.2]} rotation={[wheelRotation.current, 0, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.3, 16]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0.8, 0.3, 1.2]} rotation={[wheelRotation.current, 0, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.3, 16]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[-0.8, 0.35, -1.2]} rotation={[wheelRotation.current, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.4, 16]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0.8, 0.35, -1.2]} rotation={[wheelRotation.current, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.4, 16]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>

      <mesh castShadow position={[0, 0.7, -0.8]}>
        <boxGeometry args={[1.0, 0.3, 1.0]} />
        <meshStandardMaterial color={isPlayer ? '#003d99' : '#990000'} metalness={0.8} roughness={0.3} />
      </mesh>

      <mesh castShadow position={[-0.9, 0.5, 0.2]}>
        <boxGeometry args={[0.3, 0.4, 2.0]} />
        <meshStandardMaterial color={isPlayer ? '#0066ff' : '#ff0000'} metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh castShadow position={[0.9, 0.5, 0.2]}>
        <boxGeometry args={[0.3, 0.4, 2.0]} />
        <meshStandardMaterial color={isPlayer ? '#0066ff' : '#ff0000'} metalness={0.7} roughness={0.3} />
      </mesh>

      {isPlayer && (
        <mesh position={[0, 2.2, 0]}>
          <coneGeometry args={[0.3, 0.8, 4]} />
          <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={0.8} />
        </mesh>
      )}
    </group>
  );
}

function AnimatedCrowd({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load('/assets/generated/animated-crowd-grandstand.dim_800x400.png', (loadedTexture) => {
      setTexture(loadedTexture);
    });
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  return (
    <mesh ref={meshRef} position={position} castShadow>
      <planeGeometry args={[15, 8]} />
      <meshStandardMaterial map={texture} side={THREE.DoubleSide} />
    </mesh>
  );
}

function WavingFlags({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load('/assets/generated/racing-flags-waving.dim_600x300.png', (loadedTexture) => {
      setTexture(loadedTexture);
    });
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[3, 2]} />
      <meshStandardMaterial map={texture} transparent side={THREE.DoubleSide} />
    </mesh>
  );
}

function PitCrew({ position }: { position: [number, number, number] }) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load('/assets/generated/pit-crew-activity.dim_800x600.png', (loadedTexture) => {
      setTexture(loadedTexture);
    });
  }, []);

  return (
    <mesh position={position} castShadow>
      <planeGeometry args={[6, 4]} />
      <meshStandardMaterial map={texture} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Track({ weather }: { weather: WeatherType }) {
  const trackRef = useRef<THREE.Mesh>(null);
  const [albedoTexture, setAlbedoTexture] = useState<THREE.Texture | null>(null);
  const [normalTexture, setNormalTexture] = useState<THREE.Texture | null>(null);
  const [roughnessTexture, setRoughnessTexture] = useState<THREE.Texture | null>(null);
  const [curbTexture, setCurbTexture] = useState<THREE.Texture | null>(null);
  const [markingsTexture, setMarkingsTexture] = useState<THREE.Texture | null>(null);
  
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    
    loader.load('/assets/generated/track-asphalt.dim_256x256.png', (tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(20, 20);
      setAlbedoTexture(tex);
    });
    
    loader.load('/assets/generated/track-asphalt-normal.dim_1024x1024.png', (tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(20, 20);
      setNormalTexture(tex);
    });
    
    loader.load('/assets/generated/track-asphalt-roughness.dim_1024x1024.png', (tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(20, 20);
      setRoughnessTexture(tex);
    });
    
    loader.load('/assets/generated/track-curb-redwhite.dim_1024x256.png', (tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      setCurbTexture(tex);
    });
    
    loader.load('/assets/generated/track-lines-markings.dim_1024x1024.png', (tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(10, 10);
      setMarkingsTexture(tex);
    });
  }, []);

  const trackRoughness = weather === 'rainy' ? 0.15 : 0.8;
  const trackMetalness = weather === 'rainy' ? 0.3 : 0.0;
  const envMapIntensity = weather === 'rainy' ? 1.5 : 0.5;

  return (
    <group>
      <mesh ref={trackRef} receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <ringGeometry args={[40, 60, 64]} />
        <meshStandardMaterial 
          map={albedoTexture}
          normalMap={normalTexture}
          roughnessMap={roughnessTexture}
          roughness={trackRoughness} 
          metalness={trackMetalness}
          envMapIntensity={envMapIntensity}
        />
      </mesh>

      {/* Track markings overlay */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[40, 60, 64]} />
        <meshStandardMaterial 
          map={markingsTexture}
          transparent
          opacity={0.6}
          depthWrite={false}
        />
      </mesh>

      {/* Curbs at inner edge */}
      {[...Array(32)].map((_, i) => {
        const angle = (i / 32) * Math.PI * 2;
        const radius = 39.5;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        return (
          <mesh key={`curb-inner-${i}`} position={[x, 0.1, z]} rotation={[-Math.PI / 2, 0, angle]} receiveShadow>
            <planeGeometry args={[0.8, 4]} />
            <meshStandardMaterial map={curbTexture} />
          </mesh>
        );
      })}

      {/* Curbs at outer edge */}
      {[...Array(32)].map((_, i) => {
        const angle = (i / 32) * Math.PI * 2;
        const radius = 60.5;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        return (
          <mesh key={`curb-outer-${i}`} position={[x, 0.1, z]} rotation={[-Math.PI / 2, 0, angle]} receiveShadow>
            <planeGeometry args={[0.8, 4]} />
            <meshStandardMaterial map={curbTexture} />
          </mesh>
        );
      })}

      <mesh position={[-50, 0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[15, 8]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.8} />
      </mesh>

      <mesh position={[-48, 0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2, 12]} />
        <meshStandardMaterial color="#000000" transparent opacity={0.6} />
      </mesh>
      <mesh position={[-46, 0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2, 12]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.6} />
      </mesh>

      {[...Array(8)].map((_, i) => (
        <mesh key={i} position={[-40 + i * 10, 0.6, -35]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.5, 16]} />
          <meshStandardMaterial color="#ff6600" emissive="#ff6600" emissiveIntensity={0.3} />
        </mesh>
      ))}

      {[...Array(32)].map((_, i) => {
        const angle = (i / 32) * Math.PI * 2;
        const radius = 65;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        return (
          <mesh key={`barrier-${i}`} position={[x, 1, z]} castShadow>
            <boxGeometry args={[2, 2, 0.5]} />
            <meshStandardMaterial color="#ff0000" />
          </mesh>
        );
      })}

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#2d5016" />
      </mesh>

      <AnimatedCrowd position={[70, 3, 0]} />
      <AnimatedCrowd position={[-70, 3, 0]} />
      <AnimatedCrowd position={[0, 3, 70]} />
      <AnimatedCrowd position={[0, 3, -70]} />

      <WavingFlags position={[-45, 5, 10]} />
      <WavingFlags position={[-45, 5, -10]} />
      <WavingFlags position={[45, 5, 10]} />
      <WavingFlags position={[45, 5, -10]} />

      <PitCrew position={[-35, 2, -35]} />
    </group>
  );
}

function DynamicLighting({ weather }: { weather: WeatherType }) {
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);
  
  useFrame((state) => {
    if (directionalLightRef.current) {
      const time = state.clock.elapsedTime;
      directionalLightRef.current.position.x = 50 + Math.sin(time * 0.1) * 10;
      directionalLightRef.current.position.z = 25 + Math.cos(time * 0.1) * 10;
    }
  });

  const ambientIntensity = weather === 'sunny' ? 0.7 : weather === 'overcast' ? 0.5 : 0.4;
  const directionalIntensity = weather === 'sunny' ? 1.5 : weather === 'overcast' ? 0.9 : 0.6;
  const skyColor = weather === 'sunny' ? '#87CEEB' : weather === 'overcast' ? '#6B7280' : '#4B5563';
  const groundColor = weather === 'sunny' ? '#654321' : '#3E2723';

  return (
    <>
      <ambientLight intensity={ambientIntensity} />
      <directionalLight 
        ref={directionalLightRef}
        position={[50, 50, 25]} 
        intensity={directionalIntensity} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={200}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
        shadow-radius={2}
      />
      <hemisphereLight args={[skyColor, groundColor, 0.6]} />
      
      <spotLight 
        position={[-50, 30, 0]} 
        angle={0.3} 
        penumbra={0.5} 
        intensity={0.5} 
        castShadow
      />
      <spotLight 
        position={[50, 30, 0]} 
        angle={0.3} 
        penumbra={0.5} 
        intensity={0.5} 
        castShadow
      />
    </>
  );
}

function RainEffect() {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 1000;
  const particlesGeometry = useRef<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 150;
      positions[i + 1] = Math.random() * 50;
      positions[i + 2] = (Math.random() - 0.5) * 150;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.current = geometry;
  }, []);

  useFrame(() => {
    if (particlesRef.current && particlesGeometry.current) {
      const positions = particlesGeometry.current.attributes.position.array as Float32Array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] -= 0.5;
        if (positions[i] < 0) {
          positions[i] = 50;
        }
      }
      particlesGeometry.current.attributes.position.needsUpdate = true;
    }
  });

  if (!particlesGeometry.current) return null;

  return (
    <points ref={particlesRef} geometry={particlesGeometry.current}>
      <pointsMaterial size={0.1} color="#aaaaaa" transparent opacity={0.6} />
    </points>
  );
}

function Scene({ 
  playerCar,
  aiCar,
  weather 
}: { 
  playerCar: CarData;
  aiCar: CarData;
  weather: WeatherType;
}) {
  const { camera } = useThree();
  const cameraVelocity = useRef(new THREE.Vector3());
  const cameraShake = useRef({ x: 0, y: 0, z: 0 });
  const impactIntensity = useRef(0);

  useFrame((state, delta) => {
    const targetPos = new THREE.Vector3(
      playerCar.position.x - Math.sin(playerCar.rotation) * 15,
      Math.max(playerCar.position.y + 8, 3),
      playerCar.position.z - Math.cos(playerCar.rotation) * 15
    );

    const speed = Math.abs(playerCar.velocity);
    const speedLag = 1 + (speed / 60) * 0.3;
    const laggedTarget = targetPos.clone().lerp(
      new THREE.Vector3(
        playerCar.position.x - Math.sin(playerCar.rotation) * (15 + speedLag),
        targetPos.y,
        playerCar.position.z - Math.cos(playerCar.rotation) * (15 + speedLag)
      ),
      0.3
    );

    const smoothing = 0.08;
    cameraVelocity.current.lerp(
      laggedTarget.clone().sub(camera.position),
      smoothing
    );
    camera.position.add(cameraVelocity.current.multiplyScalar(delta * 10));

    const speedShake = (speed / 60) * 0.02;
    cameraShake.current.x = (Math.random() - 0.5) * speedShake;
    cameraShake.current.y = (Math.random() - 0.5) * speedShake * 0.5;
    cameraShake.current.z = (Math.random() - 0.5) * speedShake;

    impactIntensity.current *= 0.9;
    const impactShake = impactIntensity.current * 0.5;
    cameraShake.current.x += (Math.random() - 0.5) * impactShake;
    cameraShake.current.y += (Math.random() - 0.5) * impactShake;

    const lookTarget = playerCar.position.clone();
    lookTarget.x += cameraShake.current.x;
    lookTarget.y += cameraShake.current.y;
    lookTarget.z += cameraShake.current.z;
    camera.lookAt(lookTarget);
  });

  const fogColor = weather === 'sunny' ? '#87CEEB' : weather === 'overcast' ? '#6B7280' : '#4B5563';
  const fogNear = weather === 'rainy' ? 30 : 50;
  const fogFar = weather === 'rainy' ? 200 : 300;

  return (
    <>
      <DynamicLighting weather={weather} />
      <Track weather={weather} />
      
      <F1Car
        position={playerCar.position}
        rotation={playerCar.rotation}
        isPlayer={true}
        velocity={playerCar.velocity}
        suspensionOffset={playerCar.suspensionOffset}
      />

      <F1Car
        position={aiCar.position}
        rotation={aiCar.rotation}
        isPlayer={false}
        velocity={aiCar.velocity}
        suspensionOffset={aiCar.suspensionOffset}
      />

      {weather === 'rainy' && <RainEffect />}
      <fog attach="fog" args={[fogColor, fogNear, fogFar]} />
    </>
  );
}

interface AIRaceTrackProps {
  onExit: () => void;
}

export default function AIRaceTrack({ onExit }: AIRaceTrackProps) {
  const [raceStarted, setRaceStarted] = useState(false);
  const [currentLap, setCurrentLap] = useState(1);
  const [lapTime, setLapTime] = useState(0);
  const [bestLapTime, setBestLapTime] = useState<number | null>(null);
  const [raceFinished, setRaceFinished] = useState(false);
  const [weather, setWeather] = useState<WeatherType>('sunny');
  const [engineVolume, setEngineVolume] = useState(0.3);
  const [srGained, setSrGained] = useState<number>(0);

  const startAIRace = useStartAIRace();
  const completeAIRace = useCompleteAIRace();
  const progressSR = useProgressSRByAI();

  const raceAudio = useRaceAudio(
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    {
      autoPlay: false,
      loop: true,
      initialVolume: 0.5,
    }
  );

  const engineAudio = useEngineAudio();

  const playerPositionRef = useRef(new THREE.Vector3(-50, 1, 0));
  const playerRotationRef = useRef(0);
  const playerVelocityRef = useRef(0);
  const playerSuspensionRef = useRef(0);
  
  const aiPositionRef = useRef(new THREE.Vector3(-50, 1, 3));
  const aiRotationRef = useRef(0);
  const aiVelocityRef = useRef(0);
  const aiSuspensionRef = useRef(0);
  const aiProgressRef = useRef(0);

  const keysPressed = useRef<Set<string>>(new Set());
  const startTimeRef = useRef<number>(Date.now());
  const checkpointRef = useRef(0);

  const [playerCar, setPlayerCar] = useState<CarData>({
    position: new THREE.Vector3(-50, 1, 0),
    rotation: 0,
    velocity: 0,
    laps: 1,
    suspensionOffset: 0,
  });

  const [aiCar, setAiCar] = useState<CarData>({
    position: new THREE.Vector3(-50, 1, 3),
    rotation: 0,
    velocity: 0,
    laps: 1,
    suspensionOffset: 0,
  });

  const totalLaps = 3;

  useEffect(() => {
    startAIRace.mutate({
      trackId: 'aiTrack',
      input: { forward: false, backward: false }
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => keysPressed.current.add(e.key.toLowerCase());
    const handleKeyUp = (e: KeyboardEvent) => keysPressed.current.delete(e.key.toLowerCase());

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (raceStarted && !raceFinished) {
      raceAudio.play();
      engineAudio.start();
    } else {
      raceAudio.stop();
      engineAudio.stop();
    }
  }, [raceStarted, raceFinished]);

  useEffect(() => {
    engineAudio.setVolume(engineVolume);
  }, [engineVolume]);

  useEffect(() => {
    if (!raceStarted) return;

    const gameLoop = setInterval(() => {
      const delta = 0.016;
      const keys = keysPressed.current;

      let throttle = 0;
      let brake = 0;
      let steering = 0;

      if (keys.has('w') || keys.has('arrowup')) throttle = 1;
      if (keys.has('s') || keys.has('arrowdown')) brake = 1;
      if (keys.has('a') || keys.has('arrowleft')) steering = 1;
      if (keys.has('d') || keys.has('arrowright')) steering = -1;

      const gripMultiplier = weather === 'rainy' ? 0.6 : weather === 'overcast' ? 0.85 : 1.0;

      if (throttle > 0) {
        playerVelocityRef.current += throttle * delta * 60 * gripMultiplier;
      }
      if (brake > 0) {
        playerVelocityRef.current -= brake * delta * 80 * gripMultiplier;
      }

      playerVelocityRef.current *= 0.98;
      playerVelocityRef.current = Math.max(-20, Math.min(60, playerVelocityRef.current));

      if (Math.abs(playerVelocityRef.current) > 1) {
        const speed = Math.abs(playerVelocityRef.current);
        const steeringSensitivity = Math.max(0.3, 1 - (speed / 60) * 0.5);
        const steeringEffect = steering * delta * 2.5 * steeringSensitivity * gripMultiplier;
        playerRotationRef.current += steeringEffect;
      }

      const targetSuspension = Math.abs(playerVelocityRef.current) > 30 ? -0.1 : 0;
      playerSuspensionRef.current += (targetSuspension - playerSuspensionRef.current) * 0.1;

      const moveX = Math.sin(playerRotationRef.current) * playerVelocityRef.current * delta;
      const moveZ = Math.cos(playerRotationRef.current) * playerVelocityRef.current * delta;
      playerPositionRef.current.x += moveX;
      playerPositionRef.current.z += moveZ;

      const distFromCenter = Math.sqrt(
        playerPositionRef.current.x ** 2 + playerPositionRef.current.z ** 2
      );
      if (distFromCenter > 60 || distFromCenter < 38) {
        const angle = Math.atan2(playerPositionRef.current.z, playerPositionRef.current.x);
        const targetRadius = distFromCenter > 60 ? 60 : 38;
        const penetration = Math.abs(distFromCenter - targetRadius);
        const springForce = penetration * 0.3;
        const damping = 0.85;
        
        playerPositionRef.current.x += (Math.cos(angle) * targetRadius - playerPositionRef.current.x) * springForce * delta * 10;
        playerPositionRef.current.z += (Math.sin(angle) * targetRadius - playerPositionRef.current.z) * springForce * delta * 10;
        playerVelocityRef.current *= damping;
      }

      if (playerPositionRef.current.x < -45 && Math.abs(playerPositionRef.current.z) < 10) {
        if (checkpointRef.current === 1) {
          const lapTimeMs = Date.now() - startTimeRef.current;
          setLapTime(lapTimeMs);
          
          if (!bestLapTime || lapTimeMs < bestLapTime) {
            setBestLapTime(lapTimeMs);
          }

          if (currentLap < totalLaps) {
            setCurrentLap(prev => prev + 1);
            startTimeRef.current = Date.now();
            toast.success(`Lap ${currentLap} completed!`);
          } else {
            handleRaceComplete();
          }
          checkpointRef.current = 0;
        }
      } else if (playerPositionRef.current.x > 0) {
        checkpointRef.current = 1;
      }

      aiProgressRef.current += delta * 0.8;
      const aiAngle = aiProgressRef.current;
      const aiRadius = 50;
      aiPositionRef.current.x = Math.cos(aiAngle) * aiRadius;
      aiPositionRef.current.z = Math.sin(aiAngle) * aiRadius;
      aiRotationRef.current = aiAngle + Math.PI / 2;
      aiVelocityRef.current = 45;

      engineAudio.updateSpeed(playerVelocityRef.current);

      setPlayerCar({
        position: playerPositionRef.current.clone(),
        rotation: playerRotationRef.current,
        velocity: playerVelocityRef.current,
        laps: currentLap,
        suspensionOffset: playerSuspensionRef.current,
      });

      setAiCar({
        position: aiPositionRef.current.clone(),
        rotation: aiRotationRef.current,
        velocity: aiVelocityRef.current,
        laps: 1,
        suspensionOffset: 0,
      });

      setLapTime(Date.now() - startTimeRef.current);
    }, 16);

    return () => clearInterval(gameLoop);
  }, [raceStarted, currentLap, bestLapTime, weather, raceFinished]);

  const handleRaceComplete = async () => {
    if (raceFinished) return;
    
    setRaceFinished(true);
    
    try {
      const srGain = await completeAIRace.mutateAsync({
        trackId: 'aiTrack',
        input: { forward: true, backward: false }
      });
      
      setSrGained(Number(srGain));
      await progressSR.mutateAsync(BigInt(srGain));
      toast.success(`Race completed! You earned ${srGain} SR!`);
    } catch (error) {
      console.error('Failed to complete race:', error);
    }
  };

  const handleStartRace = () => {
    setRaceStarted(true);
    startTimeRef.current = Date.now();
    toast.success('AI Race started! Full Throttle! 🏁');
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${seconds}.${milliseconds.toString().padStart(2, '0')}s`;
  };

  const getWeatherIcon = (w: WeatherType) => {
    switch (w) {
      case 'sunny': return <Sun className="h-4 w-4" />;
      case 'overcast': return <Cloud className="h-4 w-4" />;
      case 'rainy': return <CloudRain className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-primary" />
              AI F1 Racing Track - Full Throttle
            </div>
            <Button variant="outline" onClick={onExit} size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Exit
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <Card className="bg-card/50">
              <CardContent className="pt-4 pb-2">
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Lap</p>
                    <p className="text-xl font-bold">{currentLap}/{totalLaps}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50">
              <CardContent className="pt-4 pb-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Time</p>
                    <p className="text-xl font-bold">{formatTime(lapTime)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50">
              <CardContent className="pt-4 pb-2">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Best</p>
                    <p className="text-xl font-bold">{bestLapTime ? formatTime(bestLapTime) : '--'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {!raceStarted && (
            <Card className="bg-card/50">
              <CardContent className="pt-4 pb-2">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Weather:</span>
                  <Select value={weather} onValueChange={(value) => setWeather(value as WeatherType)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sunny">
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          Sunny
                        </div>
                      </SelectItem>
                      <SelectItem value="overcast">
                        <div className="flex items-center gap-2">
                          <Cloud className="h-4 w-4" />
                          Overcast
                        </div>
                      </SelectItem>
                      <SelectItem value="rainy">
                        <div className="flex items-center gap-2">
                          <CloudRain className="h-4 w-4" />
                          Rainy
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {raceStarted && !raceFinished && (
            <Card className="bg-card/50">
              <CardContent className="pt-4 pb-2 space-y-3">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={raceAudio.toggleMute}
                    className="flex-shrink-0"
                  >
                    {raceAudio.isMuted ? (
                      <VolumeX className="h-5 w-5" />
                    ) : (
                      <Volume2 className="h-5 w-5" />
                    )}
                  </Button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">Music</span>
                      <Slider
                        value={[raceAudio.volume * 100]}
                        onValueChange={(values) => raceAudio.setVolume(values[0] / 100)}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-xs text-muted-foreground w-8 text-right">
                        {Math.round(raceAudio.volume * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">Engine</span>
                      <Slider
                        value={[engineVolume * 100]}
                        onValueChange={(values) => setEngineVolume(values[0] / 100)}
                        max={100}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-xs text-muted-foreground w-8 text-right">
                        {Math.round(engineVolume * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="relative w-full h-[500px] rounded-lg overflow-hidden border-2 border-border bg-gradient-to-b from-sky-400 to-sky-200">
            <Canvas 
              shadows 
              camera={{ position: [-60, 10, 0], fov: 75 }}
              gl={{ 
                outputColorSpace: THREE.SRGBColorSpace,
                toneMapping: THREE.ACESFilmicToneMapping,
                toneMappingExposure: 1.2
              }}
            >
              <Scene playerCar={playerCar} aiCar={aiCar} weather={weather} />
            </Canvas>

            {raceStarted && !raceFinished && (
              <div className="absolute bottom-4 left-4 bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
                <p className="font-semibold mb-1">Controls:</p>
                <p>W/↑ - Accelerate</p>
                <p>S/↓ - Brake</p>
                <p>A/← - Turn Left</p>
                <p>D/→ - Turn Right</p>
              </div>
            )}

            {raceStarted && !raceFinished && (
              <div className="absolute top-4 right-4 bg-black/70 text-white px-6 py-3 rounded-lg">
                <p className="text-xs text-gray-300">Speed</p>
                <p className="text-3xl font-bold">{Math.abs(Math.floor(playerVelocityRef.current))}</p>
                <p className="text-xs text-gray-300">km/h</p>
              </div>
            )}

            {raceStarted && !raceFinished && (
              <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg flex items-center gap-2">
                {getWeatherIcon(weather)}
                <span className="text-xs capitalize">{weather}</span>
              </div>
            )}

            {raceStarted && !raceFinished && raceAudio.isPlaying && (
              <div className="absolute top-16 left-4 bg-black/70 text-white px-3 py-2 rounded-lg flex items-center gap-2">
                <Volume2 className="h-4 w-4 animate-pulse" />
                <span className="text-xs">Music</span>
              </div>
            )}
          </div>

          {!raceStarted && (
            <Button onClick={handleStartRace} size="lg" className="w-full">
              <Flag className="mr-2 h-5 w-5" />
              Start AI Race
            </Button>
          )}

          {raceFinished && (
            <Card className="border-green-500 bg-green-500/10">
              <CardContent className="pt-6 text-center">
                <Trophy className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <h3 className="text-2xl font-bold mb-2">Race Complete!</h3>
                <p className="text-muted-foreground">Best Lap: {bestLapTime ? formatTime(bestLapTime) : '--'}</p>
                <Badge variant="default" className="text-lg px-4 py-2 mt-2">
                  SR Gained: +{srGained}
                </Badge>
                <Button onClick={onExit} className="mt-4">
                  Return to Menu
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
