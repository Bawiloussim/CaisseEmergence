const request = require('supertest');
const app = require('../app');
const Member = require('../models/Member');
const { connect, clear, close } = require('./testDb');

beforeAll(async () => {
  await connect();
});

afterEach(async () => {
  jest.useRealTimers();
  await clear();
});

afterAll(async () => {
  await close();
});

function setCycleDate(isoDate) {
  jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
  jest.setSystemTime(new Date(isoDate));
}

async function loginAs(email, password) {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body.token;
}

async function createSecretaryAndMember() {
  const secretary = await Member.create({ name: 'Secrétaire', email: 'sec@example.com', password: 'secret123', accountRole: 'secretaire' });
  const member = await Member.create({ name: 'Membre', email: 'membre@example.com', password: 'secret123', accountRole: 'membre' });
  const secToken = await loginAs('sec@example.com', 'secret123');
  const memberToken = await loginAs('membre@example.com', 'secret123');
  return { secretary, member, secToken, memberToken };
}

describe('POST /api/meeting-feedback', () => {
  it("enregistre l'avis du membre connecté pour le mois en cours, sans présence", async () => {
    setCycleDate('2026-06-15');
    const { memberToken } = await createSecretaryAndMember();

    const res = await request(app)
      .post('/api/meeting-feedback')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ satisfaction: 'satisfait', comment: 'Très bonne réunion' });

    expect(res.status).toBe(200);
    expect(res.body.month).toBe('JUIN');
    expect(res.body.satisfaction).toBe('satisfait');
    expect(res.body.present).toBeNull();
  });

  it('ignore le champ présence envoyé par un membre : il ne peut pas se déclarer présent lui-même', async () => {
    setCycleDate('2026-06-15');
    const { memberToken } = await createSecretaryAndMember();

    const res = await request(app)
      .post('/api/meeting-feedback')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ present: true, satisfaction: 'satisfait' });

    expect(res.status).toBe(200);
    expect(res.body.present).toBeNull();
  });

  it('ne réinitialise pas une présence déjà constatée par le secrétaire quand le membre met à jour son avis', async () => {
    setCycleDate('2026-06-15');
    const { member, secToken, memberToken } = await createSecretaryAndMember();

    await request(app)
      .put(`/api/meeting-feedback/${member._id}/presence`)
      .set('Authorization', `Bearer ${secToken}`)
      .send({ present: true });

    const res = await request(app)
      .post('/api/meeting-feedback')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ satisfaction: 'satisfait', comment: 'Avis donné après coup' });

    expect(res.status).toBe(200);
    expect(res.body.present).toBe(true);
    expect(res.body.comment).toBe('Avis donné après coup');
  });

  it('ignore le memberId envoyé dans le corps : seul le compte connecté est mis à jour', async () => {
    setCycleDate('2026-06-15');
    const { secretary, member, memberToken } = await createSecretaryAndMember();

    const res = await request(app)
      .post('/api/meeting-feedback')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ memberId: secretary._id, satisfaction: 'satisfait' });

    expect(res.status).toBe(200);
    expect(String(res.body.memberId)).toBe(String(member._id));
  });

  it("refuse en dehors d'un mois de réunion ouvert (hors phase pilote)", async () => {
    setCycleDate('2026-01-15');
    const { memberToken } = await createSecretaryAndMember();

    const res = await request(app)
      .post('/api/meeting-feedback')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ satisfaction: 'satisfait' });

    expect(res.status).toBe(400);
  });

  it("un autre membre voit l'avis d'un membre une fois enregistré", async () => {
    setCycleDate('2026-06-15');
    const { secToken, memberToken } = await createSecretaryAndMember();

    await request(app)
      .post('/api/meeting-feedback')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ satisfaction: 'satisfait', comment: 'Très satisfait' });

    const res = await request(app)
      .get('/api/meeting-feedback')
      .set('Authorization', `Bearer ${secToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].comment).toBe('Très satisfait');
  });
});

describe('PUT /api/meeting-feedback/:memberId/presence', () => {
  it('permet au secrétaire de constater la présence de tout membre', async () => {
    setCycleDate('2026-06-15');
    const { member, secToken } = await createSecretaryAndMember();

    const res = await request(app)
      .put(`/api/meeting-feedback/${member._id}/presence`)
      .set('Authorization', `Bearer ${secToken}`)
      .send({ present: true });

    expect(res.status).toBe(200);
    expect(res.body.present).toBe(true);
    expect(String(res.body.memberId)).toBe(String(member._id));
  });

  it('refuse à un membre non secrétaire de marquer une présence', async () => {
    setCycleDate('2026-06-15');
    const { secretary, memberToken } = await createSecretaryAndMember();

    const res = await request(app)
      .put(`/api/meeting-feedback/${secretary._id}/presence`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ present: true });

    expect(res.status).toBe(403);
  });

  it("ne réinitialise pas l'avis déjà donné par le membre quand le secrétaire marque sa présence", async () => {
    setCycleDate('2026-06-15');
    const { member, secToken, memberToken } = await createSecretaryAndMember();

    await request(app)
      .post('/api/meeting-feedback')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ satisfaction: 'insatisfait', comment: 'Réunion décalée' });

    const res = await request(app)
      .put(`/api/meeting-feedback/${member._id}/presence`)
      .set('Authorization', `Bearer ${secToken}`)
      .send({ present: false });

    expect(res.status).toBe(200);
    expect(res.body.present).toBe(false);
    expect(res.body.satisfaction).toBe('insatisfait');
    expect(res.body.comment).toBe('Réunion décalée');
  });

  it("refuse en dehors d'un mois de réunion ouvert", async () => {
    setCycleDate('2026-01-15');
    const { member, secToken } = await createSecretaryAndMember();

    const res = await request(app)
      .put(`/api/meeting-feedback/${member._id}/presence`)
      .set('Authorization', `Bearer ${secToken}`)
      .send({ present: true });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/meeting-feedback/remind', () => {
  it('refuse le rappel à un membre non secrétaire', async () => {
    setCycleDate('2026-06-15');
    const { memberToken } = await createSecretaryAndMember();

    const res = await request(app)
      .post('/api/meeting-feedback/remind')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(403);
  });

  it("ne compte que les membres n'ayant pas encore donné leur avis le mois en cours", async () => {
    setCycleDate('2026-06-15');
    const { member, secToken, memberToken } = await createSecretaryAndMember();

    // Le membre donne son avis : il ne doit plus faire partie des rappels,
    // même si le secrétaire a déjà constaté sa présence séparément.
    await request(app)
      .put(`/api/meeting-feedback/${member._id}/presence`)
      .set('Authorization', `Bearer ${secToken}`)
      .send({ present: true });
    await request(app)
      .post('/api/meeting-feedback')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ satisfaction: 'satisfait' });

    const res = await request(app)
      .post('/api/meeting-feedback/remind')
      .set('Authorization', `Bearer ${secToken}`);

    expect(res.status).toBe(200);
    // Seul le secrétaire (qui n'a pas donné son avis) reste en attente.
    expect(res.body.pendingCount).toBe(1);
  });

  it("refuse en dehors d'un mois de réunion ouvert", async () => {
    setCycleDate('2026-01-15');
    const { secToken } = await createSecretaryAndMember();

    const res = await request(app)
      .post('/api/meeting-feedback/remind')
      .set('Authorization', `Bearer ${secToken}`);

    expect(res.status).toBe(400);
  });
});
