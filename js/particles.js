// ============================================================
// PARTIKEL LATAR BELAKANG (Canvas)
// ============================================================

const canvas = document.getElementById('particles-canvas');
if (!canvas) {
  console.log('Particles canvas disabled for neobrutalism theme');
} 
const ctx = canvas ? canvas.getContext('2d') : null;
let particles = [];

function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
if (canvas) {
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
}

class Particle {
    constructor() { this.reset(); }
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.5 + 0.1;
        this.hue = Math.random() * 60 + 270;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset();
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 70%, 60%, ${this.opacity})`;
        ctx.fill();
    }
}

if (canvas) {
  for (let i = 0; i < 60; i++) particles.push(new Particle());

  function animateParticles() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      particles.forEach((p1, i) => {
          particles.slice(i + 1).forEach(p2 => {
              const dx = p1.x - p2.x, dy = p1.y - p2.y, dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 100) {
                  ctx.beginPath();
                  ctx.moveTo(p1.x, p1.y);
                  ctx.lineTo(p2.x, p2.y);
                  ctx.strokeStyle = `hsla(280, 70%, 60%, ${0.1 * (1 - dist / 100)})`;
                  ctx.lineWidth = 0.5;
                  ctx.stroke();
              }
          });
      });
      requestAnimationFrame(animateParticles);
  }
  animateParticles();
}
