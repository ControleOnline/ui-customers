import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AnimatedModal from '@controleonline/ui-common/src/react/components/AnimatedModal';
import { colors } from '@controleonline/../../src/styles/colors';

const styles = {
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    gap: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  fieldGroup: {
    gap: 8,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
};

/**
 * Modal to link or edit a client↔salesman people_link (MANAGER only).
 */
const SalesmanManageModal = ({
  visible,
  onClose,
  editingLink,
  formData,
  setFormData,
  salesmanOptions,
  isSaving,
  onSave,
}) => {
  const title = editingLink ? 'Editar vendedor' : 'Vincular vendedor';

  return (
    <AnimatedModal
      visible={visible}
      onRequestClose={onClose}
      style={{ paddingHorizontal: 20 }}>
      <View style={styles.modalCard} testID="salesman-manage-modal">
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle} testID="salesman-manage-modal-title">
            {title}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            accessibilityLabel="Fechar"
            testID="salesman-manage-modal-close">
            <Icon name="close" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled">
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Vendedor</Text>
            <View style={styles.pickerContainer} testID="salesman-manage-picker">
              <Picker
                selectedValue={formData.sellerIri}
                enabled={!editingLink}
                testID="salesman-manage-seller-picker"
                onValueChange={value =>
                  setFormData(previous => ({ ...previous, sellerIri: value }))
                }>
                <Picker.Item label="Selecione um vendedor" value="" />
                {salesmanOptions.map(option => (
                  <Picker.Item
                    key={option.id}
                    label={option.alias ? `${option.name} (${option.alias})` : option.name}
                    value={option.iri}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Comissão (%)</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={String(formData.commission ?? '')}
              onChangeText={value =>
                setFormData(previous => ({ ...previous, commission: value }))
              }
              placeholder="0"
              testID="salesman-manage-commission-input"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Comissão mínima (%)</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={String(formData.minimumCommission ?? '')}
              onChangeText={value =>
                setFormData(previous => ({
                  ...previous,
                  minimumCommission: value,
                }))
              }
              placeholder="0"
              testID="salesman-manage-minimum-input"
            />
          </View>
        </ScrollView>

        <View style={styles.modalActions}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onClose}
            disabled={isSaving}
            testID="salesman-manage-cancel-btn">
            <Text style={styles.secondaryButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onSave}
            disabled={isSaving}
            testID="salesman-manage-save-btn">
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Salvar</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </AnimatedModal>
  );
};

export default SalesmanManageModal;
