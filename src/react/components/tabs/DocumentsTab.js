import {useStores} from '@store';
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

const DocumentsTab = ({client, customStyles, isEditing, onUpdateClient}) => {
  const [documents, setDocuments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const peopleStore = useStores(state => state.people);
  const peopleGetters = peopleStore.getters;
  const {currentCompany} = peopleGetters;

  const documentsStore = useStores(state => state.documents);
  const actionsDocuments = documentsStore.actions;
  const documentsTypesStore = useStores(state => state.documentsTypes);
  const actionsDocumentsType = documentsTypesStore.actions;
  const getters = documentsTypesStore.getters;
  const {items} = getters;

  // Funções de máscara
  const applyMask = (value, type) => {
    if (!value) {
      return '';
    }
    const numbers = value.replace(/\D/g, '');

    const docTypeItem = items.find(item => item['@id'] === type);
    const docType = docTypeItem?.documentType?.toUpperCase();

    if (docType === 'CPF') {
      // Máscara CPF: 000.000.000-00
      return numbers
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }

    if (docType === 'CNPJ') {
      // Máscara CNPJ: 00.000.000/0000-00
      return numbers
        .slice(0, 14)
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    }

    if (docType === 'RG') {
      // Máscara RG: 00.000.000-0
      return numbers
        .slice(0, 9)
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1})$/, '$1-$2');
    }

    if (docType === 'IE') {
      // Máscara IE: 000.000.000.000 (varia por estado, usando formato genérico)
      return numbers
        .slice(0, 12)
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2');
    }

    if (docType === 'IM') {
      // Máscara IM: 00.000.000-0 (varia por município, usando formato genérico)
      return numbers
        .slice(0, 9)
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1})$/, '$1-$2');
    }

    return value;
  };

  const removeMask = value => {
    return value ? value.replace(/\D/g, '') : '';
  };

  useEffect(() => {
    if (!currentCompany || !client) return;
    const rawDocuments = Array.isArray(client?.document)
      ? client.document.map(d => ({
          id: d.id || d['@id'],
          type:
            typeof d.documentType === 'object'
              ? d.documentType?.['@id'] || d.documentType?.id || 'Documento'
              : d.documentType || 'Documento',
          value: d.document,
        }))
      : [];

    actionsDocumentsType.getItems({
      'company_document.people': currentCompany?.id,
    });
    setDocuments(rawDocuments);
  }, [client, currentCompany]);

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

  const getAvailableDocumentTypes = () => {
    const availableTypes = items.filter(
      type => type.peopleType === client?.peopleType,
    );

    // Se estiver editando, permite o tipo atual + tipos não utilizados
    if (editingItem) {
      return availableTypes.filter(type => {
        const isCurrentType = type['@id'] === editingItem.type;
        const isAlreadyUsed = documents.some(doc => doc.type === type['@id']);
        return isCurrentType || !isAlreadyUsed;
      });
    }

    // Se estiver adicionando, mostra apenas tipos não utilizados
    return availableTypes.filter(type => {
      return !documents.some(doc => doc.type === type['@id']);
    });
  };

  const getFilteredDocuments = () => {
    const isPessoaFisica =
      client?.peopleType === 'F' || client?.peopleType === 'fisica';
    const isPessoaJuridica =
      client?.peopleType === 'J' || client?.peopleType === 'juridica';

    return documents.filter(doc => {
      const docTypeItem = items.find(item => item['@id'] === doc.type);
      const docType = docTypeItem?.documentType?.toUpperCase();

      if (isPessoaFisica) {
        return docType === 'RG' || docType === 'CPF';
      }

      if (isPessoaJuridica) {
        return docType === 'CNPJ' || docType === 'IE' || docType === 'IM';
      }

      return true;
    });
  };
  const handleSave = async () => {
    if (!formData.value || !formData.type) {
      Alert.alert('Erro', 'Documento e tipo são obrigatórios.');
      return;
    }

    if (!editingItem) {
      const existingDoc = documents.find(doc => doc.type === formData.type);
      if (existingDoc) {
        const selectedType = items.find(item => item['@id'] === formData.type);
        Alert.alert(
          'Erro',
          `Já existe um documento do tipo ${selectedType?.documentType}.`,
        );
        return;
      }
    }

    try {
      // Remove a máscara antes de salvar
      const cleanValue = removeMask(formData.value);

      const documentData = {
        document: cleanValue,
        documentType: formData.type,
        people: client['@id'],
      };

      if (editingItem) {
        documentData.id = editingItem.id;
      }

      await actionsDocuments.save(documentData);

      const documentItem = {
        id: editingItem?.id || Date.now(),
        value: cleanValue,
        type: formData.type,
      };

      const updatedDocuments = editingItem
        ? documents.map(d => (d.id === editingItem.id ? documentItem : d))
        : [...documents, documentItem];

      setDocuments(updatedDocuments);
      if (onUpdateClient) {
        const fullDocumentData = updatedDocuments.map(d => ({
          id: d.id,
          '@id': d.id,
          document: d.value,
          documentType: d.type,
        }));
        onUpdateClient('document', fullDocumentData);
      }

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
            const updatedDocuments = documents.filter(d => d.id !== id);
            setDocuments(updatedDocuments);
            if (onUpdateClient) {
              const fullDocumentData = updatedDocuments.map(d => ({
                id: d.id,
                '@id': d.id,
                document: d.value,
                documentType: d.type,
              }));
              onUpdateClient('document', fullDocumentData);
            }
          } catch (error) {
            console.log('Delete error:', error);
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
              {getAvailableDocumentTypes().map(type => (
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
                      formData.type === type['@id'] &&
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
            value={applyMask(formData.value || '', formData.type)}
            onChangeText={text => {
              const cleanText = removeMask(text);
              setFormData({...formData, value: cleanText});
            }}
            keyboardType="numeric"
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
            <Text style={customStyles.sectionTitle} numberOfLines={1}>
              Documentos
            </Text>
            {isEditing && (
              <TouchableOpacity onPress={() => openModal()}>
                <Icon name="add" size={24} color="#007bff" />
              </TouchableOpacity>
            )}
          </View>
          {getFilteredDocuments().length === 0 ? (
            <Text style={customStyles.emptyText}>
              Nenhum documento cadastrado
            </Text>
          ) : (
            getFilteredDocuments().map(doc => (
              <View key={doc.id} style={customStyles.listItem}>
                <View style={customStyles.itemContent}>
                  <Icon name="description" size={20} color="#666" />
                  <View>
                    <Text style={customStyles.itemText}>
                      {applyMask(String(doc.value || ''), doc.type)}
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
