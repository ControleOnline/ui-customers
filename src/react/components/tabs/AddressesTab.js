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

const extractId = value => String(value || '').replace(/\D/g, '');
const normalizeId = value => extractId(value) || value || Date.now();

const toPeopleIri = person => {
  const rawIri = String(person?.['@id'] || '').trim();
  if (rawIri.startsWith('/people/')) {
    return rawIri;
  }

  const nestedIri = String(person?.people?.['@id'] || person?.people || '').trim();
  if (nestedIri.startsWith('/people/')) {
    return nestedIri;
  }

  const id = extractId(person?.id || person?.people?.id || rawIri || nestedIri);
  return id ? `/people/${id}` : '';
};

const normalizeString = value => {
  const text = String(value || '').trim();
  return text.length > 0 ? text : undefined;
};
const normalizeZipCode = value =>
  String(value || '')
    .replace(/\D/g, '')
    .slice(0, 8);

const buildAddressMapQuery = address => {
  const streetLine = [normalizeString(address?.street), normalizeString(address?.number)]
    .filter(Boolean)
    .join(', ');
  const cityStateLine = [normalizeString(address?.city), normalizeString(address?.state)]
    .filter(Boolean)
    .join(' - ');

  return buildNavigationMapQuery([
    streetLine,
    normalizeString(address?.district),
    cityStateLine,
    normalizeString(address?.country),
    normalizeZipCode(address?.zipCode),
    normalizeString(address?.complement),
  ]);
};

const buildAddressPrimaryLine = address =>
  [normalizeString(address?.street), normalizeString(address?.number)]
    .filter(Boolean)
    .join(', ');

const buildAddressSecondaryLine = address =>
  [
    normalizeString(address?.district),
    [normalizeString(address?.city), normalizeString(address?.state)]
      .filter(Boolean)
      .join(' - '),
    normalizeString(address?.country),
  ]
    .filter(Boolean)
    .join(' • ');

const normalizeAddress = address => ({
  id: normalizeId(address?.id || address?.['@id']),
  street: address?.street?.street || address?.street || '',
  number: String(address?.number || '').trim(),
  city:
    address?.street?.district?.city?.city ||
    address?.street?.city?.city ||
    address?.city ||
    '',
  state:
    address?.street?.district?.city?.state?.uf ||
    address?.street?.district?.city?.state?.state ||
    address?.street?.city?.state?.uf ||
    address?.street?.city?.state?.state ||
    address?.state ||
    '',
  zipCode:
    (typeof address?.zipCode === 'object'
      ? address?.zipCode?.cep
      : address?.zipCode) ||
    address?.street?.cep?.cep ||
    address?.postal_code ||
    address?.cep ||
    '',
  complement: address?.complement || '',
  district:
    address?.street?.district?.district ||
    address?.district ||
    '',
  country:
    address?.street?.district?.city?.state?.country?.countrycode ||
    address?.street?.district?.city?.state?.country?.countryname ||
    address?.street?.city?.state?.country?.countrycode ||
    address?.street?.city?.state?.country?.countryname ||
    address?.country ||
    '',
  nickname: address?.nickname || '',
});

const mapAddressesForClient = list =>
  list.map(item => ({
    id: item.id,
    '@id': String(item?.id || '').startsWith('/addresses/')
      ? String(item.id)
      : `/addresses/${extractId(item.id || '')}`,
    street: item.street,
    number: item.number,
    complement: item.complement,
    district: item.district,
    city: item.city,
    state: item.state,
    zipCode: item.zipCode,
    country: item.country,
    nickname: item.nickname,
  }));

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
    const normalizedItem = item ? normalizeAddress(item) : {};
    setEditingItem(item ? normalizedItem : null);
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
    const mapQuery = buildAddressMapQuery(normalizedAddress);

    if (!mapQuery) {
      showError('Nao foi possivel montar a navegacao para este endereco.');
      return;
    }

    setNavigationAddress(normalizedAddress);
    setShowNavigationModal(true);
  };

  const handleOpenNavigation = async appName => {
    const mapQuery = buildAddressMapQuery(navigationAddress);
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

  const saveAddress = async payload => {
    if (!actions?.save) {
      throw new Error('Servico de enderecos indisponivel no momento.');
    }

    if (!peopleIri) {
      throw new Error('Nao foi possivel identificar o cliente para salvar o endereco.');
    }

    return actions.save({
      ...payload,
      people: peopleIri,
    });
  };

  const handleAddressSaved = saved => {
    const normalizedSaved = normalizeAddress(saved || {});
    const updatedAddresses = editingItem
      ? addresses.map(item =>
          item.id === editingItem.id ? normalizedSaved : item,
        )
      : [...addresses, normalizedSaved];

    setAddresses(updatedAddresses);
    onUpdateClient?.('address', mapAddressesForClient(updatedAddresses));

    showSuccess(
      editingItem
        ? 'Endereco atualizado com sucesso!'
        : 'Endereco criado com sucesso!',
    );
    closeModal();
  };

  const handleDelete = id => {
    showDialog({
      title: 'Confirmar exclusao',
      message: 'Deseja realmente remover este item?',
      confirmLabel: 'Remover',
      cancelLabel: 'Cancelar',
      onConfirm: async () => {
        try {
          if (!actions?.remove) {
            showError('Servico de enderecos indisponivel no momento.');
            return;
          }
          await actions.remove(id);
          const updatedAddresses = addresses.filter(item => item.id !== id);
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
              {editingItem ? global.t?.t('address', 'title', 'editAddress') : global.t?.t('address', 'title', 'address')}
            </Text>
            <TouchableOpacity
              onPress={closeModal}
              style={addressModalStyles.closeButton}>
              <FeatherIcon name="x" size={20} color="#0F172A" />
            </TouchableOpacity>
          </View>
          <DefaultAddress
            mode={editingItem ? 'edit' : 'create'}
            row={editingItem
              ? {
                  ...editingItem,
                  cep: editingItem.zipCode,
                  uf: editingItem.state,
                  country: editingItem.country,
                }
              : null}
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
            <Text style={customStyles.sectionTitle}>{global.t?.t('address', 'title', 'addresses')}</Text>
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
            <Text style={customStyles.emptyText}>{global.t?.t('address', 'label', 'noAddressesFound')}</Text>
          ) : (
            addresses.map(address => (
              <View
                key={address.id}
                style={[
                  customStyles.listItem,
                  customStyles.listItemWithActions,
                ]}>
                <View style={customStyles.itemContent}>
                  <TouchableOpacity
                    onPress={() => openNavigationModal(address)}
                    style={[
                      customStyles.iconButtonLocation,
                      customStyles.locationButton,
                    ]}>
                    <Icon
                      name="location-on"
                      size={20}
                      color={customStyles.iconButtonPrimaryIcon.color}
                    />
                  </TouchableOpacity>
                  <View>
                    <Text style={customStyles.itemText}>
                      {address.street}
                      {address.number ? `, ${address.number}` : ''}
                    </Text>
                    <Text style={customStyles.itemSubtext}>
                      {address.district ? `${address.district}, ` : ''}
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
