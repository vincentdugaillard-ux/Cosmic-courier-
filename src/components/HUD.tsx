// Cosmic Courier - Neon Flight Cockpit Heads-Up Display
import React from 'react';
import {
  Shield,
  Zap,
  Clock,
  Navigation,
  Pause,
  Sparkles,
  AlertTriangle,
  Home,
  Flame,
  MousePointer,
} from 'lucide-react';
import { GameEngine } from '../game/gameEngine';
import { soundManager } from '../audio/soundManager';

interface HUDProps {
  engine: GameEngine;
  onPause: () => void;
  onExitToMainMenu?: () => void;
}

export const HUD: React.FC<HUDProps> = ({ engine, onPause, onExitToMainMenu }) => {
  const { ship, mission, timeRemaining, ringsCollected } = engine;
  const speed = Math.hypot(ship.vx, ship.vy);
  const pad = mission.landingPad;
  const distToPad = Math.round(Math.hypot(ship.x - pad.x, ship.y - pad.y));
  const isSafeSpeed = speed <= pad.safeSpeedMax;

  // Package stability color grading
  const stability = Math.round(ship.packageStability);
  let stabilityColor = 'text-lime-400 border-lime-500/50 shadow-lime-500/30';
  let stabilityBg = 'bg-lime-400';
  let stabilityLabel = 'PRISTINE';

  if (stability <= 0) {
    stabilityColor = 'text-red-500 border-red-500 shadow-red-500/80 bg-red-950/80 animate-pulse';
    stabilityBg = 'bg-red-600 animate-pulse';
    stabilityLabel = 'BREACHED (0%)';
  } else if (stability < 25) {
    stabilityColor = 'text-red-400 border-red-500/60 shadow-red-500/40 animate-pulse';
    stabilityBg = 'bg-red-500';
    stabilityLabel = 'CRITICAL';
  } else if (stability < 60) {
    stabilityColor = 'text-amber-400 border-amber-500/50 shadow-amber-500/30';
    stabilityBg = 'bg-amber-400';
    stabilityLabel = 'FRAGILE';
  } else if (stability < 85) {
    stabilityColor = 'text-cyan-400 border-cyan-500/50 shadow-cyan-500/30';
    stabilityBg = 'bg-cyan-400';
    stabilityLabel = 'INTACT';
  }

  // Fuel level calculations
  const isFuelDepletionEnabled = engine.settings.fuelDepletion !== false;
  const fuelCapacity = ship.maxFuel || 100;
  const fuelAmount = !isFuelDepletionEnabled
    ? fuelCapacity
    : ship.fuel !== undefined
    ? ship.fuel
    : fuelCapacity;
  const fuelPercent = !isFuelDepletionEnabled
    ? 100
    : Math.max(0, Math.min(100, Math.round((fuelAmount / fuelCapacity) * 100)));
  const isLowFuel = isFuelDepletionEnabled && fuelPercent <= 20 && fuelPercent > 0;
  const isFuelEmpty = isFuelDepletionEnabled && fuelPercent <= 0;
  const isBurnActive = ship.thrusting || ship.boosting || ship.reversing;

  let fuelBarColor = 'from-emerald-500 to-cyan-400';
  let fuelTextColor = 'text-cyan-300';
  let fuelBorder = 'border-cyan-500/30 shadow-cyan-950/30';

  if (!isFuelDepletionEnabled) {
    fuelBarColor = 'from-cyan-500 to-sky-400';
    fuelTextColor = 'text-cyan-300';
    fuelBorder = 'border-cyan-500/40 shadow-cyan-950/30';
  } else if (isFuelEmpty) {
    fuelBarColor = 'from-red-700 to-slate-700';
    fuelTextColor = 'text-red-500 animate-pulse';
    fuelBorder = 'border-red-500/60 shadow-red-950/50 bg-red-950/40';
  } else if (isLowFuel) {
    fuelBarColor = 'from-amber-600 to-red-500';
    fuelTextColor = 'text-amber-400';
    fuelBorder = 'border-amber-500/50 shadow-amber-950/40 bg-amber-950/30';
  } else if (fuelPercent <= 50) {
    fuelBarColor = 'from-yellow-500 to-amber-400';
    fuelTextColor = 'text-amber-300';
  }

  // Timer urgency
  const timerUrgent = timeRemaining < 15;

  return (
    <div id="hud-overlay" className="absolute inset-0 pointer-events-none p-4 select-none flex flex-col justify-between z-20">
      {/* Top Header Bar */}
      <div className="flex items-start justify-between gap-4">
        {/* Left: Mission Sector & Cargo Info */}
        <div className="flex items-center gap-3">
          <button
            id="hud-btn-pause"
            onClick={onPause}
            className="pointer-events-auto p-2.5 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 backdrop-blur-md transition-colors shadow-lg"
            title="Pause Flight (ESC)"
            aria-label="Pause Flight"
          >
            <Pause className="w-5 h-5" />
          </button>

          {onExitToMainMenu && (
            <button
              id="hud-btn-main-menu"
              onClick={() => {
                soundManager.playUiClick();
                onExitToMainMenu();
              }}
              className="pointer-events-auto flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 backdrop-blur-md transition-colors shadow-lg font-mono text-xs font-bold"
              title="Return to Main Menu"
              aria-label="Return to Main Menu"
            >
              <Home className="w-4 h-4 text-cyan-400" />
              <span className="hidden md:inline">Main Menu</span>
            </button>
          )}

          <div className="bg-slate-900/85 border border-cyan-500/30 rounded-xl px-4 py-2 backdrop-blur-md shadow-lg shadow-cyan-950/40">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 bg-cyan-950/70 px-1.5 py-0.5 rounded">
                {mission.codeName}
              </span>
              <h2 className="text-xs font-bold tracking-wide text-slate-200">{mission.title}</h2>
            </div>
            <p className="text-[11px] font-mono text-slate-400 truncate max-w-[200px] sm:max-w-xs mt-0.5">
              CARGO: <span className="text-cyan-300 font-semibold">{mission.cargoName}</span>
            </p>
          </div>
        </div>

        {/* Center: Countdown Clock & Outpost Distance */}
        <div className="flex items-center gap-2">
          {/* Mission Timer */}
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border backdrop-blur-md shadow-lg font-mono font-bold text-sm ${
              timerUrgent
                ? 'bg-red-950/80 border-red-500/70 text-red-400 shadow-red-950/50 animate-pulse'
                : 'bg-slate-900/85 border-cyan-500/30 text-cyan-300 shadow-cyan-950/40'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{timeRemaining.toFixed(1)}s</span>
          </div>

          {/* Nav Beacon Distance */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/85 border border-cyan-500/30 backdrop-blur-md shadow-lg font-mono text-xs text-slate-300">
            <Navigation className="w-3.5 h-3.5 text-lime-400" />
            <span>PAD: <span className="text-lime-400 font-bold">{distToPad}m</span></span>
          </div>
        </div>

        {/* Right: Package Stability Gauge */}
        <div className="flex flex-col items-end">
          <div className={`bg-slate-900/90 border rounded-xl px-4 py-2.5 backdrop-blur-md shadow-lg min-w-[170px] ${stabilityColor}`}>
            <div className="flex items-center justify-between gap-3 text-xs font-mono font-bold mb-1.5">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                <span>PACKAGE</span>
              </div>
              <span>{stability}%</span>
            </div>

            {/* Stability Progress Bar */}
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
              <div
                className={`h-full rounded-full transition-all duration-150 ${stabilityBg}`}
                style={{ width: `${stability}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[9px] font-mono mt-1 text-slate-400">
              <span>STATUS</span>
              <span className="font-bold tracking-wider">{stabilityLabel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Center Alert Banners (Low Fuel / Flameout / Cargo Breach) */}
      <div className="flex flex-col items-center gap-2 pointer-events-none">
        {stability <= 0 && (
          <div className="bg-red-950/95 border-2 border-red-500 px-5 py-2.5 rounded-2xl text-red-200 font-mono text-xs font-black tracking-wider flex items-center gap-2.5 shadow-2xl shadow-red-900/90 animate-bounce">
            <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
            <span>CRITICAL ALERT: CARGO CONTAINMENT CATASTROPHIC BREACH — 0% STABILITY</span>
          </div>
        )}
        {isFuelEmpty && (
          <div className="bg-red-950/90 border-2 border-red-500 px-4 py-2 rounded-xl text-red-300 font-mono text-xs font-bold flex items-center gap-2 shadow-2xl shadow-red-900/80 animate-pulse">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>FLAMEOUT: PROPELLANT TANK EMPTY - ADRIFT IN SPACE</span>
          </div>
        )}
        {!isFuelEmpty && isLowFuel && (
          <div className="bg-amber-950/80 border border-amber-500/80 px-3.5 py-1.5 rounded-xl text-amber-300 font-mono text-[11px] font-bold flex items-center gap-2 shadow-lg shadow-amber-950/60 animate-bounce">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>LOW FUEL WARNING - CONSERVE PROPELLANT</span>
          </div>
        )}
      </div>

      {/* Bottom Instrument Clusters */}
      <div className="flex items-end justify-between gap-4">
        {/* Left Flight Metrics: Speedometer, Fuel Tank, & Afterburner */}
        <div className="flex flex-col gap-2">
          {/* Speedometer */}
          <div className="bg-slate-900/85 border border-cyan-500/30 rounded-xl px-3.5 py-2 backdrop-blur-md shadow-lg shadow-cyan-950/40 font-mono text-xs w-48">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>VELOCITY</span>
              <span className={`font-bold ${isSafeSpeed ? 'text-lime-400' : 'text-red-400'}`}>
                {(speed * 10).toFixed(0)} <span className="text-[9px]">M/S</span>
              </span>
            </div>
            {/* Speed bar with threshold */}
            <div className="relative w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  isSafeSpeed ? 'bg-cyan-400' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, (speed / (pad.safeSpeedMax * 1.8)) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[8px] text-slate-500 mt-1">
              <span>0</span>
              <span className="text-lime-400 font-bold">DOCK SPEED: {(pad.safeSpeedMax * 10).toFixed(0)}</span>
              <span>MAX</span>
            </div>
          </div>

          {/* Primary Fuel Tank Meter */}
          <div className={`bg-slate-900/85 border rounded-xl px-3.5 py-2 backdrop-blur-md shadow-lg font-mono text-xs w-48 transition-colors ${fuelBorder}`}>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <div className="flex items-center gap-1.5">
                <Flame className={`w-3.5 h-3.5 ${!isFuelDepletionEnabled ? 'text-cyan-400' : isFuelEmpty ? 'text-red-500' : isLowFuel ? 'text-amber-400 animate-pulse' : 'text-cyan-400'}`} />
                <span className="font-bold tracking-tight">FUEL TANK</span>
              </div>
              <div className="flex items-center gap-1.5">
                {isBurnActive && !isFuelEmpty && (
                  <span className={`text-[8px] font-bold animate-pulse ${!isFuelDepletionEnabled ? 'text-cyan-400' : 'text-amber-400'}`}>
                    {!isFuelDepletionEnabled ? 'ACTIVE' : 'FLOW'}
                  </span>
                )}
                <span className={`font-bold ${fuelTextColor}`}>
                  {!isFuelDepletionEnabled ? 'UNLIMITED' : isFuelEmpty ? 'EMPTY' : `${fuelPercent}%`}
                </span>
              </div>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
              <div
                className={`h-full bg-gradient-to-r rounded-full transition-all duration-100 ${fuelBarColor}`}
                style={{ width: `${fuelPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[8px] font-mono text-slate-500 mt-1">
              <span>0L</span>
              <span className={!isFuelDepletionEnabled ? 'text-cyan-400 font-bold' : 'text-slate-400'}>
                {!isFuelDepletionEnabled ? 'CONSUMPTION: OFF (∞)' : `${Math.round(fuelAmount)} / ${fuelCapacity} L`}
              </span>
              <span>{!isFuelDepletionEnabled ? '∞' : '100%'}</span>
            </div>
          </div>

          {/* Boost Capacitor Fuel Meter */}
          <div className="bg-slate-900/85 border border-pink-500/30 rounded-xl px-3.5 py-2 backdrop-blur-md shadow-lg shadow-pink-950/30 font-mono text-xs w-48">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <div className="flex items-center gap-1 text-pink-400">
                <Zap className="w-3 h-3" />
                <span>BOOST FUEL</span>
              </div>
              <span className="font-bold text-pink-300">
                {Math.round(ship.boostFuel * 100)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-full transition-all duration-75"
                style={{ width: `${ship.boostFuel * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right Info: Rings Collected & Assist Mode Indicator */}
        <div className="flex flex-col items-end gap-2">
          {/* Bonus Rings */}
          {mission.bonusRings.length > 0 && (
            <div className="bg-slate-900/85 border border-cyan-500/30 rounded-xl px-3 py-1.5 backdrop-blur-md shadow-lg font-mono text-xs flex items-center gap-2 text-cyan-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>RINGS: <span className="font-bold text-cyan-200">{ringsCollected} / {mission.bonusRings.length}</span></span>
            </div>
          )}

          {/* Assist Mode Indicator */}
          {engine.settings.assistMode && (
            <div className="bg-slate-900/85 border border-emerald-500/30 rounded-xl px-2.5 py-1 backdrop-blur-md shadow-lg font-mono text-[10px] flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>ASSIST MODE ACTIVE</span>
            </div>
          )}

          {/* Mouse Flight Indicator */}
          {engine.settings.mouseControls !== false && (
            <div className="bg-slate-900/85 border border-cyan-500/30 rounded-xl px-2.5 py-1 backdrop-blur-md shadow-lg font-mono text-[10px] flex items-center gap-1.5 text-cyan-300">
              <MousePointer className="w-3 h-3 text-cyan-400" />
              <span>MOUSE FLIGHT READY</span>
            </div>
          )}

          {/* Fuel Consumption Status Badge if Disabled */}
          {!isFuelDepletionEnabled && (
            <div className="bg-slate-900/85 border border-cyan-500/30 rounded-xl px-2.5 py-1 backdrop-blur-md shadow-lg font-mono text-[10px] flex items-center gap-1.5 text-cyan-300">
              <Flame className="w-3 h-3 text-cyan-400" />
              <span>INFINITE FUEL (CONSUMPTION OFF)</span>
            </div>
          )}

          {/* Warning Flag when near lethal obstacle or critical stability */}
          {stability < 30 && (
            <div className="bg-red-950/90 border border-red-500/70 rounded-xl px-3 py-1.5 backdrop-blur-md shadow-lg shadow-red-950/50 font-mono text-[11px] flex items-center gap-1.5 text-red-400 animate-bounce">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="font-bold">CARGO STABILITY CRITICAL!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
