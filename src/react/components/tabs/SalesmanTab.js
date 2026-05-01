import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  Keyboard,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '@store';
import AnimatedModal from '@controleonline/ui-crm/src/react/components/AnimatedModal';
import { useMessage } from '@controleonline/ui-common/src/react/components/MessageService';
import { colors } from '@controleonline/../../src/styles/colors';
import { inlineStyle_46_16 } from './SalesmanTab.styles';
import {
  buildAvailableSalesmanOptions,
  canManageSalesmen,
  extractEntityId,
  formatCommissionLabel,
  normalizeCommissionValue,
  normalizeSalesmanLink,
  toPeopleIri,
} from './salesmanTab.helpers';

const inlineStyle_headerActions = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
};

const inlineStyle_itemMeta = {
  marginTop: 4,
};

const inlineStyle_iconButton = {
  width: 36,
  height: 36,
  borderRadius: 18,
  alignItems: 'center',
  justifyContent: 'center',
};

const inlineStyle_modalCard = {
  backgroundColor: '#FFFFFF',
  borderRadius: 20,
  padding: 20,
  width: '100%',
  maxWidth: 420,
  alignSelf: 'center',
  gap: 18,
};

const inlineStyle_modalHeader = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const inlineStyle_modalTitle = {
  fontSize: 18,
  fontWeight: '700',
  color: '#0F172A',
};

const inlineStyle_fieldGroup = {
  gap: 8,
};

const inlineStyle_fieldLabel = {
  fontSize: 14,
  fontWeight: '600',
  color: '#334155',
};

const inlineStyle_pickerContainer = {
  borderWidth: 1,
  borderColor: '#CBD5E1',
  borderRadius: 12,
  overflow: 'hidden',
  backgroundColor: '#FFFFFF',
};

const inlineStyle_input = {
  borderWidth: 1,
  borderColor: '#CBD5E1',
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 12,
  fontSize: 15,
  color: '#0F172A',
  backgroundColor: '#FFFFFF',
};

const inlineStyle_modalActions = {
  flexDirection: 'row',
  gap: 12,
};

const inlineStyle_secondaryButton = {
  flex: 1,
  paddingVertical: 14,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#94A3B8',
  alignItems: 'center',
  justifyContent: 'center',
};

const inlineStyle_secondaryButtonText = {
  fontSize: 15,
  fontWeight: '600',
  color: '#475569',
};

const inlineStyle_primaryButton = isSaving => ({
  flex: 1,
  paddingVertical: 14,
  borderRadius: 12,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: colors.primary,
  opacity: isSaving ? 0.65 : 1,
});

const inlineStyle_primaryButtonText = {
  fontSize: 15,
  fontWeight: '600',
  color: '#FFFFFF',
};

