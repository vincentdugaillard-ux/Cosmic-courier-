// Cosmic Courier - Physics & Gameplay Simulation Engine
import {
  Mission,
  Ship,
  PlayerShipState,
  Particle,
  FloatingText,
  MissionResult,
  PackageCondition,
  ScoreBreakdown,
  PlayerSettings,
  CargoBreachEffect,
} from '../types/game';
import { soundManager } from '../audio/soundManager';

export interface GameEngineInput {
  turnLeft: boolean;
  turnRight: boolean;
  thrust: boolean;
  reverse: boolean;
  boost: boolean;
  // Mouse flight controls
  mouseActive?: boolean;
  mouseWorldX?: number;
  mouseWorldY?: number;
  mouseAngle?: number;
  mouseThrust?: boolean;
  mouseReverse?: boolean;
  mouseBoost?: boolean;
}

export class GameEngine {
  public mission: Mission;
  public shipConfig: Ship;
  public settings: PlayerSettings;

  public ship: PlayerShipState;
  public timeRemaining: number;
  public timeElapsed: number = 0;
  public status: 'active' | 'paused' | 'victory' | 'failed' = 'active';
  public failureReason: string = '';
  public landingGrade: 'PERFECT' | 'SMOOTH' | 'ROUGH' | 'CRASHED' = 'SMOOTH';

