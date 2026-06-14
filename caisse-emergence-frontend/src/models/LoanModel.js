export class LoanModel {
  constructor(data) {
    this.id = data.id || Date.now();
    this.memberId = data.memberId;
    this.amount = data.amount || 0;
    this.duration = data.duration || 3;
    this.interests = Math.round((data.amount || 0) * 0.1);
    this.total = (data.amount || 0) + this.interests;
    this.monthlyPayment = Math.round(this.total / this.duration);
    this.motif = data.motif || '';
    this.status = data.status || 'pending';
    this.requestDate = data.requestDate || new Date().toISOString().split('T')[0];
    this.approvalDate = data.approvalDate || null;
    // votes: array of { memberId, vote: 'yes'|'no' }
    this.votes = data.votes || [];
  }

  calculateMaxLoan(totalContributions) {
    return totalContributions * 1.5;
  }

  validate(totalContributions) {
    const errors = [];
    if (!this.memberId) errors.push('Membre requis');
    if (this.amount <= 0) errors.push('Montant invalide');
    if (this.amount > this.calculateMaxLoan(totalContributions)) {
      errors.push(`Montant maximum autorisé: ${this.calculateMaxLoan(totalContributions)} FCFA`);
    }
    if (this.duration < 1 || this.duration > 3) errors.push('Durée doit être entre 1 et 3 mois');
    return errors;
  }
}