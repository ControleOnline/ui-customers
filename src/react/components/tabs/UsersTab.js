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
import {useStores} from '@store';

const UsersTab = ({client, customStyles, isEditing, onUpdateClient}) => {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  const usersStore = useStores(state => state.users);
  const actions = usersStore.actions;
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
    setFormData(item ? {...item, username: item.name} : {});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({});
  };

  const handleSave = async () => {
    if (!editingItem) {
      if (formData.password !== formData.confirmPassword) {
        Alert.alert('Erro', 'As senhas não coincidem.');
        return;
      }

      if (!formData.username || !formData.password) {
        Alert.alert('Erro', 'Nome de usuário e senha são obrigatórios.');
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

        Alert.alert('Sucesso', 'Usuário criado com sucesso!');
        closeModal();
      } catch (error) {
        Alert.alert('Erro', 'Falha ao criar usuário. Tente novamente.');
      }
    } else {
      try {
        if (
          formData.password &&
          formData.password !== formData.confirmPassword
        ) {
          Alert.alert('Erro', 'As senhas não coincidem.');
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

        const updatedUser = {...editingItem, ...formData};
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

        Alert.alert('Sucesso', 'Usuário atualizado com sucesso!');
        closeModal();
      } catch (error) {
        Alert.alert('Erro', 'Falha ao atualizar usuário. Tente novamente.');
      }
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
            Alert.alert('Sucesso', 'Usuário removido com sucesso!');
          } catch (error) {
            Alert.alert('Erro', 'Falha ao remover usuário. Tente novamente.');
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
            {editingItem ? 'Editar Senha do Usuário ' : 'Adicionar Usuário'}
          </Text>
          <TextInput
            editable={editingItem ? false : true}
            style={customStyles.modalInput}
            placeholder="Email do usuário"
            value={formData.username || ''}
            onChangeText={text => setFormData({...formData, username: text})}
            autoCapitalize="none"
          />
          {!editingItem ? (
            <>
              <TextInput
                style={customStyles.modalInput}
                placeholder="Senha"
                value={formData.password || ''}
                onChangeText={text =>
                  setFormData({...formData, password: text})
                }
                secureTextEntry
              />
              <TextInput
                style={customStyles.modalInput}
                placeholder="Confirmar senha"
                value={formData.confirmPassword || ''}
                onChangeText={text =>
                  setFormData({...formData, confirmPassword: text})
                }
                secureTextEntry
              />
            </>
          ) : (
            <>
              <TextInput
                style={customStyles.modalInput}
                placeholder="Nova senha (opcional)"
                value={formData.password || ''}
                onChangeText={text =>
                  setFormData({...formData, password: text})
                }
                secureTextEntry
              />
              <TextInput
                style={customStyles.modalInput}
                placeholder="Confirmar nova senha"
                value={formData.confirmPassword || ''}
                onChangeText={text =>
                  setFormData({...formData, confirmPassword: text})
                }
                secureTextEntry
              />
            </>
          )}
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
