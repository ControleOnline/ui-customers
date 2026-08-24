import React, { useEffect, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import FeatherIcon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '@store';
import PeopleAvatar from '@controleonline/ui-people/src/react/components/PeopleAvatar';
import { useMessage } from '@controleonline/ui-common/src/react/components/MessageService';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '@controleonline/../../src/styles/colors';

import {
  buildFranchiseLinkReadParams,
  buildFranchiseLinksFromPeopleLinks,
  franchiseLinkTypeLabel,
  normalizeFranchiseLink,
} from './franchiseLinksTab.helpers';
import { extractId } from './salesmanTabHelpers';
import { resolveAppType } from './salesmanTabSession';
import FranchiseLinksManageModal from './FranchiseLinksManageModal';
import { useFranchiseLinksManage } from './useFranchiseLinksManage';

const FranchiseLinksTab = ({
  client,
  customStyles,
  emptyText,
  errorText,
}) => {
  const navigation = useNavigation();
  const { showDialog, showError, showSuccess } = useMessage();

  const peopleStore = useStore('people');
  const peopleLinkStore = useStore('people_link');
  const peopleActions = peopleStore?.actions || {};
  const getPeopleLinks = peopleLinkStore?.actions?.getItems;
  const savePeopleLink = peopleLinkStore?.actions?.save;
  const removePeopleLink = peopleLinkStore?.actions?.remove;

  const [links, setLinks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const clientId = extractId(client?.id || client?.['@id']);
  const appType = useMemo(() => resolveAppType(), []);

  useEffect(() => {
    let cancelled = false;

    if (!clientId || !getPeopleLinks) {
      setLinks([]);
      setError('');
      return () => {
        cancelled = true;
      };
    }

    setIsLoading(true);
    setError('');

    getPeopleLinks(buildFranchiseLinkReadParams(clientId))
      .then(items => {
        if (cancelled) {
          return;
        }
        const next = buildFranchiseLinksFromPeopleLinks(items, {
          companyId: clientId,
        });
        setLinks(next);
      })
      .catch(() => {
        if (!cancelled) {
          setLinks([]);
          setError(errorText || 'Não foi possível carregar os vínculos.');
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
  }, [clientId, errorText, getPeopleLinks]);

  const {
    canManage,
    linkedNormalized,
    showManageModal,
    editingManageLink,
    manageForm,
    setManageForm,
    isManageSaving,
    franchiseOptions,
    openManageModal,
    closeManageModal,
    handleManageSave,
    handleManageDelete,
  } = useFranchiseLinksManage({
    appType,
    client,
    clientId,
    links,
    setLinks,
    setIsLoading,
    peopleActions,
    getPeopleLinks,
    savePeopleLink,
    removePeopleLink,
    showDialog,
    showError,
    showSuccess,
  });

  return (
    <>
      <View style={customStyles.tabContent}>
        <View style={customStyles.section}>
          {canManage ? (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                marginBottom: 8,
              }}>
              <TouchableOpacity
                onPress={() => openManageModal(null)}
                accessibilityLabel="Vincular franquia ou filial"
                testID="franchise-links-add-btn">
                <Icon name="add" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ) : null}
          {isLoading ? (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <ActivityIndicator
                size="small"
                color={customStyles.loadingIndicator?.color}
              />
            </View>
          ) : error ? (
            <Text style={customStyles.emptyText}>{error}</Text>
          ) : !links || links.length === 0 ? (
            <Text style={customStyles.emptyText}>
              {emptyText || 'Nenhuma franquia ou filial vinculada'}
            </Text>
          ) : (
            links.map(item => {
              const linkId = extractId(item?.id || item?.['@id']);
              const linkedPeople = item?.people || {};
              const typeLabel = franchiseLinkTypeLabel(
                item?.linkType,
                global.t,
              );

              return (
                <TouchableOpacity
                  key={String(item?.id || item?.['@id'])}
                  style={[
                    customStyles.listItem,
                    customStyles.listItemWithEndAction,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => {
                    const targetId = extractId(
                      linkedPeople?.id || linkedPeople?.['@id'],
                    );
                    if (!targetId) {
                      return;
                    }
                    peopleActions?.setItem?.(linkedPeople);
                    navigation.push('ClientDetails', { clientId: targetId });
                  }}
                  testID={`franchise-link-row-${linkId}`}>
                  <View style={customStyles.itemContent}>
                    <PeopleAvatar
                      people={linkedPeople}
                      size={40}
                      backgroundColor={
                        customStyles.listAvatarBrand?.backgroundColor
                      }
                      borderColor={customStyles.listAvatarBrand?.borderColor}
                      borderWidth={2}
                      textColor={customStyles.listAvatarText?.color}
                      style={customStyles.listAvatar}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={customStyles.itemText}>
                        {String(linkedPeople?.name || '-')}
                      </Text>
                      <Text style={customStyles.itemSubtext}>
                        {`ID: ${extractId(linkedPeople?.id || linkedPeople?.['@id']) || '-'}`}
                        {linkedPeople?.alias
                          ? ` - ${String(linkedPeople.alias)}`
                          : ''}
                      </Text>
                      <Text
                        style={[
                          customStyles.itemSubtext,
                          { marginTop: 2, fontWeight: '600' },
                        ]}>
                        {typeLabel}
                      </Text>
                      <Text style={customStyles.itemSubtext}>
                        {`Comissão: ${Number(item?.comission || 0)}% · Mínima: ${Number(item?.minimum_comission ?? item?.minimumComission ?? 0)}`}
                      </Text>
                    </View>
                  </View>
                  {canManage ? (
                    <View style={{ flexDirection: 'row' }}>
                      <TouchableOpacity
                        onPress={() => {
                          const link = linkedNormalized.find(
                            entry =>
                              entry.id === linkId ||
                              entry.linkedId ===
                                extractId(linkedPeople?.id || linkedPeople?.['@id']),
                          );
                          openManageModal(
                            link || normalizeFranchiseLink(item),
                          );
                        }}
                        style={{ padding: 6 }}
                        testID={`franchise-links-edit-${linkId}`}>
                        <Icon name="edit" size={18} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          const link = linkedNormalized.find(
                            entry =>
                              entry.id === linkId ||
                              entry.linkedId ===
                                extractId(linkedPeople?.id || linkedPeople?.['@id']),
                          );
                          handleManageDelete(link || { id: linkId });
                        }}
                        style={{ padding: 6 }}
                        testID={`franchise-links-delete-${linkId}`}>
                        <Icon name="delete-outline" size={18} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={customStyles.iconButtonGhost}>
                      <FeatherIcon
                        name="chevron-right"
                        size={16}
                        color={customStyles.iconButtonGhostIcon?.color}
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
        <FranchiseLinksManageModal
          visible={showManageModal}
          onClose={closeManageModal}
          editingLink={editingManageLink}
          formData={manageForm}
          setFormData={setManageForm}
          franchiseOptions={franchiseOptions}
          isSaving={isManageSaving}
          onSave={handleManageSave}
        />
      ) : null}
    </>
  );
};

export default FranchiseLinksTab;
