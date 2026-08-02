import React, { useEffect, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useStore } from '@store';
import {useMessage} from '@controleonline/ui-common/src/react/components/MessageService';
import {
  formatDisplayUppercase,
  uppercaseText,
} from '@controleonline/ui-common/src/react/utils/entityDisplay';
import ContactTab from './ContactTab';
import DocumentsTab from './DocumentsTab';
import AddressesTab from './AddressesTab';
import { createGeneralTabStyles } from './GeneralTab.styles';
const normalizeText = value => String(value || '').replace(/\s+/g, ' ').trim();
const normalizeIdentityValue = value => formatDisplayUppercase(normalizeText(value));
const extractId = value => String(value || '').replace(/\D/g, '');

const normalizeEnable = value => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === '1' || normalized === 'true';
  }

  return false;
};

const formatYmdToBr = value => {
  if (!value) {
    return '';
  }

  const normalized = String(value).split('T')[0];
  const parts = normalized.split('-');
  if (parts.length !== 3) {
    return '';
  }

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

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
  { value: 'courier', translationKey: 'courier' },
];

const normalizeLinkType = value => {
  const normalized = String(value || '').trim().toLowerCase();
  return ['employee', 'owner', 'director', 'manager', 'courier'].includes(normalized)
    ? normalized
    : 'employee';
};

const toPeopleIri = value => {
  const directIri = String(value?.['@id'] || '').trim();
  if (directIri.startsWith('/people/')) {
    return directIri;
  }

  const id = String(value?.id || '').replace(/\D/g, '');
  return id ? `/people/${id}` : '';
};

