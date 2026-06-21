import { Calendar, Video, Wallet, HandCoins, AlertTriangle, HandHeart, MessageCircle } from 'lucide-react';
import MeetingRollCall from './MeetingRollCall';

const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/DwtJzJBIuq60HJOyZabcae';
const GOOGLE_MEET_URL = 'https://meet.google.com/bev-cgkd-zik';
const FLOOZ_NUMBER = '79854438';

const STEPS = [
  {
    icon: Wallet,
    title: 'Du 1er au 5 du mois',
    text: `Chaque membre verse sa cotisation mensuelle (minimum 5 000 FCFA + 300 FCFA de frais de gestion) par Flooz au numéro ${FLOOZ_NUMBER}.`,
  },
  {
    icon: Video,
    title: 'Après la clôture du mois',
    text: "Réunion mensuelle obligatoire de tous les membres, en appel visioconférence (Zoom, Google Meet ou WhatsApp) : bilan des cotisations, suivi des prêts et de la solidarité, décisions collectives.",
    highlight: true,
  },
  {
    icon: HandCoins,
    title: 'À partir de janvier 2027',
    text: "Fin de la phase pilote : les demandes de prêt sont votées et décaissées lors de la réunion mensuelle.",
  },
  {
    icon: Calendar,
    title: 'Novembre / Décembre',
    text: "Assemblée générale annuelle : bilan de l'exercice et orientations pour l'année suivante.",
  },
];

const Program = ({ isSecretary }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-playfair text-2xl sm:text-3xl font-bold text-navy">Programme & Charte</h2>
        <p className="text-sm text-gray-500 mt-1">Le fonctionnement de la Caisse Émergence, mois après mois.</p>
      </div>

      <div className="card">
        <h3 className="font-playfair text-lg font-bold text-navy mb-4">📅 Programme d'activité de la caisse</h3>
        <div className="space-y-4">
          {STEPS.map((step, i) => (
            <div
              key={i}
              className={`flex items-start gap-4 p-4 rounded-lg ${step.highlight ? 'bg-gold/10 border border-gold/30' : 'bg-gray-50'}`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${step.highlight ? 'bg-gold text-navy' : 'bg-navy/10 text-navy'}`}>
                <step.icon size={18} />
              </div>
              <div>
                <p className="font-semibold text-navy">{step.title}</p>
                <p className="text-sm text-gray-600 mt-0.5">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="alert-info bg-gold/10">
        <div className="bar" style={{ backgroundColor: '#c48a21' }} />
        <div className="flex-1">
          <p className="text-sm text-navy">
            <strong>Obligation de réunion :</strong> après chaque mois de cotisation, tous les membres doivent se
            regrouper en appel visioconférence. Cette réunion n'est pas facultative — elle conditionne la
            transparence et les décisions collectives de la caisse.
          </p>
          <div className="flex flex-wrap gap-4 mt-3">
            <a
              href={GOOGLE_MEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-navy hover:text-navy/80"
            >
              <Video size={16} /> Rejoindre la réunion (Google Meet)
            </a>
            <a
              href={WHATSAPP_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800"
            >
              <MessageCircle size={16} /> Rejoindre le groupe WhatsApp de la caisse
            </a>
          </div>
        </div>
      </div>

      <MeetingRollCall isSecretary={isSecretary} />

      <div className="card">
        <h3 className="font-playfair text-lg font-bold text-navy mb-4">📜 Charte — Règles essentielles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-bold text-gold flex items-center gap-2"><Wallet size={16} /> Cotisations</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Minimum 5 000 FCFA/mois</li>
              <li>Frais de gestion 300 FCFA/mois</li>
              <li>Date limite : le 5 du mois</li>
              <li>Janvier à novembre</li>
              <li>Dépôt par Flooz au <strong>{FLOOZ_NUMBER}</strong></li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-bold text-gold flex items-center gap-2"><HandCoins size={16} /> Prêts (phase définitive)</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Maximum : 150% du solde cotisé</li>
              <li>Intérêts : 10% fixe</li>
              <li>Durée max : 3 mois</li>
              <li>Vote collectif obligatoire</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-bold text-gold flex items-center gap-2"><AlertTriangle size={16} /> Pénalités de retard</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>J+5 : Rappel secrétaire</li>
              <li>J+15 : Notification bureau</li>
              <li>J+30 : Suspension droits prêt</li>
              <li>J+60 : Exclusion possible</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-bold text-gold flex items-center gap-2"><HandHeart size={16} /> Fonds solidarité</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Frais adhésion : 2 000 FCFA</li>
              <li>Frais gestion mensuels</li>
              <li>Pénalités de retard</li>
              <li>Vote unanime pour aide</li>
            </ul>
          </div>
          <div className="space-y-3 md:col-span-2">
            <h4 className="font-bold text-gold flex items-center gap-2"><Video size={16} /> Réunions mensuelles</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Obligatoire après chaque mois de cotisation</li>
              <li>Tenue en appel visioconférence (Zoom, Google Meet ou WhatsApp)</li>
              <li>Participation de tous les membres requise</li>
              <li>Bilan, suivi des paiements et décisions collectives</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Program;
