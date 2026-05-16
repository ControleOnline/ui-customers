import { useStores } from '@store';
import React, { useEffect, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  Image,
  Keyboard,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Share,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import AnimatedModal from '@controleonline/ui-crm/src/react/components/AnimatedModal';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useMessage } from '@controleonline/ui-common/src/react/components/MessageService';
import { resolveFileDownloadUrl, resolveFileImageUrl } from '@controleonline/ui-common/src/react/utils/fileUrl';
import { colors } from '@controleonline/../../src/styles/colors';
import { env as APP_ENV } from '@env';

import {
  attachmentActionButtonStyle,
  attachmentActionLabelStyle,
  attachmentActionsStyle,
  attachmentCardStyle,
  attachmentHeaderStyle,
  attachmentListStyle,
  attachmentMetaStyle,
  attachmentNameStyle,
  attachmentSubtextStyle,
  emptyAttachmentTextStyle,
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
  inlineStyle_353_14,
  inlineStyle_360_20,
  previewBackdropStyle,
  previewCardStyle,
  previewContentStyle,
  previewFallbackStyle,
  previewFallbackTextStyle,
  previewHeaderStyle,
  previewImageStyle,
  previewTitleStyle,
  uploadButtonLabelStyle,
  uploadButtonStyle,
} from './DocumentsTab.styles';

const IMAGE_FILE_PATTERN = /\.(?:avif|bmp|gif|ico|jpe?g|png|svg|webp)(?:\?|$)/i;
const PDF_FILE_PATTERN = /\.pdf(?:\?|$)/i;

const extractId = value => {
  const normalized = String(value || '').replace(/\D/g, '');
  return normalized || '';
};

const normalizeText = value => String(value || '').trim();

const unwrapUploadFile = payload => {
  const data = payload?.response?.data ?? payload?.data ?? payload;

  if (!data) {
    return null;
  }

  if (data?.file) {
    return data.file;
  }

  if (Array.isArray(data)) {
    return data[0] || null;
  }

  if (Array.isArray(data?.member)) {
    return data.member[0] || null;
  }

  if (Array.isArray(data?.['hydra:member'])) {
    return data['hydra:member'][0] || null;
  }

  if (Array.isArray(data?.files)) {
    return data.files[0] || null;
  }

  return data;
};

const getSessionData = () => {
  if (typeof localStorage === 'undefined') {
    return {};
  }

  try {
    return JSON.parse(localStorage.getItem('session') || '{}');
  } catch {
    return {};
  }
};

const isImageFile = url => IMAGE_FILE_PATTERN.test(String(url || ''));
const isPdfFile = url => PDF_FILE_PATTERN.test(String(url || ''));

const normalizeAttachment = attachment => {
  if (!attachment) {
    return null;
  }

  const sourceFile = attachment.file || attachment;
  const downloadUrl = resolveFileDownloadUrl(sourceFile);
  const fileId = extractId(sourceFile?.id || sourceFile?.['@id'] || sourceFile?.file_id || sourceFile?.fileId || downloadUrl);
  const name =
    normalizeText(sourceFile?.title) ||
    normalizeText(sourceFile?.name) ||
    normalizeText(sourceFile?.filename) ||
    normalizeText(sourceFile?.originalName) ||
    `Arquivo ${fileId || ''}`.trim();

  return {
    id: attachment.id || attachment['@id'] || (fileId ? `legacy-${fileId}` : ''),
    file: sourceFile,
    fileId,
    name,
    url: downloadUrl,
    legacy: !attachment.id && !attachment['@id'],
  };
};

const normalizeDocumentFiles = document => {
  const linkedFiles = Array.isArray(document?.documentFiles)
    ? document.documentFiles.map(normalizeAttachment).filter(Boolean)
    : [];

  if (linkedFiles.length > 0) {
    return linkedFiles;
  }

  const legacyFile = normalizeAttachment(document?.file);
  return legacyFile ? [legacyFile] : [];
};

const toDocumentItem = document => ({
  id: document.id || document['@id'],
  type:
    typeof document.documentType === 'object'
      ? document.documentType?.['@id'] || document.documentType?.id || 'Documento'
      : document.documentType || 'Documento',
  value: document.document,
  files: normalizeDocumentFiles(document),
});

const toDocumentIri = documentId => {
  const normalizedId = extractId(documentId);
  return normalizedId ? `/documents/${normalizedId}` : '';
};

