import { SoundManager } from './SoundManager';

export const COLOR_MAP: Record<string, string> = {
  pink: '#FF007F',
  cyan: '#00FFFF',
  yellow: '#FFEA00',
  lime: '#39FF14',
  violet: '#B026FF',
};

export const COLORS = Object.keys(COLOR_MAP);
export const BUBBLE_RADIUS = 20;
export const BUBBLE_DIAM = BUBBLE_RADIUS * 2;
export const ROW_HEIGHT = BUBBLE_DIAM * 0.866025; // sqrt(3)/2
export const GRID_COLS = 11;
export const GRID_ROWS = 15;
export const SHOOT_SPEED = 16;

export interface Point {
  x: number;
  y: number;
}

export interface FlyingBubble {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}

export interface FallingBubble extends FlyingBubble {
  life?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;

  grid: (string | null)[][];
  rowParity: number = 0;

  playerPos: Point;
  flying: FlyingBubble | null = null;
  falling: FallingBubble[] = [];
  particles: Particle[] = [];

  mouseX: number | null = null;
  mouseY: number | null = null;

  currentColor: string = '';
  nextColor: string = '';

  score: number = 0;
  shotsFired: number = 0;
  shotsUntilDrop: number = 5;

  gameState: 'idle' | 'playing' | 'gameover' | 'win' = 'idle';

  private reqId: number | null = null;
  private lastTime: number = 0;

  // React callbacks
  onScoreChange: (score: number) => void;
  onGameOver: () => void;
  onWin: () => void;
  onNextColorChange: (c: string) => void;

  constructor(
    canvas: HTMLCanvasElement,
    callbacks: {
      onScoreChange: (s: number) => void;
      onGameOver: () => void;
      onWin: () => void;
      onNextColorChange: (c: string) => void;
    }
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.width = canvas.width;
    this.height = canvas.height;

    this.onScoreChange = callbacks.onScoreChange;
    this.onGameOver = callbacks.onGameOver;
    this.onWin = callbacks.onWin;
    this.onNextColorChange = callbacks.onNextColorChange;

    this.playerPos = { x: this.width / 2, y: this.height - BUBBLE_RADIUS - 10 };
    this.grid = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(null));

