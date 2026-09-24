// Cosmic Courier - Main Application Coordinator
import React, { useState, useEffect } from 'react';
import {
  ScreenState,
  Mission,
  MissionResult,
  PlayerProfile,
  Ship,
  GameDifficulty,
  Contract,
} from './types/game';
import { CAMPAIGN_MISSIONS, SHIPS } from './game/constants';
import {
  loadPlayerProfile,
  savePlayerProfile,
  recordGameStart,
  recordMissionCompletion,
  equipShip,
  purchaseShip,
  updateSettings,
  resetProfile,
} from './utils/storage';
import { soundManager } from './audio/soundManager';

import { MainMenu } from './components/MainMenu';
import { MissionSelect } from './components/MissionSelect';
import { ContractsView } from './components/ContractsView';
import { Briefing } from './components/Briefing';
import { GameView } from './components/GameView';
import { ResultsView } from './components/ResultsView';
import { HangarView } from './components/HangarView';
import { SettingsModal } from './components/SettingsModal';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  const [profile, setProfile] = useState<PlayerProfile>(loadPlayerProfile);
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('menu');
  const [activeMission, setActiveMission] = useState<Mission>(CAMPAIGN_MISSIONS[0]);
  const [activeContract, setActiveContract] = useState<Contract | null>(null);
  const [briefingReturnScreen, setBriefingReturnScreen] = useState<ScreenState>('menu');
  const [lastResult, setLastResult] = useState<MissionResult | null>(null);
  const [isNewBestScore, setIsNewBestScore] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // Sync sound settings with profile
  useEffect(() => {
    soundManager.setSettings(
      profile.settings.soundEnabled,
      profile.settings.musicEnabled,
      profile.settings.masterVolume,
      profile.settings.sfxVolume,
      profile.settings.musicVolume
    );
  }, [profile.settings]);

  // Current active ship
  const activeShip: Ship =
    SHIPS.find((s) => s.id === profile.selectedShipId) || SHIPS[0];

  // Track total games played counter
  const totalGamesPlayed = profile.statistics.totalGamesPlayed ?? profile.statistics.missionsAttempted ?? 0;

  const triggerGameStart = () => {
    const updated = recordGameStart(profile);
    setProfile(updated);
  };

  // Mission Selection Handler - routes to Briefing
  const handleSelectMission = (mission: Mission) => {
    setActiveMission(mission);
    setActiveContract(null);
    setBriefingReturnScreen('missionSelect');
    setCurrentScreen('briefing');
  };

  // Contract Selection Handler - routes to Briefing with contract details
  const handleSelectContract = (mission: Mission, contract?: Contract) => {
    setActiveMission(mission);
    setActiveContract(contract || null);
    setBriefingReturnScreen('contracts');
    setCurrentScreen('briefing');
  };

  // Launch from Briefing after pilot accepts mission
  const handleLaunchMission = () => {
    triggerGameStart();
    setCurrentScreen('game');
  };

  // Back from Briefing
  const handleBackFromBriefing = () => {
    setCurrentScreen(briefingReturnScreen);
  };

  // Mission Completion Handler
  const handleMissionComplete = (result: MissionResult) => {
    setLastResult(result);
    const { updatedProfile, isNewBest } = recordMissionCompletion(profile, result);
    setProfile(updatedProfile);
    setIsNewBestScore(isNewBest);
    setCurrentScreen('results');
  };

  // Replay Current Mission
  const handleReplayMission = () => {
    triggerGameStart();
    setCurrentScreen('game');
  };

  // Advance to Next Mission - routes to Briefing
  const handleNextMission = (nextMission: Mission) => {
    setActiveMission(nextMission);
    setActiveContract(null);
    setBriefingReturnScreen('missionSelect');
    setCurrentScreen('briefing');
  };

  // Ship Purchasing
  const handlePurchaseShip = (shipId: string, cost: number) => {
    const updated = purchaseShip(profile, shipId, cost);
    if (updated) {
      setProfile(updated);
    }
  };

  // Add Credits (Stipend / Grant for ship testing)
  const handleAddCredits = (amount: number) => {
    const updated: PlayerProfile = {
      ...profile,
      totalCredits: profile.totalCredits + amount,
    };
    savePlayerProfile(updated);
    setProfile(updated);
  };

  // Ship Equipping
  const handleEquipShip = (shipId: string) => {
    const updated = equipShip(profile, shipId);
    setProfile(updated);
  };

  // Settings Updates
  const handleUpdateSettings = (newSettings: Partial<PlayerProfile['settings']>) => {
    const updated = updateSettings(profile, newSettings);
    setProfile(updated);
  };

  // Profile Reset
  const handleResetProfile = () => {
    const reset = resetProfile();
    setProfile(reset);
    setActiveMission(CAMPAIGN_MISSIONS[0]);
    setCurrentScreen('menu');
  };

  // Direct Play Game Handler (routes through Briefing)
  const handlePlayGame = () => {
    // Find next uncompleted mission or active mission
    const nextMission =
      CAMPAIGN_MISSIONS.find(
        (m, idx) =>
          (idx === 0 || profile.completedMissionIds.includes(CAMPAIGN_MISSIONS[idx - 1].id)) &&
          !profile.completedMissionIds.includes(m.id)
      ) || CAMPAIGN_MISSIONS[0];
    setActiveMission(nextMission);
    setActiveContract(null);
    setBriefingReturnScreen('menu');
    setCurrentScreen('briefing');
  };

  return (
    <div
      className={`w-full h-screen bg-slate-950 text-slate-100 font-sans select-none ${
        currentScreen === 'game' ? 'overflow-hidden' : 'overflow-y-auto'
      }`}
    >
      {/* PWA Offline Connectivity Indicator */}
      <OfflineIndicator />

      {/* 1. Main Menu */}
      {currentScreen === 'menu' && (
        <MainMenu
          profile={profile}
          onPlayGame={handlePlayGame}
          onStartCampaign={() => setCurrentScreen('missionSelect')}
          onOpenContracts={() => setCurrentScreen('contracts')}
          onOpenHangar={() => setCurrentScreen('hangar')}
          onOpenSettings={() => setShowSettingsModal(true)}
          onUpdateDifficulty={(diff: GameDifficulty) => handleUpdateSettings({ difficulty: diff })}
          onUpdateSettings={handleUpdateSettings}
        />
      )}

      {/* 2. Mission / Sector Select */}
      {currentScreen === 'missionSelect' && (
        <MissionSelect
          profile={profile}
          onSelectMission={handleSelectMission}
          onBackToMenu={() => setCurrentScreen('menu')}
          onOpenHangar={() => setCurrentScreen('hangar')}
          onOpenContracts={() => setCurrentScreen('contracts')}
        />
      )}

      {/* 3. Contracts & Freelance Bounty Board */}
      {currentScreen === 'contracts' && (
        <ContractsView
          profile={profile}
          onSelectContract={handleSelectContract}
          onBackToMenu={() => setCurrentScreen('menu')}
          onUpdateDifficulty={(diff: GameDifficulty) => handleUpdateSettings({ difficulty: diff })}
        />
      )}

      {/* 4. Mission Briefing Directive & Narrative Dossier */}
      {currentScreen === 'briefing' && (
        <Briefing
          mission={activeMission}
          ship={activeShip}
          profile={profile}
          contract={activeContract}
          onAccept={handleLaunchMission}
          onBack={handleBackFromBriefing}
          onUpdateSettings={handleUpdateSettings}
        />
      )}

      {/* 5. Spaceflight Canvas Game Screen */}
      {currentScreen === 'game' && (
        <GameView
          key={`${activeMission.id}-${activeShip.id}`}
          mission={activeMission}
          ship={activeShip}
          settings={profile.settings}
          totalGamesPlayed={totalGamesPlayed}
          onRecordGameStart={triggerGameStart}
          onMissionComplete={handleMissionComplete}
          onExitToMainMenu={() => setCurrentScreen('menu')}
          onExitToMenu={() => setCurrentScreen('menu')}
          onUpdateSettings={handleUpdateSettings}
        />
      )}

      {/* 4. Results & Score Breakdown */}
      {currentScreen === 'results' && lastResult && (
        <ResultsView
          result={lastResult}
          isNewBestScore={isNewBestScore}
          totalGamesPlayed={totalGamesPlayed}
          onReplay={handleReplayMission}
          onNextMission={handleNextMission}
          onMissionSelect={() => setCurrentScreen('missionSelect')}
          onOpenHangar={() => setCurrentScreen('hangar')}
          onMainMenu={() => setCurrentScreen('menu')}
        />
      )}

      {/* 5. Ship Hangar Showroom */}
      {currentScreen === 'hangar' && (
        <HangarView
          profile={profile}
          onEquipShip={handleEquipShip}
          onPurchaseShip={handlePurchaseShip}
          onAddCredits={handleAddCredits}
          onBack={() => setCurrentScreen('menu')}
        />
      )}

      {/* Settings Modal Dialog */}
      {showSettingsModal && (
        <SettingsModal
          settings={profile.settings}
          onUpdateSettings={handleUpdateSettings}
          onResetProgress={handleResetProfile}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </div>
  );
}
