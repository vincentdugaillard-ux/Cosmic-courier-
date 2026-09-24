// Cosmic Courier - Retro Neon Main Menu
import React from 'react';
import { PlayerProfile, Ship, GameDifficulty } from '../types/game';
import { SHIPS, CAMPAIGN_MISSIONS } from '../game/constants';
import {
  Play,
  Rocket,
  Settings,
  Award,
  Compass,
  ShieldCheck,
  Gamepad2,
  Briefcase,
  Gauge,
  Flame,
  Wrench,
} from 'lucide-react';
import { soundManager } from '../audio/soundManager';
import { PWAInstallButton } from './PWAInstallButton';

interface MainMenuProps {
  profile: PlayerProfile;
  onPlayGame: () => void;
  onStartCampaign: () => void;
  onOpenContracts: () => void;
  onOpenHangar: () => void;
  onOpenMapEditor?: () => void;
  onOpenSettings: () => void;
  onUpdateDifficulty?: (diff: GameDifficulty) => void;
  onUpdateSettings?: (settings: Partial<PlayerProfile['settings']>) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  profile,
  onPlayGame,
  onStartCampaign,
  onOpenContracts,
  onOpenHangar,
  onOpenMapEditor,
  onOpenSettings,
  onUpdateDifficulty,
  onUpdateSettings,
}) => {
  const currentShip: Ship =
    SHIPS.find((s) => s.id === profile.selectedShipId) || SHIPS[0];

  const totalGames =
    profile.statistics.totalGamesPlayed ?? profile.statistics.missionsAttempted ?? 0;

  const currentDifficulty: GameDifficulty = profile.settings.difficulty || 'courier';

  const difficulties: { id: GameDifficulty; label: string; desc: string; badge: string }[] = [
    { id: 'cadet', label: 'Cadet', desc: '0.6x Damage, +25% Time, 0.85x ₢', badge: 'Casual' },
    { id: 'courier', label: 'Courier', desc: 'Standard Guild Parameters (1.0x)', badge: 'Standard' },
    { id: 'veteran', label: 'Veteran', desc: '1.4x Damage, -15% Time, +35% ₢ & XP', badge: 'High Risk' },
    { id: 'hardcore', label: 'Hardcore', desc: '2.0x Damage, -30% Time, +75% ₢ & XP', badge: 'Extreme' },
  ];

  // Determine next mission to play
  const nextMission =
    CAMPAIGN_MISSIONS.find(
      (m, idx) =>
        (idx === 0 || profile.completedMissionIds.includes(CAMPAIGN_MISSIONS[idx - 1].id)) &&
        !profile.completedMissionIds.includes(m.id)
    ) || CAMPAIGN_MISSIONS[0];

  return (
    <div
      id="main-menu-screen"
      className="relative min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between overflow-x-hidden overflow-y-auto p-4 sm:p-8 md:p-10 select-none"
      style={{
        backgroundImage:
          'radial-gradient(circle at 50% 20%, rgba(14, 165, 233, 0.12) 0%, rgba(15, 23, 42, 0) 70%), radial-gradient(circle at 80% 80%, rgba(236, 72, 153, 0.08) 0%, rgba(15, 23, 42, 0) 60%)',
      }}
    >
      {/* Top Header Bar */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30 border border-cyan-300/40">
            <Rocket className="w-6 h-6 text-slate-950 -rotate-45" />
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-widest text-cyan-400 font-bold block">
              GALACTIC COURIER GUILD
            </span>
            <span className="text-xs font-mono text-slate-400">STATUS: FLIGHT READY</span>
          </div>
        </div>

        {/* Top Header Actions & Profile */}
        <div className="flex items-center gap-3">
          {/* In-App PWA Install Button (Android / Chrome) */}
          <PWAInstallButton />

          {/* Player Profile Snapshot */}
          <div className="hidden sm:flex items-center gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-2 backdrop-blur-sm">
            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-400 block">GAMES PLAYED</span>
              <span className="text-sm font-mono font-bold text-cyan-300 tracking-wide">
                {totalGames}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="text-right">
              <span className="text-[10px] font-mono text-slate-400 block">CREDITS</span>
              <span className="text-sm font-mono font-bold text-amber-400 tracking-wide">
                {profile.totalCredits.toLocaleString()} ₢
              </span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <span className="text-[10px] font-mono text-slate-400 block">RANK</span>
              <span className="text-xs font-mono font-bold text-cyan-400">
                LVL {profile.currentLevel}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Center Section */}
      <main className="max-w-4xl w-full mx-auto my-auto text-center py-8 sm:py-10">
        {/* Neon Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-mono text-xs mb-6 shadow-lg shadow-cyan-950/40">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          ARCADE SPACE DELIVERY CHALLENGE
        </div>

        {/* Title */}
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-100 to-pink-400 drop-shadow-[0_0_35px_rgba(0,240,255,0.4)] mb-4">
          COSMIC COURIER
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto font-light leading-relaxed mb-6">
          Pilot precision spacecraft through hazard-filled celestial corridors, deliver fragile cargo intact, and race against the mission clock.
        </p>

        {/* Flight Parameters: Difficulty & Fuel Consumption */}
        <div className="max-w-2xl mx-auto mb-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          {/* Difficulty Parameter Selector Bar */}
          <div className="w-full sm:w-auto flex-1 bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 backdrop-blur-sm flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <Gauge className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="text-slate-400">DIFF:</span>
              <span
                className={`font-black tracking-wide ${
                  currentDifficulty === 'hardcore'
                    ? 'text-rose-400'
                    : currentDifficulty === 'veteran'
                    ? 'text-amber-400'
                    : currentDifficulty === 'cadet'
                    ? 'text-emerald-400'
                    : 'text-cyan-300'
                }`}
              >
                {currentDifficulty.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {difficulties.map((diff) => {
                const isSelected = currentDifficulty === diff.id;
                return (
                  <button
                    key={diff.id}
                    id={`main-menu-diff-${diff.id}`}
                    onClick={() => {
                      soundManager.playUiClick();
                      if (onUpdateDifficulty) {
                        onUpdateDifficulty(diff.id);
                      }
                    }}
                    className={`px-2 py-1 rounded-xl text-xs font-mono font-bold transition-all ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25 scale-105'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                    }`}
                    title={diff.desc}
                  >
                    {diff.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Fuel Consumption Toggle Button */}
          <button
            id="main-menu-toggle-fuel"
            onClick={() => {
              soundManager.playUiClick();
              const currentVal = profile.settings.fuelDepletion !== false;
              if (onUpdateSettings) {
                onUpdateSettings({ fuelDepletion: !currentVal });
              }
            }}
            className={`w-full sm:w-auto bg-slate-900/90 border rounded-2xl p-2.5 backdrop-blur-sm flex items-center justify-between sm:justify-start gap-3 shadow-lg transition-all hover:scale-105 active:scale-95 ${
              profile.settings.fuelDepletion !== false
                ? 'border-amber-500/50 hover:border-amber-400 text-amber-300'
                : 'border-cyan-500/50 hover:border-cyan-400 text-cyan-300'
            }`}
            title="Click to Activate / Deactivate Fuel Consumption (Propellant Depletion)"
            aria-label="Toggle Fuel Consumption"
          >
            <div className="flex items-center gap-2 text-xs font-mono">
              <Flame
                className={`w-4 h-4 shrink-0 ${
                  profile.settings.fuelDepletion !== false ? 'text-amber-400' : 'text-cyan-400'
                }`}
              />
              <span className="text-slate-400">FUEL:</span>
              <span className="font-bold">
                {profile.settings.fuelDepletion !== false ? 'CONSUMPTION ON' : 'UNLIMITED'}
              </span>
            </div>
            <div
              className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${
                profile.settings.fuelDepletion !== false
                  ? 'bg-amber-950/80 border-amber-500/40 text-amber-300'
                  : 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300'
              }`}
            >
              {profile.settings.fuelDepletion !== false ? 'REALISTIC' : 'OFF'}
            </div>
          </button>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5 max-w-2xl mx-auto mb-10">
          {/* Prominent Play Game Button */}
          <button
            id="menu-btn-play-game"
            onClick={() => {
              soundManager.playUiClick();
              onPlayGame();
            }}
            className="w-full sm:w-auto flex-[1.4] py-4 px-7 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-mono font-black text-lg tracking-wider flex items-center justify-center gap-3 shadow-2xl shadow-cyan-400/40 transition-all hover:scale-105 active:scale-95 border-2 border-cyan-200"
          >
            <Play className="w-6 h-6 fill-current shrink-0" />
            <div className="text-left leading-tight">
              <span className="block font-black">PLAY GAME</span>
              <span className="text-[10px] font-mono tracking-normal font-semibold text-slate-900/80 block">
                {nextMission.title} • {nextMission.codeName}
              </span>
            </div>
          </button>

          {/* Select Sector Button */}
          <button
            id="menu-btn-select-mission"
            onClick={() => {
              soundManager.playUiClick();
              onStartCampaign();
            }}
            className="w-full sm:w-auto flex-1 py-4 px-5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border-2 border-slate-700 hover:border-cyan-500/60 text-slate-200 font-mono font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg"
          >
            <span>Sectors</span>
          </button>

          {/* Contracts Board Button */}
          <button
            id="menu-btn-contracts"
            onClick={() => {
              soundManager.playUiClick();
              onOpenContracts();
            }}
            className="w-full sm:w-auto flex-1 py-4 px-5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border-2 border-slate-700 hover:border-pink-500/60 text-slate-200 font-mono font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg"
          >
            <Briefcase className="w-4 h-4 text-pink-400 shrink-0" />
            <span>Contracts</span>
          </button>

          {/* Ship Hangar Button */}
          <button
            id="menu-btn-hangar"
            onClick={() => {
              soundManager.playUiClick();
              onOpenHangar();
            }}
            className="w-full sm:w-auto flex-1 py-4 px-5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border-2 border-slate-700 hover:border-cyan-500/60 text-slate-200 font-mono font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg"
          >
            <Rocket className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Hangar</span>
          </button>

          {/* Map Creator / Sector Architect Button */}
          {onOpenMapEditor && (
            <button
              id="menu-btn-map-creator"
              onClick={() => {
                soundManager.playUiClick();
                onOpenMapEditor();
              }}
              className="w-full sm:w-auto flex-1 py-4 px-5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border-2 border-slate-700 hover:border-emerald-500/60 text-slate-200 font-mono font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg"
              title="Create, build, and test your own custom maps"
            >
              <Wrench className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Map Creator</span>
            </button>
          )}
        </div>

        {/* Quick Career Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-4xl mx-auto">
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs font-mono mb-1">
              <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>GAMES PLAYED</span>
            </div>
            <span className="text-lg font-mono font-bold text-cyan-300">
              {totalGames}
            </span>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs font-mono mb-1">
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span>DELIVERIES</span>
            </div>
            <span className="text-lg font-mono font-bold text-slate-200">
              {profile.statistics.deliveriesCompleted}
            </span>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs font-mono mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-lime-400" />
              <span>FLAWLESS</span>
            </div>
            <span className="text-lg font-mono font-bold text-lime-400">
              {profile.statistics.flawlessDeliveries}
            </span>
          </div>

          <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs font-mono mb-1">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>ACTIVE SHIP</span>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-300 truncate block">
              {currentShip.name}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-slate-900/70 border border-slate-800/80 rounded-xl p-3 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs font-mono mb-1">
              <Rocket className="w-3.5 h-3.5 text-pink-400" />
              <span>UNLOCKED</span>
            </div>
            <span className="text-lg font-mono font-bold text-pink-400">
              {profile.unlockedShipIds.length} / {SHIPS.length}
            </span>
          </div>
        </div>
      </main>

      {/* Footer Controls & Settings */}
      <footer className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-900 text-slate-500 text-xs font-mono">
        <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
          <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800 text-slate-400">
            [W / ↑] THRUST
          </span>
          <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800 text-slate-400">
            [A / D / ← / →] STEER
          </span>
          <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800 text-slate-400">
            [SPACE] BOOST
          </span>
          <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800 text-slate-400">
            [S / B / ↓] BRAKE
          </span>
        </div>

        <button
          id="menu-btn-settings"
          onClick={() => {
            soundManager.playUiClick();
            onOpenSettings();
          }}
          className="flex items-center gap-2 text-slate-400 hover:text-cyan-300 transition-colors p-2 rounded-lg hover:bg-slate-900"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
          <span>Flight Settings</span>
        </button>
      </footer>
    </div>
  );
};
