import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import FeatherIcon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '@store';
import PeopleAvatar from '@controleonline/ui-people/src/react/components/PeopleAvatar';
import { resolveFileImageUrl } from '@controleonline/ui-common/src/react/utils/fileUrl';
import { useMessage } from '@controleonline/ui-common/src/react/components/MessageService';
import {
  buildPeopleLinkReadParams,
  buildSalesmanLinksFromPeopleLinks,
} from './employeeContacts';
import {
  buildCommissionSavePayload,
  canEditSalesmanCommission,
  extractId,
  formatCommissionSubtitle,
  indexDefaultSalesmanLinksByPeopleId,
  resolveEffectiveCommission,
  shouldDisplayCommission,
} from './salesmanTabHelpers';
import { inlineStyle_46_16 } from './SalesmanTab.styles';

const normalizeCollection = payload => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  if (Array.isArray(payload.member)) return payload.member;
  if (Array.isArray(payload['hydra:member'])) return payload['hydra:member'];
  if (Array.isArray(payload.items)) return payload.items;
  return [];
};

const COMPANY_ICON_MEDIA_TYPES = ['icon'];

const fetchPeopleMediaUrl = async ({ peopleActions, peopleId, mediaType }) => {
  const response = await peopleActions.getPeopleMedia({
    people: `/people/${peopleId}`,
    'mediaType.type': mediaType,
    itemsPerPage: 1,
  });
  const media = normalizeCollection(response)[0];

  return resolveFileImageUrl(media?.file);
};

const fetchPeopleMediaUrls = async ({ peopleActions, mediaTypes, peopleIds }) => {
  const uniqueIds = [...new Set((peopleIds || []).map(extractId).filter(Boolean))];
  const entries = await Promise.all(
    uniqueIds.map(async peopleId => {
      for (const mediaType of mediaTypes) {
        const imageUrl = await fetchPeopleMediaUrl({
          peopleActions,
          peopleId,
          mediaType,
        }).catch(() => '');

        if (imageUrl) {
          return [peopleId, imageUrl];
        }
      }

      return null;
    }),
  );

  return entries
    .filter(Boolean)
    .reduce((accumulator, [peopleId, imageUrl]) => {
      accumulator[peopleId] = imageUrl;
      return accumulator;
    }, {});
};

const resolveAppType = () => {
  try {
    if (typeof localStorage !== 'undefined') {
      return String(localStorage.getItem('app-type') || '').trim();
    }
  } catch (_) {
    /* noop */
  }
  return '';
};

const resolveSessionUser = authStore => {
  const fromStore = authStore?.getters?.user || authStore?.state?.user;
  if (fromStore && typeof fromStore === 'object') {
    return fromStore;
  }
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('session');
      if (raw) {
        return JSON.parse(raw);
      }
    }
  } catch (_) {
    /* noop */
  }
  return null;
};

