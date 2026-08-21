import React from 'react';
import {Text, TouchableOpacity, ScrollView, TextInput, View, ActivityIndicator} from 'react-native';
import AnimatedModal from '@controleonline/ui-common/src/react/components/AnimatedModal';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {
  inlineStyle_174_6,
  inlineStyle_175_12,
  inlineStyle_188_14,
  inlineStyle_197_16,
  inlineStyle_200_49,
  inlineStyle_208_10,
  inlineStyle_213_20,
  inlineStyle_214_22,
  inlineStyle_216_18,
  inlineStyle_248_20,
  inlineStyle_249_22,
  inlineStyle_252_20,
  inlineStyle_339_16,
  inlineStyle_341_14,
} from './UsersTab.styles';
import {apiKeyModalStyles, formatApiKeyPreview} from './usersTabHelpers';

const UserApiKeyModal = ({
  visible,
  onClose,
  apiKeyItem,
  isRefreshingApiKey,
  onCopy,
  onRefresh,
}) => (
  <AnimatedModal visible={visible} onRequestClose={onClose} style={inlineStyle_174_6}>
    <View style={inlineStyle_175_12}>
      <View style={inlineStyle_188_14}>
        <Text style={inlineStyle_197_16}>Chave de API</Text>
        <TouchableOpacity onPress={onClose} style={inlineStyle_200_49}>
          <Icon name="close" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={inlineStyle_208_10}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">
        <View style={inlineStyle_213_20}>
          <Text style={inlineStyle_214_22}>Usuário</Text>
          <TextInput
            style={inlineStyle_216_18}
            value={apiKeyItem?.username || apiKeyItem?.name || ''}
            editable={false}
          />
        </View>

        <View style={inlineStyle_248_20}>
          <Text style={inlineStyle_249_22}>Chave atual</Text>
          <TextInput
            style={inlineStyle_252_20}
            value={formatApiKeyPreview(apiKeyItem?.apiKey)}
            editable={false}
            multiline
          />
        </View>

        <View style={apiKeyModalStyles.buttonRow}>
          <TouchableOpacity style={apiKeyModalStyles.secondaryButton} onPress={onCopy}>
            <Text style={apiKeyModalStyles.secondaryText}>Copiar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={apiKeyModalStyles.secondaryButton}
            onPress={() => onRefresh?.(apiKeyItem)}
            disabled={isRefreshingApiKey}>
            {isRefreshingApiKey ? (
              <ActivityIndicator size="small" color="#64748B" />
            ) : (
              <Text style={apiKeyModalStyles.secondaryText}>Renovar</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={inlineStyle_339_16}>
        <TouchableOpacity onPress={onClose} style={inlineStyle_341_14}>
          <Text style={{color: '#64748B', fontWeight: '600'}}>Fechar</Text>
        </TouchableOpacity>
      </View>
    </View>
  </AnimatedModal>
);

export default UserApiKeyModal;
