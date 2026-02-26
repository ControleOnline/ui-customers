import React, { useCallback, useState, useEffect, useLayoutEffect } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
  RefreshControl,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useStore } from '@store';
import { colors } from '@controleonline/../../src/styles/colors';
import Icon from 'react-native-vector-icons/FontAwesome';
import IconAdd from 'react-native-vector-icons/MaterialIcons';
import AddCompanyModal from '../components/AddCompanyModal';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  subHeader: {
    paddingHorizontal: 16,
    paddingTop: 9,
    paddingBottom: 9,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    height: 40,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 8,
    color: colors.text,
    fontSize: 14,
    outlineStyle: 'none',
    outlineWidth: 0,
  },
  clearSearchButton: { padding: 4 },
  addButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Platform.select({
      ios: {
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
      web: { boxShadow: '0 8px 16px rgba(15, 23, 42, 0.1), 0 2px 6px rgba(15, 23, 42, 0.06)' },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  clientName: {
    flex: 1,
    fontWeight: '700',
    fontSize: 16,
    color: '#1E293B',
    lineHeight: 24,
  },
  cardBody: {
    paddingLeft: 0,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#475569',
    marginLeft: 8,
    fontWeight: '500',
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  skeletonCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  skeletonLine: {
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
  },
});

const Clients = () => {
  const peopleStore = useStore('people');
  const getters = peopleStore.getters;
  const actions = peopleStore.actions;
  const { items: clients, totalItems, isLoading, error } = getters;
  const { currentCompany } = getters;
  const navigation = useNavigation();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [allClients, setAllClients] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);

  const fetchClients = useCallback(
    (query, page) => {
      if (currentCompany && Object.keys(currentCompany).length > 0) {
        const params = {
          company: '/people/' + currentCompany.id,
          link_type: 'client',
          page: page ?? currentPage,
          itemsPerPage,
        };
        if (String(query ?? searchQuery).trim()) {
          params.name = String(query ?? searchQuery).trim();
        }
        actions.getItems(params);
      }
    },
    [currentCompany, currentPage, itemsPerPage, searchQuery],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'Clientes',
    });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      fetchClients(searchQuery, currentPage);
    }, [currentCompany?.id, currentPage, itemsPerPage, searchQuery]),
  );

  // Effect to handle data accumulation
  useEffect(() => {
    if (isLoading) return;

    if (clients && Array.isArray(clients)) {
      if (currentPage === 1) {
        setAllClients(clients);
      } else {
        setAllClients(prev => {
          // Avoid duplicates based on ID
          const newIds = new Set(clients.map(c => c.id));
          const filteredPrev = prev.filter(p => !newIds.has(p.id));
          return [...filteredPrev, ...clients];
        });
      }
    }
  }, [clients, currentPage, isLoading]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery(searchText.trim());
      setCurrentPage(1); // Reset page when query changes
    }, 300);
    return () => clearTimeout(t);
  }, [searchText]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchClients(searchQuery, 1);
    setCurrentPage(1);
    setRefreshing(false);
  }, [fetchClients, searchQuery]);

  const handleEdit = (client) => {
    navigation.navigate('ClientDetails', { client });
  };

  const handleAddCompany = () => {
    setShowAddCompanyModal(true);
  };

  const handleSaveCompany = async (companyData) => {
    const dataWithCompany = {
      ...companyData,
      company: '/people/' + currentCompany.id,
    };
    await actions.company(dataWithCompany);
    fetchClients(searchQuery, 1);
    setCurrentPage(1);
  };

  const renderClientCard = ({ item: client }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleEdit(client)}
      activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {client.name?.charAt(0)?.toUpperCase() || 'C'}
          </Text>
        </View>
        <Text style={styles.clientName} numberOfLines={1}>
          {client.name}
        </Text>
        <Icon name="chevron-right" size={14} color="#CBD5E1" />
      </View>

      <View style={styles.cardBody}>
        {client.phone?.[0] ? (
          <View style={styles.infoRow}>
            <Icon name="phone" size={16} color={colors.primary} />
            <Text style={styles.infoText}>
              ({client.phone[0].ddd}) {client.phone[0].phone}
            </Text>
          </View>
        ) : (
          <View style={styles.infoRow}>
            <Icon name="phone" size={16} color="#94A3B8" />
            <Text style={styles.infoText}>
              Telefone não informado
            </Text>
          </View>
        )}

        {client.email?.[0]?.email ? (
          <View style={styles.infoRow}>
            <Icon name="envelope-o" size={14} color={colors.primary} />
            <Text style={styles.infoText} numberOfLines={1}>
              {client.email[0].email}
            </Text>
          </View>
        ) : (
          <View style={styles.infoRow}>
            <Icon name="envelope-o" size={14} color="#94A3B8" />
            <Text style={styles.infoText}>
              Email não informado
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderSkeleton = () => (
    <View style={styles.skeletonCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: '#F1F5F9', marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <View style={[styles.skeletonLine, { width: '60%', height: 16, marginBottom: 6 }]} />
          <View style={[styles.skeletonLine, { width: '40%', height: 12 }]} />
        </View>
      </View>
      <View style={{ gap: 8 }}>
        <View style={[styles.skeletonLine, { width: '100%', height: 32 }]} />
        <View style={[styles.skeletonLine, { width: '100%', height: 32 }]} />
      </View>
    </View>
  );

  const safeClients = allClients;
  const listEmpty =
    isLoading && safeClients.length === 0 ? (
      <View style={{ paddingTop: 8 }}>
        {[1, 2, 3, 4, 5, 6].map((k) => (
          <View key={k}>{renderSkeleton()}</View>
        ))}
      </View>
    ) : error ? (
      <View style={styles.emptyContainer}>
        <Icon name="exclamation-triangle" size={48} color="#e74c3c" style={styles.emptyIcon} />
        <Text style={styles.emptyTitle}>Erro ao carregar clientes</Text>
        <Text style={styles.emptySubtitle}>Tente novamente mais tarde</Text>
      </View>
    ) : (
      <View style={styles.emptyContainer}>
        <Icon name="users" size={64} color="#E2E8F0" style={styles.emptyIcon} />
        <Text style={styles.emptyTitle}>
          {searchQuery ? 'Nenhum cliente encontrado' : 'Nenhum cliente'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {searchQuery ? 'Tente outros termos de busca' : 'Adicione seu primeiro cliente'}
        </Text>
      </View>
    );

  const renderFooter = () => {
    if (!isLoading || safeClients.length === 0) return null;

    return (
      <View style={{ paddingVertical: 20 }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.subHeader}>
        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <Icon name="search" size={16} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar cliente..."
              placeholderTextColor="#94A3B8"
              value={searchText}
              onChangeText={setSearchText}
              underlineColorAndroid="transparent"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearSearchButton}>
                <Icon name="times-circle" size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddCompany}>
            <IconAdd name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={safeClients}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderClientCard}
        contentContainerStyle={styles.scrollContent}
        ListEmptyComponent={() => listEmpty}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={() => {
          if (!isLoading && safeClients.length < totalItems) {
            setCurrentPage((p) => p + 1);
          }
        }}
        onEndReachedThreshold={0.5}
      />

      <AddCompanyModal
        visible={showAddCompanyModal}
        onClose={() => setShowAddCompanyModal(false)}
        onSave={handleSaveCompany}
      />
    </View>
  );
};

export default Clients;
