import ReportCard from './ReportCard';
import PrintableLoanForm from './PrintableLoanForm';
import { useState, useRef, useEffect } from 'react';
import MemberController from '../../controllers/MemberController';
import ContributionController from '../../controllers/ContributionController';
import LoanController from '../../controllers/LoanController';
import SolidarityController from '../../controllers/SolidarityController';
import PDFService from '../../services/PDFService';
import { FileText, Users, CreditCard } from 'lucide-react';

const Reports = () => {
  const [members, setMembers] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [loans, setLoans] = useState([]);
  const [aids, setAids] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const triggerRef = useRef(null);

  useEffect(() => {
    (async () => {
      const memberList = MemberController.getAllMembers();
      const [contribList, loanList, aidList] = await Promise.all([
        ContributionController.getAllContributions(),
        LoanController.getAllLoans(),
        SolidarityController.getAllAids(),
      ]);
      setMembers(memberList);
      setContributions(contribList);
      setLoans(loanList);
      setAids(aidList);
      setLoading(false);
    })();
  }, []);

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
        try { triggerRef.current = document.activeElement; } catch { triggerRef.current = null; }
        setShowForm(true);
      },
    },
  ];

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Chargement des rapports…</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card">
        <h3 className="font-playfair text-lg font-bold text-navy mb-4">📄 Génération de rapports</h3>
        <p className="text-gray-500 mb-6">Générez et téléchargez les rapports officiels de la Caisse Émergence au format PDF.</p>

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
            try { triggerRef.current?.focus?.(); } catch { /* ignore */ }
          }}
        />
      )}
    </div>
  );
};

export default Reports;
