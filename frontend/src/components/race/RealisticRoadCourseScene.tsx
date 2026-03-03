import { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface RealisticRoadCourseSceneProps {
  weather?: 'sunny' | 'overcast' | 'rainy';
}

// ─── Track Definition ─────────────────────────────────────────────────────────
// A closed circuit inspired by the reference image:
// Long straight → hairpin → S-curves → chicane → back straight → hairpin → finish
export const TRACK_HALF_WIDTH = 6; // half-width of drivable surface

export const TRACK_WAYPOINTS: [number, number, number][] = [
  // Start/finish straight (left side)
  [-60, 0, -10],
  [-60, 0, 10],
  [-55, 0, 20],
  // Turn 1 – gentle right
  [-40, 0, 30],
  [-20, 0, 35],
  // S-curve section
  [0, 0, 30],
  [15, 0, 20],
  [20, 0, 5],
  [15, 0, -10],
  // Hairpin turn (right side)
  [30, 0, -25],
  [45, 0, -30],
  [60, 0, -25],
  [65, 0, -10],
  [60, 0, 5],
  // Back section
  [45, 0, 15],
  [30, 0, 20],
  [20, 0, 30],
  // Second hairpin (top)
  [10, 0, 45],
  [0, 0, 55],
  [-15, 0, 55],
  [-30, 0, 45],
  [-40, 0, 30],
  // Chicane
  [-50, 0, 15],
  [-58, 0, 5],
  [-60, 0, -5],
  [-60, 0, -10],
];

// Build a smooth closed CatmullRom curve from waypoints
export function buildTrackCurve(): THREE.CatmullRomCurve3 {
  const points = TRACK_WAYPOINTS.map(([x, y, z]) => new THREE.Vector3(x, y, z));
  return new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.5);
}

// Get the closest point on the track curve to a given position
export function getClosestTrackPoint(
  pos: THREE.Vector3,
  curve: THREE.CatmullRomCurve3,
  samples = 200
): { point: THREE.Vector3; t: number; tangent: THREE.Vector3 } {
  let minDist = Infinity;
  let bestT = 0;
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const p = curve.getPoint(t);
    const d = pos.distanceTo(p);
    if (d < minDist) {
      minDist = d;
      bestT = t;
    }
  }
  return {
    point: curve.getPoint(bestT),
    t: bestT,
    tangent: curve.getTangent(bestT),
  };
}

// ─── Track Surface ────────────────────────────────────────────────────────────
function TrackSurface({ weather }: { weather: 'sunny' | 'overcast' | 'rainy' }) {
  const [asphaltTex, setAsphaltTex] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load('/assets/generated/asphalt-realistic.dim_2048x2048.png', (tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(4, 60);
      setAsphaltTex(tex);
    });
  }, []);

  const { geometry, curbGeometry } = useMemo(() => {
    const curve = buildTrackCurve();
    const segments = 300;
    const halfW = TRACK_HALF_WIDTH;
    const curbW = 1.2;

    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const curbPositions: number[] = [];
    const curbUvs: number[] = [];
    const curbIndices: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const point = curve.getPoint(t);
      const tangent = curve.getTangent(t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      // Main track surface
      const left = point.clone().addScaledVector(normal, -halfW);
      const right = point.clone().addScaledVector(normal, halfW);
      positions.push(left.x, 0.01, left.z);
      positions.push(right.x, 0.01, right.z);
      uvs.push(0, t * 60);
      uvs.push(1, t * 60);

      // Curb strips (inner and outer)
      const curbLeft0 = point.clone().addScaledVector(normal, -halfW);
      const curbLeft1 = point.clone().addScaledVector(normal, -(halfW + curbW));
      const curbRight0 = point.clone().addScaledVector(normal, halfW);
      const curbRight1 = point.clone().addScaledVector(normal, halfW + curbW);

      curbPositions.push(curbLeft1.x, 0.02, curbLeft1.z);
      curbPositions.push(curbLeft0.x, 0.02, curbLeft0.z);
      curbPositions.push(curbRight0.x, 0.02, curbRight0.z);
      curbPositions.push(curbRight1.x, 0.02, curbRight1.z);
      const cu = t * 60;
      curbUvs.push(0, cu, 0.5, cu, 0.5, cu, 1, cu);
    }

    for (let i = 0; i < segments; i++) {
      const a = i * 2;
      const b = a + 1;
      const c = a + 2;
      const d = a + 3;
      indices.push(a, b, c, b, d, c);

      const ca = i * 4;
      curbIndices.push(ca, ca + 1, ca + 4, ca + 1, ca + 5, ca + 4);
      curbIndices.push(ca + 2, ca + 3, ca + 6, ca + 3, ca + 7, ca + 6);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const curbGeo = new THREE.BufferGeometry();
    curbGeo.setAttribute('position', new THREE.Float32BufferAttribute(curbPositions, 3));
    curbGeo.setAttribute('uv', new THREE.Float32BufferAttribute(curbUvs, 2));
    curbGeo.setIndex(curbIndices);
    curbGeo.computeVertexNormals();

    return { geometry: geo, curbGeometry: curbGeo };
  }, []);

  const [curbTex, setCurbTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load('/assets/generated/curb-red-white-realistic.dim_2048x256.png', (tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(1, 60);
      setCurbTex(tex);
    });
  }, []);

  const roughness = weather === 'rainy' ? 0.2 : 0.82;
  const metalness = weather === 'rainy' ? 0.22 : 0.04;

  return (
    <group>
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial
          map={asphaltTex}
          roughness={roughness}
          metalness={metalness}
          color="#2a2a2a"
        />
      </mesh>
      <mesh geometry={curbGeometry} receiveShadow>
        <meshStandardMaterial map={curbTex} roughness={0.7} />
      </mesh>
    </group>
  );
}

