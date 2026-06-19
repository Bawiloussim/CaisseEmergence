// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import StorageService from './StorageService';

describe('StorageService — coercion des montants existants', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('corrige les cotisations enregistrées avec amount/fees en chaîne', () => {
    localStorage.setItem(
      'Caisse_emergence_contributions',
      JSON.stringify([
        { id: 1, memberId: 1, month: 'JUIN', amount: '5000', fees: '300', status: 'paid' },
        { id: 2, memberId: 1, month: 'JUILLET', amount: '10000', fees: '300', status: 'paid' },
      ])
    );

    const contributions = StorageService.getContributions();
    expect(contributions[0].amount).toBe(5000);
    expect(contributions[0].fees).toBe(300);

    const total = contributions.reduce((sum, c) => sum + c.amount, 0);
    expect(total).toBe(15000);
  });

  it('corrige les prêts enregistrés avec des montants en chaîne', () => {
    localStorage.setItem(
      'Caisse_emergence_loans',
      JSON.stringify([
        { id: 1, memberId: 1, amount: '10000', interests: '1000', total: '11000', monthlyPayment: '5500' },
      ])
    );

    const loans = StorageService.getLoans();
    expect(loans[0].amount).toBe(10000);
    expect(loans[0].total).toBe(11000);
  });

  it('corrige les aides enregistrées avec un montant en chaîne', () => {
    localStorage.setItem(
      'Caisse_emergence_aids',
      JSON.stringify([{ id: 1, memberId: 1, amount: '10000', motif: 'Santé' }])
    );

    const aids = StorageService.getAids();
    expect(aids[0].amount).toBe(10000);
  });
});
