import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  Keyboard,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Picker } from '@react-native-picker/picker';
import FeatherIcon from 'react-native-vector-icons/Feather';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useStore, useStores } from '@store';
import AnimatedModal from '@controleonline/ui-common/src/react/components/AnimatedModal';
import PeopleAvatar from '@controleonline/ui-people/src/react/components/PeopleAvatar';
import { useMessage } from '@controleonline/ui-common/src/react/components/MessageService';
// Identity fields preserve user capitalization (app-community#626).
import {
  buildEmployeeContactsFromPeopleLinks,
  buildPeopleLinkReadParams,
} from './employeeContacts';

import {
  inlineStyle_243_18,
  inlineStyle_279_8,
  inlineStyle_281_10,
  inlineStyle_294_12,
  inlineStyle_303_18,
  inlineStyle_308_14,
  inlineStyle_321_12,
  inlineStyle_324_18,
  inlineStyle_326_16,
  inlineStyle_338_16,
  inlineStyle_351_18,
  inlineStyle_353_16,
  inlineStyle_365_16,
  inlineStyle_378_18,
  inlineStyle_380_16,
  inlineStyle_389_16,
  inlineStyle_408_18,
  inlineStyle_422_18,
  inlineStyle_424_16,
  inlineStyle_433_16,
  inlineStyle_446_18,
  inlineStyle_460_12,
  inlineStyle_472_14,
  inlineStyle_480_20,
} from './EmployeesTab.styles';

import {
  extractId,
  normalizeIdentityValue,
  normalizeCollection,
  extractPeopleMediaUrl,
  formatDateInput,
  parseBrDateToYmd,
  LINK_TYPE_OPTIONS,
  resolveEmployeeLinkType,
  buildEmployeeDetailNavParams,
  resolveEmployeeContactLinkType,
  formatEmployeeContactTitle,
  formatEmployeeContactMeta,
  buildEmployeeCreatePayload,
} from './employeesTabHelpers';


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
  });
  const [linkTypeOptions, setLinkTypeOptions] = useState(
    LINK_TYPE_OPTIONS.map(option => ({
      value: option.value,
      label: '',
    })),
  );
  const pickerMode = Platform.OS === 'android' ? 'dropdown' : undefined;

  const peopleStore = useStores(state => state.people) || {};
  const peopleActions = peopleStore.actions || {};
  const peopleLinkStore = useStore('people_link');
  const getPeopleLinks = peopleLinkStore?.actions?.getItems;

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
                <View style={customStyles.iconButtonGhost}>
                  <FeatherIcon
                    name="edit-2"
                    size={16}
                    color={customStyles.iconButtonGhostIcon.color}
                  />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>
      <AnimatedModal
        visible={showModal}
        onRequestClose={handleCloseModal}
        style={inlineStyle_279_8}>
        <View
          style={inlineStyle_281_10}>
          <View
            style={inlineStyle_294_12}>
            <Text style={inlineStyle_303_18}>
              {txt_title_addPeople}
            </Text>
            <TouchableOpacity
              onPress={handleCloseModal}
              style={inlineStyle_308_14}>
              <Icon name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={inlineStyle_321_12}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag">
            <View style={inlineStyle_324_18}>
              <Text
                style={inlineStyle_326_16}>
                Nome *
              </Text>
              <TextInput
                value={formData.name}
                onChangeText={text => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Digite o nome"
                style={inlineStyle_338_16}
                placeholderTextColor="#6c757d"
              />
            </View>

            <View style={inlineStyle_351_18}>
              <Text
                style={inlineStyle_353_16}>
                Apelido *
              </Text>
              <TextInput
                value={formData.alias}
                onChangeText={text => setFormData(prev => ({ ...prev, alias: text }))}
                placeholder="Digite o apelido"
                style={inlineStyle_365_16}
                placeholderTextColor="#6c757d"
              />
            </View>

            <View style={inlineStyle_378_18}>
              <Text
                style={inlineStyle_380_16}>
                Data de Nascimento
              </Text>
              <View
                style={inlineStyle_389_16}>
                <Icon name="calendar-today" size={20} color="#6c757d" />
                <TextInput
                  value={formData.foundationDateBr}
                  onChangeText={text =>
                    setFormData(prev => ({
                      ...prev,
                      foundationDateBr: formatDateInput(text),
                    }))
                  }
                  placeholder="DD/MM/AAAA"
                  style={inlineStyle_408_18}
                  placeholderTextColor="#6c757d"
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
            </View>

            <View style={inlineStyle_422_18}>
              <Text
                style={inlineStyle_424_16}>
                Tipo de Vinculo
              </Text>
              <View
                style={inlineStyle_433_16}>
                <Picker
                  selectedValue={formData.linkType}
                  onValueChange={value =>
                    setFormData(prev => ({ ...prev, linkType: value }))
                  }
                  mode={pickerMode}
                  style={inlineStyle_446_18}>
                  {linkTypeOptions.map(option => (
                    <Picker.Item
                      key={option.value}
                      label={option.label}
                      value={option.value}
                    />
                  ))}
                </Picker>
              </View>
            </View>
          </ScrollView>

          <View
            style={inlineStyle_460_12}>
            <TouchableOpacity
              onPress={() => {
                Keyboard.dismiss();
                handleCloseModal();
              }}
              style={inlineStyle_472_14}>
              <Text style={inlineStyle_480_20}>
                Cancelar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Keyboard.dismiss();
                handleSaveEmployee();
              }}
              disabled={isSaving}
              style={[
                customStyles.saveButton,
                isSaving && customStyles.saveButtonDisabled,
              ]}>
              {isSaving ? (
                <ActivityIndicator
                  size="small"
                  color={customStyles.saveButtonText.color}
                />
              ) : (
                <>
                  <FeatherIcon
                    name="save"
                    size={16}
                    color={customStyles.iconButtonPrimaryIcon.color}
                  />
                  <Text style={customStyles.saveButtonText}>Salvar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </AnimatedModal>
    </>
  );
};

export default EmployeesTab;
