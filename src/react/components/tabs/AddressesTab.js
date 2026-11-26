import React, {useEffect, useMemo, useState} from 'react';
import {
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import {useStores} from '@store';
import {useMessage} from '@controleonline/ui-common/src/react/components/MessageService';
import DefaultAddress from '@controleonline/ui-default/src/react/components/address/DefaultAddress';
import {
  buildGoogleMapsNavigationUrl,
  buildNavigationMapQuery,
  buildWazeNavigationUrl,
} from '@controleonline/ui-common/src/react/utils/mapNavigation';
import {
  buildAddressMapQueryParts,
  buildAddressPrimaryLine,
  buildAddressSecondaryLine,
  mapAddressesForClient,
  normalizeAddress,
  resolveAddressSaveId,
  toPeopleIri,
} from './addressesTabHelpers';

const AddressesTab = ({client, customStyles, isEditing, onUpdateClient}) => {
  const {showError, showSuccess, showDialog} = useMessage();
  const [addresses, setAddresses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showNavigationModal, setShowNavigationModal] = useState(false);
  const [navigationAddress, setNavigationAddress] = useState(null);

  const addressStore = useStores(state => state.address) || {};
  const actions = addressStore.actions || {};
  const peopleIri = useMemo(() => toPeopleIri(client), [client]);

  useEffect(() => {
    const rawAddresses = Array.isArray(client?.address)
      ? client.address.map(item => normalizeAddress(item))
      : [];
    setAddresses(rawAddresses);
  }, [client]);

  const openModal = item => {
    setEditingItem(item ? normalizeAddress(item) : null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const closeNavigationModal = () => {
    setShowNavigationModal(false);
    setNavigationAddress(null);
  };

  const openNavigationModal = address => {
    const normalizedAddress = normalizeAddress(address);
    const mapQuery = buildNavigationMapQuery(buildAddressMapQueryParts(normalizedAddress));

    if (!mapQuery) {
      showError('Nao foi possivel montar a navegacao para este endereco.');
      return;
    }

    setNavigationAddress(normalizedAddress);
    setShowNavigationModal(true);
  };

  const handleOpenNavigation = async appName => {
    const mapQuery = buildNavigationMapQuery(
      buildAddressMapQueryParts(navigationAddress),
    );
    const url =
      appName === 'waze'
        ? buildWazeNavigationUrl({mapQuery})
        : buildGoogleMapsNavigationUrl({mapQuery});

    if (!url) {
      showError('Nao foi possivel montar a navegacao para este endereco.');
      return;
    }

    closeNavigationModal();

    try {
      await Linking.openURL(url);
    } catch {
      showError('Nao foi possivel abrir o aplicativo de navegacao.');
    }
  };

  /**
   * Always attach a numeric id when editing so the default store issues PUT
   * (update) instead of POST (create). Root cause of app-community#282.
   */
  const saveAddress = async payload => {
    if (!actions?.save) {
      throw new Error('Servico de enderecos indisponivel no momento.');
    }

    if (!peopleIri) {
      throw new Error('Nao foi possivel identificar o cliente para salvar o endereco.');
    }

    const body = {
      ...payload,
      people: peopleIri,
    };

    const editId = resolveAddressSaveId(editingItem, payload);
    if (editId) {
      body.id = editId;
    }

    return actions.save(body);
  };

  const handleAddressSaved = saved => {
    const normalizedSaved = normalizeAddress(saved || {});
    const editId = resolveAddressSaveId(editingItem);
    const updatedAddresses = editId
      ? addresses.map(item =>
          resolveAddressSaveId(item) === editId ? normalizedSaved : item,
        )
      : [...addresses, normalizedSaved];

    setAddresses(updatedAddresses);
    onUpdateClient?.('address', mapAddressesForClient(updatedAddresses));

    showSuccess(
      editId
        ? 'Endereco atualizado com sucesso!'
        : 'Endereco criado com sucesso!',
    );
    closeModal();
  };

  const handleDelete = id => {
    const deleteId = resolveAddressSaveId({id});
    showDialog({
      title: 'Confirmar exclusao',
      message: 'Deseja realmente remover este item?',
      confirmLabel: 'Remover',
      cancelLabel: 'Cancelar',
      onConfirm: async () => {
        try {
          if (!actions?.remove || !deleteId) {
            showError('Servico de enderecos indisponivel no momento.');
            return;
          }
          await actions.remove(deleteId);
          const updatedAddresses = addresses.filter(
            item => resolveAddressSaveId(item) !== deleteId,
          );
          setAddresses(updatedAddresses);
          onUpdateClient?.('address', mapAddressesForClient(updatedAddresses));
          showSuccess('Endereco removido com sucesso!');
        } catch {
          showError('Falha ao remover endereco. Tente novamente.');
        }
      },
    });
  };

  const renderModal = () => (
    <Modal visible={showModal} transparent animationType="slide">
      <View style={[customStyles.modalOverlay, addressModalStyles.overlay]}>
        <View style={addressModalStyles.container}>
          <View style={addressModalStyles.header}>
            <Text style={[customStyles.modalTitle, addressModalStyles.title]}>
              {editingItem
                ? global.t?.t('address', 'title', 'editAddress')
                : global.t?.t('address', 'title', 'address')}
            </Text>
            <TouchableOpacity
              onPress={closeModal}
              style={addressModalStyles.closeButton}>
              <FeatherIcon name="x" size={20} color="#0F172A" />
            </TouchableOpacity>
          </View>
          <DefaultAddress
            mode={
              editingItem && resolveAddressSaveId(editingItem) ? 'edit' : 'create'
            }
            row={
              editingItem && resolveAddressSaveId(editingItem)
                ? {
                    ...editingItem,
                    id: resolveAddressSaveId(editingItem),
                    '@id':
                      editingItem['@id'] ||
                      `/addresses/${resolveAddressSaveId(editingItem)}`,
                    cep: editingItem.zipCode,
                    uf: editingItem.state,
                    country: editingItem.country,
                  }
                : null
            }
            peopleIri={peopleIri}
            saveAction={saveAddress}
            onCancel={closeModal}
            onSaved={handleAddressSaved}
            submitLabel={global.t?.t('address', 'button', 'save') || 'Salvar'}
          />
        </View>
      </View>
    </Modal>
  );

  const renderNavigationModal = () => {
    const primaryLine = buildAddressPrimaryLine(navigationAddress);
    const secondaryLine = buildAddressSecondaryLine(navigationAddress);

    return (
      <Modal
        visible={showNavigationModal}
        transparent
        animationType="fade"
        onRequestClose={closeNavigationModal}>
        <View style={customStyles.modalOverlay}>
          <View style={customStyles.modalContainer}>
            <Text style={customStyles.modalTitle}>Abrir endereco</Text>
            <Text style={customStyles.navigationModalDescription}>
              Escolha qual aplicativo deseja usar para navegar ate este endereco.
            </Text>
            <View style={customStyles.navigationAddressCard}>
              <Text style={customStyles.navigationAddressTitle}>
                {primaryLine || 'Endereco'}
              </Text>
              {secondaryLine ? (
                <Text style={customStyles.navigationAddressSubtitle}>
                  {secondaryLine}
                </Text>
              ) : null}
            </View>
            <View style={customStyles.navigationOptions}>
              <TouchableOpacity
                style={[
                  customStyles.navigationOptionButton,
                  customStyles.navigationOptionButtonPrimary,
                ]}
                onPress={() => handleOpenNavigation('google')}>
                <Text
                  style={[
                    customStyles.navigationOptionButtonText,
                    customStyles.navigationOptionButtonTextPrimary,
                  ]}>
                  Google Maps
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={customStyles.navigationOptionButton}
                onPress={() => handleOpenNavigation('waze')}>
                <Text style={customStyles.navigationOptionButtonText}>
                  Waze
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={customStyles.modalCancelButton}
              onPress={closeNavigationModal}>
              <Text style={customStyles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <>
      <View style={customStyles.tabContent}>
        <View style={customStyles.section}>
          <View style={customStyles.sectionHeader}>
            <Text style={customStyles.sectionTitle}>
              {global.t?.t('address', 'title', 'addresses')}
            </Text>
            {isEditing && (
              <TouchableOpacity
                onPress={() => openModal(null)}
                style={customStyles.iconButtonPrimary}>
                <Icon
                  name="add"
                  size={20}
                  color={customStyles.iconButtonPrimaryIcon.color}
                />
              </TouchableOpacity>
            )}
          </View>
          {addresses.length === 0 ? (
            <Text style={customStyles.emptyText}>
              {global.t?.t('address', 'empty', 'noAddresses') ||
                'Nenhum endereco cadastrado.'}
            </Text>
          ) : (
            addresses.map(address => (
              <View key={address.id || address['@id']} style={customStyles.itemCard}>
                <View style={customStyles.itemContent}>
                  <View style={{flex: 1}}>
                    <Text style={customStyles.itemTitle}>
                      {[address.street, address.number].filter(Boolean).join(', ') ||
                        'Endereco'}
                    </Text>
                    <Text style={customStyles.itemSubtitle}>
                      {address.district ? `${address.district}\n` : ''}
                      {address.city}
                      {address.state ? ` - ${address.state}` : ''}
                      {address.country ? ` (${address.country})` : ''}
                      {address.complement ? `\n${address.complement}` : ''}
                      {address.nickname && address.nickname !== 'DEFAULT'
                        ? `\n${address.nickname}`
                        : ''}
                    </Text>
                  </View>
                </View>
                {isEditing && (
                  <View
                    style={[
                      customStyles.itemActions,
                      customStyles.itemActionsPinned,
                    ]}>
                    <TouchableOpacity
                      onPress={() => openModal(address)}
                      style={customStyles.iconButtonGhost}>
                      <FeatherIcon
                        name="edit-2"
                        size={16}
                        color={customStyles.iconButtonGhostIcon.color}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(address.id)}
                      style={customStyles.iconButtonGhost}>
                      <FeatherIcon
                        name="trash-2"
                        size={16}
                        color={customStyles.iconButtonGhostIcon.color}
                      />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </View>
      {renderModal()}
      {renderNavigationModal()}
    </>
  );
};

const addressModalStyles = StyleSheet.create({
  overlay: {
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: '100%',
    borderRadius: 0,
    backgroundColor: '#FFFFFF',
    padding: 0,
  },
  header: {
    minHeight: 64,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  title: {
    textAlign: 'left',
    marginBottom: 0,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
});

export default AddressesTab;
