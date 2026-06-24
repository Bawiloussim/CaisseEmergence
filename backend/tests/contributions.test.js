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

async function createValidatorsAndMember() {
  await Member.create({ name: 'Secrétaire', email: 'sec@example.com', password: 'secret123', accountRole: 'secretaire' });
  await Member.create({ name: 'Trésorier', email: 'tres@example.com', password: 'secret123', accountRole: 'tresorier' });
  await Member.create({ name: 'Président', email: 'pres@example.com', password: 'secret123', accountRole: 'president' });
  const member = await Member.create({ name: 'Membre', email: 'membre@example.com', password: 'secret123', accountRole: 'membre' });
  const secToken = await loginAs('sec@example.com', 'secret123');
  const tresToken = await loginAs('tres@example.com', 'secret123');
  const presToken = await loginAs('pres@example.com', 'secret123');
  const memberToken = await loginAs('membre@example.com', 'secret123');
  return { member, secToken, tresToken, presToken, memberToken };
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

  it('permet à un membre de soumettre plusieurs preuves pour le même mois (paiements fractionnés)', async () => {
    const { member, memberToken } = await createSecretaryAndMember();
    await request(app)
      .post('/api/contributions')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ memberId: member._id, month: 'JUIN', amount: 10000, proofImage: 'data:image/png;base64,abc' });

    const res = await request(app)
      .post('/api/contributions')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ memberId: member._id, month: 'JUIN', amount: 2000, proofImage: 'data:image/png;base64,def' });

    expect(res.status).toBe(201);
    expect(res.body.amount).toBe(2000);

    const list = await request(app).get('/api/contributions').set('Authorization', `Bearer ${memberToken}`);
    expect(list.body).toHaveLength(2);
  });

  it('ne facture les 300 FCFA de frais de gestion qu\'une seule fois par membre et par mois', async () => {
    const { member, secToken } = await createSecretaryAndMember();
    const first = await request(app)
      .post('/api/contributions')
      .set('Authorization', `Bearer ${secToken}`)
      .send({ memberId: member._id, month: 'JUIN', amount: 10000 });
    expect(first.body.fees).toBe(300);

    const second = await request(app)
      .post('/api/contributions')
      .set('Authorization', `Bearer ${secToken}`)
      .send({ memberId: member._id, month: 'JUIN', amount: 5000, fees: 300 });
    expect(second.body.fees).toBe(0);
  });

  it('refuse un versement inférieur au minimum de 2000 FCFA', async () => {
    const { member, secToken } = await createSecretaryAndMember();
    const res = await request(app)
      .post('/api/contributions')
      .set('Authorization', `Bearer ${secToken}`)
      .send({ memberId: member._id, month: 'JUIN', amount: 1000 });

    expect(res.status).toBe(400);
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

describe('POST /api/contributions/:id/validate', () => {
  it("ne passe en \"paid\" qu'une fois les trois rôles validés", async () => {
    const { member, secToken, tresToken, presToken } = await createValidatorsAndMember();
    const created = await request(app)
      .post('/api/contributions')
      .set('Authorization', `Bearer ${secToken}`)
      .send({ memberId: member._id, month: 'JUIN', amount: 10000 });
    const id = created.body._id;

    const afterSec = await request(app)
      .post(`/api/contributions/${id}/validate`)
      .set('Authorization', `Bearer ${secToken}`);
    expect(afterSec.status).toBe(200);
    expect(afterSec.body.status).toBe('pending');
    expect(afterSec.body.validations.secretaire.validated).toBe(true);

    const afterTres = await request(app)
      .post(`/api/contributions/${id}/validate`)
      .set('Authorization', `Bearer ${tresToken}`);
    expect(afterTres.body.status).toBe('pending');

    const afterPres = await request(app)
      .post(`/api/contributions/${id}/validate`)
      .set('Authorization', `Bearer ${presToken}`);
    expect(afterPres.body.status).toBe('paid');
    expect(afterPres.body.validations.tresorier.validated).toBe(true);
    expect(afterPres.body.validations.president.validated).toBe(true);
  });

  it('refuse la validation à un membre simple', async () => {
    const { member, secToken, memberToken } = await createValidatorsAndMember();
    const created = await request(app)
      .post('/api/contributions')
      .set('Authorization', `Bearer ${secToken}`)
      .send({ memberId: member._id, month: 'JUIN', amount: 10000 });

    const res = await request(app)
      .post(`/api/contributions/${created.body._id}/validate`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(403);
  });

  it('le statut "paid" envoyé par le secrétaire à la création ne compte que comme son propre vote', async () => {
    const { member, secToken } = await createValidatorsAndMember();
    const res = await request(app)
      .post('/api/contributions')
      .set('Authorization', `Bearer ${secToken}`)
      .send({ memberId: member._id, month: 'JUIN', amount: 10000, status: 'paid' });

    expect(res.body.status).toBe('pending');
    expect(res.body.validations.secretaire.validated).toBe(true);
    expect(res.body.validations.tresorier.validated).toBe(false);
  });
});

describe('DELETE /api/contributions/:id/validate', () => {
  it('annule le vote du valideur et repasse "paid" en "pending"', async () => {
    const { member, secToken, tresToken, presToken } = await createValidatorsAndMember();
    const created = await request(app)
      .post('/api/contributions')
      .set('Authorization', `Bearer ${secToken}`)
      .send({ memberId: member._id, month: 'JUIN', amount: 10000 });
    const id = created.body._id;

    await request(app).post(`/api/contributions/${id}/validate`).set('Authorization', `Bearer ${secToken}`);
    await request(app).post(`/api/contributions/${id}/validate`).set('Authorization', `Bearer ${tresToken}`);
    const fullyValidated = await request(app)
      .post(`/api/contributions/${id}/validate`)
      .set('Authorization', `Bearer ${presToken}`);
    expect(fullyValidated.body.status).toBe('paid');

    const res = await request(app)
      .delete(`/api/contributions/${id}/validate`)
      .set('Authorization', `Bearer ${presToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('pending');
    expect(res.body.validations.president.validated).toBe(false);
    expect(res.body.validations.secretaire.validated).toBe(true);
  });

  it("refuse d'annuler un vote qui n'a pas été donné", async () => {
    const { member, secToken, tresToken } = await createValidatorsAndMember();
    const created = await request(app)
      .post('/api/contributions')
      .set('Authorization', `Bearer ${secToken}`)
      .send({ memberId: member._id, month: 'JUIN', amount: 10000 });

    const res = await request(app)
      .delete(`/api/contributions/${created.body._id}/validate`)
      .set('Authorization', `Bearer ${tresToken}`);

    expect(res.status).toBe(400);
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
