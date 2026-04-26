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
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useStores } from '@store';
import AnimatedModal from '@controleonline/ui-crm/src/react/components/AnimatedModal';
import { useMessage } from '@controleonline/ui-common/src/react/components/MessageService';
import { colors } from '@controleonline/../../src/styles/colors';

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
  inlineStyle_491_14,
  inlineStyle_498_20,
} from './EmployeesTab.styles';

const extractId = value => String(value || '').replace(/\D/g, '');

const formatDateInput = text => {
  const numbers = String(text || '').replace(/\D/g, '').slice(0, 8);
  if (!numbers) {
    return '';
  }

  if (numbers.length <= 2) {
    return numbers;
  }

  if (numbers.length <= 4) {
    return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
  }

  return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4)}`;
};

const parseBrDateToYmd = value => {
  const formatted = formatDateInput(value);
  if (formatted.length !== 10) {
    return null;
  }

  const [day, month, year] = formatted.split('/').map(v => parseInt(v, 10));
  if (!day || !month || !year) {
    return null;
  }

  const candidate = new Date(year, month - 1, day);
  const isValid =
    candidate.getFullYear() === year &&
    candidate.getMonth() === month - 1 &&
    candidate.getDate() === day;

  if (!isValid) {
    return null;
  }

  return `${year.toString().padStart(4, '0')}-${month
    .toString()
    .padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
};

const LINK_TYPE_OPTIONS = [
  { value: 'employee', translationKey: 'employee' },
  { value: 'owner', translationKey: 'owner' },
  { value: 'director', translationKey: 'director' },
  { value: 'manager', translationKey: 'manager' },
];

const normalizeLinkType = value => {
  const normalized = String(value || '').trim().toLowerCase();
  return ['employee', 'owner', 'director', 'manager'].includes(normalized)
    ? normalized
    : 'employee';
};

const resolveEmployeeLinkType = employee =>
  normalizeLinkType(
    employee?.linkType ||
      employee?.link?.linkType ||
      employee?.peopleLink?.linkType ||
      (Array.isArray(employee?.link) ? employee.link[0]?.linkType : ''),
  );

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

  const parentPeopleId = useMemo(
    () => extractId(client?.id || client?.['@id']),
    [client?.id, client?.['@id']],
  );

  const fetchEmployees = useCallback(async () => {
    if (!parentPeopleId || !peopleActions?.getItems) {
      setEmployees([]);
      setError('');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await peopleActions.getItems({
        'link.company': `/people/${parentPeopleId}`,
        'link.linkType': ['employee', 'owner', 'director', 'manager'],
        peopleType: 'F',
        itemsPerPage: 100,
      });

      const items = Array.isArray(response) ? response : [];
      const normalized = items.filter(item => {
        const itemId = extractId(item?.id || item?.['@id']);
        return (
          itemId &&
          itemId !== parentPeopleId &&
          String(item?.peopleType || '').toUpperCase() !== 'J'
        );
      });

      setEmployees(normalized);
    } catch (fetchError) {
      setEmployees([]);
      setError(txt_message_loadError);
    } finally {
      setIsLoading(false);
    }
  }, [txt_message_loadError, parentPeopleId, peopleActions]);

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
    const name = String(formData.name || '').trim();
    const alias = String(formData.alias || '').trim();

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
      const payload = {
        name,
        alias,
        peopleType: 'F',
        company: `/people/${parentPeopleId}`,
        linkType: formData.linkType,
        'extra-data': {},
      };

      if (foundationDate) {
        payload.foundationDate = foundationDate;
      }

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
            <TouchableOpacity onPress={handleOpenModal}>
              <Icon name="add" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={inlineStyle_243_18}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : error ? (
            <Text style={customStyles.txt_title_emptyText}>{error}</Text>
          ) : employees.length === 0 ? (
            <Text style={customStyles.txt_title_emptyText}>{txt_title_emptyText}</Text>
          ) : (
            employees.map(item => (
              <TouchableOpacity
                key={String(item?.id || item?.['@id'])}
                style={customStyles.listItem}
                activeOpacity={0.8}
                onPress={() => {
                  navigation.setParams?.({ initialTab: 'contacts' });
                  navigation.push('ClientDetails', {
                    client: item,
                    context: {
                      context: 'contacts',
                      parentCompanyIri: `/people/${parentPeopleId}`,
                      linkType: resolveEmployeeLinkType(item),
                    },
                  });
                }}>
                <View style={customStyles.itemContent}>
                  <Icon name="person" size={20} color={colors.primary} />
                  <View>
                    <Text style={customStyles.itemText}>
                      {String(item?.name || '-')}
                    </Text>
                    <Text style={customStyles.itemSubtext}>
                      {`ID: ${extractId(item?.id || item?.['@id']) || '-'}`}
                      {item?.alias ? ` - ${String(item.alias)}` : ''}
                    </Text>
                  </View>
                </View>
                <Icon name="chevron-right" size={20} color="#94A3B8" />
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
              style={inlineStyle_491_14({
                colors: colors,
                isSaving: isSaving,
              })}>
              <Text style={inlineStyle_498_20}>
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </AnimatedModal>
    </>
  );
};

export default EmployeesTab;
