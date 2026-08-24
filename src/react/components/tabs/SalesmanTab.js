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
import { normalizeSalesmanLink } from './salesmanTab.helpers';
import SalesmanManageModal from './SalesmanManageModal';
import { useSalesmanManage } from './useSalesmanManage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '@controleonline/../../src/styles/colors';
import SalesmanCommissionBlock from './SalesmanCommissionBlock';

import {
  COMPANY_ICON_MEDIA_TYPES,
  fetchPeopleMediaUrls,
  normalizeCollection,
} from './salesmanTabMedia';

import { resolveAppType, resolveSessionUser } from './salesmanTabSession';

const SalesmanTab = ({
  client,
  customStyles,
  linkType,
  emptyText,
  errorText,
}) => {
  const navigation = useNavigation();
  const { showDialog, showError, showSuccess } = useMessage();

  const peopleStore = useStore('people');
  const peopleLinkStore = useStore('people_link');
  const authStore = useStore('auth');
  const peopleActions = peopleStore?.actions || {};
  const peopleGetters = peopleStore?.getters || {};
  const getPeopleLinks = peopleLinkStore?.actions?.getItems;
  const savePeopleLink = peopleLinkStore?.actions?.save;
  const removePeopleLink = peopleLinkStore?.actions?.remove;

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

  const {
    canManage,
    linkedNormalized,
    showManageModal,
    editingManageLink,
    manageForm,
    setManageForm,
    isManageSaving,
    salesmanOptions,
    openManageModal,
    closeManageModal,
    handleManageSave,
    handleManageDelete,
  } = useSalesmanManage({
    appType,
    client,
    clientId,
    currentCompanyId,
    linkType,
    clients,
    setClients,
    setIsLoading,
    peopleActions,
    getPeopleLinks,
    savePeopleLink,
    removePeopleLink,
    loadDefaultSalesmanLinks,
    showDialog,
    showError,
    showSuccess,
  });

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

  const renderCommissionBlock = item => (
    <SalesmanCommissionBlock
      item={item}
      displayCommission={displayCommission}
      canEdit={canEdit}
      editingLinkId={editingLinkId}
      editForm={editForm}
      setEditForm={setEditForm}
      isSaving={isSaving}
      defaultLinksBySalesmanId={defaultLinksBySalesmanId}
      openEdit={openEdit}
      cancelEdit={cancelEdit}
      saveEdit={saveEdit}
      customStyles={customStyles}
    />
  );

  return (
    <>
    <View style={customStyles.tabContent}>
      <View style={customStyles.section}>
        {canManage ? (
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 }}>
            <TouchableOpacity
              onPress={() => openManageModal(null)}
              accessibilityLabel="Vincular vendedor"
              testID="salesman-manage-add-btn">
              <Icon name="add" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        ) : null}
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
                {canManage ? (
                  <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity
                      onPress={() => {
                        const link = linkedNormalized.find(
                          entry =>
                            entry.id === linkId ||
                            entry.sellerId === extractId(item?.company?.id),
                        );
                        openManageModal(link || normalizeSalesmanLink(item));
                      }}
                      style={{ padding: 6 }}
                      testID={`salesman-manage-edit-${linkId}`}>
                      <Icon name="edit" size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        const link = linkedNormalized.find(
                          entry =>
                            entry.id === linkId ||
                            entry.sellerId === extractId(item?.company?.id),
                        );
                        handleManageDelete(link || { id: linkId });
                      }}
                      style={{ padding: 6 }}
                      testID={`salesman-manage-delete-${linkId}`}>
                      <Icon name="delete-outline" size={18} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                ) : (
                <View style={customStyles.iconButtonGhost}>
                  <FeatherIcon
                    name="chevron-right"
                    size={16}
                    color={customStyles.iconButtonGhostIcon.color}
                  />
                </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </View>
    {canManage ? (
      <SalesmanManageModal
        visible={showManageModal}
        onClose={closeManageModal}
        editingLink={editingManageLink}
        formData={manageForm}
        setFormData={setManageForm}
        salesmanOptions={salesmanOptions}
        isSaving={isManageSaving}
        onSave={handleManageSave}
      />
    ) : null}
    </>
  );
};

export default SalesmanTab;
