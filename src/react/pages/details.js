/*
 * Contract imported from AGENTS.md
 * ## Escopo
 * - `ui-customers` e o modulo React de cadastro e edicao de clientes.
 * - Esta pagina concentra detalhes, enderecos e dados de exibicao de pessoas.
 *
 * ## Estado
 *
 * ## Limites
 * - Nao duplicar validacoes de formato fora dos helpers compartilhados.
 * - Manter aqui a orquestracao da tela e a edicao do cadastro de pessoas.
 */
import React, { useCallback, useState, useLayoutEffect, useEffect, useMemo } from 'react';

import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { formatDisplayUppercase } from '@controleonline/ui-common/src/react/utils/entityDisplay';
import { resolveFileImageUrl } from '@controleonline/ui-common/src/react/utils/fileUrl';
import PeopleAvatar from '@controleonline/ui-people/src/react/components/PeopleAvatar';
import { resolvePeopleImageUrl } from '@controleonline/ui-people/src/react/utils/peopleImage';
import { useStore, useStores } from '@store';
import { createDetailsStyles } from '../styles/details';
import GeneralTab from '../components/tabs/GeneralTab';
import UsersTab from '../components/tabs/UsersTab';
import SalesmanTab from '../components/tabs/SalesmanTab';
import EmployeesTab from '../components/tabs/EmployeesTab';
import ContractsTab from '../components/tabs/ContractsTab';
import ProductsTab from '../components/tabs/ProductsTab';
import MediaTab from '../components/tabs/MediaTab';
import {
  buildEmployeeContactsFromPeopleLinks,
  buildPeopleLinkReadParams,
} from '../components/tabs/employeeContacts';
import styles from './details.page.styles';

import {
  inlineStyle_299_16,
  inlineStyle_317_16,
  inlineStyle_334_16,
  inlineStyle_342_16,
} from './details.styles';

const resolveContextKey = rawContext => {
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

const normalizeCollection = payload => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  if (Array.isArray(payload.member)) return payload.member;
  if (Array.isArray(payload['hydra:member'])) return payload['hydra:member'];
  if (Array.isArray(payload.items)) return payload.items;
  return [];
};

const PERSON_PHOTO_MEDIA_TYPES = ['avatar'];
const COMPANY_ICON_MEDIA_TYPES = ['icon'];

