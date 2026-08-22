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

import AnimatedModal from '@controleonline/ui-common/src/react/components/AnimatedModal';
import FeatherIcon from 'react-native-vector-icons/Feather';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useMessage } from '@controleonline/ui-common/src/react/components/MessageService';

import DocumentAttachments from './DocumentAttachments';
import {
  applyDocumentMask,
  extractId,
  normalizeDocumentFiles,
  removeMask,
  toDocumentItem,
} from './documentsTabHelpers';
import { resolveFileDownloadUrl } from '@controleonline/ui-common/src/react/utils/fileUrl';

import {
  inlineStyle_265_6,
  inlineStyle_266_12,
  inlineStyle_279_14,
  inlineStyle_288_16,
  inlineStyle_291_49,
  inlineStyle_299_10,
  inlineStyle_302_16,
  inlineStyle_303_18,
  inlineStyle_304_18,
  inlineStyle_308_18,
  inlineStyle_314_24,
  inlineStyle_324_16,
  inlineStyle_325_18,
  inlineStyle_327_14,
  inlineStyle_341_16,
  inlineStyle_343_14,
  inlineStyle_350_20,
} from './DocumentsTab.styles';

const DocumentsTab = ({ client, customStyles, isEditing, onUpdateClient }) => {
  const { showError, showSuccess, showDialog } = useMessage();
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

  const resolveTypeLabel = typeIri =>
    items.find(item => item['@id'] === typeIri)?.documentType || String(typeIri || '');

  const applyMask = (value, type) =>
    applyDocumentMask(value, resolveTypeLabel(type));

  const syncClientDocuments = nextDocuments => {
    if (typeof onUpdateClient !== 'function') {
      return;
    }
    const fullDocumentData = nextDocuments.map(documentItem => ({
      '@id': `/documents/${documentItem.id}`,
      id: documentItem.id,
      document: documentItem.value,
      documentType: documentItem.type,
      documentFiles: documentItem.files || [],
      file: documentItem.files?.[0]?.file || null,
    }));
    onUpdateClient({ document: fullDocumentData });
  };

  const updateDocumentFiles = (documentId, nextFiles) => {
    setDocuments(previousDocuments => {
      const nextDocuments = previousDocuments.map(documentItem => {
        if (String(documentItem.id) !== String(documentId)) {
          return documentItem;
        }
        return { ...documentItem, files: nextFiles };
      });
      syncClientDocuments(nextDocuments);
      return nextDocuments;
    });
  };

  useEffect(() => {
    const rawDocuments = Array.isArray(client?.document)
      ? client.document
      : Array.isArray(client?.documents)
        ? client.documents
        : [];
    setDocuments(
      rawDocuments.map(document => {
        const item = toDocumentItem(document);
        item.files = normalizeDocumentFiles(document, resolveFileDownloadUrl);
        return item;
      }),
    );
  }, [client?.id, client?.document, client?.documents]);

  useEffect(() => {
    if (actionsDocumentsType?.getItems) {
      actionsDocumentsType.getItems({ itemsPerPage: 100 });
    }
  }, []);

  const openModal = (item = null) => {
    setEditingItem(item);
    setFormData(
      item
        ? { type: item.type, value: applyMask(String(item.value || ''), item.type) }
        : { type: '', value: '' },
    );
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({});
    Keyboard.dismiss();
  };

  const handleSave = async () => {
    if (!formData.type || !formData.value) {
      showError(global.t?.t('customers', 'error', 'Preencha tipo e número do documento.'));
      return;
    }
    const cleanValue = removeMask(formData.value);
    if (!cleanValue) {
      showError(global.t?.t('customers', 'error', 'Número do documento inválido.'));
      return;
    }

    try {
      const peopleIri = client?.['@id'] || `/people/${extractId(client?.id)}`;
      let documentId = editingItem?.id;
      const previousFiles = editingItem?.files || [];

      if (editingItem?.id) {
        await actionsDocuments.save({
          id: editingItem.id,
          document: cleanValue,
          documentType: formData.type,
          people: peopleIri,
        });
      } else {
        const created = await actionsDocuments.save({
          document: cleanValue,
          documentType: formData.type,
          people: peopleIri,
        });
        documentId = extractId(created?.id || created?.['@id'] || created);
      }

      const documentItem = {
        id: documentId,
        value: cleanValue,
        type: formData.type,
        files: previousFiles,
      };

      const updatedDocuments = editingItem
        ? documents.map(documentValue =>
            String(documentValue.id) === String(editingItem.id) ? documentItem : documentValue,
          )
        : [...documents, documentItem];

      setDocuments(updatedDocuments);
      syncClientDocuments(updatedDocuments);
      showSuccess(
        global.t?.t(
          'customers',
          'success',
          `Documento ${editingItem ? 'atualizado' : 'adicionado'} com sucesso!`,
        ),
      );
      closeModal();
    } catch (error) {
      showError(
        global.t?.t(
          'customers',
          'error',
          `Falha ao ${editingItem ? 'atualizar' : 'adicionar'} documento. Tente novamente.`,
        ),
      );
    }
  };

  const handleDelete = id => {
    showDialog({
      title: global.t?.t('customers', 'label', 'Confirmar exclusão'),
      message: global.t?.t('customers', 'label', 'Deseja realmente remover este item?'),
      confirmLabel: global.t?.t('customers', 'label', 'Remover'),
      cancelLabel: global.t?.t('customers', 'label', 'Cancelar'),
      onConfirm: async () => {
        try {
          await actionsDocuments.remove(id);
          const updatedDocuments = documents.filter(
            documentItem => String(documentItem.id) !== String(id),
          );
          setDocuments(updatedDocuments);
          syncClientDocuments(updatedDocuments);
          showSuccess(global.t?.t('customers', 'success', 'Documento removido com sucesso!'));
        } catch {
          showError(global.t?.t('customers', 'error', 'Falha ao remover documento. Tente novamente.'));
        }
      },
    });
  };

  const getFilteredDocuments = () => documents;

  const renderModal = () => (
    <Modal visible={showModal} transparent animationType="slide" onRequestClose={closeModal}>
      <AnimatedModal style={inlineStyle_265_6}>
        <View style={inlineStyle_266_12}>
          <View style={inlineStyle_279_14}>
            <Text style={inlineStyle_288_16}>
              {editingItem
                ? global.t?.t('customers', 'label', 'Editar documento')
                : global.t?.t('customers', 'label', 'Novo documento')}
            </Text>
            <TouchableOpacity onPress={closeModal} style={inlineStyle_291_49}>
              <Icon name="close" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={inlineStyle_299_10}>
            <View style={inlineStyle_302_16}>
              <Text style={inlineStyle_303_18}>{global.t?.t('customers', 'label', 'Tipo')}</Text>
              <View style={inlineStyle_304_18}>
                {items.map(type => (
                  <TouchableOpacity
                    key={type['@id']}
                    style={inlineStyle_308_18({ formData, type })}
                    onPress={() =>
                      setFormData(previous => ({
                        ...previous,
                        type: type['@id'],
                        value: applyMask(removeMask(previous.value), type['@id']),
                      }))
                    }>
                    <Text style={inlineStyle_314_24({ formData, type })}>{type.documentType}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={inlineStyle_324_16}>
              <Text style={inlineStyle_325_18}>{global.t?.t('customers', 'label', 'Número')}</Text>
              <TextInput
                style={inlineStyle_327_14}
                value={formData.value || ''}
                onChangeText={text =>
                  setFormData(previous => ({
                    ...previous,
                    value: applyMask(text, previous.type),
                  }))
                }
                keyboardType="numeric"
                placeholder={global.t?.t('customers', 'label', 'Digite o número')}
              />
            </View>
            <View style={inlineStyle_341_16}>
              <TouchableOpacity style={inlineStyle_343_14} onPress={closeModal}>
                <Text style={inlineStyle_350_20}>{global.t?.t('customers', 'label', 'Cancelar')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[inlineStyle_343_14, { backgroundColor: '#007bff', borderColor: '#007bff' }]}
                onPress={handleSave}>
                <Text style={[inlineStyle_350_20, { color: '#fff' }]}>
                  {global.t?.t('customers', 'label', 'Salvar')}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </AnimatedModal>
    </Modal>
  );

  const companyId = extractId(currentCompany?.id || currentCompany?.['@id']);

  return (
    <>
      <View style={customStyles.section}>
        <View style={customStyles.card}>
          <View style={customStyles.cardHeader}>
            <Text style={customStyles.cardTitle}>
              {global.t?.t('customers', 'label', 'Documentos')}
            </Text>
            {isEditing && (
              <TouchableOpacity onPress={() => openModal()} style={customStyles.iconButtonPrimary}>
                <Icon name="add" size={20} color={customStyles.iconButtonPrimaryIcon.color} />
              </TouchableOpacity>
            )}
          </View>
          {getFilteredDocuments().length === 0 ? (
            <Text style={customStyles.emptyText}>Nenhum documento cadastrado</Text>
          ) : (
            getFilteredDocuments().map(doc => (
              <View
                key={doc.id}
                style={[customStyles.listItem, customStyles.listItemWithActions, { flexDirection: 'column', alignItems: 'stretch' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={customStyles.itemContent}>
                    <Icon name="description" size={20} color={customStyles.cardItemIcon.color} />
                    <View>
                      <Text style={customStyles.itemText}>
                        {applyMask(String(doc.value || ''), doc.type)}
                      </Text>
                      <Text style={customStyles.itemSubtext}>{resolveTypeLabel(doc.type)}</Text>
                    </View>
                  </View>
                  {isEditing && (
                    <View style={[customStyles.itemActions, customStyles.itemActionsPinned]}>
                      <TouchableOpacity onPress={() => openModal(doc)} style={customStyles.iconButtonGhost}>
                        <FeatherIcon name="edit-2" size={16} color={customStyles.iconButtonGhostIcon.color} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(doc.id)} style={customStyles.iconButtonGhost}>
                        <FeatherIcon name="trash-2" size={16} color={customStyles.iconButtonGhostIcon.color} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                <DocumentAttachments
                  documentItem={doc}
                  isEditing={isEditing}
                  companyId={companyId}
                  onFilesChanged={updateDocumentFiles}
                />
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