    this.bindEvents();
    this.init(1, false); // Start level 1 in idle mode
  }

  setGameState(state: 'idle' | 'playing' | 'gameover' | 'win') {
    this.gameState = state;
  }

  init(level: number, autoStart: boolean = true) {
    this.score = 0;
    this.shotsFired = 0;
    this.rowParity = 0;
    this.gameState = autoStart ? 'playing' : 'idle';
    this.mouseX = this.width / 2;
    this.mouseY = -100; // default pointer position pointing up
    this.flying = null;
    this.falling = [];
    this.particles = [];
    this.grid = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(null));

    // Calculate initial rows: Level 1 gets 2, Level 2 gets 4, Level 3 gets 6 (Cap at 10)
    const initialRows = Math.min(level * 2, 10);
    
    // Dynamic drop config based on level (Drops faster at higher levels)
    this.shotsUntilDrop = Math.max(8 - Math.floor(level / 3), 3);

    // Progressive color count palette based on level
    let colorCount = 3;
    if (level >= 13) {
      colorCount = 5; // Very Hard: all 5 colors
    } else if (level >= 7) {
      colorCount = 4; // Medium-Hard: 4 colors
    } else {
      colorCount = 3; // Easy: 3 colors
    }

    const shuffledColors = [...COLORS].sort(() => Math.random() - 0.5);
    const palette = shuffledColors.slice(0, colorCount);

    // Alternate structural layouts as level progresses to enhance challenge
    const patternType = level % 3;

    if (patternType === 1) {
      // 1. V-Shape layout (Concentric V bands)
      for (let r = 0; r < initialRows; r++) {
        let cols = this.colsFor(r);
        let centerC = (cols - 1) / 2;
        
        for (let c = 0; c < cols; c++) {
          const distFromCenter = Math.abs(c - centerC);
          const heightFromTip = (initialRows - 1 - r);
          const depth = heightFromTip - distFromCenter;
          
          if (depth >= -1) {
             const bandIndex = Math.floor((depth + 1) / 1.5);
             this.grid[r][c] = palette[bandIndex % palette.length];
          } else {
             this.grid[r][c] = null;
          }
        }
      }
    } else if (patternType === 2) {
      // 2. Honeycomb pattern with strategic pockets
      for (let r = 0; r < initialRows; r++) {
        let cols = this.colsFor(r);
        for (let c = 0; c < cols; c++) {
          // Dynamic checkerboard/pockets for advanced physics bounce shots
          if ((r + c) % 2 === 0 || (r % 3 === 0 && c % 3 === 0)) {
            const idx = Math.floor((r + c) / 2);
            this.grid[r][c] = palette[idx % palette.length];
          } else {
            this.grid[r][c] = null;
          }
        }
      }
    } else {
      // 3. Arch layout hanging from the ceiling
      for (let r = 0; r < initialRows; r++) {
        let cols = this.colsFor(r);
        let centerC = (cols - 1) / 2;
        for (let c = 0; c < cols; c++) {
          const distFromCenter = Math.abs(c - centerC);
          const dist = Math.sqrt(r * r + distFromCenter * distFromCenter);
          if (dist < initialRows - 0.5) {
            const bandIndex = Math.floor(dist / 1.5);
            this.grid[r][c] = palette[bandIndex % palette.length];
          } else {
            this.grid[r][c] = null;
          }
        }
      }
    }

    this.currentColor = this.randomColor(false);
    this.nextColor = this.randomColor(false);
    if (!this.currentColor && palette.length > 0) this.currentColor = palette[0];
    if (!this.nextColor && palette.length > 1) this.nextColor = palette[1];
    if (!this.currentColor) this.currentColor = COLORS[0];
    if (!this.nextColor) this.nextColor = COLORS[1];

    this.onNextColorChange(this.nextColor);

    if (this.reqId) cancelAnimationFrame(this.reqId);
    this.lastTime = performance.now();
    this.reqId = requestAnimationFrame(this.update.bind(this));
  }

  cleanup() {
    if (this.reqId) cancelAnimationFrame(this.reqId);
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
  }

  private isAiming = false;

  private bindEvents() {
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
  }

  private handlePointerDown = (e: PointerEvent) => {
    if (this.gameState !== 'playing') return;
    this.isAiming = true;
    this.updateAim(e);
  };

  private handlePointerMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch' && !this.isAiming) return;
    if (this.gameState !== 'playing') return;
    this.updateAim(e);
  };

  private handlePointerUp = (e: PointerEvent) => {
    if (!this.isAiming) return;
    this.isAiming = false;
    if (this.gameState !== 'playing') return;
    this.updateAim(e);
    this.shoot();
  };

  private updateAim(e: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    this.mouseX = (e.clientX - rect.left) * scaleX;
    this.mouseY = (e.clientY - rect.top) * scaleY;
  }

  private shoot() {
    if (this.gameState !== 'playing') return;
    if (this.flying) return;
    if (this.mouseX === null || this.mouseY === null) return;

    const dx = this.mouseX - this.playerPos.x;
    const dy = this.mouseY - this.playerPos.y;
    let angle = Math.atan2(dy, dx);

    // Limit angle to shoot upwards
    if (angle > -0.1 && angle < Math.PI / 2) angle = -0.1;
    if (angle >= Math.PI / 2 || angle < -Math.PI + 0.1) angle = -Math.PI + 0.1;

    this.flying = {
      x: this.playerPos.x,
      y: this.playerPos.y,
      vx: Math.cos(angle) * SHOOT_SPEED,
      vy: Math.sin(angle) * SHOOT_SPEED,
      color: this.currentColor,
    };
    this.currentColor = this.nextColor;
    this.nextColor = this.randomColor();
    this.onNextColorChange(this.nextColor);
    SoundManager.playShoot();
  }

  private colsFor(r: number) {
    return (r + this.rowParity) % 2 === 0 ? 11 : 10;
  }

  private getCenter(r: number, c: number): Point {
    const isEven = (r + this.rowParity) % 2 === 0;
    return {
      x: c * BUBBLE_DIAM + BUBBLE_RADIUS + (isEven ? 0 : BUBBLE_RADIUS),
      y: r * ROW_HEIGHT + BUBBLE_RADIUS,
    };
  }

  private getNeighbors(r: number, c: number) {
    const isEven = (r + this.rowParity) % 2 === 0;
    const offsets = isEven
      ? [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]]
      : [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]];

    return offsets
      .map(([dr, dc]) => ({ r: r + dr, c: c + dc }))
      .filter((n) => n.r >= 0 && n.r < GRID_ROWS && n.c >= 0 && n.c < this.colsFor(n.r));
  }

  private randomColor(allowAll = false): string {
    if (allowAll) return COLORS[Math.floor(Math.random() * COLORS.length)];
    // Pick from strictly active board colors to prevent unwinnable states
    const active = new Set<string>();
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < this.colsFor(r); c++) {
        if (this.grid[r][c]) active.add(this.grid[r][c]!);
      }
    }
    const arr = Array.from(active);
    if (arr.length === 0) return COLORS[0];
    return arr[Math.floor(Math.random() * arr.length)];
  }

  private update(timestamp: number) {
    // let dt = timestamp - this.lastTime;
    this.lastTime = timestamp;

    if (this.gameState === 'playing') {
      this.updatePhysics();
    }
    this.updateParticles();
    this.draw();

    this.reqId = requestAnimationFrame(this.update.bind(this));
  }

  private updatePhysics() {
    if (this.flying) {
      this.flying.x += this.flying.vx;
      this.flying.y += this.flying.vy;

      let hit = false;
      // Walls
      if (this.flying.x <= BUBBLE_RADIUS) {
        this.flying.x = BUBBLE_RADIUS;
        this.flying.vx *= -1;
        SoundManager.playBounce();
      } else if (this.flying.x >= this.width - BUBBLE_RADIUS) {
        this.flying.x = this.width - BUBBLE_RADIUS;
        this.flying.vx *= -1;
        SoundManager.playBounce();
      }
      
      // Ceiling check
      if (this.flying.y <= BUBBLE_RADIUS) {
        this.flying.y = BUBBLE_RADIUS;
        hit = true;
      } else {
        // Grid Collision
        for (let r = 0; r < GRID_ROWS; r++) {
          for (let c = 0; c < this.colsFor(r); c++) {
            if (this.grid[r][c]) {
              const center = this.getCenter(r, c);
              const dx = center.x - this.flying.x;
              const dy = center.y - this.flying.y;
              if (dx * dx + dy * dy <= (BUBBLE_DIAM * BUBBLE_DIAM) - 4) {
                hit = true;
                break;
              }
            }
          }
          if (hit) break;
        }
      }

      if (hit) {
        this.snapFlying();
      }
    }

    // Falling bubbles update
    for (let i = this.falling.length - 1; i >= 0; i--) {
      let f = this.falling[i];
      f.vy += 0.4; // Gravity
      f.x += f.vx;
      f.y += f.vy;
      if (f.y > this.height + BUBBLE_RADIUS) {
        this.falling.splice(i, 1);
      }
    }
  }

  private snapFlying() {
    if (!this.flying) return;
    
    let bestR = -1, bestC = -1, minD = Infinity;
    
    // Find closest valid empty cell
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < this.colsFor(r); c++) {
        if (!this.grid[r][c]) {
          const center = this.getCenter(r, c);
          const dist = Math.hypot(center.x - this.flying.x, center.y - this.flying.y);
          if (dist < minD) {
             minD = dist;
             bestR = r;
             bestC = c;
          }
        }
      }
    }

    if (bestR !== -1) {
      this.grid[bestR][bestC] = this.flying.color;
      this.processMatches(bestR, bestC);
      
      if (bestR >= GRID_ROWS - 2) {
         this.endGame('gameover');
      } else {
         this.flying = null;
         this.shotsFired++;
         if (this.shotsFired >= this.shotsUntilDrop) {
            this.shotsFired = 0;
            this.dropCeiling();
         }
      }
    }
  }

  private processMatches(sr: number, sc: number) {
    const targetColor = this.grid[sr][sc]!;
    const toVisit = [{ r: sr, c: sc }];
    const visited = new Set<string>();
    const matches: { r: number, c: number }[] = [];

    while (toVisit.length > 0) {
      const curr = toVisit.pop()!;
      const key = `${curr.r},${curr.c}`;
      if (visited.has(key)) continue;
      visited.add(key);
      matches.push(curr);

      const n = this.getNeighbors(curr.r, curr.c);
      for (let adj of n) {
        if (this.grid[adj.r][adj.c] === targetColor) {
           toVisit.push(adj);
        }
      }
    }

    if (matches.length >= 3) {
      SoundManager.playPop();
      matches.forEach(m => {
        this.grid[m.r][m.c] = null;
        let c = this.getCenter(m.r, m.c);
        this.spawnParticles(c.x, c.y, targetColor);
      });
      // Add Score
      this.score += matches.length * 10;
      this.dropFloaters();
    }

    this.onScoreChange(this.score);
  }

  private dropFloaters() {
    const rooted = new Set<string>();
    const toVisit = [];

    for (let c = 0; c < this.colsFor(0); c++) {
      if (this.grid[0][c]) toVisit.push({ r: 0, c });
    }

    while (toVisit.length > 0) {
      const curr = toVisit.pop()!;
      const key = `${curr.r},${curr.c}`;
      if (rooted.has(key)) continue;
      rooted.add(key);

      const n = this.getNeighbors(curr.r, curr.c);
      for (let adj of n) {
        if (this.grid[adj.r][adj.c]) toVisit.push(adj);
      }
    }

    let floatersDropped = 0;
    // Anything not rooted drops
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < this.colsFor(r); c++) {
        if (this.grid[r][c] && !rooted.has(`${r},${c}`)) {
           let col = this.grid[r][c]!;
           this.grid[r][c] = null;
           let p = this.getCenter(r, c);
           this.falling.push({
             x: p.x, y: p.y,
             vx: (Math.random() - 0.5) * 4,
             vy: (Math.random() * 2), // small initial drop speed
             color: col
           });
           floatersDropped++;
        }
      }
    }

    if (floatersDropped > 0) {
      this.score += floatersDropped * 20;
      this.onScoreChange(this.score);
    }
    
    // Check win condition (clear board)
    let anyLeft = false;
    for (let r = 0; r < GRID_ROWS; r++) {
       for (let c = 0; c < this.colsFor(r); c++) {
          if (this.grid[r][c]) { anyLeft = true; break; }
       }
    }
    if (!anyLeft) this.endGame('win');
  }

  private dropCeiling() {
    // Shift grid down
    for (let r = GRID_ROWS - 1; r > 0; r--) {
       this.grid[r] = [...this.grid[r-1]];
    }
    this.rowParity = 1 - this.rowParity;
    
    // Fill top row with random colors
    let topCols = this.colsFor(0);
    this.grid[0] = Array.from({ length: GRID_COLS }, (_, i) => i < topCols ? this.randomColor() : null);

    // Collision risk on drop
    for (let c = 0; c < this.colsFor(GRID_ROWS - 2); c++) {
       if (this.grid[GRID_ROWS - 2][c]) {
          this.endGame('gameover');
          return;
       }
    }
  }

  private endGame(state: 'gameover' | 'win') {
    this.gameState = state;
    if (state === 'gameover') {
      SoundManager.playLose();
      this.onGameOver();
    } else if (state === 'win') {
      SoundManager.playWin();
      this.onWin();
    }
  }

  private spawnParticles(x: number, y: number, color: string) {
    for (let i = 0; i < 8; i++) {
       this.particles.push({
         x, y,
         vx: (Math.random() - 0.5) * 8,
         vy: (Math.random() - 0.5) * 8,
         life: 1.0,
         color,
       });
    }
  }

  private updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
       let p = this.particles[i];
       p.x += p.vx; p.y += p.vy;
       p.life -= 0.04;
       if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  private draw() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw Subtle Background Grid
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    for (let x = 0; x <= this.width; x += 40) { this.ctx.moveTo(x, 0); this.ctx.lineTo(x, this.height); }
    for (let y = 0; y <= this.height; y += 40) { this.ctx.moveTo(0, y); this.ctx.lineTo(this.width, y); }
    this.ctx.stroke();

    // Draw Danger Zone
    const dangerY = (GRID_ROWS - 2) * ROW_HEIGHT + BUBBLE_RADIUS;
    this.ctx.beginPath();
    this.ctx.moveTo(0, dangerY);
    this.ctx.lineTo(this.width, dangerY);
    this.ctx.strokeStyle = 'rgba(255, 0, 100, 0.4)';
    this.ctx.setLineDash([5, 5]);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // Draw Grid
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < this.colsFor(r); c++) {
        const col = this.grid[r][c];
        if (col) {
          const center = this.getCenter(r, c);
          this.drawBubble(center.x, center.y, col);
        }
      }
    }

    // Draw Falling
    for (const f of this.falling) {
      this.drawBubble(f.x, f.y, f.color);
    }

    // Draw Particles
    this.ctx.globalCompositeOperation = 'lighter';
    for (const p of this.particles) {
      if (p.life <= 0) continue;
      this.ctx.globalAlpha = Math.max(0, p.life);
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, BUBBLE_RADIUS * 0.5 * p.life, 0, Math.PI * 2);
      this.ctx.fillStyle = COLOR_MAP[p.color] || '#FFFFFF';
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1.0;
    this.ctx.globalCompositeOperation = 'source-over';

    // Draw Aim Line
    if (this.mouseX !== null && this.mouseY !== null && (this.gameState === 'playing' || this.gameState === 'idle') && !this.flying) {
      const dx = this.mouseX - this.playerPos.x;
      const dy = this.mouseY - this.playerPos.y;
      let angle = Math.atan2(dy, dx);
      if (angle > -0.1 && angle < Math.PI / 2) angle = -0.1;
      if (angle >= Math.PI / 2 || angle < -Math.PI + 0.1) angle = -Math.PI + 0.1;

      let aimX = this.playerPos.x;
      let aimY = this.playerPos.y;
      let aimVx = Math.cos(angle) * 10;
      let aimVy = Math.sin(angle) * 10;

      this.ctx.beginPath();
      this.ctx.moveTo(aimX, aimY);

      let pathLen = 0;
      // Trace path to show reflections
      while (pathLen < 60) {
        aimX += aimVx;
        aimY += aimVy;
        pathLen++;

        if (aimX <= BUBBLE_RADIUS) {
            aimX = BUBBLE_RADIUS;
            aimVx *= -1;
        } else if (aimX >= this.width - BUBBLE_RADIUS) {
            aimX = this.width - BUBBLE_RADIUS;
            aimVx *= -1;
        }
        
        if (aimY <= 0) break; // Reached top

        this.ctx.lineTo(aimX, aimY);
      }
      
      this.ctx.shadowBlur = 15;
      this.ctx.shadowColor = COLOR_MAP[this.currentColor] || '#ffffff';
      this.ctx.strokeStyle = COLOR_MAP[this.currentColor] || '#ffffff';
      this.ctx.lineWidth = 6;
      this.ctx.globalAlpha = 0.5;
      this.ctx.setLineDash([20, 15]);
      this.ctx.lineDashOffset = -performance.now() / 15; // moving dashed effect
      this.ctx.stroke();
      this.ctx.setLineDash([]);
      this.ctx.globalAlpha = 1.0;
      this.ctx.shadowBlur = 0;
    }

    // Draw Flying or Current
    if (this.flying) {
      this.drawBubble(this.flying.x, this.flying.y, this.flying.color);
    } else if (this.gameState === 'playing' || this.gameState === 'idle') {
      this.drawBubble(this.playerPos.x, this.playerPos.y, this.currentColor);
    }

    // Shooter UI indicator
    this.ctx.beginPath();
    this.ctx.arc(this.playerPos.x, this.playerPos.y, BUBBLE_RADIUS + 4, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // Draw Next Bubble
    if (this.gameState === 'playing' || this.gameState === 'idle') {
      const nextX = this.playerPos.x + BUBBLE_RADIUS * 2.5;
      const nextY = this.playerPos.y + 5;
      
      this.drawBubble(nextX, nextY, this.nextColor, 0.5);
      
      // Next bubble ring indicator
      this.ctx.beginPath();
      this.ctx.arc(nextX, nextY, (BUBBLE_RADIUS * 0.5) + 3, 0, Math.PI * 2);
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();

      // Small "NEXT" label
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      this.ctx.font = '10px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('NEXT', nextX, nextY - BUBBLE_RADIUS * 0.5 - 8);
    }
  }

  private drawBubble(x: number, y: number, colorKey: string, scale: number = 1.0) {
    const hex = COLOR_MAP[colorKey] || '#FFFFFF';
    const r = BUBBLE_RADIUS * scale;

    this.ctx.shadowBlur = 0;

    // Solid base color
    this.ctx.beginPath();
    this.ctx.arc(x, y, r, 0, Math.PI * 2);
    this.ctx.fillStyle = hex;
    this.ctx.fill();

    // Subtle stroke outline
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }
}
