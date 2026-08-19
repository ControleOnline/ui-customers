/**
 * Franchise commission fields for client-details GeneralTab.
 * Shown only when the viewed client is a franchisee of the main company
 * (people_link linkType=franchisee). Editable for ROLE_SUPER / franchisor owner.
 */
import React, {useEffect, useMemo, useState} from 'react';

import {
  ActivityIndicator,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import FeatherIcon from 'react-native-vector-icons/Feather';
import {useStore} from '@store';
import {useMessage} from '@controleonline/ui-common/src/react/components/MessageService';
import {
  buildFranchiseeLinkParams,
  canEditFranchiseCommission,
  extractId,
  formatMinimum,
  formatPercent,
  normalizeCommissionFields,
  pickFranchiseeLink,
  validateCommissionFields,
} from './franchiseCommissionHelpers';
import {createGeneralTabStyles} from './GeneralTab.styles';

const FranchiseCommissionSection = ({
  client,
  parentCompanyIri = '',
  isEditing = false,
}) => {
  const {showError, showSuccess} = useMessage();
  const peopleLinkStore = useStore('people_link');
  const peopleStore = useStore('people');
  const authStore = useStore('auth');
  const themeStore = useStore('theme');
  const themeColors = themeStore.getters.colors;
  const styles = useMemo(() => createGeneralTabStyles(themeColors), [themeColors]);

  const peopleLinkActions = peopleLinkStore?.actions || {};
  const currentCompany = peopleStore?.getters?.currentCompany || null;
  const authUser = authStore?.getters?.user || null;

  const clientId = extractId(client?.id || client?.['@id']);
  const franchisorId =
    extractId(parentCompanyIri) ||
    extractId(currentCompany?.id || currentCompany?.['@id']);

  const [link, setLink] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({comission: '', minimum_comission: ''});

  const editable = canEditFranchiseCommission({
    user: authUser,
    currentCompany,
  });

  useEffect(() => {
    if (!clientId || !franchisorId || !peopleLinkActions?.getItems) {
      setLink(null);
      return undefined;
    }

    let cancelled = false;
    setIsLoading(true);

    peopleLinkActions
      .getItems(
        buildFranchiseeLinkParams({
          peopleId: clientId,
          companyId: franchisorId,
        }),
      )
      .then(items => {
        if (cancelled) {
          return;
        }
        const next = pickFranchiseeLink(items, {
          peopleId: clientId,
          companyId: franchisorId,
        });
        setLink(next);
      })
      .catch(() => {
        if (!cancelled) {
          setLink(null);
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
  }, [clientId, franchisorId, peopleLinkActions]);

  if (isLoading) {
    return (
      <View style={styles.fieldGroupLarge}>
        <ActivityIndicator size="small" color={themeColors.primary} />
      </View>
    );
  }

  if (!link) {
    return null;
  }

  const fields = normalizeCommissionFields(link);
  const linkId = extractId(link?.id || link?.['@id']);

  const openEdit = () => {
    setForm({
      comission: String(fields.comission ?? ''),
      minimum_comission: String(fields.minimum_comission ?? ''),
    });
    setModalVisible(true);
  };

  const save = async () => {
    const validated = validateCommissionFields({
      comission: form.comission,
      minimum_comission: form.minimum_comission,
    });
    if (!validated.ok) {
      showError?.(
        global.t?.t('people', 'error', validated.error) ||
          'Valores de comissão inválidos',
      );
      return;
    }
    if (!linkId || !peopleLinkActions?.save) {
      showError?.(
        global.t?.t('users', 'error', 'saveUnavailable') || 'Salvar indisponível',
      );
      return;
    }

    setIsSaving(true);
    try {
      const saved = await peopleLinkActions.save({
        id: linkId,
        comission: validated.comission,
        minimum_comission: validated.minimum_comission,
      });
      setLink(prev => ({
        ...(prev || {}),
        ...(saved || {}),
        comission: validated.comission,
        minimum_comission: validated.minimum_comission,
      }));
      setModalVisible(false);
      showSuccess?.(
        global.t?.t('people', 'success', 'commissionUpdated') ||
          'Comissão atualizada',
      );
    } catch {
      showError?.(
        global.t?.t('people', 'error', 'commissionUpdateFailed') ||
          'Falha ao atualizar comissão',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.fieldGroupLarge}>
      <Text style={styles.fieldLabel}>
        {global.t?.t('people', 'label', 'franchiseCommission') ||
          'Comissão da franquia'}
      </Text>

      <View style={styles.switchRow}>
        <View style={{flex: 1}}>
          <Text style={styles.switchLabel}>
            {global.t?.t('people', 'label', 'comission') || 'Comissão'}:{' '}
            {formatPercent(fields.comission)}
          </Text>
          <Text style={[styles.switchLabel, {marginTop: 4}]}>
            {global.t?.t('people', 'label', 'minimumComission') ||
              'Comissão mínima'}
            : {formatMinimum(fields.minimum_comission)}
          </Text>
        </View>
        {isEditing && editable ? (
          <TouchableOpacity
            onPress={openEdit}
            accessibilityLabel="edit-franchise-commission"
            testID="edit-franchise-commission"
            style={{padding: 8}}>
            <FeatherIcon
              name="edit-2"
              size={16}
              color={themeColors.inputIcon || themeColors.textSecondary}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !isSaving && setModalVisible(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            padding: 24,
          }}>
          <View
            style={{
              backgroundColor: themeColors.pageBackground || '#fff',
              borderRadius: 12,
              padding: 16,
            }}>
            <Text style={[styles.fieldLabel, {marginBottom: 12}]}>
              {global.t?.t('people', 'title', 'editFranchiseCommission') ||
                'Editar comissão da franquia'}
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                {global.t?.t('people', 'label', 'comission') ||
                  'Comissão (%)'}
              </Text>
              <TextInput
                value={form.comission}
                onChangeText={text =>
                  setForm(prev => ({...prev, comission: text.replace(',', '.')}))
                }
                keyboardType="decimal-pad"
                style={styles.input}
                testID="franchise-comission-input"
                placeholderTextColor={themeColors.inputPlaceholderText}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                {global.t?.t('people', 'label', 'minimumComission') ||
                  'Comissão mínima'}
              </Text>
              <TextInput
                value={form.minimum_comission}
                onChangeText={text =>
                  setForm(prev => ({
                    ...prev,
                    minimum_comission: text.replace(',', '.'),
                  }))
                }
                keyboardType="decimal-pad"
                style={styles.input}
                testID="franchise-minimum-comission-input"
                placeholderTextColor={themeColors.inputPlaceholderText}
              />
            </View>

            <TouchableOpacity
              onPress={save}
              disabled={isSaving}
              testID="save-franchise-commission"
              style={[
                styles.saveButton,
                isSaving ? styles.saveButtonDisabled : null,
                {marginTop: 8},
              ]}>
              {isSaving ? (
                <ActivityIndicator
                  size="small"
                  color={themeColors.buttonText}
                />
              ) : (
                <Text style={styles.saveButtonText}>
                  {global.t?.t('users', 'button', 'saveChanges') || 'Salvar'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => !isSaving && setModalVisible(false)}
              disabled={isSaving}
              style={{marginTop: 12, alignItems: 'center'}}>
              <Text style={styles.switchLabel}>
                {global.t?.t('common', 'button', 'cancel') || 'Cancelar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default FranchiseCommissionSection;
