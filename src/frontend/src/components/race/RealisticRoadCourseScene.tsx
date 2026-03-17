import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";

interface RealisticRoadCourseSceneProps {
  weather?: "sunny" | "overcast" | "rainy";
}

// ─── Track Definition ─────────────────────────────────────────────────────────
// A long closed circuit inspired by Spa-Francorchamps / Silverstone:
// Long main straight → Turn 1 hairpin → Esses → Raidillon climb (flat) →
// Kemmel straight → Bus Stop chicane → back hairpin → Pouhon sweepers →
// Stadium section → long loop → return to pit straight
export const TRACK_HALF_WIDTH = 6; // half-width of drivable surface

export const TRACK_WAYPOINTS: [number, number, number][] = [
  // ── Start / Finish straight ────────────────────────────────────────────────
  [-220, 0, -10], // 0  grid start
  [-200, 0, -10],
  [-180, 0, -10],
  [-160, 0, -10],
  [-140, 0, -10],
  [-120, 0, -10], // 5  end of pit straight
  // ── Turn 1 – sharp right hairpin ─────────────────────────────────────────
  [-100, 0, -10],
  [-85, 0, -20],
  [-75, 0, -40],
  [-75, 0, -60],
  [-85, 0, -75], // 10 apex
  [-100, 0, -85],
  [-120, 0, -85],
  // ── Eau Rouge / Raidillon S (flat) ───────────────────────────────────────
  [-140, 0, -80],
  [-155, 0, -65],
  [-160, 0, -50], // 15
  [-155, 0, -35],
  [-145, 0, -20],
  // ── Kemmel long straight ─────────────────────────────────────────────────
  [-140, 0, 10],
  [-140, 0, 40],
  [-140, 0, 70], // 20
  [-140, 0, 100],
  [-140, 0, 130],
  [-140, 0, 160],
  // ── Les Combes chicane ────────────────────────────────────────────────────
  [-130, 0, 180],
  [-115, 0, 185], // 25 right of chicane
  [-100, 0, 178],
  [-90, 0, 170],
  [-80, 0, 178],
  [-68, 0, 185], // 29 left of chicane
  [-55, 0, 180],
  // ── Descending sweep to Malmedy ──────────────────────────────────────────
  [-40, 0, 165],
  [-30, 0, 150],
  [-25, 0, 130], // 33
  [-20, 0, 110],
  // ── Rivage / Pouhon long right-hander ────────────────────────────────────
  [-10, 0, 95],
  [10, 0, 85], // 36
  [35, 0, 80],
  [65, 0, 80],
  [90, 0, 85],
  [110, 0, 95], // 40
  [125, 0, 110],
  [130, 0, 130],
  [125, 0, 150],
  [110, 0, 165], // 44
  // ── Back hairpin (Campus corner) ─────────────────────────────────────────
  [95, 0, 178],
  [75, 0, 185],
  [55, 0, 178], // 47
  [45, 0, 165],
  [45, 0, 148],
  // ── Bus Stop sector (fast chicane) ───────────────────────────────────────
  [55, 0, 130],
  [70, 0, 120], // 51
  [85, 0, 125],
  [90, 0, 140],
  [80, 0, 152],
  // ── Blanchimont high-speed sweep ─────────────────────────────────────────
  [65, 0, 160], // 55
  [50, 0, 165],
  [30, 0, 162],
  [10, 0, 152],
  [-5, 0, 138], // 59
  [-10, 0, 120],
  // ── Stadium / inner loop ─────────────────────────────────────────────────
  [-5, 0, 100],
  [10, 0, 88],
  [25, 0, 82], // 63
  [40, 0, 82],
  [55, 0, 72],
  [60, 0, 58],
  [55, 0, 44], // 67
  [40, 0, 38],
  [20, 0, 38],
  [5, 0, 44],
  [-5, 0, 58], // 71
  [-5, 0, 74],
  // ── Sector 3 fast run back to pit straight ───────────────────────────────
  [-15, 0, 58],
  [-20, 0, 40],
  [-20, 0, 20], // 75
  [-25, 0, 5],
  [-30, 0, -10],
  [-40, 0, -20],
  [-55, 0, -22], // 79
  [-75, 0, -18],
  [-95, 0, -10],
  [-115, 0, -5],
  [-135, 0, -8], // 83
  [-155, 0, -10],
  [-175, 0, -10],
  [-200, 0, -10],
  [-220, 0, -10], // 87 – closes back to pt 0
];

