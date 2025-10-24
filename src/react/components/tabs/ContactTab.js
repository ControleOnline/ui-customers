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

const ContactTab = ({client, customStyles, isEditing}) => {
  const [phones, setPhones] = useState([]);
  const [emails, setEmails] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  const {actions: actionsPhones} = getStore('phones');
  const {actions: actionsEmails} = getStore('emails');

  useEffect(() => {
    const rawPhones = Array.isArray(client?.phone)
      ? client.phone.map(p => ({
          id: p.id || p['@id'],
          value: `(${p.ddd}) ${p.phone}`,
        }))
      : [];
    const rawEmails = Array.isArray(client?.email)
      ? client.email.map(e => ({id: e.id || e['@id'], value: e.email}))
      : [];

    setPhones(rawPhones);
    setEmails(rawEmails);
  }, [client]);

  const validateEmail = email => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);

    if (type === 'phone' && item) {
      const phoneMatch = item.value.match(/\((\d{2})\)\s(\d+)/);
      if (phoneMatch) {
        setFormData({
          ...item,
          ddd: phoneMatch[1],
          phone: phoneMatch[2],
        });
      } else {
        setFormData(item || {});
      }
    } else {
      setFormData(item || {});
    }

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType('');
    setEditingItem(null);
    setFormData({});
  };

  const handleSave = async () => {
    if (modalType === 'phone') {
      if (!formData.ddd || !formData.phone) {
        Alert.alert('Erro', 'DDD e telefone são obrigatórios.');
        return;
      }

      try {
        const phoneData = {
          phone: parseInt(formData.phone, 10),
          ddi: 55,
          ddd: parseInt(formData.ddd, 10),
          people: client['@id'],
        };

        if (editingItem) {
          phoneData.id = editingItem.id;
        }

        await actionsPhones.save(phoneData);

        const phoneItem = {
          id: editingItem?.id || Date.now(),
          value: `(${formData.ddd}) ${formData.phone}`,
        };

        if (editingItem) {
          setPhones(phones.map(p => (p.id === editingItem.id ? phoneItem : p)));
        } else {
          setPhones([...phones, phoneItem]);
        }

        Alert.alert(
          'Sucesso',
          `Telefone ${editingItem ? 'atualizado' : 'adicionado'} com sucesso!`,
        );
        closeModal();
      } catch (error) {
        Alert.alert(
          'Erro',
          `Falha ao ${
            editingItem ? 'atualizar' : 'adicionar'
          } telefone. Tente novamente.`,
        );
      }
    } else if (modalType === 'email') {
      if (!formData.value || !validateEmail(formData.value)) {
        Alert.alert('Erro', 'Email válido é obrigatório.');
        return;
      }

      try {
        const emailData = {
          email: formData.value,
          people: client['@id'],
        };

        if (editingItem) {
          emailData.id = editingItem.id;
        }

        await actionsEmails.save(emailData);

        const emailItem = {
          id: editingItem?.id || Date.now(),
          value: formData.value,
        };

        if (editingItem) {
          setEmails(emails.map(e => (e.id === editingItem.id ? emailItem : e)));
        } else {
          setEmails([...emails, emailItem]);
        }

        Alert.alert(
          'Sucesso',
          `Email ${editingItem ? 'atualizado' : 'adicionado'} com sucesso!`,
        );
        closeModal();
      } catch (error) {
        Alert.alert(
          'Erro',
          `Falha ao ${
            editingItem ? 'atualizar' : 'adicionar'
          } email. Tente novamente.`,
        );
      }
    }
  };

  const handleDelete = (type, id) => {
    Alert.alert('Confirmar exclusão', 'Deseja realmente remover este item?', [
      {text: 'Cancelar', style: 'cancel'},
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {

          if (type === 'phone') {

            actionsPhones.remove(id)

              .then(() => {
                setPhones(phones.filter(p => p.id !== id));
                Alert.alert('Sucesso', 'Telefone removido com sucesso!');
              })
              .catch((error) => {
                Alert.alert('Erro', 'Falha ao remover o telefone. Tente novamente.')
              })

          } else if (type === 'email') {

            actionsEmails.remove(id)
              .then(() => {
                setPhones(phones.filter(p => p.id !== id));
                Alert.alert('Sucesso', 'Email removido com sucesso!');
              })
              .catch((error) => {
                Alert.alert('Erro', 'Falha ao remover o email. Tente novamente.')
              })
          }
        },
      },
    ]);
  };

  const renderModal = () => {
    const renderModalContent = () => {
      if (modalType === 'phone') {
        return (
          <View>
            <Text style={customStyles.modalTitle}>
              {editingItem ? 'Editar Telefone' : 'Adicionar Telefone'}
            </Text>
            <TextInput
              style={customStyles.modalInput}
              placeholder="DDD (ex: 11)"
              value={formData.ddd || ''}
              onChangeText={text => setFormData({...formData, ddd: text})}
              keyboardType="numeric"
              maxLength={2}
            />
            <TextInput
              style={customStyles.modalInput}
              placeholder="Telefone (ex: 999999999)"
              value={formData.phone || ''}
              onChangeText={text => setFormData({...formData, phone: text})}
              keyboardType="numeric"
              maxLength={9}
            />
          </View>
        );
      } else if (modalType === 'email') {
        return (
          <View>
            <Text style={customStyles.modalTitle}>
              {editingItem ? 'Editar Email' : 'Adicionar Email'}
            </Text>
            <TextInput
              style={customStyles.modalInput}
              placeholder="email@exemplo.com"
              value={formData.value || ''}
              onChangeText={text => setFormData({...formData, value: text})}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        );
      }
      return null;
    };

    return (
      <Modal visible={showModal} transparent animationType="slide">
        <View style={customStyles.modalOverlay}>
          <View style={customStyles.modalContainer}>
            {renderModalContent()}
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
  };
  return (
    <>
      <View style={customStyles.tabContent}>
        {/* Telefones */}
        <View style={customStyles.section}>
          <View style={customStyles.sectionHeader}>
            <Text style={customStyles.sectionTitle}>Telefones</Text>
            {isEditing && (
              <TouchableOpacity onPress={() => openModal('phone')}>
                <Icon name="add" size={24} color="#007bff" />
              </TouchableOpacity>
            )}
          </View>
          {phones.length === 0 ? (
            <Text style={customStyles.emptyText}>
              Nenhum telefone cadastrado
            </Text>
          ) : (
            phones.map(phone => (
              <View key={phone.id} style={customStyles.listItem}>
                <View style={customStyles.itemContent}>
                  <Icon name="phone" size={20} color="#666" />
                  <Text style={customStyles.itemText}>
                    {String(phone.value || '')}
                  </Text>
                </View>
                {isEditing && (
                  <View style={customStyles.itemActions}>
                    <TouchableOpacity onPress={() => openModal('phone', phone)}>
                      <Icon name="edit" size={20} color="#007bff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete('phone', phone.id)}>
                      <Icon name="delete" size={20} color="#ff4444" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {/* Emails */}
        <View style={customStyles.section}>
          <View style={customStyles.sectionHeader}>
            <Text style={customStyles.sectionTitle}>Emails</Text>
            {isEditing && (
              <TouchableOpacity onPress={() => openModal('email')}>
                <Icon name="add" size={24} color="#007bff" />
              </TouchableOpacity>
            )}
          </View>
          {emails.length === 0 ? (
            <Text style={customStyles.emptyText}>Nenhum email cadastrado</Text>
          ) : (
            emails.map(email => (
              <View key={email.id} style={customStyles.listItem}>
                <View style={customStyles.itemContent}>
                  <Icon name="email" size={20} color="#666" />
                  <Text style={customStyles.itemText}>
                    {String(email.value || '')}
                  </Text>
                </View>
                {isEditing && (
                  <View style={customStyles.itemActions}>
                    <TouchableOpacity onPress={() => openModal('email', email)}>
                      <Icon name="edit" size={20} color="#007bff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete('email', email.id)}>
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

export default ContactTab;
