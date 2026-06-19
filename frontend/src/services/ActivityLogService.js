const KEY = 'Caisse_emergence_activity_log';
const MAX_ENTRIES = 200;

// Journal local des actions sur les ressources qui ne vivent que dans le
// navigateur (cotisations, prêts, aides) — les actions sur les membres,
// elles, sont journalisées côté serveur (voir /api/audit-logs).
class ActivityLogService {
  getLogs() {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  }

  log({ action, resource, label, actorName }) {
    const logs = this.getLogs();
    logs.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      action,
      resource,
      resourceLabel: label,
      actorName: actorName || '',
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(KEY, JSON.stringify(logs.slice(0, MAX_ENTRIES)));
  }
}

export default new ActivityLogService();
