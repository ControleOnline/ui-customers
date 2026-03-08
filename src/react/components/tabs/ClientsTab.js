import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useStores } from '@store';
import { colors } from '@controleonline/../../src/styles/colors';

const extractId = value => String(value || '').replace(/\D/g, '');

const ClientsTab = ({ client, customStyles }) => {
  const navigation = useNavigation();
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const peopleStore = useStores(state => state.people) || {};
  const peopleActions = peopleStore.actions || {};

  const parentPeopleId = useMemo(
    () => extractId(client?.id || client?.['@id']),
    [client?.id, client?.['@id']],
  );

  useEffect(() => {
    let mounted = true;

    const fetchClients = async () => {
      if (!parentPeopleId || !peopleActions?.getItems) {
        if (mounted) {
          setClients([]);
          setError('');
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const response = await peopleActions.getItems({
          company: `/people/${parentPeopleId}`,
          linkType: 'client',
          itemsPerPage: 100,
        });

        const items = Array.isArray(response) ? response : [];
        const normalized = items.filter(item => {
          const itemId = extractId(item?.id || item?.['@id']);
          return itemId && itemId !== parentPeopleId;
        });

        if (mounted) {
          setClients(normalized);
        }
      } catch (fetchError) {
        if (mounted) {
          setClients([]);
          setError('Nao foi possivel carregar os clientes vinculados.');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchClients();

    return () => {
      mounted = false;
    };
  }, [parentPeopleId, peopleActions]);

  return (
    <View style={customStyles.tabContent}>
      <View style={customStyles.section}>
        <View style={customStyles.sectionHeader}>
          <Text style={customStyles.sectionTitle}>Clientes</Text>
        </View>

        {isLoading ? (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : error ? (
          <Text style={customStyles.emptyText}>{error}</Text>
        ) : clients.length === 0 ? (
          <Text style={customStyles.emptyText}>Nenhum cliente vinculado</Text>
        ) : (
          clients.map(item => (
            <TouchableOpacity
              key={String(item?.id || item?.['@id'])}
              style={customStyles.listItem}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('ClientDetails', { client: item })}>
              <View style={customStyles.itemContent}>
                <Icon name="people" size={20} color={colors.primary} />
                <View>
                  <Text style={customStyles.itemText}>
                    {String(item?.name || '-')}
                  </Text>
                  <Text style={customStyles.itemSubtext}>
                    {`ID: ${extractId(item?.id || item?.['@id']) || '-'}`}
                    {item?.alias ? ` - ${String(item.alias)}` : ''}
                  </Text>
                </View>
              </View>
              <Icon name="chevron-right" size={20} color="#94A3B8" />
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );
};

export default ClientsTab;
