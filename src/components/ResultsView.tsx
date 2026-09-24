// Cosmic Courier - Delivery Debriefing & Scoring Breakdown
import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { MissionResult, Mission } from '../types/game';
import { CAMPAIGN_MISSIONS } from '../game/constants';
import {
  Trophy,
  RotateCcw,
  ArrowRight,
  List,
  Rocket,
  ShieldCheck,
  Clock,
  Zap,
  Sparkles,
  AlertOctagon,
  Award,
  Home,
  Gamepad2,
  Flame,
} from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface ResultsViewProps {
  result: MissionResult;
  isNewBestScore?: boolean;
  totalGamesPlayed?: number;
  onReplay: () => void;
  onNextMission: (nextMission: Mission) => void;
  onMissionSelect: () => void;
  onOpenHangar: () => void;
  onMainMenu: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  result,
  isNewBestScore,
  totalGamesPlayed,
  onReplay,
  onNextMission,
  onMissionSelect,
  onOpenHangar,
  onMainMenu,
}) => {
  const { victory, scoreBreakdown, packageCondition, landingPrecisionGrade } = result;

  // Trigger celebration confetti on victory
  useEffect(() => {
    if (victory) {
      confetti({
        particleCount: packageCondition === 'pristine' ? 90 : 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00f0ff', '#39ff14', '#ec4899', '#fbbf24'],
      });
    }
  }, [victory, packageCondition]);

  // Find next campaign mission
  const currentIdx = CAMPAIGN_MISSIONS.findIndex((m) => m.id === result.missionId);
  const nextMission =
    currentIdx >= 0 && currentIdx < CAMPAIGN_MISSIONS.length - 1
      ? CAMPAIGN_MISSIONS[currentIdx + 1]
      : null;

  const getConditionBadge = () => {
    switch (packageCondition) {
      case 'pristine':
        return {
          title: 'PRISTINE (100%)',
          desc: 'Zero internal fractures. Full client satisfaction +30% bonus payout.',
          color: 'text-lime-400 bg-lime-950/70 border-lime-500/40',
        };
      case 'intact':
        return {
          title: 'INTACT (60-99%)',
          desc: 'Cargo delivered safely with negligible structural fatigue.',
          color: 'text-cyan-400 bg-cyan-950/70 border-cyan-500/40',
        };
      case 'damaged':
        return {
          title: 'DAMAGED (20-59%)',
          desc: 'Container sustained kinetic shocks. Payout penalties applied.',
          color: 'text-amber-400 bg-amber-950/70 border-amber-500/40',
        };
      case 'broken':
        return {
          title: 'DESTROYED (0%)',
          desc: 'Catastrophic breach. Package integrity completely compromised.',
          color: 'text-red-400 bg-red-950/70 border-red-500/40',
        };
    }
  };

  const condBadge = getConditionBadge();

  return (
    <div
      id="results-screen"
      className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8 md:p-10 select-none overflow-x-hidden overflow-y-auto"
      style={{
        backgroundImage: victory
          ? 'radial-gradient(circle at 50% 15%, rgba(57, 255, 20, 0.08) 0%, rgba(15, 23, 42, 0) 65%)'
          : 'radial-gradient(circle at 50% 15%, rgba(239, 68, 68, 0.08) 0%, rgba(15, 23, 42, 0) 65%)',
      }}
    >
      {/* Top Header */}
      <header className="max-w-4xl w-full mx-auto pt-2">
        <div className="flex items-center justify-between mb-4">
          <button
            id="results-header-btn-main-menu"
            onClick={() => {
              soundManager.playUiClick();
              onMainMenu();
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-slate-200 hover:text-cyan-300 transition-all font-mono text-xs font-bold shadow-md active:scale-95"
            aria-label="Return to Main Menu"
          >
            <Home className="w-4 h-4 text-cyan-400" />
            <span>Main Menu</span>
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400">
            <span>MISSION DEBRIEFING</span>
            <span>•</span>
            <span className="text-cyan-400 font-bold">{result.missionTitle}</span>
            {totalGamesPlayed !== undefined && (
              <>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline-flex items-center gap-1 text-slate-300">
                  <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>GAMES: {totalGamesPlayed}</span>
                </span>
              </>
            )}
          </div>

          <button
            id="results-header-btn-campaign"
            onClick={() => {
              soundManager.playUiClick();
              onMissionSelect();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all font-mono text-xs"
            aria-label="Sectors"
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sectors</span>
          </button>
        </div>

        <div className="text-center">
          <h1
            className={`text-4xl sm:text-6xl font-extrabold font-mono tracking-tight ${
              victory
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-cyan-200 to-emerald-400 drop-shadow-[0_0_25px_rgba(57,255,20,0.3)]'
                : 'text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-200 to-amber-400 drop-shadow-[0_0_25px_rgba(239,68,68,0.3)]'
            }`}
          >
            {victory ? 'DELIVERY SUCCESSFUL' : 'CONTRACT FAILED'}
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 font-mono mt-2">
            {victory
              ? `Docking finalized at Outpost Luna in ${result.timeTaken}s`
              : result.failureReason || 'Delivery vessel failed to complete contract parameters.'}
          </p>
        </div>
      </header>

      {/* Main Results Dashboard Card */}
      <main className="max-w-3xl w-full mx-auto my-auto py-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl">
          {/* Top Row: Package Condition & Landing Precision Grade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Package Condition */}
            <div className={`p-4 rounded-2xl border ${condBadge.color}`}>
              <div className="flex items-center gap-2 text-xs font-mono font-bold mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>PACKAGE INTEGRITY</span>
              </div>
              <div className="text-lg font-bold font-mono">{condBadge.title}</div>
              <p className="text-xs opacity-80 mt-1 leading-snug">{condBadge.desc}</p>
            </div>

            {/* Landing Precision */}
            <div className="p-4 rounded-2xl border bg-slate-950/70 border-slate-800">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold mb-1">
                <Award className="w-4 h-4" />
                <span>TOUCHDOWN PRECISION</span>
              </div>
              <div className="text-lg font-bold font-mono text-slate-100">
                {landingPrecisionGrade} DOCKING
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-snug">
                {landingPrecisionGrade === 'PERFECT'
                  ? 'Center pad touch under 1.0 m/s. +600 style bonus!'
                  : landingPrecisionGrade === 'SMOOTH'
                  ? 'Standard decelerated docking. +300 style bonus.'
                  : 'Rough contact within pad boundaries.'}
              </p>
            </div>
          </div>

          {/* Score Calculation Breakdown */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 mb-6 font-mono">
            <h2 className="text-xs text-slate-400 tracking-widest font-bold uppercase mb-3 flex items-center justify-between">
              <span>SCORE TELEMETRY</span>
              {isNewBestScore && (
                <span className="text-xs text-amber-400 flex items-center gap-1 font-bold animate-pulse">
                  <Trophy className="w-3.5 h-3.5" /> NEW HIGH SCORE!
                </span>
              )}
            </h2>

            <div className="flex flex-col gap-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Base Contract Value</span>
                <span className="font-bold">{scoreBreakdown.basePoints.toLocaleString()} PTS</span>
              </div>

              <div className="flex justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" /> Time Window Efficiency
                </span>
                <span className="font-bold text-cyan-300">
                  +{scoreBreakdown.timeBonus.toLocaleString()} PTS
                </span>
              </div>

              <div className="flex justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-lime-400" /> Package Stability ({result.packageStability}%)
                </span>
                <span className="font-bold text-lime-300">
                  +{scoreBreakdown.integrityBonus.toLocaleString()} PTS
                </span>
              </div>

              {result.fuelRemaining !== undefined && (
                <div className="flex justify-between text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Flame className={`w-3.5 h-3.5 ${result.fuelRemaining > 0 ? 'text-amber-400' : 'text-red-400'}`} />
                    Fuel Conserved ({result.fuelRemaining}%)
                  </span>
                  <span className="font-bold text-amber-300">
                    +{scoreBreakdown.fuelBonus ? scoreBreakdown.fuelBonus.toLocaleString() : 0} PTS
                  </span>
                </div>
              )}

              <div className="flex justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-pink-400" /> Style & Rings ({result.ringsCollected}/{result.totalRings})
                </span>
                <span className="font-bold text-pink-300">
                  +{scoreBreakdown.styleBonus.toLocaleString()} PTS
                </span>
              </div>

              {scoreBreakdown.flawlessMultiplier > 1 && (
                <div className="flex justify-between text-lime-400 font-bold">
                  <span>Flawless Transit Multiplier</span>
                  <span>1.25x MULTIPLIER</span>
                </div>
              )}

              {result.difficulty && (
                <div className="flex justify-between text-cyan-400 font-bold">
                  <span>Difficulty ({result.difficulty.toUpperCase()})</span>
                  <span>
                    {result.difficulty === 'cadet'
                      ? '0.85x Payout'
                      : result.difficulty === 'veteran'
                      ? '+35% Bonus'
                      : result.difficulty === 'hardcore'
                      ? '+75% Bonus'
                      : '1.0x Standard'}
                  </span>
                </div>
              )}

              <div className="h-px bg-slate-800 my-1" />

              <div className="flex justify-between items-center text-sm sm:text-base font-bold text-slate-100 pt-1">
                <span>FINAL SCORE</span>
                <span className="text-xl sm:text-2xl text-cyan-300">
                  {scoreBreakdown.totalScore.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Credits Awarded Banner */}
          <div className="flex items-center justify-between bg-gradient-to-r from-amber-950/50 via-slate-950/70 to-amber-950/50 border border-amber-500/40 rounded-2xl px-5 py-3.5 mb-6">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <div>
                <span className="text-xs font-mono font-bold text-slate-300 block">
                  COURIER GUILD HONORARIUM
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Transferred to player balance
                </span>
              </div>
            </div>
            <div className="text-xl font-bold font-mono text-amber-400">
              +{result.creditsEarned.toLocaleString()} ₢
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {victory && nextMission ? (
                <button
                  id="results-btn-next"
                  onClick={() => {
                    soundManager.playUiClick();
                    onNextMission(nextMission);
                  }}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-mono font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30 transition-all hover:scale-[1.02] active:scale-98"
                >
                  <span>Advance to {nextMission.codeName}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  id="results-btn-replay"
                  onClick={() => {
                    soundManager.playUiClick();
                    onReplay();
                  }}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-mono font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30 transition-all hover:scale-[1.02] active:scale-98"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Replay Mission</span>
                </button>
              )}

              {/* Prominent Main Menu Button */}
              <button
                id="results-btn-main-menu"
                onClick={() => {
                  soundManager.playUiClick();
                  onMainMenu();
                }}
                className="w-full py-4 px-6 rounded-2xl bg-slate-800 hover:bg-slate-750 border-2 border-cyan-400/80 hover:border-cyan-300 text-cyan-300 hover:text-cyan-100 font-mono font-bold text-sm tracking-wide flex items-center justify-center gap-2.5 shadow-xl shadow-cyan-950/50 transition-all hover:scale-[1.02] active:scale-98"
              >
                <Home className="w-5 h-5 text-cyan-400" />
                <span>Main Menu</span>
              </button>
            </div>

            {/* Secondary Option Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {victory && (
                <button
                  id="results-btn-replay-secondary"
                  onClick={() => {
                    soundManager.playUiClick();
                    onReplay();
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 font-mono text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Replay This Sector</span>
                </button>
              )}

              <button
                id="results-btn-campaign"
                onClick={() => {
                  soundManager.playUiClick();
                  onMissionSelect();
                }}
                className={`w-full py-3 px-4 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 font-mono text-xs flex items-center justify-center gap-2 transition-colors ${
                  !victory ? 'sm:col-span-2' : ''
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Campaign Sectors</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="max-w-4xl w-full mx-auto flex items-center justify-between text-xs font-mono text-slate-500 pt-3 border-t border-slate-900">
        <button
          id="results-footer-main-menu"
          onClick={() => {
            soundManager.playUiClick();
            onMainMenu();
          }}
          className="text-slate-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors font-bold"
        >
          <Home className="w-3.5 h-3.5 text-cyan-400" />
          <span>MAIN MENU</span>
        </button>

        <button
          onClick={() => {
            soundManager.playUiClick();
            onOpenHangar();
          }}
          className="text-pink-400 hover:text-pink-300 flex items-center gap-1.5 transition-colors font-bold"
        >
          <Rocket className="w-3.5 h-3.5" />
          <span>VISIT SHIP HANGAR</span>
        </button>
      </footer>
    </div>
  );
};
