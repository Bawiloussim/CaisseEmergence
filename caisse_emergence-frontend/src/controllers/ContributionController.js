import StorageService from '../services/StorageService';
import { ContributionModel, MONTHS } from '../models/ContributionModel';
import MemberController from './MemberController';

class ContributionController {
  getAllContributions() {
    return StorageService.getContributions();
  }

  getContributionsByMember(memberId) {
    const contributions = this.getAllContributions();
    return contributions.filter(c => c.memberId === parseInt(memberId));
  }

  addContribution(contributionData) {
    // ensure memberId is numeric
    if (contributionData.memberId) contributionData.memberId = parseInt(contributionData.memberId);

    // default amount to member's configured monthlyContribution when available
    const member = MemberController.getMemberById(contributionData.memberId);
    if (member && !contributionData.amount) {
      contributionData.amount = member.monthlyContribution || 5000;
    }

    const contribution = new ContributionModel(contributionData);
    const errors = contribution.validate();
    
    if (errors.length > 0) {
      return { success: false, errors };
    }
    
    // Check if already exists for this month
    const contributions = this.getAllContributions();
    const exists = contributions.some(c => 
      parseInt(c.memberId) === parseInt(contribution.memberId) && c.month === contribution.month
    );
    
    if (exists) {
      return { success: false, error: 'Cotisation déjà enregistrée pour ce mois' };
    }
    
    contributions.push(contribution);
    StorageService.saveContributions(contributions);
    
    return { success: true, contribution };
  }

  updateContributionStatus(id, status) {
    const contributions = this.getAllContributions();
    const index = contributions.findIndex(c => c.id === parseInt(id));
    
    if (index === -1) {
      return { success: false, error: 'Cotisation non trouvée' };
    }
    
    contributions[index].status = status;
    StorageService.saveContributions(contributions);
    
    return { success: true };
  }

  getMonthlySummary() {
    const contributions = this.getAllContributions();
    const summary = {};
    
    MONTHS.forEach(month => {
      summary[month] = {
        total: 0,
        paid: 0,
        pending: 0,
        late: 0,
      };
      
      const monthContribs = contributions.filter(c => c.month === month);
      summary[month].total = monthContribs.length;
      summary[month].paid = monthContribs.filter(c => c.status === 'paid').length;
      summary[month].pending = monthContribs.filter(c => c.status === 'pending').length;
      summary[month].late = monthContribs.filter(c => c.status === 'late').length;
    });
    
    return summary;
  }

  // Return monetary totals per month and expected amounts
  getMonthlyTotals() {
    const contributions = this.getAllContributions();
    const members = MemberController.getAllMembers();
    const summary = {};

    MONTHS.forEach(month => {
      const monthContribs = contributions.filter(c => c.month === month);
      const totalAmount = monthContribs.reduce((s, c) => s + (c.amount || 0), 0);
      const totalFees = monthContribs.reduce((s, c) => s + (c.fees || 0), 0);

      const expectedAmount = members.reduce((s, m) => s + (m.monthlyContribution || 0), 0);

      summary[month] = {
        totalAmount,
        totalFees,
        expectedAmount,
        missingAmount: Math.max(0, expectedAmount - totalAmount),
        count: monthContribs.length,
        paid: monthContribs.filter(c => c.status === 'paid').length,
        pending: monthContribs.filter(c => c.status === 'pending').length,
        late: monthContribs.filter(c => c.status === 'late').length,
      };
    });

    return summary;
  }

  getContributionByMemberAndMonth(memberId, month) {
    const contributions = this.getAllContributions();
    return contributions.find(c => parseInt(c.memberId) === parseInt(memberId) && c.month === month);
  }

  updateContribution(id, data) {
    const contributions = this.getAllContributions();
    const index = contributions.findIndex(c => c.id === parseInt(id));
    if (index === -1) return { success: false, error: 'Cotisation non trouvée' };

    // merge allowed fields
    contributions[index] = { ...contributions[index], ...data };
    StorageService.saveContributions(contributions);
    return { success: true, contribution: contributions[index] };
  }

  // Summary for a specific member
  getMemberContributionSummary(memberId) {
    memberId = parseInt(memberId);
    const contributions = this.getAllContributions().filter(c => parseInt(c.memberId) === memberId);
    const paid = contributions.filter(c => c.status === 'paid');
    const pending = contributions.filter(c => c.status === 'pending');

    const totalPaid = paid.reduce((s, c) => s + (c.amount || 0), 0);
    const totalFees = paid.reduce((s, c) => s + (c.fees || 0), 0);

    const paidMonths = paid.map(p => p.month);
    const missingMonths = MONTHS.filter(m => !paidMonths.includes(m));

    return {
      memberId,
      totalPaid,
      totalFees,
      paidCount: paid.length,
      pendingCount: pending.length,
      missingMonths,
    };
  }

  // Loan ceiling: 150% of total paid contributions (all time)
  computeLoanCeiling(memberId) {
    memberId = parseInt(memberId);
    const contributions = this.getAllContributions().filter(c => parseInt(c.memberId) === memberId && c.status === 'paid');
    const totalPaid = contributions.reduce((s, c) => s + (c.amount || 0), 0);
    return Math.floor(totalPaid * 1.5);
  }
}

export default new ContributionController();