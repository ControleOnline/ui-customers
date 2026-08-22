import React, { useState, useEffect } from 'react';

import {
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import FeatherIcon from 'react-native-vector-icons/Feather';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useStores } from '@store';
import {useMessage} from '@controleonline/ui-common/src/react/components/MessageService';


import {
  copyTextToClipboard,
  extractErrorMessage,
  extractId,
  mapUsersForClient,
  normalizeUserItem,
  toPeopleIri,
  toTimezoneIri,
} from './usersTabHelpers';
import UserFormModal from './UserFormModal';
import UserApiKeyModal from './UserApiKeyModal';

const UsersTab = ({ client, customStyles, isEditing, onUpdateClient }) => {
  const {showError, showSuccess, showDialog} = useMessage();
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [apiKeyItem, setApiKeyItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRefreshingApiKey, setIsRefreshingApiKey] = useState(false);

  const usersStore = useStores(state => state.users) || {};
  const actions = usersStore.actions || {};

  useEffect(() => {
    const sourceUsers = Array.isArray(client?.user)
      ? client.user
      : client?.user
        ? [client.user]
        : [];
    const rawUsers = sourceUsers
      .map(normalizeUserItem)
      .filter(Boolean);

    setUsers(rawUsers);
  }, [client]);

  const syncUsers = nextUsers => {
    setUsers(nextUsers);
    onUpdateClient?.('user', mapUsersForClient(nextUsers));
  };

  const openModal = (item = null) => {
    setEditingItem(item);
    setFormData(item ? { ...item, username: item.username || item.name } : {});
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

  const openApiKeyModal = item => {
    setApiKeyItem(item || null);
    setShowApiKeyModal(true);
  };

  const closeApiKeyModal = () => {
    setApiKeyItem(null);
    setShowApiKeyModal(false);
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

      const timezoneIri = toTimezoneIri(formData.timezoneId);
      if (!timezoneIri) {
        showError('Timezone é obrigatório.');
        return;
      }

      try {
        const userData = {
          username: formData.username,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          people: toPeopleIri(client?.id || client?.['@id']),
          timezone: timezoneIri,
        };

        if (!userData.people) {
          showError('Nao foi possivel identificar a pessoa para criar o usuario.');
          return;
        }

        const createdUser = normalizeUserItem(await actions.createUser(userData)) || {
          id: `temp-${Date.now()}`,
          username: formData.username,
          name: formData.username,
          role: 'Usuario',
          apiKey: '',
        };
        const updatedUsers = [...users, createdUser];
        syncUsers(updatedUsers);

        showSuccess('Usuário criado com sucesso!');
        closeModal();
      } catch (error) {
        showError(extractErrorMessage(error) || 'Falha ao criar usuário. Tente novamente.');
      }
    } else {
      try {
        if (!String(formData.password || '').trim()) {
          showError('Nova senha é obrigatória.');
          return;
        }

        if (
          formData.password &&
          formData.password !== formData.confirmPassword
        ) {
          showError('As senhas não coincidem.');
          return;
        }

        if (formData.password) {
          const savedUser = normalizeUserItem(await actions.changePassword({
            id: editingItem.id,
            password: formData.password,
            active: true,
            confirmPassword: formData.confirmPassword,
          }));

          const updatedUser = {
            ...editingItem,
            ...savedUser,
            username: savedUser?.username || editingItem.username,
            name: savedUser?.username || editingItem.name,
            apiKey: savedUser?.apiKey || editingItem.apiKey,
          };
          const updatedUsers = users.map(u =>
            String(u.id) === String(editingItem.id) ? updatedUser : u,
          );
          syncUsers(updatedUsers);
        }

        showSuccess('Senha do usuário atualizada com sucesso!');
        closeModal();
      } catch (error) {
        showError(extractErrorMessage(error) || 'Falha ao atualizar usuário. Tente novamente.');
      }
    }
  };

  const handleCopyApiKey = async () => {
    const currentApiKey = String(apiKeyItem?.apiKey || '').trim();
    if (!currentApiKey) {
      showError('Nenhuma chave de API disponivel para copiar.');
      return;
    }

    try {
      const copied = await copyTextToClipboard(currentApiKey);
      if (!copied) {
        showError('A copia da chave de API esta disponivel apenas no navegador nesta versao.');
        return;
      }

      showSuccess('Chave de API copiada com sucesso!');
    } catch (error) {
      showError(extractErrorMessage(error) || 'Nao foi possivel copiar a chave de API.');
    }
  };

  const handleRefreshApiKey = item => {
    if (!item?.id) {
      showError('Nao foi possivel identificar o usuario para atualizar a chave de API.');
      return;
    }

    showDialog({
      title: 'Gerar nova chave de API',
      message:
        'Ao confirmar, a chave atual deixara de funcionar imediatamente. Deseja continuar?',
      onConfirm: async () => {
        setIsRefreshingApiKey(true);

        try {
          const savedUser = normalizeUserItem(
            await actions.changeApiKey({ id: item.id }),
          );

          if (!savedUser) {
            throw new Error('A nova chave de API nao foi retornada pela API.');
          }

          let nextActiveApiKeyItem = null;
          const updatedUsers = users.map(user => {
            if (String(user.id) !== String(item.id)) {
              return user;
            }

            nextActiveApiKeyItem = {
              ...user,
              ...savedUser,
              username: savedUser.username || user.username,
              name: savedUser.username || user.name,
              apiKey: savedUser.apiKey || user.apiKey,
            };

            return nextActiveApiKeyItem;
          });

          syncUsers(updatedUsers);
          if (nextActiveApiKeyItem) {
            setApiKeyItem(nextActiveApiKeyItem);
          }

          showSuccess('Chave de API atualizada com sucesso!');
        } catch (error) {
          showError(
            extractErrorMessage(error) ||
              'Falha ao atualizar a chave de API. Tente novamente.',
          );
        } finally {
          setIsRefreshingApiKey(false);
        }
      },
    });
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
          syncUsers(updatedUsers);
          showSuccess('Usuário removido com sucesso!');
        } catch (error) {
          showError(extractErrorMessage(error) || 'Falha ao remover usuário. Tente novamente.');
        }
      },
    });
  };

  const renderModals = () => (
    <>
      <UserFormModal
        visible={showModal}
        onClose={closeModal}
        editingItem={editingItem}
        formData={formData}
        setFormData={setFormData}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        showConfirmPassword={showConfirmPassword}
        setShowConfirmPassword={setShowConfirmPassword}
        onSave={handleSave}
      />
      <UserApiKeyModal
        visible={showApiKeyModal}
        onClose={closeApiKeyModal}
        apiKeyItem={apiKeyItem}
        isRefreshingApiKey={isRefreshingApiKey}
        onCopy={handleCopyApiKey}
        onRefresh={handleRefreshApiKey}
      />
    </>
  );

  return (
    <>
      <View style={customStyles.tabContent}>
        <View style={customStyles.section}>
          <View style={customStyles.sectionHeader}>
            <Text style={customStyles.sectionTitle}>Usuários</Text>
            {isEditing && (
              <TouchableOpacity
                onPress={() => openModal()}
                style={customStyles.iconButtonPrimary}>
                <FeatherIcon
                  name="plus"
                  size={16}
                  color={customStyles.iconButtonPrimaryIcon.color}
                />
              </TouchableOpacity>
            )}
          </View>
          {users.length === 0 ? (
            <Text style={customStyles.emptyText}>
              Nenhum usuário cadastrado
            </Text>
          ) : (
            users.map(user => (
              <View
                key={user.id}
                style={[
                  customStyles.listItem,
                  customStyles.listItemWithActions,
                ]}>
                <View style={customStyles.itemContent}>
                  <Icon
                    name="person"
                    size={20}
                    color={customStyles.cardItemIcon.color}
                  />
                  <View>
                    <Text style={customStyles.itemText}>
                      {String(user.username || user.name || '')}
                    </Text>
                    <Text style={customStyles.itemSubtext}>
                      {String(user.role || '')}
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
                      onPress={() => openModal(user)}
                      style={customStyles.iconButtonGhost}>
                      <FeatherIcon
                        name="edit-2"
                        size={16}
                        color={customStyles.iconButtonGhostIcon.color}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => openApiKeyModal(user)}
                      style={customStyles.iconButtonGhost}>
                      <FeatherIcon
                        name="eye"
                        size={16}
                        color={customStyles.iconButtonGhostIcon.color}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(user.id)}
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
      {renderModals()}
    </>
  );
};

export default UsersTab;
