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

  it('permet à un membre non secrétaire de demander un prêt pour lui-même', async () => {
    const { borrower, borrowerToken } = await setup();
    const res = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${borrowerToken}`)
      .send({ memberId: borrower._id, amount: 10000 });

    expect(res.status).toBe(201);
    expect(String(res.body.memberId)).toBe(String(borrower._id));
    expect(res.body.status).toBe('pending');
  });

  it('ignore le memberId et le statut fournis par un membre non secrétaire (force soi-même et "pending")', async () => {
    const { borrower, voter, borrowerToken } = await setup();
    const res = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${borrowerToken}`)
      .send({ memberId: voter._id, amount: 10000, status: 'approved' });

    expect(res.status).toBe(201);
    expect(String(res.body.memberId)).toBe(String(borrower._id));
    expect(res.body.status).toBe('pending');
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

  it('approuve automatiquement quand tous les votants éligibles ont voté oui', async () => {
    const { borrower, secToken, voterToken } = await setup();
    const loan = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${secToken}`)
      .send({ memberId: borrower._id, amount: 10000 });

    // 1 seul "oui" sur 2 votants éligibles (secrétaire + votant) : pas encore majoritaire.
    const firstVote = await request(app)
      .post(`/api/loans/${loan.body._id}/vote`)
      .set('Authorization', `Bearer ${voterToken}`)
      .send({ vote: 'yes' });
    expect(firstVote.body.status).toBe('pending');

    // Le 2e votant éligible vote aussi "oui" : unanimité atteinte → approuvé.
    const secondVote = await request(app)
      .post(`/api/loans/${loan.body._id}/vote`)
      .set('Authorization', `Bearer ${secToken}`)
      .send({ vote: 'yes' });
    expect(secondVote.body.status).toBe('approved');
  });

  it("approuve automatiquement même avec un seul votant éligible (petite caisse)", async () => {
    // Seulement 2 membres au total : le secrétaire et l'emprunteur. Le
    // secrétaire est donc le seul votant éligible — son "oui" doit suffire
    // à approuver le prêt, pas rester bloqué faute de majorité absolue.
    await Member.create({ name: 'Secrétaire', email: 'sec@example.com', password: 'secret123', accountRole: 'secretaire' });
    const borrower = await Member.create({ name: 'Emprunteur', email: 'emprunteur@example.com', password: 'secret123', accountRole: 'membre' });
    const secToken = await loginAs('sec@example.com', 'secret123');

    const loan = await request(app)
      .post('/api/loans')
      .set('Authorization', `Bearer ${secToken}`)
      .send({ memberId: borrower._id, amount: 10000 });

    const voteRes = await request(app)
      .post(`/api/loans/${loan.body._id}/vote`)
      .set('Authorization', `Bearer ${secToken}`)
      .send({ vote: 'yes' });

    expect(voteRes.body.status).toBe('approved');
  });
});
