import api from '../services/apiClient';
import ContributionController from './ContributionController';

// Les aides vivent désormais côté serveur (MongoDB), comme les cotisations
// et les prêts : tous les comptes voient le même fonds de solidarité.
const normalize = (a) => ({ ...a, id: a._id });

class SolidarityController {
  async getAllAids() {
    const data = await api.get('/aids');
    return data.map(normalize);
  }

  async addAid(aidData) {
    try {
      const aid = await api.post('/aids', aidData);
      return { success: true, aid: normalize(aid) };
    } catch (err) {
      return { success: false, errors: [err.message] };
    }
  }

  async updateAid(id, data) {
    try {
      const aid = await api.put(`/aids/${id}`, data);
      return { success: true, aid: normalize(aid) };
    } catch (err) {
      return { success: false, errors: [err.message] };
    }
  }

  async deleteAid(id) {
    try {
      await api.delete(`/aids/${id}`);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async getSolidarityFund() {
    const contributions = await ContributionController.getAllContributions();
    const feesTotal = contributions
      .filter((c) => c.status === 'paid')
      .reduce((sum, c) => sum + (c.fees || 0), 0);

    const aids = await this.getAllAids();
    const totalAids = aids.reduce((sum, a) => sum + (a.amount || 0), 0);

    // placeholders pour d'autres sources futures
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
