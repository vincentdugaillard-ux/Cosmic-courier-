// Cosmic Courier - Galactic Guild Contracts & Bounty Board
import React, { useState } from 'react';
import { PlayerProfile, Contract, GameDifficulty, Mission } from '../types/game';
import { CONTRACTS } from '../game/constants';
import {
  ArrowLeft,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  Coins,
  Shield,
  Clock,
  Zap,
  Gauge,
  Rocket,
  Sliders,
  ChevronRight,
  Flame,
  Award,
} from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface ContractsViewProps {
  profile: PlayerProfile;
  onSelectContract: (mission: Mission, contract?: Contract) => void;
  onBackToMenu: () => void;
  onUpdateDifficulty?: (diff: GameDifficulty) => void;
}

export const ContractsView: React.FC<ContractsViewProps> = ({
  profile,
  onSelectContract,
  onBackToMenu,
  onUpdateDifficulty,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'available' | 'completed'>('all');
  const currentDifficulty: GameDifficulty = profile.settings.difficulty || 'courier';
  const completedIds = profile.completedContractIds || [];

  // Difficulty multiplier for rewards display
  let rewardMultiplier = 1.0;
  if (currentDifficulty === 'cadet') rewardMultiplier = 0.85;
  else if (currentDifficulty === 'veteran') rewardMultiplier = 1.35;
  else if (currentDifficulty === 'hardcore') rewardMultiplier = 1.75;

  const filteredContracts = CONTRACTS.filter((contract) => {
    const isDone = completedIds.includes(contract.id);
    if (selectedFilter === 'available') return !isDone;
    if (selectedFilter === 'completed') return isDone;
    return true;
  });

  const difficulties: { id: GameDifficulty; label: string; badge: string; color: string }[] = [
    { id: 'cadet', label: 'Cadet', badge: '0.85x ₢', color: 'text-emerald-400 border-emerald-500/40' },
    { id: 'courier', label: 'Courier', badge: '1.0x ₢', color: 'text-cyan-400 border-cyan-500/40' },
    { id: 'veteran', label: 'Veteran', badge: '+35% ₢', color: 'text-amber-400 border-amber-500/40' },
    { id: 'hardcore', label: 'Hardcore', badge: '+75% ₢', color: 'text-rose-400 border-rose-500/40' },
  ];

  return (
    <div
      id="contracts-screen"
      className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between overflow-x-hidden overflow-y-auto p-4 sm:p-8 select-none"
      style={{
        backgroundImage:
          'radial-gradient(circle at 20% 20%, rgba(236, 72, 153, 0.09) 0%, rgba(15, 23, 42, 0) 65%), radial-gradient(circle at 80% 80%, rgba(14, 165, 233, 0.08) 0%, rgba(15, 23, 42, 0) 65%)',
      }}
    >
      {/* Top Header */}
      <header className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            id="contracts-btn-back"
            onClick={() => {
              soundManager.playUiClick();
              onBackToMenu();
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-slate-200 hover:text-cyan-300 transition-all font-mono text-xs font-bold shadow-md active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span>Main Menu</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest text-pink-400 font-bold block">
                GUILD FREELANCE TERMINAL
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pink-950/60 border border-pink-500/40 text-pink-300 font-bold">
                BOUNTIES ACTIVE
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-mono tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-200 to-cyan-300">
              COMMERCIAL CONTRACTS
            </h1>
          </div>
        </div>

        {/* Status Snapshot & Quick Difficulty Selector */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Difficulty Modifier Selector */}
          <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-2xl p-1 backdrop-blur-sm">
            <span className="text-[10px] font-mono text-slate-400 px-2 flex items-center gap-1">
              <Gauge className="w-3 h-3 text-cyan-400" />
              <span className="hidden sm:inline">DIFF:</span>
            </span>
            {difficulties.map((diff) => {
              const isSelected = currentDifficulty === diff.id;
              return (
                <button
                  key={diff.id}
                  id={`contracts-diff-${diff.id}`}
                  onClick={() => {
                    soundManager.playUiClick();
                    if (onUpdateDifficulty) {
                      onUpdateDifficulty(diff.id);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold transition-all ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                  }`}
                >
                  <span>{diff.label}</span>
                </button>
              );
            })}
          </div>

          {/* Credits */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-2xl px-3.5 py-1.5 backdrop-blur-sm">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-mono font-bold text-amber-300">
              {profile.totalCredits.toLocaleString()} ₢
            </span>
          </div>
        </div>
      </header>

      {/* Main Board Section */}
      <main className="max-w-6xl w-full mx-auto my-6 flex-1 flex flex-col gap-6">
        {/* Filter Tabs & Terminal Intro */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-pink-400" />
            <span className="text-xs font-mono text-slate-300">
              Open contracts from verified interstellar corporations and syndicates.
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 rounded-xl p-1">
            <button
              id="contracts-filter-all"
              onClick={() => {
                soundManager.playUiClick();
                setSelectedFilter('all');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                selectedFilter === 'all'
                  ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({CONTRACTS.length})
            </button>
            <button
              id="contracts-filter-available"
              onClick={() => {
                soundManager.playUiClick();
                setSelectedFilter('available');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                selectedFilter === 'available'
                  ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Available ({CONTRACTS.filter((c) => !completedIds.includes(c.id)).length})
            </button>
            <button
              id="contracts-filter-completed"
              onClick={() => {
                soundManager.playUiClick();
                setSelectedFilter('completed');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                selectedFilter === 'completed'
                  ? 'bg-slate-800 text-emerald-300 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Fulfilled ({CONTRACTS.filter((c) => completedIds.includes(c.id)).length})
            </button>
          </div>
        </div>

        {/* Contracts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredContracts.map((contract) => {
            const isCompleted = completedIds.includes(contract.id);
            const calculatedPayout = Math.round(contract.rewardCredits * rewardMultiplier);
            const calculatedXp = Math.round(contract.rewardXp * rewardMultiplier);

            return (
              <div
                key={contract.id}
                id={`contract-card-${contract.id}`}
                className={`relative rounded-3xl border p-5 sm:p-6 transition-all flex flex-col justify-between backdrop-blur-md ${
                  isCompleted
                    ? 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                    : 'bg-slate-900/90 border-slate-800 hover:border-pink-500/50 shadow-xl shadow-slate-950/60'
                }`}
              >
                {/* Client Banner & Code */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: contract.client.badgeColor }}
                      />
                      <span className="text-xs font-mono font-bold text-slate-300">
                        {contract.client.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        • {contract.client.faction}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                        {contract.contractCode}
                      </span>
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40">
                          <CheckCircle2 className="w-3 h-3" />
                          FULFILLED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/40">
                          <Zap className="w-3 h-3" />
                          BOUNTY OPEN
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Tagline */}
                  <h2 className="text-lg sm:text-xl font-black font-mono text-slate-100 tracking-wide mb-1">
                    {contract.title}
                  </h2>
                  <p className="text-xs font-mono text-pink-400 mb-3">
                    {contract.tagline}
                  </p>

                  <p className="text-xs text-slate-300 font-light leading-relaxed mb-4">
                    {contract.briefing}
                  </p>

                  {/* Cargo & Hazard Matrix */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5 font-mono text-xs">
                    <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-slate-400 uppercase">Payload</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                            contract.cargo.fragility === 'VOLATILE'
                              ? 'bg-red-950/80 text-red-400 border border-red-500/40'
                              : contract.cargo.fragility === 'DELICATE'
                              ? 'bg-amber-950/80 text-amber-400 border border-amber-500/40'
                              : 'bg-cyan-950/80 text-cyan-400 border border-cyan-500/40'
                          }`}
                        >
                          {contract.cargo.fragility}
                        </span>
                      </div>
                      <span className="text-slate-200 font-bold block text-xs truncate">
                        {contract.cargo.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-light block mt-1">
                        {contract.cargo.hazardNote}
                      </span>
                    </div>

                    <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          Hazard Profile
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                            contract.riskLevel === 'EXTREME'
                              ? 'text-rose-400'
                              : contract.riskLevel === 'CRITICAL'
                              ? 'text-amber-400'
                              : 'text-sky-400'
                          }`}
                        >
                          {contract.riskLevel}
                        </span>
                      </div>
                      <span className="text-slate-300 text-[11px] block leading-tight font-light mt-1">
                        {contract.specialHazard}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Payout & Launch Action */}
                <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block">TOTAL PAYOUT</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base sm:text-lg font-mono font-black text-amber-400">
                          {calculatedPayout.toLocaleString()} ₢
                        </span>
                        {rewardMultiplier !== 1.0 && (
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                              rewardMultiplier > 1.0
                                ? 'bg-amber-950 text-amber-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {rewardMultiplier > 1.0 ? `+${Math.round((rewardMultiplier - 1) * 100)}%` : '-15%'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="h-7 w-px bg-slate-800" />

                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block">GUILD XP</span>
                      <span className="text-xs font-mono font-bold text-cyan-300">
                        +{calculatedXp} XP
                      </span>
                    </div>

                    <div className="h-7 w-px bg-slate-800" />

                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block">TIME LIMIT</span>
                      <span className="text-xs font-mono font-bold text-slate-200">
                        {contract.mission.timeLimit}s
                      </span>
                    </div>
                  </div>

                  <button
                    id={`contract-launch-${contract.id}`}
                    onClick={() => {
                      soundManager.playUiClick();
                      // Launch the contract's mission briefing
                      onSelectContract(contract.mission, contract);
                    }}
                    className={`px-5 py-3 rounded-2xl font-mono font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${
                      isCompleted
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        : 'bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-400 hover:to-amber-400 text-white shadow-pink-500/25 hover:scale-105'
                    }`}
                  >
                    <span>{isCompleted ? 'REPLAY RUN' : 'ACCEPT & LAUNCH'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer Instructions */}
      <footer className="max-w-6xl w-full mx-auto pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-slate-500">
        <span>COURIER GUILD REGISTRY • ALL CONTRACTS AUTHORIZED UNDER SECTOR MARITIME CHARTER</span>
        <span>MODIFIERS APPLY TO CREDITS & XP CALCULATIONS</span>
      </footer>
    </div>
  );
};
