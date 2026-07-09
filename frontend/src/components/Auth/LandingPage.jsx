import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Eye, EyeOff, Lock, Mail, X, TrendingUp, HandCoins, Users, ShieldCheck,
  ChevronLeft, ChevronRight, Sparkles, Phone, MapPin, Menu, ArrowLeft,
} from 'lucide-react';
import { useAuth } from './AuthContext';
import ForgotPasswordModal from './ForgotPasswordModal';
import logo from '../../assets/logo/1.jpeg';

/* ════════════════════════════════════════════════════════════════
   CANVAS — particules dorées (utilisé dans le hero ET le panneau gauche login)
   ════════════════════════════════════════════════════════════════ */
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
      const n = Math.min(55, Math.floor((canvas.width * canvas.height) / 13000));
      for (let i = 0; i < n; i++) {
        particles.push({
          x: Math.random() * canvas.width,  y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.38, vy: (Math.random() - 0.5) * 0.38,
          r: Math.random() * 1.6 + 0.5,
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
          if (d < 115) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(196,138,33,${0.2 * (1 - d / 115)})`;
            ctx.lineWidth = 0.7; ctx.stroke();
          }
        }
      }
      for (const p of particles) {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(196,138,33,0.7)'; ctx.fill();
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

/* ════════════════════════════════════════════════════════════════
   COMPOSANTS RÉUTILISABLES DE LA LANDING PAGE
   ════════════════════════════════════════════════════════════════ */
function FeatureCard({ icon: Icon, title, description, accent }) {
  return (
    <div className="rounded-2xl p-7 flex flex-col gap-4"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: accent + '22' }}>
        <Icon size={24} style={{ color: accent }} />
      </div>
      <h3 className="font-playfair text-xl font-bold text-white">{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: '#98afc0' }}>{description}</p>
    </div>
  );
}

function ValuePill({ label, sub }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="px-6 py-2 rounded-full font-bold text-sm tracking-widest"
        style={{ background: '#c48a21', color: '#072434' }}>{label}</div>
      <p className="text-xs text-center max-w-40" style={{ color: '#98afc0' }}>{sub}</p>
    </div>
  );
}

function StepCard({ number, title, text }) {
  return (
    <div className="flex gap-5 items-start">
      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm"
        style={{ background: '#c48a21', color: '#072434' }}>{number}</div>
      <div>
        <h4 className="font-semibold text-white mb-1">{title}</h4>
        <p className="text-sm leading-relaxed" style={{ color: '#98afc0' }}>{text}</p>
      </div>
    </div>
  );
}

const SLIDES = [
  { tag: '01', title: 'ÉPARGNE',    caption: 'Cotisez chaque mois en toute sérénité et suivez votre épargne en temps réel.' },
  { tag: '02', title: 'PRÊTS',      caption: "Accédez à un crédit jusqu'à 150 % de votre épargne accumulée." },
  { tag: '03', title: 'SOLIDARITÉ', caption: "L'entraide communautaire au cœur de chaque décision de la caisse." },
];

const INFO_ITEMS = [
  { icon: ShieldCheck, caption: 'ESPACE SÉCURISÉ',      sub: 'Connexion protégée par mot de passe' },
  { icon: HandCoins,   caption: 'COTISATIONS FLEXIBLES', sub: 'Montant variable chaque mois' },
  { icon: Users,       caption: 'GESTION SIMPLIFIÉE',    sub: 'Rôles secrétaire & membres' },
];

/* ════════════════════════════════════════════════════════════════
   VUE 1 — PAGE DE PRÉSENTATION (landing)
   ════════════════════════════════════════════════════════════════ */
function MarketingPage({ onLogin }) {
  const [slide, setSlide] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const next = useCallback(() => setSlide(s => (s + 1) % SLIDES.length), []);
  const prev = () => setSlide(s => (s - 1 + SLIDES.length) % SLIDES.length);

  useEffect(() => {
    const id = setInterval(next, 6000);
    return () => clearInterval(id);
  }, [next]);

  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="min-h-screen font-inter" style={{ background: '#09324e', overflowX: 'hidden' }}>

      {/* Barre supérieure */}
      <div className="hidden sm:flex items-center justify-between px-8 text-xs"
        style={{ background: '#072434', color: '#98afc0', height: '38px' }}>
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5"><Mail size={13} /> bawiloussimngbabou1@gmail.com</span>
          <span className="flex items-center gap-1.5"><Phone size={13} /> +228 98462796</span>
        </div>
        <span className="flex items-center gap-1.5"><MapPin size={13} /> Kara, Togo</span>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-40 px-4 sm:px-8 py-3"
        style={{ background: 'rgba(9,50,78,0.97)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <img src={logo} alt="Logo" className="w-10 h-10 rounded-lg object-cover shrink-0" />
            <div className="min-w-0">
              <span className="font-playfair font-bold text-white text-base sm:text-lg leading-none block truncate">
                Caisse <span style={{ color: '#c48a21' }}>ÉMERGENCE</span>
              </span>
              <span className="text-xs tracking-widest hidden sm:block" style={{ color: '#98afc0' }}>
                INNOVATION · CROISSANCE · CONFIANCE
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: '#cfe0ea' }}>
            {[['Accueil','hero'],['Services','services'],['Comment ça marche','comment'],['Valeurs','valeurs']].map(([lbl, id]) => (
              <button key={id} onClick={() => scrollTo(id)} className="hover:text-white transition-colors">{lbl}</button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button onClick={onLogin}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
              style={{ background: '#c48a21', color: '#072434' }}>
              <span className="hidden sm:inline">Se connecter</span>
              <span className="sm:hidden">Connexion</span>
              <ChevronRight size={14} />
            </button>
            <button onClick={() => setMobileMenuOpen(v => !v)} aria-label="Menu"
              className="md:hidden p-2 rounded-full hover:bg-white/10 transition-colors text-white">
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden flex flex-col gap-1 pt-3 pb-1 text-sm font-medium" style={{ color: '#cfe0ea' }}>
            {[['Accueil','hero'],['Services','services'],['Comment ça marche','comment'],['Valeurs','valeurs']].map(([lbl, id]) => (
              <button key={id} onClick={() => { scrollTo(id); setMobileMenuOpen(false); }}
                className="text-left px-2 py-2.5 rounded hover:bg-white/5 hover:text-white transition-colors">{lbl}</button>
            ))}
          </div>
        )}
      </nav>

      {/* Hero slider avec canvas */}
      <section id="hero" className="relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #09324e 0%, #135c60 65%, #09324e 100%)' }}>
        <ParticleCanvas />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-150 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #c48a21 0%, transparent 70%)' }} />

        <div className="relative min-h-105 sm:min-h-120 flex items-center px-5 sm:px-10 md:px-20 py-14 sm:py-20">
          <button onClick={prev} aria-label="Précédent"
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 items-center justify-center w-12 h-12 rounded-full hover:bg-white/10">
            <ChevronLeft size={30} color="#98afc0" />
          </button>
          <button onClick={next} aria-label="Suivant"
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 items-center justify-center w-12 h-12 rounded-full hover:bg-white/10">
            <ChevronRight size={30} color="#98afc0" />
          </button>

          <div className="max-w-xl w-full">
            <div className="flex items-baseline gap-3 sm:gap-4 mb-4 flex-wrap">
              <span className="font-playfair font-bold text-white leading-none"
                style={{ fontSize: 'clamp(2.5rem,10vw,5rem)' }}>{SLIDES[slide].tag}</span>
              <span className="font-playfair font-bold leading-tight"
                style={{ fontSize: 'clamp(1.1rem,5vw,2rem)', color: '#c48a21' }}>{SLIDES[slide].title}</span>
            </div>
            <p className="text-sm sm:text-base leading-relaxed mb-8" style={{ color: '#cfe0ea', maxWidth: '420px' }}>
              {SLIDES[slide].caption}
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={onLogin}
                className="flex items-center gap-2 px-5 sm:px-7 py-3.5 rounded-full font-bold text-sm shadow-xl hover:scale-105 active:scale-95 transition-all"
                style={{ background: '#c48a21', color: '#072434' }}>
                <Sparkles size={15} /> Accéder à l'espace membres
              </button>
              <button onClick={() => scrollTo('services')}
                className="flex items-center gap-2 px-5 sm:px-7 py-3.5 rounded-full font-bold text-sm border-2 hover:bg-white/5 transition-all"
                style={{ borderColor: 'rgba(255,255,255,0.35)', color: '#fff' }}>
                En savoir plus
              </button>
            </div>
            <div className="flex gap-2 mt-10">
              {SLIDES.map((_, i) => (
                <button key={i} onClick={() => setSlide(i)} aria-label={`Slide ${i + 1}`}
                  className="h-1.5 rounded-full transition-all"
                  style={{ width: i === slide ? '28px' : '10px', background: i === slide ? '#c48a21' : 'rgba(255,255,255,0.25)' }} />
              ))}
            </div>
          </div>
        </div>

        {/* Bandeau or */}
        <div style={{ background: '#c48a21' }}>
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/25">
            {INFO_ITEMS.map(({ icon: Icon, caption, sub }) => (
              <div key={caption} className="flex items-center gap-4 px-8 py-5 justify-center sm:justify-start">
                <Icon size={28} color="#072434" className="shrink-0" />
                <div>
                  <div className="font-bold text-sm tracking-wide" style={{ color: '#072434' }}>{caption}</div>
                  <div className="text-xs" style={{ color: '#072434', opacity: 0.75 }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="px-5 sm:px-6 py-20 sm:py-24 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs tracking-widest font-semibold mb-3" style={{ color: '#c48a21' }}>NOS SERVICES</p>
          <h2 className="font-playfair font-bold text-white text-3xl sm:text-4xl">Tout ce dont votre caisse a besoin</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard icon={HandCoins} accent="#c48a21" title="Épargne & Cotisations"
            description="Suivez les cotisations mensuelles de chaque membre, visualisez les paiements en temps réel et exportez les bulletins en PDF." />
          <FeatureCard icon={TrendingUp} accent="#56a7d2" title="Prêts & Crédits"
            description="Gérez les demandes de prêt, calculez les plafonds selon l'épargne accumulée, et générez automatiquement les contrats à signer." />
          <FeatureCard icon={Users} accent="#4ade80" title="Solidarité & Entraide"
            description="Gérez le fonds de solidarité, enregistrez les aides accordées et gardez un historique complet des actions communautaires." />
        </div>
      </section>

      {/* Comment ça marche */}
      <section id="comment" className="px-5 sm:px-6 py-20" style={{ background: 'rgba(0,0,0,0.15)' }}>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div>
            <p className="text-xs tracking-widest font-semibold mb-3" style={{ color: '#c48a21' }}>COMMENT ÇA MARCHE</p>
            <h2 className="font-playfair font-bold text-white text-3xl mb-10">Simple, rapide et sécurisé</h2>
            <div className="flex flex-col gap-8">
              <StepCard number="1" title="Le secrétaire enregistre les membres"
                text="Chaque membre reçoit automatiquement un email avec ses identifiants de connexion temporaires." />
              <StepCard number="2" title="Le membre se connecte et configure son compte"
                text="À la première connexion, il choisit son propre nom, email et mot de passe sécurisé." />
              <StepCard number="3" title="Suivi en temps réel"
                text="Cotisations, prêts, solidarité — tout est centralisé et accessible depuis n'importe quel appareil." />
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {[
              { icon: ShieldCheck, label: 'Accès sécurisé par mot de passe', color: '#56a7d2' },
              { icon: HandCoins,   label: 'Cotisations variables par mois',   color: '#c48a21' },
              { icon: TrendingUp,  label: 'Plafond de prêt calculé automatiquement', color: '#4ade80' },
              { icon: Users,       label: 'Rôles secrétaire & membre',         color: '#c48a21' },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-4 px-5 py-4 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: color + '22' }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <span className="text-sm text-white font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Valeurs */}
      <section id="valeurs" className="px-5 sm:px-6 py-20 sm:py-24 text-center max-w-3xl mx-auto">
        <p className="text-xs tracking-widest font-semibold mb-3" style={{ color: '#c48a21' }}>NOS VALEURS</p>
        <h2 className="font-playfair font-bold text-white text-3xl sm:text-4xl mb-14">Ce qui nous définit</h2>
        <div className="flex flex-col sm:flex-row justify-center gap-10">
          <ValuePill label="INNOVATION" sub="Des outils modernes pour gérer votre caisse sans effort." />
          <ValuePill label="CROISSANCE" sub="Construire ensemble une épargne collective solide." />
          <ValuePill label="CONFIANCE"  sub="Transparence totale sur chaque franc cotisé et prêté." />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-4 sm:mx-6 mb-20 rounded-3xl px-6 sm:px-10 py-12 sm:py-16 text-center"
        style={{ background: 'linear-gradient(135deg, #135c60, #09324e)', border: '1px solid rgba(196,138,33,0.25)' }}>
        <h2 className="font-playfair font-bold text-white text-2xl sm:text-3xl mb-4">Prêt à rejoindre la caisse ?</h2>
        <p className="text-sm mb-8 max-w-md mx-auto" style={{ color: '#98afc0' }}>
          Connectez-vous à votre espace membre pour consulter vos cotisations, suivre vos prêts et bénéficier du fonds de solidarité.
        </p>
        <button onClick={onLogin}
          className="inline-flex items-center gap-2 px-8 sm:px-10 py-4 rounded-full font-bold text-base hover:scale-105 active:scale-95 transition-all shadow-xl"
          style={{ background: '#c48a21', color: '#072434' }}>
          Accéder à mon espace <ChevronRight size={18} />
        </button>
      </section>

      {/* Footer */}
      <footer className="px-6 sm:px-8 py-10" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-9 h-9 rounded-lg object-cover" />
            <div>
              <div className="font-playfair font-bold text-white text-sm">Caisse <span style={{ color: '#c48a21' }}>ÉMERGENCE</span></div>
              <div className="text-xs" style={{ color: '#98afc0' }}>Épargne · Crédit · Solidarité</div>
            </div>
          </div>
          <p className="text-xs" style={{ color: '#98afc0' }}>© {new Date().getFullYear()} Caisse Émergence — Tous droits réservés</p>
        </div>
      </footer>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   CARTE APERÇU (panneau gauche de la page de connexion)
   ════════════════════════════════════════════════════════════════ */
function PreviewCard() {
  return (
    <div className="rounded-2xl p-5"
      style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(6px)' }}>
      <p className="text-xs font-semibold tracking-widest mb-4" style={{ color: '#c48a21' }}>APERÇU DU TABLEAU DE BORD</p>
      <div className="space-y-3 mb-5">
        {[
          { label: 'Caisse totale',      value: '450 000 FCFA', color: '#ffffff' },
          { label: 'Membres actifs',     value: '12',           color: '#ffffff' },
          { label: 'Prêts approuvés',    value: '2',            color: '#4ade80' },
          { label: 'Fonds solidarité',   value: '75 000 FCFA',  color: '#56a7d2' },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex justify-between items-center">
            <span style={{ color: '#98afc0', fontSize: '12px' }}>{label}</span>
            <span style={{ color, fontWeight: 700, fontSize: '13px' }}>{value}</span>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px' }}>
        <p style={{ color: '#98afc0', fontSize: '11px', marginBottom: '8px' }}>Cotisations · 6 derniers mois</p>
        <div className="flex items-end gap-1.5" style={{ height: '40px' }}>
          {[55, 80, 68, 100, 75, 92].map((h, i) => (
            <div key={i} className="flex-1 rounded-t"
              style={{ height: `${h}%`, background: i === 5 ? '#c48a21' : 'rgba(196,138,33,0.32)' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   VUE 2 — PAGE DE CONNEXION (split-screen 2 colonnes)
   ════════════════════════════════════════════════════════════════ */
function LoginPage({ onBack, onForgotPassword }) {
  const { login } = useAuth();
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [error, setError]           = useState('');
  const [submitting, setSubmitting] = useState(false);

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

      {/* ── Panneau gauche (desktop) ── */}
      <div className="hidden md:flex md:w-[42%] lg:w-[44%] relative flex-col justify-between p-10"
        style={{ background: 'linear-gradient(160deg, #09324e 0%, #0c3d58 60%, #09324e 100%)' }}>
        <ParticleCanvas />

        <div className="relative z-10 flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <img src={logo} alt="Logo" className="w-11 h-11 rounded-xl object-cover shadow-lg" />
            <div>
              <p className="font-playfair font-bold text-white text-lg leading-none">
                Caisse <span style={{ color: '#c48a21' }}>ÉMERGENCE</span>
              </p>
              <p className="text-xs" style={{ color: '#98afc0' }}>Épargne · Crédit · Solidarité</p>
            </div>
          </div>

          {/* Accroche */}
          <div className="mb-8">
            <h1 className="font-playfair font-bold text-white mb-3" style={{ fontSize: 'clamp(1.8rem,3vw,2.5rem)' }}>
              Bienvenue !
            </h1>
            <p style={{ color: '#cfe0ea', fontSize: '14px', lineHeight: '1.7', maxWidth: '340px' }}>
              Gérez les cotisations, prêts et fonds de solidarité de votre caisse — simplement, depuis n'importe quel appareil.
            </p>
          </div>

          <PreviewCard />

          {/* Icônes bas */}
          <div className="mt-auto pt-10 flex gap-6">
            {[{ icon: HandCoins, label: 'Cotisations' }, { icon: TrendingUp, label: 'Prêts' }, { icon: Users, label: 'Membres' }].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(196,138,33,0.18)' }}>
                  <Icon size={18} style={{ color: '#c48a21' }} />
                </div>
                <span style={{ color: '#98afc0', fontSize: '11px' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Panneau droit — formulaire ── */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12 relative">

        {/* Bouton retour */}
        <button onClick={onBack}
          className="absolute top-5 left-5 flex items-center gap-1.5 text-sm hover:opacity-70 transition-opacity"
          style={{ color: '#09324e' }}>
          <ArrowLeft size={16} /> Retour
        </button>

        <div className="w-full max-w-105">
          {/* Logo mobile */}
          <div className="flex items-center gap-3 mb-10 md:hidden justify-center">
            <img src={logo} alt="Logo" className="w-12 h-12 rounded-xl object-cover" />
            <div>
              <p className="font-playfair font-bold text-lg leading-none" style={{ color: '#09324e' }}>
                Caisse <span style={{ color: '#c48a21' }}>ÉMERGENCE</span>
              </p>
              <p className="text-xs" style={{ color: '#98afc0' }}>Épargne · Crédit · Solidarité</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="font-playfair font-bold text-2xl sm:text-3xl mb-2" style={{ color: '#09324e' }}>
              Connexion à votre compte
            </h2>
            <p className="text-sm" style={{ color: '#98afc0' }}>Connectez-vous à votre espace membre</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Adresse email</label>
              <div className="relative">
                <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }} />
                <input type="email" autoComplete="email" value={email}
                  onChange={e => setEmail(e.target.value)} className="input"
                  style={{ paddingLeft: '2.6rem' }} placeholder="votre@email.com" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#374151' }}>Mot de passe</label>
              <div className="relative">
                <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }} />
                <input type={showPw ? 'text' : 'password'} autoComplete="current-password" value={password}
                  onChange={e => setPassword(e.target.value)} className="input"
                  style={{ paddingLeft: '2.6rem', paddingRight: '2.8rem' }} placeholder="••••••••" />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
                  style={{ color: '#9ca3af' }}>
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

            <button type="submit" disabled={submitting}
              className="w-full py-3 rounded-xl font-semibold text-base transition-all disabled:opacity-60 hover:opacity-90 active:scale-[0.98]"
              style={{ background: '#09324e', color: '#fff' }}>
              {submitting ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button onClick={onForgotPassword} className="text-sm hover:underline transition-colors" style={{ color: '#98afc0' }}>
              Mot de passe oublié ?
            </button>
          </div>

          <div className="my-7 flex items-center gap-4">
            <div className="flex-1 h-px" style={{ background: 'rgba(11,58,90,0.08)' }} />
            <span className="text-xs" style={{ color: '#c2cdd6' }}>Accès réservé aux membres</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(11,58,90,0.08)' }} />
          </div>

          <button onClick={onBack}
            className="w-full py-3 rounded-xl font-semibold text-sm border-2 transition-all hover:bg-gold/5 active:scale-[0.98]"
            style={{ borderColor: '#c48a21', color: '#c48a21' }}>
            ← Retour à la page d'accueil
          </button>

          <p className="text-xs text-center mt-8 leading-relaxed" style={{ color: '#c2cdd6' }}>
            Le secrétaire enregistre les membres et leur envoie leurs identifiants par email.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   COMPOSANT RACINE — gère la navigation entre les deux vues
   ════════════════════════════════════════════════════════════════ */
const LandingPage = () => {
  const [view, setView] = useState('landing'); // 'landing' | 'login'
  const [showForgot, setShowForgot] = useState(false);

  if (view === 'login') {
    return (
      <>
        <LoginPage
          onBack={() => setView('landing')}
          onForgotPassword={() => { setView('landing'); setShowForgot(true); }}
        />
        {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
      </>
    );
  }

  return (
    <>
      <MarketingPage onLogin={() => setView('login')} />
      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
    </>
  );
};

export default LandingPage;