const SalesmanTab = ({
  appType,
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
  const peopleActions = peopleStore?.actions || {};
  const peopleGetters = peopleStore?.getters || {};
  const peopleLinkActions = peopleLinkStore?.actions || {};

  const currentCompany = peopleGetters?.currentCompany || {};
  const currentCompanyId = extractEntityId(
    currentCompany?.id || currentCompany?.['@id'],
  );
  const canManage = useMemo(
    () => canManageSalesmen(appType),
    [appType],
  );
  const clientIri = useMemo(() => toPeopleIri(client), [client]);
  const [linkedSalesmen, setLinkedSalesmen] = useState([]);
  const [availableSalesmen, setAvailableSalesmen] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [formData, setFormData] = useState({
    sellerIri: '',
    commission: '0',
    minimumCommission: '0',
  });

  const fetchLinkedSalesmen = useCallback(async () => {
    if (!clientIri || !peopleLinkActions?.getItems) {
      setLinkedSalesmen([]);
      setError('');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await peopleLinkActions.getItems({
        people: clientIri,
        linkType,
        itemsPerPage: 100,
      });

      const normalized = (Array.isArray(response) ? response : [])
        .map(normalizeSalesmanLink)
        .filter(Boolean);

      setLinkedSalesmen(normalized);
    } catch {
      setLinkedSalesmen([]);
      setError(errorText);
    } finally {
      setIsLoading(false);
    }
  }, [clientIri, errorText, linkType, peopleLinkActions]);

  const fetchAvailableSalesmen = useCallback(async () => {
    if (!canManage || !currentCompanyId || !peopleActions?.getItems) {
      setAvailableSalesmen([]);
      return;
    }

    try {
      const response = await peopleActions.getItems({
        'link.company': `/people/${currentCompanyId}`,
        'link.linkType': 'salesman',
        peopleType: 'F',
        itemsPerPage: 100,
      });

      setAvailableSalesmen(Array.isArray(response) ? response : []);
    } catch {
      setAvailableSalesmen([]);
    }
  }, [canManage, currentCompanyId, peopleActions]);

  useEffect(() => {
    fetchLinkedSalesmen();
  }, [fetchLinkedSalesmen]);

  useEffect(() => {
    fetchAvailableSalesmen();
  }, [fetchAvailableSalesmen]);

  const salesmanOptions = useMemo(
    () =>
      buildAvailableSalesmanOptions({
        salesmen: availableSalesmen,
        linkedSalesmen,
        editingLink,
      }),
    [availableSalesmen, editingLink, linkedSalesmen],
  );

  const openModal = link => {
    setEditingLink(link || null);
    setFormData({
      sellerIri: link?.sellerIri || '',
      commission: String(link?.commission ?? 0),
      minimumCommission: String(link?.minimumCommission ?? 0),
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setEditingLink(null);
    setFormData({
      sellerIri: '',
      commission: '0',
      minimumCommission: '0',
    });
    setShowModal(false);
  };

  const handleOpenSellerDetails = link => {
    const clientId = extractEntityId(link?.sellerId);
    if (!clientId) {
      return;
    }

    peopleActions?.setItem?.({
      id: clientId,
      '@id': link?.sellerIri,
      name: link?.sellerName,
      alias: link?.sellerAlias,
    });
    navigation.push('ClientDetails', { clientId });
  };

  const handleSave = async () => {
    if (!peopleLinkActions?.save || !clientIri) {
      showError('Nao foi possivel salvar o vendedor neste momento.');
      return;
    }

    if (!formData.sellerIri) {
      showError('Selecione um vendedor valido.');
      return;
    }

    setIsSaving(true);
    try {
      await peopleLinkActions.save({
        ...(editingLink?.id ? { id: editingLink.id } : {}),
        company: formData.sellerIri,
        people: clientIri,
        linkType,
        comission: normalizeCommissionValue(formData.commission),
        minimum_comission: normalizeCommissionValue(formData.minimumCommission),
      });

      await Promise.all([fetchLinkedSalesmen(), fetchAvailableSalesmen()]);
      showSuccess(
        editingLink ? 'Vendedor atualizado com sucesso!' : 'Vendedor vinculado com sucesso!',
      );
      closeModal();
    } catch {
      showError(
        editingLink
          ? 'Nao foi possivel atualizar o vendedor.'
          : 'Nao foi possivel vincular o vendedor.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = link => {
    if (!link?.id || !peopleLinkActions?.remove) {
      showError('Nao foi possivel identificar o vinculo para remover.');
      return;
    }

    showDialog({
      title: 'Remover vendedor',
      message: 'Deseja realmente remover este vendedor do cliente?',
      confirmLabel: 'Remover',
      cancelLabel: 'Cancelar',
      onConfirm: async () => {
        try {
          await peopleLinkActions.remove(link.id);
          await Promise.all([fetchLinkedSalesmen(), fetchAvailableSalesmen()]);
          showSuccess('Vendedor removido com sucesso!');
        } catch {
          showError('Nao foi possivel remover o vendedor.');
        }
      },
    });
  };

  return (
    <>
      <View style={customStyles.tabContent}>
        <View style={customStyles.section}>
          <View style={customStyles.sectionHeader}>
            <Text style={customStyles.sectionTitle}>Vendedores</Text>
            {canManage ? (
              <View style={inlineStyle_headerActions}>
                <TouchableOpacity onPress={() => openModal(null)}>
                  <Icon name="add" size={24} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          {isLoading ? (
            <View style={inlineStyle_46_16}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : error ? (
            <Text style={customStyles.emptyText}>{error}</Text>
          ) : !linkedSalesmen || linkedSalesmen.length === 0 ? (
            <Text style={customStyles.emptyText}>{emptyText}</Text>
          ) : (
            linkedSalesmen.map(item => (
              <View key={String(item?.id || item?.sellerId)} style={customStyles.listItem}>
                <TouchableOpacity
                  style={customStyles.itemContent}
                  activeOpacity={0.8}
                  onPress={() => handleOpenSellerDetails(item)}>
                  <Icon name="people" size={20} color={colors.primary} />
                  <View>
                    <Text style={customStyles.itemText}>
                      {String(item?.sellerName || '-')}
                    </Text>
                    <Text style={customStyles.itemSubtext}>
                      {`ID: ${extractEntityId(item?.sellerId) || '-'}`}
                      {item?.sellerAlias ? ` - ${String(item?.sellerAlias)}` : ''}
                    </Text>
                    {canManage ? (
                      <View style={inlineStyle_itemMeta}>
                        <Text style={customStyles.itemSubtext}>
                          {`Comissao: ${formatCommissionLabel(item?.commission)}`}
                        </Text>
                        <Text style={customStyles.itemSubtext}>
                          {`Minimo: ${formatCommissionLabel(item?.minimumCommission)}`}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>
                {canManage ? (
                  <View style={customStyles.itemActions}>
                    <TouchableOpacity
                      onPress={() => openModal(item)}
                      style={inlineStyle_iconButton}>
                      <Icon name="edit" size={20} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(item)}
                      style={inlineStyle_iconButton}>
                      <Icon name="delete-outline" size={20} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Icon name="chevron-right" size={20} color="#94A3B8" />
                )}
              </View>
            ))
          )}
        </View>
      </View>
      <AnimatedModal
        visible={showModal}
        onRequestClose={closeModal}
        style={{ paddingHorizontal: 20 }}>
        <View style={inlineStyle_modalCard}>
          <View style={inlineStyle_modalHeader}>
            <Text style={inlineStyle_modalTitle}>
              {editingLink ? 'Editar vendedor' : 'Vincular vendedor'}
            </Text>
            <TouchableOpacity onPress={closeModal}>
              <Icon name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={inlineStyle_fieldGroup}>
              <Text style={inlineStyle_fieldLabel}>Vendedor</Text>
              <View style={inlineStyle_pickerContainer}>
                <Picker
                  selectedValue={formData.sellerIri}
                  onValueChange={value =>
                    setFormData(previous => ({ ...previous, sellerIri: value }))
                  }>
                  <Picker.Item label="Selecione um vendedor" value="" />
                  {salesmanOptions.map(option => (
                    <Picker.Item
                      key={option.id}
                      label={
                        option.alias
                          ? `${option.name} - ${option.alias}`
                          : option.name
                      }
                      value={option.iri}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={inlineStyle_fieldGroup}>
              <Text style={inlineStyle_fieldLabel}>Comissao (%)</Text>
              <TextInput
                value={formData.commission}
                onChangeText={value =>
                  setFormData(previous => ({ ...previous, commission: value }))
                }
                placeholder="0"
                keyboardType="decimal-pad"
                style={inlineStyle_input}
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={inlineStyle_fieldGroup}>
              <Text style={inlineStyle_fieldLabel}>Comissao minima (%)</Text>
              <TextInput
                value={formData.minimumCommission}
                onChangeText={value =>
                  setFormData(previous => ({
                    ...previous,
                    minimumCommission: value,
                  }))
                }
                placeholder="0"
                keyboardType="decimal-pad"
                style={inlineStyle_input}
                placeholderTextColor="#94A3B8"
              />
            </View>
          </ScrollView>

          <View style={inlineStyle_modalActions}>
            <TouchableOpacity
              onPress={() => {
                Keyboard.dismiss();
                closeModal();
              }}
              style={inlineStyle_secondaryButton}>
              <Text style={inlineStyle_secondaryButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Keyboard.dismiss();
                handleSave();
              }}
              disabled={isSaving}
              style={inlineStyle_primaryButton(isSaving)}>
              <Text style={inlineStyle_primaryButtonText}>
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </AnimatedModal>
    </>
  );
};

export default SalesmanTab;
