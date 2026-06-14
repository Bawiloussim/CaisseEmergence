import { useState, useEffect } from 'react';
import MemberCard from './MemberCard';
import MemberForm from './MemberForm';
import MemberDetail from './MemberDetail';
import LoanForm from '../Loans/LoanForm';
import LoanController from '../../controllers/LoanController';
import ContributionController from '../../controllers/ContributionController';
import MemberController from '../../controllers/MemberController';
import Modal from '../UI/Modal';
import { Plus, Search, FileText } from 'lucide-react';
import PDFService from '../../services/PDFService';
import StorageService from '../../services/StorageService';

const MemberList = ({ isSecretary }) => {
  const [members, setMembers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [loanMember, setLoanMember] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadMembers();
  }, []);

  function loadMembers() {
    const allMembers = MemberController.getAllMembers();
    setMembers(allMembers);
  }

  const handleAddMember = (memberData) => {
    if (editMember) {
      const result = MemberController.updateMember(editMember.id, memberData);
      if (result.success) {
        loadMembers();
        setShowForm(false);
        setEditMember(null);
      }
      return result;
    }

    const result = MemberController.addMember(memberData);
    if (result.success) {
      loadMembers();
      setShowForm(false);
    }
    return result;
  };

  const handleDeleteMember = (id) => {
    if (window.confirm('Supprimer ce membre ?')) {
      MemberController.deleteMember(id);
      loadMembers();
      setSelectedMember(null);
    }
  };

  const handleRequestLoan = (member) => {
    setLoanMember(member);
    setShowLoanForm(true);
  };

  const handleAddLoan = (loanData) => {
    // ensure memberId
    if (!loanData.memberId) loanData.memberId = loanMember?.id;
    const member = MemberController.getMemberById(loanData.memberId);
    const summary = ContributionController.getMemberContributionSummary(member.id) || { totalPaid: 0 };
    const totalCotised = Number(summary.totalPaid || 0);
    const result = LoanController.addLoan(loanData, totalCotised);
    if (result.success) {
      setShowLoanForm(false);
      setLoanMember(null);
      // generate loan contract PDF for signature
      try {
        PDFService.generateLoanContract(result.loan, member, StorageService.getSettings());
      } catch (err) {
        console.error('Erreur génération contrat PDF', err);
      }
      try {
        PDFService.generateLoanForm(member, StorageService.getSettings(), result.loan);
        alert('Demande de prêt enregistrée — contrat et formulaire PDF générés.');
      } catch (err) {
        console.error('Erreur génération formulaire prêt', err);
        alert('Demande de prêt enregistrée');
      }
      return result;
    }
    if (result.errors && result.errors.length) {
      alert('Erreur: ' + result.errors.join('\n'));
    } else {
      alert(result.message || result.error || 'Erreur lors de l\'enregistrement du prêt');
    }
    return result;
  };

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.role || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-playfair text-3xl font-bold text-navy">Membres</h2>
          <p className="text-sm text-gray-500 mt-1">{members.length} membres inscrits</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher un membre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>

          {isSecretary && (
            <>
              <button
                onClick={() => { setEditMember(null); setShowForm(true); }}
                className="btn-gold flex items-center gap-2"
              >
                <Plus size={16} /> Nouveau
              </button>

              <button
                onClick={() => PDFService.generateMemberReport(members)}
                className="btn-outline flex items-center gap-2"
              >
                <FileText size={16} /> Export
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.map(member => (
          <MemberCard
            key={member.id}
            member={member}
            onClick={() => setSelectedMember(member)}
            isSecretary={isSecretary}
          />
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-12 text-gray-500">Aucun membre trouvé</div>
      )}

      {showForm && (
        <Modal title={editMember ? 'Modifier le membre' : 'Nouveau membre'} onClose={() => { setShowForm(false); setEditMember(null); }}>
          <MemberForm
            editingMember={editMember}
            onClose={() => { setShowForm(false); setEditMember(null); }}
            onSubmit={handleAddMember}
          />
        </Modal>
      )}

      {selectedMember && (
        <Modal title="Détails membre" onClose={() => setSelectedMember(null)} size="large">
          <MemberDetail
            member={selectedMember}
            onClose={() => setSelectedMember(null)}
            onDelete={handleDeleteMember}
            onEdit={(m) => { setEditMember(m); setShowForm(true); setSelectedMember(null); }}
            onRequestLoan={handleRequestLoan}
            isSecretary={isSecretary}
          />
        </Modal>
      )}

      {showLoanForm && (
        <Modal title={`Demande de prêt — ${loanMember?.name || ''}`} onClose={() => { setShowLoanForm(false); setLoanMember(null); }}>
          <LoanForm
            members={[loanMember].filter(Boolean)}
            onClose={() => { setShowLoanForm(false); setLoanMember(null); }}
            onSubmit={handleAddLoan}
          />
        </Modal>
      )}
    </div>
  );
};

export default MemberList;
