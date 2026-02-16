import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useActor } from '../hooks/useActor';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useRaceAudio } from '../hooks/useRaceAudio';
import { useEngineAudio } from '../hooks/useEngineAudio';
import { Flag, Trophy, Clock, Users, Volume2, VolumeX, Cloud, CloudRain, Sun } from 'lucide-react';
import { toast } from 'sonner';
import type { Position, CarState } from '../backend';
import { RealisticSportsCoupeCar } from './race/RealisticSportsCoupeCar';
import { RealisticRoadCourseScene } from './race/RealisticRoadCourseScene';
import { useCarControls } from './race/useCarControls';
import { useChaseCamera } from './race/useChaseCamera';
import { RaceHUDOverlay } from './race/RaceHUDOverlay';

interface F1RaceTrackProps {
  trackId?: string;
  matchedPlayers?: string[];
}

interface PlayerCar {
  principal: string;
  position: THREE.Vector3;
  rotation: number;
  velocity: number;
  laps: number;
  isPlayer: boolean;
  suspensionOffset: number;
}

type WeatherType = 'sunny' | 'overcast' | 'rainy';

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

function DynamicLighting({ weather }: { weather: WeatherType }) {
  const directionalLightRef = useRef<THREE.DirectionalLight>(null);
  
  useFrame((state) => {
    if (directionalLightRef.current) {
      const time = state.clock.elapsedTime;
      directionalLightRef.current.position.x = 50 + Math.sin(time * 0.1) * 10;
      directionalLightRef.current.position.z = 25 + Math.cos(time * 0.1) * 10;
    }
  });

  const ambientIntensity = weather === 'sunny' ? 0.8 : weather === 'overcast' ? 0.6 : 0.5;
  const directionalIntensity = weather === 'sunny' ? 1.8 : weather === 'overcast' ? 1.0 : 0.7;
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
  players, 
  weather,
  onLapComplete,
}: { 
  players: PlayerCar[]; 
  weather: WeatherType;
  onLapComplete: () => void;
}) {
  const playerCar = players.find(p => p.isPlayer);
  const controls = useCarControls();
  const lastLapRef = useRef(0);

  useChaseCamera(
    playerCar?.position || new THREE.Vector3(),
    playerCar?.rotation || 0,
    playerCar?.velocity || 0,
    {
      followDistance: 12,
      followHeight: 5,
      smoothing: 0.12,
      lookAhead: 3,
    }
  );

  useEffect(() => {
    if (playerCar && playerCar.laps > lastLapRef.current) {
      lastLapRef.current = playerCar.laps;
      onLapComplete();
    }
  }, [playerCar?.laps, onLapComplete]);

  const fogColor = weather === 'sunny' ? '#87CEEB' : weather === 'overcast' ? '#6B7280' : '#4B5563';
  const fogNear = weather === 'rainy' ? 40 : 60;
  const fogFar = weather === 'rainy' ? 220 : 320;

  return (
    <>
      <color attach="background" args={[fogColor]} />
      <fog attach="fog" args={[fogColor, fogNear, fogFar]} />
      
      <DynamicLighting weather={weather} />
      
      <RealisticRoadCourseScene weather={weather} />
      
      {players.map((player, idx) => (
        <RealisticSportsCoupeCar
          key={player.principal}
          position={player.position}
          rotation={player.rotation}
          velocity={player.velocity}
          suspensionOffset={player.suspensionOffset}
          isPlayer={player.isPlayer}
        />
      ))}

      <AnimatedCrowd position={[75, 3, 0]} />
      <AnimatedCrowd position={[-75, 3, 0]} />
      <AnimatedCrowd position={[0, 3, 75]} />
      <AnimatedCrowd position={[0, 3, -75]} />

      <WavingFlags position={[-45, 5, 10]} />
      <WavingFlags position={[-45, 5, -10]} />
      <WavingFlags position={[45, 5, 10]} />
      <WavingFlags position={[45, 5, -10]} />

      {weather === 'rainy' && <RainEffect />}
    </>
  );
}

