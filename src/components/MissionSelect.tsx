// Cosmic Courier - Campaign Sector & Mission Select Screen
import React, { useState } from 'react';
import { Mission, PlayerProfile, Ship } from '../types/game';
import { CAMPAIGN_MISSIONS, SHIPS } from '../game/constants';
import { loadCustomMissions } from '../utils/storage';
import {
  ArrowLeft,
  Play,
  Lock,
  CheckCircle2,
  Clock,
  Award,
  Package,
  Shield,
  Zap,
  Rocket,
  ChevronRight,
  Home,
  Briefcase,
  Wrench,
  Plus,
} from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface MissionSelectProps {
  profile: PlayerProfile;
  onSelectMission: (mission: Mission) => void;
  onBackToMenu: () => void;
  onOpenHangar: () => void;
  onOpenContracts?: () => void;
  onOpenMapEditor?: () => void;
}

export const MissionSelect: React.FC<MissionSelectProps> = ({
  profile,
  onSelectMission,
  onBackToMenu,
  onOpenHangar,
  onOpenContracts,
  onOpenMapEditor,
}) => {
  const [customMissions] = useState<Mission[]>(() => loadCustomMissions());
  const [sectorTab, setSectorTab] = useState<'campaign' | 'custom'>('campaign');
  // Determine unlock state for each mission
  const isMissionUnlocked = (mission: Mission, index: number): boolean => {
    if (index === 0 || mission.unlockRequirement.type === 'default') return true;
    if (mission.unlockRequirement.type === 'previous_mission') {
      const prevId = mission.unlockRequirement.value as string;
      return profile.completedMissionIds.includes(prevId);
    }
    if (mission.unlockRequirement.type === 'credits') {
      const needed = mission.unlockRequirement.value as number;
      return profile.totalCredits >= needed;
    }
    return false;
  };

  // Default selected mission: first uncompleted mission, or mission 1
  const initialMission =
    CAMPAIGN_MISSIONS.find((m, idx) => isMissionUnlocked(m, idx) && !profile.completedMissionIds.includes(m.id)) ||
    CAMPAIGN_MISSIONS[0];

  const [selectedMission, setSelectedMission] = useState<Mission>(initialMission);

  const selectedShip: Ship =
    SHIPS.find((s) => s.id === profile.selectedShipId) || SHIPS[0];

  const getDifficultyBadge = (difficulty: Mission['difficulty']) => {
    switch (difficulty) {
      case 'rookie':
        return { label: 'ROOKIE', bg: 'bg-lime-950/80 text-lime-400 border-lime-500/40' };
      case 'cadet':
        return { label: 'CADET', bg: 'bg-cyan-950/80 text-cyan-400 border-cyan-500/40' };
      case 'expert':
        return { label: 'EXPERT', bg: 'bg-amber-950/80 text-amber-400 border-amber-500/40' };
      case 'hyper':
        return { label: 'HYPER', bg: 'bg-pink-950/80 text-pink-400 border-pink-500/40' };
    }
  };

  const selectedUnlocked = selectedMission.isCustom
    ? true
    : isMissionUnlocked(
        selectedMission,
        CAMPAIGN_MISSIONS.findIndex((m) => m.id === selectedMission.id)
      );

  const selectedCompleted = profile.completedMissionIds.includes(selectedMission.id);
  const bestScore = profile.bestScores[selectedMission.id] || 0;
  const bestTime = profile.bestTimes[selectedMission.id];

  return (
    <div
      id="mission-select-screen"
      className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8 md:p-10 select-none overflow-y-auto"
      style={{
        backgroundImage:
          'radial-gradient(circle at 10% 20%, rgba(14, 165, 233, 0.08) 0%, rgba(15, 23, 42, 0) 60%), radial-gradient(circle at 90% 80%, rgba(168, 85, 247, 0.08) 0%, rgba(15, 23, 42, 0) 60%)',
      }}
    >
      {/* Top Bar */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between pb-6 border-b border-slate-900">
        <div className="flex items-center gap-4">
          <button
            id="mission-select-btn-back"
            onClick={() => {
              soundManager.playUiClick();
              onBackToMenu();
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 transition-colors font-mono text-xs font-bold"
            aria-label="Back to Main Menu"
          >
            <ArrowLeft className="w-4 h-4" />
            <Home className="w-3.5 h-3.5 text-cyan-400" />
            <span>Main Menu</span>
          </button>
          <div>
            <h1 className="text-xl font-bold font-mono tracking-wide text-cyan-300">
              CAMPAIGN SECTORS
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Deliver cargo across charted space lanes
            </p>
          </div>
        </div>

        {/* Currency & Ship Display */}
        <div className="flex items-center gap-3">
          {onOpenContracts && (
            <button
              id="mission-select-btn-contracts"
              onClick={() => {
                soundManager.playUiClick();
                onOpenContracts();
              }}
              className="flex items-center gap-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-pink-500/50 rounded-xl px-3.5 py-2 transition-colors text-xs font-mono text-pink-300 font-bold"
            >
              <Briefcase className="w-3.5 h-3.5 text-pink-400" />
              <span>Contracts</span>
            </button>
          )}

          <button
            id="mission-select-btn-hangar"
            onClick={() => {
              soundManager.playUiClick();
              onOpenHangar();
            }}
            className="hidden sm:flex items-center gap-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 rounded-xl px-3.5 py-2 transition-colors text-xs font-mono text-slate-300"
          >
            <Rocket className="w-4 h-4 text-cyan-400" />
            <span>SHIP: <strong className="text-cyan-300">{selectedShip.name}</strong></span>
          </button>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2 font-mono text-xs">
            <span className="text-slate-400 mr-2">CREDITS:</span>
            <span className="font-bold text-amber-400">{profile.totalCredits.toLocaleString()} ₢</span>
          </div>
        </div>
      </header>

      {/* Main Content Grid: Sector List (Left) & Mission Intel Details (Right) */}
      <main className="max-w-6xl w-full mx-auto my-auto py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Mission Directory */}
        <div className="lg:col-span-6 flex flex-col gap-3">
          {/* Tab Selection: Campaign vs Custom Sectors */}
          <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              id="tab-campaign-sectors"
              onClick={() => {
                soundManager.playUiClick();
                setSectorTab('campaign');
                if (selectedMission.isCustom && CAMPAIGN_MISSIONS.length > 0) {
                  setSelectedMission(CAMPAIGN_MISSIONS[0]);
                }
              }}
              className={`flex-1 py-2 px-3 rounded-lg font-mono text-xs font-bold transition-all ${
                sectorTab === 'campaign'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Campaign ({CAMPAIGN_MISSIONS.length})
            </button>

            <button
              id="tab-custom-sectors"
              onClick={() => {
                soundManager.playUiClick();
                setSectorTab('custom');
                if (customMissions.length > 0) {
                  setSelectedMission(customMissions[0]);
                }
              }}
              className={`flex-1 py-2 px-3 rounded-lg font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                sectorTab === 'custom'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Custom Maps ({customMissions.length})</span>
            </button>
          </div>

          {/* Create Custom Map Button */}
          {sectorTab === 'custom' && onOpenMapEditor && (
            <button
              id="mission-btn-create-map"
              onClick={() => {
                soundManager.playUiClick();
                onOpenMapEditor();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-mono text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Open Map Creator (Build Your Own Map)</span>
            </button>
          )}

          <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
            <span>
              {sectorTab === 'campaign'
                ? `AVAILABLE CONTRACTS (${CAMPAIGN_MISSIONS.length})`
                : `CUSTOM SECTORS (${customMissions.length})`}
            </span>
            {sectorTab === 'campaign' && (
              <span>
                {profile.completedMissionIds.length} / {CAMPAIGN_MISSIONS.length} COMPLETED
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2.5 max-h-[520px] overflow-y-auto pr-1">
            {sectorTab === 'campaign' ? (
              CAMPAIGN_MISSIONS.map((mission, idx) => {
              const unlocked = isMissionUnlocked(mission, idx);
              const completed = profile.completedMissionIds.includes(mission.id);
              const isSelected = selectedMission.id === mission.id;
              const badge = getDifficultyBadge(mission.difficulty);
              const score = profile.bestScores[mission.id];

              return (
                <button
                  key={mission.id}
                  id={`mission-card-${mission.id}`}
                  onClick={() => {
                    soundManager.playUiClick();
                    setSelectedMission(mission);
                  }}
                  disabled={!unlocked}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-400 shadow-lg shadow-cyan-950/60 scale-[1.01]'
                      : unlocked
                      ? 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800 hover:border-slate-700'
                      : 'bg-slate-950/40 border-slate-900 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Status Icon */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        completed
                          ? 'bg-lime-950/80 text-lime-400 border border-lime-500/40'
                          : unlocked
                          ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-500/40'
                          : 'bg-slate-900 text-slate-600 border border-slate-800'
                      }`}
                    >
                      {completed ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : unlocked ? (
                        <span className="font-mono font-bold text-xs">{mission.codeName}</span>
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                    </div>

                    {/* Mission Text */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-bold text-slate-200 truncate">
                          {mission.title}
                        </span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate">{mission.sector}</p>
                    </div>
                  </div>

                  {/* Right Score / Reward Badge */}
                  <div className="text-right shrink-0">
                    {unlocked ? (
                      <div>
                        <span className="text-xs font-mono font-bold text-amber-400 block">
                          +{mission.rewardCredits} ₢
                        </span>
                        {score ? (
                          <span className="text-[10px] font-mono text-cyan-400">
                            BEST: {score.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-500">NEW ROUTE</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-600 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> LOCKED
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          ) : customMissions.length === 0 ? (
            <div className="text-center py-12 px-4 bg-slate-900/40 border border-slate-800/80 rounded-2xl flex flex-col items-center gap-3">
              <Wrench className="w-8 h-8 text-emerald-400" />
              <div>
                <h4 className="text-sm font-mono font-bold text-slate-200">
                  NO CUSTOM SECTORS FOUND
                </h4>
                <p className="text-xs font-mono text-slate-400 mt-1 max-w-sm">
                  Design custom flight paths, place asteroids, laser gates, and black holes in the Map Creator!
                </p>
              </div>
              {onOpenMapEditor && (
                <button
                  onClick={() => {
                    soundManager.playUiClick();
                    onOpenMapEditor();
                  }}
                  className="mt-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-bold transition-colors"
                >
                  Open Map Creator Now
                </button>
              )}
            </div>
          ) : (
            customMissions.map((mission) => {
              const isSelected = selectedMission.id === mission.id;
              const badge = getDifficultyBadge(mission.difficulty);

              return (
                <button
                  key={mission.id}
                  id={`custom-mission-card-${mission.id}`}
                  onClick={() => {
                    soundManager.playUiClick();
                    setSelectedMission(mission);
                  }}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                    isSelected
                      ? 'bg-slate-900 border-emerald-400 shadow-lg shadow-emerald-950/60 scale-[1.01]'
                      : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
                      <span className="font-mono font-bold text-xs">{mission.codeName}</span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-bold text-slate-200 truncate">
                          {mission.title}
                        </span>
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded-full border font-bold ${badge.bg}`}
                        >
                          CUSTOM
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono truncate">
                        {mission.asteroids.length} Obstacles • {mission.rings.length} Rings • {mission.timeLimit}s
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono font-bold text-amber-400">
                      +{mission.rewards.credits} ₢
                    </div>
                    <div className="text-[10px] font-mono text-emerald-400">
                      User Sector
                    </div>
                  </div>
                </button>
              );
            })
          )}
          </div>
        </div>

        {/* Right Column: Mission Briefing Dossier */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl flex flex-col justify-between">
          <div>
            {/* Header / Sector */}
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <span className="text-xs font-mono text-cyan-400 font-bold tracking-widest block">
                  {selectedMission.codeName} • {selectedMission.sector.toUpperCase()}
                </span>
                <h2 className="text-2xl font-bold font-mono text-slate-100 mt-1">
                  {selectedMission.title}
                </h2>
              </div>
              <span
                className={`text-xs font-mono px-2.5 py-1 rounded-lg border ${
                  getDifficultyBadge(selectedMission.difficulty).bg
                }`}
              >
                {getDifficultyBadge(selectedMission.difficulty).label}
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-slate-300 leading-relaxed mb-6 font-light">
              {selectedMission.description}
            </p>

            {/* Cargo Dossier */}
            <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold mb-2">
                <Package className="w-4 h-4" />
                <span>CARGO PAYLOAD MANIFEST</span>
              </div>
              <h3 className="text-sm font-bold text-slate-200 mb-1">{selectedMission.cargoName}</h3>
              <p className="text-xs text-slate-400 font-light">{selectedMission.cargoDescription}</p>
            </div>

            {/* Mission Stats Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-[10px] font-mono text-slate-400 mb-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>WINDOW</span>
                </div>
                <span className="text-sm font-mono font-bold text-slate-200">
                  {selectedMission.timeLimit}s
                </span>
              </div>

              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-[10px] font-mono text-slate-400 mb-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>REWARD</span>
                </div>
                <span className="text-sm font-mono font-bold text-amber-400">
                  +{selectedMission.rewardCredits} ₢
                </span>
              </div>

              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-[10px] font-mono text-slate-400 mb-1">
                  <Shield className="w-3.5 h-3.5 text-pink-400" />
                  <span>HAZARDS</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-300">
                  {selectedMission.gravityWells.length > 0 ? 'Grav + Asteroids' : selectedMission.lasers.length > 0 ? 'Laser Grid' : 'Asteroid Belt'}
                </span>
              </div>

              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-[10px] font-mono text-slate-400 mb-1">
                  <Award className="w-3.5 h-3.5 text-lime-400" />
                  <span>BEST SCORE</span>
                </div>
                <span className="text-sm font-mono font-bold text-lime-400">
                  {bestScore > 0 ? bestScore.toLocaleString() : '—'}
                </span>
              </div>
            </div>

            {bestTime !== undefined && (
              <div className="text-xs font-mono text-slate-400 mb-6 flex items-center justify-between px-1">
                <span>RECORD TRANSIT TIME:</span>
                <span className="text-cyan-300 font-bold">{bestTime} seconds</span>
              </div>
            )}
          </div>

          {/* Launch Action */}
          <div>
            {selectedUnlocked ? (
              <button
                id="mission-btn-launch"
                onClick={() => {
                  soundManager.playUiClick();
                  onSelectMission(selectedMission);
                }}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-mono font-bold text-base tracking-wider flex items-center justify-center gap-3 shadow-xl shadow-cyan-500/30 transition-all hover:scale-[1.02] active:scale-98 border-2 border-cyan-200"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>{selectedCompleted ? 'PLAY MISSION (REPLAY)' : 'PLAY GAME • LAUNCH MISSION'}</span>
              </button>
            ) : (
              <div className="w-full py-4 px-6 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-400 font-mono text-sm text-center flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" />
                <span>Locked — Complete preceding sector missions to unlock contract</span>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="max-w-6xl w-full mx-auto flex items-center justify-between text-xs font-mono text-slate-500 pt-4 border-t border-slate-900">
        <span>PRO-TIP: FLY THROUGH BLUE HYPER-RINGS TO RESTORE PACKAGE INTEGRITY</span>
        <button
          onClick={() => {
            soundManager.playUiClick();
            onOpenHangar();
          }}
          className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
        >
          <span>UPGRADE SHIP IN HANGAR</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </footer>
    </div>
  );
};
