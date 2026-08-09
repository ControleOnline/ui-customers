/**
 * Unit tests for ClientDetails pure helpers (app-community#297 modularization).
 */
import {
  resolveContextKey,
  normalizeCollection,
  buildClientTabDefs,
  resolveInitialTabIndex,
  extractId,
} from '../../../react/pages/clientDetailsHelpers';

describe('clientDetailsHelpers', () => {
  it('resolveContextKey normalizes string and object context', () => {
    expect(resolveContextKey(' Provider ')).toBe('provider');
    expect(resolveContextKey({ context: 'Contacts' })).toBe('contacts');
    expect(resolveContextKey(null)).toBe('');
  });

  it('normalizeCollection handles hydra and plain arrays', () => {
    expect(normalizeCollection([{ id: 1 }])).toEqual([{ id: 1 }]);
    expect(normalizeCollection({ 'hydra:member': [{ id: 2 }] })).toEqual([{ id: 2 }]);
    expect(normalizeCollection(null)).toEqual([]);
  });

  it('extractId strips non-digits', () => {
    expect(extractId('/people/42')).toBe('42');
    expect(extractId(7)).toBe('7');
  });

  it('buildClientTabDefs includes media and contacts for PJ', () => {
    const tabs = buildClientTabDefs({
      isPessoaJuridica: true,
      isProviderContext: false,
      t: { t: (_ns, _k, key) => key },
    });
    expect(tabs.map(t => t.key)).toEqual([
      'general',
      'media',
      'sellers',
      'contacts',
      'contracts',
    ]);
  });

  it('resolveInitialTabIndex respects requested tab and defaults to 0', () => {
    expect(
      resolveInitialTabIndex({
        requestedInitialTab: 'media',
        nextClient: { peopleType: 'J' },
        detailContext: '',
      }),
    ).toBe(1);
    expect(
      resolveInitialTabIndex({
        requestedInitialTab: '',
        nextClient: { peopleType: 'F' },
        detailContext: '',
      }),
    ).toBe(0);
  });
});
