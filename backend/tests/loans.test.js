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
  const borrower = await Member.create({ name: 'Emprunteur', email: 'emprunteur@example.com', password: 'secret123', accountRole: 'membre' });
  const voter = await Member.create({ name: 'Votant', email: 'votant@example.com', password: 'secret123', accountRole: 'membre' });
  const secToken = await loginAs('sec@example.com', 'secret123');
  const borrowerToken = await loginAs('emprunteur@example.com', 'secret123');
  const voterToken = await loginAs('votant@example.com', 'secret123');
  return { borrower, voter, secToken, borrowerToken, voterToken };
}

describe('POST /api/loans', () => {
  it('crée un prêt et calcule les champs dérivés', async () => {
    const { borrower, secToken } = await setup();
    const res = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${secToken}`)
      .send({ memberId: borrower._id, amount: 10000, duration: 2, motif: 'Ecole' });

    expect(res.status).toBe(201);
    expect(res.body.interests).toBe(1000);
    expect(res.body.total).toBe(11000);
    expect(res.body.monthlyPayment).toBe(5500);
  });

  it('refuse la création à un membre non secrétaire', async () => {
    const { borrower, borrowerToken } = await setup();
    const res = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${borrowerToken}`)
      .send({ memberId: borrower._id, amount: 10000 });

    expect(res.status).toBe(403);
  });
});

describe('POST /api/loans/:id/vote', () => {
  it('refuse de voter sur sa propre demande', async () => {
    const { borrower, secToken, borrowerToken } = await setup();
    const loan = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${secToken}`)
      .send({ memberId: borrower._id, amount: 10000 });

    const res = await request(app)
      .post(`/api/loans/${loan.body._id}/vote`)
      .set('Authorization', `Bearer ${borrowerToken}`)
      .send({ vote: 'yes' });

    expect(res.status).toBe(403);
  });

  it('un autre membre peut voter et la demande est visible par tous', async () => {
    const { borrower, secToken, voterToken } = await setup();
    const loan = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${secToken}`)
      .send({ memberId: borrower._id, amount: 10000 });

    const voteRes = await request(app)
      .post(`/api/loans/${loan.body._id}/vote`)
      .set('Authorization', `Bearer ${voterToken}`)
      .send({ vote: 'yes' });

    expect(voteRes.status).toBe(200);
    expect(voteRes.body.votes).toHaveLength(1);

    const listRes = await request(app)
      .get('/api/loans')
      .set('Authorization', `Bearer ${voterToken}`);
    expect(listRes.body).toHaveLength(1);
  });
});
