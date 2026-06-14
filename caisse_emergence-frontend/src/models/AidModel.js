export class AidModel {
  constructor(data = {}) {
    this.id = data.id || Date.now();
    this.memberId = data.memberId;
    this.amount = data.amount || 0;
    this.motif = data.motif || '';
    this.date = data.date || new Date().toISOString().split('T')[0];
  }

  validate() {
    const errors = [];
    if (!this.memberId) errors.push('Membre requis');
    if (this.amount <= 0) errors.push('Montant invalide');
    return errors;
  }
}

export default AidModel;
