// React import removed (not needed with new JSX transform)
import { Phone, MapPin, Calendar, IdCard, Cake, Smartphone, Trash2, Edit } from 'lucide-react';
import Modal from '../UI/Modal';
import ContributionController from '../../controllers/ContributionController';
import { MONTHS, MONTHS_FULL } from '../../models/ContributionModel';
import PDFService from '../../services/PDFService';
import StorageService from '../../services/StorageService';

const MemberDetail = ({ member, onClose, onDelete, onEdit, isSecretary, onRequestLoan }) => {
  const contributions = ContributionController.getContributionsByMember(member.id);
  const paidContributions = contributions.filter(c => c.status === 'paid');
  const totalCotised = paidContributions.reduce((sum, c) => sum + c.amount, 0);
  const maxLoan = totalCotised * 1.5;
  const paidMonths = paidContributions.length;

  const getMonthStatus = (month) => {
    const contrib = contributions.find(c => c.month === month);
    if (!contrib) return null;
    return contrib.status;
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'paid': return '✅';
      case 'pending': return '⏳';
      case 'late': return '❌';
      default: return '—';
    }
  };

  return (
    <Modal onClose={onClose} title={`Fiche membre - ${member.name}`} size="large">
      <div className="space-y-6">
        {/* En-tête avec photo */}
        <div className="flex items-center gap-6 pb-4 border-b">
          {member.photo ? (
            <img src={member.photo} alt={member.name} className="w-24 h-24 rounded-full object-cover border-3 border-gold" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-linear-to-br from-navy to-navy/70 flex items-center justify-center border-3 border-gold">
              <span className="text-gold font-bold text-2xl">
                {member.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-navy">{member.name}</h2>
            <p className="text-gray-500 text-sm">{member.role}</p>
            <div className="flex gap-4 mt-2">
              <div className="text-center">
                <p className="text-lg font-bold text-navy">{paidMonths}/11</p>
                <p className="text-xs text-gray-500">Mois payés</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-navy">{totalCotised.toLocaleString('fr-FR')} FCFA</p>
                <p className="text-xs text-gray-500">Total cotisé</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-green-600">{maxLoan.toLocaleString('fr-FR')} FCFA</p>
                <p className="text-xs text-gray-500">Plafond prêt</p>
              </div>
            </div>
          </div>
        </div>

        {/* Informations personnelles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 text-sm">
            <Phone size={16} className="text-gray-400" />
            <span>{member.phone || 'Non renseigné'}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Smartphone size={16} className="text-gray-400" />
            <span>{member.momoNumber || 'Non renseigné'}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <MapPin size={16} className="text-gray-400" />
            <span>{member.address || 'Non renseigné'}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <IdCard size={16} className="text-gray-400" />
            <span>{member.cni || 'Non renseigné'}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Calendar size={16} className="text-gray-400" />
            <span>Adhésion: {member.joinDate}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Cake size={16} className="text-gray-400" />
            <span>Né(e) le: {member.dob || 'Non renseigné'}</span>
          </div>
        </div>

        {/* Calendrier des cotisations */}
        <div>
          <h4 className="font-semibold text-navy mb-3">Calendrier des cotisations 2026</h4>
          <div className="grid grid-cols-6 gap-2">
            {MONTHS.map(month => {
              const status = getMonthStatus(month);
              return (
                <div key={month} className="text-center">
                  <div className={`p-2 rounded-lg text-sm font-medium
                    ${status === 'paid' ? 'bg-green-100 text-green-700' : 
                      status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      status === 'late' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-400'}`}>
                    {getStatusIcon(status)}
                    <span className="block text-xs mt-1">{MONTHS_FULL[month]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions (seulement pour secrétaire) */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={() => {
              onClose();
              if (typeof onRequestLoan === 'function') onRequestLoan(member);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
          >
            Demander un prêt
          </button>

          {isSecretary && (
            <>
              <button
                onClick={() => {
                  onClose();
                  onEdit(member);
                }}
                className="flex items-center gap-2 px-4 py-2 text-navy border border-navy rounded-lg hover:bg-navy hover:text-white transition-all"
              >
                <Edit size={16} /> Modifier
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) {
                    onDelete(member.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all"
              >
                <Trash2 size={16} /> Supprimer
              </button>
              <button
                onClick={() => {
                  try {
                    const settings = StorageService.getSettings();
                    PDFService.generateLoanForm(member, settings);
                  } catch (err) {
                    console.error('Erreur génération formulaire prêt', err);
                    alert('Erreur lors de la génération du formulaire');
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 text-navy border border-navy rounded-lg hover:bg-navy hover:text-white transition-all"
              >
                📄 Générer formulaire
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default MemberDetail;