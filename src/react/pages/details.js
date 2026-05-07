import React, { useState, useLayoutEffect, useEffect, useMemo } from 'react';

import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { env } from '@env';
import { useStores } from '@store';
import { detailsStyles } from '../styles/details';
import GeneralTab from '../components/tabs/GeneralTab';
import UsersTab from '../components/tabs/UsersTab';
import SalesmanTab from '../components/tabs/SalesmanTab';
import EmployeesTab from '../components/tabs/EmployeesTab';
import ContractsTab from '../components/tabs/ContractsTab';
import ProductsTab from '../components/tabs/ProductsTab';
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

const ClientDetails = ({ route, navigation }) => {
  const { width } = Dimensions.get('window');
  const appType = String(env?.APP_TYPE || '').trim().toUpperCase();
  const routeParams = route.params || {};
  const clientId = String(routeParams?.clientId || routeParams?.id || '').replace(/\D/g, '');
  const detailContext = resolveContextKey(routeParams?.contextKey);
  const requestedInitialTab = String(route.params?.initialTab || '').trim();
  const scrollRef = React.useRef(null);
  const peopleStore = useStores(state => state.people) || {};
  const peopleActions = peopleStore?.actions || {};
  const peopleGetters = peopleStore?.getters || {};
  const getPeople = peopleActions?.get;
  const savePeople = peopleActions?.save;

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

  const resolveInitialTabIndex = nextClient => {
    if (!requestedInitialTab) return 0;

    const nextIsPessoaJuridica = String(nextClient?.peopleType || '').toUpperCase() === 'J';
    const nextIsProviderContext = ['provider', 'providers'].includes(detailContext);
    const keys = nextIsPessoaJuridica
      ? [
          'general',
          'sellers',
          'contacts',
          ...(nextIsProviderContext ? ['products'] : []),
          'contracts',
        ]
      : [
          'general',
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
    scrollRef.current?.scrollTo({ x: initialTabIndex * width, animated: false });

    if (!clientId || !getPeople) {
      setIsLoadingClient(false);
      return () => {
        mounted = false;
      };
    }

    if (!cachedClient) {
      setIsLoadingClient(true);
    }

    getPeople(clientId)
      .then(fullClient => {
        if (!mounted || !fullClient) {
          return;
        }

        setClient(previousClient => {
          const nextClient = { ...(previousClient || cachedClient || {}), ...fullClient };
          const nextTabIndex = resolveInitialTabIndex(nextClient);
          setActiveTab(nextTabIndex);
          scrollRef.current?.scrollTo({ x: nextTabIndex * width, animated: false });
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
  }, [clientId, getPeople, requestedInitialTab, detailContext, width]);

  const updateClientData = (field, data) => {
    setClient(prevClient => ({ ...prevClient, [field]: data }));
  };

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
        { key: 'sellers', label: global.t?.t('people', 'title', 'sellers') },
        { key: 'contacts', label: global.t?.t('people', 'title', 'contacts') },
        ...(isProviderContext
          ? [{ key: 'products', label: global.t?.t('people', 'title', 'products') || 'Produtos' }]
          : []),
        { key: 'contracts', label: global.t?.t('people', 'title', 'contracts') },
      ]
    : [
        { key: 'general', label: global.t?.t('people', 'title', 'general') },
        { key: 'users', label: global.t?.t('people', 'title', 'users') },
        ...(isProviderContext
          ? [{ key: 'products', label: global.t?.t('people', 'title', 'products') || 'Produtos' }]
          : []),
        { key: 'contracts', label: global.t?.t('people', 'title', 'contracts') },
      ];

  useEffect(() => {
    if (activeTab > tabs.length - 1) {
      setActiveTab(0);
      scrollRef.current?.scrollTo({ x: 0, animated: false });
    }
  }, [activeTab, tabs.length]);

  const handleTabPress = index => {
    setActiveTab(index);
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
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

  const tabProps = {
    client,
    customStyles: detailsStyles,
    isEditing: true,
    onUpdateClient: updateClientData,
    onSaveClientData: persistClientData,
    parentCompanyIri,
    initialContactLinkType,
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.headerProfile}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{client.name?.charAt(0)?.toUpperCase()}</Text>
        </View>
        <Text style={styles.profileName} numberOfLines={1} ellipsizeMode="tail">
          {client.name}
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
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        nestedScrollEnabled
        directionalLockEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={event => {
          const contentOffsetX = event.nativeEvent.contentOffset.x;
          const currentIndex = Math.round(contentOffsetX / width);
          if (currentIndex !== activeTab) {
            setActiveTab(currentIndex);
          }
        }}
        scrollEventThrottle={16}
        style={styles.contentContainer}>
        {tabs.map(tab => (
          <View key={tab.key} style={[styles.tabPane, { width }]}>
            {tab.key === 'general' ? (
              <GeneralTab {...tabProps} />
            ) : tab.key === 'sellers' || tab.key === 'users' ? (
              <ScrollView
                style={styles.tabScroll}
                contentContainerStyle={inlineStyle_299_16}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}>
                {isPessoaJuridica ? (
                  <SalesmanTab
                    {...tabProps}
                    appType={appType}
                    title="Vendedores"
                    linkType="sellers-client"
                    emptyText="Nenhum vendedor vinculado"
                    errorText="Nao foi possivel carregar os vendedores vinculados."
                  />
                ) : (
                  <UsersTab {...tabProps} />
                )}
              </ScrollView>
            ) : tab.key === 'contacts' ? (
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
            ) : tab.key === 'products' ? (
              <ScrollView
                style={styles.tabScroll}
                contentContainerStyle={inlineStyle_334_16}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}>
                <ProductsTab {...tabProps} />
              </ScrollView>
            ) : (
              <ScrollView
                style={styles.tabScroll}
                contentContainerStyle={inlineStyle_342_16}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}>
                <ContractsTab {...tabProps} />
              </ScrollView>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ClientDetails;
