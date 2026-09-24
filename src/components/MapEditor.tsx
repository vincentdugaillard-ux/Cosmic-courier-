// Cosmic Courier - Sector Architect & Custom Map Editor
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mission,
  AsteroidObstacle,
  BonusRing,
  LaserBarrierObstacle,
  GravityWellObstacle,
  PlayerProfile,
} from '../types/game';
import { generateAsteroidVertices } from '../game/constants';
import {
  loadCustomMissions,
  saveCustomMission,
  deleteCustomMission,
} from '../utils/storage';
import { soundManager } from '../audio/soundManager';
import {
  ArrowLeft,
  Save,
  Play,
  Trash2,
  Plus,
  Copy,
  Download,
  Upload,
  MousePointer,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FolderOpen,
  Check,
} from 'lucide-react';

interface MapEditorProps {
  profile: PlayerProfile;
  onExit: () => void;
  onTestFlight: (mission: Mission) => void;
}

type EditorTool =
  | 'select'
  | 'start'
  | 'landing'
  | 'asteroid_small'
  | 'asteroid_med'
  | 'asteroid_large'
  | 'ring'
  | 'laser'
  | 'gravity'
  | 'eraser';

const DEFAULT_MAP_WIDTH = 2800;
const DEFAULT_MAP_HEIGHT = 1600;

const createNewBlankMission = (customIndex = 1): Mission => ({
  id: `custom_sector_${Date.now()}`,
  codeName: `USR-${String(customIndex).padStart(2, '0')}`,
  title: `Custom Sector ${customIndex}`,
  sector: 'Architect Nav-Grid',
  difficulty: 'cadet',
  description: 'A custom navigational course calibrated by the Sector Architect.',
  cargoName: 'Quantum Stabilizer Matrix',
  cargoDescription: 'Delicate high-density stabilizer cores that require steady handling.',
  briefingText: 'Attention Pilot: Custom flight sector coordinates loaded. Verify obstacle clearances and deliver cargo safely to the landing pad.',
  timeLimit: 60,
  rewardCredits: 500,
  baseScore: 2000,
  unlockRequirement: { type: 'default' },
  worldWidth: DEFAULT_MAP_WIDTH,
  worldHeight: DEFAULT_MAP_HEIGHT,
  startPos: { x: 300, y: DEFAULT_MAP_HEIGHT / 2, angle: 0 },
  landingPad: {
    x: DEFAULT_MAP_WIDTH - 300,
    y: DEFAULT_MAP_HEIGHT / 2,
    width: 140,
    height: 140,
    targetAngle: 0,
    safeSpeedMax: 2.2,
  },
  asteroids: [
    {
      id: 'ast_preset_1',
      type: 'asteroid_static',
      x: 900,
      y: DEFAULT_MAP_HEIGHT / 2 - 200,
      radius: 65,
      rotation: 0,
      rotationSpeed: 0.005,
      vertices: generateAsteroidVertices(65),
    },
    {
      id: 'ast_preset_2',
      type: 'asteroid_static',
      x: 1450,
      y: DEFAULT_MAP_HEIGHT / 2 + 180,
      radius: 75,
      rotation: 0.5,
      rotationSpeed: -0.004,
      vertices: generateAsteroidVertices(75),
    },
    {
      id: 'ast_preset_3',
      type: 'asteroid_static',
      x: 2000,
      y: DEFAULT_MAP_HEIGHT / 2 - 120,
      radius: 60,
      rotation: 1.2,
      rotationSpeed: 0.006,
      vertices: generateAsteroidVertices(60),
    },
  ],
  gravityWells: [],
  lasers: [],
  bonusRings: [
    { id: 'ring_preset_1', x: 700, y: DEFAULT_MAP_HEIGHT / 2, radius: 42, rotation: 0, collected: false, scoreValue: 250, stabilityBonus: 5 },
    { id: 'ring_preset_2', x: 1450, y: DEFAULT_MAP_HEIGHT / 2 - 140, radius: 42, rotation: 0, collected: false, scoreValue: 250, stabilityBonus: 5 },
    { id: 'ring_preset_3', x: 2200, y: DEFAULT_MAP_HEIGHT / 2, radius: 42, rotation: 0, collected: false, scoreValue: 250, stabilityBonus: 5 },
  ],
  routeWaypoints: [
    { x: 300, y: DEFAULT_MAP_HEIGHT / 2 },
    { x: 700, y: DEFAULT_MAP_HEIGHT / 2 },
    { x: 1450, y: DEFAULT_MAP_HEIGHT / 2 - 140 },
    { x: 2200, y: DEFAULT_MAP_HEIGHT / 2 },
    { x: DEFAULT_MAP_WIDTH - 300, y: DEFAULT_MAP_HEIGHT / 2 },
  ],
  isCustom: true,
});

