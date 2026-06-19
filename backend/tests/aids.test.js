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

async function setup() {
  await Member.create({ name: 'Secrétaire', email: 'sec@example.com', password: 'secret123', accountRole: 'secretaire' });
  const beneficiary = await Member.create({ name: 'Bénéficiaire', email: 'benef@example.com', password: 'secret123', accountRole: 'membre' });
  const secToken = await loginAs('sec@example.com', 'secret123');
  const memberToken = await loginAs('benef@example.com', 'secret123');
  return { beneficiary, secToken, memberToken };
}

describe('POST /api/aids', () => {
  it('refuse une aide si le fonds est insuffisant', async () => {
    const { beneficiary, secToken } = await setup();
    const res = await request(app)
      .post('/api/aids')
      .set('Authorization', `Bearer ${secToken}`)
      .send({ memberId: beneficiary._id, amount: 1000, motif: 'Santé' });

    expect(res.status).toBe(400);
  });

  it('crée une aide quand le fonds est suffisant, visible par un autre membre', async () => {
    const { beneficiary, secToken, memberToken } = await setup();

    // crédite le fonds via une cotisation payée (300 FCFA de frais)
    await request(app)
      .post('/api/contributions')
      .set('Authorization', `Bearer ${secToken}`)
      .send({ memberId: beneficiary._id, month: 'JUIN', amount: 10000, fees: 300, status: 'paid' });

    const res = await request(app)
      .post('/api/aids')
      .set('Authorization', `Bearer ${secToken}`)
      .send({ memberId: beneficiary._id, amount: 300, motif: 'Santé' });

    expect(res.status).toBe(201);

    const listRes = await request(app).get('/api/aids').set('Authorization', `Bearer ${memberToken}`);
    expect(listRes.body).toHaveLength(1);
  });

  it('refuse la création à un membre non secrétaire', async () => {
    const { beneficiary, memberToken } = await setup();
    const res = await request(app)
      .post('/api/aids')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ memberId: beneficiary._id, amount: 1000 });

    expect(res.status).toBe(403);
  });
});
