import React, { useState, useLayoutEffect } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import md5 from 'md5';
import { detailsStyles } from '../styles/details';
import { colors } from '@controleonline/../../src/styles/colors';

import GeneralTab from '../components/tabs/GeneralTab';
import UsersTab from '../components/tabs/UsersTab';
import ContractsTab from '../components/tabs/ContractsTab';

const ClientDetails = ({ route, navigation }) => {
  const { width } = Dimensions.get('window');
  const { client: initialClient } = route.params || {};
  const [client, setClient] = useState(initialClient);
  const [activeTab, setActiveTab] = useState(0);
  const scrollRef = React.useRef(null);

  // Configure Header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: '',
      headerShadowVisible: false,
      headerStyle: { backgroundColor: '#F8FAFC' },
      headerRight: () => null,
    });
  }, [navigation]);

  const updateClientData = (field, data) => {
    setClient(prevClient => ({ ...prevClient, [field]: data }));
  };

  const tabs = [
    { key: 0, label: 'Geral' },
    { key: 1, label: 'Usuários' },
    { key: 2, label: 'Contratos' },
  ];

  const handleTabPress = (index) => {
    setActiveTab(index);
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
  };



  if (!client) return null;

  const tabProps = {
    client,
    customStyles: detailsStyles,
    isEditing: true, // Always editing as per requirement
    onUpdateClient: updateClientData,
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.headerProfile}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {client.name?.charAt(0)?.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.profileName}>{client.name}</Text>
        <Text style={styles.profileId}>ID: {client.id}</Text>
      </View>

      <View style={styles.tabsHeader}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabButton, activeTab === tab.key && styles.tabButtonActive]}
            onPress={() => handleTabPress(tab.key)}>
            <Text style={[styles.tabButtonText, activeTab === tab.key && styles.tabButtonTextActive]}>
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
        onScroll={(event) => {
          const contentOffsetX = event.nativeEvent.contentOffset.x;
          const currentIndex = Math.round(contentOffsetX / width);
          if (currentIndex !== activeTab) {
            setActiveTab(currentIndex);
          }
        }}
        scrollEventThrottle={16}
        style={styles.contentContainer}>

        {/* Tab 1: Geral */}
        <View style={{ width, height: '100%' }}>
          <GeneralTab {...tabProps} />
        </View>

        {/* Tab 2: Usuários */}
        <View style={{ width, height: '100%' }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 80 }}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}>
            <UsersTab {...tabProps} />
          </ScrollView>
        </View>

        {/* Tab 3: Contratos */}
        <View style={{ width, height: '100%' }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 80 }}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}>
            <ContractsTab {...tabProps} />
          </ScrollView>
        </View>

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
});


export default ClientDetails;