// ─── White Lane Markings ──────────────────────────────────────────────────────
function LaneMarkings() {
  const geometry = useMemo(() => {
    const curve = buildTrackCurve();
    const segments = 300;
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    // Center dashed line
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const point = curve.getPoint(t);
      const tangent = curve.getTangent(t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      // Center line (dashed – only every other segment)
      const dashOn = Math.floor(t * 120) % 2 === 0;
      if (dashOn) {
        const lw = 0.18;
        const l = point.clone().addScaledVector(normal, -lw);
        const r = point.clone().addScaledVector(normal, lw);
        const base = positions.length / 3;
        positions.push(l.x, 0.03, l.z, r.x, 0.03, r.z);
        uvs.push(0, t * 60, 1, t * 60);
        if (i < segments) {
          indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial color="#ffffff" roughness={0.9} transparent opacity={0.85} />
    </mesh>
  );
}

// ─── Gravel / Runoff Areas ────────────────────────────────────────────────────
function GravelRunoff() {
  const [gravelTex, setGravelTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    // Use grass texture tinted brown for gravel
    loader.load('/assets/generated/grass-verge.dim_2048x2048.png', (tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(8, 8);
      setGravelTex(tex);
    });
  }, []);

  const geometry = useMemo(() => {
    const curve = buildTrackCurve();
    const segments = 300;
    const halfW = TRACK_HALF_WIDTH;
    const gravelW = 5;

    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const point = curve.getPoint(t);
      const tangent = curve.getTangent(t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const curbW = 1.2;
      const inner0 = point.clone().addScaledVector(normal, -(halfW + curbW));
      const inner1 = point.clone().addScaledVector(normal, -(halfW + curbW + gravelW));
      const outer0 = point.clone().addScaledVector(normal, halfW + curbW);
      const outer1 = point.clone().addScaledVector(normal, halfW + curbW + gravelW);

      positions.push(inner1.x, -0.01, inner1.z);
      positions.push(inner0.x, -0.01, inner0.z);
      positions.push(outer0.x, -0.01, outer0.z);
      positions.push(outer1.x, -0.01, outer1.z);

      const u = t * 60;
      uvs.push(0, u, 0.33, u, 0.66, u, 1, u);
    }

    for (let i = 0; i < segments; i++) {
      const a = i * 4;
      indices.push(a, a + 1, a + 4, a + 1, a + 5, a + 4);
      indices.push(a + 2, a + 3, a + 6, a + 3, a + 7, a + 6);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial map={gravelTex} color="#8B6914" roughness={0.98} />
    </mesh>
  );
}

// ─── Grass Ground ─────────────────────────────────────────────────────────────
function GrassGround() {
  const [grassTex, setGrassTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load('/assets/generated/grass-verge.dim_2048x2048.png', (tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(30, 30);
      setGrassTex(tex);
    });
  }, []);

  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
      <planeGeometry args={[300, 300]} />
      <meshStandardMaterial map={grassTex} roughness={0.95} color="#3a6b1a" />
    </mesh>
  );
}

// ─── Barriers ─────────────────────────────────────────────────────────────────
function Barriers() {
  const [guardrailTex, setGuardrailTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load('/assets/generated/guardrail-texture.dim_2048x512.png', (tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(4, 1);
      setGuardrailTex(tex);
    });
  }, []);

  const barrierData = useMemo(() => {
    const curve = buildTrackCurve();
    const count = 180;
    const halfW = TRACK_HALF_WIDTH + 1.2 + 5 + 0.5; // curb + gravel + offset
    const items: { pos: THREE.Vector3; rot: number }[] = [];

    for (let i = 0; i < count; i++) {
      const t = i / count;
      const point = curve.getPoint(t);
      const tangent = curve.getTangent(t).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const angle = Math.atan2(tangent.x, tangent.z);

      // Outer barrier
      items.push({
        pos: point.clone().addScaledVector(normal, halfW).setY(0.5),
        rot: angle,
      });
      // Inner barrier
      items.push({
        pos: point.clone().addScaledVector(normal, -halfW).setY(0.5),
        rot: angle,
      });
    }
    return items;
  }, []);

  return (
    <group>
      {barrierData.map((b, i) => (
        <mesh key={i} position={[b.pos.x, b.pos.y, b.pos.z]} rotation={[0, b.rot, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.5, 1.0, 0.25]} />
          <meshStandardMaterial
            map={guardrailTex}
            color={i % 4 < 2 ? '#cccccc' : '#cc2222'}
            roughness={0.5}
            metalness={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── Start / Finish Line ──────────────────────────────────────────────────────
function StartFinishLine() {
  const curve = useMemo(() => buildTrackCurve(), []);
  const point = curve.getPoint(0);
  const tangent = curve.getTangent(0).normalize();
  const angle = Math.atan2(tangent.x, tangent.z);

  return (
    <group position={[point.x, 0.04, point.z]} rotation={[0, angle, 0]}>
      {/* Checkered pattern */}
      {[...Array(6)].map((_, col) =>
        [0, 1].map((row) => (
          <mesh
            key={`sf-${col}-${row}`}
            position={[(col - 2.5) * 2, 0, row === 0 ? -0.5 : 0.5]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[2, 1]} />
            <meshStandardMaterial
              color={(col + row) % 2 === 0 ? '#ffffff' : '#000000'}
              roughness={0.9}
            />
          </mesh>
        ))
      )}
    </group>
  );
}

// ─── Large "6" Infield Marker ─────────────────────────────────────────────────
function InfieldNumber() {
  // Place the "6" in the infield center area
  // Build digit geometry procedurally using boxes
  const segments: { pos: [number, number, number]; size: [number, number, number]; rot?: number }[] = [
    // Top arc of 6 (partial)
    { pos: [0, 0, -6], size: [8, 0.3, 1.5] },
    // Left vertical top
    { pos: [-4, 0, -3], size: [1.5, 0.3, 6] },
    // Middle bar
    { pos: [0, 0, 0], size: [8, 0.3, 1.5] },
    // Left vertical bottom
    { pos: [-4, 0, 3.5], size: [1.5, 0.3, 6] },
    // Right vertical bottom
    { pos: [4, 0, 3.5], size: [1.5, 0.3, 6] },
    // Bottom bar
    { pos: [0, 0, 7], size: [8, 0.3, 1.5] },
  ];

  return (
    <group position={[-10, 0.05, 10]}>
      {segments.map((s, i) => (
        <mesh key={i} position={s.pos} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[s.size[0], s.size[2]]} />
          <meshStandardMaterial color="#e8e8e8" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Trees ────────────────────────────────────────────────────────────────────
function Tree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh castShadow position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.25, 0.35, 2.4, 8]} />
        <meshStandardMaterial color="#5c3d1e" roughness={0.95} />
      </mesh>
      {/* Canopy layers */}
      <mesh castShadow position={[0, 3.5, 0]}>
        <coneGeometry args={[2.2, 3.5, 8]} />
        <meshStandardMaterial color="#2d6e1a" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 5.2, 0]}>
        <coneGeometry args={[1.6, 2.8, 8]} />
        <meshStandardMaterial color="#3a8a22" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 6.5, 0]}>
        <coneGeometry args={[1.0, 2.0, 8]} />
        <meshStandardMaterial color="#4aaa2a" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Trees() {
  const treePositions: [number, number, number][] = [
    // Infield trees
    [-5, 0, -15], [5, 0, -20], [15, 0, -15], [20, 0, -5],
    [10, 0, 10], [0, 0, 15], [-10, 0, 20], [-20, 0, 10],
    [-15, 0, 0], [25, 0, 10], [30, 0, 0], [25, 0, -15],
    // Outer perimeter trees
    [-80, 0, -40], [-80, 0, 0], [-80, 0, 40], [-80, 0, 80],
    [-40, 0, -80], [0, 0, -80], [40, 0, -80], [80, 0, -80],
    [90, 0, -40], [90, 0, 0], [90, 0, 40], [90, 0, 80],
    [40, 0, 90], [0, 0, 90], [-40, 0, 90],
    // Corner clusters
    [-70, 0, -60], [-60, 0, -70], [70, 0, -60], [60, 0, -70],
    [70, 0, 70], [60, 0, 75], [-70, 0, 70],
  ];

  return (
    <group>
      {treePositions.map((pos, i) => (
        <Tree key={i} position={pos} />
      ))}
    </group>
  );
}

// ─── Pit Building ─────────────────────────────────────────────────────────────
function PitBuilding() {
  return (
    <group position={[-65, 0, -30]}>
      {/* Main building */}
      <mesh castShadow receiveShadow position={[0, 3, 0]}>
        <boxGeometry args={[20, 6, 8]} />
        <meshStandardMaterial color="#c8c8c8" roughness={0.8} metalness={0.1} />
      </mesh>
      {/* Roof */}
      <mesh castShadow position={[0, 6.5, 0]}>
        <boxGeometry args={[21, 0.4, 9]} />
        <meshStandardMaterial color="#888888" roughness={0.7} />
      </mesh>
      {/* Garage doors */}
      {[-6, -2, 2, 6].map((x, i) => (
        <mesh key={i} position={[x, 1.5, 4.1]}>
          <boxGeometry args={[3, 3, 0.1]} />
          <meshStandardMaterial color="#444444" roughness={0.6} />
        </mesh>
      ))}
      {/* Pit lane awning */}
      <mesh castShadow position={[0, 5, 6]}>
        <boxGeometry args={[22, 0.3, 4]} />
        <meshStandardMaterial color="#cc2222" roughness={0.7} />
      </mesh>
      {/* Support columns */}
      {[-9, -3, 3, 9].map((x, i) => (
        <mesh key={i} castShadow position={[x, 2.5, 8]}>
          <cylinderGeometry args={[0.2, 0.2, 5, 8]} />
          <meshStandardMaterial color="#999999" roughness={0.6} metalness={0.3} />
        </mesh>
      ))}
      {/* Pit lane surface */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 10]}>
        <planeGeometry args={[22, 12]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.85} />
      </mesh>
    </group>
  );
}

// ─── Grandstand ───────────────────────────────────────────────────────────────
function Grandstand({ position, rotation }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation ?? 0, 0]}>
      {/* Seating tiers */}
      {[0, 1, 2].map((tier) => (
        <mesh key={tier} castShadow receiveShadow position={[0, tier * 2 + 1, tier * 2]}>
          <boxGeometry args={[18, 2, 3]} />
          <meshStandardMaterial color={tier % 2 === 0 ? '#cc2222' : '#cccccc'} roughness={0.8} />
        </mesh>
      ))}
      {/* Roof */}
      <mesh castShadow position={[0, 8, 4]}>
        <boxGeometry args={[20, 0.4, 6]} />
        <meshStandardMaterial color="#888888" roughness={0.7} metalness={0.2} />
      </mesh>
    </group>
  );
}

// ─── Main Scene Component ─────────────────────────────────────────────────────
export function RealisticRoadCourseScene({ weather = 'sunny' }: RealisticRoadCourseSceneProps) {
  return (
    <group>
      {/* Base grass ground */}
      <GrassGround />

      {/* Gravel runoff zones */}
      <GravelRunoff />

      {/* Main asphalt track surface + curbs */}
      <TrackSurface weather={weather} />

      {/* White lane markings */}
      <LaneMarkings />

      {/* Barriers along track edges */}
      <Barriers />

      {/* Start/finish line */}
      <StartFinishLine />

      {/* Large "6" infield number */}
      <InfieldNumber />

      {/* Trees scattered around */}
      <Trees />

      {/* Pit building */}
      <PitBuilding />

      {/* Grandstands */}
      <Grandstand position={[-55, 0, -45]} rotation={0.2} />
      <Grandstand position={[50, 0, -50]} rotation={-0.3} />
      <Grandstand position={[75, 0, 20]} rotation={Math.PI / 2} />
    </group>
  );
}
