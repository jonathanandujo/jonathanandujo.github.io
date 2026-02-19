/*
  Default data structure for the Patrimony app.
  Each category has a key, label, icon, type (asset | liability),
  and an array of items.
*/

export const CATEGORIES = [
  {
    key: 'realEstate',
    label: 'Real Estate',
    icon: '🏠',
    type: 'asset',
    fields: ['name', 'value', 'notes'],
  },
  {
    key: 'vehicles',
    label: 'Vehicles',
    icon: '🚗',
    type: 'asset',
    fields: ['name', 'value', 'year', 'notes'],
  },
  {
    key: 'bankAccounts',
    label: 'Bank Accounts',
    icon: '🏦',
    type: 'asset',
    fields: ['name', 'value', 'bank', 'notes'],
  },
  {
    key: 'investments',
    label: 'Investments & Crypto',
    icon: '📈',
    type: 'asset',
    fields: ['name', 'value', 'platform', 'notes'],
  },
  {
    key: 'otherAssets',
    label: 'Other Assets',
    icon: '💎',
    type: 'asset',
    fields: ['name', 'value', 'notes'],
  },
  {
    key: 'creditCards',
    label: 'Credit Cards',
    icon: '💳',
    type: 'liability',
    fields: ['name', 'value', 'bank', 'notes'],
  },
  {
    key: 'loans',
    label: 'Loans & Mortgages',
    icon: '📋',
    type: 'liability',
    fields: ['name', 'value', 'lender', 'notes'],
  },
  {
    key: 'otherDebts',
    label: 'Other Debts',
    icon: '⚠️',
    type: 'liability',
    fields: ['name', 'value', 'notes'],
  },
];

export const DEFAULT_DATA = {
  realEstate: [],
  vehicles: [],
  bankAccounts: [],
  investments: [],
  otherAssets: [],
  creditCards: [],
  loans: [],
  otherDebts: [],
};

export const STORAGE_KEY = 'patrimonyData';
