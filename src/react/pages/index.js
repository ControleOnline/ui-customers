import React, {useCallback, useState, useEffect} from 'react';
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
import AddCompanyModal from '../components/AddCompanyModal';

const Clients = () => {
  const {styles} = css();
  const {getters, actions} = getStore('people');

  const {items: clients, totalItems, isLoading, error} = getters;
  const {currentCompany} = getters;
  const navigation = useNavigation();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [search, setSearch] = useState('');
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [showItemsPerPageDropdown, setShowItemsPerPageDropdown] =
    useState(false);

  const fetchClients = useCallback(
    (query, page = currentPage) => {
      if (currentCompany && Object.keys(currentCompany).length > 0) {
        const params = {
          company: '/people/' + currentCompany.id,
          link_type: 'client',
          page: page,
          itemsPerPage: itemsPerPage,
        };

        if (query.trim() !== '') {
          params.name = query.trim();
        }

        actions.getItems(params);
      }
    },
    [currentCompany, currentPage, itemsPerPage],
  );

  useFocusEffect(
    useCallback(() => {
      fetchClients(search, currentPage);
    }, [fetchClients, search, currentPage]),
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, itemsPerPage, currentCompany]);

  useEffect(() => {
    fetchClients(search, currentPage);
  }, [currentPage, search, itemsPerPage, currentCompany, fetchClients]);
  const handleEdit = client => {
    navigation.navigate('ClientDetails', {client});
  };

  const handleAddCompany = () => {
    setShowAddCompanyModal(true);
  };

  const handleSaveCompany = async companyData => {
    try {
      const dataWithCompany = {
        ...companyData,
        company: '/people/' + currentCompany.id,
      };

      await actions.company(dataWithCompany);

      fetchClients(search, 1);
      setCurrentPage(1);
    } catch (err) {
      throw err;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => setShowItemsPerPageDropdown(false)}
      style={{flex: 1}}>
      <SafeAreaView style={[styles.container, {backgroundColor: '#f8f9fa'}]}>
        <View
          style={{
            backgroundColor: '#fff',
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#e9ecef',
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 2},
            shadowOpacity: 0.05,
            shadowRadius: 3,
            elevation: 2,
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}>
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#f8f9fa',
                borderRadius: 12,
                paddingHorizontal: 16,
                borderWidth: 1,
                borderColor: '#e9ecef',
              }}>
              <Icon name="search" size={20} color="#6c757d" />
              <TextInput
                placeholder="Buscar cliente..."
                value={search}
                onChangeText={setSearch}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  color: '#212529',
                  fontSize: 16,
                  width: '100%',
                }}
                placeholderTextColor="#6c757d"
              />
            </View>

            <TouchableOpacity
              onPress={handleAddCompany}
              style={[
                {
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: 52,
                  width: 52,
                  borderRadius: 12,
                  backgroundColor: '#007bff',
                  marginRight: 8,
                },
              ]}>
              <Icon name="person-add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <StateStore store="people" />

        {/* Items per page selector */}
        {!isLoading && clients && clients.length > 0 && !error && (
          <View
            style={{
              backgroundColor: '#fff',
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: '#e9ecef',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Text style={{color: '#6c757d', fontSize: 14}}>
              Mostrando {clients.length} de {totalItems} clientes
            </Text>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Text style={{color: '#6c757d', fontSize: 14, marginRight: 8}}>
                Por página:
              </Text>
              <View style={{position: 'relative'}}>
                <TouchableOpacity
                  onPress={() =>
                    setShowItemsPerPageDropdown(!showItemsPerPageDropdown)
                  }
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderWidth: 1,
                    borderColor: '#e9ecef',
                    borderRadius: 6,
                    backgroundColor: '#f8f9fa',
                    minWidth: 60,
                  }}>
                  <Text
                    style={{color: '#495057', fontSize: 14, marginRight: 4}}>
                    {itemsPerPage}
                  </Text>
                  <Icon
                    name={
                      showItemsPerPageDropdown
                        ? 'keyboard-arrow-up'
                        : 'keyboard-arrow-down'
                    }
                    size={16}
                    color="#6c757d"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {!isLoading && clients && clients.length > 0 && !error && (
          <ScrollView
            contentContainerStyle={{padding: 20}}
            showsVerticalScrollIndicator={false}>
            <View>
              {clients.map(client => (
                <TouchableOpacity
                  key={client.id}
                  onPress={() => handleEdit(client)}
                  style={{
                    backgroundColor: '#fff',
                    marginBottom: 16,
                    borderRadius: 16,
                    padding: 20,
                    shadowColor: '#000',
                    shadowOffset: {width: 0, height: 3},
                    shadowOpacity: 0.08,
                    shadowRadius: 12,
                    elevation: 4,
                    borderLeftWidth: 4,
                    borderLeftColor: '#007bff',
                  }}>
                  {/* Nome do cliente */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 12,
                    }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: '#007bff',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 12,
                      }}>
                      <Text
                        style={{
                          color: '#fff',
                          fontSize: 16,
                          fontWeight: 'bold',
                        }}>
                        {client.name?.charAt(0)?.toUpperCase() || 'C'}
                      </Text>
                    </View>
                    <View style={{flex: 1}}>
                      <Text
                        style={{
                          fontWeight: '700',
                          fontSize: 18,
                          color: '#212529',
                          marginBottom: 2,
                        }}>
                        {client.name}
                      </Text>
                    </View>
                    <Icon name="chevron-right" size={24} color="#6c757d" />
                  </View>

                  <View style={{paddingLeft: 52}}>
                    {client.document?.[0]?.documentType?.documentType ===
                      'CNPJ' && (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginBottom: 8,
                        }}>
                        <Icon name="business" size={16} color="#6c757d" />
                        <Text
                          style={{
                            color: '#495057',
                            marginLeft: 8,
                            fontSize: 14,
                          }}>
                          {client.document[0].document}
                        </Text>
                      </View>
                    )}

                    {client.phone?.[0] && (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginBottom: 8,
                        }}>
                        <Icon name="phone" size={16} color="#6c757d" />
                        <Text
                          style={{
                            color: '#495057',
                            marginLeft: 8,
                            fontSize: 14,
                          }}>
                          ({client.phone[0].ddd}) {client.phone[0].phone}
                        </Text>
                      </View>
                    )}

                    {client.email?.[0]?.email && (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}>
                        <Icon name="email" size={16} color="#6c757d" />
                        <Text
                          style={{
                            color: '#495057',
                            marginLeft: 8,
                            fontSize: 14,
                          }}>
                          {client.email[0].email}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Pagination Controls */}
            {totalItems > itemsPerPage && (
              <View
                style={{
                  backgroundColor: '#fff',
                  marginTop: 16,
                  borderRadius: 16,
                  padding: 20,
                  shadowColor: '#000',
                  shadowOffset: {width: 0, height: 3},
                  shadowOpacity: 0.08,
                  shadowRadius: 12,
                  elevation: 4,
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                  <TouchableOpacity
                    onPress={() =>
                      setCurrentPage(prev => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 8,
                      backgroundColor:
                        currentPage === 1 ? '#f8f9fa' : '#007bff',
                      opacity: currentPage === 1 ? 0.5 : 1,
                    }}>
                    <Icon
                      name="chevron-left"
                      size={20}
                      color={currentPage === 1 ? '#6c757d' : '#fff'}
                    />
                    <Text
                      style={{
                        color: currentPage === 1 ? '#6c757d' : '#fff',
                        marginLeft: 4,
                        fontWeight: '600',
                      }}>
                      Anterior
                    </Text>
                  </TouchableOpacity>

                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Text style={{color: '#6c757d', fontSize: 14}}>
                      Página {currentPage} de{' '}
                      {Math.ceil(totalItems / itemsPerPage)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() =>
                      setCurrentPage(prev =>
                        Math.min(
                          Math.ceil(totalItems / itemsPerPage),
                          prev + 1,
                        ),
                      )
                    }
                    disabled={
                      currentPage >= Math.ceil(totalItems / itemsPerPage)
                    }
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 8,
                      backgroundColor:
                        currentPage >= Math.ceil(totalItems / itemsPerPage)
                          ? '#f8f9fa'
                          : '#007bff',
                      opacity:
                        currentPage >= Math.ceil(totalItems / itemsPerPage)
                          ? 0.5
                          : 1,
                    }}>
                    <Text
                      style={{
                        color:
                          currentPage >= Math.ceil(totalItems / itemsPerPage)
                            ? '#6c757d'
                            : '#fff',
                        marginRight: 4,
                        fontWeight: '600',
                      }}>
                      Próxima
                    </Text>
                    <Icon
                      name="chevron-right"
                      size={20}
                      color={
                        currentPage >= Math.ceil(totalItems / itemsPerPage)
                          ? '#6c757d'
                          : '#fff'
                      }
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        )}

        {!isLoading && (!clients || clients.length === 0) && !error && (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              padding: 40,
            }}>
            <Icon name="people-outline" size={80} color="#dee2e6" />
            <Text
              style={{
                fontSize: 18,
                color: '#6c757d',
                textAlign: 'center',
                marginTop: 16,
                fontWeight: '500',
              }}>
              Nenhum cliente encontrado
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: '#adb5bd',
                textAlign: 'center',
                marginTop: 8,
              }}>
              {search
                ? 'Tente uma busca diferente'
                : 'Adicione seu primeiro cliente'}
            </Text>
          </View>
        )}

        <AddCompanyModal
          visible={showAddCompanyModal}
          onClose={() => setShowAddCompanyModal(false)}
          onSave={handleSaveCompany}
        />

        {/* Dropdown Overlay */}
        {showItemsPerPageDropdown && (
          <View
            style={{
              position: 'absolute',
              top: 140, // Ajuste conforme necessário
              right: 20,
              backgroundColor: '#fff',
              borderWidth: 1,
              borderColor: '#e9ecef',
              borderRadius: 6,
              shadowColor: '#000',
              shadowOffset: {width: 0, height: 2},
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 999,
              zIndex: 999,
            }}>
            {[5, 10, 20, 50].map(size => (
              <TouchableOpacity
                key={size}
                onPress={() => {
                  setItemsPerPage(size);
                  setShowItemsPerPageDropdown(false);
                }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  backgroundColor:
                    itemsPerPage === size ? '#f8f9fa' : 'transparent',
                  borderBottomWidth: size !== 50 ? 1 : 0,
                  borderBottomColor: '#f1f3f4',
                }}>
                <Text
                  style={{
                    color: itemsPerPage === size ? '#007bff' : '#495057',
                    fontSize: 14,
                    fontWeight: itemsPerPage === size ? '600' : '400',
                  }}>
                  {size}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </SafeAreaView>
    </TouchableOpacity>
  );
};

export default Clients;
