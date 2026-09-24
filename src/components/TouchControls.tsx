// Cosmic Courier - On-Screen Touch Controls for Mobile/Tablet
import React, { useState } from 'react';
import { RotateCcw, RotateCw, Rocket, Zap, ShieldAlert, Laptop, Smartphone } from 'lucide-react';
import { GameEngineInput } from '../game/gameEngine';
import { soundManager } from '../audio/soundManager';

interface TouchControlsProps {
  inputRef: React.MutableRefObject<GameEngineInput>;
  boostFuel: number;
  fuel?: number;
  fuelDepletionEnabled?: boolean;
  onToggleControlMode?: () => void;
  controlMode?: 'laptop' | 'phone';
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  inputRef,
  boostFuel,
  fuel,
  fuelDepletionEnabled = true,
  onToggleControlMode,
  controlMode = 'phone',
}) => {
  const isOutOfFuel = fuelDepletionEnabled && fuel !== undefined && fuel <= 0;
  const [activeKeys, setActiveKeys] = useState<{ [key: string]: boolean }>({});

  const handlePressStart = (key: keyof GameEngineInput) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    inputRef.current[key] = true;
    setActiveKeys((prev) => ({ ...prev, [key]: true }));

    if (key === 'thrust') {
      soundManager.playUiClick();
    }
  };

  const handlePressEnd = (key: keyof GameEngineInput) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    inputRef.current[key] = false;
    setActiveKeys((prev) => ({ ...prev, [key]: false }));
  };

  return (
    <div
      id="touch-controls-container"
      className="absolute inset-x-0 bottom-0 pointer-events-none p-3 sm:p-5 select-none z-30 flex flex-col justify-end"
      style={{ touchAction: 'none' }}
    >
      {/* Top Mobile Control Bar Hint & Switch */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between mb-2 px-1 pointer-events-auto">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/70 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono backdrop-blur-md">
          <Smartphone className="w-3 h-3 text-cyan-400" />
          <span>TOUCH MODE: TAP / HOLD SCREEN TO STEER & THRUST</span>
        </div>

        {onToggleControlMode && (
          <button
            onClick={() => {
              soundManager.playUiClick();
              onToggleControlMode();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 text-[10px] font-mono transition-colors shadow-lg active:scale-95"
            title="Switch back to Laptop / Desktop controls"
          >
            <Laptop className="w-3 h-3 text-cyan-400" />
            <span>Switch to Laptop Controls</span>
          </button>
        )}
      </div>

      <div className="max-w-4xl mx-auto w-full flex items-end justify-between">
        {/* Left Hand: Steering Controls & Airbrake */}
        <div className="flex items-end gap-2.5 pointer-events-auto">
          {/* Retro Airbrake (Left side for quick thumb tap) */}
          <button
            id="touch-btn-brake"
            onTouchStart={handlePressStart('reverse')}
            onTouchEnd={handlePressEnd('reverse')}
            onTouchCancel={handlePressEnd('reverse')}
            onMouseDown={handlePressStart('reverse')}
            onMouseUp={handlePressEnd('reverse')}
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 flex flex-col items-center justify-center shadow-lg backdrop-blur-md transition-all active:scale-90 ${
              activeKeys['reverse']
                ? 'bg-amber-950/90 border-amber-300 text-amber-200 shadow-amber-500/40 scale-95'
                : 'bg-slate-900/80 border-amber-500/60 text-amber-400 shadow-amber-950/40'
            }`}
            aria-label="Airbrake"
          >
            <ShieldAlert className="w-6 h-6" />
            <span className="text-[9px] font-mono font-bold tracking-tight">BRAKE</span>
          </button>

          {/* Steer Left */}
          <button
            id="touch-btn-left"
            onTouchStart={handlePressStart('turnLeft')}
            onTouchEnd={handlePressEnd('turnLeft')}
            onTouchCancel={handlePressEnd('turnLeft')}
            onMouseDown={handlePressStart('turnLeft')}
            onMouseUp={handlePressEnd('turnLeft')}
            className={`w-16 h-16 sm:w-18 sm:h-18 rounded-2xl border-2 flex flex-col items-center justify-center shadow-xl backdrop-blur-md transition-all active:scale-90 ${
              activeKeys['turnLeft']
                ? 'bg-cyan-950/90 border-cyan-300 text-cyan-200 shadow-cyan-500/40 scale-95 ring-2 ring-cyan-400/50'
                : 'bg-slate-900/80 border-cyan-500/60 text-cyan-400 shadow-cyan-950/50'
            }`}
            aria-label="Steer Left"
          >
            <RotateCcw className="w-8 h-8" />
            <span className="text-[8px] font-mono font-bold tracking-wider mt-0.5">LEFT</span>
          </button>

          {/* Steer Right */}
          <button
            id="touch-btn-right"
            onTouchStart={handlePressStart('turnRight')}
            onTouchEnd={handlePressEnd('turnRight')}
            onTouchCancel={handlePressEnd('turnRight')}
            onMouseDown={handlePressStart('turnRight')}
            onMouseUp={handlePressEnd('turnRight')}
            className={`w-16 h-16 sm:w-18 sm:h-18 rounded-2xl border-2 flex flex-col items-center justify-center shadow-xl backdrop-blur-md transition-all active:scale-90 ${
              activeKeys['turnRight']
                ? 'bg-cyan-950/90 border-cyan-300 text-cyan-200 shadow-cyan-500/40 scale-95 ring-2 ring-cyan-400/50'
                : 'bg-slate-900/80 border-cyan-500/60 text-cyan-400 shadow-cyan-950/50'
            }`}
            aria-label="Steer Right"
          >
            <RotateCw className="w-8 h-8" />
            <span className="text-[8px] font-mono font-bold tracking-wider mt-0.5">RIGHT</span>
          </button>
        </div>

        {/* Right Hand: Boost & Main Engine Thruster */}
        <div className="flex items-end gap-2.5 pointer-events-auto">
          {/* Afterburner Boost */}
          <button
            id="touch-btn-boost"
            onTouchStart={handlePressStart('boost')}
            onTouchEnd={handlePressEnd('boost')}
            onTouchCancel={handlePressEnd('boost')}
            onMouseDown={handlePressStart('boost')}
            onMouseUp={handlePressEnd('boost')}
            disabled={boostFuel <= 0.05 || isOutOfFuel}
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 flex flex-col items-center justify-center shadow-lg backdrop-blur-md transition-all active:scale-90 ${
              boostFuel > 0.05 && !isOutOfFuel
                ? activeKeys['boost']
                  ? 'bg-pink-950/90 border-pink-300 text-pink-200 shadow-pink-500/40 scale-95 ring-2 ring-pink-400/50'
                  : 'bg-slate-900/80 border-pink-500/60 text-pink-400 shadow-pink-950/50'
                : 'bg-slate-900/40 border-slate-800 text-slate-600 opacity-40'
            }`}
            aria-label="Afterburner Boost"
          >
            <Zap className="w-6 h-6" />
            <span className="text-[9px] font-mono font-bold tracking-tight">BOOST</span>
          </button>

          {/* Main Rocket Thruster */}
          <button
            id="touch-btn-thrust"
            onTouchStart={handlePressStart('thrust')}
            onTouchEnd={handlePressEnd('thrust')}
            onTouchCancel={handlePressEnd('thrust')}
            onMouseDown={handlePressStart('thrust')}
            onMouseUp={handlePressEnd('thrust')}
            className={`w-20 h-20 sm:w-22 sm:h-22 rounded-3xl border-2 flex flex-col items-center justify-center shadow-2xl backdrop-blur-md transition-all active:scale-90 ${
              isOutOfFuel
                ? 'bg-red-950/60 border-red-500/60 text-red-400 shadow-red-950/40'
                : activeKeys['thrust']
                ? 'bg-gradient-to-tr from-cyan-500 via-sky-400 to-blue-500 border-white text-slate-950 shadow-cyan-400/80 scale-95 ring-4 ring-cyan-400/50'
                : 'bg-gradient-to-tr from-cyan-950/90 via-slate-900/90 to-blue-900/90 border-cyan-400 text-cyan-300 shadow-cyan-900/60'
            }`}
            aria-label="Fire Main Thruster"
          >
            <Rocket className={`w-10 h-10 ${activeKeys['thrust'] ? 'animate-bounce' : ''}`} />
            <span className="text-[10px] font-mono font-black tracking-wider mt-0.5">
              {isOutOfFuel ? 'NO FUEL' : 'THRUST'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
