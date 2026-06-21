// ═══════════════════════════════════════════════
//   SPACE CANVAS: Stars, Planets, Nebula
// ═══════════════════════════════════════════════

const canvas = document.getElementById('spaceCanvas');
const ctx = canvas.getContext('2d');

let W, H, stars = [], planets = [], nebulas = [], meteors = [];
let animFrame;

// ── RESIZE ──
function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  initScene();
}

// ── STAR CLASS ──
class Star {
  constructor() { this.reset(); }
  reset() {
    this.x = Math.random() * W;
    this.y = Math.random() * H;
    this.r = Math.random() * 1.5 + 0.2;
    this.baseAlpha = Math.random() * 0.7 + 0.3;
    this.alpha = this.baseAlpha;
    this.twinkleSpeed = Math.random() * 0.02 + 0.005;
    this.twinklePhase = Math.random() * Math.PI * 2;
    this.color = this.pickColor();
  }
  pickColor() {
    const cols = ['255,255,255', '200,220,255', '255,230,200', '180,200,255', '0,229,255'];
    return cols[Math.floor(Math.random() * cols.length)];
  }
  update(t) {
    this.alpha = this.baseAlpha * (0.6 + 0.4 * Math.sin(t * this.twinkleSpeed * 60 + this.twinklePhase));
  }
  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgb(${this.color})`;
    ctx.fill();
    // Glow for larger stars
    if (this.r > 1) {
      ctx.globalAlpha = this.alpha * 0.3;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 3, 0, Math.PI * 2);
      const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * 3);
      g.addColorStop(0, `rgba(${this.color},0.4)`);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.fill();
    }
    ctx.restore();
  }
}

// ── PLANET CLASS ──
class Planet {
  constructor(x, y, r, color, ringColor, hasRing) {
    this.x = x; this.y = y; this.r = r;
    this.color = color; this.ringColor = ringColor;
    this.hasRing = hasRing;
    this.alpha = 0.15 + Math.random() * 0.2;
    this.pulse = Math.random() * Math.PI * 2;
  }
  draw(t) {
    ctx.save();
    const pAlpha = this.alpha * (0.9 + 0.1 * Math.sin(t * 0.5 + this.pulse));
    ctx.globalAlpha = pAlpha;

    // Ring (behind)
    if (this.hasRing) {
      ctx.save();
      ctx.globalAlpha = pAlpha * 0.5;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, this.r * 2.2, this.r * 0.35, -0.3, 0, Math.PI * 2);
      ctx.strokeStyle = this.ringColor;
      ctx.lineWidth = this.r * 0.18;
      ctx.stroke();
      ctx.restore();
    }

    // Planet body
    const g = ctx.createRadialGradient(
      this.x - this.r * 0.3, this.y - this.r * 0.3, 0,
      this.x, this.y, this.r
    );
    g.addColorStop(0, this.color.light);
    g.addColorStop(1, this.color.dark);

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();

    // Atmosphere glow
    ctx.globalAlpha = pAlpha * 0.2;
    const ag = ctx.createRadialGradient(this.x, this.y, this.r * 0.8, this.x, this.y, this.r * 1.4);
    ag.addColorStop(0, this.color.glow);
    ag.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r * 1.4, 0, Math.PI * 2);
    ctx.fillStyle = ag;
    ctx.fill();

    ctx.restore();
  }
}

// ── NEBULA CLASS ──
class Nebula {
  constructor() {
    this.x = Math.random() * W;
    this.y = Math.random() * H;
    this.r = 80 + Math.random() * 180;
    this.colors = [
      `rgba(0,229,255,${0.02 + Math.random() * 0.04})`,
      `rgba(124,58,237,${0.02 + Math.random() * 0.04})`,
      `rgba(16,185,129,${0.01 + Math.random() * 0.02})`
    ];
    this.color = this.colors[Math.floor(Math.random() * this.colors.length)];
  }
  draw() {
    const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r);
    g.addColorStop(0, this.color);
    g.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
  }
}

// ── METEOR CLASS ──
class Meteor {
  constructor() { this.reset(); }
  reset() {
    this.x = Math.random() * W;
    this.y = -20;
    this.len = 80 + Math.random() * 120;
    this.speed = 4 + Math.random() * 6;
    this.angle = Math.PI / 6 + Math.random() * (Math.PI / 9);
    this.alpha = 0;
    this.life = 0;
    this.maxLife = 80 + Math.random() * 60;
    this.active = false;
    this.delay = Math.random() * 600;
  }
  update() {
    if (this.delay > 0) { this.delay--; return; }
    if (!this.active) { this.active = true; this.life = 0; }
    this.life++;
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;
    if (this.life < 15) this.alpha = this.life / 15;
    else if (this.life > this.maxLife - 15) this.alpha = (this.maxLife - this.life) / 15;
    else this.alpha = 1;
    if (this.life >= this.maxLife || this.x > W + 100 || this.y > H + 100) this.reset();
  }
  draw() {
    if (!this.active || this.delay > 0) return;
    ctx.save();
    ctx.globalAlpha = this.alpha * 0.7;
    const x2 = this.x - Math.cos(this.angle) * this.len;
    const y2 = this.y - Math.sin(this.angle) * this.len;
    const g = ctx.createLinearGradient(x2, y2, this.x, this.y);
    g.addColorStop(0, 'transparent');
    g.addColorStop(1, 'rgba(200,240,255,0.9)');
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(this.x, this.y);
    ctx.strokeStyle = g;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }
}

// ── INIT SCENE ──
function initScene() {
  const starCount = Math.floor((W * H) / 3000);
  stars = Array.from({ length: starCount }, () => new Star());

  nebulas = Array.from({ length: 8 }, () => new Nebula());

  planets = [
    new Planet(W * 0.85, H * 0.18, 45,
      { light: '#3a5a8a', dark: '#0d1b3e', glow: '#4a8aff' },
      'rgba(100,150,255,0.4)', true),
    new Planet(W * 0.08, H * 0.72, 28,
      { light: '#7a5a3a', dark: '#3a1a0a', glow: '#ff9944' },
      null, false),
    new Planet(W * 0.92, H * 0.8, 18,
      { light: '#3a7a5a', dark: '#0a2a1a', glow: '#44ff99' },
      null, false),
  ];

  meteors = Array.from({ length: 5 }, () => new Meteor());
}

// ── ANIMATION LOOP ──
let lastT = 0;
function animate(t) {
  const dt = (t - lastT) / 1000;
  lastT = t;

  ctx.clearRect(0, 0, W, H);

  // Background gradient
  const bg = ctx.createRadialGradient(W * 0.5, H * 0.3, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.8);
  bg.addColorStop(0, '#0d1b3e');
  bg.addColorStop(0.5, '#080d1e');
  bg.addColorStop(1, '#050810');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Nebulas
  nebulas.forEach(n => n.draw());

  // Stars
  stars.forEach(s => { s.update(t / 1000); s.draw(); });

  // Planets
  planets.forEach(p => p.draw(t / 1000));

  // Meteors
  meteors.forEach(m => { m.update(); m.draw(); });

  animFrame = requestAnimationFrame(animate);
}

window.addEventListener('resize', resize);
resize();
requestAnimationFrame(animate);