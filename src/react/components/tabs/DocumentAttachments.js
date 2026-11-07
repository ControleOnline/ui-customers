import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useMessage } from '@controleonline/ui-common/src/react/components/MessageService';
import { resolveFileDownloadUrl } from '@controleonline/ui-common/src/react/utils/fileUrl';
import { colors } from '@controleonline/../../src/styles/colors';
import {
  materializeAttachment,
  openAttachment,
  printAttachment,
  releaseAttachment,
  shareAttachment,
} from './documentFileAccess';
import DefaultUpload from '@controleonline/ui-default/src/react/components/upload/DefaultUpload';
import {
  extractId,
  resolveAttachmentKind,
  normalizeDocumentFiles,
  ACCEPTED_DOCUMENT_FILE_TYPES,
} from './documentsTabHelpers';
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
  previewBackdropStyle,
  previewCardStyle,
  previewContentStyle,
  previewFallbackStyle,
  previewFallbackTextStyle,
  previewHeaderStyle,
  previewImageStyle,
  previewTitleStyle,
} from './DocumentsTab.styles';

const DocumentAttachments = ({
  documentItem,
  isEditing,
  companyId,
  onFilesChanged,
}) => {
  const { showError, showSuccess, showDialog } = useMessage();
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const documentId = extractId(documentItem?.id);
  // /files/upload answers 500 when no owner people is sent; fall back to the document owner.
  const uploadPeopleId =
    extractId(companyId) || extractId(documentItem?.raw?.people || documentItem?.people);

  const attachments = useMemo(
    () =>
      normalizeDocumentFiles(documentItem?.raw || documentItem, resolveFileDownloadUrl).concat(
        Array.isArray(documentItem?.files) ? documentItem.files.filter(Boolean) : [],
      ).reduce((acc, item) => {
        const key = String(item.id || item.fileId || item.url || '');
        if (key && !acc.some(existing => String(existing.id || existing.fileId) === key)) {
          acc.push(item);
        }
        return acc;
      }, []),
    [documentItem],
  );

  const [previewFile, setPreviewFile] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewKind = resolveAttachmentKind(previewAttachment?.name, previewFile?.mimeType);
  const canPreviewImage =
    previewKind === 'image' && !/svg/i.test(previewFile?.mimeType || previewAttachment?.name || '');

  // Preview needs the authenticated blob; the raw download URL is "Access denied".
  useEffect(() => {
    if (!previewAttachment) {
      setPreviewFile(null);
      return undefined;
    }
    let cancelled = false;
    let loaded = null;
    setPreviewLoading(true);
    setPreviewFile(null);
    materializeAttachment(previewAttachment)
      .then(result => {
        loaded = result;
        if (cancelled) {
          releaseAttachment(result);
          return;
        }
        setPreviewFile(result);
      })
      .catch(error => {
        if (!cancelled) {
          showError(error?.message || global.t?.t('customers', 'error', 'Falha ao carregar o arquivo.'));
        }
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });
    return () => {
      cancelled = true;
      releaseAttachment(loaded);
    };
  }, [previewAttachment, showError]);

  const runAction = useCallback(
    async (action, attachment, failureMessage) => {
      try {
        await action(attachment);
      } catch (error) {
        showError(error?.message || global.t?.t('customers', 'error', failureMessage));
      }
    },
    [showError],
  );

  const handleOpen = useCallback(
    attachment => runAction(openAttachment, attachment, 'Falha ao abrir o arquivo.'),
    [runAction],
  );
  const handleShare = useCallback(
    attachment => runAction(shareAttachment, attachment, 'Falha ao compartilhar o arquivo.'),
    [runAction],
  );
  const handlePrint = useCallback(
    attachment => runAction(printAttachment, attachment, 'Falha ao imprimir o arquivo.'),
    [runAction],
  );
  const handlePreview = useCallback(attachment => {
    setPreviewAttachment(attachment);
  }, []);

  const handleChanged = useCallback(
    nextAttachments => {
      if (typeof onFilesChanged === 'function') {
        onFilesChanged(documentId, nextAttachments || []);
      }
      showSuccess(global.t?.t('customers', 'success', 'Anexos do documento atualizados.'));
    },
    [documentId, onFilesChanged, showSuccess],
  );

  if (!documentId) {
    return (
      <Text style={emptyAttachmentTextStyle}>
        {global.t?.t('customers', 'label', 'Salve o documento antes de anexar arquivos.')}
      </Text>
    );
  }

  return (
    <View style={attachmentListStyle}>
      <View style={attachmentHeaderStyle}>
        <Text style={attachmentSubtextStyle}>
          {global.t?.t('customers', 'label', 'Anexos (JPG, PNG, PDF)')}
        </Text>
      </View>

      {attachments.length === 0 ? (
        <Text style={emptyAttachmentTextStyle}>
          {global.t?.t('customers', 'label', 'Nenhum arquivo anexado.')}
        </Text>
      ) : (
        attachments.map(attachment => (
          <View key={String(attachment.id || attachment.fileId || attachment.url)} style={attachmentCardStyle}>
            <View style={attachmentMetaStyle}>
              <Icon
                name={resolveAttachmentKind(attachment.name) === 'pdf' ? 'picture-as-pdf' : 'image'}
                size={20}
                color={colors.primary}
              />
              <TouchableOpacity onPress={() => handlePreview(attachment)} style={{ flex: 1 }}>
                <Text style={attachmentNameStyle} numberOfLines={1}>
                  {attachment.name}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={attachmentActionsStyle}>
              <TouchableOpacity style={attachmentActionButtonStyle} onPress={() => handlePreview(attachment)}>
                <Icon name="visibility" size={16} color={colors.primary} />
                <Text style={attachmentActionLabelStyle}>{global.t?.t('customers', 'label', 'Ver')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={attachmentActionButtonStyle} onPress={() => handleOpen(attachment)}>
                <Icon name="open-in-new" size={16} color={colors.primary} />
                <Text style={attachmentActionLabelStyle}>{global.t?.t('customers', 'label', 'Abrir')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={attachmentActionButtonStyle} onPress={() => handleShare(attachment)}>
                <Icon name="share" size={16} color={colors.primary} />
                <Text style={attachmentActionLabelStyle}>{global.t?.t('customers', 'label', 'Compartilhar')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={attachmentActionButtonStyle} onPress={() => handlePrint(attachment)}>
                <Icon name="print" size={16} color={colors.primary} />
                <Text style={attachmentActionLabelStyle}>{global.t?.t('customers', 'label', 'Imprimir')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {isEditing ? (
        <DefaultUpload
          relationStoreName="document_file"
          relationField="document"
          // DefaultUpload builds `/${relationResource}/${entityId}`, so pass the bare collection name.
          relationResource="documents"
          entityId={documentId}
          companyId={uploadPeopleId}
          context="document"
          fileType="all"
          acceptedTypes={ACCEPTED_DOCUMENT_FILE_TYPES}
          title={global.t?.t('customers', 'label', 'Arquivos do documento')}
          triggerLabel={global.t?.t('customers', 'label', 'Anexar arquivo')}
          managerTitle={global.t?.t('customers', 'label', 'Gerenciar anexos do documento')}
          emptyAttachmentLabel={global.t?.t('customers', 'label', 'Nenhum arquivo anexado.')}
          uploadButtonLabel={global.t?.t('customers', 'label', 'Enviar arquivo')}
          fileTypeLabel="arquivo"
          showInlineContent={false}
          onChanged={handleChanged}
        />
      ) : null}

      {previewAttachment ? (
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
                {previewLoading ? (
                  <ActivityIndicator />
                ) : canPreviewImage && previewFile?.uri ? (
                  <Image source={{ uri: previewFile.uri }} style={previewImageStyle} resizeMode="contain" />
                ) : (
                  <View style={previewFallbackStyle}>
                    <Icon name="insert-drive-file" size={48} color="#94A3B8" />
                    <Text style={previewFallbackTextStyle}>
                      {global.t?.t('customers', 'label', 'Pré-visualização indisponível. Use Abrir ou Imprimir.')}
                    </Text>
                    <TouchableOpacity style={attachmentActionButtonStyle} onPress={() => handleOpen(previewAttachment)}>
                      <Icon name="open-in-new" size={16} color={colors.primary} />
                      <Text style={attachmentActionLabelStyle}>{global.t?.t('customers', 'label', 'Abrir')}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
};

export default DocumentAttachments;
