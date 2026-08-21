/**
 * Pure helpers for ClientDetails (details.js) — keep the page under the 500-line limit.
 */

export const resolveContextKey = rawContext => {
  if (!rawContext) {
    return '';
  }

  if (typeof rawContext === 'string') {
    return rawContext.trim().toLowerCase();
  }

  return String(rawContext?.context || '')
    .trim()
    .toLowerCase();
};

export const normalizeCollection = payload => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  if (Array.isArray(payload.member)) return payload.member;
  if (Array.isArray(payload['hydra:member'])) return payload['hydra:member'];
  if (Array.isArray(payload.items)) return payload.items;
  return [];
};

export const PERSON_PHOTO_MEDIA_TYPES = ['avatar'];
export const COMPANY_ICON_MEDIA_TYPES = ['icon'];

export const extractId = value => String(value || '').replace(/\D/g, '');

export const resolveRouteClientSeed = routeParams => {
  const client = routeParams?.client || routeParams?.people || null;

  return client && typeof client === 'object' && !Array.isArray(client)
    ? client
    : null;
};

export const resolveRouteClientId = routeParams => {
  const clientSeed = resolveRouteClientSeed(routeParams);

  return extractId(
    routeParams?.clientId ||
      routeParams?.id ||
      clientSeed?.id ||
      clientSeed?.['@id'],
  );
};

export const buildClientTabDefs = ({
  isPessoaJuridica,
  isProviderContext,
  t,
}) => {
  const label = (key, fallback) => t?.t('people', 'title', key) || fallback || key;

  if (isPessoaJuridica) {
    return [
      { key: 'general', label: label('general') },
      { key: 'fiscal', label: label('fiscal', 'Configurações Fiscais') },
      { key: 'media', label: label('media', 'Mídia') },
      { key: 'sellers', label: label('sellers') },
      { key: 'franchise', label: label('franchiseLinks', 'Franquia/Filial') },
      { key: 'contacts', label: label('contacts') },
      ...(isProviderContext
        ? [{ key: 'products', label: label('products', 'Produtos') }]
        : []),
      { key: 'contracts', label: label('contracts') },
    ];
  }

  return [
    { key: 'general', label: label('general') },
    { key: 'media', label: label('media', 'Mídia') },
    { key: 'categories', label: label('categories', 'Classificação') },
    { key: 'users', label: label('users') },
    ...(isProviderContext
      ? [{ key: 'products', label: label('products', 'Produtos') }]
      : []),
    { key: 'contracts', label: label('contracts') },
  ];
};

export const resolveInitialTabIndex = ({
  requestedInitialTab,
  nextClient,
  detailContext,
}) => {
  if (!requestedInitialTab) return 0;

  const nextIsPessoaJuridica =
    String(nextClient?.peopleType || '').toUpperCase() === 'J';
  const nextIsProviderContext = ['provider', 'providers'].includes(detailContext);
  const keys = nextIsPessoaJuridica
    ? [
        'general',
        'fiscal',
        'media',
        'sellers',
        'franchise',
        'contacts',
        ...(nextIsProviderContext ? ['products'] : []),
        'contracts',
      ]
    : [
        'general',
        'media',
        'users',
        ...(nextIsProviderContext ? ['products'] : []),
        'contracts',
      ];
  const index = keys.indexOf(requestedInitialTab);
  return index >= 0 ? index : 0;
};

export const mergeLinkedContactIntoClient = ({
  fullClient,
  peopleLinkResponse,
  parentCompanyId,
  initialContactLinkType,
  buildEmployeeContactsFromPeopleLinks,
}) => {
  const linkedContact = buildEmployeeContactsFromPeopleLinks(peopleLinkResponse, {
    parentPeopleId: parentCompanyId,
  })[0];

  if (!linkedContact) {
    return fullClient;
  }

  return {
    ...(fullClient || {}),
    linkType: linkedContact.linkType || initialContactLinkType,
    peopleLink: linkedContact.peopleLink,
  };
};


/**
 * Soft-delete (app-community#374): confirm + call removePeople, then navigate back.
 * Physical DELETE is never used; backend maps DELETE to deleted=true.
 */
export const confirmPeopleSoftDelete = ({
  Alert,
  clientId,
  removePeople,
  navigation,
  setIsRemoving,
}) => {
  if (!clientId || typeof removePeople !== 'function') {
    return;
  }

  Alert.alert(
    'Remover pessoa',
    'A pessoa será marcada como removida e deixará de aparecer nas listagens. O registro permanece no banco (exclusão lógica). Deseja continuar?',
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          setIsRemoving?.(true);
          try {
            await removePeople(clientId);
            if (navigation?.canGoBack?.()) {
              navigation.goBack();
            } else {
              navigation.navigate?.('Clients');
            }
          } catch (error) {
            Alert.alert(
              'Falha ao remover',
              error?.message || 'Não foi possível remover a pessoa. Tente novamente.',
            );
          } finally {
            setIsRemoving?.(false);
          }
        },
      },
    ],
  );
};
