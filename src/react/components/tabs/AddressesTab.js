import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {getStore} from '@store';

const AddressesTab = ({client, customStyles, isEditing, onUpdateClient}) => {
  const [addresses, setAddresses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  const {actions} = getStore('address');

  useEffect(() => {
    const rawAddresses = Array.isArray(client?.address)
      ? client.address.map(a => {
          console.log('Original zipCode:', a.zipCode);
          const extractedZipCode =
            (typeof a.zipCode === 'object' ? a.zipCode?.cep : a.zipCode) ||
            a.street?.cep ||
            a.cep ||
            '';

          return {
            id: a.id || a['@id'],
            street: a.street?.street || a.street || '',
            number: a.number,
            city: a.street?.city?.city || a.city || '',
            state: a.street?.city?.state?.state || a.state || '',
            zipCode: extractedZipCode,
            complement: a.complement || '',
            district: a.district || '',
            country: a.country || '',
            nickname: a.nickname || '',
          };
        })
      : [];

    setAddresses(rawAddresses);

    setAddresses(rawAddresses);
  }, [client]);

  const openModal = (item = null) => {
    setEditingItem(item);
    setFormData(item || {});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({});
  };

  const handleSave = async () => {
    if (!formData.street || !formData.city) {
      Alert.alert('Erro', 'Rua e cidade são obrigatórios.');
      return;
    }

    try {
      if (!editingItem) {
        const addressData = {
          street: formData.street,
          number: formData.number,
          complement: formData.complement,
          city: formData.city,
          state: formData.state,
          cep: formData.zipCode,
          district: formData.district,
          country: formData.country,
          nickname: formData.nickname || 'DEFAULT',
          people: client['@id'],
        };

        await actions.save(addressData);

        const newAddress = {
          id: Date.now(),
          ...formData,
        };
        const updatedAddresses = [...addresses, newAddress];
        setAddresses(updatedAddresses);
        if (onUpdateClient) {
          const fullAddressData = updatedAddresses.map(a => ({
            id: a.id,
            '@id': a.id,
            street: a.street,
            number: a.number,
            complement: a.complement,
            district: a.district,
            city: a.city,
            state: a.state,
            zipCode: a.zipCode,
            country: a.country,
            nickname: a.nickname,
          }));
          onUpdateClient('address', fullAddressData);
        }

        Alert.alert('Sucesso', 'Endereço criado com sucesso!');
        closeModal();
      } else {
        const addressData = {
          id: editingItem.id,
          street: formData.street,
          number: formData.number,
          complement: formData.complement,
          city: formData.city,
          state: formData.state,
          cep: formData.zipCode,
          district: formData.district,
          country: formData.country,
          nickname: formData.nickname || 'DEFAULT',
        };

        await actions.save(addressData);

        const updatedAddress = {...editingItem, ...formData};
        const updatedAddresses = addresses.map(a =>
          a.id === editingItem.id ? updatedAddress : a,
        );
        setAddresses(updatedAddresses);
        if (onUpdateClient) {
          const fullAddressData = updatedAddresses.map(a => ({
            id: a.id,
            '@id': a.id,
            street: a.street,
            number: a.number,
            complement: a.complement,
            district: a.district,
            city: a.city,
            state: a.state,
            zipCode: a.zipCode,
            country: a.country,
            nickname: a.nickname,
          }));
          onUpdateClient('address', fullAddressData);
        }

        Alert.alert('Sucesso', 'Endereço atualizado com sucesso!');
        closeModal();
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Erro', 'Falha ao salvar endereço. Tente novamente.');
    }
  };

  const handleDelete = id => {
    Alert.alert('Confirmar exclusão', 'Deseja realmente remover este item?', [
      {text: 'Cancelar', style: 'cancel'},
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await actions.remove(id);
            const updatedAddresses = addresses.filter(a => a.id !== id);
            setAddresses(updatedAddresses);
            if (onUpdateClient) {
              const fullAddressData = updatedAddresses.map(a => ({
                id: a.id,
                '@id': a.id,
                street: a.street,
                number: a.number,
                complement: a.complement,
                district: a.district,
                city: a.city,
                state: a.state,
                zipCode: a.zipCode,
                country: a.country,
                nickname: a.nickname,
              }));
              onUpdateClient('address', fullAddressData);
            }
            Alert.alert('Sucesso', 'Endereço removido com sucesso!');
          } catch (error) {
            Alert.alert('Erro', 'Falha ao remover endereço. Tente novamente.');
          }
        },
      },
    ]);
  };

  const renderModal = () => (
    <Modal visible={showModal} transparent animationType="slide">
      <View style={customStyles.modalOverlay}>
        <View style={customStyles.modalContainer}>
          <Text style={customStyles.modalTitle}>
            {editingItem ? 'Editar Endereço' : 'Adicionar Endereço'}
          </Text>
          <TextInput
            style={customStyles.modalInput}
            placeholder="CEP"
            value={formData.zipCode || ''}
            onChangeText={text => setFormData({...formData, zipCode: text})}
          />
          <TextInput
            style={customStyles.modalInput}
            placeholder="Rua/Avenida"
            value={formData.street || ''}
            onChangeText={text => setFormData({...formData, street: text})}
          />
          <TextInput
            style={customStyles.modalInput}
            placeholder="Número"
            value={formData.number || ''}
            onChangeText={text => setFormData({...formData, number: text})}
          />
          <TextInput
            style={customStyles.modalInput}
            placeholder="Complemento"
            value={formData.complement || ''}
            onChangeText={text => setFormData({...formData, complement: text})}
          />
          <TextInput
            style={customStyles.modalInput}
            placeholder="Bairro/Distrito"
            value={formData.district || ''}
            onChangeText={text => setFormData({...formData, district: text})}
          />
          <TextInput
            style={customStyles.modalInput}
            placeholder="Cidade"
            value={formData.city || ''}
            onChangeText={text => setFormData({...formData, city: text})}
          />
          <TextInput
            style={customStyles.modalInput}
            placeholder="Estado"
            value={formData.state || ''}
            onChangeText={text => setFormData({...formData, state: text})}
          />
          <TextInput
            style={customStyles.modalInput}
            placeholder="País"
            value={formData.country || ''}
            onChangeText={text => setFormData({...formData, country: text})}
          />

          <TextInput
            style={customStyles.modalInput}
            placeholder="Apelido (opcional)"
            value={formData.nickname || ''}
            onChangeText={text => setFormData({...formData, nickname: text})}
          />
          <View style={customStyles.modalActions}>
            <TouchableOpacity
              style={customStyles.modalCancelButton}
              onPress={closeModal}>
              <Text style={customStyles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={customStyles.modalSaveButton}
              onPress={handleSave}>
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
            <Text style={customStyles.sectionTitle}>Endereços</Text>
            {isEditing && (
              <TouchableOpacity onPress={() => openModal()}>
                <Icon name="add" size={24} color="#007bff" />
              </TouchableOpacity>
            )}
          </View>
          {addresses.length === 0 ? (
            <Text style={customStyles.emptyText}>
              Nenhum endereço cadastrado
            </Text>
          ) : (
            addresses.map(address => (
              <View key={address.id} style={customStyles.listItem}>
                <View style={customStyles.itemContent}>
                  <Icon name="location-on" size={20} color="#666" />
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
                        ? `\n📍 ${address.nickname}`
                        : ''}
                    </Text>
                  </View>
                </View>
                {isEditing && (
                  <View style={customStyles.itemActions}>
                    <TouchableOpacity onPress={() => openModal(address)}>
                      <Icon name="edit" size={20} color="#007bff" />
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
