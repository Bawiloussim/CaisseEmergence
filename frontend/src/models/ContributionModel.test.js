import { describe, it, expect } from 'vitest';
import { ContributionModel } from './ContributionModel';

describe('ContributionModel.validate', () => {
  it('refuse une cotisation sans membre', () => {
    const errors = new ContributionModel({ month: 'JUIN', amount: 5000 }).validate();
    expect(errors).toContain('Membre requis');
  });

  it('refuse une cotisation sans mois', () => {
    const errors = new ContributionModel({ memberId: 1, amount: 5000 }).validate();
    expect(errors).toContain('Mois requis');
  });

  it('refuse un montant négatif', () => {
    const errors = new ContributionModel({ memberId: 1, month: 'JUIN', amount: -100 }).validate();
    expect(errors).toContain('Le montant doit être supérieur à 0');
  });

  it('accepte tout montant positif, même en dessous de 5000 FCFA', () => {
    const errors = new ContributionModel({ memberId: 1, month: 'JUIN', amount: 1 }).validate();
    expect(errors).toHaveLength(0);
  });

  it('accepte une cotisation valide', () => {
    const errors = new ContributionModel({ memberId: 1, month: 'JUIN', amount: 5000 }).validate();
    expect(errors).toHaveLength(0);
  });
});