const ClientDetails = ({ route, navigation }) => {
  const routeParams = route.params || {};
  const clientId = String(routeParams?.clientId || routeParams?.id || '').replace(/\D/g, '');
  const detailContext = resolveContextKey(routeParams?.contextKey);
  const requestedInitialTab = String(route.params?.initialTab || '').trim();
  const peopleStore = useStores(state => state.people) || {};
  const peopleLinkStore = useStore('people_link');
  const themeStore = useStore('theme');
  const themeColors = themeStore.getters.colors;
  const peopleActions = peopleStore?.actions || {};
  const peopleGetters = peopleStore?.getters || {};
  const getPeople = peopleActions?.get;
  const getPeopleLinks = peopleLinkStore?.actions?.getItems;
  const savePeople = peopleActions?.save;
  const detailsStyles = useMemo(() => createDetailsStyles(themeColors), [themeColors]);

  const extractId = value => String(value || '').replace(/\D/g, '');
  const parentCompanyId = extractId(routeParams?.parentCompanyId);
  const parentCompanyIri = parentCompanyId ? `/people/${parentCompanyId}` : '';
  const initialContactLinkType = String(routeParams?.linkType || '')
    .trim()
    .toLowerCase();
  const cachedClient = useMemo(() => {
    if (!clientId) {
      return null;
    }

    const currentItem = peopleGetters?.item;
    if (extractId(currentItem?.id || currentItem?.['@id']) === clientId) {
      return currentItem;
    }

    const items = Array.isArray(peopleGetters?.items) ? peopleGetters.items : [];
    return (
      items.find(item => extractId(item?.id || item?.['@id']) === clientId) || null
    );
  }, [clientId, peopleGetters?.item, peopleGetters?.items]);
  const [client, setClient] = useState(cachedClient);
  const [isLoadingClient, setIsLoadingClient] = useState(
    Boolean(clientId) && !cachedClient,
  );
  const [activeTab, setActiveTab] = useState(0);
  const [clientAvatarImageUrl, setClientAvatarImageUrl] = useState('');
  const [mediaRefreshKey, setMediaRefreshKey] = useState(0);

  const resolveInitialTabIndex = nextClient => {
    if (!requestedInitialTab) return 0;

    const nextIsPessoaJuridica = String(nextClient?.peopleType || '').toUpperCase() === 'J';
    const nextIsProviderContext = ['provider', 'providers'].includes(detailContext);
    const keys = nextIsPessoaJuridica
      ? [
          'general',
          'media',
          'sellers',
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

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: '',
      headerShadowVisible: false,
      headerStyle: { backgroundColor: '#F8FAFC' },
      headerRight: () => null,
    });
  }, [navigation]);

  useEffect(() => {
    let mounted = true;
    const initialTabIndex = resolveInitialTabIndex(cachedClient);
    setActiveTab(initialTabIndex);

    if (!clientId || !getPeople) {
      setIsLoadingClient(false);
      return () => {
        mounted = false;
      };
    }

    if (!cachedClient) {
      setIsLoadingClient(true);
    }

    const loadClient = async () => {
      if (detailContext !== 'contacts' || !parentCompanyIri) {
        return getPeople(clientId);
      }

      const [fullClient, peopleLinkResponse] = await Promise.all([
        getPeople(clientId),
        getPeopleLinks
          ? getPeopleLinks(
              buildPeopleLinkReadParams({
                companyId: parentCompanyId,
                peopleId: clientId,
              }),
            ).catch(() => null)
          : Promise.resolve(null),
      ]);

      const linkedContact = buildEmployeeContactsFromPeopleLinks(
        peopleLinkResponse,
        {
          parentPeopleId: parentCompanyId,
        },
      )[0];

      if (!linkedContact) {
        return fullClient;
      }

      return {
        ...(fullClient || {}),
        linkType: linkedContact.linkType || initialContactLinkType,
        peopleLink: linkedContact.peopleLink,
      };
    };

    loadClient()
      .then(fullClient => {
        if (!mounted || !fullClient) {
          return;
        }

        setClient(previousClient => {
          const nextClient = { ...(previousClient || cachedClient || {}), ...fullClient };
          const nextTabIndex = resolveInitialTabIndex(nextClient);
          setActiveTab(nextTabIndex);
          return nextClient;
        });
      })
      .catch(() => {
        if (!mounted) {
          return;
        }
        setClient(cachedClient || null);
      })
      .finally(() => {
        if (mounted) {
          setIsLoadingClient(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [
    clientId,
    detailContext,
    getPeople,
    getPeopleLinks,
    initialContactLinkType,
    parentCompanyId,
    parentCompanyIri,
    requestedInitialTab,
  ]);

  useEffect(() => {
    let mounted = true;
    const currentClientId = extractId(client?.id || client?.['@id']);
    const isCurrentClientCompany =
      String(client?.peopleType || '').toUpperCase() === 'J';
    const mediaTypes = isCurrentClientCompany
      ? COMPANY_ICON_MEDIA_TYPES
      : PERSON_PHOTO_MEDIA_TYPES;

    setClientAvatarImageUrl('');

    if (!currentClientId) {
      return () => {
        mounted = false;
      };
    }

    resolvePeopleMediaImageUrl({
      peopleId: currentClientId,
      mediaTypes,
    })
      .then(imageUrl => {
        if (!mounted) {
          return;
        }

        setClientAvatarImageUrl(imageUrl);
      })
      .catch(() => {
        if (mounted) {
          setClientAvatarImageUrl('');
        }
      });

    return () => {
      mounted = false;
    };
  }, [client?.id, client?.['@id'], client?.peopleType, mediaRefreshKey]);

  const updateClientData = (field, data) => {
    setClient(prevClient => ({ ...prevClient, [field]: data }));
  };

  const resolvePeopleMediaImageUrl = useCallback(
    async ({peopleId, mediaTypes}) => {
      for (const mediaType of mediaTypes) {
        const response = await peopleActions.getPeopleMedia({
          people: `/people/${peopleId}`,
          'mediaType.type': mediaType,
          itemsPerPage: 1,
        }).catch(() => null);
        const media = Array.isArray(response) ? response[0] : null;
        const imageUrl = resolveFileImageUrl(media?.file);

        if (imageUrl) {
          return imageUrl;
        }
      }

      return '';
    },
    [peopleActions],
  );

  const handleClientMediaChanged = useCallback(() => {
    setMediaRefreshKey(previousValue => previousValue + 1);
  }, []);

  const persistClientData = async partialData => {
    const clientId = extractId(
      client?.id || client?.['@id'],
    );

    if (!clientId || !savePeople) {
      throw new Error('Nao foi possivel identificar o cliente para salvar.');
    }

    const payload = {
      id: clientId,
      ...partialData,
    };

    const saved = await savePeople(payload);
    setClient(prev => ({ ...(prev || {}), ...(saved || {}), ...partialData }));

    return saved;
  };

  const isPessoaJuridica = String(client?.peopleType || '').toUpperCase() === 'J';
  const isProviderContext = ['provider', 'providers'].includes(detailContext);

  const tabs = isPessoaJuridica
    ? [
        { key: 'general', label: global.t?.t('people', 'title', 'general') },
        { key: 'media', label: global.t?.t('people', 'title', 'media') || 'Mídia' },
        { key: 'sellers', label: global.t?.t('people', 'title', 'sellers') },
        { key: 'contacts', label: global.t?.t('people', 'title', 'contacts') },
        ...(isProviderContext
          ? [{ key: 'products', label: global.t?.t('people', 'title', 'products') || 'Produtos' }]
          : []),
        { key: 'contracts', label: global.t?.t('people', 'title', 'contracts') },
      ]
    : [
        { key: 'general', label: global.t?.t('people', 'title', 'general') },
        { key: 'media', label: global.t?.t('people', 'title', 'media') || 'Mídia' },
        { key: 'users', label: global.t?.t('people', 'title', 'users') },
        ...(isProviderContext
          ? [{ key: 'products', label: global.t?.t('people', 'title', 'products') || 'Produtos' }]
          : []),
        { key: 'contracts', label: global.t?.t('people', 'title', 'contracts') },
      ];

  useEffect(() => {
    if (activeTab > tabs.length - 1) {
      setActiveTab(0);
    }
  }, [activeTab, tabs.length]);

  const handleTabPress = index => {
    setActiveTab(index);
  };

  const renderSkeleton = () => (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.headerProfile}>
        <View
          style={[
            styles.skeletonCircle,
            { width: 64, height: 64, borderRadius: 32, marginBottom: 12 },
          ]}
        />
        <View
          style={[
            styles.skeletonLine,
            { width: 180, height: 22, marginBottom: 8 },
          ]}
        />
        <View style={[styles.skeletonLine, { width: 90, height: 12 }]} />
      </View>

      <View style={styles.tabsHeader}>
        {tabs.map(tab => (
          <View key={`skeleton-${tab.key}`} style={styles.skeletonTab} />
        ))}
      </View>

      <View style={styles.skeletonContent}>
        <View style={styles.skeletonCard}>
          <View
            style={[
              styles.skeletonLine,
              { width: '48%', height: 18, marginBottom: 14 },
            ]}
          />
          <View
            style={[
              styles.skeletonLine,
              { width: '100%', height: 14, marginBottom: 10 },
            ]}
          />
          <View
            style={[
              styles.skeletonLine,
              { width: '90%', height: 14, marginBottom: 10 },
            ]}
          />
          <View style={[styles.skeletonLine, { width: '82%', height: 14 }]} />
        </View>
        <View style={styles.skeletonCard}>
          <View
            style={[
              styles.skeletonLine,
              { width: '52%', height: 18, marginBottom: 14 },
            ]}
          />
          <View
            style={[
              styles.skeletonLine,
              {
                width: '100%',
                height: 46,
                borderRadius: 10,
                marginBottom: 10,
              },
            ]}
          />
          <View
            style={[
              styles.skeletonLine,
              { width: '100%', height: 46, borderRadius: 10 },
            ]}
          />
        </View>
      </View>
    </SafeAreaView>
  );

  if (isLoadingClient || !client) {
    return renderSkeleton();
  }

  const resolvedClientAvatarImageUrl =
    clientAvatarImageUrl || resolvePeopleImageUrl(client, resolveFileImageUrl);

  const tabProps = {
    client,
    customStyles: detailsStyles,
    isEditing: true,
    onUpdateClient: updateClientData,
    onSaveClientData: persistClientData,
    parentCompanyIri,
    initialContactLinkType,
    onChangeClientAvatar: null,
    isSavingClientAvatar: false,
  };
  const activeTabKey = tabs[activeTab]?.key || 'general';
  const activeTabContent = (() => {
    if (activeTabKey === 'general') {
      return <GeneralTab {...tabProps} />;
    }

    if (activeTabKey === 'media') {
      return (
        <ScrollView
          style={styles.tabScroll}
          contentContainerStyle={inlineStyle_342_16}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}>
          <MediaTab client={client} onChanged={handleClientMediaChanged} />
        </ScrollView>
      );
    }

    if (activeTabKey === 'sellers' || activeTabKey === 'users') {
      return (
        <ScrollView
          style={styles.tabScroll}
          contentContainerStyle={inlineStyle_299_16}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}>
          {isPessoaJuridica ? (
            <SalesmanTab
              {...tabProps}
              title="Vendedores"
              linkType="sellers-client"
              emptyText="Nenhum vendedor vinculado"
              errorText="Nao foi possivel carregar os vendedores vinculados."
            />
          ) : (
            <UsersTab {...tabProps} />
          )}
        </ScrollView>
      );
    }

    if (activeTabKey === 'contacts') {
      return (
        <ScrollView
          style={styles.tabScroll}
          contentContainerStyle={inlineStyle_317_16}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}>
          <EmployeesTab
            {...tabProps}
            title="Contatos"
            emptyText="Nenhum contato vinculado"
            errorText="Nao foi possivel carregar os contatos vinculados."
            createTitle="Adicionar Contato"
            requiredErrorText="Nome e apelido do contato sao obrigatorios."
            createSuccessText="Contato cadastrado com sucesso."
            createErrorText="Nao foi possivel cadastrar o contato."
          />
        </ScrollView>
      );
    }

    if (activeTabKey === 'products') {
      return (
        <ScrollView
          style={styles.tabScroll}
          contentContainerStyle={inlineStyle_334_16}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}>
          <ProductsTab {...tabProps} />
        </ScrollView>
      );
    }

    return (
      <ScrollView
        style={styles.tabScroll}
        contentContainerStyle={inlineStyle_342_16}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}>
        <ContractsTab {...tabProps} />
      </ScrollView>
    );
  })();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.headerProfile}>
        <View style={styles.avatarContainer}>
          <PeopleAvatar
            people={client}
            imageUrl={resolvedClientAvatarImageUrl}
            name={formatDisplayUppercase(client.name)}
            size={64}
            backgroundColor={themeColors.buttonBackground}
            borderColor={themeColors.buttonText}
            borderWidth={3}
            textColor={themeColors.buttonText}
          />
        </View>
        <Text style={styles.profileName} numberOfLines={1} ellipsizeMode="tail">
          {formatDisplayUppercase(client.name)}
        </Text>

        <Text style={styles.profileId}>{`ID: ${client.id}`}</Text>
      </View>
      <View style={styles.tabsHeader}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, activeTab === tabs.findIndex(item => item.key === tab.key) && styles.tabButtonActive]}
            onPress={() => handleTabPress(tabs.findIndex(item => item.key === tab.key))}>
            <Text
              style={[
                styles.tabButtonText,
                activeTab === tabs.findIndex(item => item.key === tab.key) && styles.tabButtonTextActive,
              ]}>
              {tab.label}
            </Text>
            {activeTab === tabs.findIndex(item => item.key === tab.key) && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.contentContainer}>
        {activeTabContent}
      </View>
    </SafeAreaView>
  );
};

export default ClientDetails;
