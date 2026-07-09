import { useState, useEffect, useRef } from 'react';
import {
  Eye, EyeOff, Lock, Mail, HandCoins, Users, TrendingUp,
} from 'lucide-react';
import { useAuth } from './AuthContext';
import ForgotPasswordModal from './ForgotPasswordModal';
import logo from '../../assets/logo/1.jpeg';

/* ── Canvas de particules (fond panneau gauche) ─────────────────── */
function ParticleCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const particles = [];
    let animId;

    function init() {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      particles.length = 0;
      const n = Math.min(50, Math.floor((canvas.width * canvas.height) / 14000));
      for (let i = 0; i < n; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r: Math.random() * 1.5 + 0.5,
        });
      }
    }

    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      }
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < 110) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(196,138,33,${0.18 * (1 - d / 110)})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(196,138,33,0.65)';
        ctx.fill();
      }
      animId = requestAnimationFrame(frame);
    }

    init(); frame();
    const obs = new ResizeObserver(init);
    obs.observe(canvas);
    return () => { cancelAnimationFrame(animId); obs.disconnect(); };
  }, []);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true" />;
}

/* ── Carte d'aperçu (panneau gauche) ───────────────────────────── */
function PreviewCard() {
  return (
    <div className="rounded-2xl p-5" style={{
      background: 'rgba(255,255,255,0.07)',
      border: '1px solid rgba(255,255,255,0.12)',
      backdropFilter: 'blur(6px)',
    }}>
      <p className="text-xs font-semibold tracking-widest mb-4" style={{ color: '#c48a21' }}>
        APERÇU DU TABLEAU DE BORD
      </p>
      <div className="space-y-3 mb-5">
        {[
          { label: 'Caisse totale', value: '450 000 FCFA', color: '#ffffff' },
          { label: 'Membres actifs', value: '12', color: '#ffffff' },
          { label: 'Prêts approuvés', value: '2', color: '#4ade80' },
          { label: 'Fonds solidarité', value: '75 000 FCFA', color: '#56a7d2' },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex justify-between items-center">
            <span style={{ color: '#98afc0', fontSize: '12px' }}>{label}</span>
            <span style={{ color, fontWeight: 700, fontSize: '13px' }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Mini graphique en barres */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px' }}>
        <p style={{ color: '#98afc0', fontSize: '11px', marginBottom: '8px' }}>Cotisations · 6 derniers mois</p>
        <div className="flex items-end gap-1.5" style={{ height: '40px' }}>
          {[55, 80, 68, 100, 75, 92].map((h, i) => (
            <div key={i} className="flex-1 rounded-t transition-all" style={{
              height: `${h}%`,
              background: i === 5 ? '#c48a21' : 'rgba(196,138,33,0.32)',
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Page de connexion (layout 2 colonnes) ──────────────────────── */
const LandingPage = () => {
  const { login } = useAuth();
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [error, setError]         = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Veuillez renseigner votre email et votre mot de passe.');
      return;
    }
    setSubmitting(true);
    const result = await login(email.trim(), password);
    if (!result.success) setError(result.message);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex" style={{ overflowX: 'hidden' }}>

      {/* ── Panneau gauche (desktop uniquement) ── */}
      <div
        className="hidden md:flex md:w-[42%] lg:w-[44%] relative flex-col justify-between p-10"
        style={{ background: 'linear-gradient(160deg, #09324e 0%, #0c3d58 60%, #09324e 100%)' }}
      >
        <ParticleCanvas />

        {/* Contenu relatif (au-dessus du canvas) */}
        <div className="relative z-10 flex flex-col h-full">

          {/* Logo + nom */}
          <div className="flex items-center gap-3 mb-12">
            <img src={logo} alt="Logo" className="w-11 h-11 rounded-xl object-cover shadow-lg" />
            <div>
              <p className="font-playfair font-bold text-white text-lg leading-none">
                Caisse <span style={{ color: '#c48a21' }}>ÉMERGENCE</span>
              </p>
              <p className="text-xs" style={{ color: '#98afc0' }}>Épargne · Crédit · Solidarité</p>
            </div>
          </div>

          {/* Message d'accueil */}
          <div className="mb-8">
            <h1 className="font-playfair font-bold text-white mb-3" style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)' }}>
              Bienvenue !
            </h1>
            <p style={{ color: '#cfe0ea', fontSize: '14px', lineHeight: '1.7', maxWidth: '340px' }}>
              Gérez les cotisations, prêts et fonds de solidarité de votre caisse — simplement, depuis n'importe quel appareil.
            </p>
          </div>

          {/* Carte d'aperçu */}
          <PreviewCard />

          {/* Icônes de fonctionnalités en bas */}
          <div className="mt-auto pt-10 flex gap-6">
            {[
              { icon: HandCoins, label: 'Cotisations' },
              { icon: TrendingUp, label: 'Prêts' },
              { icon: Users, label: 'Membres' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(196,138,33,0.18)' }}>
                  <Icon size={18} style={{ color: '#c48a21' }} />
                </div>
                <span style={{ color: '#98afc0', fontSize: '11px' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Panneau droit — formulaire de connexion ── */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-[420px]">

          {/* Logo mobile (visible seulement en dessous de md) */}
          <div className="flex items-center gap-3 mb-10 md:hidden justify-center">
            <img src={logo} alt="Logo" className="w-12 h-12 rounded-xl object-cover" />
            <div>
              <p className="font-playfair font-bold text-lg leading-none" style={{ color: '#09324e' }}>
                Caisse <span style={{ color: '#c48a21' }}>ÉMERGENCE</span>
              </p>
              <p className="text-xs" style={{ color: '#98afc0' }}>Épargne · Crédit · Solidarité</p>
            </div>
          </div>

          {/* Titre */}
          <div className="mb-8">
            <h2 className="font-playfair font-bold text-2xl sm:text-3xl mb-2" style={{ color: '#09324e' }}>
              Connexion à votre compte
            </h2>
            <p className="text-sm" style={{ color: '#98afc0' }}>
              Connectez-vous à votre espace membre
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                Adresse email
              </label>
              <div className="relative">
                <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }} />
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input"
                  style={{ paddingLeft: '2.6rem' }}
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>
                Mot de passe
              </label>
              <div className="relative">
                <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }} />
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input"
                  style={{ paddingLeft: '2.6rem', paddingRight: '2.8rem' }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
                  style={{ color: '#9ca3af' }}
                >
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="alert-info bg-red-50">
                <div className="bar" style={{ backgroundColor: '#f87171' }} />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl font-semibold text-base transition-all disabled:opacity-60 hover:opacity-90 active:scale-[0.98]"
              style={{ background: '#09324e', color: '#fff' }}
            >
              {submitting ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          {/* Liens secondaires */}
          <div className="mt-5 text-center">
            <button
              onClick={() => setShowForgot(true)}
              className="text-sm hover:underline transition-colors"
              style={{ color: '#98afc0' }}
            >
              Mot de passe oublié ?
            </button>
          </div>

          {/* Séparateur */}
          <div className="my-8 flex items-center gap-4">
            <div className="flex-1 h-px" style={{ background: 'rgba(11,58,90,0.08)' }} />
            <span className="text-xs" style={{ color: '#c2cdd6' }}>Accès réservé aux membres</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(11,58,90,0.08)' }} />
          </div>

          {/* Bouton or — accès visuel */}
          <button
            onClick={() => {}} // action future ou déco
            className="w-full py-3 rounded-xl font-semibold text-sm border-2 transition-all hover:bg-gold/5 active:scale-[0.98]"
            style={{ borderColor: '#c48a21', color: '#c48a21' }}
          >
            Caisse Émergence · Kara, Togo
          </button>

          <p className="text-xs text-center mt-8 leading-relaxed" style={{ color: '#c2cdd6' }}>
            Le secrétaire enregistre les membres et leur envoie leurs identifiants par email.
          </p>
        </div>
      </div>

      {/* Modal mot de passe oublié */}
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
    </div>
  );
};

export default LandingPage;
