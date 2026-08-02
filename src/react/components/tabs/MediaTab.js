import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import Icon from 'react-native-vector-icons/Feather';
import { useStore } from '@store';
import DefaultFile from '@controleonline/ui-default/src/react/components/files/DefaultFile';
import { useMessage } from '@controleonline/ui-common/src/react/components/MessageService';
import { resolveThemePalette, withOpacity } from '@controleonline/../../src/styles/branding';
import { colors } from '@controleonline/../../src/styles/colors';

const ACCEPTED_COMPANY_MEDIA_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/pjpeg'];
const ACCEPTED_COMPANY_MEDIA_EXTENSIONS = ['png', 'jpg', 'jpeg'];
const COMPANY_MEDIA_ACCEPT_ATTRIBUTE = 'image/png,image/jpeg,.png,.jpg,.jpeg';

const normalizeCollection = payload => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  if (Array.isArray(payload.member)) return payload.member;
  if (Array.isArray(payload['hydra:member'])) return payload['hydra:member'];
  if (Array.isArray(payload.items)) return payload.items;
  return [];
};

const extractId = value => {
  if (!value && value !== 0) return null;
  if (typeof value === 'number') return value;
  const raw = typeof value === 'string' ? value : value?.id || value?.['@id'];
  if (!raw) return null;
  const match = String(raw).match(/(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
};

const getMediaExtension = file => {
  const directExtension = String(file?.extension || '').trim().toLowerCase().replace(/^\./, '');
  if (directExtension) return directExtension;

  const name = String(file?.name || file?.fileName || file?.url || '').trim().toLowerCase();
  const match = name.match(/\.([a-z0-9]+)$/);
  return match ? match[1] : '';
};

const getMediaMimeType = file => {
  const mimeType = String(file?.type || file?.mimeType || '').trim().toLowerCase();
  if (ACCEPTED_COMPANY_MEDIA_MIME_TYPES.includes(mimeType)) return mimeType;

  const extension = getMediaExtension(file);
  if (extension === 'png') return 'image/png';
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';

  return '';
};

const isImageFile = file => {
  const mimeType = getMediaMimeType(file);
  if (mimeType) return true;

  return ACCEPTED_COMPANY_MEDIA_EXTENSIONS.includes(getMediaExtension(file));
};

const getFile = () => {
  if (typeof document !== 'undefined') {
    return new Promise(resolve => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = COMPANY_MEDIA_ACCEPT_ATTRIBUTE;
      input.onchange = event => resolve(event?.target?.files?.[0] || null);
      input.click();
    });
  }

  return DocumentPicker.getDocumentAsync({
    type: ['image/png', 'image/jpeg'],
    copyToCacheDirectory: true,
    multiple: false,
  }).then(result => {
    if (result?.canceled) return null;
    return result?.assets?.[0] || null;
  });
};

const confirmDeletion = mediaTypeLabel => {
  const normalizedLabel = String(mediaTypeLabel || 'esta mídia').trim();
  const message = `Deseja apagar a vinculação da mídia "${normalizedLabel}"?`;

  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.confirm === 'function') {
    return Promise.resolve(window.confirm(message));
  }

  return new Promise(resolve => {
    Alert.alert(
      'Confirmação',
      message,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Apagar', style: 'destructive', onPress: () => resolve(true) },
      ],
    );
  });
};