function RaceSimulation({ 
  players, 
  setPlayers, 
  weather,
  onLapComplete,
}: { 
  players: PlayerCar[]; 
  setPlayers: React.Dispatch<React.SetStateAction<PlayerCar[]>>;
  weather: WeatherType;
  onLapComplete: () => void;
}) {
  const controls = useCarControls();
  const { actor } = useActor();
  const { identity } = useInternetIdentity();

  useFrame((state, delta) => {
    setPlayers((prevPlayers) =>
      prevPlayers.map((player) => {
        if (player.isPlayer) {
          const maxSpeed = 80;
          const acceleration = 35;
          const braking = 50;
          const friction = 8;

          let newVelocity = player.velocity;

          if (controls.forward) {
            newVelocity += acceleration * delta;
          } else if (controls.backward) {
            newVelocity -= braking * delta;
          } else {
            newVelocity *= Math.pow(1 - friction / 100, delta * 60);
          }

          newVelocity = Math.max(-maxSpeed * 0.5, Math.min(maxSpeed, newVelocity));

          const speed = Math.abs(newVelocity);
          const steeringFactor = Math.max(0.3, 1 - speed / maxSpeed * 0.7);
          const turnSpeed = 2.5 * steeringFactor;

          let newRotation = player.rotation;
          if (Math.abs(newVelocity) > 1) {
            if (controls.left) {
              newRotation += turnSpeed * delta * (newVelocity > 0 ? 1 : -1);
            }
            if (controls.right) {
              newRotation -= turnSpeed * delta * (newVelocity > 0 ? 1 : -1);
            }
          }

          const newPosition = player.position.clone();
          newPosition.x += Math.sin(newRotation) * newVelocity * delta;
          newPosition.z += Math.cos(newRotation) * newVelocity * delta;

          const distanceFromCenter = Math.sqrt(newPosition.x ** 2 + newPosition.z ** 2);
          const innerRadius = 38;
          const outerRadius = 62;

          if (distanceFromCenter < innerRadius) {
            const angle = Math.atan2(newPosition.z, newPosition.x);
            newPosition.x = Math.cos(angle) * innerRadius;
            newPosition.z = Math.sin(angle) * innerRadius;
            newVelocity *= 0.7;
          } else if (distanceFromCenter > outerRadius) {
            const angle = Math.atan2(newPosition.z, newPosition.x);
            newPosition.x = Math.cos(angle) * outerRadius;
            newPosition.z = Math.sin(angle) * outerRadius;
            newVelocity *= 0.7;
          }

          const suspensionOffset = Math.sin(state.clock.elapsedTime * 15 + player.position.x) * 0.02 * (speed / maxSpeed);

          let newLaps = player.laps;
          const angleFromStart = Math.atan2(newPosition.z, newPosition.x);
          const prevAngleFromStart = Math.atan2(player.position.z, player.position.x);
          
          if (prevAngleFromStart < -Math.PI / 2 && angleFromStart > Math.PI / 2 && newPosition.x < -40) {
            newLaps += 1;
          }

          return {
            ...player,
            position: newPosition,
            rotation: newRotation,
            velocity: newVelocity,
            suspensionOffset,
            laps: newLaps,
          };
        } else {
          const aiSpeed = 25 + Math.sin(state.clock.elapsedTime * 0.5 + player.position.x) * 5;
          const trackRadius = 50;
          const newRotation = player.rotation + (aiSpeed / trackRadius) * delta;

          const newPosition = new THREE.Vector3(
            Math.cos(newRotation) * trackRadius,
            0,
            Math.sin(newRotation) * trackRadius
          );

          const suspensionOffset = Math.sin(state.clock.elapsedTime * 12) * 0.015;

          return {
            ...player,
            position: newPosition,
            rotation: newRotation + Math.PI / 2,
            velocity: aiSpeed,
            suspensionOffset,
          };
        }
      })
    );
  });

  return null;
}

