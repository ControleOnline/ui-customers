/**
 * Unit tests for ClientDetails pure helpers (app-community#297 modularization).
 */
import {
  resolveContextKey,
  normalizeCollection,
  buildClientTabDefs,
  resolveInitialTabIndex,
  extractId,
  resolveRouteClientId,
  resolveRouteClientSeed,
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

  it('resolves client id and seed from CRM navigation params', () => {
    const client = {
      '@id': '/people/9',
      id: 9,
      name: 'Cliente Teste',
    };

    expect(resolveRouteClientSeed({ client })).toBe(client);
    expect(resolveRouteClientId({ client })).toBe('9');
    expect(resolveRouteClientId({ clientId: '11', client })).toBe('11');
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

describe('confirmPeopleSoftDelete', () => {
  it('calls removePeople and navigates back after confirm', async () => {
    const { confirmPeopleSoftDelete } = require('../../../react/pages/clientDetailsHelpers');
    const removePeople = jest.fn().mockResolvedValue(undefined);
    const goBack = jest.fn();
    const setIsRemoving = jest.fn();
    const Alert = {
      alert: jest.fn((title, message, buttons) => {
        const removeBtn = buttons.find(b => b.text === 'Remover');
        return removeBtn.onPress();
      }),
    };

    await confirmPeopleSoftDelete({
      Alert,
      clientId: '42',
      removePeople,
      navigation: { canGoBack: () => true, goBack },
      setIsRemoving,
    });

    expect(removePeople).toHaveBeenCalledWith('42');
    expect(goBack).toHaveBeenCalled();
    expect(setIsRemoving).toHaveBeenCalledWith(true);
    expect(setIsRemoving).toHaveBeenCalledWith(false);
  });

  it('does nothing without clientId or removePeople', () => {
    const { confirmPeopleSoftDelete } = require('../../../react/pages/clientDetailsHelpers');
    const Alert = { alert: jest.fn() };
    confirmPeopleSoftDelete({ Alert, clientId: '', removePeople: jest.fn() });
    expect(Alert.alert).not.toHaveBeenCalled();
  });
});
