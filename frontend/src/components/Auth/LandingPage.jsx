import { useState, useEffect, useCallback } from 'react';
import {
  Eye, EyeOff, Lock, Mail, X, TrendingUp, HandCoins, Users, ShieldCheck,
  ChevronLeft, ChevronRight, Sparkles, Phone, MapPin, Menu,
} from 'lucide-react';
import { useAuth } from './AuthContext';
import logo from '../../assets/logo/2.jpeg';

/* ── Login modal ─────────────────────────────────────── */
function LoginModal({ onClose }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) { setError('Veuillez renseigner email et mot de passe.'); return; }
    setSubmitting(true);
    const result = await login(email.trim(), password);
    if (!result.success) setError(result.message);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(7,15,20,0.85)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-navy z-10">
          <X size={20} />
        </button>

        <div className="px-8 py-6 flex flex-col items-center text-center" style={{ background: '#09324e' }}>
          <img src={logo} alt="Caisse Émergence" className="w-36 rounded-lg shadow-lg" />
        </div>

        <div className="px-8 py-8">
          <h2 className="font-playfair text-xl font-bold text-navy text-center mb-1">Connexion à l'espace membres</h2>
          <p className="text-sm text-center mb-6" style={{ color: '#98afc0' }}>Épargne · Crédit · Solidarité</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="input" style={{ paddingLeft: '2.5rem' }} placeholder="votre@email.com" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <div className="relative">
                <Lock size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showPw ? 'text' : 'password'} autoComplete="current-password" value={password}
                  onChange={e => setPassword(e.target.value)} className="input"
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }} placeholder="••••••••" />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy">
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
              className="btn-gold w-full py-3 text-base disabled:opacity-60">
              {submitting ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          <p className="text-xs text-center mt-5 leading-relaxed" style={{ color: '#98afc0' }}>
            Accès réservé aux membres enregistrés par le secrétaire.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Feature card ────────────────────────────────────── */
function FeatureCard({ icon: Icon, title, description, accent }) {
  return (
    <div className="rounded-2xl p-8 flex flex-col gap-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: accent + '22' }}>
        <Icon size={26} style={{ color: accent }} />
      </div>
      <h3 className="font-playfair text-xl font-bold text-white">{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: '#98afc0' }}>{description}</p>
    </div>
  );
}

/* ── Value pill ──────────────────────────────────────── */
function ValuePill({ label, sub }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="px-6 py-2 rounded-full font-bold text-sm tracking-widest" style={{ background: '#c48a21', color: '#072434' }}>
        {label}
      </div>
      <p className="text-xs text-center max-w-40" style={{ color: '#98afc0' }}>{sub}</p>
    </div>
  );
}

/* ── Step card ───────────────────────────────────────── */
function StepCard({ number, title, text }) {
  return (
    <div className="flex gap-5 items-start">
      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm" style={{ background: '#c48a21', color: '#072434' }}>
        {number}
      </div>
      <div>
        <h4 className="font-semibold text-white mb-1">{title}</h4>
        <p className="text-sm leading-relaxed" style={{ color: '#98afc0' }}>{text}</p>
      </div>
    </div>
  );
}

/* ── Hero slides data ────────────────────────────────── */
const SLIDES = [
  { tag: '01', title: 'ÉPARGNE', caption: 'Cotisez chaque mois en toute sérénité et suivez votre épargne en temps réel.' },
  { tag: '02', title: 'PRÊTS', caption: "Accédez à un crédit jusqu'à 150% de votre épargne accumulée." },
  { tag: '03', title: 'SOLIDARITÉ', caption: "L'entraide communautaire au cœur de chaque décision de la caisse." },
];

/* ── Info bar items (style "free shipping / call us / location") ── */
const INFO_ITEMS = [
  { icon: ShieldCheck, caption: 'ESPACE SÉCURISÉ', sub: 'Connexion protégée par mot de passe' },
  { icon: HandCoins, caption: 'COTISATIONS FLEXIBLES', sub: 'Montant variable chaque mois' },
  { icon: Users, caption: 'GESTION SIMPLIFIÉE', sub: 'Rôles secrétaire & membres' },
];