export const MapEditor: React.FC<MapEditorProps> = ({ profile: _profile, onExit, onTestFlight }) => {
  const [savedMissions, setSavedMissions] = useState<Mission[]>(() => loadCustomMissions());
  const [currentMission, setCurrentMission] = useState<Mission>(() => {
    const list = loadCustomMissions();
    return list.length > 0 ? list[0] : createNewBlankMission(1);
  });

  const [activeTool, setActiveTool] = useState<EditorTool>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<
    'start' | 'landing' | 'asteroid' | 'ring' | 'laser' | 'gravity' | null
  >(null);

  // Viewport camera (pan & zoom)
  const [zoom, setZoom] = useState<number>(0.5);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 80, y: 60 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Dragging selected object
  const [isDraggingObject, setIsDraggingObject] = useState(false);
  const [objectDragOffset, setObjectDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Notifications & Modals
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage(null);
    }, 2800);
  };

  // Convert screen coordinates to world coordinates
  const screenToWorld = useCallback(
    (screenX: number, screenY: number) => {
      const worldX = (screenX - pan.x) / zoom;
      const worldY = (screenY - pan.y) / zoom;
      return { x: Math.round(worldX), y: Math.round(worldY) };
    },
    [pan, zoom]
  );

  // Render Editor Canvas
  const renderEditor = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#030712'; // deep void slate-950
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    const worldW = currentMission.worldWidth;
    const worldH = currentMission.worldHeight;

    // Draw Sector Boundary & Grid
    ctx.fillStyle = '#0b1329';
    ctx.fillRect(0, 0, worldW, worldH);

    // Neon Grid
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(30, 58, 138, 0.25)';
    const gridSize = 100;

    for (let x = 0; x <= worldW; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, worldH);
      ctx.stroke();
    }
    for (let y = 0; y <= worldH; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(worldW, y);
      ctx.stroke();
    }

    // World Boundary Border
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 4 / zoom;
    ctx.strokeRect(0, 0, worldW, worldH);

    // Draw Recommended Flight Trajectory line (from Start to Landing Pad via rings)
    ctx.beginPath();
    ctx.moveTo(currentMission.startPos.x, currentMission.startPos.y);
    currentMission.bonusRings.forEach((r) => {
      ctx.lineTo(r.x, r.y);
    });
    ctx.lineTo(currentMission.landingPad.x, currentMission.landingPad.y);
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
    ctx.lineWidth = 2 / zoom;
    ctx.stroke();
    ctx.setLineDash([]);

    // 1. Draw Gravity Wells
    if (currentMission.gravityWells) {
      currentMission.gravityWells.forEach((gw) => {
        const isSelected = selectedType === 'gravity' && selectedId === gw.id;
        ctx.save();
        ctx.translate(gw.x, gw.y);

        // Pull field radius
        ctx.beginPath();
        ctx.arc(0, 0, gw.influenceRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(168, 85, 247, 0.08)';
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#ec4899' : 'rgba(168, 85, 247, 0.4)';
        ctx.lineWidth = 2 / zoom;
        ctx.stroke();

        // Core Singularity
        ctx.beginPath();
        ctx.arc(0, 0, gw.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#1e1b4b';
        ctx.fill();
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 3 / zoom;
        ctx.stroke();

        ctx.fillStyle = '#e879f9';
        ctx.font = `${14 / zoom}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('GRAVITY SINGULARITY', 0, gw.influenceRadius + 16 / zoom);

        ctx.restore();
      });
    }

    // 2. Draw Laser Barriers
    if (currentMission.lasers) {
      currentMission.lasers.forEach((laser) => {
        const isSelected = selectedType === 'laser' && selectedId === laser.id;
        ctx.save();

        // Laser beam line
        ctx.beginPath();
        ctx.moveTo(laser.x1, laser.y1);
        ctx.lineTo(laser.x2, laser.y2);
        ctx.strokeStyle = isSelected ? '#f43f5e' : 'rgba(239, 68, 68, 0.85)';
        ctx.lineWidth = (isSelected ? 6 : 4) / zoom;
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Emitter Nodes
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(laser.x1 - 8, laser.y1 - 8, 16, 16);
        ctx.fillRect(laser.x2 - 8, laser.y2 - 8, 16, 16);

        ctx.restore();
      });
    }

    // 3. Draw Asteroids
    currentMission.asteroids.forEach((ast) => {
      const isSelected = selectedType === 'asteroid' && selectedId === ast.id;
      ctx.save();
      ctx.translate(ast.x, ast.y);
      ctx.rotate(ast.rotation);

      if (ast.vertices && ast.vertices.length > 2) {
        ctx.beginPath();
        ctx.moveTo(ast.vertices[0].x, ast.vertices[0].y);
        for (let i = 1; i < ast.vertices.length; i++) {
          ctx.lineTo(ast.vertices[i].x, ast.vertices[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = isSelected ? '#334155' : '#1e293b';
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#38bdf8' : '#64748b';
        ctx.lineWidth = (isSelected ? 4 : 2) / zoom;
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, ast.radius, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#334155' : '#1e293b';
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#38bdf8' : '#64748b';
        ctx.lineWidth = (isSelected ? 4 : 2) / zoom;
        ctx.stroke();
      }

      // Selection Ring
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(0, 0, ast.radius + 12 / zoom, 0, Math.PI * 2);
        ctx.strokeStyle = '#38bdf8';
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.restore();
    });

    // 4. Draw Hyper-Rings
    currentMission.bonusRings.forEach((ring) => {
      const isSelected = selectedType === 'ring' && selectedId === ring.id;
      ctx.save();
      ctx.translate(ring.x, ring.y);

      ctx.beginPath();
      ctx.arc(0, 0, ring.radius, 0, Math.PI * 2);
      ctx.strokeStyle = isSelected ? '#f59e0b' : '#38bdf8';
      ctx.lineWidth = (isSelected ? 5 : 3) / zoom;
      ctx.stroke();

      ctx.fillStyle = isSelected ? 'rgba(245, 158, 11, 0.25)' : 'rgba(56, 189, 248, 0.15)';
      ctx.fill();

      // Mini ring node
      ctx.fillStyle = isSelected ? '#f59e0b' : '#38bdf8';
      ctx.beginPath();
      ctx.arc(0, -ring.radius, 4 / zoom, 0, Math.PI * 2);
      ctx.arc(0, ring.radius, 4 / zoom, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });

    // 5. Draw Start Position & Player Ship Silhouette
    {
      const isSelected = selectedType === 'start';
      const sp = currentMission.startPos;
      ctx.save();
      ctx.translate(sp.x, sp.y);

      // Launch Pad Base
      ctx.fillStyle = isSelected ? '#0369a1' : '#0e7490';
      ctx.fillRect(-40, 20, 80, 10);
      ctx.strokeStyle = isSelected ? '#38bdf8' : '#22d3ee';
      ctx.lineWidth = 2 / zoom;
      ctx.strokeRect(-40, 20, 80, 10);

      // Ship Marker
      ctx.rotate(sp.angle);
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(-12, -10);
      ctx.lineTo(-8, 0);
      ctx.lineTo(-12, 10);
      ctx.closePath();
      ctx.fillStyle = '#38bdf8';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2 / zoom;
      ctx.stroke();

      // Heading indicator
      ctx.beginPath();
      ctx.moveTo(20, 0);
      ctx.lineTo(40, 0);
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 2 / zoom;
      ctx.stroke();

      // Text Label
      ctx.fillStyle = '#22d3ee';
      ctx.font = `bold ${12 / zoom}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('LAUNCH STATION', 0, 42 / zoom);

      if (isSelected) {
        ctx.beginPath();
        ctx.arc(0, 0, 45, 0, Math.PI * 2);
        ctx.strokeStyle = '#38bdf8';
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.restore();
    }

    // 6. Draw Landing Pad Destination
    {
      const isSelected = selectedType === 'landing';
      const pad = currentMission.landingPad;
      const padW = pad.width;
      ctx.save();
      ctx.translate(pad.x, pad.y);

      // Platform Base
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-padW / 2, 0, padW, 14);

      // Glowing Landing Runway Deck
      ctx.fillStyle = isSelected ? '#84cc16' : '#22c55e';
      ctx.fillRect(-padW / 2, 0, padW, 5);

      // Neon Guideway Beacons
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(-padW / 2 - 4, -8, 8, 16);
      ctx.fillRect(padW / 2 - 4, -8, 8, 16);

      // Label
      ctx.fillStyle = '#4ade80';
      ctx.font = `bold ${12 / zoom}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('DESTINATION PAD', 0, 30 / zoom);

      if (isSelected) {
        ctx.beginPath();
        ctx.arc(0, 0, padW / 2 + 15, 0, Math.PI * 2);
        ctx.strokeStyle = '#84cc16';
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.restore();
    }

    ctx.restore();
  }, [currentMission, pan, zoom, selectedId, selectedType]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current) return;
      canvasRef.current.width = containerRef.current.clientWidth;
      canvasRef.current.height = containerRef.current.clientHeight;
      renderEditor();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderEditor]);

  // Redraw when state updates
  useEffect(() => {
    renderEditor();
  }, [renderEditor]);

  // Find object under mouse cursor
  const getObjectAtWorldCoords = (wx: number, wy: number) => {
    // Check start position
    const sp = currentMission.startPos;
    if (Math.hypot(wx - sp.x, wy - sp.y) < 45) {
      return { type: 'start' as const, id: 'start' };
    }

    // Check landing pad
    const lp = currentMission.landingPad;
    if (Math.abs(wx - lp.x) < lp.width / 2 && Math.abs(wy - lp.y) < 35) {
      return { type: 'landing' as const, id: 'landing' };
    }

    // Check asteroids
    for (let i = currentMission.asteroids.length - 1; i >= 0; i--) {
      const ast = currentMission.asteroids[i];
      if (Math.hypot(wx - ast.x, wy - ast.y) <= ast.radius + 10) {
        return { type: 'asteroid' as const, id: ast.id };
      }
    }

    // Check rings
    for (let i = currentMission.bonusRings.length - 1; i >= 0; i--) {
      const ring = currentMission.bonusRings[i];
      if (Math.hypot(wx - ring.x, wy - ring.y) <= ring.radius + 8) {
        return { type: 'ring' as const, id: ring.id };
      }
    }

    // Check gravity wells
    if (currentMission.gravityWells) {
      for (let i = currentMission.gravityWells.length - 1; i >= 0; i--) {
        const gw = currentMission.gravityWells[i];
        if (Math.hypot(wx - gw.x, wy - gw.y) <= gw.radius + 15) {
          return { type: 'gravity' as const, id: gw.id };
        }
      }
    }

    // Check lasers
    if (currentMission.lasers) {
      for (let i = currentMission.lasers.length - 1; i >= 0; i--) {
        const laser = currentMission.lasers[i];
        const midX = (laser.x1 + laser.x2) / 2;
        const midY = (laser.y1 + laser.y2) / 2;
        if (Math.hypot(wx - midX, wy - midY) <= 50) {
          return { type: 'laser' as const, id: laser.id };
        }
      }
    }

    return null;
  };

  // Canvas Mouse Down
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // Right click or middle click: Pan viewport
    if (e.button === 2 || e.button === 1 || e.altKey) {
      setIsPanning(true);
      setDragStart({ x: screenX - pan.x, y: screenY - pan.y });
      return;
    }

    const { x: wx, y: wy } = screenToWorld(screenX, screenY);

    if (activeTool === 'select') {
      const target = getObjectAtWorldCoords(wx, wy);
      if (target) {
        soundManager.playUiClick();
        setSelectedType(target.type);
        setSelectedId(target.id);
        setIsDraggingObject(true);

        if (target.type === 'start') {
          setObjectDragOffset({ x: wx - currentMission.startPos.x, y: wy - currentMission.startPos.y });
        } else if (target.type === 'landing') {
          setObjectDragOffset({ x: wx - currentMission.landingPad.x, y: wy - currentMission.landingPad.y });
        } else if (target.type === 'asteroid') {
          const ast = currentMission.asteroids.find((a) => a.id === target.id);
          if (ast) setObjectDragOffset({ x: wx - ast.x, y: wy - ast.y });
        } else if (target.type === 'ring') {
          const r = currentMission.bonusRings.find((rg) => rg.id === target.id);
          if (r) setObjectDragOffset({ x: wx - r.x, y: wy - r.y });
        } else if (target.type === 'gravity') {
          const gw = currentMission.gravityWells?.find((g) => g.id === target.id);
          if (gw) setObjectDragOffset({ x: wx - gw.x, y: wy - gw.y });
        }
      } else {
        setSelectedType(null);
        setSelectedId(null);
        // Drag canvas when clicking empty space in select tool
        setIsPanning(true);
        setDragStart({ x: screenX - pan.x, y: screenY - pan.y });
      }
    } else if (activeTool === 'start') {
      soundManager.playUiClick();
      setCurrentMission((prev) => ({
        ...prev,
        startPos: { ...prev.startPos, x: wx, y: wy },
      }));
      setSelectedType('start');
      setSelectedId('start');
      showStatus('Launch station placed');
    } else if (activeTool === 'landing') {
      soundManager.playUiClick();
      setCurrentMission((prev) => ({
        ...prev,
        landingPad: { ...prev.landingPad, x: wx, y: wy },
      }));
      setSelectedType('landing');
      setSelectedId('landing');
      showStatus('Destination landing pad placed');
    } else if (
      activeTool === 'asteroid_small' ||
      activeTool === 'asteroid_med' ||
      activeTool === 'asteroid_large'
    ) {
      soundManager.playUiClick();
      const radius =
        activeTool === 'asteroid_small' ? 38 : activeTool === 'asteroid_med' ? 62 : 92;
      const newAst: AsteroidObstacle = {
        id: `ast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'asteroid_static',
        x: wx,
        y: wy,
        radius,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.01,
        vertices: generateAsteroidVertices(radius),
      };
      setCurrentMission((prev) => ({
        ...prev,
        asteroids: [...prev.asteroids, newAst],
      }));
      setSelectedType('asteroid');
      setSelectedId(newAst.id);
      showStatus(`Asteroid (${radius}m) placed`);
    } else if (activeTool === 'ring') {
      soundManager.playUiClick();
      const newRing: BonusRing = {
        id: `ring_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        x: wx,
        y: wy,
        radius: 42,
        rotation: 0,
        collected: false,
        scoreValue: 250,
        stabilityBonus: 5,
      };
      setCurrentMission((prev) => ({
        ...prev,
        bonusRings: [...prev.bonusRings, newRing],
      }));
      setSelectedType('ring');
      setSelectedId(newRing.id);
      showStatus('Quantum bonus ring placed');
    } else if (activeTool === 'laser') {
      soundManager.playUiClick();
      const newLaser: LaserBarrierObstacle = {
        id: `laser_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'laser_barrier',
        x1: wx,
        y1: wy - 110,
        x2: wx,
        y2: wy + 110,
        cycleDuration: 3.0,
        activeRatio: 0.65,
        cycleOffset: 0,
      };
      setCurrentMission((prev) => ({
        ...prev,
        lasers: [...(prev.lasers || []), newLaser],
      }));
      setSelectedType('laser');
      setSelectedId(newLaser.id);
      showStatus('Laser barrier placed');
    } else if (activeTool === 'gravity') {
      soundManager.playUiClick();
      const newGw: GravityWellObstacle = {
        id: `gw_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'gravity_well',
        x: wx,
        y: wy,
        radius: 28,
        influenceRadius: 240,
        pullStrength: 900,
      };
      setCurrentMission((prev) => ({
        ...prev,
        gravityWells: [...(prev.gravityWells || []), newGw],
      }));
      setSelectedType('gravity');
      setSelectedId(newGw.id);
      showStatus('Gravitational singularity placed');
    } else if (activeTool === 'eraser') {
      const target = getObjectAtWorldCoords(wx, wy);
      if (target) {
        soundManager.playUiClick();
        deleteObject(target.type, target.id);
      }
    }
  };

  // Canvas Mouse Move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    if (isPanning) {
      setPan({ x: screenX - dragStart.x, y: screenY - dragStart.y });
      return;
    }

    if (isDraggingObject && selectedType && selectedId) {
      const { x: wx, y: wy } = screenToWorld(screenX, screenY);
      const targetX = wx - objectDragOffset.x;
      const targetY = wy - objectDragOffset.y;

      if (selectedType === 'start') {
        setCurrentMission((prev) => ({
          ...prev,
          startPos: { ...prev.startPos, x: targetX, y: targetY },
        }));
      } else if (selectedType === 'landing') {
        setCurrentMission((prev) => ({
          ...prev,
          landingPad: { ...prev.landingPad, x: targetX, y: targetY },
        }));
      } else if (selectedType === 'asteroid') {
        setCurrentMission((prev) => ({
          ...prev,
          asteroids: prev.asteroids.map((ast) =>
            ast.id === selectedId ? { ...ast, x: targetX, y: targetY } : ast
          ),
        }));
      } else if (selectedType === 'ring') {
        setCurrentMission((prev) => ({
          ...prev,
          bonusRings: prev.bonusRings.map((r) =>
            r.id === selectedId ? { ...r, x: targetX, y: targetY } : r
          ),
        }));
      } else if (selectedType === 'gravity') {
        setCurrentMission((prev) => ({
          ...prev,
          gravityWells: (prev.gravityWells || []).map((gw) =>
            gw.id === selectedId ? { ...gw, x: targetX, y: targetY } : gw
          ),
        }));
      } else if (selectedType === 'laser') {
        setCurrentMission((prev) => ({
          ...prev,
          lasers: (prev.lasers || []).map((laser) => {
            if (laser.id === selectedId) {
              const dx = laser.x2 - laser.x1;
              const dy = laser.y2 - laser.y1;
              return {
                ...laser,
                x1: targetX - dx / 2,
                y1: targetY - dy / 2,
                x2: targetX + dx / 2,
                y2: targetY + dy / 2,
              };
            }
            return laser;
          }),
        }));
      }
    }
  };

  // Canvas Mouse Up
  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDraggingObject(false);
  };

  // Canvas Wheel Zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newZoom = Math.max(0.2, Math.min(1.8, zoom * zoomFactor));

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
      const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    } else {
      setZoom(newZoom);
    }
  };

  // Delete Object
  const deleteObject = (type: string, id: string) => {
    if (type === 'start' || type === 'landing') {
      showStatus('Cannot delete mandatory Launch or Landing pads');
      return;
    }

    if (type === 'asteroid') {
      setCurrentMission((prev) => ({
        ...prev,
        asteroids: prev.asteroids.filter((a) => a.id !== id),
      }));
    } else if (type === 'ring') {
      setCurrentMission((prev) => ({
        ...prev,
        bonusRings: prev.bonusRings.filter((r) => r.id !== id),
      }));
    } else if (type === 'laser') {
      setCurrentMission((prev) => ({
        ...prev,
        lasers: (prev.lasers || []).filter((l) => l.id !== id),
      }));
    } else if (type === 'gravity') {
      setCurrentMission((prev) => ({
        ...prev,
        gravityWells: (prev.gravityWells || []).filter((gw) => gw.id !== id),
      }));
    }

    setSelectedId(null);
    setSelectedType(null);
    showStatus('Object removed');
  };

  // Save current mission
  const handleSaveMission = () => {
    soundManager.playUiClick();
    saveCustomMission(currentMission);
    setSavedMissions(loadCustomMissions());
    showStatus(`Sector "${currentMission.title}" saved successfully!`);
  };

  // Load Preset Template
  const handleLoadTemplate = (templateName: string) => {
    soundManager.playUiClick();
    if (templateName === 'clean') {
      setCurrentMission((prev) => ({
        ...prev,
        asteroids: [],
        bonusRings: [],
        lasers: [],
        gravityWells: [],
      }));
      showStatus('Template applied: Clean Runway');
    } else if (templateName === 'slalom') {
      const asts: AsteroidObstacle[] = [];
      const rings: BonusRing[] = [];
      for (let x = 600; x < currentMission.worldWidth - 400; x += 380) {
        const yTop = currentMission.worldHeight / 2 - 240;
        const yBot = currentMission.worldHeight / 2 + 240;
        asts.push({
          id: `ast_t_${x}_1`,
          type: 'asteroid_static',
          x,
          y: yTop,
          radius: 70,
          rotation: 0,
          rotationSpeed: 0.005,
          vertices: generateAsteroidVertices(70),
        });
        asts.push({
          id: `ast_t_${x}_2`,
          type: 'asteroid_static',
          x,
          y: yBot,
          radius: 70,
          rotation: 0.5,
          rotationSpeed: -0.005,
          vertices: generateAsteroidVertices(70),
        });
        rings.push({
          id: `ring_t_${x}`,
          x,
          y: currentMission.worldHeight / 2,
          radius: 42,
          rotation: 0,
          collected: false,
          scoreValue: 250,
          stabilityBonus: 5,
        });
      }
      setCurrentMission((prev) => ({
        ...prev,
        asteroids: asts,
        bonusRings: rings,
        lasers: [],
        gravityWells: [],
      }));
      showStatus('Template applied: Asteroid Slalom');
    } else if (templateName === 'singularity') {
      const gws: GravityWellObstacle[] = [
        {
          id: 'gw_t_1',
          type: 'gravity_well',
          x: currentMission.worldWidth * 0.38,
          y: currentMission.worldHeight * 0.35,
          influenceRadius: 280,
          radius: 30,
          pullStrength: 1000,
        },
        {
          id: 'gw_t_2',
          type: 'gravity_well',
          x: currentMission.worldWidth * 0.65,
          y: currentMission.worldHeight * 0.65,
          influenceRadius: 280,
          radius: 30,
          pullStrength: 1000,
        },
      ];
      setCurrentMission((prev) => ({
        ...prev,
        gravityWells: gws,
      }));
      showStatus('Template applied: Singularity Corridor');
    }
  };

  // Launch test flight
  const handleTestFlight = () => {
    soundManager.playUiClick();
    saveCustomMission(currentMission);
    onTestFlight(currentMission);
  };

  // Import JSON
  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(importJsonText);
      if (!parsed.worldWidth || !parsed.startPos || !parsed.landingPad) {
        throw new Error('Invalid mission format: missing required bounds or pads');
      }
      const imported: Mission = {
        ...parsed,
        id: `custom_sector_${Date.now()}`,
        isCustom: true,
      };
      setCurrentMission(imported);
      saveCustomMission(imported);
      setSavedMissions(loadCustomMissions());
      setShowImportModal(false);
      setImportJsonText('');
      showStatus(`Imported sector "${imported.title}"!`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      alert(`Import failed: ${errorMsg}`);
    }
  };

  return (
    <div
      id="map-editor-screen"
      className="relative w-full h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden select-none"
    >
      {/* Top Navigation & Action Header */}
      <header className="h-14 bg-slate-900/95 border-b border-cyan-500/30 px-3 sm:px-6 flex items-center justify-between z-20 backdrop-blur-md">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-3">
          <button
            id="editor-btn-back"
            onClick={() => {
              soundManager.playUiClick();
              onExit();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 transition-colors"
            title="Return to Menu"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 bg-cyan-950/70 px-1.5 py-0.5 rounded border border-cyan-500/40">
                MAP ARCHITECT
              </span>
              <h1 className="text-sm font-bold font-mono text-slate-200 truncate max-w-[200px] sm:max-w-xs">
                {currentMission.title}
              </h1>
            </div>
          </div>
        </div>

        {/* Center: Zoom & View Controls */}
        <div className="hidden md:flex items-center gap-2 bg-slate-950/80 px-2.5 py-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setZoom((z) => Math.max(0.2, z - 0.1))}
            className="p-1 text-slate-400 hover:text-cyan-300 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-slate-300 min-w-[45px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(1.8, z + 0.1))}
            className="p-1 text-slate-400 hover:text-cyan-300 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <div className="h-3 w-px bg-slate-800 mx-1" />
          <button
            onClick={() => {
              setZoom(0.5);
              setPan({ x: 80, y: 60 });
            }}
            className="p-1 text-slate-400 hover:text-cyan-300 transition-colors"
            title="Reset Viewport"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Actions (Saved Maps, Templates, Save, Test Flight) */}
        <div className="flex items-center gap-2">
          {/* Saved Maps Browser Button */}
          <button
            id="editor-btn-saved-maps"
            onClick={() => {
              soundManager.playUiClick();
              setShowSavedModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono font-bold text-slate-300 transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Saved Sectors</span>
            <span className="px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 text-[10px] border border-cyan-800">
              {savedMissions.length}
            </span>
          </button>

          {/* Export / Share Map */}
          <button
            id="editor-btn-export"
            onClick={() => {
              soundManager.playUiClick();
              setShowExportModal(true);
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 transition-colors"
            title="Export / Share Map Code"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Save Map */}
          <button
            id="editor-btn-save"
            onClick={handleSaveMission}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-400 text-xs font-mono font-bold text-cyan-300 transition-colors active:scale-95"
            title="Save Sector to Local Storage"
          >
            <Save className="w-3.5 h-3.5 text-cyan-400" />
            <span>Save</span>
          </button>

          {/* Launch Test Flight */}
          <button
            id="editor-btn-test-flight"
            onClick={handleTestFlight}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 text-xs font-mono font-black tracking-wider uppercase shadow-lg shadow-cyan-500/30 transition-all hover:scale-105 active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Test Flight</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Area (Toolbar + Canvas + Inspector) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Toolbar */}
        <aside
          id="editor-toolbar"
          className="w-16 sm:w-20 bg-slate-900/90 border-r border-slate-800 p-2 sm:p-2.5 flex flex-col items-center gap-2 z-10 backdrop-blur-md overflow-y-auto"
        >
          <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider mb-1">
            TOOLS
          </span>

          {/* Select & Drag Tool */}
          <button
            id="tool-select"
            onClick={() => setActiveTool('select')}
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
              activeTool === 'select'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/40 ring-2 ring-cyan-300'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
            }`}
            title="Select & Move Objects (V)"
          >
            <MousePointer className="w-4 h-4" />
            <span className="text-[8px] font-mono">SELECT</span>
          </button>

          {/* Start Spawn Pad */}
          <button
            id="tool-start"
            onClick={() => setActiveTool('start')}
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${
              activeTool === 'start'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/40 ring-2 ring-cyan-300'
                : 'bg-slate-800 text-cyan-400 hover:bg-slate-700'
            }`}
            title="Place Launch Pad Spawn"
          >
            <span className="text-sm font-bold">🚀</span>
            <span className="text-[8px] font-mono">START</span>
          </button>

          {/* Landing Pad */}
          <button
            id="tool-landing"
            onClick={() => setActiveTool('landing')}
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${
              activeTool === 'landing'
                ? 'bg-lime-500 text-slate-950 font-bold shadow-lg shadow-lime-500/40 ring-2 ring-lime-300'
                : 'bg-slate-800 text-lime-400 hover:bg-slate-700'
            }`}
            title="Place Landing Station Pad"
          >
            <span className="text-sm font-bold">🎯</span>
            <span className="text-[8px] font-mono">LANDING</span>
          </button>

          <div className="w-8 h-px bg-slate-800 my-1" />
          <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider mb-1">
            HAZARDS
          </span>

          {/* Small Asteroid */}
          <button
            id="tool-ast-small"
            onClick={() => setActiveTool('asteroid_small')}
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${
              activeTool === 'asteroid_small'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/40 ring-2 ring-cyan-300'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Small Asteroid (38m)"
          >
            <div className="w-3.5 h-3.5 rounded-full border border-current" />
            <span className="text-[8px] font-mono">AST-S</span>
          </button>

          {/* Medium Asteroid */}
          <button
            id="tool-ast-med"
            onClick={() => setActiveTool('asteroid_med')}
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${
              activeTool === 'asteroid_med'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/40 ring-2 ring-cyan-300'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Medium Asteroid (62m)"
          >
            <div className="w-5 h-5 rounded-full border border-current" />
            <span className="text-[8px] font-mono">AST-M</span>
          </button>

          {/* Large Asteroid */}
          <button
            id="tool-ast-large"
            onClick={() => setActiveTool('asteroid_large')}
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${
              activeTool === 'asteroid_large'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/40 ring-2 ring-cyan-300'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Large Asteroid (92m)"
          >
            <div className="w-6 h-6 rounded-full border border-current" />
            <span className="text-[8px] font-mono">AST-L</span>
          </button>

          {/* Bonus Hyper-Ring */}
          <button
            id="tool-ring"
            onClick={() => setActiveTool('ring')}
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${
              activeTool === 'ring'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/40 ring-2 ring-cyan-300'
                : 'bg-slate-800 text-cyan-400 hover:bg-slate-700'
            }`}
            title="Quantum Bonus Ring (+Stability, +Score)"
          >
            <div className="w-5 h-5 rounded-full border-2 border-cyan-400" />
            <span className="text-[8px] font-mono">RING</span>
          </button>

          {/* Laser Barrier */}
          <button
            id="tool-laser"
            onClick={() => setActiveTool('laser')}
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${
              activeTool === 'laser'
                ? 'bg-rose-500 text-slate-950 font-bold shadow-lg shadow-rose-500/40 ring-2 ring-rose-300'
                : 'bg-slate-800 text-rose-400 hover:bg-slate-700'
            }`}
            title="Laser Barrier Gate"
          >
            <span className="text-xs font-mono font-black text-rose-400">⚡</span>
            <span className="text-[8px] font-mono">LASER</span>
          </button>

          {/* Gravitational Singularity */}
          <button
            id="tool-gravity"
            onClick={() => setActiveTool('gravity')}
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${
              activeTool === 'gravity'
                ? 'bg-pink-500 text-slate-950 font-bold shadow-lg shadow-pink-500/40 ring-2 ring-pink-300'
                : 'bg-slate-800 text-pink-400 hover:bg-slate-700'
            }`}
            title="Micro Black Hole Gravity Well"
          >
            <span className="text-xs">🌀</span>
            <span className="text-[8px] font-mono">GRAVITY</span>
          </button>

          {/* Eraser */}
          <button
            id="tool-eraser"
            onClick={() => setActiveTool('eraser')}
            className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${
              activeTool === 'eraser'
                ? 'bg-red-600 text-white font-bold shadow-lg shadow-red-500/40 ring-2 ring-red-400'
                : 'bg-slate-800 text-red-400 hover:bg-slate-700'
            }`}
            title="Erase / Delete Placed Objects"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-[8px] font-mono">ERASE</span>
          </button>
        </aside>

        {/* Center Canvas Workspace */}
        <main
          ref={containerRef}
          id="editor-canvas-container"
          className="flex-1 relative h-full bg-slate-950 overflow-hidden cursor-crosshair"
          onContextMenu={(e) => e.preventDefault()}
        >
          <canvas
            ref={canvasRef}
            id="editor-interactive-canvas"
            className="block w-full h-full"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
          />

          {/* Status Toast Notification */}
          {statusMessage && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-cyan-500/60 text-cyan-300 font-mono text-xs px-4 py-2 rounded-xl shadow-xl shadow-cyan-950/80 pointer-events-none backdrop-blur-md animate-fade-in flex items-center gap-2 z-30">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Bottom Floating Canvas Helpers */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 pointer-events-auto z-10">
            {/* Quick Templates Dropdown */}
            <div className="bg-slate-900/85 border border-slate-700 px-3 py-1.5 rounded-xl backdrop-blur-md text-xs font-mono flex items-center gap-2">
              <span className="text-slate-400">Template:</span>
              <button
                onClick={() => handleLoadTemplate('clean')}
                className="text-cyan-400 hover:underline"
              >
                Clear
              </button>
              <span className="text-slate-600">•</span>
              <button
                onClick={() => handleLoadTemplate('slalom')}
                className="text-cyan-400 hover:underline"
              >
                Slalom
              </button>
              <span className="text-slate-600">•</span>
              <button
                onClick={() => handleLoadTemplate('singularity')}
                className="text-cyan-400 hover:underline"
              >
                Singularity
              </button>
            </div>

            <div className="bg-slate-900/85 border border-slate-700 px-3 py-1.5 rounded-xl backdrop-blur-md text-[11px] font-mono text-slate-400">
              <span>R-Click/Alt+Drag: Pan • Scroll: Zoom</span>
            </div>
          </div>
        </main>

        {/* Right Inspector & Settings Drawer */}
        <aside
          id="editor-inspector"
          className="w-72 sm:w-80 bg-slate-900/95 border-l border-slate-800 p-4 flex flex-col justify-between z-10 backdrop-blur-md overflow-y-auto"
        >
          <div className="space-y-4">
            <div className="pb-3 border-b border-slate-800">
              <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                SECTOR PARAMETERS
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Configure mission narrative, physics, and rewards
              </p>
            </div>

            {/* Title & CodeName */}
            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">
                SECTOR TITLE
              </label>
              <input
                type="text"
                value={currentMission.title}
                onChange={(e) =>
                  setCurrentMission((prev) => ({ ...prev, title: e.target.value }))
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 focus:border-cyan-400 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">
                  CODE NAME
                </label>
                <input
                  type="text"
                  value={currentMission.codeName}
                  onChange={(e) =>
                    setCurrentMission((prev) => ({ ...prev, codeName: e.target.value }))
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 focus:border-cyan-400 outline-none uppercase"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">
                  TIME LIMIT (S)
                </label>
                <input
                  type="number"
                  min="20"
                  max="300"
                  value={currentMission.timeLimit}
                  onChange={(e) =>
                    setCurrentMission((prev) => ({
                      ...prev,
                      timeLimit: Math.max(10, parseInt(e.target.value) || 60),
                    }))
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 focus:border-cyan-400 outline-none"
                />
              </div>
            </div>

            {/* Cargo Details */}
            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">
                CARGO MANIFEST
              </label>
              <input
                type="text"
                value={currentMission.cargoName}
                onChange={(e) =>
                  setCurrentMission((prev) => ({ ...prev, cargoName: e.target.value }))
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 focus:border-cyan-400 outline-none"
              />
            </div>

            {/* Difficulty Tier */}
            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">
                DIFFICULTY TIER
              </label>
              <select
                value={currentMission.difficulty}
                onChange={(e) =>
                  setCurrentMission((prev) => ({
                    ...prev,
                    difficulty: e.target.value as Mission['difficulty'],
                  }))
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 focus:border-cyan-400 outline-none uppercase"
              >
                <option value="rookie">Rookie</option>
                <option value="cadet">Cadet</option>
                <option value="expert">Expert</option>
                <option value="hyper">Hyper</option>
              </select>
            </div>

            {/* Map Dimensions */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">
                  SECTOR WIDTH
                </label>
                <input
                  type="number"
                  step="200"
                  min="1600"
                  max="5000"
                  value={currentMission.worldWidth}
                  onChange={(e) =>
                    setCurrentMission((prev) => ({
                      ...prev,
                      worldWidth: Math.max(1200, parseInt(e.target.value) || 2800),
                    }))
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 focus:border-cyan-400 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">
                  SECTOR HEIGHT
                </label>
                <input
                  type="number"
                  step="200"
                  min="1000"
                  max="3500"
                  value={currentMission.worldHeight}
                  onChange={(e) =>
                    setCurrentMission((prev) => ({
                      ...prev,
                      worldHeight: Math.max(800, parseInt(e.target.value) || 1600),
                    }))
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-100 focus:border-cyan-400 outline-none"
                />
              </div>
            </div>

            {/* Selected Object Attributes */}
            <div className="pt-3 border-t border-slate-800">
              <h4 className="text-[11px] font-mono font-bold text-slate-300 mb-2 flex items-center justify-between">
                <span>INSPECTED ITEM</span>
                <span className="text-cyan-400 uppercase">{selectedType || 'None'}</span>
              </h4>

              {selectedType && selectedId && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs font-mono space-y-2">
                  <div className="flex justify-between text-slate-400">
                    <span>ID:</span>
                    <span className="text-slate-200 truncate max-w-[120px]">{selectedId}</span>
                  </div>

                  {selectedType !== 'start' && selectedType !== 'landing' && (
                    <button
                      onClick={() => deleteObject(selectedType, selectedId)}
                      className="w-full py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors mt-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Object</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Sector Object Counts Snapshot */}
            <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Asteroids:</span>
                <span className="text-slate-200 font-bold">{currentMission.asteroids.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Hyper-Rings:</span>
                <span className="text-cyan-300 font-bold">{currentMission.bonusRings.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Laser Gates:</span>
                <span className="text-rose-400 font-bold">
                  {currentMission.lasers?.length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Gravity Wells:</span>
                <span className="text-pink-400 font-bold">
                  {currentMission.gravityWells?.length || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Create New Map Button */}
          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={() => {
                soundManager.playUiClick();
                const nextIndex = savedMissions.length + 1;
                const newSector = createNewBlankMission(nextIndex);
                setCurrentMission(newSector);
                showStatus('New blank sector initialized');
              }}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>Create New Sector</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Saved Maps Modal */}
      {showSavedModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border-2 border-cyan-500/50 rounded-2xl p-6 max-w-lg w-full shadow-2xl shadow-cyan-950/80 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wide">
                  Saved Custom Sectors
                </h3>
              </div>
              <button
                onClick={() => setShowSavedModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs font-mono"
              >
                ✕ Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-4">
              {savedMissions.length === 0 ? (
                <div className="text-center py-8 text-slate-500 font-mono text-xs">
                  No custom sectors saved yet. Save your current map to access it here!
                </div>
              ) : (
                savedMissions.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                      currentMission.id === m.id
                        ? 'bg-cyan-950/40 border-cyan-400 shadow-md shadow-cyan-950/50'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-cyan-400 font-bold bg-slate-900 px-1.5 py-0.5 rounded">
                          {m.codeName}
                        </span>
                        <h4 className="text-xs font-mono font-bold text-slate-200">{m.title}</h4>
                      </div>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                        {m.asteroids.length} Obstacles • {m.bonusRings.length} Rings • {m.timeLimit}s
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          soundManager.playUiClick();
                          setCurrentMission(m);
                          setShowSavedModal(false);
                          showStatus(`Loaded "${m.title}"`);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold transition-colors"
                      >
                        Load
                      </button>

                      <button
                        onClick={() => {
                          soundManager.playUiClick();
                          deleteCustomMission(m.id);
                          setSavedMissions(loadCustomMissions());
                        }}
                        className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/50 transition-colors"
                        title="Delete Map"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  setShowSavedModal(false);
                  setShowImportModal(true);
                }}
                className="flex items-center gap-1 text-xs font-mono text-cyan-400 hover:underline"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import JSON Map</span>
              </button>

              <button
                onClick={() => setShowSavedModal(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export JSON Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border-2 border-cyan-500/50 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wide mb-2">
              Export Sector JSON Code
            </h3>
            <p className="text-xs text-slate-400 font-mono mb-3">
              Copy this map data to share your custom flight route with other pilots!
            </p>

            <textarea
              readOnly
              value={JSON.stringify(currentMission, null, 2)}
              className="w-full h-48 bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[10px] text-cyan-300 outline-none resize-none mb-3"
            />

            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(currentMission, null, 2));
                  setCopySuccess(true);
                  setTimeout(() => setCopySuccess(false), 2000);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold transition-colors"
              >
                {copySuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copySuccess ? 'Copied to Clipboard!' : 'Copy JSON'}</span>
              </button>

              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import JSON Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border-2 border-cyan-500/50 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wide mb-2">
              Import Sector JSON
            </h3>
            <p className="text-xs text-slate-400 font-mono mb-3">
              Paste custom sector JSON data below to load and pilot it.
            </p>

            <textarea
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder="Paste valid Mission JSON here..."
              className="w-full h-48 bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-cyan-300 outline-none resize-none mb-3"
            />

            <div className="flex items-center justify-between">
              <button
                onClick={handleImportJson}
                disabled={!importJsonText.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 text-xs font-mono font-bold transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Load Map</span>
              </button>

              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
