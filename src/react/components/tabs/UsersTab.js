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

const extractId = value => String(value || '').replace(/\D/g, '');

const normalizeUserItem = entry => {
  if (!entry) {
    return null;
  }

  const id = extractId(entry?.id || entry?.['@id'] || entry?.user?.id || entry?.user?.['@id']);
  const username = String(
    entry?.username || entry?.name || entry?.user?.username || '',
  ).trim();
  const apiKey = String(
    entry?.apiKey || entry?.api_key || entry?.user?.apiKey || entry?.user?.api_key || '',
  ).trim();
  const role = String(entry?.role || 'Usuario').trim() || 'Usuario';

  if (!id && !username && !apiKey) {
    return null;
  }

  return {
    id: id || `temp-${Date.now()}`,
    username,
    name: username,
    role,
    apiKey,
  };
};

const mapUsersForClient = users =>
  users.map(user => ({
    id: extractId(user?.id) || user?.id,
    '@id': extractId(user?.id) || user?.id,
    username: user?.username || user?.name || '',
    role: user?.role || 'Usuario',
    apiKey: user?.apiKey || '',
  }));

const formatApiKeyPreview = value => {
  const apiKey = String(value || '').trim();
  if (!apiKey) {
    return 'Chave de API indisponivel';
  }

  if (apiKey.length <= 16) {
    return apiKey;
  }

  return `${apiKey.slice(0, 8)}...${apiKey.slice(-6)}`;
};

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

const inlineStyle_apiKeyButtonRow = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 12,
};

const inlineStyle_apiKeySecondaryButton = {
  flex: 1,
  minWidth: 132,
  paddingVertical: 14,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#64748B',
  alignItems: 'center',
  justifyContent: 'center',
};

const inlineStyle_apiKeySecondaryText = {
  fontSize: 16,
  fontWeight: '600',
  color: '#64748B',
};

const inlineStyle_apiKeyPrimaryButton = {
  flex: 1,
  minWidth: 132,
  paddingVertical: 14,
  borderRadius: 12,
  backgroundColor: colors.primary,
  alignItems: 'center',
  justifyContent: 'center',
};

const inlineStyle_apiKeyPrimaryButtonDisabled = {
  opacity: 0.65,
};

const inlineStyle_apiKeyPrimaryText = {
  fontSize: 16,
  fontWeight: '600',
  color: '#fff',
};

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

  const extractErrorMessage = error => {
    if (Array.isArray(error?.message)) {
      return error.message
        .map(item => item?.message || item)
        .filter(Boolean)
        .join(', ');
    }

    return error?.message || '';
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
                inlineStyle_apiKeyPrimaryButton,
                isRefreshingApiKey && inlineStyle_apiKeyPrimaryButtonDisabled,
              ]}
              onPress={() => handleRefreshApiKey(apiKeyItem)}
              disabled={isRefreshingApiKey}>
              {isRefreshingApiKey ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={inlineStyle_apiKeyPrimaryText}>Nova chave</Text>
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
                      {String(user.username || user.name || '')}
                    </Text>
                    <Text style={customStyles.itemSubtext}>
                      {`${String(user.role || '')} • ${formatApiKeyPreview(user.apiKey)}`}
                    </Text>
                  </View>
                </View>
                {isEditing && (
                  <View style={customStyles.itemActions}>
                    <TouchableOpacity onPress={() => openModal(user)}>
                      <Icon name="edit" size={20} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openApiKeyModal(user)}>
                      <Icon name="visibility" size={20} color={colors.primary} />
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