// Build a smooth closed CatmullRom curve from waypoints
export function buildTrackCurve(): THREE.CatmullRomCurve3 {
  const points = TRACK_WAYPOINTS.map(([x, y, z]) => new THREE.Vector3(x, y, z));
  return new THREE.CatmullRomCurve3(points, true, "catmullrom", 0.5);
}

// Get the closest point on the track curve to a given position
export function getClosestTrackPoint(
  pos: THREE.Vector3,
  curve: THREE.CatmullRomCurve3,
  samples = 200,
): { point: THREE.Vector3; t: number; tangent: THREE.Vector3 } {
  let minDist = Number.POSITIVE_INFINITY;
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
function TrackSurface({
  weather,
}: { weather: "sunny" | "overcast" | "rainy" }) {
  const [asphaltTex, setAsphaltTex] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      "/assets/generated/asphalt-realistic.dim_2048x2048.png",
      (tex) => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(4, 60);
        setAsphaltTex(tex);
      },
    );
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
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const curbGeo = new THREE.BufferGeometry();
    curbGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(curbPositions, 3),
    );
    curbGeo.setAttribute("uv", new THREE.Float32BufferAttribute(curbUvs, 2));
    curbGeo.setIndex(curbIndices);
    curbGeo.computeVertexNormals();

    return { geometry: geo, curbGeometry: curbGeo };
  }, []);

  const [curbTex, setCurbTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      "/assets/generated/curb-red-white-realistic.dim_2048x256.png",
      (tex) => {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(1, 60);
        setCurbTex(tex);
      },
    );
  }, []);

  const roughness = weather === "rainy" ? 0.2 : 0.82;
  const metalness = weather === "rainy" ? 0.22 : 0.04;

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
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial
        color="#ffffff"
        roughness={0.9}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
}

// ─── Gravel / Runoff Areas ────────────────────────────────────────────────────
function GravelRunoff() {
  const [gravelTex, setGravelTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    // Use grass texture tinted brown for gravel
    loader.load("/assets/generated/grass-verge.dim_2048x2048.png", (tex) => {
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
      const inner1 = point
        .clone()
        .addScaledVector(normal, -(halfW + curbW + gravelW));
      const outer0 = point.clone().addScaledVector(normal, halfW + curbW);
      const outer1 = point
        .clone()
        .addScaledVector(normal, halfW + curbW + gravelW);

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
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
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
    loader.load("/assets/generated/grass-verge.dim_2048x2048.png", (tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(30, 30);
      setGrassTex(tex);
    });
  }, []);

  return (
    <mesh
      receiveShadow
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.05, 0]}
    >
      <planeGeometry args={[1200, 1200]} />
      <meshStandardMaterial map={grassTex} roughness={0.95} color="#3a6b1a" />
    </mesh>
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
              color={(col + row) % 2 === 0 ? "#ffffff" : "#000000"}
              roughness={0.9}
            />
          </mesh>
        )),
      )}
    </group>
  );
}

