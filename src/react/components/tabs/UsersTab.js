import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  Keyboard,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
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
  inlineStyle_364_18,
  inlineStyle_365_20,
  inlineStyle_366_18,
  inlineStyle_367_16,
  inlineStyle_368_12,
  inlineStyle_369_16,
  inlineStyle_370_20,
} from './UsersTab.styles';

const userManagementUtils = require('../../utils/userManagement');

const {
  buildClientUsersPayload,
  extractItems,
  getUserSubtitle,
  normalizeUser,
  resolvePeopleReference,
} = userManagementUtils;

const copyTextToClipboard = async text => {
  const normalizedText = String(text ?? '').trim();
  if (!normalizedText) {
    return false;
  }

  if (
    typeof navigator !== 'undefined' &&
    navigator?.clipboard &&
    typeof navigator.clipboard.writeText === 'function'
  ) {
    await navigator.clipboard.writeText(normalizedText);
    return true;
  }

  return false;
};

const extractErrorMessage = error => {
  if (Array.isArray(error?.message)) {
    return error.message
      .map(item => item?.message || item)
      .filter(Boolean)
      .join(', ');
  }

  return String(error?.message || '').trim();
};

const UsersTab = ({ client, customStyles, isEditing, onUpdateClient }) => {
  const {showError, showSuccess, showDialog} = useMessage();
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
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
  const peopleReference = useMemo(() => resolvePeopleReference(client), [client]);

  const syncParentUsers = useCallback(nextUsers => {
    if (!onUpdateClient) {
      return;
    }

    onUpdateClient('user', buildClientUsersPayload(nextUsers));
  }, [onUpdateClient]);

  const loadUsers = useCallback(async () => {
    const sourceUsers = Array.isArray(client?.user)
      ? client.user
      : client?.user
        ? [client.user]
        : [];
    const fallbackUsers = sourceUsers.map(normalizeUser).filter(Boolean);

    if (!peopleReference || !actions?.getItems) {
      setUsers(fallbackUsers);
      return;
    }

    setIsLoadingUsers(true);
    try {
      const response = await actions.getItems({ people: peopleReference });
      const loadedUsers = extractItems(response).map(normalizeUser).filter(Boolean);
      setUsers(loadedUsers);
      syncParentUsers(loadedUsers);
    } catch (error) {
      setUsers(fallbackUsers);
      showError(
        extractErrorMessage(error) ||
          'Nao foi possivel carregar os usuarios vinculados.',
      );
    } finally {
      setIsLoadingUsers(false);
    }
  }, [actions, client, peopleReference, showError, syncParentUsers]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const openModal = (item = null) => {
    setEditingItem(item);
    setFormData(item ? { ...item, username: item.username } : {});
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

  const openApiKeyDetails = item => {
    setApiKeyItem(item || null);
    setShowApiKeyModal(true);
  };

  const closeApiKeyDetails = () => {
    setShowApiKeyModal(false);
    setApiKeyItem(null);
    setIsRefreshingApiKey(false);
  };

  const handleSave = async () => {
    const username = String(formData.username || '').trim();
    const password = String(formData.password || '');
    const confirmPassword = String(formData.confirmPassword || '');

    if (!editingItem) {
      if (password !== confirmPassword) {
        showError('As senhas nao coincidem.');
        return;
      }

      if (!username || !password) {
        showError('Nome de usuario e senha sao obrigatorios.');
        return;
      }

      if (!peopleReference) {
        showError('Nao foi possivel identificar a pessoa para criar o usuario.');
        return;
      }

      try {
        const createdUser = normalizeUser(await actions.createUser({
          username,
          password,
          confirmPassword,
          people: peopleReference,
        }));
        const updatedUsers = [...users, createdUser];
        setUsers(updatedUsers);
        syncParentUsers(updatedUsers);
        showSuccess('Usuario criado com sucesso.');
        closeModal();
        loadUsers();
      } catch (error) {
        showError(
          extractErrorMessage(error) || 'Falha ao criar usuario. Tente novamente.',
        );
      }
      return;
    }

    if (!password.trim()) {
      showError('Nova senha e obrigatoria.');
      return;
    }

    if (password !== confirmPassword) {
      showError('As senhas nao coincidem.');
      return;
    }

    try {
      const response = await actions.changePassword({
        id: editingItem.id,
        password,
        active: true,
        confirmPassword,
      });

      const normalizedResponse = response ? normalizeUser(response) : null;
      const updatedUsers = users.map(user => {
        if (String(user.id) !== String(editingItem.id)) {
          return user;
        }

        return {
          ...user,
          ...(normalizedResponse || {}),
          id: user.id,
          username: normalizedResponse?.username || user.username,
          email: normalizedResponse?.email || user.email,
          apiKey: normalizedResponse?.apiKey || user.apiKey,
          permissions: normalizedResponse?.permissions || user.permissions,
          permissionSummary:
            normalizedResponse?.permissionSummary || user.permissionSummary,
          raw: {
            ...(user.raw || {}),
            ...(normalizedResponse?.raw || {}),
          },
        };
      });

      setUsers(updatedUsers);
      syncParentUsers(updatedUsers);
      showSuccess('Senha atualizada com sucesso.');
      closeModal();
    } catch (error) {
      showError(
        extractErrorMessage(error) ||
          'Falha ao atualizar usuario. Tente novamente.',
      );
    }
  };

  const copyApiKey = async () => {
    const apiKey = String(apiKeyItem?.apiKey || '').trim();
    if (!apiKey) {
      showError('Nenhuma chave de API disponivel para copiar.');
      return;
    }

    try {
      const copied = await copyTextToClipboard(apiKey);
      if (!copied) {
        showError('A copia da chave de API esta disponivel apenas no navegador.');
        return;
      }

      showSuccess('Chave de API copiada com sucesso.');
    } catch (error) {
      showError(
        extractErrorMessage(error) || 'Nao foi possivel copiar a chave de API.',
      );
    }
  };

  const refreshApiKey = () => {
    if (!apiKeyItem?.id) {
      showError('Nao foi possivel identificar o usuario.');
      return;
    }

    showDialog({
      title: 'Gerar nova chave de API',
      message:
        'Ao confirmar, a chave atual deixara de funcionar imediatamente. Deseja continuar?',
      onConfirm: async () => {
        setIsRefreshingApiKey(true);

        try {
          const response = await actions.changeApiKey({ id: apiKeyItem.id });
          const refreshedUser = normalizeUser({ ...(apiKeyItem.raw || {}), ...response });
          const updatedUsers = users.map(user => (
            String(user.id) === String(apiKeyItem.id) ? refreshedUser : user
          ));

          setUsers(updatedUsers);
          setApiKeyItem(refreshedUser);
          syncParentUsers(updatedUsers);
          showSuccess('Chave de API atualizada com sucesso.');
        } catch (error) {
          showError(
            extractErrorMessage(error) ||
              'Nao foi possivel atualizar a chave de API.',
          );
        } finally {
          setIsRefreshingApiKey(false);
        }
      },
    });
  };

  const handleDelete = id => {
    showDialog({
      title: 'Confirmar exclusao',
      message: 'Deseja realmente remover este usuario?',
      confirmLabel: 'Remover',
      cancelLabel: 'Cancelar',
      onConfirm: async () => {
        try {
          await actions.remove(id);
          const updatedUsers = users.filter(user => String(user.id) !== String(id));
          setUsers(updatedUsers);
          syncParentUsers(updatedUsers);
          showSuccess('Usuario removido com sucesso.');
        } catch (error) {
          showError(
            extractErrorMessage(error) ||
              'Falha ao remover usuario. Tente novamente.',
          );
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
        <View style={inlineStyle_188_14}>
          <Text style={inlineStyle_197_16}>
            {editingItem ? 'Editar senha do usuario' : 'Adicionar usuario'}
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
                <Text style={inlineStyle_214_22}>Usuario</Text>
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
                <Text style={inlineStyle_276_22}>Usuario</Text>
                <TextInput
                  style={inlineStyle_278_18}
                  placeholder="Nome de usuario"
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
                <Text style={inlineStyle_313_22}>Confirmar senha</Text>
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

  const renderApiKeyModal = () => (
    <AnimatedModal
      visible={showApiKeyModal}
      onRequestClose={closeApiKeyDetails}
      style={inlineStyle_174_6}>
      <View style={inlineStyle_175_12}>
        <View style={inlineStyle_188_14}>
          <Text style={inlineStyle_197_16}>Chave de API</Text>
          <TouchableOpacity onPress={closeApiKeyDetails} style={inlineStyle_200_49}>
            <Icon name="close" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        <ScrollView style={inlineStyle_208_10} keyboardShouldPersistTaps="handled">
          <View style={inlineStyle_364_18}>
            <Text style={inlineStyle_214_22}>Usuario</Text>
            <Text style={inlineStyle_365_20}>
              {String(apiKeyItem?.username || '-')}
            </Text>
          </View>

          <View style={inlineStyle_366_18}>
            <Text style={inlineStyle_214_22}>Chave atual</Text>
            <TextInput
              style={inlineStyle_367_16}
              editable={false}
              multiline
              value={String(apiKeyItem?.apiKey || '')}
              placeholder="Nenhuma chave de API disponivel"
            />
            <Text style={inlineStyle_368_12}>
              Ao atualizar a chave, integracoes que dependem dela precisam ser reconfiguradas.
            </Text>
          </View>

          <View style={inlineStyle_339_16}>
            <TouchableOpacity style={inlineStyle_341_14} onPress={copyApiKey}>
              <Text style={inlineStyle_348_20}>Copiar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={inlineStyle_370_20}
              onPress={refreshApiKey}
              disabled={isRefreshingApiKey}>
              {isRefreshingApiKey ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={inlineStyle_358_20}>Atualizar chave</Text>
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
            <Text style={customStyles.sectionTitle}>Usuarios</Text>
            {isEditing && (
              <TouchableOpacity onPress={() => openModal()}>
                <Icon name="add" size={24} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
          {isLoadingUsers ? (
            <View style={inlineStyle_369_16}>
              <ActivityIndicator color={colors.primary} />
              <Text style={customStyles.emptyText}>Carregando usuarios...</Text>
            </View>
          ) : users.length === 0 ? (
            <Text style={customStyles.emptyText}>
              Nenhum usuario cadastrado.
            </Text>
          ) : (
            users.map(user => (
              <View key={user.id} style={customStyles.listItem}>
                <View style={customStyles.itemContent}>
                  <Icon name="person" size={20} color={colors.primary} />
                  <View>
                    <Text style={customStyles.itemText}>
                      {String(user.username || '')}
                    </Text>
                    {getUserSubtitle(user) ? (
                      <Text style={customStyles.itemSubtext}>
                        {getUserSubtitle(user)}
                      </Text>
                    ) : null}
                  </View>
                </View>
                {isEditing && (
                  <View style={customStyles.itemActions}>
                    <TouchableOpacity onPress={() => openApiKeyDetails(user)}>
                      <Icon name="vpn-key" size={20} color={colors.primary} />
                    </TouchableOpacity>
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
      {renderApiKeyModal()}
    </>
  );
};

export default UsersTab;
