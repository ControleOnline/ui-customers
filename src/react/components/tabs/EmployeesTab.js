import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import FeatherIcon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { useStore, useStores } from '@store';
import AnimatedModal from '@controleonline/ui-common/src/react/components/AnimatedModal';
import PeopleAvatar from '@controleonline/ui-people/src/react/components/PeopleAvatar';
import { useMessage } from '@controleonline/ui-common/src/react/components/MessageService';
import {
  buildEmployeeContactsFromPeopleLinks,
  buildPeopleLinkReadParams,
} from './employeeContacts';

import {
  inlineStyle_243_18,
} from './EmployeesTab.styles';

import {
  extractId,
  normalizeIdentityValue,
  extractPeopleMediaUrl,
  parseBrDateToYmd,
  LINK_TYPE_OPTIONS,
  buildEmployeeDetailNavParams,
  resolveEmployeeContactLinkType,
  formatEmployeeContactTitle,
  formatEmployeeContactMeta,
  buildEmployeeCreatePayload,
} from './employeesTabHelpers';
import EmployeeCreateFormFields from './EmployeeCreateFormFields';


export {
  resolveEmployeeContactLinkType,
  formatEmployeeContactTitle,
  formatEmployeeContactMeta,
} from './employeesTabHelpers';

const EmployeesTab = ({
  client,
  customStyles,
  txt_title = global.t?.t('people','title','contact'),
  txt_title_emptyText = global.t?.t('people','title','emptyText'),
  txt_title_addPeople = global.t?.t('people','title','addPeople'),
  txt_message_loadError = global.t?.t('people','message','loadError'),
  txt_message_requiredError = global.t?.t('people','message','requiredError'),
  txt_message_createError = global.t?.t('people','message','createError'),
  txt_message_createSuccess = global.t?.t('people','message','createSuccess'),
}) => {
  const navigation = useNavigation();
  const { showError, showSuccess } = useMessage();

  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    alias: '',
    foundationDateBr: '',
    linkType: 'employee',
    peopleType: 'F',
  });
  const [linkTypeOptions, setLinkTypeOptions] = useState(
    LINK_TYPE_OPTIONS.map(option => ({
      value: option.value,
      label: '',
    })),
  );

  const peopleStore = useStores(state => state.people) || {};
  const peopleActions = peopleStore.actions || {};
  const peopleLinkStore = useStore('people_link');
  const getPeopleLinks = peopleLinkStore?.actions?.getItems;
  const removePeople = peopleActions?.remove;
  const removePeopleLink = peopleLinkStore?.actions?.remove;

  const parentPeopleId = useMemo(
    () => extractId(client?.id || client?.['@id']),
    [client?.id, client?.['@id']],
  );

  const fetchEmployees = useCallback(async () => {
    if (!parentPeopleId) {
      setEmployees([]);
      setError('');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Company contacts are stored in people_links; filtering /people can miss valid links.
      // Some backends reject array filters for linkType in this endpoint, so we fetch by company
      // and keep only the supported contact roles in the client.
      const response = await getPeopleLinks(
        buildPeopleLinkReadParams({
          companyId: parentPeopleId,
        }),
      );

      const normalized = buildEmployeeContactsFromPeopleLinks(response, {
        parentPeopleId,
        allowedLinkTypes: LINK_TYPE_OPTIONS.map(option => option.value),
      });
      // Avatares só a partir de peopleMedia no payload de people_links (#380).
      // Sem chamadas a /people_media nesta lista.
      setEmployees(
        normalized.map(item => {
          const avatarImageUrl =
            extractPeopleMediaUrl(item, 'avatar') ||
            extractPeopleMediaUrl(item?.people, 'avatar') ||
            '';

          return {
            ...item,
            avatar: avatarImageUrl || item?.avatar,
            avatarImageUrl,
          };
        }),
      );
    } catch {
      setEmployees([]);
      setError(txt_message_loadError);
    } finally {
      setIsLoading(false);
    }
  }, [getPeopleLinks, txt_message_loadError, parentPeopleId]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    setLinkTypeOptions(
      LINK_TYPE_OPTIONS.map(option => ({
        value: option.value,
        label: global.t?.t('people', 'label', option.translationKey),
      })),
    );
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      alias: '',
      foundationDateBr: '',
      linkType: 'employee',
      peopleType: 'F',
    });
  };

  const handleOpenModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSaveEmployee = async () => {
    const name = normalizeIdentityValue(formData.name);
    const alias = normalizeIdentityValue(formData.alias);

    if (!name || !alias) {
      showError(txt_message_requiredError);
      return;
    }

    let foundationDate;
    if (formData.foundationDateBr) {
      foundationDate = parseBrDateToYmd(formData.foundationDateBr);
      if (!foundationDate) {
        showError('Data invalida. Use o formato DD/MM/AAAA.');
        return;
      }
    }

    if (!peopleActions?.company || !parentPeopleId) {
      showError(txt_message_createError);
      return;
    }

    setIsSaving(true);
    try {
      const payload = buildEmployeeCreatePayload({
        name,
        alias,
        foundationDate,
        linkType: formData.linkType,
        parentPeopleId,
        peopleType: formData.peopleType,
      });

      await peopleActions.company(payload);
      showSuccess(txt_message_createSuccess);
      handleCloseModal();
      fetchEmployees();
    } catch (saveError) {
      showError(saveError?.message || txt_message_createError);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveEmployee = useCallback(
    employee => {
      const peopleId = extractId(employee?.id || employee?.['@id']);
      const linkId =
        extractId(employee?.peopleLinkId) ||
        extractId(employee?.peopleLink?.id || employee?.peopleLink?.['@id']);

      if (!peopleId && !linkId) {
        showError('Não foi possível identificar o colaborador para remover.');
        return;
      }

      Alert.alert(
        'Remover colaborador',
        'O colaborador será marcado como removido e o vínculo com a empresa será desativado. O registro permanece no banco (exclusão lógica). Deseja continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Remover',
            style: 'destructive',
            onPress: async () => {
              try {
                if (peopleId && typeof removePeople === 'function') {
                  await removePeople(peopleId);
                } else if (linkId && typeof removePeopleLink === 'function') {
                  await removePeopleLink(linkId);
                } else {
                  showError(
                    'Não foi possível remover o colaborador (ação indisponível).',
                  );
                  return;
                }
                showSuccess('Colaborador removido com sucesso.');
                setEmployees(prev =>
                  (prev || []).filter(
                    item =>
                      extractId(item?.id || item?.['@id']) !== peopleId &&
                      extractId(
                        item?.peopleLink?.id || item?.peopleLink?.['@id'],
                      ) !== linkId,
                  ),
                );
              } catch (error) {
                showError(
                  error?.message ||
                    'Não foi possível remover o colaborador. Verifique vínculos e tente novamente.',
                );
              }
            },
          },
        ],
      );
    },
    [removePeople, removePeopleLink, showError, showSuccess],
  );

  return (
    <>
      <View style={customStyles.tabContent}>
        <View style={customStyles.section}>
          <View style={customStyles.sectionHeader}>
            <Text style={customStyles.sectionTitle}>{txt_title}</Text>
            <TouchableOpacity
              onPress={handleOpenModal}
              style={customStyles.iconButtonPrimary}>
              <FeatherIcon
                name="plus"
                size={16}
                color={customStyles.iconButtonPrimaryIcon.color}
              />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={inlineStyle_243_18}>
              <ActivityIndicator
                size="small"
                color={customStyles.loadingIndicator.color}
              />
            </View>
          ) : error ? (
            <Text style={customStyles.txt_title_emptyText}>{error}</Text>
          ) : employees.length === 0 ? (
            <Text style={customStyles.txt_title_emptyText}>{txt_title_emptyText}</Text>
          ) : (
            employees.map(item => (
              <TouchableOpacity
                key={String(
                  item?.peopleLink?.id ||
                    item?.peopleLink?.['@id'] ||
                    item?.id ||
                    item?.['@id'],
                )}
                style={[
                  customStyles.listItem,
                  customStyles.listItemWithEndAction,
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  const params = buildEmployeeDetailNavParams({
                    employee: item,
                    parentPeopleId,
                  });
                  if (!params) {
                    return;
                  }

                  peopleActions?.setItem?.(item);
                  navigation.push('ClientDetails', params);
                }}>
                <View style={customStyles.itemContent}>
                  <PeopleAvatar
                    people={item}
                    size={40}
                    backgroundColor={customStyles.listAvatarBrand.backgroundColor}
                    borderColor={customStyles.listAvatarBrand.borderColor}
                    borderWidth={2}
                    textColor={customStyles.listAvatarText.color}
                    style={customStyles.listAvatar}
                  />
                  <View>
                    <Text style={customStyles.itemText}>
                      {formatEmployeeContactTitle(item)}
                    </Text>
                    <Text style={customStyles.itemSubtext}>
                      {formatEmployeeContactMeta(item)}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={customStyles.iconButtonGhost}>
                    <FeatherIcon
                      name="edit-2"
                      size={16}
                      color={customStyles.iconButtonGhostIcon.color}
                    />
                  </View>
                  <TouchableOpacity
                    style={customStyles.iconButtonGhost}
                    onPress={event => {
                      event?.stopPropagation?.();
                      handleRemoveEmployee(item);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Remover colaborador"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <FeatherIcon
                      name="trash-2"
                      size={16}
                      color="#B91C1C"
                    />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>
      <AnimatedModal
        visible={showModal}
        onRequestClose={handleCloseModal}
        style={{ maxHeight: '90%' }}>
        <EmployeeCreateFormFields
          formData={formData}
          setFormData={setFormData}
          linkTypeOptions={linkTypeOptions}
          isSaving={isSaving}
          onClose={handleCloseModal}
          onSave={handleSaveEmployee}
          title={txt_title_addPeople}
        />
      </AnimatedModal>
    </>
  );
};

export default EmployeesTab;
