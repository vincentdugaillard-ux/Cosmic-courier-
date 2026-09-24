// Cosmic Courier - Types and Entity Interfaces

export type ScreenState = 'menu' | 'missionSelect' | 'contracts' | 'briefing' | 'game' | 'results' | 'hangar' | 'settings';

export type GameDifficulty = 'cadet' | 'courier' | 'veteran' | 'hardcore';

export interface ContractClient {
  name: string;
  faction: string;
  badgeColor: string;
  reputationBadge: string;
}

export interface Contract {
  id: string;
  contractCode: string;
  client: ContractClient;
  title: string;
  tagline: string;
  briefing: string;
  cargo: {
    name: string;
    type: string;
    fragility: 'STABLE' | 'DELICATE' | 'VOLATILE' | 'BIOHAZARD' | 'QUANTUM';
    hazardNote: string;
  };
  specialHazard: string;
  riskLevel: 'STANDARD' | 'ELEVATED' | 'CRITICAL' | 'EXTREME';
  rewardCredits: number;
  rewardXp: number;
  mission: Mission;
}

export type PackageCondition = 'pristine' | 'intact' | 'damaged' | 'broken';

export interface ShipStats {
  speed: number;              // Max cruise velocity (pixels/frame)
  acceleration: number;       // Thrust power
  turnRate: number;           // Angular turn speed (rad/frame)
  boostPower: number;         // Boost acceleration multiplier
  boostMaxDuration: number;   // Max boost tank in seconds
  collisionResistance: number; // Damage absorption percentage (0.0 to 0.8)
  fuelCapacity?: number;      // Maximum propellant fuel units (e.g. 100)
  fuelBurnRate?: number;      // Propellant consumption rate multiplier (e.g. 1.0)
  handlingName: string;       // Descriptive agility badge
}

export interface Ship {
  id: string;
  name: string;
  tagline: string;
  description: string;
  cost: number;
  unlockedByDefault?: boolean;
  color: string;             // Primary neon color (e.g. #00f0ff)
  accentColor: string;       // Secondary neon accent (e.g. #ff007f)
  engineColor: string;       // Thrust exhaust flame color
  stats: ShipStats;
}

export type ObstacleType = 'asteroid_static' | 'asteroid_moving' | 'gravity_well' | 'laser_barrier';

export interface AsteroidObstacle {
  id: string;
  type: 'asteroid_static' | 'asteroid_moving';
  x: number;
  y: number;
  radius: number;
  vx?: number;
  vy?: number;
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
  rotation: number;
  rotationSpeed: number;
  vertices: { x: number; y: number }[];
}

export interface GravityWellObstacle {
  id: string;
  type: 'gravity_well';
  x: number;
  y: number;
  radius: number;           // Event horizon lethal radius
  eventHorizonRadius?: number;
  pulseFrequency?: number;
  influenceRadius: number;  // Gravitational pull radius
  pullStrength: number;     // Force magnitude
  rotation?: number;
}

export interface LaserBarrierObstacle {
  id: string;
  type: 'laser_barrier';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  cycleDuration: number;    // In seconds
  activeRatio: number;      // Fraction of cycle where beam is active (0.0 - 1.0)
  cycleOffset: number;      // Phase offset in seconds
}

export interface BonusRing {
  id: string;
  x: number;
  y: number;
  radius: number;
  rotation: number;
  collected: boolean;
  scoreValue: number;
  stabilityBonus: number;
}

export interface LandingPad {
  x: number;
  y: number;
  width: number;
  height: number;
  targetAngle: number;       // Preferred landing orientation (radians, 0 = facing right, -PI/2 = facing up)
  safeSpeedMax: number;      // Maximum velocity to avoid hard landing crash
}

