// Cosmic Courier - Mission Briefing Component
// Displays text-based mission objectives, narrative flavor text, cargo manifest,
// and tactical environmental intel before spaceflight launch.
import React, { useEffect, useState } from 'react';
import {
  Mission,
  PlayerProfile,
  Ship,
  Contract,
  GameDifficulty,
} from '../types/game';
import { CONTRACTS } from '../game/constants';
import {
  Rocket,
  Shield,
  Clock,
  Coins,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Target,
  Radio,
  FileText,
  ChevronRight,
  ArrowLeft,
  Zap,
  Crosshair,
  Award,
  Info,
  Gauge,
  Terminal,
  Activity,
  Box,
  Layers,
} from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface BriefingProps {
  mission: Mission;
  ship: Ship;
  profile: PlayerProfile;
  contract?: Contract | null;
  onAccept: () => void;
  onBack: () => void;
  onUpdateSettings?: (settings: Partial<PlayerProfile['settings']>) => void;
}

interface NarrativeIntel {
  callSign: string;
  dispatcherTitle: string;
  classification: string;
  transmissionLog: string;
  tacticalNotes: string[];
  fragilityRating: string;
  fragilityColor: string;
  specialPrecaution: string;
}

// Lore and narrative flavor text database for campaign missions
const CAMPAIGN_LORE: Record<string, NarrativeIntel> = {
  mission_1: {
    callSign: 'CISLUNAR-ALPHA // 0842.4',
    dispatcherTitle: 'Commander Vane • Cislunar Sector Air Traffic',
    classification: 'COURIER CERTIFICATION RUN • SECTOR 01',
    transmissionLog:
      'Courier 7, welcome to the Lunar Transit Lane. We have an urgent dispatch of cryo-preserved medical vials destined for Outpost Luna\'s trauma clinic. Micrometeorite debris has peppered the median fairway, but solar flare activity is nominal. Keep your retro thrusters primed, maintain a level approach angle, and bring her down soft on Pad 01. The medical staff is counting on your steady hands.',
    tacticalNotes: [
      'Scattered stationary asteroidal crags along median flight path.',
      'Zero gravitational anomalies or military laser grids detected.',
      'Target Pad 01 equipped with standard magnetic docking clamps.',
    ],
    fragilityRating: 'MODERATE (VOLATILE LIQUID)',
    fragilityColor: 'text-amber-400 border-amber-500/40 bg-amber-950/40',
    specialPrecaution: 'Avoid sudden decelerations. Maintain package stability above critical threshold.',
  },
  mission_2: {
    callSign: 'KALLIOPE-MINING // 1109.8',
    dispatcherTitle: 'Navigator Dax • Kalliope Deep Mining Station',
    classification: 'CLASS-II DRIFT HAZARD • SECTOR 02',
    transmissionLog:
      'Heads up, Courier. You\'re crossing the Kalliope Shrapnel Field. High-density nickel-iron asteroids are drifting and tumbling directly across the shipping channel. You are carrying a delicate Quantum Entanglement Core—any sharp collision shock will shatter the crystalline harmonic lattice into useless dust. Pick your line carefully, thread through the navigational slipstream rings to recharge your hull stabilizers, and do not let inertia carry you into an iron boulder.',
    tacticalNotes: [
      'Dense asteroid belt with tumbling kinetic rogue boulders.',
      'Collision shocks above 2.0G will fracture quantum lattice.',
      'Blue quantum rings provide active structural repairs in transit.',
    ],
    fragilityRating: 'HIGH (CRYSTALLINE LATTICE)',
    fragilityColor: 'text-pink-400 border-pink-500/40 bg-pink-950/40',
    specialPrecaution: 'Extreme shock sensitivity. Feather lateral thrusters when navigating narrow gaps.',
  },
  mission_3: {
    callSign: 'HORIZON-OBS-9 // 0314.2',
    dispatcherTitle: 'Dr. Evelyn Reed • Kepler Event Horizon Observatory',
    classification: 'GRAVITATIONAL ANOMALY GAUNTLET • SECTOR 03',
    transmissionLog:
      'Courier, this is Dr. Reed at the Deep Horizon Observatory. A spatial rupture has spawned localized micro-singularities throughout the Kepler transit plane. Their intense gravitational distortion will warp your trajectory toward the event horizons. Counter-thrust early, utilize gravitational slingshots if your maneuvering is sharp, and deliver the Dark Matter Stabilizer before tidal forces shear our research rig.',
    tacticalNotes: [
      '3 Active micro-gravity wells exerting continuous radial suction.',
      'Lethal event horizon radius: 35m. Gravitational pull zone: up to 360m.',
      'Outer gravitational gradients can be harnessed for slingshot acceleration.',
    ],
    fragilityRating: 'CRITICAL (SUB-ATOMIC MATRIX)',
    fragilityColor: 'text-purple-400 border-purple-500/40 bg-purple-950/40',
    specialPrecaution: 'Singularity suction accelerates vessels rapidly. Maintain reserve propellant for emergency counter-burns.',
  },
  mission_4: {
    callSign: 'NEO-TOKYO-TRAFFIC // 7721.0',
    dispatcherTitle: 'Chief Warden Korba • Neo-Tokyo Orbital Traffic Authority',
    classification: 'MILITARY DEFENSE INTERDICTION • SECTOR 04',
    transmissionLog:
      'Notice to all courier vessels: Neo-Tokyo Orbital Sector is under automated military lockdown following border skirmishes. Synchronized energy barricades are pulsing across every primary transit gate. The automated defense grid will not disarm for commercial traffic. You will have to time your burn windows precisely and slip through the apertures while the energy beams cycle offline. Do not graze the laser barriers.',
    tacticalNotes: [
      '4 Synchronized high-output defense laser barriers.',
      'Duty cycles range from 2.8s to 3.2s with alternating phase offsets.',
      'Direct beam contact causes instantaneous hull vaporization.',
    ],
    fragilityRating: 'DELICATE (THERMAL-SENSITIVE)',
    fragilityColor: 'text-rose-400 border-rose-500/40 bg-rose-950/40',
    specialPrecaution: 'Study beam cycle intervals before passing. Do not gamble on partial closing cycles.',
  },
  mission_5: {
    callSign: 'TARTARUS-GARRISON // 9904.5',
    dispatcherTitle: 'Forward Observer Jax • Tartarus Rift Outpost',
    classification: 'MULTI-HAZARD TRENCH RUN • SECTOR 05',
    transmissionLog:
      'Courier, you drew the crucible today. Tartarus Trench is a narrow, jagged chasm loaded with drifting kinetic crags, gravitational eddies, and leftover military laser tripwires. You have a Relic Antimatter Matrix secured in your hold. A single severe impact against rock or energy grid, and you will detonate into a miniature supernova. Keep your eyes on the vector display and fly with surgical precision.',
    tacticalNotes: [
      'Narrow 4000m winding canyon with restricted maneuvering space.',
      'Simultaneous tumbling asteroids, 2 gravitational vortices, and 3 laser tripwires.',
      'Highest risk of severe kinetic and thermal hull damage.',
    ],
    fragilityRating: 'EXTREME (ANTIMATTER VOLATILE)',
    fragilityColor: 'text-red-400 border-red-500/40 bg-red-950/40',
    specialPrecaution: 'Near-zero collision tolerance. Use boost sparingly to avoid overshooting canyon turns.',
  },
  mission_6: {
    callSign: 'GUILD-COMMAND-CORE // 0001.0',
    dispatcherTitle: 'High Courier Marshall Vance • Grand Guild Command',
    classification: 'SUPREME COURIER TRIAL // LEVEL HYPER • SECTOR 06',
    transmissionLog:
      'This is it, Pilot. The Core Relay Odyssey. The Grand Council has entrusted you with the Cosmic Singularity Seed—the catalyst needed to power the new intergalactic warp gates. Space-time is convulsing near the galactic core: high-velocity asteroid squalls, intense gravitational anomalies, and dense multi-layered laser gauntlets block your path. Complete this delivery, and your call sign will be permanently etched into the Courier Hall of Fame. Clear for departure.',
    tacticalNotes: [
      'Master courier gauntlet: 4600m corridor with maximum hazard density.',
      'Moving asteroid squalls, multiple black hole anomalies, and multi-tier defensive grids.',
      'Maximum bounty and score multipliers in the Courier Guild registry.',
    ],
    fragilityRating: 'SUPREME (SINGULARITY SEED)',
    fragilityColor: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40',
    specialPrecaution: 'Mastery of all flight mechanics required: retro braking, slingshot physics, and laser timing.',
  },
};

