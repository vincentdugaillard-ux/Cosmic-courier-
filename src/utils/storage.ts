// Cosmic Courier - Local Storage & Profile Management
import { PlayerProfile, MissionResult, PlayerSettings, Mission } from '../types/game';
import { DEFAULT_PLAYER_PROFILE } from '../game/constants';

const STORAGE_KEY = 'cosmic_courier_profile_v1';
const CUSTOM_MISSIONS_KEY = 'cosmic_courier_custom_missions_v1';

export function loadPlayerProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      savePlayerProfile(DEFAULT_PLAYER_PROFILE);
      return DEFAULT_PLAYER_PROFILE;
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PLAYER_PROFILE,
      ...parsed,
      completedContractIds: parsed.completedContractIds || [],
      settings: {
        ...DEFAULT_PLAYER_PROFILE.settings,
        difficulty: parsed.settings?.difficulty || 'courier',
        fuelDepletion: parsed.settings?.fuelDepletion ?? true,
        controlMode:
          parsed.settings?.controlMode ||
          (typeof window !== 'undefined' &&
          ('ontouchstart' in window || (navigator && navigator.maxTouchPoints > 0))
            ? 'phone'
            : 'laptop'),
        ...(parsed.settings || {}),
      },
      statistics: {
        ...DEFAULT_PLAYER_PROFILE.statistics,
        ...(parsed.statistics || {}),
        totalGamesPlayed: parsed.statistics?.totalGamesPlayed ?? parsed.statistics?.missionsAttempted ?? 0,
      },
    };
  } catch (err) {
    console.error('Failed to load Cosmic Courier profile, resetting to default', err);
    return DEFAULT_PLAYER_PROFILE;
  }
}

export function savePlayerProfile(profile: PlayerProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to save profile', err);
  }
}

export function recordGameStart(currentProfile: PlayerProfile): PlayerProfile {
  const profile = { ...currentProfile };
  const currentTotal = profile.statistics.totalGamesPlayed ?? profile.statistics.missionsAttempted ?? 0;
  profile.statistics = {
    ...profile.statistics,
    totalGamesPlayed: currentTotal + 1,
    missionsAttempted: currentTotal + 1,
  };
  savePlayerProfile(profile);
  return profile;
}

export function recordMissionCompletion(
  currentProfile: PlayerProfile,
  result: MissionResult
): { updatedProfile: PlayerProfile; isNewBest: boolean } {
  const profile = { ...currentProfile };
  const prevBest = profile.bestScores[result.missionId] || 0;
  const isNewBest = result.scoreBreakdown.totalScore > prevBest;

  // Award credits & XP
  if (result.victory) {
    profile.totalCredits += result.creditsEarned;
    profile.totalXp += Math.floor(result.scoreBreakdown.totalScore / 5);

    // Update level based on XP
    profile.currentLevel = Math.floor(profile.totalXp / 1000) + 1;

    // Mark completed mission
    if (!profile.completedMissionIds.includes(result.missionId)) {
      profile.completedMissionIds = [...profile.completedMissionIds, result.missionId];
    }

    // Mark completed contract if applicable
    if (result.missionId.startsWith('contract_mission_')) {
      const contractId = result.missionId.replace('_mission', '');
      const currentContracts = profile.completedContractIds || [];
      if (!currentContracts.includes(contractId)) {
        profile.completedContractIds = [...currentContracts, contractId];
      }
    }

    // Save best score & best time
    if (isNewBest) {
      profile.bestScores[result.missionId] = result.scoreBreakdown.totalScore;
    }

    const prevBestTime = profile.bestTimes[result.missionId];
    if (prevBestTime === undefined || result.timeTaken < prevBestTime) {
      profile.bestTimes[result.missionId] = result.timeTaken;
    }

    // Update statistics
    profile.statistics.deliveriesCompleted += 1;
    if (result.packageCondition === 'pristine') {
      profile.statistics.flawlessDeliveries += 1;
    }
  } else {
    if (result.packageCondition === 'broken' || result.packageStability <= 0) {
      profile.statistics.packagesBroken += 1;
    }
  }

  // Ensure totalGamesPlayed is synchronized with missionsAttempted
  const gamesCount = Math.max(
    profile.statistics.totalGamesPlayed || 0,
    profile.statistics.missionsAttempted || 0
  );
  profile.statistics.totalGamesPlayed = gamesCount;
  profile.statistics.missionsAttempted = gamesCount;
  profile.statistics.bonusRingsCollected += result.ringsCollected;

  savePlayerProfile(profile);
  return { updatedProfile: profile, isNewBest };
}

export function purchaseShip(currentProfile: PlayerProfile, shipId: string, cost: number): PlayerProfile | null {
  if (currentProfile.totalCredits < cost) return null;
  if (currentProfile.unlockedShipIds.includes(shipId)) return currentProfile;

  const updated: PlayerProfile = {
    ...currentProfile,
    totalCredits: currentProfile.totalCredits - cost,
    unlockedShipIds: [...currentProfile.unlockedShipIds, shipId],
    selectedShipId: shipId,
  };

  savePlayerProfile(updated);
  return updated;
}

export function equipShip(currentProfile: PlayerProfile, shipId: string): PlayerProfile {
  if (!currentProfile.unlockedShipIds.includes(shipId)) return currentProfile;
  const updated: PlayerProfile = {
    ...currentProfile,
    selectedShipId: shipId,
  };
  savePlayerProfile(updated);
  return updated;
}

export function updateSettings(currentProfile: PlayerProfile, newSettings: Partial<PlayerSettings>): PlayerProfile {
  const updated: PlayerProfile = {
    ...currentProfile,
    settings: {
      ...currentProfile.settings,
      ...newSettings,
    },
  };
  savePlayerProfile(updated);
  return updated;
}

export function resetProfile(): PlayerProfile {
  localStorage.removeItem(STORAGE_KEY);
  savePlayerProfile(DEFAULT_PLAYER_PROFILE);
  return DEFAULT_PLAYER_PROFILE;
}

// Custom Missions (Map Builder) Storage
export function loadCustomMissions(): Mission[] {
  try {
    const raw = localStorage.getItem(CUSTOM_MISSIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load custom missions', err);
    return [];
  }
}

export function saveCustomMission(mission: Mission): Mission[] {
  try {
    const existing = loadCustomMissions();
    const index = existing.findIndex((m) => m.id === mission.id);
    let updated: Mission[];
    if (index >= 0) {
      updated = [...existing];
      updated[index] = mission;
    } else {
      updated = [mission, ...existing];
    }
    localStorage.setItem(CUSTOM_MISSIONS_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to save custom mission', err);
    return [];
  }
}

export function deleteCustomMission(missionId: string): Mission[] {
  try {
    const existing = loadCustomMissions();
    const updated = existing.filter((m) => m.id !== missionId);
    localStorage.setItem(CUSTOM_MISSIONS_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to delete custom mission', err);
    return [];
  }
}
