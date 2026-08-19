import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useStore } from '@store';
import DefaultUpload from '@controleonline/ui-default/src/react/components/upload/DefaultUpload';
import { extractFileId } from '@controleonline/ui-default/src/react/components/upload/fileUpload';
import { useMessage } from '@controleonline/ui-common/src/react/components/MessageService';
import { resolveThemePalette, withOpacity } from '@controleonline/../../src/styles/branding';
import { colors } from '@controleonline/../../src/styles/colors';

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

const MediaTab = ({ client, onChanged = null }) => {
  const peopleStore = useStore('people');
  const themeStore = useStore('theme');
  const { currentCompany } = peopleStore.getters;
  const peopleActions = peopleStore.actions || {};
  const { colors: themeColors } = themeStore.getters;
  const { showError } = useMessage();

  const clientId = extractId(client?.id || client?.['@id']);
  const peopleType = String(client?.peopleType || 'J').trim().toUpperCase() || 'J';

  const [mediaTypes, setMediaTypes] = useState([]);
  const [peopleMedia, setPeopleMedia] = useState([]);
  const [mediaTypesLoading, setMediaTypesLoading] = useState(false);
  const [peopleMediaLoading, setPeopleMediaLoading] = useState(false);

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

  const buildMediaUploadHandlers = useCallback(
    mediaType => {
      const mediaTypeId = extractId(mediaType);
      const currentMedia = mediaByTypeId[String(mediaTypeId)] || null;

      return {
        onAttachFile: async file => {
          const fileId = extractFileId(file);

          if (!fileId) {
            throw new Error('Arquivo sem identificador.');
          }

          return peopleActions.savePeopleMedia({
            id: currentMedia?.id || currentMedia?.['@id'],
            people: `/people/${clientId}`,
            mediaType: mediaType?.['@id'] || `/media_types/${mediaTypeId}`,
            file: `/files/${fileId}`,
          });
        },
        onRemoveAttachment: async relation => {
          // Prefer explicit people_media id; fall back so extractId in deletePeopleMedia
          // can resolve numeric id / IRI / nested mediaId (API often returns numeric id).
          const mediaId =
            relation?.id ??
            relation?.['@id'] ??
            relation?.mediaId ??
            relation;
          await peopleActions.deletePeopleMedia({ mediaId });
        },
      };
    },
    [clientId, mediaByTypeId, peopleActions],
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
              const mediaTypeLabel = String(mediaType?.type || '').trim() || 'Midia';
              const handlers = buildMediaUploadHandlers(mediaType);

              return (
                <View
                  key={mediaTypeId || mediaType?.type}
                  style={[
                    styles.mediaCard,
                    {
                      backgroundColor: withOpacity(palette.primary || '#2563EB', 0.04),
                      borderColor: withOpacity(palette.primary || '#2563EB', 0.14),
                    },
                  ]}
                >
                  <DefaultUpload
                    relationStoreName="people"
                    relationField="people"
                    relationResource="people"
                    entityId={clientId}
                    companyId={clientId}
                    context="people_media"
                    libraryContexts={['people_media']}
                    attachments={currentMedia ? [currentMedia] : []}
                    acceptedTypes={COMPANY_MEDIA_ACCEPT_ATTRIBUTE}
                    fileType="image"
                    fileTypeLabel="imagem"
                    title={mediaTypeLabel}
                    triggerLabel={`Gerenciar ${mediaTypeLabel}`}
                    managerTitle={`Gerenciador de ${mediaTypeLabel}`}
                    searchPlaceholder="Buscar imagem"
                    uploadButtonLabel="Enviar nova"
                    emptyAttachmentLabel="Nenhuma imagem vinculada."
                    emptyLibraryLabel="Nenhuma imagem encontrada."
                    uploadSuccessMessage={`${mediaTypeLabel} atualizada com sucesso.`}
                    attachSuccessMessage={`${mediaTypeLabel} vinculada com sucesso.`}
                    removeSuccessMessage={`${mediaTypeLabel} removida.`}
                    onChanged={async () => {
                      await loadPeopleMedia();
                      onChanged?.();
                    }}
                    {...handlers}
                  />
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
    // RN StyleSheet (web) rejects multi-value backgroundPosition / CSS backgroundImage gradients.
    // Keep solid preview background; checkerboard was cosmetic only.
    backgroundColor: '#F8FAFC',
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
