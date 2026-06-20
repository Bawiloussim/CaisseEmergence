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
  it("signe la présence et l'avis du membre connecté pour le mois en cours", async () => {
    setCycleDate('2026-06-15');
    const { memberToken } = await createSecretaryAndMember();

    const res = await request(app)
      .post('/api/meeting-feedback')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ present: true, satisfaction: 'satisfait', comment: 'Très bonne réunion' });

    expect(res.status).toBe(200);
    expect(res.body.month).toBe('JUIN');
    expect(res.body.present).toBe(true);
    expect(res.body.satisfaction).toBe('satisfait');
  });

  it('ignore le memberId envoyé dans le corps : seul le compte connecté est signé', async () => {
    setCycleDate('2026-06-15');
    const { secretary, member, memberToken } = await createSecretaryAndMember();

    const res = await request(app)
      .post('/api/meeting-feedback')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ memberId: secretary._id, present: true, satisfaction: 'satisfait' });

    expect(res.status).toBe(200);
    expect(String(res.body.memberId)).toBe(String(member._id));
  });

  it('met à jour (upsert) la même entrée si le membre signe à nouveau le même mois', async () => {
    setCycleDate('2026-06-15');
    const { memberToken } = await createSecretaryAndMember();

    await request(app)
      .post('/api/meeting-feedback')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ present: false, satisfaction: 'insatisfait', comment: 'Premier avis' });

    const res = await request(app)
      .post('/api/meeting-feedback')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ present: true, satisfaction: 'satisfait', comment: 'Avis corrigé' });

    expect(res.status).toBe(200);
    expect(res.body.present).toBe(true);
    expect(res.body.comment).toBe('Avis corrigé');

    const all = await request(app)
      .get('/api/meeting-feedback')
      .set('Authorization', `Bearer ${memberToken}`);
    expect(all.body).toHaveLength(1);
  });

  it("refuse en dehors d'un mois de réunion ouvert (hors phase pilote)", async () => {
    setCycleDate('2026-01-15');
    const { memberToken } = await createSecretaryAndMember();

    const res = await request(app)
      .post('/api/meeting-feedback')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ present: true, satisfaction: 'satisfait' });

    expect(res.status).toBe(400);
  });

  it("un autre membre voit la signature d'un membre une fois enregistrée", async () => {
    setCycleDate('2026-06-15');
    const { secToken, memberToken } = await createSecretaryAndMember();

    await request(app)
      .post('/api/meeting-feedback')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ present: true, satisfaction: 'satisfait', comment: 'Présent' });

    const res = await request(app)
      .get('/api/meeting-feedback')
      .set('Authorization', `Bearer ${secToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].comment).toBe('Présent');
  });
});
