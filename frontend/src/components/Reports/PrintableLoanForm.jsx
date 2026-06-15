import { useState } from 'react';
import Modal from '../UI/Modal';
import PDFService from '../../services/PDFService';
import MemberController from '../../controllers/MemberController';
import StorageService from '../../services/StorageService';

const PrintableLoanForm = ({ onClose, prefillMember = null, prefillLoan = null }) => {
  const members = MemberController.getAllMembers();
  const settings = StorageService.getSettings();

  const [form, setForm] = useState(() => ({
    memberId: prefillMember?.id || prefillLoan?.memberId || '',
    beneficiaryName: prefillMember?.name || prefillLoan?.beneficiaryName || '',
    phone: prefillMember?.phone || prefillLoan?.phone || '',
    amount: prefillLoan?.amount ?? 50000,
    interestsPercent: 10,
    interests: prefillLoan?.interests ?? null,
    duration: prefillLoan?.duration ?? 3,
    monthlyPayment: prefillLoan?.monthlyPayment ?? null,
    motif: prefillLoan?.motif || '',
    requestDate: prefillLoan?.requestDate || new Date().toISOString().split('T')[0],
  }));

  // compute derived values on render instead of setting state in an effect
  const amt = Number(form.amount || 0);
  const dur = Number(form.duration || 1) || 1;
  const interestsComputed = Math.round(amt * (form.interestsPercent / 100));
  const totalComputed = amt + interestsComputed;
  const monthlyComputed = Math.round(totalComputed / dur);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleMemberSelect = (e) => {
    const id = parseInt(e.target.value) || '';
    const m = members.find(x => x.id === id);
    setForm(f => ({ ...f, memberId: id, beneficiaryName: m?.name || '', phone: m?.phone || '' }));
  };

  const handleDownload = async () => {
    const loanObj = {
      memberId: form.memberId,
      amount: Number(form.amount || 0),
      interests: interestsComputed,
      interestsPercent: form.interestsPercent,
      duration: Number(form.duration || 1),
      monthlyPayment: monthlyComputed,
      motif: form.motif,
      requestDate: form.requestDate,
    };
    const member = members.find(m => m.id === parseInt(form.memberId)) || { name: form.beneficiaryName, phone: form.phone };
    try {
      // use fillable PDF generation
      await PDFService.generateLoanFormFillable(member, settings, loanObj);
      // keep modal open so user can repeat if needed
    } catch (err) {
      console.error('Erreur génération formulaire prérempli', err);
      alert('Erreur lors de la génération du PDF');
    }
  };

  return (
    <Modal title="Formulaire prêt — Préremplir" onClose={onClose}>
      <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); await handleDownload(); }}>
        <div>
          <label className="block text-sm font-medium mb-1">Membre</label>
          <select name="memberId" value={form.memberId} onChange={handleMemberSelect} className="input w-full">
            <option value="">-- Aucun (remplir manuellement) --</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom bénéficiaire</label>
            <input name="beneficiaryName" value={form.beneficiaryName} onChange={handleChange} className="input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Téléphone</label>
            <input name="phone" value={form.phone} onChange={handleChange} className="input w-full" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Montant (FCFA)</label>
            <input type="number" name="amount" value={form.amount} onChange={handleChange} className="input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Durée (mois)</label>
            <input type="number" name="duration" value={form.duration} onChange={handleChange} className="input w-full" min="1" max="12" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Intérêts (%)</label>
            <input type="number" name="interestsPercent" value={form.interestsPercent} onChange={(e)=>setForm(f=>({...f, interestsPercent: Number(e.target.value)}))} className="input w-full" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Intérêts calculés</label>
            <div className="p-2 border rounded">{interestsComputed.toLocaleString('fr-FR')} FCFA</div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mensualité</label>
            <div className="p-2 border rounded">{monthlyComputed.toLocaleString('fr-FR')} FCFA</div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Motif</label>
          <input name="motif" value={form.motif} onChange={handleChange} className="input w-full" />
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-outline">Annuler</button>
          <button type="submit" className="btn-primary">Télécharger formulaire prérempli</button>
        </div>
      </form>
    </Modal>
  );
};

export default PrintableLoanForm;
