// Cosmic Courier - On-Screen Touch Controls for Mobile/Tablet
import React from 'react';
import { RotateCcw, RotateCw, Rocket, Zap, ShieldAlert } from 'lucide-react';
import { GameEngineInput } from '../game/gameEngine';

interface TouchControlsProps {
  inputRef: React.MutableRefObject<GameEngineInput>;
  boostFuel: number;
  fuel?: number;
  fuelDepletionEnabled?: boolean;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ inputRef, boostFuel, fuel, fuelDepletionEnabled = true }) => {
  const isOutOfFuel = fuelDepletionEnabled && fuel !== undefined && fuel <= 0;

  const handleTouchStart = (key: keyof GameEngineInput) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    inputRef.current[key] = true;
  };

  const handleTouchEnd = (key: keyof GameEngineInput) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    inputRef.current[key] = false;
  };

  return (
    <div id="touch-controls-container" className="absolute inset-x-0 bottom-0 pointer-events-none p-4 select-none z-30">
      <div className="max-w-4xl mx-auto flex items-end justify-between">
        {/* Left Hand: Steering Controls */}
        <div className="flex gap-3 pointer-events-auto">
          <button
            id="touch-btn-left"
            onTouchStart={handleTouchStart('turnLeft')}
            onTouchEnd={handleTouchEnd('turnLeft')}
            onMouseDown={handleTouchStart('turnLeft')}
            onMouseUp={handleTouchEnd('turnLeft')}
            className="w-16 h-16 rounded-xl bg-slate-900/80 border-2 border-cyan-500/60 active:border-cyan-300 active:bg-cyan-950/70 active:scale-95 text-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-950/50 backdrop-blur-sm transition-transform"
            aria-label="Steer Left"
          >
            <RotateCcw className="w-8 h-8" />
          </button>

          <button
            id="touch-btn-right"
            onTouchStart={handleTouchStart('turnRight')}
            onTouchEnd={handleTouchEnd('turnRight')}
            onMouseDown={handleTouchStart('turnRight')}
            onMouseUp={handleTouchEnd('turnRight')}
            className="w-16 h-16 rounded-xl bg-slate-900/80 border-2 border-cyan-500/60 active:border-cyan-300 active:bg-cyan-950/70 active:scale-95 text-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-950/50 backdrop-blur-sm transition-transform"
            aria-label="Steer Right"
          >
            <RotateCw className="w-8 h-8" />
          </button>
        </div>

        {/* Right Hand: Thruster, Boost & Brake */}
        <div className="flex items-end gap-3 pointer-events-auto">
          {/* Retro Brake */}
          <button
            id="touch-btn-brake"
            onTouchStart={handleTouchStart('reverse')}
            onTouchEnd={handleTouchEnd('reverse')}
            onMouseDown={handleTouchStart('reverse')}
            onMouseUp={handleTouchEnd('reverse')}
            className="w-14 h-14 rounded-xl bg-slate-900/80 border-2 border-amber-500/60 active:border-amber-300 active:bg-amber-950/70 active:scale-95 text-amber-400 flex flex-col items-center justify-center shadow-lg shadow-amber-950/50 backdrop-blur-sm transition-transform"
            aria-label="Brake"
          >
            <ShieldAlert className="w-6 h-6" />
            <span className="text-[9px] font-mono font-bold tracking-tighter">BRAKE</span>
          </button>

          {/* Afterburner Boost */}
          <button
            id="touch-btn-boost"
            onTouchStart={handleTouchStart('boost')}
            onTouchEnd={handleTouchEnd('boost')}
            onMouseDown={handleTouchStart('boost')}
            onMouseUp={handleTouchEnd('boost')}
            disabled={boostFuel <= 0.05 || isOutOfFuel}
            className={`w-14 h-14 rounded-xl border-2 flex flex-col items-center justify-center shadow-lg backdrop-blur-sm transition-transform active:scale-95 ${
              boostFuel > 0.05 && !isOutOfFuel
                ? 'bg-slate-900/80 border-pink-500/60 active:border-pink-300 active:bg-pink-950/70 text-pink-400 shadow-pink-950/50'
                : 'bg-slate-900/40 border-slate-700 text-slate-600 opacity-50'
            }`}
            aria-label="Boost"
          >
            <Zap className="w-6 h-6" />
            <span className="text-[9px] font-mono font-bold tracking-tighter">BOOST</span>
          </button>

          {/* Main Thruster */}
          <button
            id="touch-btn-thrust"
            onTouchStart={handleTouchStart('thrust')}
            onTouchEnd={handleTouchEnd('thrust')}
            onMouseDown={handleTouchStart('thrust')}
            onMouseUp={handleTouchEnd('thrust')}
            className={`w-18 h-18 rounded-2xl border-2 flex flex-col items-center justify-center shadow-xl backdrop-blur-sm transition-transform active:scale-95 ${
              isOutOfFuel
                ? 'bg-red-950/60 border-red-500/60 text-red-400 shadow-red-950/40'
                : 'bg-gradient-to-tr from-cyan-950/90 to-blue-900/90 border-cyan-400 active:border-cyan-200 text-cyan-300 shadow-cyan-900/60'
            }`}
            aria-label="Thrust Forward"
          >
            <Rocket className="w-9 h-9" />
            <span className="text-[10px] font-mono font-bold tracking-wider mt-0.5">
              {isOutOfFuel ? 'NO FUEL' : 'THRUST'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
