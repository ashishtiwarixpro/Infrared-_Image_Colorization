// ═══════════════════════════════════════════════
//   MAIN.JS — Nav, Scroll Reveal, Interactions
// ═══════════════════════════════════════════════

// ── NAVIGATION ──
const navHTML = `
<nav>
  <a href="#home" class="nav-brand">IR<span style="color:var(--accent)">·</span>Intel</a>
  <div class="nav-links">
    <a href="#overview">Overview</a>
    <a href="#pipeline">Pipeline</a>
    <a href="#demo">Demo</a>
    <a href="#dataset">Dataset</a>
    <a href="#tech">Tech Stack</a>
    <a href="#evaluation">Metrics</a>
  </div>
</nav>`;

document.body.insertAdjacentHTML('afterbegin', navHTML);

// ── SCROLL REVEAL ──
const revealEls = document.querySelectorAll(
  '.ov-card, .pipe-step, .ds-card, .eval-card, .tech-col, .section-title, .section-desc, .demo-box'
);

revealEls.forEach(el => el.classList.add('reveal'));

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), 80);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

revealEls.forEach(el => observer.observe(el));

// Stagger cards in grid
document.querySelectorAll('.ov-card, .eval-card, .ds-card').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 4) * 0.1}s`;
});

// ── ACTIVE NAV HIGHLIGHT ──
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(a => a.style.color = '');
      const active = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
      if (active) active.style.color = 'var(--accent)';
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => sectionObserver.observe(s));

// ── PIPE STEP HOVER ──
document.querySelectorAll('.pipe-step').forEach(step => {
  step.addEventListener('mouseenter', () => {
    step.querySelector('.pipe-num').style.color = 'rgba(0,229,255,0.7)';
  });
  step.addEventListener('mouseleave', () => {
    step.querySelector('.pipe-num').style.color = 'rgba(0,229,255,0.2)';
  });
});

// ── SMOOTH ANCHOR ──
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ── EVAL BARS ANIMATE ON VIEW ──
const evalBars = document.querySelectorAll('.eval-fill');
const barObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const width = el.style.width;
      el.style.width = '0';
      setTimeout(() => { el.style.width = width; }, 100);
      barObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });
evalBars.forEach(b => barObserver.observe(b));