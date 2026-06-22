const request = require('supertest');
const app = require('../app');
const Member = require('../models/Member');
const { connect, clear, close } = require('./testDb');

beforeAll(async () => {
  await connect();
});

afterEach(async () => {
  await clear();
});

afterAll(async () => {
  await close();
});

async function loginAs(email, password) {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body.token;
}

async function createSecretaryAndMember() {
  await Member.create({ name: 'Secrétaire', email: 'sec@example.com', password: 'secret123', accountRole: 'secretaire' });
  const member = await Member.create({ name: 'Membre', email: 'membre@example.com', password: 'secret123', accountRole: 'membre' });
  const secToken = await loginAs('sec@example.com', 'secret123');
  const memberToken = await loginAs('membre@example.com', 'secret123');
  return { member, secToken, memberToken };
}

describe('POST /api/contributions', () => {
  it('crée une cotisation quand on est secrétaire', async () => {
    const { member, secToken } = await createSecretaryAndMember();
    const res = await request(app)
      .post('/api/contributions')
      .set('Authorization', `Bearer ${secToken}`)
      .send({ memberId: member._id, month: 'JUIN', amount: 10000, fees: 300, status: 'paid' });

    expect(res.status).toBe(201);
    expect(res.body.amount).toBe(10000);
  });

  it('refuse à un membre non secrétaire de créer une cotisation sans preuve de paiement', async () => {
    const { member, memberToken } = await createSecretaryAndMember();
    const res = await request(app)
      .post('/api/contributions')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ memberId: member._id, month: 'JUIN', amount: 10000 });

    expect(res.status).toBe(400);
  });

  it('permet à un membre non secrétaire d\'importer la preuve de son propre paiement', async () => {
    const { member, memberToken } = await createSecretaryAndMember();
    const res = await request(app)
      .post('/api/contributions')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ memberId: member._id, month: 'JUIN', amount: 10000, proofImage: 'data:image/png;base64,abc' });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('pending');
    expect(res.body.proofImage).toBe('data:image/png;base64,abc');
  });

  it('ignore le memberId et le statut fournis par un membre non secrétaire (force soi-même et "pending")', async () => {
    const { member, memberToken } = await createSecretaryAndMember();
    const other = await Member.create({ name: 'Autre', email: 'autre@example.com', password: 'secret123', accountRole: 'membre' });

    const res = await request(app)
      .post('/api/contributions')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ memberId: other._id, month: 'JUIN', amount: 10000, status: 'paid', proofImage: 'data:image/png;base64,abc' });

    expect(res.status).toBe(201);
    expect(String(res.body.memberId)).toBe(String(member._id));
    expect(res.body.status).toBe('pending');
  });

  it('permet à un membre de renvoyer une preuve corrigée tant que son paiement n\'est pas validé', async () => {
    const { member, memberToken } = await createSecretaryAndMember();
    await request(app)
      .post('/api/contributions')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ memberId: member._id, month: 'JUIN', amount: 10000, proofImage: 'data:image/png;base64,abc' });

    const res = await request(app)
      .post('/api/contributions')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ memberId: member._id, month: 'JUIN', amount: 12000, proofImage: 'data:image/png;base64,def' });

    expect(res.status).toBe(200);
    expect(res.body.amount).toBe(12000);
    expect(res.body.proofImage).toBe('data:image/png;base64,def');
  });

  it('refuse un doublon membre+mois', async () => {
    const { member, secToken } = await createSecretaryAndMember();
    await request(app)
      .post('/api/contributions')
      .set('Authorization', `Bearer ${secToken}`)
      .send({ memberId: member._id, month: 'JUIN', amount: 10000 });

    const res = await request(app)
      .post('/api/contributions')
      .set('Authorization', `Bearer ${secToken}`)
      .send({ memberId: member._id, month: 'JUIN', amount: 5000 });

    expect(res.status).toBe(409);
  });

  it('un autre membre voit la cotisation créée par le secrétaire', async () => {
    const { member, secToken, memberToken } = await createSecretaryAndMember();
    await request(app)
      .post('/api/contributions')
      .set('Authorization', `Bearer ${secToken}`)
      .send({ memberId: member._id, month: 'JUIN', amount: 10000, status: 'paid' });

    const res = await request(app)
      .get('/api/contributions')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].amount).toBe(10000);
  });
});

describe('DELETE /api/contributions/:id', () => {
  it('supprime une cotisation', async () => {
    const { member, secToken } = await createSecretaryAndMember();
    const created = await request(app)
      .post('/api/contributions')
      .set('Authorization', `Bearer ${secToken}`)
      .send({ memberId: member._id, month: 'JUIN', amount: 10000 });

    const res = await request(app)
      .delete(`/api/contributions/${created.body._id}`)
      .set('Authorization', `Bearer ${secToken}`);

    expect(res.status).toBe(200);
  });
});
