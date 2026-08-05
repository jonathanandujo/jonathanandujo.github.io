import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

jest.mock('../../supabase/useSupabaseSync', () => ({
  useSupabaseSync: () => ({
    push: jest.fn(),
    pull: jest.fn(),
    syncing: false,
    lastSync: null,
    error: null,
    isConfigured: false,
  }),
}));

test('automatically saves chart data while typing', () => {
  localStorage.clear();
  render(<App />);

  fireEvent.change(screen.getByRole('textbox'), {
    target: { value: 'Income\t[100]\tSavings' },
  });

  expect(localStorage.getItem('sankeyData1')).toBe('Income\t[100]\tSavings');
});
