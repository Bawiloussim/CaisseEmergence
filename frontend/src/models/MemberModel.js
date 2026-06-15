export class MemberModel {
  constructor(data) {
    this.id = data.id || Date.now();
    this.name = data.name || '';
    this.role = data.role || 'Membre actif';
    this.phone = data.phone || '';
    this.cni = data.cni || '';
    this.dob = data.dob || '';
    this.joinDate = data.joinDate || new Date().toISOString().split('T')[0];
    this.address = data.address || '';
    this.monthlyContribution = data.monthlyContribution || 5000;
    this.momoNumber = data.momoNumber || '';
    this.photo = data.photo || '';
    this.createdAt = data.createdAt || new Date().toISOString();

    // Compte de connexion (espace membres) lié à ce membre
    this.email = data.email || '';
    this.accountRole = data.accountRole || 'membre'; // 'secretaire' | 'membre'
    this.accountId = data.accountId || ''; // identifiant du compte côté backend (MongoDB)
  }

  validate() {
    const errors = [];
    if (!this.name) errors.push('Le nom est requis');
    if (this.monthlyContribution < 5000) errors.push('La cotisation minimale est de 5000 FCFA');
    return errors;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      phone: this.phone,
      cni: this.cni,
      dob: this.dob,
      joinDate: this.joinDate,
      address: this.address,
      monthlyContribution: this.monthlyContribution,
      momoNumber: this.momoNumber,
      photo: this.photo,
      createdAt: this.createdAt,
      email: this.email,
      accountRole: this.accountRole,
      accountId: this.accountId,
    };
  }
}