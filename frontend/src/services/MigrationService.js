import api from './apiClient';
import StorageService from './StorageService';
import MemberController from '../controllers/MemberController';

const FLAG_KEY = 'Caisse_emergence_migration_v1_done';

// Cotisations/prêts/aides vivaient uniquement dans le localStorage du
// secrétaire ; les autres comptes ne les voyaient jamais. On les envoie une
// seule fois vers le serveur partagé, en traduisant l'id local (propre à
// chaque navigateur) vers l'accountId stable du membre (l'_id MongoDB).
// Les votes ne sont pas repris : ils n'étaient eux-mêmes jamais partagés
// entre navigateurs, donc rien de cohérent à migrer.
async function migrateIfNeeded(isSecretary) {
  if (localStorage.getItem(FLAG_KEY)) return null;

  // Seul le secrétaire a pu créer des données réelles localement ; les
  // comptes membres n'ont par ailleurs pas le droit d'écrire ces ressources.
  if (!isSecretary) {
    localStorage.setItem(FLAG_KEY, '1');
    return null;
  }

  const members = MemberController.getAllMembers();
  const findAccountId = (localId) => members.find((m) => m.id === parseInt(localId))?.accountId;

  const contributions = StorageService.getContributions();
  const loans = StorageService.getLoans();
  const aids = StorageService.getAids();

  let migrated = 0;
  let failed = 0;

  for (const c of contributions) {
    const accountId = findAccountId(c.memberId);
    if (!accountId) continue;
    try {
      await api.post('/contributions', {
        memberId: accountId,
        month: c.month,
        amount: c.amount,
        fees: c.fees,
        status: c.status,
        paymentDate: c.paymentDate,
        paymentMethod: c.paymentMethod,
        reference: c.reference,
      });
      migrated += 1;
    } catch {
      failed += 1;
    }
  }

  for (const l of loans) {
    const accountId = findAccountId(l.memberId);
    if (!accountId) continue;
    try {
      await api.post('/loans', {
        memberId: accountId,
        amount: l.amount,
        duration: l.duration,
        motif: l.motif,
        status: l.status,
        requestDate: l.requestDate,
      });
      migrated += 1;
    } catch {
      failed += 1;
    }
  }

  for (const a of aids) {
    const accountId = findAccountId(a.memberId);
    if (!accountId) continue;
    try {
      await api.post('/aids', {
        memberId: accountId,
        amount: a.amount,
        motif: a.motif,
        date: a.date,
      });
      migrated += 1;
    } catch {
      failed += 1;
    }
  }

  localStorage.setItem(FLAG_KEY, '1');
  return { migrated, failed };
}

export default { migrateIfNeeded };
