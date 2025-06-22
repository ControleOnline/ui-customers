import React, {useCallback, useState, useEffect, useRef} from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {getStore} from '@store';
import StateStore from '@controleonline/ui-layout/src/react/components/StateStore';
import css from '@controleonline/ui-orders/src/react/css/orders';
import Icon from 'react-native-vector-icons/MaterialIcons';

const Clients = () => {
  const {styles, globalStyles} = css();
  const {getters, actions} = getStore('people');
  const {items: clients, isLoading, error} = getters;
  const {currentCompany} = getters;
  const navigation = useNavigation();

  const [search, setSearch] = useState('');
  const debounceRef = useRef(null);

  const fetchClients = useCallback((query) => {
    if (currentCompany && Object.keys(currentCompany).length > 0) {
      actions.getItems({
        company: '/people/' + currentCompany.id,
        link_type: 'client',
        search: query.trim() !== '' ? query : undefined,
      });
    }
  }, [currentCompany]);

  useFocusEffect(
    useCallback(() => {
      fetchClients(search);
    }, [fetchClients, search])
  );

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchClients(search);
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [search, fetchClients]);

  const handleEdit = client => {
    navigation.navigate('ClientDetails', {client});
  };

  const handleAdd = () => {
    navigation.navigate('ClientForm');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{padding: 16}}>
        <TextInput
          placeholder="Buscar cliente..."
          value={search}
          onChangeText={setSearch}
          style={{
            backgroundColor: '#fff',
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            marginBottom: 12,
            color: '#000',
          }}
          placeholderTextColor="#999"
        />
        <TouchableOpacity
          onPress={handleAdd}
          style={[
            globalStyles.button,
            {
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              height: 50,
            },
          ]}>
          <Icon name="person-add" size={24} color="#fff" />
          <Text style={{color: '#fff', marginLeft: 8}}>Adicionar Cliente</Text>
        </TouchableOpacity>
      </View>
      <StateStore store="people" />
      {!isLoading && clients && clients.length > 0 && !error && (
        <ScrollView contentContainerStyle={{padding: 16}}>
          <View>
            {clients.map(client => (
              <TouchableOpacity
                key={client.id}
                onPress={() => handleEdit(client)}
                style={{
                  backgroundColor: '#fff',
                  marginBottom: 12,
                  borderRadius: 12,
                  padding: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}>
                <Text style={{fontWeight: 'bold', fontSize: 16, color: '#000'}}>
                  {client.name}
                </Text>
                <Text style={{color: '#000'}}>
                  {client.document?.[0]?.documentType?.documentType === 'CNPJ'
                    ? client.document[0].document
                    : ''}
                </Text>
                <Text style={{color: '#000'}}>
                  {client.phone?.[0]
                    ? `(${client.phone[0].ddd}) ${client.phone[0].phone}`
                    : ''}
                </Text>
                <Text style={{color: '#000'}}>
                  {client.email?.[0]?.email || ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default Clients;
