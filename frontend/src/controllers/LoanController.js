import api from '../services/apiClient';

// Les prêts vivent désormais côté serveur (MongoDB) : le vote et le statut
// sont partagés entre tous les comptes, peu importe l'appareil utilisé.
const normalize = (l) => ({ ...l, id: l._id });

class LoanController {
  async getAllLoans() {
    const data = await api.get('/loans');
    return data.map(normalize);
  }

  async getLoanById(id) {
    const loans = await this.getAllLoans();
    return loans.find((l) => l.id === id);
  }

  async addLoan(loanData) {
    try {
      const loan = await api.post('/loans', loanData);
      return { success: true, loan: normalize(loan) };
    } catch (err) {
      return { success: false, errors: [err.message] };
    }
  }

  async updateLoan(id, data) {
    try {
      const loan = await api.put(`/loans/${id}`, data);
      return { success: true, loan: normalize(loan) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async deleteLoan(id) {
    try {
      await api.delete(`/loans/${id}`);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // Le membre votant est déduit du token JWT côté serveur — impossible de
  // voter "à la place" d'un autre compte.
  async addVote(loanId, vote) {
    try {
      const loan = await api.post(`/loans/${loanId}/vote`, { vote });
      return { success: true, loan: normalize(loan) };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }
}

export default new LoanController();