  public ringsCollected: number = 0;
  public collisionCount: number = 0;
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];

  public camera = { x: 0, y: 0, zoom: 1.0 };
  public screenShake: number = 0;

  // Cargo Breach Catastrophic Failure VFX State
  public isPackageBreached: boolean = false;
  public cargoBreachEffect: CargoBreachEffect = {
    active: false,
    x: 0,
    y: 0,
    timer: 0,
    duration: 2.2,
    shockwaves: [],
  };

  // Active mouse state for HUD/Renderer
  public mouseInput: {
    active: boolean;
    worldX: number;
    worldY: number;
    angle: number;
    thrusting: boolean;
    reversing: boolean;
    boosting: boolean;
  } = {
    active: false,
    worldX: 0,
    worldY: 0,
    angle: 0,
    thrusting: false,
    reversing: false,
    boosting: false,
  };

  private warningSoundCooldown: number = 0;
  private lowFuelSoundCooldown: number = 0;
  private emptyThrusterSoundCooldown: number = 0;
  private laserWarningCooldown: number = 0;

  constructor(mission: Mission, ship: Ship, settings: PlayerSettings) {
    this.mission = JSON.parse(JSON.stringify(mission)); // Deep copy to keep mission state fresh
    this.shipConfig = ship;
    this.settings = settings;

    const difficulty = settings.difficulty || 'courier';
    let timeMultiplier = 1.0;
    if (difficulty === 'cadet') timeMultiplier = 1.25;
    else if (difficulty === 'veteran') timeMultiplier = 0.85;
    else if (difficulty === 'hardcore') timeMultiplier = 0.70;

    this.timeRemaining = Math.round(mission.timeLimit * timeMultiplier);

    const fuelCap = ship.stats.fuelCapacity || 100;

    this.ship = {
      x: mission.startPos.x,
      y: mission.startPos.y,
      vx: 0,
      vy: 0,
      angle: mission.startPos.angle,
      angularVelocity: 0,
      thrusting: false,
      reversing: false,
      boosting: false,
      boostFuel: 1.0,
      fuel: fuelCap,
      maxFuel: fuelCap,
      packageStability: 100.0,
      invulnerableTimer: 0,
      shipId: ship.id,
    };

    this.camera.x = this.ship.x;
    this.camera.y = this.ship.y;
  }

  public update(dt: number, input: GameEngineInput): void {
    if (this.status !== 'active') {
      soundManager.updateThrust(false);
      this.updateParticles(dt);
      this.updateFloatingTexts(dt);
      return;
    }

    this.timeElapsed += dt;
    this.timeRemaining = Math.max(0, this.timeRemaining - dt);

    // Cooldown timers
    if (this.emptyThrusterSoundCooldown > 0) {
      this.emptyThrusterSoundCooldown = Math.max(0, this.emptyThrusterSoundCooldown - dt);
    }
    if (this.lowFuelSoundCooldown > 0) {
      this.lowFuelSoundCooldown = Math.max(0, this.lowFuelSoundCooldown - dt);
    }
    if (this.laserWarningCooldown > 0) {
      this.laserWarningCooldown = Math.max(0, this.laserWarningCooldown - dt);
    }

    // Sync mouse input state for HUD/Renderer
    if (this.settings.mouseControls !== false && input.mouseActive && input.mouseWorldX !== undefined && input.mouseWorldY !== undefined) {
      this.mouseInput.active = true;
      this.mouseInput.worldX = input.mouseWorldX;
      this.mouseInput.worldY = input.mouseWorldY;
      this.mouseInput.angle = input.mouseAngle ?? this.ship.angle;
      this.mouseInput.thrusting = !!input.mouseThrust;
      this.mouseInput.reversing = !!input.mouseReverse;
      this.mouseInput.boosting = !!input.mouseBoost;
    } else {
      this.mouseInput.active = false;
      this.mouseInput.thrusting = false;
      this.mouseInput.reversing = false;
      this.mouseInput.boosting = false;
    }

    // Check time limit
    if (this.timeRemaining <= 0) {
      this.triggerFailure('Delivery window expired! Mission contract voided.');
      return;
    }

    // Check if adrift in deep space with zero propellant and no forward momentum
    const isFuelDepletionEnabled = this.settings.fuelDepletion !== false;
    if (isFuelDepletionEnabled && this.ship.fuel <= 0) {
      const speed = Math.hypot(this.ship.vx, this.ship.vy);
      const distToPad = Math.hypot(
        this.ship.x - this.mission.landingPad.x,
        this.ship.y - this.mission.landingPad.y
      );
      const padThreshold = Math.max(this.mission.landingPad.width, this.mission.landingPad.height);
      if (speed < 0.12 && distToPad > padThreshold) {
        this.triggerFailure('Propellant exhausted! Ship stranded adrift in deep space.');
        return;
      }
    }

    // Decay screen shake
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 15);
    }

    // Invulnerability timer decay
    if (this.ship.invulnerableTimer > 0) {
      this.ship.invulnerableTimer = Math.max(0, this.ship.invulnerableTimer - dt);
    }

    // Warning sound if package is damaged (< 30%)
    if (this.ship.packageStability < 30) {
      this.warningSoundCooldown -= dt;
      if (this.warningSoundCooldown <= 0) {
        soundManager.playWarning();
        this.warningSoundCooldown = 1.2;
      }
    }

    // Handle Input & Movement
    this.handleSteering(dt, input);
    this.handleThrust(dt, input);
    this.applyPhysics(dt);

    // Assist Mode calculations
    if (this.settings.assistMode) {
      this.applyAssistMode(dt);
    }

    // Update moving obstacles
    this.updateMovingObstacles(dt);

    // Hazard checks
    this.checkGravityWells(dt);
    this.checkLasers(dt);
    this.checkAsteroidCollisions();
    this.checkBonusRings();
    this.checkLandingPad();

    // Boundary constraints
    this.constrainShipToBounds();

    // Update Cargo Breach Visual Effects
    if (this.cargoBreachEffect.active) {
      this.cargoBreachEffect.timer += dt;
      if (this.cargoBreachEffect.timer >= this.cargoBreachEffect.duration) {
        this.cargoBreachEffect.active = false;
      } else {
        const progress = this.cargoBreachEffect.timer / this.cargoBreachEffect.duration;
        for (const sw of this.cargoBreachEffect.shockwaves) {
          sw.radius += (sw.maxRadius - sw.radius) * Math.min(1, dt * 5.0);
          sw.alpha = Math.max(0, (1 - progress) * 0.95);
        }
      }
    }

    // Update Visuals & FX
    this.updateParticles(dt);
    this.updateFloatingTexts(dt);
    this.updateCamera(dt);
  }

  private handleSteering(dt: number, input: GameEngineInput): void {
    const turnSensitivity = this.settings.controlSensitivity || 1.0;
    const baseTurn = this.shipConfig.stats.turnRate * turnSensitivity * 60 * dt;

    if (input.turnLeft && !input.turnRight) {
      this.ship.angle -= baseTurn;
    } else if (input.turnRight && !input.turnLeft) {
      this.ship.angle += baseTurn;
    } else if (this.settings.mouseControls !== false && input.mouseActive && input.mouseAngle !== undefined) {
      // Smoothly steer ship nose toward mouse targeting reticle
      let angleDiff = input.mouseAngle - this.ship.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      // Mouse steering rate: responsive yet grounded in chassis turn rate
      const maxTurn = baseTurn * 1.4;
      if (Math.abs(angleDiff) <= maxTurn) {
        this.ship.angle = input.mouseAngle;
      } else {
        this.ship.angle += Math.sign(angleDiff) * maxTurn;
      }
    }

    // Normalize angle to [-PI, PI]
    while (this.ship.angle > Math.PI) this.ship.angle -= Math.PI * 2;
    while (this.ship.angle < -Math.PI) this.ship.angle += Math.PI * 2;
  }

  public setFuelDepletion(enabled: boolean): void {
    this.settings.fuelDepletion = enabled;
    if (!enabled) {
      this.ship.fuel = this.ship.maxFuel;
    }
  }

  private handleThrust(dt: number, input: GameEngineInput): void {
    const isFuelDepletionEnabled = this.settings.fuelDepletion !== false;
    if (!isFuelDepletionEnabled) {
      this.ship.fuel = this.ship.maxFuel;
    }
    const isOutOfFuel = isFuelDepletionEnabled && this.ship.fuel <= 0;

    const mouseEnabled = this.settings.mouseControls !== false;
    const wantsThrust = input.thrust || (mouseEnabled && !!input.mouseThrust);
    const wantsReverse = input.reverse || (mouseEnabled && !!input.mouseReverse);
    const wantsBoost = (input.boost || (mouseEnabled && !!input.mouseBoost)) && this.ship.boostFuel > 0.05;

    if (isOutOfFuel) {
      this.ship.thrusting = false;
      this.ship.boosting = false;
      this.ship.reversing = false;
      soundManager.updateThrust(false);

      if (wantsThrust || wantsBoost || wantsReverse) {
        if (this.emptyThrusterSoundCooldown <= 0) {
          soundManager.playFuelEmpty();
          this.emptyThrusterSoundCooldown = 0.35;
          this.spawnFlameoutParticles();
          this.spawnFloatingText('NO PROPELLANT!', this.ship.x, this.ship.y - 20, '#ef4444');
        }
      }
      return;
    }

    const isBoosting = wantsBoost;
    this.ship.thrusting = wantsThrust;
    this.ship.reversing = wantsReverse;
    this.ship.boosting = isBoosting;

    soundManager.updateThrust(wantsThrust || isBoosting, isBoosting);

    // Propellant Fuel Burn Logic
    if (isFuelDepletionEnabled) {
      const difficulty = this.settings.difficulty || 'courier';
      let diffBurnMultiplier = 1.0;
      if (difficulty === 'cadet') diffBurnMultiplier = 0.65;
      else if (difficulty === 'veteran') diffBurnMultiplier = 1.30;
      else if (difficulty === 'hardcore') diffBurnMultiplier = 1.65;

      const baseBurnRate = (this.shipConfig.stats.fuelBurnRate || 1.0) * diffBurnMultiplier;

      let fuelConsumed = 0;
      if (isBoosting) {
        // Boost burns fuel rapidly (~6.5% per sec)
        fuelConsumed += 6.5 * baseBurnRate * dt;
      } else if (wantsThrust) {
        // Main thruster burns ~2.2% per sec
        fuelConsumed += 2.2 * baseBurnRate * dt;
      }

      if (wantsReverse) {
        // Retro thrusters burn ~1.3% per sec
        fuelConsumed += 1.3 * baseBurnRate * dt;
      }

      if (fuelConsumed > 0) {
        const prevFuel = this.ship.fuel;
        this.ship.fuel = Math.max(0, this.ship.fuel - fuelConsumed);

        if (prevFuel > 0 && this.ship.fuel <= 0) {
          soundManager.updateThrust(false);
          soundManager.playFuelEmpty();
          this.spawnFlameoutParticles();
          this.spawnFloatingText('FLAMEOUT! TANK EMPTY!', this.ship.x, this.ship.y - 25, '#ef4444');
        } else if (this.ship.fuel > 0 && this.ship.fuel <= this.ship.maxFuel * 0.2) {
          if (this.lowFuelSoundCooldown <= 0) {
            soundManager.playLowFuelAlarm();
            this.lowFuelSoundCooldown = 2.0;
            this.spawnFloatingText('LOW PROPELLANT!', this.ship.x, this.ship.y - 20, '#f59e0b');
          }
        }
      }
    }

    if (isBoosting) {
      // Consume boost fuel capacitor
      const drainRate = 1.0 / (this.shipConfig.stats.boostMaxDuration || 3.5);
      this.ship.boostFuel = Math.max(0, this.ship.boostFuel - drainRate * dt);

      // Boost acceleration
      const boostAccel = this.shipConfig.stats.acceleration * this.shipConfig.stats.boostPower * 60 * dt;
      this.ship.vx += Math.cos(this.ship.angle) * boostAccel;
      this.ship.vy += Math.sin(this.ship.angle) * boostAccel;

      this.spawnEngineParticles(true);
    } else {
      // Recharge boost fuel slowly
      if (this.ship.boostFuel < 1.0) {
        this.ship.boostFuel = Math.min(1.0, this.ship.boostFuel + dt * 0.22);
      }

      if (wantsThrust) {
        const accel = this.shipConfig.stats.acceleration * 60 * dt;
        this.ship.vx += Math.cos(this.ship.angle) * accel;
        this.ship.vy += Math.sin(this.ship.angle) * accel;
        this.spawnEngineParticles(false);
      }
    }

    if (wantsReverse) {
      // Retro-thrusters / Airbrake
      const brakeFactor = Math.pow(0.88, dt * 60);
      this.ship.vx *= brakeFactor;
      this.ship.vy *= brakeFactor;
      this.spawnReverseParticles();
    }
  }

  private applyPhysics(dt: number): void {
    // Space vacuum low drag
    const drag = Math.pow(0.992, dt * 60);
    this.ship.vx *= drag;
    this.ship.vy *= drag;

    // Cap velocity
    const maxSpeed = this.ship.boosting
      ? this.shipConfig.stats.speed * this.shipConfig.stats.boostPower
      : this.shipConfig.stats.speed;

    const currentSpeed = Math.hypot(this.ship.vx, this.ship.vy);
    if (currentSpeed > maxSpeed) {
      const scale = maxSpeed / currentSpeed;
      this.ship.vx *= scale;
      this.ship.vy *= scale;
    }

    this.ship.x += this.ship.vx * 60 * dt;
    this.ship.y += this.ship.vy * 60 * dt;
  }

  private applyAssistMode(dt: number): void {
    // 1. Route centering: find nearest waypoint corridor segment and apply a subtle pull towards safe line
    if (this.mission.routeWaypoints.length >= 2) {
      let closestDist = Infinity;
      let targetX = this.ship.x;
      let targetY = this.ship.y;

      for (let i = 0; i < this.mission.routeWaypoints.length - 1; i++) {
        const p1 = this.mission.routeWaypoints[i];
        const p2 = this.mission.routeWaypoints[i + 1];

        // Projected point on segment
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) continue;

        const t = Math.max(0, Math.min(1, ((this.ship.x - p1.x) * dx + (this.ship.y - p1.y) * dy) / lenSq));
        const projX = p1.x + t * dx;
        const projY = p1.y + t * dy;
        const dist = Math.hypot(this.ship.x - projX, this.ship.y - projY);

        if (dist < closestDist) {
          closestDist = dist;
          targetX = projX;
          targetY = projY;
        }
      }

      // If off-corridor, apply subtle centering force
      if (closestDist > 80 && closestDist < 350) {
        const pullAngle = Math.atan2(targetY - this.ship.y, targetX - this.ship.x);
        this.ship.vx += Math.cos(pullAngle) * 0.04 * 60 * dt;
        this.ship.vy += Math.sin(pullAngle) * 0.04 * 60 * dt;
      }
    }

    // 2. Proximity warning auto-brake if on direct collision course with static asteroid
    for (const ast of this.mission.asteroids) {
      const dist = Math.hypot(this.ship.x - ast.x, this.ship.y - ast.y);
      if (dist < ast.radius + 100) {
        // Dot product with velocity vector
        const toAstX = (ast.x - this.ship.x) / dist;
        const toAstY = (ast.y - this.ship.y) / dist;
        const speed = Math.hypot(this.ship.vx, this.ship.vy);
        if (speed > 1.5) {
          const vDirX = this.ship.vx / speed;
          const vDirY = this.ship.vy / speed;
          const headingTowards = toAstX * vDirX + toAstY * vDirY;
          if (headingTowards > 0.6) {
            // Apply soft deceleration
            this.ship.vx *= 0.96;
            this.ship.vy *= 0.96;
          }
        }
      }
    }
  }

  private updateMovingObstacles(dt: number): void {
    for (const ast of this.mission.asteroids) {
      ast.rotation += ast.rotationSpeed * 60 * dt;

      if (ast.type === 'asteroid_moving' && ast.vy !== undefined) {
        ast.y += ast.vy * 60 * dt;
        if (ast.minY !== undefined && ast.y < ast.minY) {
          ast.y = ast.minY;
          ast.vy = Math.abs(ast.vy);
        } else if (ast.maxY !== undefined && ast.y > ast.maxY) {
          ast.y = ast.maxY;
          ast.vy = -Math.abs(ast.vy);
        }
      }
    }
  }

  private checkGravityWells(dt: number): void {
    for (const gw of this.mission.gravityWells) {
      gw.rotation += 0.03 * 60 * dt;
      const dx = gw.x - this.ship.x;
      const dy = gw.y - this.ship.y;
      const dist = Math.hypot(dx, dy);

      // Crushed inside event horizon
      if (dist < gw.radius + 14) {
        this.spawnExplosionParticles(this.ship.x, this.ship.y, '#9333ea', 40);
        soundManager.playCrash();
        this.triggerFailure('Vessel pulled into singularity event horizon!');
        return;
      }

      // Gravitational pull in influence zone
      if (dist < gw.influenceRadius) {
        const strength = gw.pullStrength * (1.0 - dist / gw.influenceRadius);
        const pullX = (dx / dist) * strength * 60 * dt;
        const pullY = (dy / dist) * strength * 60 * dt;
        this.ship.vx += pullX;
        this.ship.vy += pullY;

        if (Math.random() < 0.2) {
          soundManager.playGravityHum();
        }
      }
    }
  }

  private checkLasers(dt: number): void {
    for (const laser of this.mission.lasers) {
      const cycleTime = (this.timeElapsed + laser.cycleOffset) % laser.cycleDuration;
      const activeDuration = laser.cycleDuration * laser.activeRatio;
      const isActive = cycleTime < activeDuration;

      if (!isActive) {
        // Pre-activation alert check (warning window before laser fires)
        const timeUntilActive = laser.cycleDuration - cycleTime;
        const warningWindow = 1.3; // 1.3s before laser ray ignites

        if (timeUntilActive <= warningWindow) {
          const midX = (laser.x1 + laser.x2) / 2;
          const midY = (laser.y1 + laser.y2) / 2;
          const dist = Math.hypot(this.ship.x - midX, this.ship.y - midY);

          // Audio warning chirps when player is within auditory range of the charging laser
          if (dist < 850 && this.laserWarningCooldown <= 0) {
            soundManager.playLaserWarning();
            this.laserWarningCooldown = 0.35;
          }

          // Visual spark crackles at emitter nodes
          if (this.settings.particlesEnabled && Math.random() < 0.4) {
            this.spawnSparkParticles(laser.x1, laser.y1, '#facc15', 2);
            this.spawnSparkParticles(laser.x2, laser.y2, '#facc15', 2);
          }

          // Proximity danger alert if close to the upcoming beam line
          const lineDx = laser.x2 - laser.x1;
          const lineDy = laser.y2 - laser.y1;
          const lineLenSq = lineDx * lineDx + lineDy * lineDy;
          if (lineLenSq > 0) {
            const t = Math.max(0, Math.min(1, ((this.ship.x - laser.x1) * lineDx + (this.ship.y - laser.y1) * lineDy) / lineLenSq));
            const nearX = laser.x1 + t * lineDx;
            const nearY = laser.y1 + t * lineDy;
            const distToBeam = Math.hypot(this.ship.x - nearX, this.ship.y - nearY);

            if (distToBeam < 160 && !(laser as any)._preAlerted) {
              (laser as any)._preAlerted = true;
              this.spawnFloatingText('⚠️ BEAM CHARGING!', nearX, nearY - 20, '#facc15');
            }
          }
        } else {
          delete (laser as any)._preAlerted;
        }
        continue;
      }

      delete (laser as any)._preAlerted;

      // Distance from point to line segment
      const x1 = laser.x1;
      const y1 = laser.y1;
      const x2 = laser.x2;
      const y2 = laser.y2;

      const lineDx = x2 - x1;
      const lineDy = y2 - y1;
      const lineLenSq = lineDx * lineDx + lineDy * lineDy;
      if (lineLenSq === 0) continue;

      const t = Math.max(0, Math.min(1, ((this.ship.x - x1) * lineDx + (this.ship.y - y1) * lineDy) / lineLenSq));
      const nearX = x1 + t * lineDx;
      const nearY = y1 + t * lineDy;
      const dist = Math.hypot(this.ship.x - nearX, this.ship.y - nearY);

      if (dist < 22) {
        // Laser collision
        if (this.ship.invulnerableTimer <= 0) {
          const difficulty = this.settings.difficulty || 'courier';
          let diffMultiplier = 1.0;
          if (difficulty === 'cadet') diffMultiplier = 0.6;
          else if (difficulty === 'veteran') diffMultiplier = 1.4;
          else if (difficulty === 'hardcore') diffMultiplier = 2.0;

          const rawDamage = Math.floor(25 * (1 - this.shipConfig.stats.collisionResistance * 0.5));
          const damage = Math.max(2, Math.floor(rawDamage * diffMultiplier));
          this.applyPackageDamage(damage, 'LASER ZAP!');
          soundManager.playLaserZap();
          this.spawnSparkParticles(nearX, nearY, '#f43f5e', 25);
          this.screenShake = 12;
          this.ship.invulnerableTimer = 0.6;

          // Repel away from beam
          const repelAngle = Math.atan2(this.ship.y - nearY, this.ship.x - nearX);
          this.ship.vx += Math.cos(repelAngle) * 4.5;
          this.ship.vy += Math.sin(repelAngle) * 4.5;
        }
      }
    }
  }

  private checkAsteroidCollisions(): void {
    const shipRadius = 18;

    for (const ast of this.mission.asteroids) {
      const dx = this.ship.x - ast.x;
      const dy = this.ship.y - ast.y;
      const dist = Math.hypot(dx, dy);
      const minDist = ast.radius + shipRadius;

      if (dist < minDist) {
        // Collision response
        const overlap = minDist - dist;
        const normalX = dx / (dist || 1);
        const normalY = dy / (dist || 1);

        // Displace ship outside asteroid
        this.ship.x += normalX * overlap;
        this.ship.y += normalY * overlap;

        // Dot product of velocity with normal
        const normalVel = this.ship.vx * normalX + this.ship.vy * normalY;

        if (normalVel < 0) {
          const impactSpeed = Math.abs(normalVel);

          // Restitution bounce
          const restitution = 0.55;
          this.ship.vx -= (1 + restitution) * normalVel * normalX;
          this.ship.vy -= (1 + restitution) * normalVel * normalY;

          if (this.ship.invulnerableTimer <= 0 && impactSpeed > 0.8) {
            this.collisionCount++;
            const difficulty = this.settings.difficulty || 'courier';
            let diffMultiplier = 1.0;
            if (difficulty === 'cadet') diffMultiplier = 0.6;
            else if (difficulty === 'veteran') diffMultiplier = 1.4;
            else if (difficulty === 'hardcore') diffMultiplier = 2.0;

            const rawDamage = impactSpeed * 10;
            const mitigatedDamage = Math.max(3, Math.floor(rawDamage * (1 - this.shipConfig.stats.collisionResistance) * diffMultiplier));

            this.applyPackageDamage(mitigatedDamage, `IMPACT -${mitigatedDamage}%`);
            soundManager.playCollision(impactSpeed);
            this.spawnSparkParticles(this.ship.x - normalX * shipRadius, this.ship.y - normalY * shipRadius, '#fbbf24', 18);
            this.screenShake = Math.min(18, impactSpeed * 4);
            this.ship.invulnerableTimer = 0.35;
          }
        }
      }
    }
  }

  private checkBonusRings(): void {
    for (const ring of this.mission.bonusRings) {
      if (ring.collected) continue;

      const dist = Math.hypot(this.ship.x - ring.x, this.ship.y - ring.y);
      if (dist < ring.radius + 12) {
        ring.collected = true;
        this.ringsCollected++;
        this.ship.packageStability = Math.min(100, this.ship.packageStability + ring.stabilityBonus);

        // Propellant refill (+25% capacity)
        const refill = this.ship.maxFuel * 0.25;
        this.ship.fuel = Math.min(this.ship.maxFuel, this.ship.fuel + refill);

        // Slight speed surge
        const curSpeed = Math.hypot(this.ship.vx, this.ship.vy);
        if (curSpeed > 0.5) {
          this.ship.vx *= 1.15;
          this.ship.vy *= 1.15;
        }

        soundManager.playRingCollect();
        soundManager.playRefuel();
        this.spawnFloatingText(`+${ring.scoreValue} HYPER-RING!`, ring.x, ring.y - 20, '#00f0ff');
        this.spawnFloatingText('+25% FUEL REFILL!', ring.x, ring.y - 36, '#39ff14');
        this.spawnSparkParticles(ring.x, ring.y, '#00f0ff', 30);
      }
    }
  }

  private checkLandingPad(): void {
    const pad = this.mission.landingPad;
    const halfW = pad.width / 2;
    const halfH = pad.height / 2;

    const inPadX = this.ship.x >= pad.x - halfW && this.ship.x <= pad.x + halfW;
    const inPadY = this.ship.y >= pad.y - halfH && this.ship.y <= pad.y + halfH;

    if (inPadX && inPadY) {
      const speed = Math.hypot(this.ship.vx, this.ship.vy);

      // Decelerate naturally inside docking tractor beam
      this.ship.vx *= 0.94;
      this.ship.vy *= 0.94;

      // When stopped enough (speed < 0.4), evaluate touchdown
      if (speed < 0.45) {
        const difficulty = this.settings.difficulty || 'courier';
        let safeSpeed = pad.safeSpeedMax;
        if (difficulty === 'cadet') safeSpeed *= 1.25;
        else if (difficulty === 'hardcore') safeSpeed *= 0.85;

        if (speed > safeSpeed) {
          // Hard impact crash on pad
          this.landingGrade = 'CRASHED';
          soundManager.playCrash();
          this.triggerFailure('High-velocity crash onto landing pad! Speed exceeded safe limits.');
          return;
        }

        // Successful Landing!
        const distFromCenter = Math.hypot(this.ship.x - pad.x, this.ship.y - pad.y);
        if (distFromCenter < 25 && speed < 0.25) {
          this.landingGrade = 'PERFECT';
        } else if (distFromCenter < 50 && speed < 0.38) {
          this.landingGrade = 'SMOOTH';
        } else {
          this.landingGrade = 'ROUGH';
        }

        this.triggerVictory();
      }
    }
  }

  private constrainShipToBounds(): void {
    const margin = 30;
    if (this.ship.x < margin) {
      this.ship.x = margin;
      this.ship.vx = Math.abs(this.ship.vx) * 0.5;
    } else if (this.ship.x > this.mission.worldWidth - margin) {
      this.ship.x = this.mission.worldWidth - margin;
      this.ship.vx = -Math.abs(this.ship.vx) * 0.5;
    }

    if (this.ship.y < margin) {
      this.ship.y = margin;
      this.ship.vy = Math.abs(this.ship.vy) * 0.5;
    } else if (this.ship.y > this.mission.worldHeight - margin) {
      this.ship.y = this.mission.worldHeight - margin;
      this.ship.vy = -Math.abs(this.ship.vy) * 0.5;
    }
  }

  private applyPackageDamage(amount: number, label: string): void {
    this.ship.packageStability = Math.max(0, this.ship.packageStability - amount);
    this.spawnFloatingText(label, this.ship.x, this.ship.y - 25, '#f43f5e');

    if (this.ship.packageStability <= 0) {
      this.triggerPackageBreach();
    }
  }

  public triggerPackageBreach(): void {
    if (this.isPackageBreached) return;
    this.isPackageBreached = true;
    this.ship.packageStability = 0;

    const px = this.ship.x;
    const py = this.ship.y;

    // Explosive decompression recoil impulse on ship chassis
    const blastAngle = Math.random() * Math.PI * 2;
    this.ship.vx += Math.cos(blastAngle) * 4.5;
    this.ship.vy += Math.sin(blastAngle) * 4.5;
    this.ship.angularVelocity += (Math.random() > 0.5 ? 1 : -1) * 0.18;

    this.screenShake = 32;

    // Trigger catastrophic sound
    soundManager.playPackageBreach();

    // Trigger animated shockwave expansion container
    this.cargoBreachEffect = {
      active: true,
      x: px,
      y: py,
      timer: 0,
      duration: 2.2,
      shockwaves: [
        { radius: 6, maxRadius: 110, color: '#ffffff', lineWidth: 4.5, alpha: 1.0 },
        { radius: 14, maxRadius: 180, color: '#facc15', lineWidth: 3.2, alpha: 0.95 },
        { radius: 22, maxRadius: 270, color: '#ef4444', lineWidth: 2.8, alpha: 0.85 },
        { radius: 30, maxRadius: 380, color: '#f43f5e', lineWidth: 2.0, alpha: 0.75 },
      ],
    };

    // Spawn massive cargo debris shards, containment glass, and smoke
    this.spawnCargoBreachParticles(px, py);

    // High-visibility alert banners in-world
    this.spawnFloatingText('💥 CARGO CONTAINMENT RUPTURED!', px, py - 35, '#ef4444');
    this.spawnFloatingText('0% INTEGRITY — PAYLOAD DESTROYED', px, py - 52, '#fca5a5');

    this.triggerFailure('Fragile cargo breached! Stability depleted to 0%.');
  }

  private triggerVictory(): void {
    this.status = 'victory';
    soundManager.updateThrust(false);
    soundManager.playLandingSuccess(this.landingGrade);
    this.spawnSparkParticles(this.ship.x, this.ship.y, '#39ff14', 50);
  }

  private triggerFailure(reason: string): void {
    this.status = 'failed';
    this.failureReason = reason;
    soundManager.updateThrust(false);
    this.screenShake = 20;
  }

  // --- Score Calculation ---
  public getMissionResult(): MissionResult {
    const victory = this.status === 'victory';
    let packageCondition: PackageCondition = 'broken';
    if (this.ship.packageStability >= 95) packageCondition = 'pristine';
    else if (this.ship.packageStability >= 60) packageCondition = 'intact';
    else if (this.ship.packageStability > 0) packageCondition = 'damaged';

    let basePoints = victory ? this.mission.baseScore : 0;
    let timeBonus = victory ? Math.max(0, Math.floor(this.timeRemaining * 45)) : 0;
    let integrityBonus = victory ? Math.floor(this.ship.packageStability * 25) : 0;

    const isFuelDepletionEnabled = this.settings.fuelDepletion !== false;
    const fuelRemainingPercent = isFuelDepletionEnabled
      ? Math.max(0, Math.min(100, Math.round((this.ship.fuel / this.ship.maxFuel) * 100)))
      : 100;
    let fuelBonus = 0;
    if (victory && isFuelDepletionEnabled && fuelRemainingPercent > 0) {
      // Award up to 250 bonus points for fuel conservation
      fuelBonus = Math.floor((this.ship.fuel / this.ship.maxFuel) * 250);
    }

    let landingScore = 0;
    if (victory) {
      if (this.landingGrade === 'PERFECT') landingScore = 600;
      else if (this.landingGrade === 'SMOOTH') landingScore = 300;
      else if (this.landingGrade === 'ROUGH') landingScore = 100;
    }

    let ringPoints = this.ringsCollected * 300;
    let styleBonus = landingScore + ringPoints;

    const isFlawless = victory && this.collisionCount === 0 && this.ship.packageStability >= 98;
    const flawlessMultiplier = isFlawless ? 1.25 : 1.0;

    const difficulty = this.settings.difficulty || 'courier';
    let rewardMultiplier = 1.0;
    if (difficulty === 'cadet') rewardMultiplier = 0.85;
    else if (difficulty === 'veteran') rewardMultiplier = 1.35;
    else if (difficulty === 'hardcore') rewardMultiplier = 1.75;

    const totalRaw = basePoints + timeBonus + integrityBonus + fuelBonus + styleBonus;
    const totalScore = Math.floor(totalRaw * flawlessMultiplier * rewardMultiplier);

    // Credits reward
    let creditsEarned = 0;
    if (victory) {
      creditsEarned = this.mission.rewardCredits;
      if (packageCondition === 'pristine') creditsEarned += Math.floor(this.mission.rewardCredits * 0.3);
      if (this.landingGrade === 'PERFECT') creditsEarned += 50;
      if (isFuelDepletionEnabled && fuelRemainingPercent >= 40) creditsEarned += 30; // Eco-courier fuel efficiency credit reward
      creditsEarned = Math.round(creditsEarned * rewardMultiplier);
    }

    const breakdown: ScoreBreakdown = {
      basePoints,
      timeBonus,
      integrityBonus,
      fuelBonus,
      styleBonus,
      flawlessMultiplier,
      totalScore,
    };

    return {
      missionId: this.mission.id,
      missionTitle: this.mission.title,
      cargoName: this.mission.cargoName,
      date: new Date().toLocaleDateString(),
      timeTaken: Math.round(this.timeElapsed * 10) / 10,
      victory,
      failureReason: this.failureReason,
      packageCondition,
      packageStability: Math.round(this.ship.packageStability),
      fuelRemaining: fuelRemainingPercent,
      fuelBonus,
      fuelConsumptionEnabled: isFuelDepletionEnabled,
      scoreBreakdown: breakdown,
      creditsEarned,
      ringsCollected: this.ringsCollected,
      totalRings: this.mission.bonusRings.length,
      landingPrecisionGrade: this.landingGrade,
      difficulty,
    };
  }

  // --- Particles & VFX ---
  private spawnFlameoutParticles(): void {
    if (!this.settings.particlesEnabled) return;
    const backAngle = this.ship.angle + Math.PI;
    for (let i = 0; i < 4; i++) {
      const spread = (Math.random() - 0.5) * 0.9;
      const speed = 1.2 + Math.random() * 2.0;
      const pAngle = backAngle + spread;
      this.particles.push({
        x: this.ship.x - Math.cos(this.ship.angle) * 14,
        y: this.ship.y - Math.sin(this.ship.angle) * 14,
        vx: Math.cos(pAngle) * speed + this.ship.vx * 0.2,
        vy: Math.sin(pAngle) * speed + this.ship.vy * 0.2,
        color: Math.random() > 0.35 ? '#64748b' : '#ef4444',
        radius: 2.5 + Math.random() * 2.5,
        alpha: 0.8,
        life: 0,
        maxLife: 0.45 + Math.random() * 0.25,
      });
    }
  }
  private spawnEngineParticles(isBoost: boolean): void {
    if (!this.settings.particlesEnabled) return;

    const count = isBoost ? 4 : 2;
    const backAngle = this.ship.angle + Math.PI;

    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * 0.5;
      const speed = (isBoost ? 5 : 3) + Math.random() * 2;
      const pAngle = backAngle + spread;

      this.particles.push({
        x: this.ship.x - Math.cos(this.ship.angle) * 14,
        y: this.ship.y - Math.sin(this.ship.angle) * 14,
        vx: Math.cos(pAngle) * speed + this.ship.vx * 0.3,
        vy: Math.sin(pAngle) * speed + this.ship.vy * 0.3,
        color: isBoost ? '#ff0055' : this.shipConfig.engineColor,
        radius: isBoost ? 3 + Math.random() * 2.5 : 2 + Math.random() * 1.5,
        alpha: 0.9,
        life: 0,
        maxLife: isBoost ? 0.35 : 0.22,
      });
    }
  }

  private spawnReverseParticles(): void {
    if (!this.settings.particlesEnabled) return;
    for (let i = 0; i < 2; i++) {
      const angle = this.ship.angle + (Math.random() - 0.5) * 0.8;
      this.particles.push({
        x: this.ship.x + Math.cos(this.ship.angle) * 12,
        y: this.ship.y + Math.sin(this.ship.angle) * 12,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3,
        color: '#38bdf8',
        radius: 2,
        alpha: 0.8,
        life: 0,
        maxLife: 0.2,
      });
    }
  }

  private spawnSparkParticles(x: number, y: number, color: string, count: number): void {
    if (!this.settings.particlesEnabled) return;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        radius: 1.5 + Math.random() * 2,
        alpha: 1.0,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.3,
      });
    }
  }

  private spawnCargoBreachParticles(x: number, y: number): void {
    if (!this.settings.particlesEnabled) return;

    // 1. Shattered cargo crate & containment hull debris shards
    const debrisCount = 30;
    for (let i = 0; i < debrisCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.0 + Math.random() * 7.0;
      const colors = ['#f59e0b', '#ef4444', '#64748b', '#334155', '#38bdf8', '#fbbf24'];
      const borderColors = ['#ffffff', '#fca5a5', '#fef08a', '#7dd3fc'];

      this.particles.push({
        x: x + (Math.random() - 0.5) * 12,
        y: y + (Math.random() - 0.5) * 12,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        borderColor: borderColors[Math.floor(Math.random() * borderColors.length)],
        radius: 3.5 + Math.random() * 4.5,
        width: 6 + Math.random() * 10,
        height: 4 + Math.random() * 7,
        shape: 'debris',
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.4,
        alpha: 1.0,
        life: 0,
        maxLife: 1.5 + Math.random() * 0.9,
      });
    }

    // 2. Billowing smoke clouds from ruptured containment pod
    const smokeCount = 20;
    for (let i = 0; i < smokeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.6 + Math.random() * 2.5;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Math.random() > 0.4 ? '#475569' : '#1e293b',
        radius: 5 + Math.random() * 5,
        shape: 'smoke',
        alpha: 0.8,
        life: 0,
        maxLife: 1.3 + Math.random() * 0.7,
      });
    }

    // 3. Electrical short-circuit sparks & energetic plasma bursts
    const sparkCount = 40;
    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3.2 + Math.random() * 7.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Math.random() > 0.35 ? '#facc15' : '#ef4444',
        radius: 1.5 + Math.random() * 2.5,
        shape: 'spark',
        alpha: 1.0,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.6,
      });
    }
  }

  private spawnExplosionParticles(x: number, y: number, color: string, count: number): void {
    if (!this.settings.particlesEnabled) return;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Math.random() > 0.4 ? color : '#f59e0b',
        radius: 2.5 + Math.random() * 3.5,
        alpha: 1.0,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.4,
      });
    }
  }

  private spawnFloatingText(text: string, x: number, y: number, color: string): void {
    this.floatingTexts.push({
      id: Math.random().toString(),
      text,
      x,
      y,
      color,
      alpha: 1.0,
      scale: 1.1,
      duration: 1.2,
      elapsed: 0,
    });
  }

  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      // Specialized physics per particle shape
      if (p.shape === 'debris') {
        p.vx *= Math.pow(0.97, dt * 60);
        p.vy *= Math.pow(0.97, dt * 60);
        if (p.vRot) {
          p.rotation = (p.rotation || 0) + p.vRot * 60 * dt;
        }
      } else if (p.shape === 'smoke') {
        p.vx *= Math.pow(0.94, dt * 60);
        p.vy *= Math.pow(0.94, dt * 60);
        p.radius += 8 * dt; // Smoke expands as it cools & disperses
      }

      p.x += p.vx * 60 * dt;
      p.y += p.vy * 60 * dt;
      p.alpha = 1.0 - p.life / p.maxLife;
    }
  }

  private updateFloatingTexts(dt: number): void {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.elapsed += dt;
      if (ft.elapsed >= ft.duration) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      ft.y -= 25 * dt;
      ft.alpha = 1.0 - ft.elapsed / ft.duration;
    }
  }

  private updateCamera(dt: number): void {
    // Smooth camera lag
    const lerpSpeed = 5 * dt;
    this.camera.x += (this.ship.x - this.camera.x) * lerpSpeed;
    this.camera.y += (this.ship.y - this.camera.y) * lerpSpeed;
  }
}
