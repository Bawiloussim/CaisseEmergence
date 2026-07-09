import { useEffect, useRef } from 'react';

/**
 * Spinner orbital canvas : sphère dorée animée sur fond sombre avec
 * graines dispersées — inspiré du style NovaBulletin.
 */
const LoadingSpinner = ({ label = 'Chargement…' }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let t = 0;
    let seeds = [];

    function init() {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const W = canvas.width, H = canvas.height;

      // Génération des graines (formes elliptiques dispersées)
      seeds = [];
      const n = Math.floor((W * H) / 1800);
      for (let i = 0; i < n; i++) {
        seeds.push({
          x: Math.random() * W,
          y: Math.random() * H,
          angle: Math.random() * Math.PI,
          rw: 1.5 + Math.random() * 1.5,
          rh: 4 + Math.random() * 5,
          a: 0.07 + Math.random() * 0.13,
        });
      }
    }

    function frame() {
      const W = canvas.width, H = canvas.height;
      t += 0.022;

      // Fond sombre
      ctx.fillStyle = '#091929';
      ctx.fillRect(0, 0, W, H);

      // Graines dispersées
      for (const s of seeds) {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.angle);
        ctx.beginPath();
        ctx.ellipse(0, 0, s.rw, s.rh, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(86,167,210,${s.a})`;
        ctx.lineWidth = 0.9;
        ctx.stroke();
        ctx.restore();
      }

      // ── Orbital ──────────────────────────────────────────────
      const cx = W / 2;
      const cy = H * 0.42;
      const rx = Math.min(W * 0.3, 110);
      const ry = rx * 0.38;

      // Piste elliptique
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(196,138,33,0.22)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // Position de la sphère sur l'ellipse
      const sx = cx + Math.cos(t) * rx;
      const sy = cy + Math.sin(t) * ry;

      // Halo lumineux (glow)
      const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 30);
      glow.addColorStop(0,   'rgba(255,140,30,0.85)');
      glow.addColorStop(0.4, 'rgba(255,100,0,0.4)');
      glow.addColorStop(1,   'rgba(255,60,0,0)');
      ctx.beginPath();
      ctx.arc(sx, sy, 30, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Noyau de la sphère
      const core = ctx.createRadialGradient(sx - 2, sy - 2, 1, sx, sy, 10);
      core.addColorStop(0,   '#ffd060');
      core.addColorStop(0.5, '#ff8c00');
      core.addColorStop(1,   '#cc4400');
      ctx.beginPath();
      ctx.arc(sx, sy, 10, 0, Math.PI * 2);
      ctx.fillStyle = core;
      ctx.fill();

      animId = requestAnimationFrame(frame);
    }

    init();
    frame();

    const obs = new ResizeObserver(init);
    obs.observe(canvas);
    return () => { cancelAnimationFrame(animId); obs.disconnect(); };
  }, []);

  return (
    <div className="relative w-full" style={{ minHeight: '55vh' }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
        style={{ borderRadius: '12px' }}
      />
      {label && (
        <p
          className="absolute left-1/2 -translate-x-1/2 text-sm font-medium"
          style={{ bottom: '18%', color: '#98afc0', letterSpacing: '0.04em' }}
        >
          {label}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
