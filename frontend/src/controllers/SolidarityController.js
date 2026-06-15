import StorageService from '../services/StorageService';
import ContributionController from './ContributionController';

class SolidarityController {
  getAllAids() {
    return StorageService.getAids();
  }

  addAid(aidData) {
    const aids = this.getAllAids();
    const aid = {
      id: aidData.id || Date.now(),
      memberId: aidData.memberId,
      amount: aidData.amount || 0,
      motif: aidData.motif || '',
      date: aidData.date || new Date().toISOString().split('T')[0],
    };

    if (!aid.memberId) return { success: false, errors: ['Membre requis'] };
    if (aid.amount <= 0) return { success: false, errors: ['Montant invalide'] };

    aids.push(aid);
    StorageService.saveAids(aids);
    return { success: true, aid };
  }

  getSolidarityFund() {
    const contributions = ContributionController.getAllContributions();
    const feesTotal = contributions
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + (c.fees || 0), 0);

    const aids = this.getAllAids();
    const totalAids = aids.reduce((sum, a) => sum + (a.amount || 0), 0);

    // placeholders for other sources
    const adhesion = 0;
    const penalties = 0;
    const loanInterests = 0;

    return {
      fees: feesTotal,
      adhesion,
      penalties,
      loanInterests,
      aids: totalAids,
      total: feesTotal + adhesion + penalties + loanInterests - totalAids,
    };
  }
}

export default new SolidarityController();