const GeneralTab = ({
  client,
  customStyles,
  isEditing,
  onUpdateClient,
  onSaveClientData,
  parentCompanyIri,
  initialContactLinkType,
  onChangeClientAvatar,
  isSavingClientAvatar = false,
}) => {
  const {showError, showSuccess} = useMessage();
  const peopleLinkStore = useStore('people_link');
  const themeStore = useStore('theme');
  const themeColors = themeStore.getters.colors;
  const styles = useMemo(() => createGeneralTabStyles(themeColors), [themeColors]);
  const peopleLinkActions = peopleLinkStore?.actions || {};
  const [isSavingRegistration, setIsSavingRegistration] = useState(false);
  const [isSavingLinkType, setIsSavingLinkType] = useState(false);
  const [peopleLinkId, setPeopleLinkId] = useState('');
  const [linkTypeOptions, setLinkTypeOptions] = useState(
    LINK_TYPE_OPTIONS.map(option => ({
      value: option.value,
      label: option.value,
    })),
  );
  const [registrationForm, setRegistrationForm] = useState({
    name: '',
    alias: '',
    dateBr: '',
    enable: false,
    peopleType: 'J',
    linkType: 'employee',
  });
  const [originalRegistrationForm, setOriginalRegistrationForm] = useState({
    name: '',
    alias: '',
    dateBr: '',
    enable: false,
    peopleType: 'J',
    linkType: 'employee',
  });

  const pickerMode = Platform.OS === 'android' ? 'dropdown' : undefined;
  const contactPeopleIri = useMemo(() => toPeopleIri(client), [client]);
  const canEditLinkType =
    isEditing &&
    String(registrationForm.peopleType || '').toUpperCase() === 'F' &&
    String(parentCompanyIri || '').startsWith('/people/') &&
    String(contactPeopleIri || '').startsWith('/people/');

  useEffect(() => {
    const initial = {
      name: normalizeIdentityValue(client?.name),
      alias: normalizeIdentityValue(client?.alias),
      dateBr: formatYmdToBr(client?.foundationDate),
      enable: normalizeEnable(client?.enable ?? client?.enabled),
      peopleType: String(client?.peopleType || 'J').toUpperCase(),
      linkType: normalizeLinkType(initialContactLinkType),
    };

    setRegistrationForm(initial);
    setOriginalRegistrationForm(initial);
  }, [client?.id, client?.name, client?.alias, client?.foundationDate, client?.peopleType, initialContactLinkType]);

  useEffect(() => {
    setLinkTypeOptions(
      LINK_TYPE_OPTIONS.map(option => ({
        value: option.value,
        label: global.t?.t('people', 'label', option.translationKey),
      })),
    );
  }, []);

  useEffect(() => {
    if (!canEditLinkType || !peopleLinkActions?.getItems) {
      return;
    }

    let cancelled = false;

    peopleLinkActions
      .getItems({
        people: extractId(contactPeopleIri),
        company: extractId(parentCompanyIri),
      })
      .then(items => {
        if (cancelled || !Array.isArray(items) || items.length === 0) {
          return;
        }

        const link = items[0];
        const nextLinkType = normalizeLinkType(link?.linkType);
        const nextLinkId = String(link?.id || link?.['@id'] || '').replace(/\D/g, '');

        setPeopleLinkId(nextLinkId);
        setRegistrationForm(prev => ({ ...prev, linkType: nextLinkType }));
        setOriginalRegistrationForm(prev => ({ ...prev, linkType: nextLinkType }));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [canEditLinkType, contactPeopleIri, parentCompanyIri, peopleLinkActions]);

  const isPessoaFisica = registrationForm.peopleType === 'F';
  const isAvatarUploadDisabled = isSavingClientAvatar;
  const avatarUploadLabel = isPessoaFisica ? 'subir avatar' : 'subir ícone';
  const nameLabel = isPessoaFisica ? global.t?.t('users','label','name') : global.t?.t('users','label','companyName');
  const aliasLabel = isPessoaFisica ? global.t?.t('users','label','nickname') : global.t?.t('users','label','fantasyName');
  const dateLabel = isPessoaFisica ? global.t?.t('users','label','birthDate') : global.t?.t('users','label','foundationDate');

  const hasRegistrationChanges = useMemo(() => {
    return (
      normalizeIdentityValue(registrationForm.name) !== normalizeIdentityValue(originalRegistrationForm.name) ||
      normalizeIdentityValue(registrationForm.alias) !== normalizeIdentityValue(originalRegistrationForm.alias) ||
      String(registrationForm.dateBr || '') !== String(originalRegistrationForm.dateBr || '') ||
      Boolean(registrationForm.enable) !== Boolean(originalRegistrationForm.enable) ||
      (canEditLinkType &&
        normalizeLinkType(registrationForm.linkType) !==
          normalizeLinkType(originalRegistrationForm.linkType))
    );
  }, [canEditLinkType, registrationForm, originalRegistrationForm]);

  const saveRegistration = async () => {
    if (!isEditing || isSavingRegistration || isSavingLinkType || !hasRegistrationChanges) {
      return;
    }

    const name = normalizeIdentityValue(registrationForm.name);
    const alias = normalizeIdentityValue(registrationForm.alias);

    if (!name || !alias) {
      showError?.(GeneralTab.t?.t('users','error','nameAndAliasRequired'));
      return;
    }

    let foundationDate;
    if (registrationForm.dateBr) {
      foundationDate = parseBrDateToYmd(registrationForm.dateBr);
      if (!foundationDate) {
        showError?.(GeneralTab.t?.t('users','error','invalidDate'));
        return;
      }
    }

    if (!onSaveClientData) {
      showError?.(GeneralTab.t?.t('users','error','saveUnavailable'));
      return;
    }

    setIsSavingRegistration(true);
    try {
      if (canEditLinkType && peopleLinkActions?.save) {
        setIsSavingLinkType(true);
        const savedLink = await peopleLinkActions.save({
          ...(peopleLinkId ? { id: peopleLinkId } : {}),
          company: parentCompanyIri,
          people: contactPeopleIri,
          linkType: normalizeLinkType(registrationForm.linkType),
        });

        const nextLinkId = String(savedLink?.id || savedLink?.['@id'] || '').replace(/\D/g, '');
        if (nextLinkId) {
          setPeopleLinkId(nextLinkId);
        }
      }

      const payload = {
        name,
        alias,
        enable: Boolean(registrationForm.enable),
      };

      if (foundationDate) {
        payload.foundationDate = foundationDate;
      }

      await onSaveClientData(payload);

      onUpdateClient?.('name', name);
      onUpdateClient?.('alias', alias);
      onUpdateClient?.('enable', Boolean(registrationForm.enable));
      if (canEditLinkType) {
        onUpdateClient?.('linkType', normalizeLinkType(registrationForm.linkType));
      }
      if (foundationDate) {
        onUpdateClient?.('foundationDate', foundationDate);
      }

      const updated = {
        ...registrationForm,
        name,
        alias,
        enable: Boolean(registrationForm.enable),
        dateBr: foundationDate ? formatYmdToBr(foundationDate) : registrationForm.dateBr,
        linkType: normalizeLinkType(registrationForm.linkType),
      };

      setRegistrationForm(updated);
      setOriginalRegistrationForm(updated);
      showSuccess?.(global.t?.t('users','success','registrationUpdated'));
    } catch {
      showError?.(global.t?.t('users','error','registrationUpdateFailed'));
    } finally {
      setIsSavingLinkType(false);
      setIsSavingRegistration(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      nestedScrollEnabled
      showsVerticalScrollIndicator={false}>
      <View style={customStyles.section}>
        <View style={customStyles.sectionHeader}>
          <Text style={customStyles.sectionTitle}>Dados Cadastrais</Text>
        </View>

        {isEditing && onChangeClientAvatar && (
          <View style={styles.fieldGroupLarge}>
            <Text style={styles.fieldLabel}>Imagem</Text>
            <TouchableOpacity
              onPress={onChangeClientAvatar}
              disabled={isAvatarUploadDisabled}
              activeOpacity={0.85}
              accessibilityLabel={avatarUploadLabel}
              style={[
                styles.uploadImageButton,
                isAvatarUploadDisabled ? styles.saveButtonDisabled : null,
              ]}>
              {isSavingClientAvatar ? (
                <ActivityIndicator size="small" color={themeColors.buttonText} />
              ) : (
                <>
                  <Icon
                    name="photo-camera"
                    size={18}
                    color={themeColors.buttonIcon}
                  />
                  <Text style={styles.uploadImageButtonText}>
                    {avatarUploadLabel}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>
            {nameLabel}
          </Text>
          <TextInput
            value={registrationForm.name}
            onChangeText={text => setRegistrationForm(prev => ({ ...prev, name: uppercaseText(text) }))}
            placeholder={nameLabel}
            style={styles.input}
            placeholderTextColor={themeColors.inputPlaceholderText}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>
            {aliasLabel}
          </Text>
          <TextInput
            value={registrationForm.alias}
            onChangeText={text => setRegistrationForm(prev => ({ ...prev, alias: uppercaseText(text) }))}
            placeholder={aliasLabel}
            style={styles.input}
            placeholderTextColor={themeColors.inputPlaceholderText}
          />
        </View>

        <View style={styles.fieldGroupLarge}>
          <Text style={styles.fieldLabel}>
            {dateLabel}
          </Text>
          <View style={styles.inputRow}>
            <Icon
              name="event"
              size={18}
              color={themeColors.inputIcon}
              style={styles.inputIcon}
            />
            <TextInput
              value={registrationForm.dateBr}
              onChangeText={text =>
                setRegistrationForm(prev => ({
                  ...prev,
                  dateBr: formatDateInput(text),
                }))
              }
              placeholder="DD/MM/AAAA" // @todo // mostrar também no padrão americano, MM/DD/AAAA
              keyboardType="numeric"
              maxLength={10}
              style={styles.inputRowField}
              placeholderTextColor={themeColors.inputPlaceholderText}
            />
          </View>
        </View>

        <View style={styles.fieldGroupLarge}>
          <Text style={styles.fieldLabel}>
            Acesso do usuário
          </Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>
              {registrationForm.enable ? 'Liberado' : 'Bloqueado'}
            </Text>
            <Switch
              value={Boolean(registrationForm.enable)}
              onValueChange={value =>
                setRegistrationForm(prev => ({
                  ...prev,
                  enable: value,
                }))
              }
              trackColor={{
                false: themeColors.switchOffTrack,
                true: themeColors.switchOnTrack,
              }}
              thumbColor={
                registrationForm.enable
                  ? themeColors.switchOnThumb
                  : themeColors.switchOffThumb
              }
            />
          </View>
        </View>

        {canEditLinkType && (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Tipo de Vinculo</Text>
            <View style={styles.inputRow}>
              <Picker
                selectedValue={registrationForm.linkType}
                onValueChange={value =>
                  setRegistrationForm(prev => ({
                    ...prev,
                    linkType: normalizeLinkType(value),
                  }))
                }
                mode={pickerMode}
                style={styles.inputRowField}>
                {linkTypeOptions.map(option => (
                  <Picker.Item
                    key={option.value}
                    label={option.label || option.value}
                    value={option.value}
                  />
                ))}
              </Picker>
            </View>
          </View>
        )}

        {isEditing && (
          <TouchableOpacity
            onPress={saveRegistration}
            disabled={!hasRegistrationChanges || isSavingRegistration || isSavingLinkType}
            activeOpacity={0.85}
            style={[
              styles.saveButton,
              !hasRegistrationChanges || isSavingRegistration || isSavingLinkType
                ? styles.saveButtonDisabled
                : null,
            ]}>
            {isSavingRegistration || isSavingLinkType ? (
              <ActivityIndicator size="small" color={themeColors.buttonText} />
            ) : (
              <Text
                style={[
                  styles.saveButtonText,
                  !hasRegistrationChanges || isSavingRegistration || isSavingLinkType
                    ? styles.saveButtonTextDisabled
                    : null,
                ]}>
                {global.t?.t('users','button','saveChanges')}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
      {isPessoaFisica && (
        <ContactTab
          client={client}
          customStyles={customStyles}
          isEditing={isEditing}
          onUpdateClient={onUpdateClient}
        />
      )}
      <DocumentsTab
        client={client}
        customStyles={customStyles}
        isEditing={isEditing}
        onUpdateClient={onUpdateClient}
      />
      <AddressesTab
        client={client}
        customStyles={customStyles}
        isEditing={isEditing}
        onUpdateClient={onUpdateClient}
      />
    </ScrollView>
  );
};

export default GeneralTab;