const toFileIri = fileValue => {
  if (typeof fileValue === 'string' && fileValue.includes('/files/')) {
    return fileValue;
  }

  const normalizedId = extractId(fileValue?.id || fileValue?.['@id'] || fileValue);
  return normalizedId ? `/files/${normalizedId}` : '';
};

const DocumentsTab = ({ client, customStyles, isEditing, onUpdateClient }) => {
  const { showError, showSuccess, showDialog } = useMessage();
  const [documents, setDocuments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [uploadingDocumentId, setUploadingDocumentId] = useState('');
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const peopleStore = useStores(state => state.people);
  const peopleGetters = peopleStore.getters;
  const { currentCompany } = peopleGetters;

  const documentsStore = useStores(state => state.documents) || {};
  const actionsDocuments = documentsStore.actions || {};
  const documentFileStore = useStores(state => state.document_file) || {};
  const actionsDocumentFile = documentFileStore.actions || {};
  const documentsTypesStore = useStores(state => state.documentsTypes) || {};
  const actionsDocumentsType = documentsTypesStore.actions || {};
  const getters = documentsTypesStore.getters || {};
  const { items = [] } = getters;

  const activePreviewUrl = previewAttachment?.url || '';
  const canPreviewImage = isImageFile(activePreviewUrl);
  const canPreviewPdf = isPdfFile(activePreviewUrl);

  const syncClientDocuments = nextDocuments => {
    if (!onUpdateClient) {
      return;
    }

    const fullDocumentData = nextDocuments.map(documentItem => ({
      id: documentItem.id,
      '@id': documentItem.id,
      document: documentItem.value,
      documentType: documentItem.type,
      documentFiles: documentItem.files
        .filter(file => !file.legacy && file.id)
        .map(file => ({
          id: file.id,
          '@id': file.id,
          file: file.file,
        })),
      file: documentItem.files.find(file => file.legacy)?.file || null,
    }));

    onUpdateClient('document', fullDocumentData);
  };

  const updateDocumentFiles = (documentId, nextFiles) => {
    setDocuments(previousDocuments => {
      const nextDocuments = previousDocuments.map(documentItem => {
        if (String(documentItem.id) !== String(documentId)) {
          return documentItem;
        }

        return {
          ...documentItem,
          files: nextFiles,
        };
      });

      syncClientDocuments(nextDocuments);
      return nextDocuments;
    });
  };

  const applyMask = (value, type) => {
    if (!value) {
      return '';
    }
    const numbers = String(value).replace(/\D/g, '');

    const docTypeItem = items.find(item => item['@id'] === type);
    const docType = docTypeItem?.documentType?.toUpperCase();

    if (docType === 'CPF') {
      return numbers
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }

    if (docType === 'CNPJ') {
      return numbers
        .slice(0, 14)
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    }

    if (docType === 'RG') {
      return numbers
        .slice(0, 9)
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1})$/, '$1-$2');
    }

    if (docType === 'IE') {
      return numbers
        .slice(0, 12)
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2');
    }

    if (docType === 'IM') {
      return numbers
        .slice(0, 9)
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1})$/, '$1-$2');
    }

    return String(value);
  };

  const removeMask = value => {
    return value ? String(value).replace(/\D/g, '') : '';
  };

  useEffect(() => {
    if (!currentCompany || !client) {
      return;
    }

    const rawDocuments = Array.isArray(client?.document)
      ? client.document.map(toDocumentItem)
      : [];

    actionsDocumentsType.getItems({
      'company_document.people': currentCompany?.id,
    });
    setDocuments(rawDocuments);
  }, [actionsDocumentsType, client, currentCompany]);

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
    const availableTypes = items.filter(type => type.peopleType === client?.peopleType);

    if (editingItem) {
      return availableTypes.filter(type => {
        const isCurrentType = type['@id'] === editingItem.type;
        const isAlreadyUsed = documents.some(documentItem => documentItem.type === type['@id']);
        return isCurrentType || !isAlreadyUsed;
      });
    }

    return availableTypes.filter(type => !documents.some(documentItem => documentItem.type === type['@id']));
  };

  const getFilteredDocuments = () => {
    const isPessoaFisica = client?.peopleType === 'F' || client?.peopleType === 'fisica';
    const isPessoaJuridica = client?.peopleType === 'J' || client?.peopleType === 'juridica';

    return documents.filter(documentItem => {
      const docTypeItem = items.find(item => item['@id'] === documentItem.type);
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
      showError(global.t?.t('customers', 'error', 'Documento e tipo são obrigatórios.'));
      return;
    }

    if (!editingItem) {
      const existingDoc = documents.find(documentItem => documentItem.type === formData.type);
      if (existingDoc) {
        const selectedType = items.find(item => item['@id'] === formData.type);
        showError(global.t?.t('customers', 'error', `Já existe um documento do tipo ${selectedType?.documentType}.`));
        return;
      }
    }

    try {
      const cleanValue = removeMask(formData.value);
      const documentData = {
        document: cleanValue,
        documentType: formData.type,
        people: client['@id'],
      };

      if (editingItem) {
        documentData.id = editingItem.id;
      }

      const savedDocument = await actionsDocuments.save(documentData);
      const documentId = savedDocument?.id || savedDocument?.['@id'] || editingItem?.id || Date.now();
      const previousFiles = editingItem?.files || [];
      const documentItem = {
        id: documentId,
        value: cleanValue,
        type: formData.type,
        files: previousFiles,
      };

      const updatedDocuments = editingItem
        ? documents.map(documentValue => (documentValue.id === editingItem.id ? documentItem : documentValue))
        : [...documents, documentItem];

      setDocuments(updatedDocuments);
      syncClientDocuments(updatedDocuments);

      showSuccess(global.t?.t('customers', 'success', `Documento ${editingItem ? 'atualizado' : 'adicionado'} com sucesso!`));
      closeModal();
    } catch (error) {
      showError(global.t?.t('customers', 'error', `Falha ao ${editingItem ? 'atualizar' : 'adicionar'} documento. Tente novamente.`));
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
          const updatedDocuments = documents.filter(documentItem => documentItem.id !== id);
          setDocuments(updatedDocuments);
          syncClientDocuments(updatedDocuments);
          showSuccess(global.t?.t('customers', 'success', 'Documento removido com sucesso!'));
        } catch {
          showError(global.t?.t('customers', 'error', 'Falha ao remover documento. Tente novamente.'));
        }
      },
    });
  };

  const uploadDocumentAttachment = async (documentItem, file) => {
    const session = getSessionData();
    const token = session?.api_key || session?.token;
    if (!token) {
      throw new Error(global.t?.t('customers', 'error', 'Sessão inválida para enviar arquivo.'));
    }

    const formDataPayload = new FormData();
    formDataPayload.append('file', file);
    formDataPayload.append('context', 'document');

    const peopleId = extractId(client?.id || client?.['@id']);
    const companyId = extractId(currentCompany?.id || session?.mycompany);
    if (peopleId) {
      formDataPayload.append('id', peopleId);
    }
    if (companyId) {
      formDataPayload.append('people', companyId);
    }

    const apiEntryPoint = String(APP_ENV?.API_ENTRYPOINT || '').replace(/\/$/, '');
    const appDomain = APP_ENV?.DOMAIN || (typeof window !== 'undefined' ? window.location.host : '');
    const response = await fetch(`${apiEntryPoint}/files/upload`, {
      method: 'POST',
      headers: {
        'API-TOKEN': token,
        'App-Domain': appDomain,
        Accept: 'application/json',
      },
      body: formDataPayload,
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok || result?.['@type'] === 'Error') {
      throw new Error(result?.description || result?.message || global.t?.t('customers', 'error', 'Falha ao enviar arquivo.'));
    }

    const uploadedFile = unwrapUploadFile(result);
    const documentIri = toDocumentIri(documentItem.id);
    const fileIri = toFileIri(uploadedFile || result?.id || result?.['@id']);

    if (!documentIri || !fileIri) {
      throw new Error(global.t?.t('customers', 'error', 'Upload concluído sem vínculo do arquivo.'));
    }

    const savedLink = await actionsDocumentFile.save({
      document: documentIri,
      file: fileIri,
    });

    return normalizeAttachment({
      id: savedLink?.id || savedLink?.['@id'],
      file: uploadedFile || savedLink?.file || fileIri,
    });
  };

  const handlePickAttachment = documentItem => {
    if (uploadingDocumentId) {
      return;
    }

    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      showError(global.t?.t('customers', 'error', 'O envio de arquivos está disponível apenas no navegador nesta versão.'));
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.jpg,.jpeg,.png,.pdf';

    input.onchange = async event => {
      const file = event?.target?.files?.[0];
      if (!file) {
        return;
      }

      setUploadingDocumentId(String(documentItem.id));
      try {
        const uploadedAttachment = await uploadDocumentAttachment(documentItem, file);
        const nextFiles = [...(documentItem.files || []), uploadedAttachment].filter(Boolean);
        updateDocumentFiles(documentItem.id, nextFiles);
        showSuccess(global.t?.t('customers', 'success', 'Arquivo anexado com sucesso!'));
      } catch (error) {
        showError(error?.message || global.t?.t('customers', 'error', 'Falha ao anexar arquivo.'));
      } finally {
        setUploadingDocumentId('');
      }
    };

    input.click();
  };

  const handleOpenAttachment = async attachment => {
    if (!attachment?.url) {
      return;
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(attachment.url, '_blank', 'noopener,noreferrer');
      return;
    }

    await Linking.openURL(attachment.url);
  };

  const handleShareAttachment = async attachment => {
    if (!attachment?.url) {
      return;
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const encodedUrl = encodeURIComponent(attachment.url);
      const encodedTitle = encodeURIComponent(attachment.name);
      showDialog({
        title: global.t?.t('customers', 'label', 'Compartilhar arquivo'),
        message: global.t?.t('customers', 'label', 'Escolha como deseja compartilhar este arquivo.'),
        confirmLabel: 'WhatsApp',
        cancelLabel: 'E-mail',
        onConfirm: () => {
          window.open(`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`, '_blank', 'noopener,noreferrer');
        },
        onCancel: () => {
          window.open(`mailto:?subject=${encodedTitle}&body=${encodedUrl}`, '_self');
        },
      });
      return;
    }

    await Share.share({
      title: attachment.name,
      message: `${attachment.name} ${attachment.url}`,
      url: attachment.url,
    });
  };

  const handlePrintAttachment = attachment => {
    if (!attachment?.url || Platform.OS !== 'web' || typeof window === 'undefined') {
      showError(global.t?.t('customers', 'error', 'A impressão está disponível apenas na versão web.'));
      return;
    }

    const printWindow = window.open(attachment.url, '_blank');
    if (!printWindow) {
      showError(global.t?.t('customers', 'error', 'Não foi possível abrir a visualização para impressão.'));
      return;
    }

    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const handleDeleteAttachment = (documentItem, attachment) => {
    if (attachment?.legacy || !attachment?.id) {
      showError(global.t?.t('customers', 'error', 'Este anexo antigo precisa ser removido pela trilha legada.'));
      return;
    }

    showDialog({
      title: global.t?.t('customers', 'label', 'Remover arquivo'),
      message: global.t?.t('customers', 'label', 'Deseja realmente remover este arquivo do documento?'),
      confirmLabel: global.t?.t('customers', 'label', 'Remover'),
      cancelLabel: global.t?.t('customers', 'label', 'Cancelar'),
      onConfirm: async () => {
        try {
          await actionsDocumentFile.remove(attachment.id);
          const nextFiles = (documentItem.files || []).filter(file => String(file.id) !== String(attachment.id));
          updateDocumentFiles(documentItem.id, nextFiles);
          if (previewAttachment?.id === attachment.id) {
            setPreviewAttachment(null);
          }
          showSuccess(global.t?.t('customers', 'success', 'Arquivo removido com sucesso!'));
        } catch {
          showError(global.t?.t('customers', 'error', 'Falha ao remover arquivo.'));
        }
      },
    });
  };

  const renderAttachmentCard = (documentItem, attachment) => {
    const isUploadingCurrentDocument = String(uploadingDocumentId) === String(documentItem.id);

    return (
      <View key={`${documentItem.id}-${attachment.id || attachment.fileId}`} style={attachmentCardStyle}>
        <View style={attachmentHeaderStyle}>
          <View style={attachmentMetaStyle}>
            <Icon name={isImageFile(attachment.url) ? 'image' : 'picture-as-pdf'} size={18} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={attachmentNameStyle} numberOfLines={1}>
                {attachment.name}
              </Text>
              <Text style={attachmentSubtextStyle}>
                {attachment.legacy
                  ? global.t?.t('customers', 'label', 'Anexo legado')
                  : global.t?.t('customers', 'label', 'Anexo do documento')}
              </Text>
            </View>
          </View>
        </View>

        <View style={attachmentActionsStyle}>
          <TouchableOpacity style={attachmentActionButtonStyle} onPress={() => setPreviewAttachment(attachment)}>
            <Icon name="visibility" size={16} color={colors.primary} />
            <Text style={attachmentActionLabelStyle}>{global.t?.t('customers', 'label', 'Visualizar')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={attachmentActionButtonStyle} onPress={() => handleOpenAttachment(attachment)}>
            <Icon name="open-in-new" size={16} color={colors.primary} />
            <Text style={attachmentActionLabelStyle}>{global.t?.t('customers', 'label', 'Abrir')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={attachmentActionButtonStyle} onPress={() => handleShareAttachment(attachment)}>
            <Icon name="share" size={16} color={colors.primary} />
            <Text style={attachmentActionLabelStyle}>{global.t?.t('customers', 'label', 'Compartilhar')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={attachmentActionButtonStyle} onPress={() => handlePrintAttachment(attachment)}>
            <Icon name="print" size={16} color={colors.primary} />
            <Text style={attachmentActionLabelStyle}>{global.t?.t('customers', 'label', 'Imprimir')}</Text>
          </TouchableOpacity>

          {isEditing && !attachment.legacy ? (
            <TouchableOpacity style={attachmentActionButtonStyle} onPress={() => handleDeleteAttachment(documentItem, attachment)}>
              <Icon name="delete" size={16} color={colors.error} />
              <Text style={attachmentActionLabelStyle}>{global.t?.t('customers', 'label', 'Remover')}</Text>
            </TouchableOpacity>
          ) : null}

          {isUploadingCurrentDocument ? (
            <View style={attachmentActionButtonStyle}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={attachmentActionLabelStyle}>{global.t?.t('customers', 'label', 'Enviando')}</Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  const renderPreviewModal = () => {
    if (!previewAttachment) {
      return null;
    }

    return (
      <Modal visible transparent animationType="fade" onRequestClose={() => setPreviewAttachment(null)}>
        <View style={previewBackdropStyle}>
          <View style={previewCardStyle}>
            <View style={previewHeaderStyle}>
              <Text style={previewTitleStyle} numberOfLines={1}>
                {previewAttachment.name}
              </Text>
              <TouchableOpacity onPress={() => setPreviewAttachment(null)}>
                <Icon name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={previewContentStyle}>
              {canPreviewImage ? (
                <Image source={{ uri: activePreviewUrl }} style={previewImageStyle} resizeMode="contain" />
              ) : (
                <View style={previewFallbackStyle}>
                  <Icon name={canPreviewPdf ? 'picture-as-pdf' : 'description'} size={42} color={colors.primary} />
                  <Text style={previewFallbackTextStyle}>
                    {canPreviewPdf
                      ? global.t?.t('customers', 'label', 'Arquivo PDF pronto para abrir, compartilhar ou imprimir.')
                      : global.t?.t('customers', 'label', 'Este arquivo pode ser aberto externamente para visualização completa.')}
                  </Text>
                </View>
              )}

              <View style={attachmentActionsStyle}>
                <TouchableOpacity style={attachmentActionButtonStyle} onPress={() => handleOpenAttachment(previewAttachment)}>
                  <Icon name="open-in-new" size={16} color={colors.primary} />
                  <Text style={attachmentActionLabelStyle}>{global.t?.t('customers', 'label', 'Abrir')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={attachmentActionButtonStyle} onPress={() => handleShareAttachment(previewAttachment)}>
                  <Icon name="share" size={16} color={colors.primary} />
                  <Text style={attachmentActionLabelStyle}>{global.t?.t('customers', 'label', 'Compartilhar')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={attachmentActionButtonStyle} onPress={() => handlePrintAttachment(previewAttachment)}>
                  <Icon name="print" size={16} color={colors.primary} />
                  <Text style={attachmentActionLabelStyle}>{global.t?.t('customers', 'label', 'Imprimir')}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderModal = () => (
    <AnimatedModal visible={showModal} onRequestClose={closeModal} style={inlineStyle_265_6}>
      <View style={inlineStyle_266_12}>
        <View style={inlineStyle_279_14}>
          <Text style={inlineStyle_288_16}>
            {editingItem
              ? global.t?.t('customers', 'label', 'Editar documento')
              : global.t?.t('customers', 'label', 'Adicionar documento')}
          </Text>
          <TouchableOpacity onPress={closeModal} style={inlineStyle_291_49}>
            <Icon name="close" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        <ScrollView style={inlineStyle_299_10} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <View style={inlineStyle_302_16}>
            <Text style={inlineStyle_303_18}>{global.t?.t('customers', 'label', 'Tipo')}</Text>
            <View style={inlineStyle_304_18}>
              {getAvailableDocumentTypes().map(type => (
                <TouchableOpacity
                  key={type.documentType}
                  style={inlineStyle_308_18({ formData, type })}
                  onPress={() => setFormData({ ...formData, type: type['@id'] })}>
                  <Text style={inlineStyle_314_24({ formData, type })}>{type.documentType}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={inlineStyle_324_16}>
            <Text style={inlineStyle_325_18}>{global.t?.t('customers', 'label', 'Número do documento')}</Text>
            <TextInput
              style={inlineStyle_327_14}
              placeholder={global.t?.t('customers', 'placeholder', 'Número do documento')}
              value={applyMask(formData.value || '', formData.type)}
              onChangeText={text => {
                const cleanText = removeMask(text);
                setFormData({ ...formData, value: cleanText });
              }}
              keyboardType="numeric"
            />
          </View>

          <View style={inlineStyle_341_16}>
            <TouchableOpacity
              style={inlineStyle_343_14}
              onPress={() => {
                Keyboard.dismiss();
                closeModal();
              }}>
              <Text style={inlineStyle_350_20}>{global.t?.t('customers', 'label', 'Cancelar')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={inlineStyle_353_14}
              onPress={() => {
                Keyboard.dismiss();
                handleSave();
              }}>
              <Text style={inlineStyle_360_20}>{global.t?.t('customers', 'label', 'Salvar')}</Text>
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
              {global.t?.t('customers', 'label', 'Documentos')}
            </Text>
            {isEditing ? (
              <TouchableOpacity onPress={() => openModal()}>
                <Icon name="add" size={24} color={colors.primary} />
              </TouchableOpacity>
            ) : null}
          </View>
          {getFilteredDocuments().length === 0 ? (
            <Text style={customStyles.emptyText}>{global.t?.t('customers', 'label', 'Nenhum documento cadastrado')}</Text>
          ) : (
            getFilteredDocuments().map(documentItem => {
              const isUploadingCurrentDocument = String(uploadingDocumentId) === String(documentItem.id);
              return (
                <View key={documentItem.id} style={customStyles.listItem}>
                  <View style={customStyles.itemContent}>
                    <Icon name="description" size={20} color={colors.primary} />
                    <View>
                      <Text style={customStyles.itemText}>{applyMask(String(documentItem.value || ''), documentItem.type)}</Text>
                      <Text style={customStyles.itemSubtext}>
                        {items.find(item => item['@id'] === documentItem.type)?.documentType || String(documentItem.type || '')}
                      </Text>
                    </View>
                  </View>
                  {isEditing ? (
                    <View style={customStyles.itemActions}>
                      <TouchableOpacity onPress={() => handlePickAttachment(documentItem)}>
                        {isUploadingCurrentDocument ? (
                          <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                          <Icon name="attach-file" size={20} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => openModal(documentItem)}>
                        <Icon name="edit" size={20} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(documentItem.id)}>
                        <Icon name="delete" size={20} color="#ff4444" />
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  <View style={attachmentListStyle}>
                    {(documentItem.files || []).length > 0 ? (
                      documentItem.files.map(attachment => renderAttachmentCard(documentItem, attachment))
                    ) : (
                      <Text style={emptyAttachmentTextStyle}>
                        {global.t?.t('customers', 'label', 'Nenhum arquivo anexado a este documento ainda.')}
                      </Text>
                    )}

                    {isEditing ? (
                      <TouchableOpacity style={uploadButtonStyle} onPress={() => handlePickAttachment(documentItem)}>
                        {isUploadingCurrentDocument ? (
                          <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                          <Icon name="cloud-upload" size={18} color={colors.primary} />
                        )}
                        <Text style={uploadButtonLabelStyle}>
                          {global.t?.t('customers', 'label', 'Anexar JPG, PNG ou PDF')}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </View>
      {renderModal()}
      {renderPreviewModal()}
    </>
  );
};

export default DocumentsTab;
