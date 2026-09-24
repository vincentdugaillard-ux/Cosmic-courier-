// Cosmic Courier - Ship Showroom & Hangar View
import React, { useState } from 'react';
import { PlayerProfile, Ship } from '../types/game';
import { SHIPS } from '../game/constants';
import {
  ArrowLeft,
  Check,
  Zap,
  Gauge,
  RotateCw,
  ShieldCheck,
  Flame,
  ShoppingBag,
  Home,
  Coins,
  Sparkles,
  Lock,
} from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface HangarViewProps {
  profile: PlayerProfile;
  onEquipShip: (shipId: string) => void;
  onPurchaseShip: (shipId: string, cost: number) => void;
  onAddCredits?: (amount: number) => void;
  onBack: () => void;
}

// Dedicated Vector Renderer for Distinct Ship Designs
export const ShipSvg: React.FC<{
  ship: Ship;
  isTesting?: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({ ship, isTesting = false, size = 'lg' }) => {
  const dimensions =
    size === 'sm'
      ? { width: 44, height: 36, viewBox: '-60 -50 120 100' }
      : size === 'md'
      ? { width: 90, height: 70, viewBox: '-60 -50 120 100' }
      : { width: 220, height: 160, viewBox: '-60 -50 120 100' };

  switch (ship.id) {
    case 'nebula_swift':
      // 1. NEBULA SWIFT: Forward-Swept Agile Interceptor
      return (
        <svg
          width={dimensions.width}
          height={dimensions.height}
          viewBox={dimensions.viewBox}
          className="transition-transform duration-300 drop-shadow-[0_0_16px_rgba(57,255,20,0.35)]"
        >
          {/* Twin Afterburners */}
          {isTesting && (
            <>
              <polygon points="-26,16 -68,14 -26,10" fill="#ff0055" className="animate-pulse" />
              <polygon points="-26,-16 -68,-14 -26,-10" fill="#ff0055" className="animate-pulse" />
            </>
          )}
          {/* Hull: Forward-swept wings + needle probe prow */}
          <polygon
            points="55,0 18,7 28,19 14,14 10,38 -12,28 -26,19 -18,9 -26,0 -18,-9 -26,-19 -12,-28 10,-38 14,-14 28,-19 18,-7"
            fill="#08141e"
            stroke={ship.color}
            strokeWidth={size === 'sm' ? 4 : 3.5}
            strokeLinejoin="round"
          />
          {/* Agile Wing Spars */}
          <line x1="8" y1="12" x2="6" y2="34" stroke={ship.accentColor} strokeWidth="2.5" />
          <line x1="8" y1="-12" x2="6" y2="-34" stroke={ship.accentColor} strokeWidth="2.5" />
          {/* Cargo Core */}
          <circle cx="-3" cy="0" r={size === 'sm' ? 6 : 9} fill="#39ff14" stroke="#ffffff" strokeWidth="1.5" />
          {/* Needle Canopy */}
          <polygon points="34,0 8,5 8,-5" fill="rgba(255,255,255,0.9)" />
        </svg>
      );

    case 'titan_hauler':
      // 2. TITAN HAULER: Heavy Armored Dual-Catamaran Transport
      return (
        <svg
          width={dimensions.width}
          height={dimensions.height}
          viewBox={dimensions.viewBox}
          className="transition-transform duration-300 drop-shadow-[0_0_16px_rgba(245,158,11,0.35)]"
        >
          {/* Massive Dual Heavy Thrusters */}
          {isTesting && (
            <>
              <polygon points="-32,24 -85,18 -32,12" fill="#ff0055" className="animate-pulse" />
              <polygon points="-32,-24 -85,-18 -32,-12" fill="#ff0055" className="animate-pulse" />
            </>
          )}
          {/* Heavy Armored Catamaran Prow Hull */}
          <polygon
            points="32,-26 32,-12 18,0 32,12 32,26 8,34 -32,28 -32,8 -20,0 -32,-8 -32,-28 8,-34"
            fill="#1c1408"
            stroke={ship.color}
            strokeWidth={size === 'sm' ? 4.5 : 4}
            strokeLinejoin="round"
          />
          {/* Armor Reinforcement Struts */}
          <line x1="26" y1="-20" x2="-24" y2="-20" stroke={ship.accentColor} strokeWidth="3" />
          <line x1="26" y1="20" x2="-24" y2="20" stroke={ship.accentColor} strokeWidth="3" />
          {/* Reinforced Heavy Cargo Vault Cage */}
          <rect
            x={size === 'sm' ? -8 : -12}
            y={size === 'sm' ? -10 : -14}
            width={size === 'sm' ? 16 : 24}
            height={size === 'sm' ? 20 : 28}
            fill="#39ff14"
            stroke="#ffffff"
            strokeWidth="1.8"
            rx="2"
          />
          {/* Command Bridges */}
          <rect x="12" y="-23" width="12" height="7" fill="rgba(255,255,255,0.9)" rx="1" />
          <rect x="12" y="16" width="12" height="7" fill="rgba(255,255,255,0.9)" rx="1" />
        </svg>
      );

    case 'solar_dart':
      // 3. SOLAR DART: Ultra-Long Razor-Thin Delta Speedrunner
      return (
        <svg
          width={dimensions.width}
          height={dimensions.height}
          viewBox={dimensions.viewBox}
          className="transition-transform duration-300 drop-shadow-[0_0_16px_rgba(236,72,153,0.35)]"
        >
          {/* High-Speed Ion Jet Flame */}
          {isTesting && (
            <polygon points="-34,-9 -88,0 -34,9" fill="#ff0055" className="animate-pulse" />
          )}
          {/* Razor-Thin Dart Hull + Outrigger Solar Blade Foils */}
          <polygon
            points="58,0 18,8 10,22 -6,38 -40,32 -18,12 -34,9 -26,0 -34,-9 -18,-12 -40,-32 -6,-38 10,-22 18,-8"
            fill="#1b0818"
            stroke={ship.color}
            strokeWidth={size === 'sm' ? 4 : 3.5}
            strokeLinejoin="round"
          />
          {/* Solar Collector Radiator Lines */}
          <line x1="2" y1="30" x2="-30" y2="26" stroke={ship.accentColor} strokeWidth="2.5" />
          <line x1="2" y1="-30" x2="-30" y2="-26" stroke={ship.accentColor} strokeWidth="2.5" />
          {/* Cargo Core */}
          <circle cx="-5" cy="0" r={size === 'sm' ? 6 : 9} fill="#39ff14" stroke="#ffffff" strokeWidth="1.5" />
          {/* Supersonic Elongated Canopy */}
          <polygon points="42,0 8,4 8,-4" fill="rgba(255,255,255,0.9)" />
        </svg>
      );

    case 'quantum_phantom':
      // 4. QUANTUM PHANTOM: Faceted Stealth Diamond Flying Wing
      return (
        <svg
          width={dimensions.width}
          height={dimensions.height}
          viewBox={dimensions.viewBox}
          className="transition-transform duration-300 drop-shadow-[0_0_16px_rgba(168,85,247,0.35)]"
        >
          {/* Stealth Plasma Slit Flare */}
          {isTesting && (
            <polygon points="-28,-12 -72,0 -28,12" fill="#ff0055" className="animate-pulse" />
          )}
          {/* Diamond Stealth Polygon */}
          <polygon
            points="40,0 6,22 -6,38 -36,26 -18,12 -28,0 -18,-12 -36,-26 -6,-38 6,-22"
            fill="#0f081c"
            stroke={ship.color}
            strokeWidth={size === 'sm' ? 4 : 3.8}
            strokeLinejoin="round"
          />
          {/* Stealth Facet Ridges */}
          <line x1="40" y1="0" x2="-10" y2="0" stroke={ship.accentColor} strokeWidth="2" strokeDasharray="3,3" />
          <line x1="6" y1="22" x2="-10" y2="0" stroke={ship.accentColor} strokeWidth="2" />
          <line x1="6" y1="-22" x2="-10" y2="0" stroke={ship.accentColor} strokeWidth="2" />
          {/* Magnetic Containment Ring */}
          <circle
            cx="-4"
            cy="0"
            r={size === 'sm' ? 10 : 16}
            fill="none"
            stroke={ship.accentColor}
            strokeWidth="2"
            strokeDasharray="4,4"
          />
          {/* Cargo Core */}
          <circle cx="-4" cy="0" r={size === 'sm' ? 6 : 9} fill="#39ff14" stroke="#ffffff" strokeWidth="1.5" />
          {/* Angular Canopy */}
          <polygon points="26,0 12,6 4,0 12,-6" fill="rgba(255,255,255,0.9)" />
        </svg>
      );

    case 'courier_alpha':
    default:
      // 5. COURIER ALPHA: Classic Arrowhead Delta Star-Courier
      return (
        <svg
          width={dimensions.width}
          height={dimensions.height}
          viewBox={dimensions.viewBox}
          className="transition-transform duration-300 drop-shadow-[0_0_16px_rgba(0,240,255,0.35)]"
        >
          {/* Thruster Flame Test */}
          {isTesting && (
            <polygon points="-28,-8 -75,0 -28,8" fill="#ff0055" className="animate-pulse" />
          )}
          {/* Arrowhead Delta Hull */}
          <polygon
            points="45,0 -28,30 -16,10 -28,0 -16,-10 -28,-30"
            fill="#0c1020"
            stroke={ship.color}
            strokeWidth={size === 'sm' ? 4 : 3.5}
            strokeLinejoin="round"
          />
          {/* Accent Winglines */}
          <line x1="12" y1="8" x2="-20" y2="22" stroke={ship.accentColor} strokeWidth="2.5" />
          <line x1="12" y1="-8" x2="-20" y2="-22" stroke={ship.accentColor} strokeWidth="2.5" />
          {/* Cargo Core */}
          <circle cx="-4" cy="0" r={size === 'sm' ? 6 : 10} fill="#39ff14" stroke="#ffffff" strokeWidth="1.5" />
          {/* Cockpit Canopy */}
          <polygon points="26,0 4,6 4,-6" fill="rgba(255,255,255,0.9)" />
        </svg>
      );
  }
};

export const HangarView: React.FC<HangarViewProps> = ({
  profile,
  onEquipShip,
  onPurchaseShip,
  onAddCredits,
  onBack,
}) => {
  const [selectedShipId, setSelectedShipId] = useState<string>(profile.selectedShipId);
  const [thrusterTesting, setThrusterTesting] = useState(false);
  const [purchaseSuccessMessage, setPurchaseSuccessMessage] = useState<string | null>(null);

  const selectedShip = SHIPS.find((s) => s.id === selectedShipId) || SHIPS[0];
  const isUnlocked = profile.unlockedShipIds.includes(selectedShip.id);
  const isEquipped = profile.selectedShipId === selectedShip.id;
  const canAfford = profile.totalCredits >= selectedShip.cost;

  const handleTestThrusters = () => {
    soundManager.playBoost();
    setThrusterTesting(true);
    setTimeout(() => setThrusterTesting(false), 800);
  };

  const handleBuyShip = (ship: Ship) => {
    if (profile.unlockedShipIds.includes(ship.id)) {
      onEquipShip(ship.id);
      return;
    }

    if (profile.totalCredits >= ship.cost) {
      soundManager.playUiPurchase();
      onPurchaseShip(ship.id, ship.cost);
      setSelectedShipId(ship.id);
      setPurchaseSuccessMessage(`🎉 ${ship.name} Acquired & Equipped!`);
      setTimeout(() => setPurchaseSuccessMessage(null), 3500);
    } else {
      soundManager.playUiClick();
      setSelectedShipId(ship.id);
    }
  };

  const handleClaimGrant = () => {
    soundManager.playUiPurchase();
    onAddCredits?.(1000);
    setPurchaseSuccessMessage('💳 +1,000 ₢ Pilot Grant Credited to Balance!');
    setTimeout(() => setPurchaseSuccessMessage(null), 3500);
  };

  return (
    <div
      id="hangar-view-screen"
      className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8 md:p-10 select-none overflow-y-auto"
      style={{
        backgroundImage:
          'radial-gradient(circle at 75% 25%, rgba(236, 72, 153, 0.09) 0%, rgba(15, 23, 42, 0) 65%), radial-gradient(circle at 20% 70%, rgba(14, 165, 233, 0.08) 0%, rgba(15, 23, 42, 0) 65%)',
      }}
    >
      {/* Top Header */}
      <header className="max-w-6xl w-full mx-auto flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-900">
        <div className="flex items-center gap-4">
          <button
            id="hangar-btn-back"
            onClick={() => {
              soundManager.playUiClick();
              onBack();
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-pink-500 text-slate-200 hover:text-pink-300 transition-colors font-mono text-xs font-bold shadow-md active:scale-95"
            aria-label="Back to Main Menu"
          >
            <ArrowLeft className="w-4 h-4" />
            <Home className="w-3.5 h-3.5 text-pink-400" />
            <span>Main Menu</span>
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-wide text-cyan-300">
              SHIPYARD HANGAR
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Acquire specialized vessels with unique hull designs & flight characteristics
            </p>
          </div>
        </div>

        {/* Currency Display & Grant Button */}
        <div className="flex items-center gap-3">
          <button
            id="hangar-btn-grant-header"
            onClick={handleClaimGrant}
            className="px-3 py-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/40 hover:border-amber-400 text-amber-300 font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            title="Claim 1,000 Credits to test all ship purchases"
          >
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>+ Grant 1,000 ₢</span>
          </button>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2 font-mono text-sm flex items-center gap-2 shadow-inner">
            <span className="text-slate-400 text-xs">CREDITS:</span>
            <span className="font-bold text-amber-400">{profile.totalCredits.toLocaleString()} ₢</span>
          </div>
        </div>
      </header>

      {/* Success Notification Banner */}
      {purchaseSuccessMessage && (
        <div className="max-w-6xl w-full mx-auto my-3 px-4 py-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/60 text-cyan-200 font-mono text-xs font-bold flex items-center justify-between shadow-lg shadow-cyan-950/50 animate-bounce">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            {purchaseSuccessMessage}
          </span>
          <button
            onClick={() => setPurchaseSuccessMessage(null)}
            className="text-cyan-400 hover:text-cyan-200 text-xs px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Showcase Layout (Scrollable up/down) */}
      <main className="max-w-6xl w-full mx-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Ship Model Selector & Instant Buy List */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1 mb-1">
            <span className="text-xs font-mono text-slate-400 tracking-wider">
              FLEET CATALOG ({SHIPS.length})
            </span>
            <span className="text-[11px] font-mono text-slate-500">Scrollable Fleet</span>
          </div>

          {/* Scrollable list container for up/down navigation */}
          <div className="flex flex-col gap-2.5 max-h-[600px] overflow-y-auto pr-1">
            {SHIPS.map((ship) => {
              const unlocked = profile.unlockedShipIds.includes(ship.id);
              const equipped = profile.selectedShipId === ship.id;
              const isSelected = selectedShip.id === ship.id;
              const shipAffordable = profile.totalCredits >= ship.cost;

              return (
                <div
                  key={ship.id}
                  id={`hangar-ship-tab-${ship.id}`}
                  onClick={() => {
                    soundManager.playUiClick();
                    setSelectedShipId(ship.id);
                  }}
                  className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-2.5 ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-400 shadow-lg shadow-cyan-950/60 scale-[1.01]'
                      : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {/* Mini Silhouette Vector Representation */}
                      <div className="w-12 h-10 bg-slate-950/90 border border-slate-800 rounded-xl flex items-center justify-center p-1 overflow-hidden shrink-0">
                        <ShipSvg ship={ship} size="sm" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-200">{ship.name}</span>
                          {equipped && (
                            <span className="text-[9px] font-mono bg-cyan-950/90 text-cyan-400 border border-cyan-500/40 px-1.5 py-0.5 rounded font-bold">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 block truncate max-w-[160px]">
                          {ship.tagline}
                        </span>
                      </div>
                    </div>

                    <div>
                      {unlocked ? (
                        <span className="text-xs font-mono font-bold text-lime-400 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> OWNED
                        </span>
                      ) : (
                        <span className="text-xs font-mono font-bold text-amber-400">
                          {ship.cost.toLocaleString()} ₢
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Direct Action Button on Card: BUY or EQUIP */}
                  <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-slate-500">
                      {ship.stats.handlingName}
                    </span>

                    {!unlocked ? (
                      <button
                        id={`hangar-card-buy-${ship.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBuyShip(ship);
                        }}
                        disabled={!shipAffordable}
                        className={`px-3 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                          shipAffordable
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 active:scale-95'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        }`}
                      >
                        <ShoppingBag className="w-3 h-3" />
                        <span>Buy {ship.cost.toLocaleString()} ₢</span>
                      </button>
                    ) : !equipped ? (
                      <button
                        id={`hangar-card-equip-${ship.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          soundManager.playUiClick();
                          onEquipShip(ship.id);
                        }}
                        className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 transition-all border border-slate-700 hover:border-cyan-400 active:scale-95"
                      >
                        Equip
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono text-cyan-400 font-semibold">
                        Equipped
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Visual Ship Preview & Performance Telemetry */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl flex flex-col justify-between">
          <div>
            {/* Top Info */}
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div>
                <span className="text-xs font-mono text-cyan-400 font-bold tracking-widest block">
                  MODEL SPECIFICATION
                </span>
                <h2 className="text-3xl font-extrabold font-mono text-slate-100 mt-1">
                  {selectedShip.name}
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedShip.tagline}</p>
              </div>

              <div className="text-right">
                {isUnlocked ? (
                  <span className="text-xs font-mono font-bold text-lime-400 bg-lime-950/70 border border-lime-500/30 px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> AUTHORIZED
                  </span>
                ) : (
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-mono font-bold text-amber-400 bg-amber-950/70 border border-amber-500/30 px-3 py-1.5 rounded-xl inline-block">
                      PRICE: {selectedShip.cost.toLocaleString()} ₢
                    </span>
                    {!canAfford && (
                      <span className="text-[11px] font-mono text-rose-400">
                        Need {(selectedShip.cost - profile.totalCredits).toLocaleString()} ₢ more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Visual Ship Stage (Interactive Distinct Vector Hull) */}
            <div className="relative w-full h-60 bg-slate-950/90 border border-slate-800/80 rounded-2xl flex items-center justify-center overflow-hidden mb-6 shadow-inner">
              {/* Radial backdrop glow */}
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  background: `radial-gradient(circle, ${selectedShip.color} 0%, transparent 70%)`,
                }}
              />

              {/* Vector Spacecraft Representation */}
              <div className="relative flex items-center justify-center">
                <ShipSvg ship={selectedShip} isTesting={thrusterTesting} size="lg" />
              </div>

              {/* Distinct Hull Badge */}
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-400">
                CHASSIS: <span className="text-cyan-300 font-bold">{selectedShip.stats.handlingName}</span>
              </div>

              {/* Test Thruster Button */}
              <button
                id="hangar-btn-test-thruster"
                onClick={handleTestThrusters}
                className="absolute bottom-3 right-3 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-pink-500 text-xs font-mono text-slate-300 hover:text-cyan-300 flex items-center gap-1.5 transition-colors shadow-md active:scale-95"
              >
                <Flame className="w-3.5 h-3.5 text-pink-400" />
                <span>Test Afterburner</span>
              </button>
            </div>

            {/* Ship Description */}
            <p className="text-xs text-slate-300 font-light leading-relaxed mb-6">
              {selectedShip.description}
            </p>

            {/* Performance Stats Radar / Progress Bars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* Speed */}
              <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-cyan-400" /> TOP SPEED
                  </span>
                  <span className="text-cyan-300 font-bold">{(selectedShip.stats.speed * 10).toFixed(0)} M/S</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded-full"
                    style={{ width: `${(selectedShip.stats.speed / 8.0) * 100}%` }}
                  />
                </div>
              </div>

              {/* Maneuverability */}
              <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <RotateCw className="w-3.5 h-3.5 text-lime-400" /> MANEUVERABILITY
                  </span>
                  <span className="text-lime-300 font-bold">{selectedShip.stats.handlingName}</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-lime-400 rounded-full"
                    style={{ width: `${(selectedShip.stats.turnRate / 0.09) * 100}%` }}
                  />
                </div>
              </div>

              {/* Boost Power */}
              <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-pink-400" /> BOOST CAPACITY
                  </span>
                  <span className="text-pink-300 font-bold">{selectedShip.stats.boostMaxDuration}s TANK</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-pink-400 rounded-full"
                    style={{ width: `${(selectedShip.stats.boostMaxDuration / 6.0) * 100}%` }}
                  />
                </div>
              </div>

              {/* Collision Resistance */}
              <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> CARGO SHIELDING
                  </span>
                  <span className="text-amber-300 font-bold">
                    {Math.round(selectedShip.stats.collisionResistance * 100)}% ABSORPTION
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${(selectedShip.stats.collisionResistance / 0.6) * 100}%` }}
                  />
                </div>
              </div>

              {/* Fuel Capacity */}
              <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-emerald-400" /> FUEL CAPACITY
                  </span>
                  <span className="text-emerald-300 font-bold">
                    {selectedShip.stats.fuelCapacity || 100} L TANK
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full"
                    style={{ width: `${((selectedShip.stats.fuelCapacity || 100) / 160) * 100}%` }}
                  />
                </div>
              </div>

              {/* Fuel Burn Rate */}
              <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-cyan-400" /> BURN RATE
                  </span>
                  <span className="text-cyan-300 font-bold">
                    {selectedShip.stats.fuelBurnRate || 1.0}x CONSUMPTION
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded-full"
                    style={{ width: `${Math.min(100, ((selectedShip.stats.fuelBurnRate || 1.0) / 1.6) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Area: Equip, Buy Button, and Grant Option */}
          <div className="flex flex-col gap-3">
            {isUnlocked ? (
              <button
                id="hangar-btn-equip"
                onClick={() => {
                  soundManager.playUiClick();
                  onEquipShip(selectedShip.id);
                }}
                disabled={isEquipped}
                className={`w-full py-4 px-6 rounded-2xl font-mono font-bold text-sm tracking-wider flex items-center justify-center gap-2 transition-all ${
                  isEquipped
                    ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-default'
                    : 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 shadow-xl shadow-cyan-500/30 hover:scale-[1.01] active:scale-98 cursor-pointer'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>{isEquipped ? 'Currently Active Vessel' : 'Equip as Active Vessel'}</span>
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  id="hangar-btn-buy"
                  onClick={() => handleBuyShip(selectedShip)}
                  disabled={!canAfford}
                  className={`w-full py-4 px-6 rounded-2xl font-mono font-bold text-sm tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    canAfford
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 shadow-xl shadow-amber-500/30 hover:scale-[1.01] active:scale-98 ring-2 ring-amber-400/50'
                      : 'bg-slate-800/90 text-slate-500 border border-slate-700 cursor-not-allowed'
                  }`}
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>
                    {canAfford
                      ? `BUY ${selectedShip.name.toUpperCase()} (${selectedShip.cost.toLocaleString()} ₢)`
                      : `INSUFFICIENT CREDITS (REQUIRES ${selectedShip.cost.toLocaleString()} ₢)`}
                  </span>
                </button>

                {!canAfford && (
                  <button
                    id="hangar-btn-grant-action"
                    onClick={handleClaimGrant}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-950/40 hover:bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all active:scale-98"
                  >
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>Claim +1,000 ₢ Shipyard Grant to Buy this Ship</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-500 pt-4 border-t border-slate-900">
        <span>TIP: TITAN HAULER ABSORBS 55% OF COLLISION SHOCK — GREAT FOR ASTEROID FIELDS!</span>
        <button
          onClick={() => {
            soundManager.playUiClick();
            onBack();
          }}
          className="text-slate-400 hover:text-slate-200 transition-colors"
        >
          Return to Navigation
        </button>
      </footer>
    </div>
  );
};
