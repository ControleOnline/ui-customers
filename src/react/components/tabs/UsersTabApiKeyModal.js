import React from 'react';
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import AnimatedModal from '@controleonline/ui-common/src/react/components/AnimatedModal';
import FeatherIcon from 'react-native-vector-icons/Feather';
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
} from './UsersTab.styles';

const UsersTabApiKeyModal = ({
  visible,
  onClose,
  apiKeyItem,
  customStyles,
  isRefreshingApiKey,
  onCopy,
  onRefresh,
}) => (
) => (
    <AnimatedModal
      visible={visible}
      onRequestClose={onClose}
      style={inlineStyle_174_6}>
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
              value={apiKeyItem?.apiKey || ''}
              editable={false}
              multiline
            />
          </View>

          <View style={inlineStyle_apiKeyButtonRow}>
            <TouchableOpacity
              style={inlineStyle_apiKeySecondaryButton}
              onPress={onCopy}>
              <Text style={inlineStyle_apiKeySecondaryText}>Copiar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={inlineStyle_apiKeySecondaryButton}
              onPress={onClose}>
              <Text style={inlineStyle_apiKeySecondaryText}>Fechar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                customStyles.saveButton,
                isRefreshingApiKey && customStyles.saveButtonDisabled,
              ]}
              onPress={() => onRefresh()}
              disabled={isRefreshingApiKey}>
              {isRefreshingApiKey ? (
                <ActivityIndicator
                  size="small"
                  color={customStyles.saveButtonText.color}
                />
              ) : (
                <>
                  <FeatherIcon
                    name="plus"
                    size={16}
                    color={customStyles.iconButtonPrimaryIcon.color}
                  />
                  <Text style={customStyles.saveButtonText}>Nova chave</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </AnimatedModal>
);

export default UsersTabApiKeyModal;
