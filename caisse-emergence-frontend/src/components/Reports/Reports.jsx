// No hooks needed; derive data from controllers directly
import ReportCard from './ReportCard';
import PrintableLoanForm from './PrintableLoanForm';
import { useState, useRef } from 'react';
import MemberController from '../../controllers/MemberController';
import ContributionController from '../../controllers/ContributionController';
import LoanController from '../../controllers/LoanController';
import SolidarityController from '../../controllers/SolidarityController';
import PDFService from '../../services/PDFService';
import StorageService from '../../services/StorageService';
import { FileText, Users, CreditCard } from 'lucide-react';

const Reports = () => {
  const members = MemberController.getAllMembers();
  const contributions = ContributionController.getAllContributions();
  const loans = LoanController.getAllLoans();
  const aids = SolidarityController.getAllAids();

  const [showForm, setShowForm] = useState(false);
  const triggerRef = useRef(null);

  const reports = [
    {
      id: 'monthly',
      title: 'Rapport mensuel',
      icon: FileText,
      description: 'État complet des cotisations, soldes et situation générale',
      color: 'navy',
      action: () => PDFService.generateMonthlyReport(members, contributions, loans, aids),
    },
    {
      id: 'members',
      title: 'Liste des membres',
      icon: Users,
      description: 'Annuaire complet avec rôles et informations de contact',
      color: 'gold',
      action: () => PDFService.generateMemberReport(members),
    },
    {
      id: 'contributions',
      title: 'Bulletin cotisations',
      icon: CreditCard,
      description: 'Tableau récapitulatif complet de toutes les cotisations',
      color: 'green',
      action: () => PDFService.generateContributionReport(members, contributions),
    },
    {
      id: 'loan-form',
      title: 'Formulaire contrat prêt',
      icon: CreditCard,
      description: 'Formulaire vierge de contrat de prêt à imprimer et faire signer',
      color: 'navy',
      action: () => {
        // keep reference to triggering element to restore focus when modal closes
        try { triggerRef.current = document.activeElement; } catch (e) { triggerRef.current = null; }
        setShowForm(true);
      },
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card">
        <h3 className="font-playfair text-lg font-bold text-navy mb-4">📄 Génération de rapports</h3>
        <p className="text-gray-500 mb-6">Générez et téléchargez les rapports officiels de la Caisse Le Tremplin Mutuel au format PDF.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reports.map(report => (
            <ReportCard key={report.id} {...report} />
          ))}
        </div>
      </div>

      {/* Printable loan form modal (open on demand) */}
      {showForm && (
        <PrintableLoanForm
          onClose={() => {
            setShowForm(false);
            // restore focus to the triggering element for accessibility
            try { triggerRef.current?.focus?.(); } catch (e) { /* ignore */ }
          }}
        />
      )}

      <div className="card">
        <h3 className="font-playfair text-lg font-bold text-navy mb-4">📜 Charte — Règles essentielles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-bold text-gold">💰 Cotisations</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Minimum 5 000 FCFA/mois</li>
              <li>Frais de gestion 300 FCFA/mois</li>
              <li>Date limite : le 5 du mois</li>
              <li>Janvier à novembre</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-bold text-gold">🏦 Prêts (phase définitive)</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Maximum : 150% du solde cotisé</li>
              <li>Intérêts : 10% fixe</li>
              <li>Durée max : 3 mois</li>
              <li>Vote collectif obligatoire</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-bold text-gold">⚠️ Pénalités de retard</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>J+5 : Rappel secrétaire</li>
              <li>J+15 : Notification bureau</li>
              <li>J+30 : Suspension droits prêt</li>
              <li>J+60 : Exclusion possible</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-bold text-gold">🤝 Fonds solidarité</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Frais adhésion : 2 000 FCFA</li>
              <li>Frais gestion mensuels</li>
              <li>Pénalités de retard</li>
              <li>Vote unanime pour aide</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;