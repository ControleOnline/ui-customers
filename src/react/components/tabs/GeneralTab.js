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
import ContactTab from './ContactTab';
import DocumentsTab from './DocumentsTab';
import AddressesTab from './AddressesTab';
import PeopleCategoriesPanel from './PeopleCategoriesPanel';
import { createGeneralTabStyles } from './GeneralTab.styles';
import {
  normalizeIdentityValue,
  extractId,
  normalizeEnable,
  formatYmdToBr,
  formatDateInput,
  parseBrDateToYmd,
  LINK_TYPE_OPTIONS,
  normalizeLinkType,
  PEOPLE_TYPE_OPTIONS,
  normalizePeopleType,
  toPeopleIri,
} from './generalTabHelpers';
import FranchiseCommissionSection from './FranchiseCommissionSection';

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
      peopleType: normalizePeopleType(client?.peopleType || 'J'),
      linkType: normalizeLinkType(initialContactLinkType),
    };

    setRegistrationForm(initial);
    setOriginalRegistrationForm(initial);
  }, [client?.id, client?.name, client?.alias, client?.foundationDate, client?.enable, client?.enabled, client?.peopleType, initialContactLinkType]);

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

  const isPessoaFisica = normalizePeopleType(registrationForm.peopleType) === 'F';
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
      normalizePeopleType(registrationForm.peopleType) !==
        normalizePeopleType(originalRegistrationForm.peopleType) ||
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
      // people_link currently only exposes GetCollection on the API.
      // Persist linkType only when it actually changed to avoid Method Not Allowed
      // on unrelated cadastral saves (e.g. enable/active toggle).
      const linkTypeChanged =
        canEditLinkType &&
        normalizeLinkType(registrationForm.linkType) !==
          normalizeLinkType(originalRegistrationForm.linkType);

      if (linkTypeChanged && peopleLinkActions?.save) {
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

      const peopleType = normalizePeopleType(registrationForm.peopleType);
      const payload = {
        name,
        alias,
        enable: Boolean(registrationForm.enable),
        peopleType,
      };

      if (foundationDate) {
        payload.foundationDate = foundationDate;
      }

      await onSaveClientData(payload);

      onUpdateClient?.('name', name);
      onUpdateClient?.('alias', alias);
      onUpdateClient?.('enable', Boolean(registrationForm.enable));
      onUpdateClient?.('peopleType', peopleType);
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
        peopleType,
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
            onChangeText={text => setRegistrationForm(prev => ({ ...prev, name: text }))}
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
            onChangeText={text => setRegistrationForm(prev => ({ ...prev, alias: text }))}
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

        {isEditing && (
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Tipo</Text>
            <View style={styles.inputRow}>
              <Picker
                selectedValue={normalizePeopleType(registrationForm.peopleType)}
                onValueChange={value =>
                  setRegistrationForm(prev => ({
                    ...prev,
                    peopleType: normalizePeopleType(value),
                  }))
                }
                mode={pickerMode}
                style={styles.inputRowField}>
                {PEOPLE_TYPE_OPTIONS.map(option => (
                  <Picker.Item
                    key={option.value}
                    label={option.label}
                    value={option.value}
                  />
                ))}
              </Picker>
            </View>
          </View>
        )}

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
      <FranchiseCommissionSection
        client={client}
        parentCompanyIri={parentCompanyIri}
        isEditing={isEditing}
      />
      <PeopleCategoriesPanel
        client={client}
        isEditing={isEditing}
        parentCompanyIri={parentCompanyIri}
      />
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