// ─── Large "6" Infield Marker ─────────────────────────────────────────────────
function InfieldNumber() {
  // Place the "6" in the infield center area
  // Build digit geometry procedurally using boxes
  const segments: {
    pos: [number, number, number];
    size: [number, number, number];
    rot?: number;
  }[] = [
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
    <group position={[-80, 0.05, 70]}>
      {segments.map((s) => (
        <mesh
          key={`seg-${s.pos[0]}-${s.pos[2]}`}
          position={s.pos}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
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
    // ── Outer perimeter (north/south fringes) ─────────────────────────────
    [-250, 0, -120],
    [-200, 0, -120],
    [-150, 0, -120],
    [-100, 0, -120],
    [-50, 0, -120],
    [0, 0, -120],
    [50, 0, -120],
    [100, 0, -120],
    [150, 0, -120],
    [200, 0, -120],
    [-250, 0, 230],
    [-200, 0, 230],
    [-150, 0, 230],
    [-100, 0, 230],
    [-50, 0, 230],
    [0, 0, 230],
    [50, 0, 230],
    [100, 0, 230],
    [150, 0, 230],
    // ── Outer perimeter (east/west) ───────────────────────────────────────
    [180, 0, -80],
    [180, 0, -40],
    [180, 0, 0],
    [180, 0, 40],
    [180, 0, 80],
    [180, 0, 120],
    [180, 0, 160],
    [-280, 0, -80],
    [-280, 0, -40],
    [-280, 0, 0],
    [-280, 0, 40],
    [-280, 0, 80],
    // ── Infield clusters (between track sectors) ──────────────────────────
    // Between pit straight and Kemmel
    [-120, 0, 20],
    [-110, 0, 40],
    [-115, 0, 60],
    [-105, 0, 80],
    [-115, 0, 100],
    [-110, 0, 120],
    // Infield of Pouhon sweeper
    [50, 0, 110],
    [60, 0, 125],
    [50, 0, 140],
    [35, 0, 130],
    [25, 0, 115],
    [40, 0, 100],
    // Stadium section infield
    [15, 0, 55],
    [25, 0, 60],
    [30, 0, 50],
    [15, 0, 70],
    [5, 0, 60],
    // Corner 1 hairpin surrounds
    [-60, 0, -95],
    [-75, 0, -100],
    [-90, 0, -100],
    [-105, 0, -90],
    [-100, 0, -72],
    // Kemmel straight tree line
    [-165, 0, 10],
    [-165, 0, 40],
    [-165, 0, 70],
    [-165, 0, 100],
    [-165, 0, 130],
    [-165, 0, 158],
    // Back sector tree line
    [145, 0, 110],
    [145, 0, 140],
    [145, 0, 160],
    [110, 0, 180],
    [80, 0, 195],
    // Far corners
    [-260, 0, -110],
    [-260, 0, 210],
    [170, 0, 210],
    [170, 0, -110],
  ];

  return (
    <group>
      {treePositions.map((pos) => (
        <Tree key={`tree-${pos[0]}-${pos[2]}`} position={pos} />
      ))}
    </group>
  );
}

// ─── Pit Lane Complex (Indianapolis-style) ────────────────────────────────────
// Main straight runs along z=-10 from x=-220 to x=-120 (left to right).
// Pit side is toward negative-z (south side).
function PitLaneComplex() {
  // 8 garages evenly spaced from x=-210 to x=-130
  const garageXPositions = Array.from(
    { length: 8 },
    (_, i) => -210 + i * (80 / 7),
  );

  // Crew figure positions per garage (3 per box)
  const crewOffsets: [number, number][] = [
    [-2.5, 0],
    [0, 0.5],
    [2.5, 0],
  ];

  return (
    <group>
      {/* ── 1. Pit Wall (concrete barrier between track and pit lane) ────── */}
      {/* Left segment: x=-215 to x=-164 */}
      <mesh castShadow receiveShadow position={[-189.5, 0.45, -17]}>
        <boxGeometry args={[51, 0.9, 0.5]} />
        <meshStandardMaterial color="#d0cfc8" roughness={0.85} />
      </mesh>
      {/* Top cap left */}
      <mesh position={[-189.5, 0.92, -17]}>
        <boxGeometry args={[51, 0.08, 0.55]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </mesh>
      {/* Right segment: x=-152 to x=-125 */}
      <mesh castShadow receiveShadow position={[-138.5, 0.45, -17]}>
        <boxGeometry args={[27, 0.9, 0.5]} />
        <meshStandardMaterial color="#d0cfc8" roughness={0.85} />
      </mesh>
      {/* Top cap right */}
      <mesh position={[-138.5, 0.92, -17]}>
        <boxGeometry args={[27, 0.08, 0.55]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </mesh>

      {/* ── 2. Pit Lane Surface ───────────────────────────────────────────── */}
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[-170, 0.02, -23]}
      >
        <planeGeometry args={[90, 10]} />
        <meshStandardMaterial color="#2e2e2e" roughness={0.88} />
      </mesh>
      {/* White center lane marking */}
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[-170, 0.03, -23]}
      >
        <planeGeometry args={[90, 0.2]} />
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.7}
          opacity={0.9}
          transparent
        />
      </mesh>

      {/* ── 3. Pit Box Garages ────────────────────────────────────────────── */}
      {garageXPositions.map((gx, i) => (
        <group key={`garage-${Math.round(gx)}`} position={[gx, 0, -33]}>
          {/* Main garage body */}
          <mesh castShadow receiveShadow position={[0, 2, 0]}>
            <boxGeometry args={[9.5, 4, 6]} />
            <meshStandardMaterial
              color="#1a1a2e"
              roughness={0.75}
              metalness={0.1}
            />
          </mesh>
          {/* Garage door panel */}
          <mesh position={[0, 1.8, 3.05]}>
            <boxGeometry args={[7.5, 3.2, 0.1]} />
            <meshStandardMaterial color="#3a3a4a" roughness={0.6} />
          </mesh>
          {/* Door horizontal slats */}
          {[0, 0.6, 1.2, 1.8, 2.4, 3.0].map((sy, _si) => (
            <mesh key={`slat-${sy}`} position={[0, sy + 0.3, 3.08]}>
              <boxGeometry args={[7.5, 0.08, 0.05]} />
              <meshStandardMaterial color="#555566" roughness={0.5} />
            </mesh>
          ))}
          {/* Team awning (alternating red / navy) */}
          <mesh castShadow position={[0, 4.15, 5.5]}>
            <boxGeometry args={[9.8, 0.25, 5]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? "#cc2222" : "#002244"}
              roughness={0.7}
            />
          </mesh>
          {/* Awning support columns (front) */}
          {[-4, 4].map((cx, _ci) => (
            <mesh key={`acol-${cx}`} castShadow position={[cx, 2, 8]}>
              <cylinderGeometry args={[0.15, 0.15, 4, 8]} />
              <meshStandardMaterial
                color="#888899"
                roughness={0.5}
                metalness={0.4}
              />
            </mesh>
          ))}
          {/* Sponsor color strip on front */}
          <mesh position={[0, 3.6, 3.06]}>
            <boxGeometry args={[7.5, 0.6, 0.08]} />
            <meshStandardMaterial
              color={
                i % 3 === 0 ? "#cc2222" : i % 3 === 1 ? "#002244" : "#22aa44"
              }
              roughness={0.6}
            />
          </mesh>
        </group>
      ))}

      {/* ── 4. Pit Crew Figures ───────────────────────────────────────────── */}
      {garageXPositions.map((gx, _i) =>
        crewOffsets.map(([cx, cz], _j) => (
          <group
            key={`crew-${Math.round(gx)}-${cx}-${cz}`}
            position={[gx + cx, 0, -26 + cz]}
          >
            {/* Body */}
            <mesh castShadow position={[0, 0.9, 0]}>
              <cylinderGeometry args={[0.22, 0.22, 1.1, 8]} />
              <meshStandardMaterial color="#ff6600" roughness={0.8} />
            </mesh>
            {/* Head */}
            <mesh castShadow position={[0, 1.65, 0]}>
              <sphereGeometry args={[0.2, 8, 8]} />
              <meshStandardMaterial color="#ffcc99" roughness={0.7} />
            </mesh>
            {/* Helmet */}
            <mesh castShadow position={[0, 1.72, 0]}>
              <sphereGeometry args={[0.22, 8, 8]} />
              <meshStandardMaterial
                color="#cc2222"
                roughness={0.5}
                metalness={0.3}
              />
            </mesh>
          </group>
        )),
      )}

      {/* ── 5. Pagoda / Control Tower ─────────────────────────────────────── */}
      <group position={[-155, 0, -45]}>
        {/* Base tier */}
        <mesh castShadow receiveShadow position={[0, 2, 0]}>
          <boxGeometry args={[10, 4, 10]} />
          <meshStandardMaterial color="#e8e8e8" roughness={0.8} />
        </mesh>
        {/* Base windows */}
        {[-3, 0, 3].map((wx) => (
          <mesh key={`bw-${wx}`} position={[wx, 2.5, 5.06]}>
            <boxGeometry args={[1.8, 1.4, 0.1]} />
            <meshStandardMaterial
              color="#223366"
              roughness={0.3}
              metalness={0.5}
            />
          </mesh>
        ))}
        {/* Mid tier */}
        <mesh castShadow position={[0, 5.5, 0]}>
          <boxGeometry args={[8, 3, 8]} />
          <meshStandardMaterial color="#dddddd" roughness={0.75} />
        </mesh>
        {/* Mid windows */}
        {[-2, 2].map((wx) => (
          <mesh key={`mw-${wx}`} position={[wx, 5.8, 4.06]}>
            <boxGeometry args={[2, 1.2, 0.1]} />
            <meshStandardMaterial
              color="#223366"
              roughness={0.3}
              metalness={0.5}
            />
          </mesh>
        ))}
        {/* Top tier */}
        <mesh castShadow position={[0, 8.5, 0]}>
          <boxGeometry args={[6, 3, 6]} />
          <meshStandardMaterial color="#cccccc" roughness={0.7} />
        </mesh>
        {/* Top windows – panoramic */}
        {[-1.5, 1.5].map((wx) => (
          <mesh key={`tw-${wx}`} position={[wx, 8.7, 3.06]}>
            <boxGeometry args={[2.4, 1.5, 0.1]} />
            <meshStandardMaterial
              color="#aaccff"
              roughness={0.2}
              metalness={0.6}
              transparent
              opacity={0.85}
            />
          </mesh>
        ))}
        {/* Observation deck ring */}
        <mesh castShadow position={[0, 10.25, 0]}>
          <boxGeometry args={[12, 0.5, 12]} />
          <meshStandardMaterial
            color="#999999"
            roughness={0.6}
            metalness={0.2}
          />
        </mesh>
        {/* Observation deck railing */}
        {[-5.5, 5.5].map((rx, _ri) => (
          <mesh key={`rail-${rx}`} position={[rx, 10.9, 0]}>
            <boxGeometry args={[0.15, 0.9, 12]} />
            <meshStandardMaterial
              color="#888888"
              roughness={0.5}
              metalness={0.4}
            />
          </mesh>
        ))}
        {/* Flag poles */}
        {[-2, 0, 2].map((fx, fi) => (
          <group key={`flag-${fx}`} position={[fx, 10.5, 0]}>
            <mesh castShadow position={[0, 1.5, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 3, 6]} />
              <meshStandardMaterial
                color="#aaaaaa"
                roughness={0.4}
                metalness={0.6}
              />
            </mesh>
            <mesh position={[0.5, 2.6, 0]}>
              <boxGeometry args={[0.8, 0.5, 0.05]} />
              <meshStandardMaterial
                color={fi === 0 ? "#cc2222" : fi === 1 ? "#002244" : "#22aa44"}
                roughness={0.6}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* ── 6. Pit Lane Armco (outer edge at z=-30) ───────────────────────── */}
      <mesh castShadow position={[-170, 0.2, -30]}>
        <boxGeometry args={[90, 0.4, 0.15]} />
        <meshStandardMaterial
          color="#888888"
          roughness={0.5}
          metalness={0.35}
        />
      </mesh>
      {/* Armco corrugation effect – thin overlaid strips */}
      {Array.from({ length: 18 }, (_, i) => -215 + i * 5).map((ax) => (
        <mesh key={`armco-${ax}`} position={[ax, 0.25, -30]}>
          <boxGeometry args={[0.15, 0.15, 0.2]} />
          <meshStandardMaterial
            color="#aaaaaa"
            roughness={0.4}
            metalness={0.5}
          />
        </mesh>
      ))}

      {/* ── 7. Large Grandstands behind garages ──────────────────────────── */}
      {[0, 1, 2, 3].map((si) => {
        const sx = -210 + si * 22.5;
        return (
          <group key={`gs-${sx}`} position={[sx, 0, -52]}>
            {/* 4 seating tiers */}
            {[0, 1, 2, 3].map((tier) => (
              <mesh
                key={`tier-${tier}`}
                castShadow
                receiveShadow
                position={[0, tier * 2.2 + 1.1, tier * 1.8]}
              >
                <boxGeometry args={[20, 2.2, 3]} />
                <meshStandardMaterial
                  color={tier % 2 === 0 ? "#cc2222" : "#eeeeee"}
                  roughness={0.8}
                />
              </mesh>
            ))}
            {/* Roof canopy */}
            <mesh castShadow position={[0, 10.5, 6]}>
              <boxGeometry args={[21, 0.35, 8]} />
              <meshStandardMaterial
                color="#888888"
                roughness={0.65}
                metalness={0.25}
              />
            </mesh>
            {/* Canopy support columns */}
            {[-9, -3, 3, 9].map((cx) => (
              <mesh key={`cs-${cx}`} castShadow position={[cx, 7, 9]}>
                <cylinderGeometry args={[0.18, 0.18, 6, 8]} />
                <meshStandardMaterial
                  color="#999999"
                  roughness={0.55}
                  metalness={0.35}
                />
              </mesh>
            ))}
          </group>
        );
      })}

      {/* ── 8. Crowd tiles in grandstands ─────────────────────────────────── */}
      {[0, 1, 2, 3].map((si) => {
        const sx = -210 + si * 22.5;
        return [0, 1, 2, 3].map((tier) => (
          <group
            key={`crowd-${sx}-${tier}`}
            position={[sx, tier * 2.2 + 2.3, -52 + tier * 1.8]}
          >
            {[-8, -4, 0, 4, 8].map((cx) => (
              <mesh
                key={`c-${cx}`}
                position={[cx, 0, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <planeGeometry args={[3.5, 2.5]} />
                <meshStandardMaterial
                  color={
                    (si + tier + Math.abs(cx)) % 3 === 0
                      ? "#cc2222"
                      : (si + tier + Math.abs(cx)) % 3 === 1
                        ? "#002244"
                        : "#eeeeee"
                  }
                  roughness={0.9}
                />
              </mesh>
            ))}
          </group>
        ));
      })}

      {/* ── 9. Pit Entry / Exit Lines on track ───────────────────────────── */}
      {/* Pit entry dashed line at x≈-175, z=-10 */}
      {[0, 1, 2].map((di) => (
        <mesh
          key={`pe-${di}`}
          receiveShadow
          rotation={[-Math.PI / 2, 0, 0]}
          position={[-175, 0.04, -12 - di * 1.5]}
        >
          <planeGeometry args={[0.25, 1]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>
      ))}
      {/* Pit exit dashed line at x≈-145, z=-10 */}
      {[0, 1, 2].map((di) => (
        <mesh
          key={`px-${di}`}
          receiveShadow
          rotation={[-Math.PI / 2, 0, 0]}
          position={[-145, 0.04, -12 - di * 1.5]}
        >
          <planeGeometry args={[0.25, 1]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>
      ))}

      {/* ── Pit lane speed-limit line (blended pit entry path) ────────────── */}
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[-160, 0.03, -14]}
      >
        <planeGeometry args={[30, 0.18]} />
        <meshStandardMaterial
          color="#ffdd00"
          roughness={0.7}
          opacity={0.9}
          transparent
        />
      </mesh>
    </group>
  );
}

// ─── Grandstand ───────────────────────────────────────────────────────────────
function Grandstand({
  position,
  rotation,
}: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation ?? 0, 0]}>
      {/* Seating tiers */}
      {[0, 1, 2].map((tier) => (
        <mesh
          key={tier}
          castShadow
          receiveShadow
          position={[0, tier * 2 + 1, tier * 2]}
        >
          <boxGeometry args={[18, 2, 3]} />
          <meshStandardMaterial
            color={tier % 2 === 0 ? "#cc2222" : "#cccccc"}
            roughness={0.8}
          />
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
export function RealisticRoadCourseScene({
  weather = "sunny",
}: RealisticRoadCourseSceneProps) {
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

      {/* Start/finish line */}
      <StartFinishLine />

      {/* Large "6" infield number */}
      <InfieldNumber />

      {/* Trees scattered around */}
      <Trees />

      {/* Indianapolis-style pit lane complex */}
      <PitLaneComplex />

      {/* Grandstands – positioned alongside the main straight and key corners */}
      {/* Turn 1 grandstand */}
      <Grandstand position={[-68, 0, -68]} rotation={Math.PI / 4} />
      {/* Kemmel straight far end */}
      <Grandstand position={[-155, 0, 175]} rotation={0.1} />
      {/* Pouhon outer bank */}
      <Grandstand position={[145, 0, 120]} rotation={-Math.PI / 2} />

      {/* Jumbotrons — giant screens around the circuit */}
      <Jumbotron position={[-160, 0, -40]} rotation={Math.PI / 2} />
      <Jumbotron position={[130, 0, 100]} rotation={-Math.PI / 2} />
      <Jumbotron position={[-80, 0, 185]} rotation={Math.PI} />
    </group>
  );
}

// ─── Jumbotron ────────────────────────────────────────────────────────────────
// Large F1-style screen showing live camera feed (simulated)
export function Jumbotron({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation?: number;
}) {
  return (
    <group position={position} rotation={[0, rotation ?? 0, 0]}>
      {/* Support legs */}
      {[-5, 5].map((lx) => (
        <mesh key={`leg-${lx}`} castShadow position={[lx, 6, 0]}>
          <cylinderGeometry args={[0.3, 0.4, 12, 8]} />
          <meshStandardMaterial
            color="#444444"
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>
      ))}

      {/* Horizontal crossbeam */}
      <mesh castShadow position={[0, 12.5, 0]}>
        <boxGeometry args={[12, 0.5, 0.5]} />
        <meshStandardMaterial color="#444444" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Screen frame (black border) */}
      <mesh castShadow position={[0, 16, 0]}>
        <boxGeometry args={[13, 8.5, 0.4]} />
        <meshStandardMaterial color="#111111" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Screen face – dark display panel */}
      <mesh position={[0, 16, 0.25]}>
        <boxGeometry args={[12, 7.5, 0.05]} />
        <meshStandardMaterial
          color="#030818"
          emissive="#0a1530"
          emissiveIntensity={0.8}
          metalness={0.1}
          roughness={0.9}
        />
      </mesh>

      {/* LIVE indicator bar (red top stripe) */}
      <mesh position={[0, 19.6, 0.3]}>
        <boxGeometry args={[12, 0.6, 0.06]} />
        <meshStandardMaterial
          color="#cc0000"
          emissive="#ff0000"
          emissiveIntensity={2}
        />
      </mesh>

      {/* Screen content – bright center element simulating video feed */}
      <mesh position={[0, 16, 0.3]}>
        <boxGeometry args={[10, 5.5, 0.04]} />
        <meshStandardMaterial
          color="#0a1f3a"
          emissive="#0066cc"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* F1 car silhouette on screen */}
      <mesh position={[0, 15.8, 0.35]}>
        <boxGeometry args={[5, 1.2, 0.03]} />
        <meshStandardMaterial
          color="#00aaff"
          emissive="#00aaff"
          emissiveIntensity={1.5}
        />
      </mesh>

      {/* Speed bar */}
      <mesh position={[-2, 13.8, 0.35]}>
        <boxGeometry args={[3, 0.4, 0.03]} />
        <meshStandardMaterial
          color="#00ff88"
          emissive="#00ff88"
          emissiveIntensity={2}
        />
      </mesh>

      {/* Sponsor strip at bottom */}
      <mesh position={[0, 12.6, 0.3]}>
        <boxGeometry args={[12, 0.8, 0.06]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
}