export default function F1RaceTrack({ trackId = 'f1Track', matchedPlayers = [] }: F1RaceTrackProps) {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const [raceStarted, setRaceStarted] = useState(false);
  const [raceFinished, setRaceFinished] = useState(false);
  const [currentLap, setCurrentLap] = useState(1);
  const [totalLaps] = useState(3);
  const [weather, setWeather] = useState<WeatherType>('sunny');
  const [volume, setVolume] = useState(50);

  const raceAudio = useRaceAudio('/race-music.mp3', { autoPlay: false, loop: true, initialVolume: volume / 100 });
  const engineAudio = useEngineAudio();

  const [players, setPlayers] = useState<PlayerCar[]>([
    {
      principal: identity?.getPrincipal().toString() || 'player',
      position: new THREE.Vector3(-50, 0, 0),
      rotation: 0,
      velocity: 0,
      laps: 0,
      isPlayer: true,
      suspensionOffset: 0,
    },
    {
      principal: 'ai-1',
      position: new THREE.Vector3(50, 0, 0),
      rotation: Math.PI,
      velocity: 25,
      laps: 0,
      isPlayer: false,
      suspensionOffset: 0,
    },
  ]);

  const playerCar = players.find(p => p.isPlayer);

  useEffect(() => {
    if (raceStarted && playerCar) {
      const speed = Math.abs(playerCar.velocity);
      engineAudio.updateSpeed(speed);
    }
  }, [raceStarted, playerCar?.velocity, engineAudio]);

  useEffect(() => {
    raceAudio.setVolume(volume / 100);
  }, [volume, raceAudio]);

  useEffect(() => {
    // Auto-start race if coming from matchmaking
    if (matchedPlayers.length > 0 && !raceStarted) {
      handleStartRace();
    }
  }, [matchedPlayers]);

  const handleStartRace = async () => {
    if (!actor || !identity) {
      toast.error('Please log in to start racing');
      return;
    }

    try {
      await actor.startRace(trackId);
      setRaceStarted(true);
      setCurrentLap(1);
      setRaceFinished(false);
      raceAudio.play();
      engineAudio.start();
      toast.success('Race started! Good luck!');
    } catch (error) {
      console.error('Failed to start race:', error);
      toast.error('Failed to start race');
    }
  };

  const handleLapComplete = () => {
    if (currentLap < totalLaps) {
      setCurrentLap((prev) => prev + 1);
      toast.success(`Lap ${currentLap} complete!`);
    } else if (currentLap === totalLaps && !raceFinished) {
      handleFinishRace();
    }
  };

  const handleFinishRace = async () => {
    setRaceFinished(true);
    raceAudio.stop();
    engineAudio.stop();
    toast.success('Race finished! Well done!');

    if (actor) {
      try {
        await actor.finishRace(trackId);
      } catch (error) {
        console.error('Failed to finish race:', error);
      }
    }
  };

  const handleBackToMenu = () => {
    setRaceStarted(false);
    setRaceFinished(false);
    setCurrentLap(1);
    raceAudio.stop();
    engineAudio.stop();
    setPlayers([
      {
        principal: identity?.getPrincipal().toString() || 'player',
        position: new THREE.Vector3(-50, 0, 0),
        rotation: 0,
        velocity: 0,
        laps: 0,
        isPlayer: true,
        suspensionOffset: 0,
      },
      {
        principal: 'ai-1',
        position: new THREE.Vector3(50, 0, 0),
        rotation: Math.PI,
        velocity: 25,
        laps: 0,
        isPlayer: false,
        suspensionOffset: 0,
      },
    ]);
  };

  if (!raceStarted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 p-4">
        <Card className="w-full max-w-md border-purple-500/30 bg-black/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl text-white">
              <Flag className="h-6 w-6 text-purple-400" />
              F1 Race Track
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium text-white">Weather Conditions</label>
              <Select value={weather} onValueChange={(value) => setWeather(value as WeatherType)}>
                <SelectTrigger className="border-purple-500/30 bg-black/20 text-white">
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

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white">Music Volume</label>
                <Badge variant="outline" className="border-purple-500/30 text-white">
                  {volume}%
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={raceAudio.toggleMute}
                  className="text-white hover:bg-purple-500/20"
                >
                  {raceAudio.isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
                <Slider
                  value={[volume]}
                  onValueChange={(value) => setVolume(value[0])}
                  max={100}
                  step={1}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2 rounded-lg border border-purple-500/30 bg-purple-500/10 p-4">
              <div className="flex items-center justify-between text-sm text-white">
                <span>Total Laps:</span>
                <Badge variant="secondary">{totalLaps}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm text-white">
                <span>Opponents:</span>
                <Badge variant="secondary">{matchedPlayers.length > 0 ? matchedPlayers.length : 1} AI</Badge>
              </div>
            </div>

            <Button
              onClick={handleStartRace}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-lg font-bold hover:from-purple-700 hover:to-blue-700"
              size="lg"
            >
              <Flag className="mr-2 h-5 w-5" />
              Start Race
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full">
      <Canvas
        shadows
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        camera={{ position: [0, 10, 20], fov: 75 }}
      >
        <Scene players={players} weather={weather} onLapComplete={handleLapComplete} />
        <RaceSimulation players={players} setPlayers={setPlayers} weather={weather} onLapComplete={handleLapComplete} />
      </Canvas>

      <RaceHUDOverlay
        currentLap={currentLap}
        totalLaps={totalLaps}
        speed={playerCar?.velocity || 0}
      />

      {raceFinished && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <Card className="w-full max-w-md border-purple-500/30 bg-black/60 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl text-white">
                <Trophy className="h-6 w-6 text-yellow-400" />
                Race Complete!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-center">
                <p className="text-lg text-white">Congratulations!</p>
                <p className="text-sm text-gray-300">You completed {totalLaps} laps</p>
              </div>
              <Button
                onClick={handleBackToMenu}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                Back to Menu
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
