import {getStore} from '@store';
import React, {useEffect, useState} from 'react';
import {
  Alert,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const DocumentsTab = ({client, customStyles, isEditing}) => {
  const [documents, setDocuments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  const {actions: actionsDocuments} = getStore('documents');
  const {actions: actionsDocumentsType, getters} = getStore('documentsTypes');
  const {items} = getters;

  useEffect(() => {
    const rawDocuments = Array.isArray(client?.document)
      ? client.document.map(d => ({
          id: d.id || d['@id'],
          type:
            typeof d.documentType === 'object'
              ? d.documentType?.name || 'Documento'
              : d.documentType || 'Documento',
          value: d.document,
        }))
      : [];

    actionsDocumentsType.getItems();
    setDocuments(rawDocuments);
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
    if (!formData.value || !formData.type) {
      Alert.alert('Erro', 'Documento e tipo são obrigatórios.');
      return;
    }

    try {
      const documentData = {
        document: formData.value,
        documentType: formData.type,
        people: client['@id'],
      };

      if (editingItem) {
        documentData.id = editingItem.id;
      }

      await actionsDocuments.save(documentData);

      const documentItem = {
        id: editingItem?.id || Date.now(),
        value: formData.value,
        type: formData.type,
      };

      if (editingItem) {
        setDocuments(
          documents.map(d => (d.id === editingItem.id ? documentItem : d)),
        );
      } else {
        setDocuments([...documents, documentItem]);
      }

      Alert.alert(
        'Sucesso',
        `Documento ${editingItem ? 'atualizado' : 'adicionado'} com sucesso!`,
      );
      closeModal();
    } catch (error) {
      Alert.alert(
        'Erro',
        `Falha ao ${
          editingItem ? 'atualizar' : 'adicionar'
        } documento. Tente novamente.`,
      );
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
            await actionsDocuments.remove(id);
            setDocuments(documents.filter(d => d.id !== id));
            Alert.alert('Sucesso', 'Documento removido com sucesso!');
          } catch (error) {
            Alert.alert('Erro', 'Falha ao remover documento. Tente novamente.');
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
            {editingItem ? 'Editar Documento' : 'Adicionar Documento'}
          </Text>
          <View style={customStyles.pickerContainer}>
            <Text style={customStyles.label}>Tipo:</Text>
            <View style={customStyles.pickerButtons}>
              {items.map(type => (
                <TouchableOpacity
                  key={type.documentType}
                  style={[
                    customStyles.pickerButton,
                    formData.type === type['@id'] &&
                      customStyles.pickerButtonActive,
                  ]}
                  onPress={() => setFormData({...formData, type: type['@id']})}>
                  <Text
                    style={[
                      customStyles.pickerButtonText,
                      formData.type === type &&
                        customStyles.pickerButtonTextActive,
                    ]}>
                    {type.documentType}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <TextInput
            style={customStyles.modalInput}
            placeholder="Número do documento"
            value={formData.value || ''}
            onChangeText={text => setFormData({...formData, value: text})}
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
            <Text style={customStyles.sectionTitle}>Documentos</Text>
            {isEditing && (
              <TouchableOpacity onPress={() => openModal()}>
                <Icon name="add" size={24} color="#007bff" />
              </TouchableOpacity>
            )}
          </View>
          {documents.length === 0 ? (
            <Text style={customStyles.emptyText}>
              Nenhum documento cadastrado
            </Text>
          ) : (
            documents.map(doc => (
              <View key={doc.id} style={customStyles.listItem}>
                <View style={customStyles.itemContent}>
                  <Icon name="description" size={20} color="#666" />
                  <View>
                    <Text style={customStyles.itemText}>
                      {String(doc.value || '')}
                    </Text>
                    <Text style={customStyles.itemSubtext}>
                      {items.find(i => i['@id'] === doc.type)?.documentType ||
                        String(doc.type || '')}
                    </Text>
                  </View>
                </View>
                {isEditing && (
                  <View style={customStyles.itemActions}>
                    <TouchableOpacity onPress={() => openModal(doc)}>
                      <Icon name="edit" size={20} color="#007bff" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(doc.id)}>
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

export default DocumentsTab;
