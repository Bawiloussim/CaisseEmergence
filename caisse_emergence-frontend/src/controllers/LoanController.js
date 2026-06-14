import StorageService from '../services/StorageService';
import { LoanModel } from '../models/LoanModel';
import ContributionController from './ContributionController';

class LoanController {
  getAllLoans() {
    return StorageService.getLoans();
  }

  getLoanById(id) {
    const loans = this.getAllLoans();
    return loans.find(l => l.id === parseInt(id));
  }

  addLoan(loanData, totalContributions = 0) {
    console.log('LoanController.addLoan called with', loanData, 'totalContributions', totalContributions);
    const loan = new LoanModel(loanData);

    // normalize memberId
    loan.memberId = parseInt(loan.memberId);

    // if caller didn't provide totalContributions, compute from contributions
    try {
      if (!totalContributions && loan.memberId) {
        const summary = ContributionController.getMemberContributionSummary(loan.memberId) || { totalPaid: 0 };
        totalContributions = Number(summary.totalPaid || 0);
      }
    } catch {
      totalContributions = Number(totalContributions || 0);
    }

    const errors = loan.validate(totalContributions || 0);
    if (errors.length > 0) {
      console.warn('Loan validation failed', errors, loan, { totalContributions });
      return { success: false, errors };
    }

    const loans = this.getAllLoans();
    // store plain object to avoid prototype issues
    const loanObj = JSON.parse(JSON.stringify(loan));
    try {
      loans.push(loanObj);
      StorageService.saveLoans(loans);
      console.log('Loan saved', loanObj);
      return { success: true, loan: loanObj };
    } catch (err) {
      console.error('Failed to save loan', err);
      return { success: false, error: err.message || String(err) };
    }
  }

  updateLoanStatus(id, status) {
    const loans = this.getAllLoans();
    const index = loans.findIndex(l => l.id === parseInt(id));
    if (index === -1) return { success: false, message: 'Prêt non trouvé' };
    loans[index].status = status;
    StorageService.saveLoans(loans);
    return { success: true };
  }

  updateLoan(id, data) {
    const loans = this.getAllLoans();
    const index = loans.findIndex(l => l.id === parseInt(id));
    if (index === -1) return { success: false, message: 'Prêt non trouvé' };

    // merge and recalculate derived fields
    const updated = { ...loans[index], ...data };
    // ensure numeric types
    updated.memberId = parseInt(updated.memberId);
    updated.amount = Number(updated.amount || 0);
    updated.duration = parseInt(updated.duration || 1);
    updated.interests = Math.round((updated.amount || 0) * 0.1);
    updated.total = (updated.amount || 0) + updated.interests;
    updated.monthlyPayment = Math.round(updated.total / (updated.duration || 1));

    loans[index] = updated;
    try {
      StorageService.saveLoans(loans);
      return { success: true, loan: updated };
    } catch (err) {
      return { success: false, error: err.message || String(err) };
    }
  }

  // Add or update a vote for a loan by a member
  addVote(loanId, memberId, vote) {
    const loans = this.getAllLoans();
    const index = loans.findIndex(l => l.id === parseInt(loanId));
    if (index === -1) return { success: false, message: 'Prêt non trouvé' };

    const loan = loans[index];
    // ensure votes array
    loan.votes = loan.votes || [];

    // replace existing vote by same member
    const existing = loan.votes.find(v => parseInt(v.memberId) === parseInt(memberId));
    if (existing) {
      existing.vote = vote;
    } else {
      loan.votes.push({ memberId: parseInt(memberId), vote });
    }

    // Tally votes and decide if majority reached
    const members = StorageService.getMembers();
    const totalMembers = members.length;
    const yes = loan.votes.filter(v => v.vote === 'yes').length;
    const no = loan.votes.filter(v => v.vote === 'no').length;

    // simple majority (>50%)
    if (yes > totalMembers / 2) {
      loan.status = 'approved';
      loan.approvalDate = new Date().toISOString().split('T')[0];
    } else if (no > totalMembers / 2) {
      loan.status = 'rejected';
      loan.approvalDate = new Date().toISOString().split('T')[0];
    }

    loans[index] = loan;
    StorageService.saveLoans(loans);
    return { success: true, loan };
  }
}

export default new LoanController();
