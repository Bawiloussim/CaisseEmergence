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
    return JSON.parse(localStorage.getItem(this.keys.CONTRIBUTIONS) || '[]');
  }

  saveContributions(contributions) {
    localStorage.setItem(this.keys.CONTRIBUTIONS, JSON.stringify(contributions));
  }

  getLoans() {
    return JSON.parse(localStorage.getItem(this.keys.LOANS) || '[]');
  }

  saveLoans(loans) {
    localStorage.setItem(this.keys.LOANS, JSON.stringify(loans));
  }

  getAids() {
    return JSON.parse(localStorage.getItem(this.keys.AIDS) || '[]');
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