import { useEffect, useRef } from 'react';

/**
 * Spinner de chargement animé avec canvas.
 * Affiche deux anneaux concentriques qui tournent en sens opposés
 * aux couleurs de la marque (or / marine), plus un point central pulsant.
 *
 * @param {string} label  - Texte affiché sous le spinner (ex. "Chargement…")
 * @param {number} size   - Taille du canvas en px (défaut 72)
 */
const LoadingSpinner = ({ label = 'Chargement…', size = 72 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const r = size / 2;
    let animId;
    let t = 0;

    function draw() {
      t += 0.035;
      ctx.clearRect(0, 0, size, size);

      // Anneau extérieur — or, tourne dans le sens horaire
      const gapOuter = Math.PI * 0.35;
      ctx.beginPath();
      ctx.arc(r, r, r - 4, t, t + Math.PI * 2 - gapOuter);
      ctx.strokeStyle = '#c48a21';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Anneau intérieur — marine, tourne en sens inverse
      const gapInner = Math.PI * 0.5;
      ctx.beginPath();
      ctx.arc(r, r, r - 13, -t * 1.4, -t * 1.4 + Math.PI * 2 - gapInner);
      ctx.strokeStyle = '#09324e';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Point central pulsant
      const pulse = 0.5 + 0.5 * Math.sin(t * 3);
      const pr = 3 + pulse * 2;
      ctx.beginPath();
      ctx.arc(r, r, pr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(196,138,33,${0.5 + pulse * 0.5})`;
      ctx.fill();

      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animId);
  }, [size]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        aria-hidden="true"
      />
      {label && (
        <p className="text-sm font-medium animate-pulse" style={{ color: '#98afc0' }}>
          {label}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
