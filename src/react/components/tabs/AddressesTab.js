import React, {useEffect, useMemo, useState} from 'react';
import {
  Keyboard,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useStores} from '@store';
import {useMessage} from '@controleonline/ui-common/src/react/components/MessageService';
import {colors} from '@controleonline/../../src/styles/colors';

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

const normalizeAddress = address => ({
  id: normalizeId(address?.id || address?.['@id']),
  street: address?.street?.street || address?.street || '',
  number: address?.number || '',
  city: address?.street?.city?.city || address?.city || '',
  state: address?.street?.city?.state?.state || address?.state || '',
  zipCode:
    (typeof address?.zipCode === 'object'
      ? address?.zipCode?.cep
      : address?.zipCode) ||
    address?.street?.cep?.cep ||
    address?.postal_code ||
    address?.cep ||
    '',
  complement: address?.complement || '',
  district: address?.street?.district?.district || address?.district || '',
  country:
    address?.street?.city?.state?.country?.countryname || address?.country || '',
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
  const [formData, setFormData] = useState({});

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
    setEditingItem(item || null);
    setFormData(item || {});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({});
  };

  const handleSave = async () => {
    if (!actions?.save) {
      showError('Servico de enderecos indisponivel no momento.');
      return;
    }

    const street = normalizeString(formData.street);
    const city = normalizeString(formData.city);
    const zipCode = normalizeZipCode(formData.zipCode);

    if (!street || !city) {
      showError('Rua e cidade sao obrigatorios.');
      return;
    }
    if (!zipCode) {
      showError('CEP e obrigatorio.');
      return;
    }

    if (!peopleIri) {
      showError('Nao foi possivel identificar o cliente para salvar o endereco.');
      return;
    }

    const payload = {
      street,
      city,
      people: peopleIri,
      number: normalizeString(formData.number),
      complement: normalizeString(formData.complement),
      state: normalizeString(formData.state),
      district: normalizeString(formData.district),
      country: normalizeString(formData.country),
      nickname: normalizeString(formData.nickname) || 'DEFAULT',
      cep: zipCode,
      postal_code: zipCode,
    };

    try {
      let saved;
      if (editingItem) {
        payload.id = editingItem.id;
        saved = await actions.save(payload);
      } else {
        saved = await actions.save(payload);
      }

      const normalizedSaved = normalizeAddress(saved || payload);
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
    } catch (error) {
      const backendMessage = Array.isArray(error?.message)
        ? error.message.map(item => item?.message || item).join(', ')
        : error?.message;
      showError(backendMessage || 'Falha ao salvar endereco. Tente novamente.');
    }
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
        } catch (error) {
          showError('Falha ao remover endereco. Tente novamente.');
        }
      },
    });
  };

  const renderModal = () => (
    <Modal visible={showModal} transparent animationType="slide">
      <View style={customStyles.modalOverlay}>
        <View style={customStyles.modalContainer}>
          <Text style={customStyles.modalTitle}>
            {editingItem ? global.t?.t('addressesTab', 'title', 'editAddress') : global.t?.t('addressesTab', 'title', 'addAddress')}
          </Text>
          <TextInput
            style={customStyles.modalInput}
            placeholder={global.t?.t('addressesTab', 'title', 'zipCode')}
            value={formData.zipCode || ''}
            onChangeText={text => setFormData({...formData, zipCode: text})}
          />
          <TextInput
            style={customStyles.modalInput}
            placeholder={global.t?.t('addressesTab', 'title', 'street')}
            value={formData.street || ''}
            onChangeText={text => setFormData({...formData, street: text})}
          />
          <TextInput
            style={customStyles.modalInput}
            placeholder={global.t?.t('addressesTab', 'title', 'number')}
            value={formData.number || ''}
            onChangeText={text => setFormData({...formData, number: text})}
          />
          <TextInput
            style={customStyles.modalInput}
            placeholder={global.t?.t('addressesTab', 'title', 'complement')}
            value={formData.complement || ''}
            onChangeText={text => setFormData({...formData, complement: text})}
          />
          <TextInput
            style={customStyles.modalInput}
            placeholder={global.t?.t('addressesTab', 'title', 'district')}
            value={formData.district || ''}
            onChangeText={text => setFormData({...formData, district: text})}
          />
          <TextInput
            style={customStyles.modalInput}
            placeholder={global.t?.t('addressesTab', 'title', 'city')}
            value={formData.city || ''}
            onChangeText={text => setFormData({...formData, city: text})}
          />
          <TextInput
            style={customStyles.modalInput}
            placeholder={global.t?.t('addressesTab', 'title', 'state')}
            value={formData.state || ''}
            onChangeText={text => setFormData({...formData, state: text})}
          />
          <TextInput
            style={customStyles.modalInput}
            placeholder={global.t?.t('addressesTab', 'title', 'country')}
            value={formData.country || ''}
            onChangeText={text => setFormData({...formData, country: text})}
          />
          <TextInput
            style={customStyles.modalInput}
            placeholder={global.t?.t('addressesTab', 'title', 'optionsNicknamePlaceholder')}
            value={formData.nickname || ''}
            onChangeText={text => setFormData({...formData, nickname: text})}
          />
          <View style={customStyles.modalActions}>
            <TouchableOpacity
              style={customStyles.modalCancelButton}
              onPress={() => {
                Keyboard.dismiss();
                closeModal();
              }}>
              <Text style={customStyles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={customStyles.modalSaveButton}
              onPress={() => {
                Keyboard.dismiss();
                handleSave();
              }}>
              <Text style={customStyles.modalSaveText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <View style={customStyles.tabContent}>
        <View style={customStyles.section}>
          <View style={customStyles.sectionHeader}>
            <Text style={customStyles.sectionTitle}>{global.t?.t('addressesTab', 'title', 'addresses')}</Text>
            {isEditing && (
              <TouchableOpacity onPress={() => openModal(null)}>
                <Icon name="add" size={24} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
          {addresses.length === 0 ? (
            <Text style={customStyles.emptyText}>{global.t?.t('addressesTab', 'label', 'noAddressesFound')}</Text>
          ) : (
            addresses.map(address => (
              <View key={address.id} style={customStyles.listItem}>
                <View style={customStyles.itemContent}>
                  <Icon name="location-on" size={20} color={colors.primary} />
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
                  <View style={customStyles.itemActions}>
                    <TouchableOpacity onPress={() => openModal(address)}>
                      <Icon name="edit" size={20} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(address.id)}>
                      <Icon name="delete" size={20} color="#ff4444" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </View>
      {renderModal()}
    </>
  );
};

export default AddressesTab;
