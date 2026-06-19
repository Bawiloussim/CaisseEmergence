class StorageService {
  constructor() {
    this.keys = {
      MEMBERS: 'Caisse_emergence_members',
      CONTRIBUTIONS: 'Caisse_emergence_contributions',
      LOANS: 'Caisse_emergence_loans',
      AIDS: 'Caisse_emergence_aids',
      SETTINGS: 'Caisse_emergence_settings',
    };
    this.initializeData();
  }

  initializeData() {
    // Initialiser les membres par défaut si vide
    // Start with empty members list — creation via UI
    if (!localStorage.getItem(this.keys.MEMBERS)) {
      localStorage.setItem(this.keys.MEMBERS, JSON.stringify([]));
    }

    if (!localStorage.getItem(this.keys.CONTRIBUTIONS)) {
      localStorage.setItem(this.keys.CONTRIBUTIONS, JSON.stringify([]));
    }

    if (!localStorage.getItem(this.keys.LOANS)) {
      localStorage.setItem(this.keys.LOANS, JSON.stringify([]));
    }

    if (!localStorage.getItem(this.keys.AIDS)) {
      localStorage.setItem(this.keys.AIDS, JSON.stringify([]));
    }

    if (!localStorage.getItem(this.keys.SETTINGS)) {
      localStorage.setItem(this.keys.SETTINGS, JSON.stringify({
        logo: '',
        associationName: 'La Caisse Emergence',
        phase: 'pilote',
        representativeName: '',
        representativeTitle: '',
      }));
    }
  }

  getMembers() {
    return JSON.parse(localStorage.getItem(this.keys.MEMBERS) || '[]');
  }

  saveMembers(members) {
    localStorage.setItem(this.keys.MEMBERS, JSON.stringify(members));
  }

  getContributions() {
    const contributions = JSON.parse(localStorage.getItem(this.keys.CONTRIBUTIONS) || '[]');
    // Corrige les anciennes données enregistrées avec amount/fees en chaîne
    // (ex: 0 + "10000" donnait "010000" au lieu de 10000).
    return contributions.map((c) => ({
      ...c,
      amount: Number(c.amount) || 0,
      fees: Number(c.fees) || 0,
    }));
  }

  saveContributions(contributions) {
    localStorage.setItem(this.keys.CONTRIBUTIONS, JSON.stringify(contributions));
  }

  getLoans() {
    const loans = JSON.parse(localStorage.getItem(this.keys.LOANS) || '[]');
    return loans.map((l) => ({
      ...l,
      amount: Number(l.amount) || 0,
      interests: Number(l.interests) || 0,
      total: Number(l.total) || 0,
      monthlyPayment: Number(l.monthlyPayment) || 0,
    }));
  }

  saveLoans(loans) {
    localStorage.setItem(this.keys.LOANS, JSON.stringify(loans));
  }

  getAids() {
    const aids = JSON.parse(localStorage.getItem(this.keys.AIDS) || '[]');
    return aids.map((a) => ({
      ...a,
      amount: Number(a.amount) || 0,
    }));
  }

  saveAids(aids) {
    localStorage.setItem(this.keys.AIDS, JSON.stringify(aids));
  }

  getSettings() {
    return JSON.parse(localStorage.getItem(this.keys.SETTINGS) || '{}');
  }

  saveSettings(settings) {
    localStorage.setItem(this.keys.SETTINGS, JSON.stringify(settings));
  }
}

export default new StorageService();