export interface Mission {
  id: string;
  codeName: string;
  title: string;
  sector: string;
  difficulty: 'rookie' | 'cadet' | 'expert' | 'hyper';
  description: string;
  cargoName: string;
  cargoDescription: string;
  timeLimit: number;          // In seconds
  rewardCredits: number;
  baseScore: number;
  unlockRequirement: {
    type: 'default' | 'previous_mission' | 'credits' | 'score';
    value?: string | number;
  };
  worldWidth: number;
  worldHeight: number;
  startPos: { x: number; y: number; angle: number };
  landingPad: LandingPad;
  asteroids: AsteroidObstacle[];
  gravityWells: GravityWellObstacle[];
  lasers: LaserBarrierObstacle[];
  bonusRings: BonusRing[];
  routeWaypoints: { x: number; y: number }[];
}

export interface ScoreBreakdown {
  basePoints: number;
  timeBonus: number;
  integrityBonus: number;
  fuelBonus?: number;       // Bonus points for conserved propellant
  styleBonus: number;       // Bonus rings + landing precision
  flawlessMultiplier: number;
  totalScore: number;
}

export interface MissionResult {
  missionId: string;
  missionTitle: string;
  cargoName: string;
  date: string;
  timeTaken: number;
  victory: boolean;
  failureReason?: string;
  packageCondition: PackageCondition;
  packageStability: number;
  fuelRemaining?: number;   // Percentage (0 to 100)
  fuelBonus?: number;
  fuelConsumptionEnabled?: boolean; // Whether fuel depletion was active for this mission
  scoreBreakdown: ScoreBreakdown;
  creditsEarned: number;
  ringsCollected: number;
  totalRings: number;
  landingPrecisionGrade: 'PERFECT' | 'SMOOTH' | 'ROUGH' | 'CRASHED';
  isNewBestScore?: boolean;
  difficulty?: GameDifficulty;
}

export interface PlayerSettings {
  difficulty: GameDifficulty; // 'cadet' | 'courier' | 'veteran' | 'hardcore'
  fuelDepletion?: boolean;    // Realistic propellant tank depletion during flights
  mouseControls?: boolean;    // Control ship aiming and flight with computer mouse
  masterVolume: number;     // 0.0 to 1.0
  sfxVolume: number;        // 0.0 to 1.0
  musicVolume: number;      // 0.0 to 1.0
  soundEnabled: boolean;
  musicEnabled: boolean;
  controlSensitivity: number; // 0.5 to 1.5 (default 1.0)
  assistMode: boolean;      // Magnetic route pull & soft auto-braking near asteroids
  showTouchControls: boolean;
  particlesEnabled: boolean;
  screenShake: boolean;
}

export interface PlayerProfile {
  callsign: string;
  totalCredits: number;
  totalXp: number;
  currentLevel: number;
  selectedShipId: string;
  unlockedShipIds: string[];
  completedMissionIds: string[];
  completedContractIds?: string[];
  bestScores: Record<string, number>;
  bestTimes: Record<string, number>;
  settings: PlayerSettings;
  statistics: {
    missionsAttempted: number;
    totalGamesPlayed: number;
    deliveriesCompleted: number;
    flawlessDeliveries: number;
    packagesBroken: number;
    bonusRingsCollected: number;
    totalDistanceTraveled: number;
  };
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  alpha: number;
  life: number;
  maxLife: number;
  shape?: 'circle' | 'debris' | 'shockwave' | 'smoke' | 'spark';
  rotation?: number;
  vRot?: number;
  width?: number;
  height?: number;
  borderColor?: string;
}

export interface CargoBreachEffect {
  active: boolean;
  x: number;
  y: number;
  timer: number;
  duration: number;
  shockwaves: Array<{
    radius: number;
    maxRadius: number;
    color: string;
    lineWidth: number;
    alpha: number;
  }>;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  scale: number;
  duration: number;
  elapsed: number;
}

export interface PlayerShipState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;            // Radians
  angularVelocity: number;
  thrusting: boolean;
  reversing: boolean;
  boosting: boolean;
  boostFuel: number;        // 0.0 to 1.0 (afterburner reserve)
  fuel: number;             // Current fuel units in tank (0 to maxFuel)
  maxFuel: number;          // Fuel tank total capacity
  packageStability: number; // 0.0 to 100.0
  invulnerableTimer: number; // Post-collision invulnerability
  shipId: string;
}