/* ── Landing page ────────────────────────────────────── */
const LandingPage = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [slide, setSlide] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const next = useCallback(() => setSlide((s) => (s + 1) % SLIDES.length), []);
  const prev = () => setSlide((s) => (s - 1 + SLIDES.length) % SLIDES.length);

  useEffect(() => {
    const id = setInterval(next, 6000);
    return () => clearInterval(id);
  }, [next]);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="min-h-screen font-inter" style={{ background: '#09324e' }}>

      {/* ── Top bar ── */}
      <div className="hidden sm:flex items-center justify-between px-8 text-xs" style={{ background: '#072434', color: '#98afc0', height: '38px' }}>
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5"><Mail size={13} /> bawiloussimngbabou1@gmail.com</span>
          <span className="flex items-center gap-1.5"><Phone size={13} /> +228 98462796</span>
        </div>
        <span className="flex items-center gap-1.5"><MapPin size={13} /> Kara, Togo</span>
      </div>

      {/* ── Header / nav ── */}
      <nav className="sticky top-0 z-40 px-4 sm:px-8 py-3" style={{ background: 'rgba(9,50,78,0.97)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <img src={logo} alt="Logo" className="w-10 h-10 rounded-lg object-cover shrink-0" />
            <div className="min-w-0">
              <span className="font-playfair font-bold text-white text-lg leading-none block truncate">Caisse <span style={{ color: '#c48a21' }}>ÉMERGENCE</span></span>
              <span className="text-xs tracking-widest hidden sm:block" style={{ color: '#98afc0' }}>INNOVATION · CROISSANCE · CONFIANCE</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: '#cfe0ea' }}>
            {[['Accueil', 'hero'], ['Services', 'services'], ['Comment ça marche', 'comment'], ['Valeurs', 'valeurs']].map(([label, id]) => (
              <button key={id} onClick={() => scrollTo(id)} className="hover:text-white transition-colors">{label}</button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setShowLogin(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 rounded-full text-sm font-semibold transition-all"
              style={{ background: '#c48a21', color: '#072434' }}>
              <span className="hidden sm:inline">Se connecter</span>
              <span className="sm:hidden">Connexion</span>
              <ChevronRight size={15} />
            </button>

            <button onClick={() => setMobileMenuOpen((v) => !v)} aria-label="Menu"
              className="md:hidden p-2 rounded-full hover:bg-white/10 transition-colors text-white">
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden flex flex-col gap-1 pt-3 pb-1 text-sm font-medium" style={{ color: '#cfe0ea' }}>
            {[['Accueil', 'hero'], ['Services', 'services'], ['Comment ça marche', 'comment'], ['Valeurs', 'valeurs']].map(([label, id]) => (
              <button key={id} onClick={() => { scrollTo(id); setMobileMenuOpen(false); }}
                className="text-left px-2 py-2 rounded hover:bg-white/5 hover:text-white transition-colors">
                {label}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* ── Hero slider ── */}
      <section id="hero" className="relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #09324e 0%, #135c60 65%, #09324e 100%)' }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-175 h-175 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #c48a21 0%, transparent 70%)' }} />

        <div className="relative min-h-115 flex items-center px-5 sm:px-8 md:px-20 py-16 sm:py-20">
          {/* prev / next arrows */}
          <button onClick={prev} aria-label="Précédent"
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 items-center justify-center w-12 h-12 rounded-full transition-colors hover:bg-white/10">
            <ChevronLeft size={30} color="#98afc0" />
          </button>
          <button onClick={next} aria-label="Suivant"
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 items-center justify-center w-12 h-12 rounded-full transition-colors hover:bg-white/10">
            <ChevronRight size={30} color="#98afc0" />
          </button>

          {/* caption */}
          <div className="max-w-xl">
            <div className="flex items-baseline gap-3 sm:gap-4 mb-4 flex-wrap">
              <span className="font-playfair font-bold text-white leading-none" style={{ fontSize: 'clamp(3rem, 12vw, 5rem)' }}>{SLIDES[slide].tag}</span>
              <span className="font-playfair font-bold leading-tight" style={{ fontSize: 'clamp(1.25rem, 6vw, 2rem)', color: '#c48a21' }}>{SLIDES[slide].title}</span>
            </div>
            <p className="text-base leading-relaxed mb-8" style={{ color: '#cfe0ea' }}>
              {SLIDES[slide].caption}
            </p>
            <div className="flex flex-wrap gap-4">
              <button onClick={() => setShowLogin(true)}
                className="flex items-center gap-2 px-5 sm:px-7 py-3.5 rounded-full font-bold text-sm shadow-xl transition-all hover:scale-105"
                style={{ background: '#c48a21', color: '#072434' }}>
                <Sparkles size={16} /> Accéder à l'espace membres
              </button>
              <button onClick={() => scrollTo('services')}
                className="flex items-center gap-2 px-5 sm:px-7 py-3.5 rounded-full font-bold text-sm transition-all border-2"
                style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#fff' }}>
                En savoir plus
              </button>
            </div>

            {/* dots */}
            <div className="flex gap-2 mt-10">
              {SLIDES.map((_, i) => (
                <button key={i} onClick={() => setSlide(i)} aria-label={`Slide ${i + 1}`}
                  className="h-1.5 rounded-full transition-all"
                  style={{ width: i === slide ? '28px' : '10px', background: i === slide ? '#c48a21' : 'rgba(255,255,255,0.25)' }} />
              ))}
            </div>
          </div>
        </div>

        {/* ── Info strip (overlapping bottom edge, like Tyche's main-slider-bar) ── */}
        <div className="relative" style={{ background: '#c48a21' }}>
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/25">
            {INFO_ITEMS.map(({ icon: Icon, caption, sub }) => (
              <div key={caption} className="flex items-center gap-4 px-8 py-5 justify-center sm:justify-start">
                <Icon size={32} color="#072434" />
                <div>
                  <div className="font-bold text-sm tracking-wide" style={{ color: '#072434' }}>{caption}</div>
                  <div className="text-xs" style={{ color: '#072434', opacity: 0.75 }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services ── */}
      <section id="services" className="px-6 py-24 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs tracking-widest font-semibold mb-3" style={{ color: '#c48a21' }}>NOS SERVICES</p>
          <h2 className="font-playfair font-bold text-white text-4xl">Tout ce dont votre caisse a besoin</h2>
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

      {/* ── How it works ── */}
      <section id="comment" className="px-6 py-20" style={{ background: 'rgba(0,0,0,0.15)' }}>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
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
              { icon: HandCoins, label: 'Cotisations variables par mois', color: '#c48a21' },
              { icon: TrendingUp, label: 'Plafond de prêt calculé automatiquement', color: '#4ade80' },
              { icon: Users, label: 'Rôles secrétaire & membre', color: '#c48a21' },
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

      {/* ── Values ── */}
      <section id="valeurs" className="px-6 py-24 text-center max-w-3xl mx-auto">
        <p className="text-xs tracking-widest font-semibold mb-3" style={{ color: '#c48a21' }}>NOS VALEURS</p>
        <h2 className="font-playfair font-bold text-white text-4xl mb-14">Ce qui nous définit</h2>
        <div className="flex flex-col sm:flex-row justify-center gap-10">
          <ValuePill label="INNOVATION" sub="Des outils modernes pour gérer votre caisse sans effort." />
          <ValuePill label="CROISSANCE" sub="Construire ensemble une épargne collective solide." />
          <ValuePill label="CONFIANCE" sub="Transparence totale sur chaque franc cotisé et prêté." />
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="mx-4 sm:mx-6 mb-20 rounded-3xl px-6 sm:px-10 py-12 sm:py-16 text-center"
        style={{ background: 'linear-gradient(135deg, #135c60, #09324e)', border: '1px solid rgba(196,138,33,0.25)' }}>
        <h2 className="font-playfair font-bold text-white text-3xl mb-4">Prêt à rejoindre la caisse ?</h2>
        <p className="text-sm mb-8 max-w-md mx-auto" style={{ color: '#98afc0' }}>
          Connectez-vous à votre espace membre pour consulter vos cotisations, suivre vos prêts et bénéficier du fonds de solidarité.
        </p>
        <button onClick={() => setShowLogin(true)}
          className="inline-flex items-center gap-2 px-10 py-4 rounded-full font-bold text-base transition-all hover:scale-105 shadow-xl"
          style={{ background: '#c48a21', color: '#072434' }}>
          Accéder à mon espace <ChevronRight size={18} />
        </button>
      </section>

      {/* ── Footer ── */}
      <footer className="px-8 py-10" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
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

      {/* ── Login modal ── */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
};

export default LandingPage;
