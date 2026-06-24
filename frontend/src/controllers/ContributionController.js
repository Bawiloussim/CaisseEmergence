import api from '../services/apiClient';
import { MONTHS } from '../models/ContributionModel';
import MemberController from './MemberController';

// Les cotisations vivent désormais côté serveur (MongoDB), pas dans le
// localStorage : tous les comptes (secrétaire ou membre, peu importe
// l'appareil) voient les mêmes données.
const normalize = (c) => ({ ...c, id: c._id });

class ContributionController {
  async getAllContributions() {
    const data = await api.get('/contributions');
    return data.map(normalize);
  }

  async getContributionsByMember(memberId) {
    const contributions = await this.getAllContributions();
    return contributions.filter((c) => c.memberId === memberId);
  }

  async addContribution(contributionData) {
    try {
      const contribution = await api.post('/contributions', contributionData);
      return { success: true, contribution: normalize(contribution) };
    } catch (err) {
      if (err.status === 409) return { success: false, error: err.message };
      return { success: false, errors: [err.message] };
    }
  }

  async updateContribution(id, data) {
    try {
      const contribution = await api.put(`/contributions/${id}`, data);
      return { success: true, contribution: normalize(contribution) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async validateContribution(id) {
    try {
      const contribution = await api.post(`/contributions/${id}/validate`, {});
      return { success: true, contribution: normalize(contribution) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async deleteContribution(id) {
    try {
      await api.delete(`/contributions/${id}`);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async getMonthlySummary() {
    const contributions = await this.getAllContributions();
    const summary = {};

    MONTHS.forEach((month) => {
      const monthContribs = contributions.filter((c) => c.month === month);
      summary[month] = {
        total: monthContribs.length,
        paid: monthContribs.filter((c) => c.status === 'paid').length,
        pending: monthContribs.filter((c) => c.status === 'pending').length,
        late: monthContribs.filter((c) => c.status === 'late').length,
      };
    });

    return summary;
  }

  // Totaux monétaires par mois et montants attendus
  async getMonthlyTotals() {
    const contributions = await this.getAllContributions();
    const members = MemberController.getAllMembers();
    const summary = {};

    MONTHS.forEach((month) => {
      const monthContribs = contributions.filter((c) => c.month === month);
      const totalAmount = monthContribs.reduce((s, c) => s + (c.amount || 0), 0);
      const totalFees = monthContribs.reduce((s, c) => s + (c.fees || 0), 0);

      const expectedAmount = members.reduce((s, m) => s + (m.monthlyContribution || 0), 0);

      summary[month] = {
        totalAmount,
        totalFees,
        expectedAmount,
        missingAmount: Math.max(0, expectedAmount - totalAmount),
        count: monthContribs.length,
        paid: monthContribs.filter((c) => c.status === 'paid').length,
        pending: monthContribs.filter((c) => c.status === 'pending').length,
        late: monthContribs.filter((c) => c.status === 'late').length,
      };
    });

    return summary;
  }

  async getContributionByMemberAndMonth(memberId, month) {
    const contributions = await this.getAllContributions();
    return contributions.find((c) => c.memberId === memberId && c.month === month);
  }

  // Résumé pour un membre donné
  async getMemberContributionSummary(memberId) {
    const contributions = (await this.getAllContributions()).filter((c) => c.memberId === memberId);
    const paid = contributions.filter((c) => c.status === 'paid');
    const pending = contributions.filter((c) => c.status === 'pending');

    const totalPaid = paid.reduce((s, c) => s + (c.amount || 0), 0);
    const totalFees = paid.reduce((s, c) => s + (c.fees || 0), 0);

    const paidMonths = paid.map((p) => p.month);
    const missingMonths = MONTHS.filter((m) => !paidMonths.includes(m));

    return {
      memberId,
      totalPaid,
      totalFees,
      paidCount: paid.length,
      pendingCount: pending.length,
      missingMonths,
    };
  }

  // Plafond de prêt : 150% des cotisations payées (toutes périodes)
  async computeLoanCeiling(memberId) {
    const contributions = (await this.getAllContributions()).filter(
      (c) => c.memberId === memberId && c.status === 'paid'
    );
    const totalPaid = contributions.reduce((s, c) => s + (c.amount || 0), 0);
    return Math.floor(totalPaid * 1.5);
  }
}

export default new ContributionController();
