import React, { useState, useEffect } from 'react';
import {
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  View,
  Keyboard,
} from 'react-native';
import AnimatedModal from '@controleonline/ui-crm/src/react/components/AnimatedModal';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useStores } from '@store';
import {useMessage} from '@controleonline/ui-common/src/react/components/MessageService';

const UsersTab = ({ client, customStyles, isEditing, onUpdateClient }) => {
  const {showError, showSuccess, showDialog} = useMessage();
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const usersStore = useStores(state => state.users) || {};
  const actions = usersStore.actions || {};
  useEffect(() => {
    const rawUsers = Array.isArray(client?.user)
      ? client.user.map(u => ({
        id: u.id || u['@id'],
        name: u.username,
        role: u.role || 'Usuário',
      }))
      : [];

    setUsers(rawUsers);
  }, [client]);

  const openModal = (item = null) => {
    setEditingItem(item);
    setFormData(item ? { ...item, username: item.name } : {});
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({});
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleSave = async () => {
    if (!editingItem) {
      if (formData.password !== formData.confirmPassword) {
        showError('As senhas não coincidem.');
        return;
      }

      if (!formData.username || !formData.password) {
        showError('Nome de usuário e senha são obrigatórios.');
        return;
      }

      try {
        const userData = {
          username: formData.username,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          people: client['@id']?.match(/\d+/)?.[0] || client['@id'],
        };

        await actions.createUser(userData);

        const newUser = {
          id: Date.now(),
          name: formData.username,
          role: 'Usuário',
          email: '',
        };
        const updatedUsers = [...users, newUser];
        setUsers(updatedUsers);
        if (onUpdateClient) {
          const fullUserData = updatedUsers.map(u => ({
            id: u.id,
            '@id': u.id,
            username: u.name,
            role: u.role,
          }));
          onUpdateClient('user', fullUserData);
        }

        showSuccess('Usuário criado com sucesso!');
        closeModal();
      } catch (error) {
        showError('Falha ao criar usuário. Tente novamente.');
      }
    } else {
      try {
        if (
          formData.password &&
          formData.password !== formData.confirmPassword
        ) {
          showError('As senhas não coincidem.');
          return;
        }

        if (formData.password) {
          await actions.changePassword({
            id: editingItem.id,
            password: formData.password,
            active: true,
            confirmPassword: formData.confirmPassword,
          });
        }

        const updatedUser = { ...editingItem, ...formData };
        const updatedUsers = users.map(u =>
          u.id === editingItem.id ? updatedUser : u,
        );
        setUsers(updatedUsers);
        if (onUpdateClient) {
          const fullUserData = updatedUsers.map(u => ({
            id: u.id,
            '@id': u.id,
            username: u.name,
            role: u.role,
          }));
          onUpdateClient('user', fullUserData);
        }

        showSuccess('Usuário atualizado com sucesso!');
        closeModal();
      } catch (error) {
        showError('Falha ao atualizar usuário. Tente novamente.');
      }
    }
  };

  const handleDelete = id => {
    showDialog({
      title: 'Confirmar exclusão',
      message: 'Deseja realmente remover este item?',
      confirmLabel: 'Remover',
      cancelLabel: 'Cancelar',
      onConfirm: async () => {
        try {
          await actions.remove(id);
          const updatedUsers = users.filter(u => u.id !== id);
          setUsers(updatedUsers);
          if (onUpdateClient) {
            const fullUserData = updatedUsers.map(u => ({
              id: u.id,
              '@id': u.id,
              username: u.name,
              role: u.role,
            }));
            onUpdateClient('user', fullUserData);
          }
          showSuccess('Usuário removido com sucesso!');
        } catch (error) {
          showError('Falha ao remover usuário. Tente novamente.');
        }
      },
    });
  };

  const renderModal = () => (
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
            {editingItem ? 'Editar Senha do Usuário' : 'Adicionar Usuário'}
          </Text>
          <TouchableOpacity onPress={closeModal} style={{
            width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center'
          }}>
            <Icon name="close" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ padding: 24 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          {editingItem ? (
            <View>
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#212529', marginBottom: 8 }}>Usuário</Text>
                <TextInput
                  style={{
                    borderWidth: 1, borderColor: '#e9ecef', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
                    fontSize: 16, backgroundColor: '#e9ecef', color: '#6c757d'
                  }}
                  value={formData.username}
                  editable={false}
                />
              </View>
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#212529', marginBottom: 8 }}>Nova senha (opcional)</Text>
                <View style={{ position: 'relative', justifyContent: 'center' }}>
                  <TextInput
                    style={{
                      borderWidth: 1, borderColor: '#e9ecef', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
                      paddingRight: 48, fontSize: 16, backgroundColor: '#f8f9fa'
                    }}
                    placeholder="Nova senha (opcional)"
                    value={formData.password}
                    onChangeText={text => setFormData({ ...formData, password: text })}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(prev => !prev)}
                    style={{ position: 'absolute', right: 14, alignSelf: 'stretch', justifyContent: 'center' }}>
                    <Icon
                      name={showPassword ? 'visibility-off' : 'visibility'}
                      size={20}
                      color="#6c757d"
                    />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#212529', marginBottom: 8 }}>Confirmar nova senha</Text>
                <View style={{ position: 'relative', justifyContent: 'center' }}>
                  <TextInput
                    style={{
                      borderWidth: 1, borderColor: '#e9ecef', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
                      paddingRight: 48, fontSize: 16, backgroundColor: '#f8f9fa'
                    }}
                    placeholder="Confirmar nova senha"
                    value={formData.confirmPassword}
                    onChangeText={text => setFormData({ ...formData, confirmPassword: text })}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(prev => !prev)}
                    style={{ position: 'absolute', right: 14, alignSelf: 'stretch', justifyContent: 'center' }}>
                    <Icon
                      name={showConfirmPassword ? 'visibility-off' : 'visibility'}
                      size={20}
                      color="#6c757d"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <View>
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#212529', marginBottom: 8 }}>Usuário</Text>
                <TextInput
                  style={{
                    borderWidth: 1, borderColor: '#e9ecef', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
                    fontSize: 16, backgroundColor: '#f8f9fa'
                  }}
                  placeholder="Nome de usuário"
                  value={formData.username}
                  onChangeText={text => setFormData({ ...formData, username: text })}
                  autoCapitalize="none"
                />
              </View>
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#212529', marginBottom: 8 }}>Senha</Text>
                <View style={{ position: 'relative', justifyContent: 'center' }}>
                  <TextInput
                    style={{
                      borderWidth: 1, borderColor: '#e9ecef', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
                      paddingRight: 48, fontSize: 16, backgroundColor: '#f8f9fa'
                    }}
                    placeholder="Senha"
                    value={formData.password}
                    onChangeText={text => setFormData({ ...formData, password: text })}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(prev => !prev)}
                    style={{ position: 'absolute', right: 14, alignSelf: 'stretch', justifyContent: 'center' }}>
                    <Icon
                      name={showPassword ? 'visibility-off' : 'visibility'}
                      size={20}
                      color="#6c757d"
                    />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#212529', marginBottom: 8 }}>Confirmar Senha</Text>
                <View style={{ position: 'relative', justifyContent: 'center' }}>
                  <TextInput
                    style={{
                      borderWidth: 1, borderColor: '#e9ecef', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
                      paddingRight: 48, fontSize: 16, backgroundColor: '#f8f9fa'
                    }}
                    placeholder="Confirmar senha"
                    value={formData.confirmPassword}
                    onChangeText={text => setFormData({ ...formData, confirmPassword: text })}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(prev => !prev)}
                    style={{ position: 'absolute', right: 14, alignSelf: 'stretch', justifyContent: 'center' }}>
                    <Icon
                      name={showConfirmPassword ? 'visibility-off' : 'visibility'}
                      size={20}
                      color="#6c757d"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              style={{
                flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#64748B', alignItems: 'center'
              }}
              onPress={() => {
                Keyboard.dismiss();
                closeModal();
              }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#64748B' }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#007bff', alignItems: 'center'
              }}
              onPress={() => {
                Keyboard.dismiss();
                handleSave();
              }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </AnimatedModal>
  );
  return (
    <>
      <View style={customStyles.tabContent}>
        <View style={customStyles.section}>
          <View style={customStyles.sectionHeader}>
            <Text style={customStyles.sectionTitle}>Usuários</Text>
            {isEditing && (
              <TouchableOpacity onPress={() => openModal()}>
                <Icon name="add" size={24} color="#007bff" />
              </TouchableOpacity>
            )}
          </View>
          {users.length === 0 ? (
            <Text style={customStyles.emptyText}>
              Nenhum usuário cadastrado
            </Text>
          ) : (
            users.map(user => (
              <View key={user.id} style={customStyles.listItem}>
                <View style={customStyles.itemContent}>
                  <Icon name="person" size={20} color="#666" />
                  <View>
                    <Text style={customStyles.itemText}>
                      {String(user.name || '')}
                    </Text>
                    <Text style={customStyles.itemSubtext}>
                      {String(user.role || '')} • {String(user.email || '')}
                    </Text>
                  </View>
                </View>
                {isEditing && (
                  <View style={customStyles.itemActions}>
                    <TouchableOpacity onPress={() => openModal(user)}>
                      <Icon name="edit" size={20} color="#007bff" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(user.id)}>
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

export default UsersTab;

