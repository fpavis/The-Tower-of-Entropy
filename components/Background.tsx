import React, { useEffect, useRef } from 'react';

interface BackgroundProps {
  accentRgb: string; // "r,g,b"
  danger: number; // 0..1 – how close to running dry
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  a: number;
}

const COUNT = 70;

/** A drifting field of "order" particles that frays into red noise as energy runs out. */
const Background: React.FC<BackgroundProps> = ({ accentRgb, danger }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef({ accentRgb, danger });
  propsRef.current = { accentRgb, danger };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const particles: Particle[] = Array.from({ length: COUNT }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.25,
      vy: -0.1 - Math.random() * 0.3,
      r: 0.6 + Math.random() * 1.8,
      a: 0.15 + Math.random() * 0.45,
    }));

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 16.67, 3);
      last = now;
      const { accentRgb: rgb, danger: d } = propsRef.current;
      ctx.clearRect(0, 0, w, h);

      const [ar, ag, ab] = rgb.split(',').map(Number);
      const cr = Math.round(ar + (239 - ar) * d);
      const cg = Math.round(ag + (68 - ag) * d);
      const cb = Math.round(ab + (68 - ab) * d);

      for (const p of particles) {
        const speed = 1 + d * 3;
        p.x += (p.vx + (Math.random() - 0.5) * d * 1.6) * dt * speed;
        p.y += (p.vy + (Math.random() - 0.5) * d * 1.2) * dt * speed;
        if (p.y < -5) p.y = h + 5;
        if (p.y > h + 5) p.y = -5;
        if (p.x < -5) p.x = w + 5;
        if (p.x > w + 5) p.x = -5;
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${p.a})`;
        ctx.fillRect(p.x, p.y, p.r, p.r * (1 + d * 2));
      }

      // faint connecting lines between close particles while things are still orderly
      if (d < 0.5) {
        ctx.lineWidth = 1;
        for (let i = 0; i < particles.length; i += 2) {
          for (let j = i + 1; j < particles.length; j += 3) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = dx * dx + dy * dy;
            if (dist < 7000) {
              ctx.strokeStyle = `rgba(${cr},${cg},${cb},${(1 - dist / 7000) * 0.12 * (1 - d * 2)})`;
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.stroke();
            }
          }
        }
      }

      // glitch bars when critically low
      if (d > 0.6 && Math.random() < 0.08) {
        ctx.fillStyle = `rgba(239,68,68,${0.04 + Math.random() * 0.06})`;
        ctx.fillRect(0, Math.random() * h, w, 2 + Math.random() * 10);
      }

      if (!reduced) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none -z-10" aria-hidden />;
};

export default Background;
