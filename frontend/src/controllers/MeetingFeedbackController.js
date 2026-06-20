import api from '../services/apiClient';

// Présence + avis des réunions mensuelles. La présence n'est jamais
// auto-déclarée : seul le secrétaire peut la constater (setPresence) ;
// chaque membre ne peut donner son propre avis (submitMine) que pour
// lui-même — le serveur déduit son identité du JWT. La lecture est
// ouverte à tous, pour la transparence.
const normalize = (f) => ({ ...f, id: f._id });

class MeetingFeedbackController {
  async getAll() {
    const data = await api.get('/meeting-feedback');
    return data.map(normalize);
  }

  async submitMine({ satisfaction, comment }) {
    try {
      const entry = await api.post('/meeting-feedback', { satisfaction, comment });
      return { success: true, entry: normalize(entry) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async setPresence(memberId, present) {
    try {
      const entry = await api.put(`/meeting-feedback/${memberId}/presence`, { present });
      return { success: true, entry: normalize(entry) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async sendReminders() {
    try {
      const result = await api.post('/meeting-feedback/remind', {});
      return { success: true, ...result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

export default new MeetingFeedbackController();
