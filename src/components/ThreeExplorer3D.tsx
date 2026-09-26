import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { AgentHDT, SimulationResults } from "../types/simulation";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { Sparkles, Network, Activity, Compass, Play, Pause, RotateCcw, ZoomIn, Info, Eye } from "lucide-react";

interface ThreeExplorer3DProps {
  simulationResults: SimulationResults;
  selectedAgent: AgentHDT | null;
  onSelectAgent: (agent: AgentHDT) => void;
}

export type VisualizerMode = "hdt_capital_radar" | "lifeline_trajectories" | "social_network_3d" | "gatsby_curve_3d";

export const ThreeExplorer3D: React.FC<ThreeExplorer3DProps> = ({
  simulationResults,
  selectedAgent,
  onSelectAgent,
}) => {
  const { language, t } = useLanguage();
  const { theme } = useTheme();

  const containerRef = useRef<HTMLDivElement>(null);
  const [activeMode, setActiveMode] = useState<VisualizerMode>("lifeline_trajectories");
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [timeStep, setTimeStep] = useState<number>(45);
  const [hoveredNodeInfo, setHoveredNodeInfo] = useState<string | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const objectsGroupRef = useRef<THREE.Group | null>(null);

  // Mouse interaction state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Initialize Scene, Camera, Renderer
    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 550;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050608); // Deep immersive dark background
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(35, 25, 45);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    // Clear previous canvas if any
    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(renderer.domElement);

    // 2. Add Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x06b6d4, 1.4);
    dirLight1.position.set(30, 40, 20);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xf97316, 0.8);
    dirLight2.position.set(-30, -20, -20);
    scene.add(dirLight2);

    // 3. Grid & Coordinate Axes
    const gridHelper = new THREE.GridHelper(50, 25, 0x06b6d4, 0x1f2937);
    gridHelper.position.y = -0.1;
    scene.add(gridHelper);

    const objectsGroup = new THREE.Group();
    scene.add(objectsGroup);
    objectsGroupRef.current = objectsGroup;

    // 4. Mouse Orbit Interaction
    const canvas = renderer.domElement;
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !cameraRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      const rotSpeed = 0.005;
      const cam = cameraRef.current;

      // Rotate camera around origin
      const radius = Math.sqrt(cam.position.x ** 2 + cam.position.z ** 2);
      let theta = Math.atan2(cam.position.z, cam.position.x);
      theta -= deltaX * rotSpeed;

      cam.position.x = radius * Math.cos(theta);
      cam.position.z = radius * Math.sin(theta);
      cam.position.y = Math.max(5, Math.min(60, cam.position.y + deltaY * 0.1));
      cam.lookAt(0, 0, 0);

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      if (!cameraRef.current) return;
      e.preventDefault();
      const zoomFactor = e.deltaY * 0.05;
      const cam = cameraRef.current;
      const dir = cam.position.clone().normalize();
      const newDist = cam.position.length() + zoomFactor;
      if (newDist > 15 && newDist < 120) {
        cam.position.copy(dir.multiplyScalar(newDist));
      }
    };

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    // 5. Render Loop
    let angle = 0;
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      if (objectsGroupRef.current && isPlaying) {
        angle += 0.002;
        // Subtle ambient floating
        objectsGroupRef.current.rotation.y = Math.sin(angle * 0.5) * 0.05;
      }

      renderer.render(scene, camera);
    };
    animate();

    // 6. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = newW / newH;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("wheel", onWheel);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, []);

  // Re-build 3D scene when mode, simulationResults, or selectedAgent changes
  useEffect(() => {
    if (!objectsGroupRef.current || !sceneRef.current) return;
    const group = objectsGroupRef.current;

    // Clear previous meshes
    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
      if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
      if ((obj as THREE.Mesh).material) {
        const mat = (obj as THREE.Mesh).material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      }
    }

    const agents = simulationResults.agents || [];
    const sampleAgents = agents.slice(0, 120);

    // ==========================================
    // MODE 1: 3D LIFELINE TRAJECTORIES
    // ==========================================
    if (activeMode === "lifeline_trajectories") {
      // Draw 3D axis guides
      const axisMaterial = new THREE.LineBasicMaterial({ color: 0x64748b, transparent: true, opacity: 0.6 });
      const xPoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(30, 0, 0)];
      const yPoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 25, 0)];
      const zPoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 30)];

      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(xPoints), axisMaterial));
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(yPoints), axisMaterial));
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(zPoints), axisMaterial));

      // Color map by origin quintile
      const quintileColors: Record<number, number> = {
        1: 0xef4444, // Red (Q1)
        2: 0xf97316, // Orange (Q2)
        3: 0xeab308, // Yellow (Q3)
        4: 0x3b82f6, // Blue (Q4)
        5: 0x10b981, // Emerald (Q5)
      };

      // Draw trajectory curves for sampled agents
      sampleAgents.forEach((agent) => {
        const isTarget = selectedAgent?.id === agent.id;
        const color = quintileColors[agent.originQuintile] || 0x94a3b8;
        const points: THREE.Vector3[] = [];

        const maxStep = Math.min(timeStep, agent.trajectory.length - 1);
        for (let s = 0; s <= maxStep; s++) {
          const pt = agent.trajectory[s];
          // X: Age (0..45) -> 0..25
          const px = (pt.age / 45) * 26 - 13;
          // Y: Wage (0..80k) -> 0..20
          const py = Math.min(22, (pt.wage / 60000) * 18);
          // Z: Social Status (0..100) -> -12..12
          const pz = ((pt.socialStatus - 50) / 50) * 14;
          points.push(new THREE.Vector3(px, py, pz));
        }

        if (points.length > 1) {
          const curve = new THREE.CatmullRomCurve3(points);
          const curveGeometry = new THREE.TubeGeometry(curve, 32, isTarget ? 0.35 : 0.08, 8, false);
          const curveMaterial = new THREE.MeshStandardMaterial({
            color: isTarget ? 0x38bdf8 : color,
            emissive: isTarget ? 0x0284c7 : color,
            emissiveIntensity: isTarget ? 0.8 : 0.2,
            roughness: 0.3,
            metalness: 0.7,
            transparent: true,
            opacity: isTarget ? 1.0 : (selectedAgent ? 0.25 : 0.65),
          });
          const tubeMesh = new THREE.Mesh(curveGeometry, curveMaterial);
          group.add(tubeMesh);

          // Head marker sphere
          const lastPoint = points[points.length - 1];
          const sphereGeo = new THREE.SphereGeometry(isTarget ? 0.7 : 0.25, 16, 16);
          const sphereMat = new THREE.MeshStandardMaterial({
            color: isTarget ? 0xffffff : color,
            emissive: color,
            emissiveIntensity: 0.9,
          });
          const markerMesh = new THREE.Mesh(sphereGeo, sphereMat);
          markerMesh.position.copy(lastPoint);
          group.add(markerMesh);
        }
      });
    }

    // ==========================================
    // MODE 2: 3D HDT MULTI-CAPITAL RADAR / HYPER-SPACE
    // ==========================================
    else if (activeMode === "hdt_capital_radar") {
      const agent = selectedAgent || agents[0];
      if (agent) {
        // 5 dimensions of capital
        const dimensions = [
          { name: "Cognitivo (IQ)", val: (agent.capital.cognitive - 70) / 75 },
          { name: "Humano (Escolaridad)", val: agent.capital.human / 20 },
          { name: "Social (Weak Ties)", val: agent.capital.social },
          { name: "Psicológico (Grit)", val: agent.capital.psychological },
          { name: "Estructural (Vecindario)", val: agent.capital.structural },
        ];

        // Central glowing core
        const coreGeo = new THREE.SphereGeometry(1.5, 32, 32);
        const coreMat = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x0284c7,
          emissiveIntensity: 0.9,
          roughness: 0.2,
        });
        const coreMesh = new THREE.Mesh(coreGeo, coreMat);
        group.add(coreMesh);

        // Radar hull vertices
        const hullPoints: THREE.Vector3[] = [];
        const radiusScale = 14;

        dimensions.forEach((dim, idx) => {
          const angle = (idx / dimensions.length) * Math.PI * 2;
          const r = Math.max(2, dim.val * radiusScale);
          const x = Math.cos(angle) * r;
          const z = Math.sin(angle) * r;
          const y = (dim.val - 0.5) * 6; // Height dimension

          hullPoints.push(new THREE.Vector3(x, y, z));

          // Dimension Axis Spoke
          const spokeGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, y, z)]);
          const spokeMat = new THREE.LineBasicMaterial({ color: 0x64748b, transparent: true, opacity: 0.7 });
          group.add(new THREE.Line(spokeGeo, spokeMat));

          // Dimension Vertex Node Sphere
          const vertexGeo = new THREE.SphereGeometry(0.8, 16, 16);
          const vertexMat = new THREE.MeshStandardMaterial({
            color: 0xf43f5e,
            emissive: 0xe11d48,
            emissiveIntensity: 0.8,
          });
          const vertexNode = new THREE.Mesh(vertexGeo, vertexMat);
          vertexNode.position.set(x, y, z);
          group.add(vertexNode);
        });

        // Connect hull vertices in a loop
        const loopPoints = [...hullPoints, hullPoints[0]];
        const hullLineGeo = new THREE.BufferGeometry().setFromPoints(loopPoints);
        const hullLineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 3 });
        group.add(new THREE.Line(hullLineGeo, hullLineMat));

        // Surrounding orbital particle ring
        const particleCount = 400;
        const particleGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let p = 0; p < particleCount * 3; p += 3) {
          const u = Math.random();
          const v = Math.random();
          const theta = u * 2.0 * Math.PI;
          const phi = Math.acos(2.0 * v - 1.0);
          const r = 16 + Math.random() * 4;

          positions[p] = r * Math.sin(phi) * Math.cos(theta);
          positions[p + 1] = (r * Math.sin(phi) * Math.sin(theta)) * 0.4;
          positions[p + 2] = r * Math.cos(phi);
        }

        particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        const particleMat = new THREE.PointsMaterial({
          color: 0xa855f7,
          size: 0.35,
          transparent: true,
          opacity: 0.6,
        });
        const particles = new THREE.Points(particleGeo, particleMat);
        group.add(particles);
      }
    }

    // ==========================================
    // MODE 3: 3D COMPLEX NETWORK TOPOLOGY
    // ==========================================
    else if (activeMode === "social_network_3d") {
      const nodeCount = Math.min(80, agents.length);
      const networkNodes: { pos: THREE.Vector3; agent: AgentHDT; color: number }[] = [];

      const quintileColors: Record<number, number> = {
        1: 0xef4444,
        2: 0xf97316,
        3: 0xeab308,
        4: 0x3b82f6,
        5: 0x10b981,
      };

      // Position nodes in homophily clusters in 3D
      for (let i = 0; i < nodeCount; i++) {
        const ag = agents[i];
        const qAngle = ((ag.originQuintile - 1) / 5) * Math.PI * 2;
        const clusterRadius = 12 + (Math.random() - 0.5) * 5;

        const x = Math.cos(qAngle) * clusterRadius + (Math.random() - 0.5) * 7;
        const z = Math.sin(qAngle) * clusterRadius + (Math.random() - 0.5) * 7;
        const y = ((ag.finalQuintile - 3) / 2) * 8 + (Math.random() - 0.5) * 3;

        const pos = new THREE.Vector3(x, y, z);
        const col = quintileColors[ag.originQuintile] || 0x94a3b8;
        networkNodes.push({ pos, agent: ag, color: col });

        // Node Mesh
        const isTarget = selectedAgent?.id === ag.id;
        const nodeGeo = new THREE.SphereGeometry(isTarget ? 0.9 : 0.45, 16, 16);
        const nodeMat = new THREE.MeshStandardMaterial({
          color: isTarget ? 0xffffff : col,
          emissive: col,
          emissiveIntensity: isTarget ? 1.0 : 0.4,
        });
        const mesh = new THREE.Mesh(nodeGeo, nodeMat);
        mesh.position.copy(pos);
        group.add(mesh);
      }

      // Generate edges (Homophily + Granovetter Weak Ties)
      const edgeMaterialHomophily = new THREE.LineBasicMaterial({ color: 0x475569, transparent: true, opacity: 0.35 });
      const edgeMaterialWeakTie = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.65 });

      for (let i = 0; i < nodeCount; i++) {
        for (let j = i + 1; j < Math.min(nodeCount, i + 12); j++) {
          const sameQuintile = networkNodes[i].agent.originQuintile === networkNodes[j].agent.originQuintile;
          const distance = networkNodes[i].pos.distanceTo(networkNodes[j].pos);

          if (sameQuintile && distance < 9) {
            const edgeGeo = new THREE.BufferGeometry().setFromPoints([networkNodes[i].pos, networkNodes[j].pos]);
            group.add(new THREE.Line(edgeGeo, edgeMaterialHomophily));
          } else if (!sameQuintile && Math.random() < 0.08) {
            // Granovetter bridging weak tie
            const edgeGeo = new THREE.BufferGeometry().setFromPoints([networkNodes[i].pos, networkNodes[j].pos]);
            group.add(new THREE.Line(edgeGeo, edgeMaterialWeakTie));
          }
        }
      }
    }

    // ==========================================
    // MODE 4: 3D GREAT GATSBY CURVE SPACE
    // ==========================================
    else if (activeMode === "gatsby_curve_3d") {
      // Create Gatsby terrain / scatter plane
      const gatsbyCountries = [
        { name: "Dinamarca", gini: 0.27, ige: 0.15, col: 0x10b981 },
        { name: "Noruega", gini: 0.26, ige: 0.17, col: 0x10b981 },
        { name: "Canadá", gini: 0.32, ige: 0.29, col: 0x06b6d4 },
        { name: "Alemania", gini: 0.30, ige: 0.32, col: 0x3b82f6 },
        { name: "Reino Unido", gini: 0.35, ige: 0.50, col: 0x8b5cf6 },
        { name: "Estados Unidos", gini: 0.41, ige: 0.47, col: 0xf59e0b },
        { name: "India (IHDS)", gini: 0.49, ige: 0.64, col: 0xf97316 },
        { name: "Brasil (POF)", gini: 0.53, ige: 0.58, col: 0xec4899 },
        { name: "Sudáfrica (NIDS)", gini: 0.63, ige: 0.68, col: 0xef4444 },
      ];

      // Regression line in 3D
      const regPoints = [
        new THREE.Vector3(-15, (0.15 * 25) - 10, -5),
        new THREE.Vector3(15, (0.70 * 25) - 10, 5),
      ];
      const regGeo = new THREE.BufferGeometry().setFromPoints(regPoints);
      const regMat = new THREE.LineDashedMaterial({ color: 0x94a3b8, dashSize: 1, gapSize: 0.5 });
      group.add(new THREE.Line(regGeo, regMat));

      gatsbyCountries.forEach((c) => {
        // X: Gini (0.20..0.70) -> -15..15
        const px = ((c.gini - 0.45) / 0.25) * 14;
        // Y: IGE (0.10..0.75) -> -8..14
        const py = ((c.ige - 0.4) / 0.35) * 10;
        const pz = 0;

        // Pillar & Sphere
        const colGeo = new THREE.CylinderGeometry(0.15, 0.15, py + 8, 8);
        const colMat = new THREE.MeshBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.5 });
        const colMesh = new THREE.Mesh(colGeo, colMat);
        colMesh.position.set(px, (py - 8) / 2, pz);
        group.add(colMesh);

        const nodeGeo = new THREE.SphereGeometry(0.9, 16, 16);
        const nodeMat = new THREE.MeshStandardMaterial({
          color: c.col,
          emissive: c.col,
          emissiveIntensity: 0.7,
        });
        const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
        nodeMesh.position.set(px, py, pz);
        group.add(nodeMesh);
      });

      // Active Simulation Current Point
      const simGini = simulationResults.estimatedGini;
      const simIGE = simulationResults.estimatedIGE;
      const sx = ((simGini - 0.45) / 0.25) * 14;
      const sy = ((simIGE - 0.4) / 0.35) * 10;

      const simNodeGeo = new THREE.SphereGeometry(1.4, 32, 32);
      const simNodeMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 1.0,
      });
      const simNode = new THREE.Mesh(simNodeGeo, simNodeMat);
      simNode.position.set(sx, sy, 0);
      group.add(simNode);
    }
  }, [activeMode, simulationResults, selectedAgent, timeStep]);

  return (
    <div id="threejs-explorer-container" className={`relative w-full h-[540px] rounded-xl overflow-hidden border shadow-2xl flex flex-col ${
      theme === "dark" ? "bg-[#080A0E] border-white/10" : "bg-slate-900 border-slate-700"
    }`}>
      {/* Top Floating Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Visualizer Mode Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#050608]/90 backdrop-blur-md rounded-lg border border-white/10 pointer-events-auto shadow-xl">
          <button
            id="tab-lifeline-trajectories"
            onClick={() => setActiveMode("lifeline_trajectories")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono tracking-wide transition-all ${
              activeMode === "lifeline_trajectories"
                ? "bg-white/10 text-white border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.25)] font-semibold"
                : "border border-transparent hover:border-white/10 text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            {t("mode_lifeline")}
          </button>

          <button
            id="tab-hdt-capital-radar"
            onClick={() => setActiveMode("hdt_capital_radar")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono tracking-wide transition-all ${
              activeMode === "hdt_capital_radar"
                ? "bg-white/10 text-white border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.25)] font-semibold"
                : "border border-transparent hover:border-white/10 text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            {t("mode_hdt_space")}
          </button>

          <button
            id="tab-social-network-3d"
            onClick={() => setActiveMode("social_network_3d")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono tracking-wide transition-all ${
              activeMode === "social_network_3d"
                ? "bg-white/10 text-white border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.25)] font-semibold"
                : "border border-transparent hover:border-white/10 text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Network className="w-3.5 h-3.5 text-cyan-400" />
            {t("mode_networks")}
          </button>

          <button
            id="tab-gatsby-curve-3d"
            onClick={() => setActiveMode("gatsby_curve_3d")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono tracking-wide transition-all ${
              activeMode === "gatsby_curve_3d"
                ? "bg-white/10 text-white border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.25)] font-semibold"
                : "border border-transparent hover:border-white/10 text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            {t("mode_gatsby")}
          </button>
        </div>

        {/* Action Controls & Legend */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="px-3 py-1.5 bg-[#050608]/90 backdrop-blur-md rounded-lg border border-white/10 text-white/70 text-xs font-mono flex items-center gap-3 shadow-xl">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block shadow-[0_0_6px_#f43f5e]"></span> {t("legend_q1")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shadow-[0_0_6px_#34d399]"></span> {t("legend_q5")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block animate-pulse shadow-[0_0_6px_#22d3ee]"></span> {t("legend_active_hdt")}
            </span>
          </div>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 bg-[#050608]/90 backdrop-blur-md hover:bg-white/10 text-white/80 rounded-lg border border-white/10 transition shadow-xl"
            title={isPlaying ? "Pause rotation" : "Play rotation"}
          >
            {isPlaying ? <Pause className="w-4 h-4 text-cyan-400" /> : <Play className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Area */}
      <div ref={containerRef} className="w-full flex-1 cursor-grab active:cursor-grabbing" />

      {/* Bottom Information Overlay & Lifecycle Time Scrubber */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-3 p-3 bg-[#050608]/90 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl">
        {/* Left: Active Agent or Mode Summary */}
        <div className="flex items-center gap-3">
          {selectedAgent ? (
            <div className="flex items-center gap-2 text-xs font-mono text-white/80">
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono font-semibold border border-cyan-500/30">
                {selectedAgent.id}
              </span>
              <span>GENDER: <strong className="text-white">{selectedAgent.gender}</strong></span>
              <span className="text-white/20">|</span>
              <span>{t("origin_label")}: <strong className="text-white">Q{selectedAgent.originQuintile}</strong> ➔ {t("destiny_label")}: <strong className="text-emerald-400">Q{selectedAgent.finalQuintile}</strong></span>
              <span className="text-white/20">|</span>
              <span>{t("wage_label")}: <strong className="text-cyan-400">${selectedAgent.finalWage.toLocaleString()}</strong></span>
              <span className="text-white/20">|</span>
              <span>{t("degree_label")}: <strong className="text-white">{selectedAgent.highestDegree}</strong></span>
            </div>
          ) : (
            <div className="text-xs font-mono text-white/50 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t("orbit_help")}</span>
            </div>
          )}
        </div>

        {/* Right: Time-Scrubber (Ages 0 to 45) */}
        {activeMode === "lifeline_trajectories" && (
          <div className="flex items-center gap-3 text-xs font-mono text-white/70">
            <span>{t("age_scrubber")}: <strong className="text-cyan-400 font-mono text-sm">{timeStep} {t("years")}</strong></span>
            <input
              id="time-step-slider"
              type="range"
              min={1}
              max={45}
              value={timeStep}
              onChange={(e) => setTimeStep(Number(e.target.value))}
              className="w-32 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        )}
      </div>
    </div>
  );
};
