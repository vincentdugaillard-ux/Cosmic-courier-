// Cosmic Courier - Flight Canvas Stage & Input Coordinator
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Mission, Ship, PlayerSettings, MissionResult } from '../types/game';
import { GameEngine, GameEngineInput } from '../game/gameEngine';
import { CanvasRenderer } from '../game/canvasRenderer';
import { HUD } from './HUD';
import { TouchControls } from './TouchControls';
import { Play, RotateCcw, ArrowLeft, Home, AlertTriangle, Gamepad2, Flame } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface GameViewProps {
  mission: Mission;
  ship: Ship;
  settings: PlayerSettings;
  totalGamesPlayed?: number;
  onRecordGameStart?: () => void;
  onMissionComplete: (result: MissionResult) => void;
  onExitToMainMenu: () => void;
  onExitToMenu?: () => void;
  onUpdateSettings?: (newSettings: Partial<PlayerSettings>) => void;
}

export const GameView: React.FC<GameViewProps> = ({
  mission,
  ship,
  settings,
  totalGamesPlayed = 0,
  onRecordGameStart,
  onMissionComplete,
  onExitToMainMenu,
  onExitToMenu,
  onUpdateSettings,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const engineRef = useRef<GameEngine | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  const [isPaused, setIsPaused] = useState(false);
  const [fuelDepletionActive, setFuelDepletionActive] = useState<boolean>(
    settings.fuelDepletion !== false
  );
  const [missionFailed, setMissionFailed] = useState(false);
  const [failureReason, setFailureReason] = useState('');
  const [failedStats, setFailedStats] = useState<{
    timeElapsed: number;
    ringsCollected: number;
  } | null>(null);
  const [hudUpdateTick, setHudUpdateTick] = useState(0);

  const handleToggleFuelConsumption = useCallback(() => {
    soundManager.playUiClick();
    const nextVal = !fuelDepletionActive;
    setFuelDepletionActive(nextVal);
    if (engineRef.current) {
      engineRef.current.setFuelDepletion(nextVal);
    }
    if (onUpdateSettings) {
      onUpdateSettings({ fuelDepletion: nextVal });
    }
  }, [fuelDepletionActive, onUpdateSettings]);

  // Input states
  const inputRef = useRef<GameEngineInput>({
    turnLeft: false,
    turnRight: false,
    thrust: false,
    reverse: false,
    boost: false,
  });

  // Touch control visibility detection
  const isTouchDevice =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0 || settings.showTouchControls);

  // Initialize Game Engine & Renderer
  useEffect(() => {
    if (!canvasRef.current) return;

    soundManager.setSettings(
      settings.soundEnabled,
      settings.musicEnabled,
      settings.masterVolume,
      settings.sfxVolume,
      settings.musicVolume
    );

    const engine = new GameEngine(mission, ship, settings);
    const renderer = new CanvasRenderer(canvasRef.current);

    engineRef.current = engine;
    rendererRef.current = renderer;

    return () => {
      soundManager.updateThrust(false);
    };
  }, [mission, ship, settings]);

  // Handle Canvas Resizing
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      canvasRef.current.width = rect.width;
      canvasRef.current.height = rect.height;
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // Action Handlers
  const handleResume = useCallback(() => {
    soundManager.playUiClick();
    setIsPaused(false);
  }, []);

  const handleRestart = useCallback(() => {
    soundManager.playUiClick();
    onRecordGameStart?.();
    if (canvasRef.current) {
      engineRef.current = new GameEngine(mission, ship, settings);
      setIsPaused(false);
      setMissionFailed(false);
      setHudUpdateTick((t) => t + 1);
    }
  }, [mission, ship, settings, onRecordGameStart]);

  const handleRetry = useCallback(() => {
    soundManager.playUiClick();
    onRecordGameStart?.();
    if (canvasRef.current) {
      engineRef.current = new GameEngine(mission, ship, settings);
      setMissionFailed(false);
      setIsPaused(false);
      setHudUpdateTick((t) => t + 1);
    }
  }, [mission, ship, settings, onRecordGameStart]);

  const handleViewDebriefing = useCallback(() => {
    soundManager.playUiClick();
    soundManager.updateThrust(false);
    if (engineRef.current) {
      const result = engineRef.current.getMissionResult();
      onMissionComplete(result);
    }
  }, [onMissionComplete]);

  const handleExitToMainMenu = useCallback(() => {
    soundManager.playUiClick();
    soundManager.updateThrust(false);
    onExitToMainMenu();
  }, [onExitToMainMenu]);

  const handleExit = useCallback(() => {
    soundManager.playUiClick();
    soundManager.updateThrust(false);
    if (onExitToMenu) {
      onExitToMenu();
    } else {
      onExitToMainMenu();
    }
  }, [onExitToMenu, onExitToMainMenu]);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If mission failed, allow quick keyboard actions
      if (missionFailed) {
        if (e.key === 'r' || e.key === 'R') {
          handleRetry();
          return;
        }
        if (e.key === 'Escape' || e.key === 'm' || e.key === 'M') {
          handleExitToMainMenu();
          return;
        }
        return;
      }

      if (e.repeat && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          inputRef.current.turnLeft = true;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          inputRef.current.turnRight = true;
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          inputRef.current.thrust = true;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
        case 'b':
        case 'B':
          inputRef.current.reverse = true;
          break;
        case ' ':
          inputRef.current.boost = true;
          break;
        case 'Escape':
        case 'p':
        case 'P':
          setIsPaused((prev) => !prev);
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          inputRef.current.turnLeft = false;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          inputRef.current.turnRight = false;
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          inputRef.current.thrust = false;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
        case 'b':
        case 'B':
          inputRef.current.reverse = false;
          break;
        case ' ':
          inputRef.current.boost = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [missionFailed, handleExitToMainMenu]);

  // Mouse Flight Control Event Listeners
  useEffect(() => {
    if (settings.mouseControls === false) {
      inputRef.current.mouseActive = false;
      inputRef.current.mouseThrust = false;
      inputRef.current.mouseReverse = false;
      inputRef.current.mouseBoost = false;
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const updateMouseCoordinates = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      const engine = engineRef.current;
      if (!canvas || !engine) return;

      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      // Transform screen space to world space coordinates
      const cam = engine.camera;
      const w = canvas.width;
      const h = canvas.height;

      const relX = screenX - w / 2;
      const relY = screenY - h / 2;
      const worldX = cam.x + relX / cam.zoom;
      const worldY = cam.y + relY / cam.zoom;

      const angle = Math.atan2(worldY - engine.ship.y, worldX - engine.ship.x);

      inputRef.current.mouseActive = true;
      inputRef.current.mouseWorldX = worldX;
      inputRef.current.mouseWorldY = worldY;
      inputRef.current.mouseAngle = angle;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isPaused || missionFailed) return;
      updateMouseCoordinates(e);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (isPaused || missionFailed) return;
      updateMouseCoordinates(e);

      // Left click = Primary Thruster forward
      if (e.button === 0) {
        inputRef.current.mouseThrust = true;
      }
      // Right click = Retro airbrake / reverse thruster
      else if (e.button === 2) {
        e.preventDefault();
        inputRef.current.mouseReverse = true;
      }
      // Middle click = Afterburner boost
      else if (e.button === 1) {
        e.preventDefault();
        inputRef.current.mouseBoost = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        inputRef.current.mouseThrust = false;
      } else if (e.button === 2) {
        inputRef.current.mouseReverse = false;
      } else if (e.button === 1) {
        inputRef.current.mouseBoost = false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      // Prevent browser context menu on right click to allow retro airbraking
      e.preventDefault();
    };

    const handleMouseLeave = () => {
      inputRef.current.mouseThrust = false;
      inputRef.current.mouseReverse = false;
      inputRef.current.mouseBoost = false;
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('contextmenu', handleContextMenu);
    container.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('contextmenu', handleContextMenu);
      container.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mouseup', handleMouseUp);
      inputRef.current.mouseActive = false;
      inputRef.current.mouseThrust = false;
      inputRef.current.mouseReverse = false;
      inputRef.current.mouseBoost = false;
    };
  }, [settings.mouseControls, isPaused, missionFailed]);

  // Game Loop
  useEffect(() => {
    let completionTimeout: number | null = null;
    let completed = false;
    let failureTimeout: number | null = null;
    let failureScheduled = false;

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = currentTime;

      const engine = engineRef.current;
      const renderer = rendererRef.current;

      if (engine && renderer) {
        if (!isPaused && !missionFailed) {
          // If failure is pending, cut player thruster input so ship coasts through the breach
          const effectiveInput = failureScheduled
            ? { ...inputRef.current, thrust: false, boost: false, mouseThrust: false, mouseBoost: false }
            : inputRef.current;

          engine.update(dt, effectiveInput);
          setHudUpdateTick((t) => (t + 1) % 60);

          // Check if package integrity reached 0% or mission failed
          if (engine.ship.packageStability <= 0 || engine.status === 'failed') {
            if (!failureScheduled) {
              failureScheduled = true;
              soundManager.updateThrust(false);
              if (engine.ship.packageStability <= 0 && !engine.isPackageBreached) {
                engine.triggerPackageBreach();
              }

              failureTimeout = window.setTimeout(() => {
                setMissionFailed(true);
                setFailureReason(
                  engine.failureReason ||
                    (engine.ship.packageStability <= 0
                      ? 'Fragile cargo breached! Package integrity depleted to 0%.'
                      : 'Mission parameters compromised.')
                );
                setFailedStats({
                  timeElapsed: Math.round(engine.timeElapsed * 10) / 10,
                  ringsCollected: engine.ringsCollected,
                });
              }, 1400);
            }
          } else if (engine.status === 'victory' && !completed) {
            completed = true;
            completionTimeout = window.setTimeout(() => {
              const result = engine.getMissionResult();
              onMissionComplete(result);
            }, 1200);
          }
        }

        renderer.render(engine);
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (completionTimeout) clearTimeout(completionTimeout);
      if (failureTimeout) clearTimeout(failureTimeout);
      soundManager.updateThrust(false);
    };
  }, [isPaused, missionFailed, onMissionComplete]);

  return (
    <div
      ref={containerRef}
      id="game-canvas-container"
      className={`relative w-full h-screen bg-slate-950 overflow-hidden select-none ${
        settings.mouseControls !== false ? 'cursor-crosshair' : ''
      }`}
    >
      {/* 2D Canvas */}
      <canvas
        ref={canvasRef}
        id="game-flight-canvas"
        className="block w-full h-full"
      />

      {/* Cockpit HUD Overlay */}
      {engineRef.current && (
        <HUD
          engine={engineRef.current}
          onPause={() => {
            if (missionFailed) return;
            soundManager.playUiClick();
            setIsPaused(true);
          }}
          onExitToMainMenu={handleExitToMainMenu}
        />
      )}

      {/* On-Screen Touch Controls */}
      {isTouchDevice && engineRef.current && !missionFailed && (
        <TouchControls
          inputRef={inputRef}
          boostFuel={engineRef.current.ship.boostFuel}
          fuel={engineRef.current.ship.fuel}
          fuelDepletionEnabled={fuelDepletionActive}
        />
      )}

      {/* Mission Failed Overlay Modal */}
      {missionFailed && (
        <div
          id="mission-failed-overlay"
          className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 z-50 animate-fade-in"
        >
          <div className="bg-slate-900/95 border-2 border-red-500/80 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl shadow-red-950/90 text-center relative overflow-hidden border-t-4 border-t-red-500">
            {/* Ambient Alert Glow Accent */}
            <div className="absolute -top-16 -left-16 w-32 h-32 bg-red-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Failure Hazard Badge */}
            <div className="w-16 h-16 rounded-2xl bg-red-950/80 border-2 border-red-500/60 flex items-center justify-center mx-auto mb-4 text-red-400 shadow-lg shadow-red-500/20 animate-pulse">
              <AlertTriangle className="w-9 h-9 text-red-400" />
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl font-extrabold font-mono tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-amber-400 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)] uppercase mb-1">
              Mission Failed
            </h2>

            {/* Integrity 0% Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-950/80 border border-red-500/50 text-red-300 font-mono text-xs font-bold mb-4 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
              <span>PACKAGE INTEGRITY: 0% • CARGO BREACHED</span>
            </div>

            {/* Failure Reason */}
            <div className="bg-slate-950/80 border border-red-900/40 rounded-xl p-3 mb-4 text-xs text-rose-200 font-mono leading-relaxed">
              {failureReason || 'Fragile cargo breached! Stability depleted to 0%.'}
            </div>

            {/* Flight Telemetry / Stats Cards */}
            <div className="grid grid-cols-2 gap-2.5 mb-3 text-left font-mono">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
                <span className="text-[10px] text-slate-400 block mb-0.5">SECTOR</span>
                <span className="text-xs font-bold text-slate-200 truncate block">
                  {mission.codeName} • {mission.title}
                </span>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
                <span className="text-[10px] text-slate-400 block mb-0.5">TIME SURVIVED</span>
                <span className="text-xs font-bold text-amber-300">
                  {failedStats?.timeElapsed ?? 0}s
                </span>
              </div>
            </div>

            {/* Total Games Played Counter */}
            <div className="flex items-center justify-between py-2.5 px-3.5 bg-slate-950/70 border border-slate-800 rounded-xl font-mono text-xs mb-5">
              <div className="flex items-center gap-2 text-slate-400">
                <Gamepad2 className="w-4 h-4 text-cyan-400" />
                <span>TOTAL GAMES PLAYED</span>
              </div>
              <span className="font-bold text-cyan-300 text-sm font-mono">{totalGamesPlayed}</span>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-col gap-3">
              {/* 1. Retry Button */}
              <button
                id="failed-btn-retry"
                onClick={handleRetry}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-mono font-bold text-base tracking-wider flex items-center justify-center gap-2.5 shadow-xl shadow-cyan-500/30 transition-all hover:scale-[1.02] active:scale-98 border-2 border-cyan-200"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Retry</span>
              </button>

              {/* 2. Return to Menu Button */}
              <button
                id="failed-btn-menu"
                onClick={handleExitToMainMenu}
                className="w-full py-3.5 px-6 rounded-2xl bg-slate-800/90 hover:bg-slate-750 border-2 border-slate-700 hover:border-cyan-400/80 text-slate-200 hover:text-cyan-300 font-mono font-bold text-sm tracking-wide flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01] active:scale-98 shadow-md"
              >
                <Home className="w-4 h-4 text-cyan-400" />
                <span>Return to Menu</span>
              </button>

              {/* View Full Debriefing Link */}
              <button
                id="failed-btn-debriefing"
                onClick={handleViewDebriefing}
                className="text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors pt-1"
              >
                View Mission Debriefing Report →
              </button>
            </div>

            {/* Keyboard Shortcuts Hint */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-500">
              Press <span className="text-slate-300 font-bold">[R]</span> to Retry •{' '}
              <span className="text-slate-300 font-bold">[ESC / M]</span> to Return to Menu
            </div>
          </div>
        </div>
      )}

      {/* Pause Menu Modal */}
      {isPaused && !missionFailed && (
        <div
          id="pause-modal-overlay"
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-40 animate-fade-in"
        >
          <div className="bg-slate-900 border-2 border-cyan-500/50 rounded-2xl p-8 max-w-sm w-full shadow-2xl shadow-cyan-950/80 text-center">
            <h2 className="text-xl font-bold font-mono tracking-wider text-cyan-300 uppercase mb-2">
              Flight Suspended
            </h2>
            <p className="text-xs text-slate-400 font-mono mb-6">
              {mission.title} • {mission.codeName}
            </p>

            <div className="flex flex-col gap-3">
              <button
                id="pause-btn-resume"
                onClick={handleResume}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30 transition-transform active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                Resume Delivery
              </button>

              {/* In-Game Fuel Consumption Option */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-2 min-w-0">
                  <Flame
                    className={`w-4 h-4 shrink-0 ${
                      fuelDepletionActive ? 'text-amber-400' : 'text-cyan-400'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-bold text-slate-200">
                        Fuel Depletion
                      </span>
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                          fuelDepletionActive
                            ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                            : 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40'
                        }`}
                      >
                        {fuelDepletionActive ? 'ON' : 'OFF'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 truncate block">
                      {fuelDepletionActive ? 'Propellant burns • Flameout risk' : 'Deactivated • Unlimited fuel'}
                    </span>
                  </div>
                </div>
                <button
                  id="pause-toggle-fuel-consumption"
                  onClick={handleToggleFuelConsumption}
                  className={`w-11 h-6 rounded-full transition-colors p-1 shrink-0 ${
                    fuelDepletionActive ? 'bg-amber-500' : 'bg-slate-700'
                  }`}
                  title="Activate or Deactivate Fuel Consumption"
                  aria-label="Toggle Fuel Consumption"
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      fuelDepletionActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <button
                id="pause-btn-restart"
                onClick={handleRestart}
                className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-400 text-slate-200 font-bold font-mono text-sm flex items-center justify-center gap-2 transition-colors active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                Restart Route
              </button>

              <button
                id="pause-btn-main-menu"
                onClick={handleExitToMainMenu}
                className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-400 text-slate-200 font-bold font-mono text-sm flex items-center justify-center gap-2 transition-colors active:scale-95"
              >
                <Home className="w-4 h-4 text-cyan-400" />
                <span>Return to Main Menu</span>
              </button>

              <button
                id="pause-btn-exit"
                onClick={handleExit}
                className="w-full py-3 px-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 text-slate-400 hover:text-slate-200 font-mono text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Abort to Mission Select
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
