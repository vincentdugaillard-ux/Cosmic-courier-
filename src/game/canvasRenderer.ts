// Cosmic Courier - High-Performance Neon Retro Space Renderer
import { GameEngine } from './gameEngine';
import { AsteroidObstacle, BonusRing, GravityWellObstacle, LaserBarrierObstacle, LandingPad } from '../types/game';

interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  layer: number;
  twinkleSpeed: number;
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private stars: Star[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Failed to get 2D canvas context');
    this.ctx = context;

    this.initStarfield();
  }

  private initStarfield(): void {
    this.stars = [];
    const starCount = 350;
    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        x: Math.random() * 5000,
        y: Math.random() * 3000,
        size: Math.random() < 0.8 ? 1.2 : 2.2,
        brightness: 0.3 + Math.random() * 0.7,
        layer: Math.random() < 0.6 ? 0.3 : 0.7,
        twinkleSpeed: 1 + Math.random() * 3,
      });
    }
  }

  public render(engine: GameEngine): void {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Reset transform & clear
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // Deep space dark cosmic gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#050714');
    bgGrad.addColorStop(0.5, '#090b1e');
    bgGrad.addColorStop(1, '#060411');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Camera transform with screen shake
    let shakeX = 0;
    let shakeY = 0;
    if (engine.screenShake > 0 && engine.settings.screenShake) {
      shakeX = (Math.random() - 0.5) * engine.screenShake;
      shakeY = (Math.random() - 0.5) * engine.screenShake;
    }

    const camX = engine.camera.x + shakeX;
    const camY = engine.camera.y + shakeY;

    // Draw Parallax Starfield
    this.renderStarfield(ctx, width, height, camX, camY, engine.timeElapsed);

    // World-space coordinates
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.translate(-camX, -camY);

    // Route corridor guide
    this.renderRouteCorridor(ctx, engine);

    // World Boundary grid lines
    this.renderWorldBounds(ctx, engine.mission.worldWidth, engine.mission.worldHeight);

    // Landing Pad
    this.renderLandingPad(ctx, engine.mission.landingPad, engine.timeElapsed, engine);

    // Gravity Wells
    this.renderGravityWells(ctx, engine.mission.gravityWells, engine.timeElapsed);

    // Asteroids
    this.renderAsteroids(ctx, engine.mission.asteroids);

    // Laser Barriers
    this.renderLasers(ctx, engine.mission.lasers, engine.timeElapsed);

    // Bonus Delivery Rings
    this.renderBonusRings(ctx, engine.mission.bonusRings, engine.timeElapsed);

    // Particles
    this.renderParticles(ctx, engine.particles);

    // Cargo Breach Expanding Shockwaves
    this.renderCargoBreachShockwaves(ctx, engine);

    // Player Ship
    this.renderShip(ctx, engine);

    // Floating Text FX
    this.renderFloatingTexts(ctx, engine.floatingTexts);

    // Mouse Aim Flight Reticle & Vector
    if (engine.settings.mouseControls !== false && engine.mouseInput.active) {
      this.renderMouseAimReticle(ctx, engine);
    }

    ctx.restore();

    // Off-screen Nav Beacon Indicator
    this.renderNavPointer(ctx, width, height, camX, camY, engine.mission.landingPad);

    // Emergency Fullscreen Red Vignette & Warning HUD when package is breached
    this.renderEmergencyBreachVignette(ctx, width, height, engine);
  }

  private renderStarfield(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    camX: number,
    camY: number,
    time: number
  ): void {
    ctx.save();
    for (const star of this.stars) {
      const px = (star.x - camX * star.layer) % w;
      const py = (star.y - camY * star.layer) % h;
      const sx = px < 0 ? px + w : px;
      const sy = py < 0 ? py + h : py;

      const twinkle = 0.6 + Math.sin(time * star.twinkleSpeed + star.x) * 0.4;
      ctx.fillStyle = `rgba(220, 240, 255, ${star.brightness * twinkle * 0.85})`;
      ctx.fillRect(sx, sy, star.size, star.size);
    }
    ctx.restore();
  }

  private renderWorldBounds(ctx: CanvasRenderingContext2D, ww: number, wh: number): void {
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 12]);
    ctx.strokeRect(20, 20, ww - 40, wh - 40);

    // Corner accents
    ctx.strokeStyle = '#00f0ff';
    ctx.setLineDash([]);
    ctx.lineWidth = 3;
    const len = 30;
    // Top-Left
    ctx.beginPath();
    ctx.moveTo(20, 20 + len);
    ctx.lineTo(20, 20);
    ctx.lineTo(20 + len, 20);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(ww - 20, wh - 20 - len);
    ctx.lineTo(ww - 20, wh - 20);
    ctx.lineTo(ww - 20 - len, wh - 20);
    ctx.stroke();
    ctx.restore();
  }

  private renderRouteCorridor(ctx: CanvasRenderingContext2D, engine: GameEngine): void {
    const waypoints = engine.mission.routeWaypoints;
    if (!waypoints || waypoints.length < 2) return;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(waypoints[0].x, waypoints[0].y);
    for (let i = 1; i < waypoints.length; i++) {
      ctx.lineTo(waypoints[i].x, waypoints[i].y);
    }
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.14)';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 16]);
    ctx.stroke();

    // Subtle waypoint nodes
    for (const wp of waypoints) {
      ctx.beginPath();
      ctx.arc(wp.x, wp.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 240, 255, 0.25)';
      ctx.fill();
    }
    ctx.restore();
  }

  private renderLandingPad(
    ctx: CanvasRenderingContext2D,
    pad: LandingPad,
    time: number,
    engine: GameEngine
  ): void {
    ctx.save();
    const halfW = pad.width / 2;
    const halfH = pad.height / 2;

    // Outer glow zone
    const pulse = 0.85 + Math.sin(time * 3) * 0.15;
    ctx.strokeStyle = `rgba(57, 255, 20, ${pulse * 0.9})`; // Neon lime
    ctx.lineWidth = 3;
    ctx.strokeRect(pad.x - halfW, pad.y - halfH, pad.width, pad.height);

    // Holographic grid fill
    ctx.fillStyle = 'rgba(57, 255, 20, 0.05)';
    ctx.fillRect(pad.x - halfW, pad.y - halfH, pad.width, pad.height);

    // Corner runway indicators
    const markerSize = 16;
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#39ff14';

    // TL
    ctx.beginPath();
    ctx.moveTo(pad.x - halfW, pad.y - halfH + markerSize);
    ctx.lineTo(pad.x - halfW, pad.y - halfH);
    ctx.lineTo(pad.x - halfW + markerSize, pad.y - halfH);
    ctx.stroke();

    // TR
    ctx.beginPath();
    ctx.moveTo(pad.x + halfW - markerSize, pad.y - halfH);
    ctx.lineTo(pad.x + halfW, pad.y - halfH);
    ctx.lineTo(pad.x + halfW, pad.y - halfH + markerSize);
    ctx.stroke();

    // BL
    ctx.beginPath();
    ctx.moveTo(pad.x - halfW, pad.y + halfH - markerSize);
    ctx.lineTo(pad.x - halfW, pad.y + halfH);
    ctx.lineTo(pad.x - halfW + markerSize, pad.y + halfH);
    ctx.stroke();

    // BR
    ctx.beginPath();
    ctx.moveTo(pad.x + halfW - markerSize, pad.y + halfH);
    ctx.lineTo(pad.x + halfW, pad.y + halfH);
    ctx.lineTo(pad.x + halfW, pad.y + halfH - markerSize);
    ctx.stroke();

    // Center Docking Target
    ctx.beginPath();
    ctx.arc(pad.x, pad.y, 24, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(57, 255, 20, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(pad.x, pad.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#39ff14';
    ctx.fill();

    // Speed check status overlay
    const shipSpeed = Math.hypot(engine.ship.vx, engine.ship.vy);
    const isSafeSpeed = shipSpeed <= pad.safeSpeedMax;
    const speedText = isSafeSpeed ? 'DOCKING READY' : 'REDUCE VELOCITY';
    const speedColor = isSafeSpeed ? '#39ff14' : '#ef4444';

    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = speedColor;
    ctx.fillText(speedText, pad.x, pad.y - halfH - 12);
    ctx.fillText('OUTPOST DOCKING BAY', pad.x, pad.y + halfH + 18);

    ctx.restore();
  }

  private renderGravityWells(
    ctx: CanvasRenderingContext2D,
    wells: GravityWellObstacle[],
    time: number
  ): void {
    ctx.save();
    for (const gw of wells) {
      // Swirling gravitational distortion rings
      for (let r = gw.radius + 20; r < gw.influenceRadius; r += 45) {
        ctx.beginPath();
        ctx.arc(gw.x, gw.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(168, 85, 247, ${0.12 * (1 - r / gw.influenceRadius)})`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([10, 20]);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Accretion disk spiral
      const spiralCount = 4;
      for (let s = 0; s < spiralCount; s++) {
        const offsetAngle = gw.rotation + (s * Math.PI * 2) / spiralCount;
        ctx.beginPath();
        for (let i = 0; i < 25; i++) {
          const t = i / 25;
          const rad = gw.radius + t * (gw.influenceRadius * 0.7);
          const ang = offsetAngle + t * 4.5;
          const px = gw.x + Math.cos(ang) * rad;
          const py = gw.y + Math.sin(ang) * rad;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = 'rgba(192, 132, 252, 0.2)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Singularity Event Horizon Core
      ctx.beginPath();
      ctx.arc(gw.x, gw.y, gw.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#0a0518';
      ctx.fill();
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Warning text
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = '#c084fc';
      ctx.textAlign = 'center';
      ctx.fillText('GRAV SINGULARITY', gw.x, gw.y + gw.radius + 15);
    }
    ctx.restore();
  }

  private renderAsteroids(ctx: CanvasRenderingContext2D, asteroids: AsteroidObstacle[]): void {
    ctx.save();
    for (const ast of asteroids) {
      ctx.save();
      ctx.translate(ast.x, ast.y);
      ctx.rotate(ast.rotation);

      // Craggy body
      ctx.beginPath();
      if (ast.vertices && ast.vertices.length > 0) {
        ctx.moveTo(ast.vertices[0].x, ast.vertices[0].y);
        for (let i = 1; i < ast.vertices.length; i++) {
          ctx.lineTo(ast.vertices[i].x, ast.vertices[i].y);
        }
        ctx.closePath();
      } else {
        ctx.arc(0, 0, ast.radius, 0, Math.PI * 2);
      }

      // Dark core
      ctx.fillStyle = ast.type === 'asteroid_moving' ? '#141724' : '#111420';
      ctx.fill();

      // Neon rim
      ctx.strokeStyle = ast.type === 'asteroid_moving' ? '#f59e0b' : '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Internal crags
      ctx.beginPath();
      ctx.moveTo(-ast.radius * 0.3, -ast.radius * 0.2);
      ctx.lineTo(ast.radius * 0.1, 0);
      ctx.lineTo(ast.radius * 0.3, ast.radius * 0.2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    }
    ctx.restore();
  }

  private renderLasers(
    ctx: CanvasRenderingContext2D,
    lasers: LaserBarrierObstacle[],
    time: number
  ): void {
    ctx.save();
    for (const laser of lasers) {
      const cycleTime = (time + laser.cycleOffset) % laser.cycleDuration;
      const activeDuration = laser.cycleDuration * laser.activeRatio;
      const isActive = cycleTime < activeDuration;
      const timeUntilActive = isActive ? 0 : laser.cycleDuration - cycleTime;
      const isWarning = !isActive && timeUntilActive <= 1.3;

      if (isActive) {
        // Pylons at both ends - energetic glowing ruby
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(laser.x1 - 6, laser.y1 - 6, 12, 12);
        ctx.fillRect(laser.x2 - 6, laser.y2 - 6, 12, 12);

        // Core white diodes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(laser.x1 - 2, laser.y1 - 2, 4, 4);
        ctx.fillRect(laser.x2 - 2, laser.y2 - 2, 4, 4);

        // High-energy laser beam
        ctx.beginPath();
        ctx.moveTo(laser.x1, laser.y1);
        ctx.lineTo(laser.x2, laser.y2);

        // Core bright line
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Glowing outer laser halo
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.85)';
        ctx.lineWidth = 10;
        ctx.stroke();

        // Pulsing outer aura
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.25)';
        ctx.lineWidth = 22;
        ctx.stroke();
      } else if (isWarning) {
        // Pre-Activation Alert Warning Telegraph!
        const strobe = Math.sin(time * 28) > 0;
        const alertIntensity = 1 - timeUntilActive / 1.3;

        // Pylons at both ends: warning amber/red strobe
        ctx.fillStyle = strobe ? '#f59e0b' : '#ef4444';
        ctx.fillRect(laser.x1 - 7, laser.y1 - 7, 14, 14);
        ctx.fillRect(laser.x2 - 7, laser.y2 - 7, 14, 14);

        // Expanding pre-ignition shockwave rings at pylons
        const pylonRing = 6 + (alertIntensity * 12) % 14;
        ctx.strokeStyle = strobe ? 'rgba(245, 158, 11, 0.8)' : 'rgba(239, 68, 68, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(laser.x1, laser.y1, pylonRing, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(laser.x2, laser.y2, pylonRing, 0, Math.PI * 2);
        ctx.stroke();

        // Flashing Warning Danger Corridor
        ctx.beginPath();
        ctx.moveTo(laser.x1, laser.y1);
        ctx.lineTo(laser.x2, laser.y2);
        ctx.strokeStyle = strobe ? 'rgba(250, 204, 21, 0.35)' : 'rgba(239, 68, 68, 0.25)';
        ctx.lineWidth = 12;
        ctx.stroke();

        // Energetic charging dashes moving toward center
        ctx.beginPath();
        ctx.moveTo(laser.x1, laser.y1);
        ctx.lineTo(laser.x2, laser.y2);
        ctx.strokeStyle = strobe ? '#fef08a' : '#fca5a5';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([8, 6]);
        ctx.lineDashOffset = -time * 90;
        ctx.stroke();
        ctx.setLineDash([]);

        // Central Alert Countdown Badge
        const midX = (laser.x1 + laser.x2) / 2;
        const midY = (laser.y1 + laser.y2) / 2;
        ctx.save();
        ctx.translate(midX, midY);

        const angle = Math.atan2(laser.y2 - laser.y1, laser.x2 - laser.x1);
        let textAngle = angle;
        if (textAngle > Math.PI / 2 || textAngle < -Math.PI / 2) {
          textAngle += Math.PI;
        }
        ctx.rotate(textAngle);

        const alertText = `⚡ CHARGING ${timeUntilActive.toFixed(1)}s`;
        ctx.font = 'bold 9px monospace';
        const textW = ctx.measureText(alertText).width;
        const pillW = textW + 14;
        const pillH = 16;

        ctx.fillStyle = strobe ? 'rgba(15, 23, 42, 0.95)' : 'rgba(24, 12, 12, 0.95)';
        ctx.strokeStyle = strobe ? '#facc15' : '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-pillW / 2, -pillH / 2, pillW, pillH, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = strobe ? '#fde047' : '#fca5a5';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(alertText, 0, 0);
        ctx.restore();
      } else {
        // Standby inactive beam guide
        ctx.fillStyle = '#475569';
        ctx.fillRect(laser.x1 - 5, laser.y1 - 5, 10, 10);
        ctx.fillRect(laser.x2 - 5, laser.y2 - 5, 10, 10);

        ctx.fillStyle = '#9f1239';
        ctx.fillRect(laser.x1 - 2, laser.y1 - 2, 4, 4);
        ctx.fillRect(laser.x2 - 2, laser.y2 - 2, 4, 4);

        ctx.beginPath();
        ctx.moveTo(laser.x1, laser.y1);
        ctx.lineTo(laser.x2, laser.y2);
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.20)';
        ctx.setLineDash([6, 10]);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    ctx.restore();
  }

  private renderBonusRings(ctx: CanvasRenderingContext2D, rings: BonusRing[], time: number): void {
    ctx.save();
    for (const ring of rings) {
      if (ring.collected) continue;

      ctx.save();
      ctx.translate(ring.x, ring.y);
      const spin = time * 2;

      // Outer glowing ring
      ctx.beginPath();
      ctx.arc(0, 0, ring.radius, 0, Math.PI * 2);
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Translucent cyan fill
      ctx.fillStyle = 'rgba(0, 240, 255, 0.08)';
      ctx.fill();

      // Rotating inner spokes
      for (let s = 0; s < 4; s++) {
        const ang = spin + (s * Math.PI) / 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * (ring.radius * 0.4), Math.sin(ang) * (ring.radius * 0.4));
        ctx.lineTo(Math.cos(ang) * ring.radius, Math.sin(ang) * ring.radius);
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Ring score label
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = '#00f0ff';
      ctx.textAlign = 'center';
      ctx.fillText('+300', 0, 3);

      ctx.restore();
    }
    ctx.restore();
  }

  private renderShip(ctx: CanvasRenderingContext2D, engine: GameEngine): void {
    const ship = engine.ship;
    const config = engine.shipConfig;

    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);

    // Invulnerability flashing
    if (ship.invulnerableTimer > 0) {
      if (Math.floor(ship.invulnerableTimer * 20) % 2 === 0) {
        ctx.restore();
        return;
      }
    }

    const primaryColor = config.color;
    const accentColor = config.accentColor;
    const engineColor = config.engineColor;
    const isThrusting = ship.thrusting || ship.boosting;
    const flareLen = ship.boosting ? 28 + Math.random() * 8 : 15 + Math.random() * 5;
    const flareColor = ship.boosting ? '#ff0055' : engineColor;

    // Cargo Container Pod Color based on stability
    const cargoStability = ship.packageStability;
    let cargoColor = '#39ff14'; // Pristine
    if (cargoStability < 35) cargoColor = '#ef4444'; // Critical
    else if (cargoStability < 70) cargoColor = '#f59e0b'; // Fragile

    // Render by Distinct Ship Design
    switch (config.id) {
      case 'nebula_swift': {
        // --- 1. NEBULA SWIFT: Forward-Swept Agile Interceptor ---
        // Twin Thrusters Flares
        if (isThrusting) {
          ctx.fillStyle = flareColor;
          // Left engine flare
          ctx.beginPath();
          ctx.moveTo(-11, -7);
          ctx.lineTo(-11 - flareLen * 0.9, -5);
          ctx.lineTo(-11, -3);
          ctx.closePath();
          ctx.fill();
          // Right engine flare
          ctx.beginPath();
          ctx.moveTo(-11, 3);
          ctx.lineTo(-11 - flareLen * 0.9, 5);
          ctx.lineTo(-11, 7);
          ctx.closePath();
          ctx.fill();
        }

        // Hull: Needle nose + Forward-swept wings
        ctx.beginPath();
        ctx.moveTo(22, 0);       // Needle probe tip
        ctx.lineTo(8, 3);        // Forward fuselage
        ctx.lineTo(12, 8);       // Canard forward tip
        ctx.lineTo(6, 6);        // Canard root
        ctx.lineTo(4, 16);       // Forward-swept wingtip (swept forward!)
        ctx.lineTo(-4, 12);      // Outer wing trailing edge
        ctx.lineTo(-11, 8);      // Right engine pod
        ctx.lineTo(-8, 4);       // Engine recess
        ctx.lineTo(-11, 0);      // Center rear tail
        ctx.lineTo(-8, -4);      // Engine recess
        ctx.lineTo(-11, -8);     // Left engine pod
        ctx.lineTo(-4, -12);     // Outer wing trailing edge
        ctx.lineTo(4, -16);      // Forward-swept wingtip
        ctx.lineTo(6, -6);       // Canard root
        ctx.lineTo(12, -8);      // Canard forward tip
        ctx.lineTo(8, -3);       // Forward fuselage
        ctx.closePath();

        ctx.fillStyle = '#08141e';
        ctx.fill();
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 2.4;
        ctx.stroke();

        // Agile Wing Spars & Accents
        ctx.beginPath();
        ctx.moveTo(3, 5);
        ctx.lineTo(2, 14);
        ctx.moveTo(3, -5);
        ctx.lineTo(2, -14);
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Cargo Pod (Compact recessed ring)
        this.renderCargoPodVisual(ctx, -1, 0, 4.5, cargoStability, engine.isPackageBreached);

        // Needle Cockpit Glass
        ctx.beginPath();
        ctx.moveTo(14, 0);
        ctx.lineTo(3, 2.2);
        ctx.lineTo(3, -2.2);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fill();
        break;
      }

      case 'titan_hauler': {
        // --- 2. TITAN HAULER: Heavy Armored Dual-Catamaran Transport ---
        // Massive Dual Heavy Thrusters
        if (isThrusting) {
          ctx.fillStyle = flareColor;
          const heavyFlare = flareLen * 1.1;
          // Left heavy engine flare
          ctx.beginPath();
          ctx.moveTo(-14, -11);
          ctx.lineTo(-14 - heavyFlare, -7);
          ctx.lineTo(-14, -3);
          ctx.closePath();
          ctx.fill();
          // Right heavy engine flare
          ctx.beginPath();
          ctx.moveTo(-14, 3);
          ctx.lineTo(-14 - heavyFlare, 7);
          ctx.lineTo(-14, 11);
          ctx.closePath();
          ctx.fill();
        }

        // Heavy Armored Catamaran Hull
        ctx.beginPath();
        ctx.moveTo(13, -11);     // Left armored prow tip
        ctx.lineTo(13, -5);      // Left bumper
        ctx.lineTo(7, 0);        // Center indented reinforced bow
        ctx.lineTo(13, 5);       // Right bumper
        ctx.lineTo(13, 11);      // Right armored prow tip
        ctx.lineTo(3, 14);       // Heavy right shoulder bulwark
        ctx.lineTo(-14, 12);     // Heavy right engine housing
        ctx.lineTo(-14, 3);      // Right engine inner mount
        ctx.lineTo(-8, 0);       // Rear cargo bay bumper
        ctx.lineTo(-14, -3);     // Left engine inner mount
        ctx.lineTo(-14, -12);    // Heavy left engine housing
        ctx.lineTo(3, -14);      // Heavy left shoulder bulwark
        ctx.closePath();

        ctx.fillStyle = '#1c1408';
        ctx.fill();
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Industrial Armor Reinforcement Struts
        ctx.beginPath();
        ctx.moveTo(11, -9);
        ctx.lineTo(-10, -9);
        ctx.moveTo(11, 9);
        ctx.lineTo(-10, 9);
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Reinforced Heavy Cargo Vault Cage
        ctx.strokeRect(-5, -6, 10, 12);
        this.renderCargoPodVisual(ctx, 0, 0, 3.8, cargoStability, engine.isPackageBreached, true);

        // Twin Armored Command Bridges
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillRect(5, -9, 4, 3);
        ctx.fillRect(5, 6, 4, 3);
        break;
      }

      case 'solar_dart': {
        // --- 3. SOLAR DART: Ultra-Long Razor-Thin Delta Speedrunner ---
        // High-Speed Twin Ion Exhaust
        if (isThrusting) {
          ctx.fillStyle = flareColor;
          ctx.beginPath();
          ctx.moveTo(-15, -4);
          ctx.lineTo(-15 - flareLen * 1.2, 0);
          ctx.lineTo(-15, 4);
          ctx.closePath();
          ctx.fill();
        }

        // Razor-Thin Dart Hull + Outrigger Solar Blade Foils
        ctx.beginPath();
        ctx.moveTo(25, 0);       // Ultra-sharp needle prow
        ctx.lineTo(8, 3.5);      // Razor forward fuselage
        ctx.lineTo(4, 9);        // Wing root pylon
        ctx.lineTo(-2, 16);      // Outrigger solar foil forward tip
        ctx.lineTo(-17, 13);     // Solar blade trailing tip
        ctx.lineTo(-8, 5);       // Foil inner return
        ctx.lineTo(-15, 4);      // Engine bracket
        ctx.lineTo(-12, 0);      // Core nozzle
        ctx.lineTo(-15, -4);     // Engine bracket
        ctx.lineTo(-8, -5);      // Foil inner return
        ctx.lineTo(-17, -13);    // Solar blade trailing tip
        ctx.lineTo(-2, -16);     // Outrigger solar foil forward tip
        ctx.lineTo(4, -9);       // Wing root pylon
        ctx.lineTo(8, -3.5);     // Razor forward fuselage
        ctx.closePath();

        ctx.fillStyle = '#1b0818';
        ctx.fill();
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 2.4;
        ctx.stroke();

        // Solar Collector Radiator Lines
        ctx.beginPath();
        ctx.moveTo(0, 13);
        ctx.lineTo(-13, 11);
        ctx.moveTo(0, -13);
        ctx.lineTo(-13, -11);
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // Cargo Pod (Shielded in mid-chassis)
        this.renderCargoPodVisual(ctx, -2, 0, 4.5, cargoStability, engine.isPackageBreached);

        // Elongated Supersonic Canopy
        ctx.beginPath();
        ctx.moveTo(18, 0);
        ctx.lineTo(4, 2);
        ctx.lineTo(4, -2);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fill();
        break;
      }

      case 'quantum_phantom': {
        // --- 4. QUANTUM PHANTOM: Faceted Stealth Diamond Flying Wing ---
        // Pulsing Stealth Plasma Slit Exhaust
        if (isThrusting) {
          ctx.fillStyle = flareColor;
          ctx.beginPath();
          ctx.moveTo(-9, -6);
          ctx.lineTo(-10 - flareLen, 0);
          ctx.lineTo(-9, 6);
          ctx.closePath();
          ctx.fill();
        }

        // Diamond Faceted Stealth Geometry
        ctx.beginPath();
        ctx.moveTo(17, 0);       // Diamond nose
        ctx.lineTo(2, 9);        // Forward facet
        ctx.lineTo(-3, 16);      // Outer stealth wing vertex
        ctx.lineTo(-14, 11);     // Trailing wingtip
        ctx.lineTo(-8, 5);       // Trailing edge facet
        ctx.lineTo(-12, 0);      // Inverted tail notch
        ctx.lineTo(-8, -5);      // Trailing edge facet
        ctx.lineTo(-14, -11);    // Trailing wingtip
        ctx.lineTo(-3, -16);     // Outer stealth wing vertex
        ctx.lineTo(2, -9);       // Forward facet
        ctx.closePath();

        ctx.fillStyle = '#0f081c';
        ctx.fill();
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 2.6;
        ctx.stroke();

        // Internal Stealth Facet Ridge Lines
        ctx.beginPath();
        ctx.moveTo(17, 0);
        ctx.lineTo(-4, 0);
        ctx.moveTo(2, 9);
        ctx.lineTo(-4, 0);
        ctx.moveTo(2, -9);
        ctx.lineTo(-4, 0);
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // Quantum Magnetic Containment Ring for Cargo
        ctx.beginPath();
        ctx.arc(-2, 0, 7, 0, Math.PI * 2);
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Cargo Pod
        this.renderCargoPodVisual(ctx, -2, 0, 4.5, cargoStability, engine.isPackageBreached);

        // Angular Stealth Sensor Canopy
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(5, 3);
        ctx.lineTo(2, 0);
        ctx.lineTo(5, -3);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fill();
        break;
      }

      case 'courier_alpha':
      default: {
        // --- 5. COURIER ALPHA: Classic Arrowhead Delta Courier ---
        // Thruster Flare
        if (isThrusting) {
          ctx.beginPath();
          ctx.moveTo(-12, -5);
          ctx.lineTo(-12 - flareLen, 0);
          ctx.lineTo(-12, 5);
          ctx.closePath();
          ctx.fillStyle = flareColor;
          ctx.fill();
        }

        // Arrowhead Delta Hull
        ctx.beginPath();
        ctx.moveTo(18, 0);       // Nose
        ctx.lineTo(-12, 13);     // Right wingtip
        ctx.lineTo(-7, 4);       // Right body inset
        ctx.lineTo(-12, 0);      // Engine nozzle
        ctx.lineTo(-7, -4);      // Left body inset
        ctx.lineTo(-12, -13);    // Left wingtip
        ctx.closePath();

        ctx.fillStyle = '#0c1020';
        ctx.fill();
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Wing accent lines
        ctx.beginPath();
        ctx.moveTo(4, 3);
        ctx.lineTo(-9, 10);
        ctx.moveTo(4, -3);
        ctx.lineTo(-9, -10);
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Fragile Cargo Container Pod
        this.renderCargoPodVisual(ctx, -2, 0, 5, cargoStability, engine.isPackageBreached);

        // Cockpit canopy
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(2, 2.5);
        ctx.lineTo(2, -2.5);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fill();
        break;
      }
    }

    ctx.restore();
  }

  private renderParticles(ctx: CanvasRenderingContext2D, particles: GameEngine['particles']): void {
    ctx.save();
    for (const p of particles) {
      if (p.shape === 'debris') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
        const w = p.width || 8;
        const h = p.height || 6;
        ctx.beginPath();
        ctx.moveTo(-w / 2, -h / 2);
        ctx.lineTo(w / 2, -h / 3);
        ctx.lineTo(w / 3, h / 2);
        ctx.lineTo(-w / 3, h / 2);
        ctx.closePath();
        ctx.fill();
        if (p.borderColor) {
          ctx.strokeStyle = p.borderColor;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
        ctx.restore();
      } else if (p.shape === 'smoke') {
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.radius), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha * 0.45));
        ctx.fill();
        ctx.restore();
      } else if (p.shape === 'spark') {
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 1.6, p.y - p.vy * 1.6);
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.radius), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // --- Specialized Cargo Pod Visual State (Intact vs Ruptured/Breached) ---
  private renderCargoPodVisual(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    cargoStability: number,
    isBreached: boolean,
    isRectangular: boolean = false
  ): void {
    if (cargoStability <= 0 || isBreached) {
      // CATASTROPHICALLY DAMAGED / BREACHED CARGO POD
      ctx.save();
      const time = performance.now() / 1000;
      const flash = Math.sin(time * 24) > 0;

      // 1. Blackened charred blowout cavity
      ctx.beginPath();
      if (isRectangular) {
        ctx.rect(cx - radius * 1.1, cy - radius * 1.5, radius * 2.2, radius * 3.0);
      } else {
        ctx.arc(cx, cy, radius * 1.35, 0, Math.PI * 2);
      }
      ctx.fillStyle = '#090d16';
      ctx.fill();
      ctx.strokeStyle = flash ? '#ef4444' : '#7f1d1d';
      ctx.lineWidth = 2.0;
      ctx.stroke();

      // 2. Ruptured containment field pulsing red hazard glow
      ctx.save();
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = flash ? 16 : 6;
      ctx.strokeStyle = flash ? '#f87171' : '#b91c1c';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 3. Jagged fractured struts / cracked containment shards
      ctx.strokeStyle = '#fca5a5';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - radius, cy - radius * 0.8);
      ctx.lineTo(cx + radius * 0.2, cy);
      ctx.lineTo(cx - radius * 0.4, cy + radius * 0.9);
      ctx.moveTo(cx + radius * 0.9, cy - radius * 0.6);
      ctx.lineTo(cx - radius * 0.1, cy + radius * 0.2);
      ctx.lineTo(cx + radius * 0.7, cy + radius * 0.8);
      ctx.stroke();

      // 4. Exposed energetic sparking core / electrical blowout arcs
      if (Math.random() > 0.25) {
        ctx.strokeStyle = Math.random() > 0.5 ? '#fde047' : '#ef4444';
        ctx.lineWidth = 1.8;
        const sparkAng = Math.random() * Math.PI * 2;
        const sparkLen = radius * (1.2 + Math.random() * 0.8);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(
          cx + Math.cos(sparkAng) * (sparkLen * 0.5) + (Math.random() - 0.5) * 4,
          cy + Math.sin(sparkAng) * (sparkLen * 0.5) + (Math.random() - 0.5) * 4
        );
        ctx.lineTo(cx + Math.cos(sparkAng) * sparkLen, cy + Math.sin(sparkAng) * sparkLen);
        ctx.stroke();
      }

      // 5. Pulsing emergency beacon dot
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fillStyle = flash ? '#ffffff' : '#dc2626';
      ctx.fill();

      ctx.restore();
    } else {
      // INTACT / DAMAGED CARGO POD
      let cargoColor = '#39ff14'; // Pristine
      let coreGlow = 'rgba(57, 255, 20, 0.4)';
      if (cargoStability < 35) {
        cargoColor = '#ef4444'; // Critical
        coreGlow = 'rgba(239, 68, 68, 0.6)';
      } else if (cargoStability < 70) {
        cargoColor = '#f59e0b'; // Fragile
        coreGlow = 'rgba(245, 158, 11, 0.5)';
      }

      ctx.save();
      if (isRectangular) {
        ctx.fillStyle = cargoColor;
        ctx.fillRect(cx - radius, cy - radius * 1.2, radius * 2, radius * 2.4);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - radius, cy - radius * 1.2, radius * 2, radius * 2.4);
      } else {
        // Outer halo
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = cargoColor;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Inner containment core
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = coreGlow;
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // --- Expanding Shockwaves at Cargo Breach Epicenter ---
  private renderCargoBreachShockwaves(ctx: CanvasRenderingContext2D, engine: GameEngine): void {
    const effect = engine.cargoBreachEffect;
    if (!effect || !effect.active) return;

    ctx.save();
    const px = effect.x;
    const py = effect.y;
    const progress = effect.timer / effect.duration;

    // 1. Epicenter intense radial flash
    if (progress < 0.4) {
      const flashAlpha = Math.max(0, (1 - progress / 0.4) * 0.85);
      const radGrad = ctx.createRadialGradient(px, py, 4, px, py, 95);
      radGrad.addColorStop(0, `rgba(255, 255, 255, ${flashAlpha})`);
      radGrad.addColorStop(0.3, `rgba(250, 204, 21, ${flashAlpha * 0.85})`);
      radGrad.addColorStop(0.7, `rgba(239, 68, 68, ${flashAlpha * 0.55})`);
      radGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');

      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(px, py, 95, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Multi-tiered expanding shockwave rings
    for (const sw of effect.shockwaves) {
      if (sw.alpha <= 0.01) continue;

      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, Math.max(1, sw.radius), 0, Math.PI * 2);
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = sw.lineWidth;
      ctx.globalAlpha = Math.max(0, Math.min(1, sw.alpha));
      ctx.stroke();

      // Outer secondary ripple with faint dashed line
      if (sw.radius > 30) {
        ctx.beginPath();
        ctx.arc(px, py, Math.max(1, sw.radius * 0.92), 0, Math.PI * 2);
        ctx.setLineDash([8, 12]);
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = Math.max(0, Math.min(1, sw.alpha * 0.5));
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore();
  }

  // --- Fullscreen Emergency Red Alert Strobe & Top Hazard Bar ---
  private renderEmergencyBreachVignette(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    engine: GameEngine
  ): void {
    const isBreached = engine.isPackageBreached || engine.ship.packageStability <= 0;
    const effectActive = engine.cargoBreachEffect && engine.cargoBreachEffect.active;

    if (!isBreached && !effectActive) return;

    ctx.save();
    const time = performance.now() / 1000;
    // Rapid pulsing strobe
    const pulse = 0.5 + 0.5 * Math.sin(time * 12);
    const vignetteAlpha = effectActive ? 0.38 + 0.28 * pulse : 0.22 + 0.15 * pulse;

    // 1. Radial Perimeter Red Vignette
    const maxRadius = Math.hypot(w / 2, h / 2);
    const grad = ctx.createRadialGradient(w / 2, h / 2, maxRadius * 0.45, w / 2, h / 2, maxRadius);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.65, `rgba(185, 28, 28, ${vignetteAlpha * 0.4})`);
    grad.addColorStop(1, `rgba(220, 38, 38, ${vignetteAlpha})`);

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // 2. Tactical System Warning Bar at Screen Top
    const barHeight = 28;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(0, 0, w, barHeight);

    // Hazard stripes on warning bar
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, barHeight);
    ctx.clip();
    const stripeWidth = 24;
    const offset = (time * 40) % stripeWidth;
    ctx.fillStyle = 'rgba(239, 68, 68, 0.28)';
    for (let x = -stripeWidth + offset; x < w + stripeWidth; x += stripeWidth) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 12, 0);
      ctx.lineTo(x + 4, barHeight);
      ctx.lineTo(x - 8, barHeight);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Red border under top bar
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, barHeight);
    ctx.lineTo(w, barHeight);
    ctx.stroke();

    // Text in Top Bar
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#fee2e2';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    ctx.fillText('CRITICAL ALERT: CARGO POD CONTAINMENT DESTRUCTION — 0% STABILITY', w / 2, barHeight / 2);
    ctx.restore();
  }

  private renderFloatingTexts(ctx: CanvasRenderingContext2D, texts: GameEngine['floatingTexts']): void {
    ctx.save();
    for (const ft of texts) {
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = Math.max(0, Math.min(1, ft.alpha));
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.restore();
  }

  private renderNavPointer(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    camX: number,
    camY: number,
    pad: LandingPad
  ): void {
    const dx = pad.x - camX;
    const dy = pad.y - camY;
    const dist = Math.hypot(dx, dy);

    // If destination is off-screen or far away, draw compass beacon arrow on border
    const margin = 50;
    const cx = w / 2;
    const cy = h / 2;

    const angle = Math.atan2(dy, dx);
    const arrowDist = Math.min(cx - margin, cy - margin);
    const ax = cx + Math.cos(angle) * arrowDist;
    const ay = cy + Math.sin(angle) * arrowDist;

    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(angle);

    // Arrow pointer
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, 7);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-8, -7);
    ctx.closePath();
    ctx.fillStyle = '#39ff14';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Distance in meters / km
    ctx.rotate(-angle);
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#39ff14';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(dist)}m`, 0, 18);

    ctx.restore();
  }

  private renderMouseAimReticle(ctx: CanvasRenderingContext2D, engine: GameEngine): void {
    const mouse = engine.mouseInput;
    if (!mouse.active) return;

    const ship = engine.ship;
    const mx = mouse.worldX;
    const my = mouse.worldY;
    const dx = mx - ship.x;
    const dy = my - ship.y;
    const dist = Math.hypot(dx, dy);

    ctx.save();

    // 1. Aim vector trail from ship nose towards reticle
    const noseX = ship.x + Math.cos(ship.angle) * 16;
    const noseY = ship.y + Math.sin(ship.angle) * 16;

    let reticleColor = '#00f0ff'; // Default cyan
    let stateLabel = '';

    const isOutOfFuel = (engine.settings.fuelDepletion !== false) && (ship.fuel <= 0);

    if (isOutOfFuel) {
      reticleColor = '#ef4444';
      stateLabel = 'NO FUEL';
    } else if (mouse.boosting) {
      reticleColor = '#ec4899';
      stateLabel = 'BOOST';
    } else if (mouse.thrusting) {
      reticleColor = '#38bdf8';
      stateLabel = 'THRUST';
    } else if (mouse.reversing) {
      reticleColor = '#f59e0b';
      stateLabel = 'BRAKE';
    }

    // Draw dashed flight vector line
    ctx.beginPath();
    ctx.moveTo(noseX, noseY);
    ctx.lineTo(mx, my);
    ctx.strokeStyle = reticleColor;
    ctx.globalAlpha = mouse.thrusting || mouse.boosting ? 0.45 : 0.22;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1.0;

    // 2. Tactical Crosshair at (mx, my)
    ctx.translate(mx, my);

    // Outer crosshair circle
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.strokeStyle = reticleColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Subtle inner glowing fill
    ctx.fillStyle = reticleColor;
    ctx.globalAlpha = 0.08;
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Crosshair tick marks
    ctx.beginPath();
    // Top
    ctx.moveTo(0, -18);
    ctx.lineTo(0, -9);
    // Bottom
    ctx.moveTo(0, 9);
    ctx.lineTo(0, 18);
    // Left
    ctx.moveTo(-18, 0);
    ctx.lineTo(-9, 0);
    // Right
    ctx.moveTo(9, 0);
    ctx.lineTo(18, 0);
    ctx.strokeStyle = reticleColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Central dot
    ctx.beginPath();
    ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
    ctx.fillStyle = reticleColor;
    ctx.fill();

    // Thrust / Brake Chevron indicators
    if (mouse.thrusting || mouse.boosting) {
      ctx.beginPath();
      ctx.moveTo(-5, -6);
      ctx.lineTo(0, -1);
      ctx.lineTo(5, -6);
      ctx.strokeStyle = reticleColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (mouse.reversing) {
      ctx.beginPath();
      ctx.moveTo(-5, 6);
      ctx.lineTo(0, 1);
      ctx.lineTo(5, 6);
      ctx.strokeStyle = reticleColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Reticle distance & action readout
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = reticleColor;
    const infoText = stateLabel ? `${stateLabel} (${Math.round(dist)}m)` : `${Math.round(dist)}m`;
    ctx.fillText(infoText, 22, 0);

    ctx.restore();
  }
}
