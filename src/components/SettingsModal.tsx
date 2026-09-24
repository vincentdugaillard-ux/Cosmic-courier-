// Cosmic Courier - Flight Settings & Configuration Modal
import React, { useState } from 'react';
import { PlayerSettings, GameDifficulty } from '../types/game';
import {
  X,
  Volume2,
  VolumeX,
  Music,
  Sliders,
  Sparkles,
  RotateCcw,
  Keyboard,
  Compass,
  Gauge,
  ShieldAlert,
  Flame,
  MousePointer,
  Laptop,
  Smartphone,
} from 'lucide-react';
import { soundManager } from '../audio/soundManager';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsModalProps {
  settings: PlayerSettings;
  onUpdateSettings: (newSettings: Partial<PlayerSettings>) => void;
  onResetProgress: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onResetProgress,
  onClose,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);
  const currentDifficulty: GameDifficulty = settings.difficulty || 'courier';

  const difficultyOptions: {
    id: GameDifficulty;
    name: string;
    tagline: string;
    color: string;
    border: string;
    bgActive: string;
    details: string;
    reward: string;
  }[] = [
    {
      id: 'cadet',
      name: 'CADET',
      tagline: 'Casual & Forgiving',
      color: 'text-emerald-400',
      border: 'border-emerald-500/50',
      bgActive: 'bg-emerald-950/40 border-emerald-400',
      details: '0.6x Impact Damage • +25% Delivery Time • Forgiving Docking Pad',
      reward: '0.85x Payout',
    },
    {
      id: 'courier',
      name: 'COURIER',
      tagline: 'Guild Standard (Balanced)',
      color: 'text-cyan-400',
      border: 'border-cyan-500/50',
      bgActive: 'bg-cyan-950/40 border-cyan-400',
      details: '1.0x Damage & Clock • Standard Flight Physics • Standard Payout',
      reward: '1.0x Payout',
    },
    {
      id: 'veteran',
      name: 'VETERAN',
      tagline: 'High Risk Challenge',
      color: 'text-amber-400',
      border: 'border-amber-500/50',
      bgActive: 'bg-amber-950/40 border-amber-400',
      details: '1.4x Impact Damage • -15% Time Limit • High Speed Docking Penalty',
      reward: '+35% Credits & XP',
    },
    {
      id: 'hardcore',
      name: 'HARDCORE',
      tagline: 'Extreme Lethality',
      color: 'text-rose-400',
      border: 'border-rose-500/50',
      bgActive: 'bg-rose-950/40 border-rose-400',
      details: '2.0x Lethal Damage • -30% Time Limit • Strict Touchdown Tolerance',
      reward: '+75% Credits & XP',
    },
  ];

  return (
    <div
      id="settings-modal-overlay"
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in select-none"
    >
      <div className="bg-slate-900 border-2 border-cyan-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl shadow-cyan-950/80 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold font-mono tracking-wide text-cyan-300">
              FLIGHT SYSTEM SETTINGS
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Calibrate difficulty, audio, sensitivity, and navigation assists
            </p>
          </div>
          <button
            id="settings-btn-close"
            onClick={() => {
              soundManager.playUiClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Difficulty Parameter Section */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-mono font-bold text-slate-300 tracking-wider uppercase">
                Mission Difficulty Parameter
              </h3>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700 font-bold">
              CURRENT: {currentDifficulty.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {difficultyOptions.map((opt) => {
              const isSelected = currentDifficulty === opt.id;
              return (
                <button
                  key={opt.id}
                  id={`settings-difficulty-${opt.id}`}
                  onClick={() => {
                    soundManager.playUiClick();
                    onUpdateSettings({ difficulty: opt.id });
                  }}
                  className={`text-left p-3 rounded-2xl border transition-all ${
                    isSelected
                      ? `${opt.bgActive} shadow-md shadow-slate-950`
                      : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-950/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono font-black ${opt.color}`}>
                        {opt.name}
                      </span>
                      <span className="text-[11px] text-slate-400 font-sans">
                        • {opt.tagline}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300">
                      {opt.reward}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {opt.details}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Audio Controls */}
        <div className="flex flex-col gap-4 mb-6">
          <h3 className="text-xs font-mono font-bold text-slate-400 tracking-wider uppercase">
            Audio Channels
          </h3>

          {/* Sound FX Toggle & Volume */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-mono text-slate-200">
                {settings.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-500" />
                )}
                <span>Sound Effects</span>
              </div>
              <button
                id="settings-toggle-sound"
                onClick={() => {
                  const newVal = !settings.soundEnabled;
                  onUpdateSettings({ soundEnabled: newVal });
                  soundManager.setSettings(
                    newVal,
                    settings.musicEnabled,
                    settings.masterVolume,
                    settings.sfxVolume,
                    settings.musicVolume
                  );
                }}
                className={`w-12 h-6 rounded-full transition-colors p-1 ${
                  settings.soundEnabled ? 'bg-cyan-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.soundEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {settings.soundEnabled && (
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-slate-400 w-14">VOLUME</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.sfxVolume}
                  onChange={(e) => {
                    const vol = parseFloat(e.target.value);
                    onUpdateSettings({ sfxVolume: vol });
                    soundManager.setSettings(
                      settings.soundEnabled,
                      settings.musicEnabled,
                      settings.masterVolume,
                      vol,
                      settings.musicVolume
                    );
                  }}
                  className="flex-1 accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="text-[11px] font-mono text-slate-300 w-8 text-right">
                  {Math.round(settings.sfxVolume * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Ambient Music Toggle & Volume */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-mono text-slate-200">
                <Music className="w-4 h-4 text-pink-400" />
                <span>Cosmic Synth Music</span>
              </div>
              <button
                id="settings-toggle-music"
                onClick={() => {
                  const newVal = !settings.musicEnabled;
                  onUpdateSettings({ musicEnabled: newVal });
                  soundManager.setSettings(
                    settings.soundEnabled,
                    newVal,
                    settings.masterVolume,
                    settings.sfxVolume,
                    settings.musicVolume
                  );
                }}
                className={`w-12 h-6 rounded-full transition-colors p-1 ${
                  settings.musicEnabled ? 'bg-pink-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.musicEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {settings.musicEnabled && (
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-slate-400 w-14">VOLUME</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.musicVolume}
                  onChange={(e) => {
                    const vol = parseFloat(e.target.value);
                    onUpdateSettings({ musicVolume: vol });
                    soundManager.setSettings(
                      settings.soundEnabled,
                      settings.musicEnabled,
                      settings.masterVolume,
                      settings.sfxVolume,
                      vol
                    );
                  }}
                  className="flex-1 accent-pink-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="text-[11px] font-mono text-slate-300 w-8 text-right">
                  {Math.round(settings.musicVolume * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Flight Dynamics & Assists */}
        <div className="flex flex-col gap-4 mb-6">
          <h3 className="text-xs font-mono font-bold text-slate-400 tracking-wider uppercase">
            Flight Dynamics
          </h3>

          {/* Control Sensitivity Slider */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm font-mono text-slate-200 mb-1">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Steering Sensitivity</span>
              </div>
              <span className="text-cyan-400 font-bold">
                {Math.round((settings.controlSensitivity || 1.0) * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.05"
                value={settings.controlSensitivity || 1.0}
                onChange={(e) => {
                  onUpdateSettings({ controlSensitivity: parseFloat(e.target.value) });
                }}
                className="flex-1 accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Controls the turn rate of the ship when rotating left or right.
            </p>
          </div>

          {/* Primary Device Control Mode Switcher: Laptop <-> Phone */}
          <div className="bg-slate-950/80 border-2 border-cyan-500/50 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 shadow-lg shadow-cyan-950/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {settings.controlMode === 'phone' ? (
                  <Smartphone className="w-5 h-5 text-pink-400 shrink-0" />
                ) : (
                  <Laptop className="w-5 h-5 text-cyan-400 shrink-0" />
                )}
                <div>
                  <h4 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wide">
                    Flight Control Setting
                  </h4>
                  <p className="text-xs text-slate-400 font-mono">
                    Switch between Laptop / Desktop inputs and Phone / Touch controls
                  </p>
                </div>
              </div>
            </div>

            {/* Toggle segmented buttons: Laptop <---> Phone */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl">
              <button
                id="settings-control-laptop"
                type="button"
                onClick={() => {
                  soundManager.playUiClick();
                  onUpdateSettings({ controlMode: 'laptop' });
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-mono text-xs font-bold transition-all ${
                  settings.controlMode !== 'phone'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Laptop className="w-4 h-4" />
                <span>Laptop Mode 💻</span>
              </button>

              <button
                id="settings-control-phone"
                type="button"
                onClick={() => {
                  soundManager.playUiClick();
                  onUpdateSettings({ controlMode: 'phone' });
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-mono text-xs font-bold transition-all ${
                  settings.controlMode === 'phone'
                    ? 'bg-pink-500 text-slate-950 shadow-md shadow-pink-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Phone Mode 📱</span>
              </button>
            </div>

            {/* Mode Description */}
            <div className="text-xs font-mono p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300 flex items-start gap-2">
              {settings.controlMode === 'phone' ? (
                <div>
                  <span className="text-pink-400 font-bold block mb-0.5">📱 Active: Phone Touch Controls</span>
                  <span className="text-slate-300">
                    Enables on-screen multi-touch buttons (Left/Right steering, Airbrake, Thruster, Afterburner) and direct screen-touch piloting (touch and hold anywhere on the screen to aim and thrust toward your finger).
                  </span>
                </div>
              ) : (
                <div>
                  <span className="text-cyan-400 font-bold block mb-0.5">💻 Active: Laptop / Desktop Controls</span>
                  <span className="text-slate-300">
                    Optimized for keyboard (WASD / Arrow Keys, Space for afterburner boost, B/Down for airbrake) and mouse cursor steering with targeting crosshair.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Assist Mode Toggle */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-mono text-slate-200 font-bold mb-0.5">
                <Compass className="w-4 h-4 text-emerald-400" />
                <span>Assist Mode</span>
              </div>
              <p className="text-xs text-slate-400 font-light">
                Applies a subtle magnetic pull toward the safe route line and automatic gentle deceleration when approaching obstacles at dangerous speeds.
              </p>
            </div>
            <button
              id="settings-toggle-assist"
              onClick={() => {
                soundManager.playUiClick();
                onUpdateSettings({ assistMode: !settings.assistMode });
              }}
              className={`w-12 h-6 rounded-full transition-colors p-1 shrink-0 ${
                settings.assistMode ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.assistMode ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Mouse Flight Controls Toggle */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-mono text-slate-200 font-bold mb-0.5">
                <MousePointer className="w-4 h-4 text-cyan-400" />
                <span>Mouse Flight Controls</span>
              </div>
              <p className="text-xs text-slate-400 font-light">
                Point cursor to direct ship trajectory. Left Click for main thruster, Right Click for retro airbrake, Middle Click / Space for afterburner.
              </p>
            </div>
            <button
              id="settings-toggle-mouse-controls"
              onClick={() => {
                soundManager.playUiClick();
                const currentVal = settings.mouseControls !== false;
                onUpdateSettings({ mouseControls: !currentVal });
              }}
              className={`w-12 h-6 rounded-full transition-colors p-1 shrink-0 ${
                settings.mouseControls !== false ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.mouseControls !== false ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Fuel Consumption / Propellant Depletion Toggle */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Flame className={`w-4 h-4 ${settings.fuelDepletion !== false ? 'text-amber-400' : 'text-cyan-400'}`} />
                <span className="text-sm font-mono text-slate-200 font-bold">Fuel Consumption</span>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    settings.fuelDepletion !== false
                      ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                      : 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40'
                  }`}
                >
                  {settings.fuelDepletion !== false ? 'ACTIVE (REALISTIC)' : 'DEACTIVATED (UNLIMITED)'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-light leading-relaxed">
                {settings.fuelDepletion !== false
                  ? 'Engines consume propellant during thrust and boost. Reaching 0% causes flameout and drifts on momentum. Hyper-rings refill +25% fuel. Conserving fuel awards score & credit bonuses.'
                  : 'Fuel tank remains unlimited (infinite propellant). Thrusters and afterburners fire continuously without flameout risk. Great for casual navigation and obstacle practice.'}
              </p>
            </div>
            <button
              id="settings-toggle-fuel-consumption"
              onClick={() => {
                soundManager.playUiClick();
                const currentVal = settings.fuelDepletion !== false;
                onUpdateSettings({ fuelDepletion: !currentVal });
              }}
              className={`w-12 h-6 rounded-full transition-colors p-1 shrink-0 ${
                settings.fuelDepletion !== false ? 'bg-amber-500' : 'bg-slate-700'
              }`}
              title="Activate or Deactivate Fuel Consumption"
              aria-label="Toggle Fuel Consumption"
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.fuelDepletion !== false ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* PWA Application Installation (Android Chrome & Desktop) */}
        <PWAInstallButton variant="settings" className="mb-6" />

        {/* Flight Keybindings Guide */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 mb-3">
            <Keyboard className="w-4 h-4" />
            <span>FLIGHT KEYBINDINGS</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="flex justify-between bg-slate-900/60 p-2 rounded-lg text-slate-300">
              <span className="text-slate-400">Forward Thrust:</span>
              <strong className="text-cyan-300">[W] or [↑]</strong>
            </div>
            <div className="flex justify-between bg-slate-900/60 p-2 rounded-lg text-slate-300">
              <span className="text-slate-400">Rotate Left / Right:</span>
              <strong className="text-cyan-300">[A / D] or [← / →]</strong>
            </div>
            <div className="flex justify-between bg-slate-900/60 p-2 rounded-lg text-slate-300">
              <span className="text-slate-400">Afterburner Boost:</span>
              <strong className="text-pink-300">[SPACE]</strong>
            </div>
            <div className="flex justify-between bg-slate-900/60 p-2 rounded-lg text-slate-300">
              <span className="text-slate-400">Retro Airbrake:</span>
              <strong className="text-amber-300">[S], [B] or [↓]</strong>
            </div>
            <div className="flex justify-between bg-slate-900/60 p-2 rounded-lg text-slate-300">
              <span className="text-slate-400">Mouse Steering:</span>
              <strong className="text-cyan-300">Cursor Aim Reticle</strong>
            </div>
            <div className="flex justify-between bg-slate-900/60 p-2 rounded-lg text-slate-300">
              <span className="text-slate-400">Mouse Thrust / Brake:</span>
              <strong className="text-cyan-300">L-Click / R-Click</strong>
            </div>
          </div>
        </div>

        {/* Danger Zone: Reset Career */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-red-400 font-bold block">CAREER DATA</span>
            <span className="text-[11px] font-mono text-slate-500">
              Clear scores, credits, and unlocked ships
            </span>
          </div>

          {confirmReset ? (
            <div className="flex items-center gap-2">
              <button
                id="settings-btn-confirm-reset"
                onClick={() => {
                  onResetProgress();
                  setConfirmReset(false);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold"
              >
                Confirm Reset
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-mono text-xs"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              id="settings-btn-reset"
              onClick={() => setConfirmReset(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-red-950/60 hover:text-red-400 border border-slate-700/60 text-slate-400 font-mono text-xs flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Career</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
