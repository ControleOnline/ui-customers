import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  ActivityIndicator,
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
  resolveEmployeeContactLinkType,
  formatEmployeeContactTitle,
  formatEmployeeContactMeta,
  buildEmployeeCreatePayload,
} from './employeesTabHelpers';
import EmployeeCreateFormFields from './EmployeeCreateFormFields';
import {useEmployeeUnlink} from './useEmployeeUnlink';
import EmployeeContactRow from './EmployeeContactRow';


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
  const { showDialog, showError, showSuccess } = useMessage();

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

  const {handleRemoveEmployee} = useEmployeeUnlink({
    removePeople,
    removePeopleLink,
    showDialog,
    showError,
    showSuccess,
    setEmployees,
  });

  const fetchEmployees = useCallback(async () => {
    if (!parentPeopleId) {
      setEmployees([]);
      setError('');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Company contacts live in people_links. Request contact roles + a high
      // itemsPerPage so large companies are not truncated to the first API page
      // (app-community#636 — employee missing while owners still listed).
      const allowedLinkTypes = LINK_TYPE_OPTIONS.map(option => option.value);
      const response = await getPeopleLinks(
        buildPeopleLinkReadParams({
          companyId: parentPeopleId,
          linkTypes: allowedLinkTypes,
          itemsPerPage: 100,
        }),
      );

      const normalized = buildEmployeeContactsFromPeopleLinks(response, {
        parentPeopleId,
        allowedLinkTypes,
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

  useFocusEffect(
    useCallback(() => {
      fetchEmployees();
    }, [fetchEmployees]),
  );

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
              <EmployeeContactRow
                key={String(
                  item?.peopleLink?.id ||
                    item?.peopleLink?.['@id'] ||
                    item?.id ||
                    item?.['@id'],
                )}
                item={item}
                parentPeopleId={parentPeopleId}
                customStyles={customStyles}
                peopleActions={peopleActions}
                navigation={navigation}
                onRemove={handleRemoveEmployee}
              />
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
