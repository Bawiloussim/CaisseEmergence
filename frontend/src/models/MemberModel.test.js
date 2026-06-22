import { describe, it, expect } from 'vitest';
import { MemberModel } from './MemberModel';

describe('MemberModel.validate', () => {
  it('refuse un membre sans nom', () => {
    const errors = new MemberModel({ name: '', monthlyContribution: 5000 }).validate();
    expect(errors).toContain('Le nom est requis');
  });

  it('refuse une cotisation inférieure à 5000 FCFA', () => {
    const errors = new MemberModel({ name: 'Test', monthlyContribution: 4999 }).validate();
    expect(errors).toContain('La cotisation minimale est de 5000 FCFA');
  });

  it('accepte un membre valide avec la cotisation minimale', () => {
    const errors = new MemberModel({ name: 'Test', monthlyContribution: 5000 }).validate();
    expect(errors).toHaveLength(0);
  });

  it('accepte une cotisation supérieure au minimum', () => {
    const errors = new MemberModel({ name: 'Test', monthlyContribution: 15000 }).validate();
    expect(errors).toHaveLength(0);
  });
});
