import api from '../services/apiClient';

// Signatures de présence + avis des réunions mensuelles. Un membre ne peut
// signer que pour lui-même (le serveur déduit son identité du JWT) ; la
// lecture est ouverte à tous, pour la transparence.
const normalize = (f) => ({ ...f, id: f._id });

class MeetingFeedbackController {
  async getAll() {
    const data = await api.get('/meeting-feedback');
    return data.map(normalize);
  }

  async submitMine({ present, satisfaction, comment }) {
    try {
      const entry = await api.post('/meeting-feedback', { present, satisfaction, comment });
      return { success: true, entry: normalize(entry) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

export default new MeetingFeedbackController();