const MediaTab = ({ client, onChanged = null }) => {
  const peopleStore = useStore('people');
  const themeStore = useStore('theme');
  const { currentCompany } = peopleStore.getters;
  const peopleActions = peopleStore.actions || {};
  const { colors: themeColors } = themeStore.getters;
  const { showError, showSuccess } = useMessage();

  const clientId = extractId(client?.id || client?.['@id']);
  const peopleType = String(client?.peopleType || 'J').trim().toUpperCase() || 'J';

  const [mediaTypes, setMediaTypes] = useState([]);
  const [peopleMedia, setPeopleMedia] = useState([]);
  const [mediaTypesLoading, setMediaTypesLoading] = useState(false);
  const [peopleMediaLoading, setPeopleMediaLoading] = useState(false);
  const [uploadingByTypeId, setUploadingByTypeId] = useState({});
  const [deletingByTypeId, setDeletingByTypeId] = useState({});
  const [dragOverByTypeId, setDragOverByTypeId] = useState({});

  const palette = useMemo(
    () =>
      resolveThemePalette(
        { ...themeColors, ...(currentCompany?.theme?.colors || {}) },
        colors,
      ),
    [currentCompany?.id, currentCompany?.theme?.colors, themeColors],
  );

  const mediaByTypeId = useMemo(
    () =>
      normalizeCollection(peopleMedia).reduce((accumulator, item) => {
        const mediaTypeId = extractId(item?.mediaType);
        if (mediaTypeId) {
          accumulator[String(mediaTypeId)] = item;
        }

        return accumulator;
      }, {}),
    [peopleMedia],
  );

  const loadMediaTypes = useCallback(async () => {
    setMediaTypesLoading(true);

    try {
      const response = await peopleActions.getMediaTypes({
        peopleType,
        itemsPerPage: 100,
      });

      setMediaTypes(normalizeCollection(response));
    } catch (error) {
      setMediaTypes([]);
      showError(error?.message || 'Nao foi possivel carregar os tipos de midia.');
    } finally {
      setMediaTypesLoading(false);
    }
  }, [peopleActions, peopleType, showError]);

  const loadPeopleMedia = useCallback(async () => {
    if (!clientId) {
      setPeopleMedia([]);
      return;
    }

    setPeopleMediaLoading(true);

    try {
      const response = await peopleActions.getPeopleMedia({
        people: `/people/${clientId}`,
        'mediaType.peopleType': peopleType,
        itemsPerPage: 100,
      });

      setPeopleMedia(normalizeCollection(response));
    } catch (error) {
      setPeopleMedia([]);
      showError(error?.message || 'Nao foi possivel carregar as midias.');
    } finally {
      setPeopleMediaLoading(false);
    }
  }, [clientId, peopleActions, peopleType, showError]);

  useEffect(() => {
    loadMediaTypes();
  }, [loadMediaTypes]);

  useEffect(() => {
    loadPeopleMedia();
  }, [loadPeopleMedia]);

  const uploadMediaFile = useCallback(
    async (mediaType, providedFile = null) => {
      const mediaTypeId = extractId(mediaType);
      if (!clientId || !mediaTypeId) {
        showError('Nao foi possivel identificar a empresa ou o tipo da midia.');
        return;
      }

      const selectedFile = providedFile || (await getFile());
      if (!selectedFile) return;

      if (!isImageFile(selectedFile)) {
        showError('Envie apenas arquivos PNG ou JPG.');
        return;
      }

      setUploadingByTypeId(current => ({
        ...current,
        [mediaTypeId]: true,
      }));

      try {
        const uploadFile =
          Platform.OS === 'web'
            ? selectedFile
            : {
                uri: selectedFile.uri,
                name:
                  selectedFile.name ||
                  `${mediaType?.type || 'media'}.${getMediaExtension(selectedFile) || 'png'}`,
                type: selectedFile.mimeType || getMediaMimeType(selectedFile) || 'image/png',
              };

        await peopleActions.uploadPeopleMedia({
          people: `/people/${clientId}`,
          mediaTypeId,
          file: uploadFile,
        });
        await loadPeopleMedia();
        onChanged?.();
        showSuccess(`${mediaType?.type || 'Midia'} atualizada com sucesso.`);
      } catch (error) {
        showError(error?.response?.data?.['hydra:description'] || error?.message || 'Nao foi possivel enviar a midia.');
      } finally {
        setUploadingByTypeId(current => ({
          ...current,
          [mediaTypeId]: false,
        }));
      }
    },
    [clientId, loadPeopleMedia, onChanged, peopleActions, showError, showSuccess],
  );

  const deleteMediaLink = useCallback(
    async mediaType => {
      const mediaTypeId = extractId(mediaType);
      const currentMedia = mediaByTypeId[String(mediaTypeId)] || null;
      const peopleMediaId = extractId(currentMedia);

      if (!mediaTypeId || !peopleMediaId) {
        showError('Nao foi possivel identificar a midia para apagar.');
        return;
      }

      const shouldDelete = await confirmDeletion(mediaType?.type || 'Midia');
      if (!shouldDelete) {
        return;
      }

      setDeletingByTypeId(current => ({
        ...current,
        [mediaTypeId]: true,
      }));

      try {
        await peopleActions.deletePeopleMedia({mediaId: peopleMediaId});
        await loadPeopleMedia();
        onChanged?.();
        showSuccess(`${mediaType?.type || 'Midia'} removida com sucesso.`);
      } catch (error) {
        showError(error?.response?.data?.['hydra:description'] || error?.message || 'Nao foi possivel apagar a midia.');
      } finally {
        setDeletingByTypeId(current => ({
          ...current,
          [mediaTypeId]: false,
        }));
      }
    },
    [loadPeopleMedia, mediaByTypeId, onChanged, peopleActions, showError, showSuccess],
  );

  const handleDrop = useCallback(
    async (mediaType, event) => {
      if (Platform.OS !== 'web') return;

      event?.preventDefault?.();
      event?.stopPropagation?.();

      const mediaTypeId = extractId(mediaType);
      if (mediaTypeId) {
        setDragOverByTypeId(current => ({
          ...current,
          [mediaTypeId]: false,
        }));
      }

      const droppedFile =
        event?.nativeEvent?.dataTransfer?.files?.[0]
        || event?.dataTransfer?.files?.[0]
        || null;
      if (!droppedFile) return;

      await uploadMediaFile(mediaType, droppedFile);
    },
    [uploadMediaFile],
  );

  const renderDropZone = useCallback(
    ({ currentMedia, isDragOver, isUploading, mediaType, mediaTypeId }) => {
      const previewBackgroundStyle = Platform.OS === 'web'
        ? styles.mediaPreviewTransparencyGrid
        : { backgroundColor: palette.panelBackground || colors.white };
      const sharedContent = (
        <>
          <View
            style={[
              styles.mediaPreviewFrame,
              previewBackgroundStyle,
              {
                borderColor: withOpacity(palette.text || colors.text, 0.08),
              },
            ]}
          >
            {currentMedia?.file ? (
              <DefaultFile
                source={currentMedia.file}
                company={currentCompany}
                resizeMode="contain"
                style={styles.mediaPreviewImage}
              />
            ) : (
              <View style={styles.mediaEmptyState}>
                <Icon
                  name="image"
                  size={24}
                  color={withOpacity(palette.textSecondary || '#64748B', 0.9)}
                />
                <Text
                  style={[
                    styles.mediaEmptyText,
                    { color: palette.textSecondary || '#64748B' },
                  ]}
                >
                  Sem imagem salva
                </Text>
              </View>
            )}
          </View>

          <Text style={[styles.mediaHelpText, { color: palette.textSecondary || '#64748B' }]}>
            {isUploading
              ? 'Enviando arquivo...'
              : Platform.OS === 'web'
                ? 'Clique para enviar ou arraste um PNG ou JPG até aqui.'
                : 'Toque para enviar um arquivo PNG ou JPG.'}
          </Text>
        </>
      );

      if (Platform.OS !== 'web') {
        return (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => uploadMediaFile(mediaType)}
            disabled={isUploading}
          >
            {sharedContent}
          </TouchableOpacity>
        );
      }

      return React.createElement(
        'div',
        {
          onClick: () => {
            if (!isUploading) {
              uploadMediaFile(mediaType);
            }
          },
          onDragOver: event => {
            event.preventDefault();
            if (event.dataTransfer) {
              event.dataTransfer.dropEffect = 'copy';
            }
          },
          onDragEnter: event => {
            event.preventDefault();
            setDragOverByTypeId(current => ({
              ...current,
              [mediaTypeId]: true,
            }));
          },
          onDragLeave: event => {
            event.preventDefault();
            const relatedTarget = event.relatedTarget;
            if (relatedTarget && event.currentTarget?.contains?.(relatedTarget)) {
              return;
            }
            setDragOverByTypeId(current => ({
              ...current,
              [mediaTypeId]: false,
            }));
          },
          onDrop: async event => {
            event.preventDefault();
            setDragOverByTypeId(current => ({
              ...current,
              [mediaTypeId]: false,
            }));
            const droppedFile = event.dataTransfer?.files?.[0] || null;
            if (!droppedFile) return;
            await uploadMediaFile(mediaType, droppedFile);
          },
          style: {
            cursor: isUploading ? 'progress' : 'pointer',
            display: 'block',
          },
        },
        sharedContent,
      );
    },
    [currentCompany, palette.panelBackground, palette.secondary, palette.text, palette.textSecondary, uploadMediaFile],
  );

  if (!clientId) {
    return (
      <View style={styles.container}>
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Midias</Text>
          <Text style={styles.sectionDescription}>Nao foi possivel identificar este cadastro.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: palette.panelBackground || colors.white,
            borderColor: withOpacity(palette.text || colors.text, 0.08),
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: palette.text || colors.text }]}>
          Midias
        </Text>

        <Text style={[styles.sectionDescription, { color: palette.textSecondary || '#64748B' }]}>
          Envie arquivos PNG ou JPG para cada tipo de midia do cadastro. A prévia abaixo sempre reflete o que está salvo no banco.
        </Text>

        {mediaTypesLoading || peopleMediaLoading ? (
          <View style={styles.mediaLoadingState}>
            <ActivityIndicator size="small" color={palette.primary || '#2563EB'} />
          </View>
        ) : (
          <View style={styles.mediaGrid}>
            {mediaTypes.map(mediaType => {
              const mediaTypeId = extractId(mediaType);
              const currentMedia = mediaByTypeId[String(mediaTypeId)] || null;
              const isUploading = Boolean(uploadingByTypeId[mediaTypeId]);
              const isDeleting = Boolean(deletingByTypeId[mediaTypeId]);
              const isDragOver = Boolean(dragOverByTypeId[mediaTypeId]);
              const mediaFormatLabel = currentMedia?.file
                ? String(currentMedia.file?.extension || '').trim().toUpperCase()
                : '';

              return (
                <View
                  key={mediaTypeId || mediaType?.type}
                  style={[
                    styles.mediaCard,
                    {
                      backgroundColor: withOpacity(palette.primary || '#2563EB', isDragOver ? 0.12 : 0.04),
                      borderColor: withOpacity(
                        palette.primary || '#2563EB',
                        isDragOver ? 0.4 : 0.14,
                      ),
                    },
                  ]}
                >
                  <View style={styles.mediaCardHeader}>
                    <Text style={[styles.mediaCardTitle, { color: palette.text || colors.text }]}>
                      {String(mediaType?.type || '').trim() || 'Midia'}
                    </Text>

                    <View style={styles.mediaHeaderActions}>
                      {currentMedia ? (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => deleteMediaLink(mediaType)}
                          disabled={isDeleting}
                          style={[
                            styles.mediaDeleteButton,
                            {
                              borderColor: withOpacity(palette.textDanger || '#EF4444', 0.25),
                              opacity: isDeleting ? 0.65 : 1,
                            },
                          ]}
                        >
                          <Text style={{ color: palette.textDanger || '#EF4444', fontSize: 12, fontWeight: '600' }}>
                            Apagar
                          </Text>
                        </TouchableOpacity>
                      ) : null}

                      {mediaFormatLabel ? (
                        <View
                          style={[
                            styles.mediaBadge,
                            {
                              backgroundColor: withOpacity(palette.primary || '#2563EB', 0.08),
                            },
                          ]}
                        >
                          <Text style={[styles.mediaBadgeText, { color: palette.primary || '#2563EB' }]}>
                            {mediaFormatLabel}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  {renderDropZone({
                    currentMedia,
                    isDragOver,
                    isUploading,
                    mediaType,
                    mediaTypeId,
                  })}

                  {isDeleting ? (
                    <Text style={[styles.mediaHelpText, { color: palette.textSecondary || '#64748B' }]}>
                      Apagando...
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  mediaLoadingState: {
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaGrid: {
    gap: 16,
  },
  mediaCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  mediaCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  mediaHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mediaCardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  mediaDeleteButton: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  mediaBadge: {
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  mediaBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  mediaPreviewFrame: {
    minHeight: 180,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaPreviewTransparencyGrid: {
    backgroundColor: '#F8FAFC',
    backgroundImage:
      'linear-gradient(45deg, rgba(148,163,184,0.08) 25%, transparent 25%, transparent 75%, rgba(148,163,184,0.08) 75%, rgba(148,163,184,0.08)), linear-gradient(45deg, rgba(148,163,184,0.08) 25%, transparent 25%, transparent 75%, rgba(148,163,184,0.08) 75%, rgba(148,163,184,0.08))',
    backgroundPosition: '0 0, 12px 12px',
    backgroundSize: '24px 24px',
  },
  mediaPreviewImage: {
    width: '100%',
    height: '100%',
    minHeight: 180,
  },
  mediaEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 180,
  },
  mediaEmptyText: {
    fontSize: 13,
    fontWeight: '500',
  },
  mediaHelpText: {
    fontSize: 12,
    lineHeight: 18,
  },
});

export default MediaTab;
