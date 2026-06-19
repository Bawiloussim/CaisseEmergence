import { describe, it, expect } from 'vitest';
import { LoanModel } from './LoanModel';

describe('LoanModel', () => {
  it('calcule les intérêts à 10% et la mensualité', () => {
    const loan = new LoanModel({ memberId: 1, amount: 10000, duration: 2 });
    expect(loan.interests).toBe(1000);
    expect(loan.total).toBe(11000);
    expect(loan.monthlyPayment).toBe(5500);
  });

  it('plafonne le prêt à 1.5x les cotisations totales', () => {
    const loan = new LoanModel({ memberId: 1, amount: 0 });
    expect(loan.calculateMaxLoan(10000)).toBe(15000);
  });

  it('refuse un prêt sans membre', () => {
    const errors = new LoanModel({ amount: 1000, duration: 2 }).validate(10000);
    expect(errors).toContain('Membre requis');
  });

  it('refuse un montant invalide', () => {
    const errors = new LoanModel({ memberId: 1, amount: 0, duration: 2 }).validate(10000);
    expect(errors).toContain('Montant invalide');
  });

  it('refuse un montant supérieur au plafond autorisé', () => {
    const errors = new LoanModel({ memberId: 1, amount: 20000, duration: 2 }).validate(10000);
    expect(errors.some((e) => e.startsWith('Montant maximum autorisé'))).toBe(true);
  });

  it('refuse une durée hors de la plage 1 à 3 mois', () => {
    const errors = new LoanModel({ memberId: 1, amount: 1000, duration: 4 }).validate(10000);
    expect(errors).toContain('Durée doit être entre 1 et 3 mois');
  });

  it('accepte un prêt valide', () => {
    const errors = new LoanModel({ memberId: 1, amount: 5000, duration: 3 }).validate(10000);
    expect(errors).toHaveLength(0);
  });
});
