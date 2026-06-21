import api from '../services/apiClient';

class ChatController {
  async getMessages() {
    return api.get('/chat/messages');
  }

  async sendMessage(text) {
    return api.post('/chat/messages', { text });
  }

  async heartbeat() {
    return api.post('/chat/heartbeat', {});
  }

  async getOnlineMembers() {
    return api.get('/chat/online');
  }
}

export default new ChatController();
