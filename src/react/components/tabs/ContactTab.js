import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import AnimatedModal from '@controleonline/ui-crm/src/react/components/AnimatedModal';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useStores } from '@store';
import {useMessage} from '@controleonline/ui-common/src/react/components/MessageService';

const ContactTab = ({ client, customStyles, isEditing, onUpdateClient }) => {
  const {showError, showSuccess, showDialog} = useMessage();
  const [phones, setPhones] = useState([]);
  const [emails, setEmails] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  const phonesStore = useStores(state => state.phones);
  const actionsPhones = phonesStore.actions;
  const emailsStore = useStores(state => state.emails);
  const actionsEmails = emailsStore.actions;

  const extractPhoneDigits = value =>
    String(value || '')
      .replace(/\D/g, '')
      .slice(0, 11);

  const splitPhoneValue = value => {
    const digits = extractPhoneDigits(value);
    if (digits.length < 2) {
      return { ddd: '', phone: '' };
    }

    return {
      ddd: digits.slice(0, 2),
      phone: digits.slice(2),
    };
  };

  const formatPhoneValue = value => {
    const digits = extractPhoneDigits(value);
    if (!digits) {
      return '';
    }

    if (digits.length <= 2) {
      return `(${digits}`;
    }

    const ddd = digits.slice(0, 2);
    const phoneNumber = digits.slice(2);

    if (phoneNumber.length <= 4) {
      return `(${ddd}) ${phoneNumber}`;
    }

    if (phoneNumber.length <= 8) {
      return `(${ddd}) ${phoneNumber.slice(0, phoneNumber.length - 4)}-${phoneNumber.slice(-4)}`;
    }

    return `(${ddd}) ${phoneNumber.slice(0, 5)}-${phoneNumber.slice(5, 9)}`;
  };

  useEffect(() => {
    const rawPhones = Array.isArray(client?.phone)
      ? client.phone.map(p => ({
        id: p.id || p['@id'],
        value: formatPhoneValue(`${p.ddd || ''}${p.phone || ''}`),
      }))
      : [];
    const rawEmails = Array.isArray(client?.email)
      ? client.email.map(e => ({ id: e.id || e['@id'], value: e.email }))
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
      setFormData({
        ...item,
        phone: formatPhoneValue(item?.value || ''),
      });
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
      const phoneDigits = extractPhoneDigits(formData.phone);
      if (phoneDigits.length !== 10 && phoneDigits.length !== 11) {
        showError('Telefone com DDD é obrigatório.');
        return;
      }

      const { ddd, phone } = splitPhoneValue(phoneDigits);

      try {
        const phoneData = {
          phone: parseInt(phone, 10),
          ddi: 55,
          ddd: parseInt(ddd, 10),
          people: client['@id'],
        };

        if (editingItem) {
          phoneData.id = editingItem.id;
        }

        await actionsPhones.save(phoneData);

        const phoneItem = {
          id: editingItem?.id || Date.now(),
          value: formatPhoneValue(phoneDigits),
        };

        const updatedPhones = editingItem
          ? phones.map(p => (p.id === editingItem.id ? phoneItem : p))
          : [...phones, phoneItem];

        setPhones(updatedPhones);

        // Atualizar o cliente com a estrutura completa
        if (onUpdateClient) {
          const fullPhoneData = updatedPhones.map(p => {
            const phoneParts = splitPhoneValue(p.value);
            return {
              id: p.id,
              '@id': p.id,
              ddd: phoneParts.ddd,
              phone: phoneParts.phone,
              ddi: 55,
            };
          });
          onUpdateClient('phone', fullPhoneData);
        }

        showSuccess(
          `Telefone ${editingItem ? 'atualizado' : 'adicionado'} com sucesso!`,
        );
        closeModal();
      } catch (error) {
        showError(
          `Falha ao ${editingItem ? 'atualizar' : 'adicionar'} telefone. Tente novamente.`,
        );
      }
    } else if (modalType === 'email') {
      if (!formData.value || !validateEmail(formData.value)) {
        showError('Email válido é obrigatório.');
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

        const updatedEmails = editingItem
          ? emails.map(e => (e.id === editingItem.id ? emailItem : e))
          : [...emails, emailItem];

        setEmails(updatedEmails);

        // Atualizar o cliente com a estrutura completa
        if (onUpdateClient) {
          const fullEmailData = updatedEmails.map(e => ({
            id: e.id,
            '@id': e.id,
            email: e.value,
          }));
          onUpdateClient('email', fullEmailData);
        }

        showSuccess(
          `Email ${editingItem ? 'atualizado' : 'adicionado'} com sucesso!`,
        );
        closeModal();
      } catch (error) {
        showError(
          `Falha ao ${editingItem ? 'atualizar' : 'adicionar'} email. Tente novamente.`,
        );
      }
    }
  };

  const handleDelete = (type, id) => {
    showDialog({
      title: 'Confirmar exclusão',
      message: 'Deseja realmente remover este item?',
      confirmLabel: 'Remover',
      cancelLabel: 'Cancelar',
      onConfirm: async () => {
        try {
          if (type === 'phone') {
            await actionsPhones.remove(id);
            const updatedPhones = phones.filter(p => p.id !== id);
            setPhones(updatedPhones);
            if (onUpdateClient) {
              const fullPhoneData = updatedPhones.map(p => {
                const phoneParts = splitPhoneValue(p.value);
                return {
                  id: p.id,
                  '@id': p.id,
                  ddd: phoneParts.ddd,
                  phone: phoneParts.phone,
                  ddi: 55,
                };
              });
              onUpdateClient('phone', fullPhoneData);
            }
            showSuccess('Telefone removido com sucesso!');
          } else if (type === 'email') {
            await actionsEmails.remove(id);
            const updatedEmails = emails.filter(e => e.id !== id);
            setEmails(updatedEmails);
            if (onUpdateClient) {
              const fullEmailData = updatedEmails.map(e => ({
                id: e.id,
                '@id': e.id,
                email: e.value,
              }));
              onUpdateClient('email', fullEmailData);
            }
            showSuccess('Email removido com sucesso!');
          }
        } catch (error) {
          showError(
            `Falha ao remover ${type === 'phone' ? 'telefone' : 'email'}. Tente novamente.`,
          );
        }
      },
    });
  };

  const renderModal = () => {
    const renderModalContent = () => {
      if (modalType === 'phone') {
        return (
          <View>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#212529', marginBottom: 8 }}>Telefone</Text>
            <TextInput
              style={{
                borderWidth: 1, borderColor: '#e9ecef', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
                fontSize: 16, backgroundColor: '#f8f9fa'
              }}
              placeholder="Ex: (11) 99999-9999"
              value={formData.phone || ''}
              onChangeText={text =>
                setFormData({ ...formData, phone: formatPhoneValue(text) })
              }
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>
        );
      } else if (modalType === 'email') {
        return (
          <View>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#212529', marginBottom: 8 }}>Email</Text>
            <TextInput
              style={{
                borderWidth: 1, borderColor: '#e9ecef', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
                fontSize: 16, backgroundColor: '#f8f9fa'
              }}
              placeholder="email@exemplo.com"
              value={formData.value || ''}
              onChangeText={text => setFormData({ ...formData, value: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        );
      }
      return null;
    };

    return (
      <AnimatedModal
        visible={showModal}
        onRequestClose={closeModal}
        style={{ justifyContent: 'flex-end' }}>
        <View style={{
          backgroundColor: '#fff',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          maxHeight: '80%',
          width: '100%',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 10,
        }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            paddingVertical: 20,
            borderBottomWidth: 1,
            borderBottomColor: '#F1F5F9',
          }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#0F172A' }}>
              {editingItem ? (modalType === 'phone' ? 'Editar Telefone' : 'Editar Email') : (modalType === 'phone' ? 'Adicionar Telefone' : 'Adicionar Email')}
            </Text>
            <TouchableOpacity onPress={closeModal} style={{
              width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center'
            }}>
              <Icon name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={{ padding: 24 }}>
            {renderModalContent()}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
              <TouchableOpacity
                style={{
                  flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#64748B', alignItems: 'center'
                }}
                onPress={closeModal}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#64748B' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#007bff', alignItems: 'center'
                }}
                onPress={handleSave}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </AnimatedModal>
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
