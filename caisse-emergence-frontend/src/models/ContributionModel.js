export class ContributionModel {
  constructor(data) {
    this.id = data.id || Date.now();
    this.memberId = data.memberId;
    this.month = data.month;
    this.amount = data.amount || 5000;
    this.fees = data.fees || 300;
    this.status = data.status || 'pending';
    this.paymentDate = data.paymentDate || new Date().toISOString().split('T')[0];
    this.paymentMethod = data.paymentMethod || 'Mobile Money';
    this.reference = data.reference || '';
  }

  validate() {
    const errors = [];
    if (!this.memberId) errors.push('Membre requis');
    if (!this.month) errors.push('Mois requis');
    if (this.amount < 5000) errors.push('Montant minimum 5000 FCFA');
    return errors;
  }
}

export const MONTHS = ['JUIN', 'JUILLET', 'AOÛT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE'];
export const MONTHS_FULL = {
  JUIN: 'Juin',
  JUILLET: 'Juillet',
  AOÛT: 'Août',
  SEPTEMBRE: 'Septembre',
  OCTOBRE: 'Octobre',
  NOVEMBRE: 'Novembre',
};