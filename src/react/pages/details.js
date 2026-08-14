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
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { formatDisplayUppercase } from '@controleonline/ui-common/src/react/utils/entityDisplay';
import { resolveFileImageUrl } from '@controleonline/ui-common/src/react/utils/fileUrl';
import PeopleAvatar from '@controleonline/ui-people/src/react/components/PeopleAvatar';
import { useStore, useStores } from '@store';
import { createDetailsStyles } from '../styles/details';
import GeneralTab from '../components/tabs/GeneralTab';
import UsersTab from '../components/tabs/UsersTab';
import SalesmanTab from '../components/tabs/SalesmanTab';
import EmployeesTab from '../components/tabs/EmployeesTab';
import ContractsTab from '../components/tabs/ContractsTab';
import ProductsTab from '../components/tabs/ProductsTab';
import MediaTab from '../components/tabs/MediaTab';
import FiscalTab from '../components/tabs/FiscalTab';
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

import ClientDetailsSkeleton from './ClientDetailsSkeleton';
import {
  resolveContextKey,
  normalizeCollection,
  PERSON_PHOTO_MEDIA_TYPES,
  COMPANY_ICON_MEDIA_TYPES,
  extractId,
  buildClientTabDefs,
  resolveInitialTabIndex,
  resolveRouteClientId,
  resolveRouteClientSeed,
} from './clientDetailsHelpers';

const ClientDetails = ({ route, navigation }) => {
  const routeParams = route.params || {};
  const routeClientSeed = resolveRouteClientSeed(routeParams);
  const clientId = resolveRouteClientId(routeParams);
  const detailContext = resolveContextKey(routeParams?.contextKey);
  const requestedInitialTab = String(route.params?.initialTab || '').trim();
  const peopleStore = useStores(state => state.people) || {};
  const peopleLinkStore = useStore('people_link');
  const themeStore = useStore('theme');
  const themeColors = themeStore.getters.colors;
  const peopleActions = peopleStore?.actions || {};
  const peopleGetters = peopleStore?.getters || {};
  const getPeople = peopleActions?.get;
  const getPeopleItems = peopleActions?.getItems;
  const getPeopleLinks = peopleLinkStore?.actions?.getItems;
  const savePeople = peopleActions?.save;
  const detailsStyles = useMemo(() => createDetailsStyles(themeColors), [themeColors]);

  const parentCompanyId = extractId(routeParams?.parentCompanyId);
  const parentCompanyIri = parentCompanyId ? `/people/${parentCompanyId}` : '';
  const initialContactLinkType = String(routeParams?.linkType || '')
    .trim()
    .toLowerCase();
  const cachedClient = useMemo(() => {
    if (!clientId) {
      return routeClientSeed;
    }

    if (
      routeClientSeed &&
      extractId(routeClientSeed?.id || routeClientSeed?.['@id']) === clientId
    ) {
      return routeClientSeed;
    }

    const currentItem = peopleGetters?.item;
    if (extractId(currentItem?.id || currentItem?.['@id']) === clientId) {
      return currentItem;
    }

    const items = Array.isArray(peopleGetters?.items) ? peopleGetters.items : [];
    return (
      items.find(item => extractId(item?.id || item?.['@id']) === clientId) || null
    );
  }, [clientId, peopleGetters?.item, peopleGetters?.items, routeClientSeed]);
  const [client, setClient] = useState(cachedClient);
  const [isLoadingClient, setIsLoadingClient] = useState(
    Boolean(clientId) && !cachedClient,
  );
  const [activeTab, setActiveTab] = useState(0);
  const [clientAvatarImageUrl, setClientAvatarImageUrl] = useState('');
  const [mediaRefreshKey, setMediaRefreshKey] = useState(0);

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
    const initialTabIndex = resolveInitialTabIndex({ requestedInitialTab, nextClient: cachedClient, detailContext });
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

    const loadClientById = async () => {
      const storeMeta = {
        dedupeKey: `client-details-${clientId}`,
        preserveItem: true,
        skipSystemError: true,
      };

      try {
        return await getPeople({
          id: clientId,
          __storeMeta: storeMeta,
        });
      } catch (error) {
        if (typeof getPeopleItems !== 'function') {
          throw error;
        }

        const response = await getPeopleItems({
          id: clientId,
          itemsPerPage: 1,
          __storeMeta: storeMeta,
        });

        return (
          normalizeCollection(response).find(
            item => extractId(item?.id || item?.['@id']) === clientId,
          ) ||
          cachedClient ||
          null
        );
      }
    };

    const loadClient = async () => {
      if (detailContext !== 'contacts' || !parentCompanyIri) {
        return loadClientById();
      }

      const [fullClient, peopleLinkResponse] = await Promise.all([
        loadClientById(),
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
          const nextTabIndex = resolveInitialTabIndex({ requestedInitialTab, nextClient, detailContext });
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
    getPeopleItems,
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

  const tabs = buildClientTabDefs({
    isPessoaJuridica,
    isProviderContext,
    t: global.t,
  });

  useEffect(() => {
    if (activeTab > tabs.length - 1) {
      setActiveTab(0);
    }
  }, [activeTab, tabs.length]);

  const handleTabPress = index => {
    setActiveTab(index);
  };

  if (isLoadingClient || !client) {
    return <ClientDetailsSkeleton tabs={tabs} />;
  }

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

    if (activeTabKey === 'fiscal') {
      return (
        <ScrollView
          style={styles.tabScroll}
          contentContainerStyle={styles.tabScrollContent}
          showsVerticalScrollIndicator={false}>
          <FiscalTab {...tabProps} />
        </ScrollView>
      );
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
            imageUrl={clientAvatarImageUrl}
            name={formatDisplayUppercase(client.name)}
            size={64}
            backgroundColor={themeColors.buttonBackground}
            borderColor={themeColors.buttonText}
            borderWidth={3}
            textColor={themeColors.buttonText}
            useGravatar={false}
            usePeopleImage={false}
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
