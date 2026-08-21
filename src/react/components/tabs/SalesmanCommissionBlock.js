import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import {
  extractId,
  formatCommissionSubtitle,
  resolveEffectiveCommission,
} from './salesmanTabHelpers';

const SalesmanCommissionBlock = ({
  item,
  displayCommission,
  canEdit,
  editingLinkId,
  editForm,
  setEditForm,
  isSaving,
  defaultLinksBySalesmanId,
  openEdit,
  cancelEdit,
  saveEdit,
  customStyles,
}) => {
  if (!displayCommission) {
    return null;
  }

  const salesmanId = extractId(item?.company?.id || item?.company?.['@id']);
  const defaultLink = defaultLinksBySalesmanId[salesmanId] || null;
  const effective = resolveEffectiveCommission(item, defaultLink);
  const linkId = extractId(item?.id || item?.['@id']);
  const isEditingThis = editingLinkId === linkId;

  if (isEditingThis && canEdit) {
    return (
      <View style={{ marginTop: 6, gap: 6 }} testID={`salesman-commission-edit-${linkId}`}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={customStyles.itemSubtext}>Comissão %</Text>
          <TextInput
            testID={`salesman-commission-input-${linkId}`}
            value={editForm.comission}
            onChangeText={text =>
              setEditForm(prev => ({ ...prev, comission: text.replace(/[^\d.,]/g, '') }))
            }
            keyboardType="decimal-pad"
            style={{
              minWidth: 64,
              borderWidth: 1,
              borderColor: customStyles.itemSubtext?.color || '#D7E1EC',
              borderRadius: 6,
              paddingHorizontal: 8,
              paddingVertical: 4,
              color: customStyles.itemText?.color,
            }}
          />
          <Text style={customStyles.itemSubtext}>Mín %</Text>
          <TextInput
            testID={`salesman-minimum-commission-input-${linkId}`}
            value={editForm.minimumComission}
            onChangeText={text =>
              setEditForm(prev => ({
                ...prev,
                minimumComission: text.replace(/[^\d.,]/g, ''),
              }))
            }
            keyboardType="decimal-pad"
            style={{
              minWidth: 64,
              borderWidth: 1,
              borderColor: customStyles.itemSubtext?.color || '#D7E1EC',
              borderRadius: 6,
              paddingHorizontal: 8,
              paddingVertical: 4,
              color: customStyles.itemText?.color,
            }}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            testID={`salesman-commission-save-${linkId}`}
            onPress={() => saveEdit(item)}
            disabled={isSaving}>
            <Text style={[customStyles.itemSubtext, { fontWeight: '600' }]}>
              {isSaving ? 'Salvando…' : 'Salvar'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity testID={`salesman-commission-cancel-${linkId}`} onPress={cancelEdit}>
            <Text style={customStyles.itemSubtext}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View
      style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 6 }}
      testID={`salesman-commission-${linkId}`}>
      <Text
        style={customStyles.itemSubtext}
        testID={`salesman-commission-label-${linkId}`}>
        {formatCommissionSubtitle(effective)}
      </Text>
      {canEdit ? (
        <TouchableOpacity
          testID={`salesman-commission-edit-btn-${linkId}`}
          onPress={() => openEdit(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <FeatherIcon
            name="edit-2"
            size={14}
            color={customStyles.iconButtonGhostIcon?.color || '#6C7787'}
          />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

export default SalesmanCommissionBlock;
