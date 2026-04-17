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
import { colors } from '@controleonline/../../src/styles/colors';

import {
  inlineStyle_174_6,
  inlineStyle_175_12,
  inlineStyle_188_14,
  inlineStyle_197_16,
  inlineStyle_200_49,
  inlineStyle_208_10,
  inlineStyle_213_20,
  inlineStyle_214_22,
  inlineStyle_216_18,
  inlineStyle_224_20,
  inlineStyle_225_22,
  inlineStyle_226_22,
  inlineStyle_228_20,
  inlineStyle_239_20,
  inlineStyle_248_20,
  inlineStyle_249_22,
  inlineStyle_250_22,
  inlineStyle_252_20,
  inlineStyle_263_20,
  inlineStyle_275_20,
  inlineStyle_276_22,
  inlineStyle_278_18,
  inlineStyle_288_20,
  inlineStyle_289_22,
  inlineStyle_290_22,
  inlineStyle_292_20,
  inlineStyle_303_20,
  inlineStyle_312_20,
  inlineStyle_313_22,
  inlineStyle_314_22,
  inlineStyle_316_20,
  inlineStyle_327_20,
  inlineStyle_339_16,
  inlineStyle_341_14,
  inlineStyle_348_20,
  inlineStyle_351_14,
  inlineStyle_358_20,
} from './UsersTab.styles';

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
      style={inlineStyle_174_6}>
      <View style={inlineStyle_175_12}>
        {/* Header */}
        <View style={inlineStyle_188_14}>
          <Text style={inlineStyle_197_16}>
            {editingItem ? 'Editar Senha do Usuário' : 'Adicionar Usuário'}
          </Text>
          <TouchableOpacity onPress={closeModal} style={inlineStyle_200_49}>
            <Icon name="close" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={inlineStyle_208_10}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          {editingItem ? (
            <View>
              <View style={inlineStyle_213_20}>
                <Text style={inlineStyle_214_22}>Usuário</Text>
                <TextInput
                  style={inlineStyle_216_18}
                  value={formData.username}
                  editable={false}
                />
              </View>
              <View style={inlineStyle_224_20}>
                <Text style={inlineStyle_225_22}>Nova senha (opcional)</Text>
                <View style={inlineStyle_226_22}>
                  <TextInput
                    style={inlineStyle_228_20}
                    placeholder="Nova senha (opcional)"
                    value={formData.password}
                    onChangeText={text => setFormData({ ...formData, password: text })}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(prev => !prev)}
                    style={inlineStyle_239_20}>
                    <Icon
                      name={showPassword ? 'visibility-off' : 'visibility'}
                      size={20}
                      color="#6c757d"
                    />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={inlineStyle_248_20}>
                <Text style={inlineStyle_249_22}>Confirmar nova senha</Text>
                <View style={inlineStyle_250_22}>
                  <TextInput
                    style={inlineStyle_252_20}
                    placeholder="Confirmar nova senha"
                    value={formData.confirmPassword}
                    onChangeText={text => setFormData({ ...formData, confirmPassword: text })}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(prev => !prev)}
                    style={inlineStyle_263_20}>
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
              <View style={inlineStyle_275_20}>
                <Text style={inlineStyle_276_22}>Usuário</Text>
                <TextInput
                  style={inlineStyle_278_18}
                  placeholder="Nome de usuário"
                  value={formData.username}
                  onChangeText={text => setFormData({ ...formData, username: text })}
                  autoCapitalize="none"
                />
              </View>
              <View style={inlineStyle_288_20}>
                <Text style={inlineStyle_289_22}>Senha</Text>
                <View style={inlineStyle_290_22}>
                  <TextInput
                    style={inlineStyle_292_20}
                    placeholder="Senha"
                    value={formData.password}
                    onChangeText={text => setFormData({ ...formData, password: text })}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(prev => !prev)}
                    style={inlineStyle_303_20}>
                    <Icon
                      name={showPassword ? 'visibility-off' : 'visibility'}
                      size={20}
                      color="#6c757d"
                    />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={inlineStyle_312_20}>
                <Text style={inlineStyle_313_22}>Confirmar Senha</Text>
                <View style={inlineStyle_314_22}>
                  <TextInput
                    style={inlineStyle_316_20}
                    placeholder="Confirmar senha"
                    value={formData.confirmPassword}
                    onChangeText={text => setFormData({ ...formData, confirmPassword: text })}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(prev => !prev)}
                    style={inlineStyle_327_20}>
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

          <View style={inlineStyle_339_16}>
            <TouchableOpacity
              style={inlineStyle_341_14}
              onPress={() => {
                Keyboard.dismiss();
                closeModal();
              }}>
              <Text style={inlineStyle_348_20}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={inlineStyle_351_14}
              onPress={() => {
                Keyboard.dismiss();
                handleSave();
              }}>
              <Text style={inlineStyle_358_20}>Salvar</Text>
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
                <Icon name="add" size={24} color={colors.primary} />
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
                  <Icon name="person" size={20} color={colors.primary} />
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
                      <Icon name="edit" size={20} color={colors.primary} />
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

