import React, { useState, useEffect } from 'react';

import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  View,
  Keyboard,
} from 'react-native';

import AnimatedModal from '@controleonline/ui-common/src/react/components/AnimatedModal';
import FeatherIcon from 'react-native-vector-icons/Feather';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useStores } from '@store';
import {useMessage} from '@controleonline/ui-common/src/react/components/MessageService';

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
} from './UsersTab.styles';

import {
  extractId,
  normalizeUserItem,
  mapUsersForClient,
  extractErrorMessage,
  formatApiKeyPreview,
  copyTextToClipboard,
  buildCreateUserPayload,
} from './usersTabHelpers';


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

      try {
        const userData = {
          username: formData.username,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          people: extractId(client?.id || client?.['@id']),
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
                <Text style={inlineStyle_225_22}>Nova senha</Text>
                <View style={inlineStyle_226_22}>
                  <TextInput
                    style={inlineStyle_228_20}
                    placeholder="Nova senha"
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
              style={customStyles.saveButton}
              onPress={() => {
                Keyboard.dismiss();
                handleSave();
              }}>
              <FeatherIcon
                name="save"
                size={16}
                color={customStyles.iconButtonPrimaryIcon.color}
              />
              <Text style={customStyles.saveButtonText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </AnimatedModal>
  );

  const renderApiKeyModal = () => (
    <AnimatedModal
      visible={showApiKeyModal}
      onRequestClose={closeApiKeyModal}
      style={inlineStyle_174_6}>
      <View style={inlineStyle_175_12}>
        <View style={inlineStyle_188_14}>
          <Text style={inlineStyle_197_16}>Chave de API</Text>
          <TouchableOpacity onPress={closeApiKeyModal} style={inlineStyle_200_49}>
            <Icon name="close" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={inlineStyle_208_10}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          <View style={inlineStyle_213_20}>
            <Text style={inlineStyle_214_22}>Usuário</Text>
            <TextInput
              style={inlineStyle_216_18}
              value={apiKeyItem?.username || apiKeyItem?.name || ''}
              editable={false}
            />
          </View>

          <View style={inlineStyle_248_20}>
            <Text style={inlineStyle_249_22}>Chave atual</Text>
            <TextInput
              style={inlineStyle_252_20}
              value={apiKeyItem?.apiKey || ''}
              editable={false}
              multiline
            />
          </View>

          <View style={inlineStyle_apiKeyButtonRow}>
            <TouchableOpacity
              style={inlineStyle_apiKeySecondaryButton}
              onPress={handleCopyApiKey}>
              <Text style={inlineStyle_apiKeySecondaryText}>Copiar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={inlineStyle_apiKeySecondaryButton}
              onPress={closeApiKeyModal}>
              <Text style={inlineStyle_apiKeySecondaryText}>Fechar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                customStyles.saveButton,
                isRefreshingApiKey && customStyles.saveButtonDisabled,
              ]}
              onPress={() => handleRefreshApiKey(apiKeyItem)}
              disabled={isRefreshingApiKey}>
              {isRefreshingApiKey ? (
                <ActivityIndicator
                  size="small"
                  color={customStyles.saveButtonText.color}
                />
              ) : (
                <>
                  <FeatherIcon
                    name="plus"
                    size={16}
                    color={customStyles.iconButtonPrimaryIcon.color}
                  />
                  <Text style={customStyles.saveButtonText}>Nova chave</Text>
                </>
              )}
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
      {renderModal()}
      {renderApiKeyModal()}
    </>
  );
};

export default UsersTab;
