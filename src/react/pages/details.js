import React, { useState, useLayoutEffect, useEffect } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStores } from '@store';
import { detailsStyles } from '../styles/details';
import { colors } from '@controleonline/../../src/styles/colors';

import GeneralTab from '../components/tabs/GeneralTab';
import UsersTab from '../components/tabs/UsersTab';
import ClientsTab from '../components/tabs/ClientsTab';
import EmployeesTab from '../components/tabs/EmployeesTab';
import ContractsTab from '../components/tabs/ContractsTab';

const ClientDetails = ({ route, navigation }) => {
  const { width } = Dimensions.get('window');
  const { client: initialClient } = route.params || {};
  const [client, setClient] = useState(initialClient);
  const [isLoadingClient, setIsLoadingClient] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  const scrollRef = React.useRef(null);
  const peopleStore = useStores(state => state.people) || {};
  const peopleActions = peopleStore?.actions || {};
  const getPeople = peopleActions?.get;
  const savePeople = peopleActions?.save;

  const extractId = value => String(value || '').replace(/\D/g, '');

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
    setClient(initialClient || null);
    setActiveTab(0);
    scrollRef.current?.scrollTo({ x: 0, animated: false });

    const clientId = extractId(initialClient?.id || initialClient?.['@id']);
    if (!clientId || !getPeople) {
      setIsLoadingClient(false);
      return () => {
        mounted = false;
      };
    }

    setIsLoadingClient(true);
    getPeople(clientId)
      .then(fullClient => {
        if (!mounted || !fullClient) {
          return;
        }
        setClient(prev => ({ ...(prev || {}), ...fullClient }));
      })
      .catch(() => {
        if (!mounted) {
          return;
        }
        setClient(initialClient || null);
      })
      .finally(() => {
        if (mounted) {
          setIsLoadingClient(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [initialClient, getPeople]);

  const updateClientData = (field, data) => {
    setClient(prevClient => ({ ...prevClient, [field]: data }));
  };

  const persistClientData = async partialData => {
    const clientId = extractId(
      client?.id || client?.['@id'] || initialClient?.id || initialClient?.['@id'],
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

  const tabs = isPessoaJuridica
    ? [
        { key: 0, label: global.t?.t('customers', 'title', 'general') },
        { key: 1, label: global.t?.t('customers', 'title', 'clients') },
        { key: 2, label: global.t?.t('customers', 'title', 'employees') },
        { key: 3, label: global.t?.t('customers', 'title', 'contracts') },
      ]
    : [
        { key: 0, label: global.t?.t('customers', 'title', 'general') },
        { key: 1, label: global.t?.t('customers', 'title', 'users') },
        { key: 2, label: global.t?.t('customers', 'title', 'contracts') },
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

      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
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
            style={[styles.tabButton, activeTab === tab.key && styles.tabButtonActive]}
            onPress={() => handleTabPress(tab.key)}>
            <Text
              style={[
                styles.tabButtonText,
                activeTab === tab.key && styles.tabButtonTextActive,
              ]}>
              {tab.label}
            </Text>
            {activeTab === tab.key && <View style={styles.activeIndicator} />}
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
        contentContainerStyle={{ flexGrow: 1 }}
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
          <View key={tab.key} style={{ width, height: '100%' }}>
            {tab.key === 0 ? (
              <GeneralTab {...tabProps} />
            ) : tab.key === 1 ? (
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 80 }}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}>
                {isPessoaJuridica ? <ClientsTab {...tabProps} /> : <UsersTab {...tabProps} />}
              </ScrollView>
            ) : tab.key === 2 && isPessoaJuridica ? (
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 80 }}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}>
                <EmployeesTab {...tabProps} />
              </ScrollView>
            ) : (
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 80 }}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerProfile: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#F8FAFC',
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
    textAlign: 'center',
    maxWidth: '86%',
  },
  profileId: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  tabsHeader: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    position: 'relative',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabButtonTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '60%',
    height: 3,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  contentContainer: {
    flex: 1,
  },
  skeletonCircle: {
    backgroundColor: '#E2E8F0',
  },
  skeletonLine: {
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
  },
  skeletonTab: {
    flex: 1,
    height: 36,
    marginHorizontal: 8,
    marginVertical: 10,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
});

export default ClientDetails;
