import { useStores } from '@store';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  View,
  Keyboard,
} from 'react-native';
import AnimatedModal from '@controleonline/ui-crm/src/react/components/AnimatedModal';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useMessage} from '@controleonline/ui-common/src/react/components/MessageService';

const DocumentsTab = ({ client, customStyles, isEditing, onUpdateClient }) => {
  const {showError, showSuccess, showDialog} = useMessage();
  const [documents, setDocuments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const peopleStore = useStores(state => state.people);
  const peopleGetters = peopleStore.getters;
  const { currentCompany } = peopleGetters;

  const documentsStore = useStores(state => state.documents) || {};
  const actionsDocuments = documentsStore.actions || {};
  const documentsTypesStore = useStores(state => state.documentsTypes) || {};
  const actionsDocumentsType = documentsTypesStore.actions || {};
  const getters = documentsTypesStore.getters || {};
  const { items = [] } = getters;

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
      showError('Documento e tipo são obrigatórios.');
      return;
    }

    if (!editingItem) {
      const existingDoc = documents.find(doc => doc.type === formData.type);
      if (existingDoc) {
        const selectedType = items.find(item => item['@id'] === formData.type);
        showError(`Já existe um documento do tipo ${selectedType?.documentType}.`);
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

      showSuccess(
        `Documento ${editingItem ? 'atualizado' : 'adicionado'} com sucesso!`,
      );
      closeModal();
    } catch (error) {
      showError(
        `Falha ao ${editingItem ? 'atualizar' : 'adicionar'} documento. Tente novamente.`,
      );
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
          showSuccess('Documento removido com sucesso!');
        } catch (error) {
          console.log('Delete error:', error);
          showError('Falha ao remover documento. Tente novamente.');
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
            {editingItem ? 'Editar Documento' : 'Adicionar Documento'}
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
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#212529', marginBottom: 8 }}>Tipo</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {getAvailableDocumentTypes().map(type => (
                <TouchableOpacity
                  key={type.documentType}
                  style={{
                    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1,
                    borderColor: formData.type === type['@id'] ? '#007bff' : '#dee2e6',
                    backgroundColor: formData.type === type['@id'] ? '#e7f3ff' : '#f8f9fa',
                  }}
                  onPress={() => setFormData({ ...formData, type: type['@id'] })}>
                  <Text style={{
                    fontSize: 14, color: formData.type === type['@id'] ? '#007bff' : '#64748B', fontWeight: formData.type === type['@id'] ? '600' : '400'
                  }}>
                    {type.documentType}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#212529', marginBottom: 8 }}>Número do Documento</Text>
            <TextInput
              style={{
                borderWidth: 1, borderColor: '#e9ecef', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
                fontSize: 16, backgroundColor: '#f8f9fa'
              }}
              placeholder="Número do documento"
              value={applyMask(formData.value || '', formData.type)}
              onChangeText={text => {
                const cleanText = removeMask(text);
                setFormData({ ...formData, value: cleanText });
              }}
              keyboardType="numeric"
            />
          </View>

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