const SalesmanTab = ({
  client,
  customStyles,
  linkType,
  emptyText,
  errorText,
}) => {
  const navigation = useNavigation();
  const { showError, showSuccess } = useMessage();

  const peopleStore = useStore('people');
  const peopleLinkStore = useStore('people_link');
  const authStore = useStore('auth');
  const peopleActions = peopleStore?.actions || {};
  const peopleGetters = peopleStore?.getters || {};
  const getPeopleLinks = peopleLinkStore?.actions?.getItems;
  const savePeopleLink = peopleLinkStore?.actions?.save;

  const [clients, setClients] = useState([]);
  const [defaultLinksBySalesmanId, setDefaultLinksBySalesmanId] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingLinkId, setEditingLinkId] = useState('');
  const [editForm, setEditForm] = useState({ comission: '', minimumComission: '' });
  const [isSaving, setIsSaving] = useState(false);

  const clientId = extractId(client?.id || client?.['@id']);
  const currentCompanyId = extractId(
    peopleGetters?.currentCompany?.id ||
      peopleGetters?.currentCompany?.['@id'] ||
      peopleGetters?.defaultCompany?.id,
  );

  const appType = useMemo(() => resolveAppType(), []);
  const displayCommission = shouldDisplayCommission(appType);
  const sessionUser = useMemo(() => resolveSessionUser(authStore), [authStore]);
  const canEdit = displayCommission && canEditSalesmanCommission(sessionUser);

  const loadDefaultSalesmanLinks = useCallback(
    async salesmanIds => {
      if (!displayCommission || !getPeopleLinks || !currentCompanyId) {
        setDefaultLinksBySalesmanId({});
        return;
      }

      const uniqueIds = [...new Set((salesmanIds || []).map(extractId).filter(Boolean))];
      if (uniqueIds.length === 0) {
        setDefaultLinksBySalesmanId({});
        return;
      }

      try {
        const response = await getPeopleLinks({
          company: currentCompanyId,
          // people_links.linkType is an array filter in the API contract.
          linkType: ['salesman'],
          itemsPerPage: Math.max(uniqueIds.length, 50),
        });
        const indexed = indexDefaultSalesmanLinksByPeopleId(response);
        const filtered = {};
        uniqueIds.forEach(id => {
          if (indexed[id]) {
            filtered[id] = indexed[id];
          }
        });
        setDefaultLinksBySalesmanId(filtered);
      } catch (_) {
        setDefaultLinksBySalesmanId({});
      }
    },
    [currentCompanyId, displayCommission, getPeopleLinks],
  );

  useEffect(() => {
    let cancelled = false;

    if (!clientId || !getPeopleLinks) {
      setClients([]);
      setError('');
      return () => {
        cancelled = true;
      };
    }

    setIsLoading(true);
    setError('');

    getPeopleLinks(
      buildPeopleLinkReadParams({
        peopleId: clientId,
        linkType,
      }),
    )
      .then(async items => {
        if (cancelled) {
          return;
        }
        const nextClients = buildSalesmanLinksFromPeopleLinks(items, {
          clientId,
          linkType,
        });
        const mediaByPeopleId = await fetchPeopleMediaUrls({
          peopleActions,
          mediaTypes: COMPANY_ICON_MEDIA_TYPES,
          peopleIds: nextClients.map(
            item => item?.company?.id || item?.company?.['@id'],
          ),
        });

        if (cancelled) {
          return;
        }

        setClients(
          nextClients.map(item => {
            const companyImageUrl =
              mediaByPeopleId[
                extractId(item?.company?.id || item?.company?.['@id'])
              ] || '';

            return {
              ...item,
              companyImageUrl,
              company: companyImageUrl
                ? { ...item?.company, icon: companyImageUrl }
                : item?.company,
            };
          }),
        );

        await loadDefaultSalesmanLinks(
          nextClients.map(item => item?.company?.id || item?.company?.['@id']),
        );
      })
      .catch(() => {
        if (!cancelled) {
          setClients([]);
          setError(errorText);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [clientId, errorText, getPeopleLinks, linkType, loadDefaultSalesmanLinks]);

  const openEdit = item => {
    const id = extractId(item?.id || item?.['@id']);
    const minRaw = item?.minimum_comission ?? item?.minimumComission;
    setEditingLinkId(id);
    setEditForm({
      comission: item?.comission != null && item?.comission !== '' ? String(item.comission) : '',
      minimumComission: minRaw != null && minRaw !== '' ? String(minRaw) : '',
    });
  };

  const cancelEdit = () => {
    setEditingLinkId('');
    setEditForm({ comission: '', minimumComission: '' });
  };

  const saveEdit = async item => {
    if (!savePeopleLink || isSaving) {
      return;
    }
    const payload = buildCommissionSavePayload(item, {
      comission: editForm.comission,
      minimumComission: editForm.minimumComission,
    });
    if (!payload) {
      showError?.('Vínculo inválido para salvar comissão.');
      return;
    }

    setIsSaving(true);
    try {
      const saved = await savePeopleLink(payload);
      const savedId = extractId(saved?.id || saved?.['@id'] || payload.id);
      setClients(prev =>
        prev.map(row => {
          const rowId = extractId(row?.id || row?.['@id']);
          if (rowId !== savedId) {
            return row;
          }
          return {
            ...row,
            ...(saved || {}),
            comission: payload.comission,
            minimum_comission: payload.minimum_comission,
          };
        }),
      );
      showSuccess?.('Comissão atualizada.');
      cancelEdit();
    } catch (err) {
      showError?.(err?.message || 'Não foi possível salvar a comissão.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderCommissionBlock = item => {
    if (!displayCommission) {
      return null;
    }

    const salesmanId = extractId(item?.company?.id || item?.company?.['@id']);
    const defaultLink = defaultLinksBySalesmanId[salesmanId] || null;
    const effective = resolveEffectiveCommission(item, defaultLink);
    const linkId = extractId(item?.id || item?.['@id']);
    const isEditingThis = editingLinkId === linkId;

    if (isEditingThis && canEdit) {
      return (
        <View style={{ marginTop: 6, gap: 6 }} testID={`salesman-commission-edit-${linkId}`}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={customStyles.itemSubtext}>Comissão %</Text>
            <TextInput
              testID={`salesman-commission-input-${linkId}`}
              value={editForm.comission}
              onChangeText={text =>
                setEditForm(prev => ({ ...prev, comission: text.replace(/[^\d.,]/g, '') }))
              }
              keyboardType="decimal-pad"
              style={{
                minWidth: 64,
                borderWidth: 1,
                borderColor: customStyles.itemSubtext?.color || '#D7E1EC',
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 4,
                color: customStyles.itemText?.color,
              }}
            />
            <Text style={customStyles.itemSubtext}>Mín %</Text>
            <TextInput
              testID={`salesman-minimum-commission-input-${linkId}`}
              value={editForm.minimumComission}
              onChangeText={text =>
                setEditForm(prev => ({
                  ...prev,
                  minimumComission: text.replace(/[^\d.,]/g, ''),
                }))
              }
              keyboardType="decimal-pad"
              style={{
                minWidth: 64,
                borderWidth: 1,
                borderColor: customStyles.itemSubtext?.color || '#D7E1EC',
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 4,
                color: customStyles.itemText?.color,
              }}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              testID={`salesman-commission-save-${linkId}`}
              onPress={() => saveEdit(item)}
              disabled={isSaving}>
              <Text style={[customStyles.itemSubtext, { fontWeight: '600' }]}>
                {isSaving ? 'Salvando…' : 'Salvar'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity testID={`salesman-commission-cancel-${linkId}`} onPress={cancelEdit}>
              <Text style={customStyles.itemSubtext}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View
        style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 6 }}
        testID={`salesman-commission-${linkId}`}>
        <Text
          style={customStyles.itemSubtext}
          testID={`salesman-commission-label-${linkId}`}>
          {formatCommissionSubtitle(effective)}
        </Text>
        {canEdit ? (
          <TouchableOpacity
            testID={`salesman-commission-edit-btn-${linkId}`}
            onPress={() => openEdit(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <FeatherIcon
              name="edit-2"
              size={14}
              color={customStyles.iconButtonGhostIcon?.color || '#6C7787'}
            />
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <View style={customStyles.tabContent}>
      <View style={customStyles.section}>
        {isLoading ? (
          <View style={inlineStyle_46_16}>
            <ActivityIndicator
              size="small"
              color={customStyles.loadingIndicator.color}
            />
          </View>
        ) : error ? (
          <Text style={customStyles.emptyText}>{errorText}</Text>
        ) : !clients || clients?.length === 0 ? (
          <Text style={customStyles.emptyText}>{emptyText}</Text>
        ) : (
          clients.map(item => {
            const linkId = extractId(item?.id || item?.['@id']);
            return (
              <TouchableOpacity
                key={String(item?.id || item?.['@id'])}
                style={[
                  customStyles.listItem,
                  customStyles.listItemWithEndAction,
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  if (editingLinkId === linkId) {
                    return;
                  }
                  const targetId = extractId(
                    item?.company?.id || item?.company?.['@id'],
                  );
                  if (!targetId) {
                    return;
                  }

                  peopleActions?.setItem?.(item?.company);
                  navigation.push('ClientDetails', { clientId: targetId });
                }}>
                <View style={customStyles.itemContent}>
                  <PeopleAvatar
                    people={item?.company}
                    size={40}
                    backgroundColor={customStyles.listAvatarBrand.backgroundColor}
                    borderColor={customStyles.listAvatarBrand.borderColor}
                    borderWidth={2}
                    textColor={customStyles.listAvatarText.color}
                    style={customStyles.listAvatar}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={customStyles.itemText}>
                      {String(item?.company?.name || '-')}
                    </Text>
                    <Text style={customStyles.itemSubtext}>
                      {`ID: ${extractId(item?.company?.id || item?.company?.['@id']) || '-'}`}
                      {item?.company?.alias
                        ? ` - ${String(item?.company?.alias)}`
                        : ''}
                    </Text>
                    {renderCommissionBlock(item)}
                  </View>
                </View>
                <View style={customStyles.iconButtonGhost}>
                  <FeatherIcon
                    name="chevron-right"
                    size={16}
                    color={customStyles.iconButtonGhostIcon.color}
                  />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </View>
  );
};

export default SalesmanTab;
