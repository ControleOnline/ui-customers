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
    paddingHorizontal: 12,
    paddingVertical: 10,
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
 * Modal to link or edit a PJ↔PJ franchisee/filial people_link (MANAGER only).
 */
const FranchiseLinksManageModal = ({
  visible,
  onClose,
  editingLink,
  formData,
  setFormData,
  franchiseOptions,
  isSaving,
  onSave,
}) => {
  const title = editingLink ? 'Editar vínculo' : 'Vincular franquia/filial';

  return (
    <AnimatedModal
      visible={visible}
      onRequestClose={onClose}
      style={{ paddingHorizontal: 20 }}>
      <View style={styles.modalCard}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} accessibilityLabel="Fechar">
            <Icon name="close" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled">
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Pessoa jurídica</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.linkedIri}
                enabled={!editingLink}
                onValueChange={value =>
                  setFormData(previous => ({ ...previous, linkedIri: value }))
                }
                testID="franchise-link-people-picker">
                <Picker.Item label="Selecione uma PJ" value="" />
                {franchiseOptions.map(option => (
                  <Picker.Item
                    key={option.id}
                    label={
                      option.alias
                        ? `${option.name} (${option.alias})`
                        : option.name
                    }
                    value={option.iri}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Comissão (%)</Text>
            <TextInput
              value={formData.comission}
              onChangeText={value =>
                setFormData(previous => ({ ...previous, comission: value }))
              }
              keyboardType="decimal-pad"
              style={styles.input}
              testID="franchise-link-comission-input"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Comissão mínima</Text>
            <TextInput
              value={formData.minimumComission}
              onChangeText={value =>
                setFormData(previous => ({ ...previous, minimumComission: value }))
              }
              keyboardType="decimal-pad"
              style={styles.input}
              testID="franchise-link-minimum-comission-input"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Tipo de vínculo</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.linkType}
                onValueChange={value =>
                  setFormData(previous => ({ ...previous, linkType: value }))
                }
                testID="franchise-link-type-picker">
                <Picker.Item label="Franquia" value="franchisee" />
                <Picker.Item label="Filial" value="filial" />
              </Picker>
            </View>
          </View>
        </ScrollView>

        <View style={styles.modalActions}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onClose}
            disabled={isSaving}>
            <Text style={styles.secondaryButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onSave}
            disabled={isSaving}
            testID="franchise-link-save-btn">
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

export default FranchiseLinksManageModal;