export const Briefing: React.FC<BriefingProps> = ({
  mission,
  ship,
  profile,
  contract,
  onAccept,
  onBack,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'objectives' | 'transmission' | 'tactical'>('objectives');

  // Check if there is an associated contract
  const matchedContract =
    contract || CONTRACTS.find((c) => c.mission.id === mission.id || c.id === mission.id);

  // Derive narrative intel
  const narrative: NarrativeIntel =
    CAMPAIGN_LORE[mission.id] || {
      callSign: matchedContract ? `GUILD-CONTRACT // ${matchedContract.contractCode}` : `SEC-INTEL // ${mission.codeName}`,
      dispatcherTitle: matchedContract
        ? `${matchedContract.client.name} • ${matchedContract.client.faction}`
        : 'Courier Guild Flight Dispatch',
      classification: matchedContract
        ? `${matchedContract.riskLevel} RISK CONTRACT • ${matchedContract.cargo.type}`
        : `${mission.difficulty.toUpperCase()} TRANSIT CORRIDOR`,
      transmissionLog: matchedContract
        ? matchedContract.briefing
        : mission.description,
      tacticalNotes: matchedContract
        ? [
            matchedContract.specialHazard,
            `Target landing pad safe touchdown speed: ${mission.landingPad.safeSpeedMax} px/s`,
            `Cargo fragility classified as ${matchedContract.cargo.fragility}`,
          ]
        : [
            `Corridor length: ${mission.worldWidth}m with ${mission.routeWaypoints.length} waypoints.`,
            `Target landing pad safe touchdown speed: ${mission.landingPad.safeSpeedMax} px/s`,
            `Estimated transit ceiling: ${mission.timeLimit} seconds.`,
          ],
      fragilityRating: matchedContract ? matchedContract.cargo.fragility : 'STANDARD COURIER',
      fragilityColor: matchedContract?.riskLevel === 'EXTREME' || matchedContract?.riskLevel === 'CRITICAL'
        ? 'text-rose-400 border-rose-500/40 bg-rose-950/40'
        : 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40',
      specialPrecaution: matchedContract
        ? matchedContract.cargo.hazardNote
        : 'Handle with standard courier inertial dampening protocols.',
    };

  // Keyboard shortcut listener: Enter / Space to Accept, Escape to Back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        soundManager.playUiClick();
        onAccept();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        soundManager.playUiClick();
        onBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onAccept, onBack]);

  const currentDifficulty: GameDifficulty = profile.settings.difficulty || 'courier';
  let rewardMultiplier = 1.0;
  if (currentDifficulty === 'cadet') rewardMultiplier = 0.85;
  else if (currentDifficulty === 'veteran') rewardMultiplier = 1.35;
  else if (currentDifficulty === 'hardcore') rewardMultiplier = 1.75;

  const baseReward = matchedContract ? matchedContract.rewardCredits : mission.rewardCredits;
  const calculatedCredits = Math.round(baseReward * rewardMultiplier);
  const calculatedXp = matchedContract ? Math.round(matchedContract.rewardXp * rewardMultiplier) : Math.round(baseReward * 0.7);

  const isFuelDepletionEnabled = profile.settings.fuelDepletion !== false;

  const handleToggleFuel = () => {
    soundManager.playUiClick();
    if (onUpdateSettings) {
      onUpdateSettings({ fuelDepletion: !isFuelDepletionEnabled });
    }
  };

  const handleDifficultyCycle = (diff: GameDifficulty) => {
    soundManager.playUiClick();
    if (onUpdateSettings) {
      onUpdateSettings({ difficulty: diff });
    }
  };

  return (
    <div
      id="briefing-screen"
      className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between p-3 sm:p-6 md:p-8 select-none overflow-y-auto"
      style={{
        backgroundImage:
          'radial-gradient(circle at 15% 15%, rgba(6, 182, 212, 0.08) 0%, rgba(15, 23, 42, 0) 65%), radial-gradient(circle at 85% 85%, rgba(236, 72, 153, 0.07) 0%, rgba(15, 23, 42, 0) 65%)',
      }}
    >
      {/* 1. Header Bar: Transmission Status & Back Action */}
      <header className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/90">
        <div className="flex items-center gap-3">
          <button
            id="briefing-btn-back"
            onClick={() => {
              soundManager.playUiClick();
              onBack();
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-slate-200 hover:text-cyan-300 transition-all font-mono text-xs font-bold shadow-md active:scale-95 shrink-0"
            title="Return to previous screen (Esc)"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span>Return</span>
          </button>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest text-cyan-400 font-bold">
                <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                TRANSMISSION VERIFIED
              </span>
              <span className="text-[10px] font-mono text-slate-500">•</span>
              <span className="text-[10px] font-mono text-slate-400">{narrative.callSign}</span>
              <span
                className={`text-[9px] font-mono px-2 py-0.5 rounded font-black tracking-wide uppercase border ${
                  mission.difficulty === 'hyper'
                    ? 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                    : mission.difficulty === 'expert'
                    ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                    : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40'
                }`}
              >
                {mission.difficulty.toUpperCase()} HAZARD
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black font-mono tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-indigo-200">
              MISSION BRIEFING: {mission.title.toUpperCase()}
            </h1>
          </div>
        </div>

        {/* Sector and Ship Snapshot */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          <div className="text-right font-mono hidden sm:block">
            <span className="text-[10px] text-slate-400 block tracking-widest">ASSIGNED VESSEL</span>
            <span className="text-xs font-bold text-cyan-300 flex items-center gap-1 justify-end">
              <Rocket className="w-3.5 h-3.5 text-cyan-400" />
              {ship.name}
            </span>
          </div>
          <div className="h-8 w-px bg-slate-800 hidden sm:block" />
          <div className="text-right font-mono">
            <span className="text-[10px] text-slate-400 block tracking-widest">SECTOR CORRIDOR</span>
            <span className="text-xs font-bold text-slate-200">{mission.sector}</span>
          </div>
        </div>
      </header>

      {/* 2. Main Content Grid */}
      <main className="max-w-6xl w-full mx-auto my-4 sm:my-6 grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-start">
        {/* Left Column (7 cols): Narrative Transmission & Objectives */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Dispatcher Header Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between gap-3 mb-3 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-slate-400 block">DISPATCH ORIGIN</span>
                  <h3 className="text-sm font-mono font-bold text-slate-100">{narrative.dispatcherTitle}</h3>
                </div>
              </div>

              {matchedContract?.client.reputationBadge && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pink-950/70 border border-pink-500/40 text-pink-300 font-bold shrink-0">
                  {matchedContract.client.reputationBadge}
                </span>
              )}
            </div>

            {/* Narrative Prose */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 sm:p-4 font-mono text-xs sm:text-sm text-slate-300 leading-relaxed space-y-2">
              <div className="flex items-center gap-2 text-[10px] text-cyan-400 font-bold tracking-widest uppercase">
                <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span>Encrypted Audio Log Transcript</span>
              </div>
              <p className="italic text-slate-200">
                "{narrative.transmissionLog}"
              </p>
            </div>
          </div>

          {/* Navigation Tabs for Objectives vs Tactical Intel */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-1">
            <button
              id="briefing-tab-objectives"
              onClick={() => {
                soundManager.playUiClick();
                setActiveTab('objectives');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-mono text-xs font-bold transition-all ${
                activeTab === 'objectives'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Mission Directives</span>
            </button>

            <button
              id="briefing-tab-tactical"
              onClick={() => {
                soundManager.playUiClick();
                setActiveTab('tactical');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-mono text-xs font-bold transition-all ${
                activeTab === 'tactical'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Tactical & Threat Intel</span>
            </button>
          </div>

          {/* Objectives Content Pane */}
          {activeTab === 'objectives' && (
            <div className="space-y-4">
              {/* Primary Directives (Mandatory) */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                    <h4 className="text-xs font-mono font-black text-cyan-300 tracking-wider uppercase">
                      Primary Objectives (Mandatory)
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 font-bold">
                    REQ FOR SUCCESS
                  </span>
                </div>

                <div className="space-y-2.5 font-mono text-xs">
                  {/* Objective 1: Deliver to Pad */}
                  <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="w-5 h-5 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                      <Target className="w-3 h-3" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-100 block">Deliver Cargo to Landing Pad</span>
                      <span className="text-slate-400 text-[11px]">
                        Navigate through {mission.sector} and land securely on Pad at [X: {mission.landingPad.x}, Y: {mission.landingPad.y}].
                      </span>
                    </div>
                  </div>

                  {/* Objective 2: Touchdown velocity */}
                  <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="w-5 h-5 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                      <Gauge className="w-3 h-3" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-100 block">Safe Touchdown Speed Limit</span>
                      <span className="text-slate-400 text-[11px]">
                        Touch down with velocity under <strong className="text-cyan-300">{mission.landingPad.safeSpeedMax} px/s</strong>. Excessive impact destroys the landing gear and ruptures cargo.
                      </span>
                    </div>
                  </div>

                  {/* Objective 3: Time limit */}
                  <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="w-5 h-5 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                      <Clock className="w-3 h-3" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-100 block">Transit Clock Deadline</span>
                      <span className="text-slate-400 text-[11px]">
                        Complete delivery before the countdown expires (<strong className="text-amber-400">{mission.timeLimit} seconds</strong> limit).
                      </span>
                    </div>
                  </div>

                  {/* Objective 4: Package Integrity */}
                  <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="w-5 h-5 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                      <Shield className="w-3 h-3" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-100 block">Prevent Cargo Containment Breach</span>
                      <span className="text-slate-400 text-[11px]">
                        Maintain package stability above 0%. Shocks from asteroids or barrier impacts degrade containment.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Secondary & Bonus Directives */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-mono font-black text-amber-300 tracking-wider uppercase">
                      Secondary Directives (Bonus Bounties)
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/70 border border-amber-500/40 text-amber-300 font-bold">
                    EXTRA PAYOUT
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="flex items-center justify-between text-amber-300 font-bold mb-0.5">
                      <span>Pristine Cargo</span>
                      <span className="text-[10px] text-amber-400">+30% ₢</span>
                    </div>
                    <span className="text-slate-400 text-[11px]">
                      Deliver with ≥90% package stability intact.
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="flex items-center justify-between text-cyan-300 font-bold mb-0.5">
                      <span>Quantum Rings</span>
                      <span className="text-[10px] text-cyan-400">+{mission.bonusRings.length * 250}+ pts</span>
                    </div>
                    <span className="text-slate-400 text-[11px]">
                      Thread through all {mission.bonusRings.length} slipstream rings.
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="flex items-center justify-between text-emerald-300 font-bold mb-0.5">
                      <span>Eco-Courier</span>
                      <span className="text-[10px] text-emerald-400">+30 ₢</span>
                    </div>
                    <span className="text-slate-400 text-[11px]">
                      Retain ≥40% propellant fuel reserve upon landing.
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="flex items-center justify-between text-pink-300 font-bold mb-0.5">
                      <span>Master Touchdown</span>
                      <span className="text-[10px] text-pink-400">+50 ₢</span>
                    </div>
                    <span className="text-slate-400 text-[11px]">
                      Achieve a PERFECT landing orientation grade.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tactical Intel Pane */}
          {activeTab === 'tactical' && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-lg space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-200">SECTOR HAZARD SURVEY</span>
                <span className="text-[10px] text-slate-400">CORRIDOR: {mission.worldWidth}m × {mission.worldHeight}m</span>
              </div>

              <div className="space-y-2">
                {narrative.tacticalNotes.map((note, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span className="text-slate-300 leading-relaxed">{note}</span>
                  </div>
                ))}
              </div>

              {/* Environmental Stats Breakdown */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl text-center">
                  <span className="text-[10px] text-slate-400 block">ASTEROIDS</span>
                  <span className="text-sm font-bold text-cyan-300">{mission.asteroids.length} Hazards</span>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl text-center">
                  <span className="text-[10px] text-slate-400 block">GRAV-WELLS</span>
                  <span className={`text-sm font-bold ${mission.gravityWells.length > 0 ? 'text-purple-400' : 'text-slate-500'}`}>
                    {mission.gravityWells.length > 0 ? `${mission.gravityWells.length} Anomalies` : 'None'}
                  </span>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl text-center">
                  <span className="text-[10px] text-slate-400 block">LASER GRIDS</span>
                  <span className={`text-sm font-bold ${mission.lasers.length > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                    {mission.lasers.length > 0 ? `${mission.lasers.length} Barriers` : 'Clear'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Cargo Dossier, Flight Readiness & Launch Action */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Cargo Dossier Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-xl">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-pink-400" />
                <h4 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                  Cargo Dossier & Manifest
                </h4>
              </div>
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-black border ${narrative.fragilityColor}`}>
                {narrative.fragilityRating}
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">CARGO DESIGNATION</span>
                <span className="text-sm font-bold text-pink-300">{mission.cargoName}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block">DESCRIPTION</span>
                <p className="text-slate-300 text-[11px] font-light leading-relaxed">
                  {mission.cargoDescription}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-bold mb-1">
                  <Info className="w-3 h-3" />
                  <span>SPECIAL HANDLING DIRECTIVE</span>
                </div>
                <span className="text-[11px] text-slate-300 leading-snug block">
                  {narrative.specialPrecaution}
                </span>
              </div>
            </div>
          </div>

          {/* Assigned Vessel Readiness & Fast Toggles */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-xl font-mono text-xs">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Rocket className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-slate-200">FLIGHT READINESS</span>
              </div>
              <span className="text-[10px] text-cyan-400 font-bold">{ship.name}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                <span className="text-[9px] text-slate-400 block">HANDLING AGILITY</span>
                <span className="font-bold text-slate-200">{ship.stats.handlingName}</span>
              </div>
              <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                <span className="text-[9px] text-slate-400 block">SHIELD RESISTANCE</span>
                <span className="font-bold text-slate-200">{Math.round(ship.stats.collisionResistance * 100)}% Absorbed</span>
              </div>
            </div>

            {/* Quick Fuel Consumption Toggle */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <Flame className={`w-3.5 h-3.5 ${isFuelDepletionEnabled ? 'text-amber-400' : 'text-cyan-400'}`} />
                <div>
                  <span className="text-[11px] font-bold text-slate-200 block">Fuel Consumption</span>
                  <span className="text-[9px] text-slate-400">
                    {isFuelDepletionEnabled ? 'Active (Realistic Propellant)' : 'Deactivated (Unlimited Tank)'}
                  </span>
                </div>
              </div>
              <button
                id="briefing-toggle-fuel"
                onClick={handleToggleFuel}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                  isFuelDepletionEnabled
                    ? 'bg-amber-950/60 text-amber-300 border-amber-500/40 hover:bg-amber-900/60'
                    : 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40 hover:bg-cyan-900/60'
                }`}
                title="Toggle Fuel Consumption on/off"
              >
                {isFuelDepletionEnabled ? 'BURNING' : 'UNLIMITED'}
              </button>
            </div>

            {/* Quick Difficulty Selector */}
            <div className="flex items-center justify-between text-[11px] pt-1">
              <span className="text-slate-400">FLIGHT ASSIST / DIFF:</span>
              <div className="flex items-center gap-1">
                {(['cadet', 'courier', 'veteran', 'hardcore'] as GameDifficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => handleDifficultyCycle(d)}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase transition-all ${
                      currentDifficulty === d
                        ? 'bg-cyan-500 text-slate-950'
                        : 'text-slate-400 hover:text-slate-200 bg-slate-950'
                    }`}
                  >
                    {d[0].toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Compensation & Launch Action Area */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">TOTAL CONTRACT PAYOUT</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl font-mono font-black text-amber-400 flex items-center gap-1">
                    <Coins className="w-5 h-5 text-amber-400" />
                    {calculatedCredits.toLocaleString()} ₢
                  </span>
                  {rewardMultiplier !== 1.0 && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                        rewardMultiplier > 1.0 ? 'bg-amber-950 text-amber-300' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {rewardMultiplier > 1.0 ? `+${Math.round((rewardMultiplier - 1) * 100)}%` : '-15%'}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-400 block">XP REWARD</span>
                <span className="text-sm font-mono font-bold text-cyan-300">+{calculatedXp} XP</span>
              </div>
            </div>

            {/* Launch / Accept Button */}
            <button
              id="briefing-btn-accept"
              onClick={() => {
                soundManager.playUiClick();
                onAccept();
              }}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-mono font-black text-base sm:text-lg tracking-wider flex items-center justify-center gap-3 shadow-xl shadow-cyan-500/30 transition-all hover:scale-[1.02] active:scale-98 border-2 border-cyan-200 group cursor-pointer"
            >
              <Rocket className="w-5 h-5 group-hover:animate-bounce" />
              <span>ACCEPT & LAUNCH MISSION</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-1">
              <span>PRESS [ENTER] OR [SPACE] TO LAUNCH</span>
              <button
                id="briefing-btn-decline"
                onClick={() => {
                  soundManager.playUiClick();
                  onBack();
                }}
                className="text-slate-400 hover:text-slate-200 underline decoration-slate-600 transition-colors"
              >
                DECLINE CONTRACT [ESC]
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Dispatch Stamp */}
      <footer className="max-w-6xl w-full mx-auto pt-3 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono text-slate-500">
        <span>AUTHORIZATION CODE: CC-DISPATCH-VERIFIED • STANDBY FOR SUB-LIGHT PROPULSION</span>
        <span>GUILD PROTOCOL 14-B • ALL DELIVERIES GUARANTEED UNDER SECTOR MARITIME LAW</span>
      </footer>
    </div>
  );
};
