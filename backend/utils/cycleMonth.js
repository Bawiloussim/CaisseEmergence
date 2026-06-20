// Mois de la phase pilote (juin → novembre 2026), dans l'ordre du cycle.
const MONTHS = ['JUIN', 'JUILLET', 'AOÛT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE'];

// getMonth() est 0-indexé (0 = janvier) ; seuls juin (5) à novembre (10)
// correspondent à un mois de cotisation/réunion ouvert.
const MONTH_BY_JS_INDEX = {
  5: 'JUIN',
  6: 'JUILLET',
  7: 'AOÛT',
  8: 'SEPTEMBRE',
  9: 'OCTOBRE',
  10: 'NOVEMBRE',
};

const MONTHS_FULL = {
  JUIN: 'Juin',
  JUILLET: 'Juillet',
  AOÛT: 'Août',
  SEPTEMBRE: 'Septembre',
  OCTOBRE: 'Octobre',
  NOVEMBRE: 'Novembre',
};

function getCurrentCycleMonth(date = new Date()) {
  return MONTH_BY_JS_INDEX[date.getMonth()] || null;
}

module.exports = { MONTHS, MONTHS_FULL, getCurrentCycleMonth };
