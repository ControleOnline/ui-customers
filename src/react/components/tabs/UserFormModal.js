import React from 'react';
import {
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
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
  inlineStyle_224_20,
  inlineStyle_225_22,
  inlineStyle_226_22,
  inlineStyle_228_20,
  inlineStyle_239_20,
  inlineStyle_248_20,
  inlineStyle_249_22,
  inlineStyle_250_22,
  inlineStyle_252_20,
  inlineStyle_263_20,
  inlineStyle_275_20,
  inlineStyle_276_22,
  inlineStyle_278_18,
  inlineStyle_288_20,
  inlineStyle_289_22,
  inlineStyle_290_22,
  inlineStyle_292_20,
  inlineStyle_303_20,
  inlineStyle_312_20,
  inlineStyle_313_22,
  inlineStyle_314_22,
  inlineStyle_316_20,
  inlineStyle_327_20,
  inlineStyle_339_16,
  inlineStyle_341_14,
  inlineStyle_348_20,
} from './UsersTab.styles';

const UserFormModal = ({
  visible,
  onClose,
  editingItem,
  formData,
  setFormData,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  onSave,
}) => (
  <AnimatedModal visible={visible} onRequestClose={onClose} style={inlineStyle_174_6}>
    <View style={inlineStyle_175_12}>
      <View style={inlineStyle_188_14}>
        <Text style={inlineStyle_197_16}>
          {editingItem ? 'Editar Senha do Usuário' : 'Adicionar Usuário'}
        </Text>
        <TouchableOpacity onPress={onClose} style={inlineStyle_200_49}>
          <Icon name="close" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={inlineStyle_208_10}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">
        {editingItem ? (
          <View>
            <View style={inlineStyle_213_20}>
              <Text style={inlineStyle_214_22}>Usuário</Text>
              <TextInput style={inlineStyle_216_18} value={formData.username} editable={false} />
            </View>
            <View style={inlineStyle_224_20}>
              <Text style={inlineStyle_225_22}>Nova senha</Text>
              <View style={inlineStyle_226_22}>
                <TextInput
                  style={inlineStyle_228_20}
                  placeholder="Nova senha"
                  value={formData.password}
                  onChangeText={text => setFormData({...formData, password: text})}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(prev => !prev)}
                  style={inlineStyle_239_20}>
                  <Icon
                    name={showPassword ? 'visibility-off' : 'visibility'}
                    size={20}
                    color="#6c757d"
                  />
                </TouchableOpacity>
              </View>
            </View>
            <View style={inlineStyle_248_20}>
              <Text style={inlineStyle_249_22}>Confirmar nova senha</Text>
              <View style={inlineStyle_250_22}>
                <TextInput
                  style={inlineStyle_252_20}
                  placeholder="Confirmar nova senha"
                  value={formData.confirmPassword}
                  onChangeText={text => setFormData({...formData, confirmPassword: text})}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(prev => !prev)}
                  style={inlineStyle_263_20}>
                  <Icon
                    name={showConfirmPassword ? 'visibility-off' : 'visibility'}
                    size={20}
                    color="#6c757d"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View>
            <View style={inlineStyle_275_20}>
              <Text style={inlineStyle_276_22}>Usuário</Text>
              <TextInput
                style={inlineStyle_278_18}
                placeholder="Nome de usuário"
                value={formData.username}
                onChangeText={text => setFormData({...formData, username: text})}
                autoCapitalize="none"
              />
            </View>
            <View style={inlineStyle_288_20}>
              <Text style={inlineStyle_289_22}>Senha</Text>
              <View style={inlineStyle_290_22}>
                <TextInput
                  style={inlineStyle_292_20}
                  placeholder="Senha"
                  value={formData.password}
                  onChangeText={text => setFormData({...formData, password: text})}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(prev => !prev)}
                  style={inlineStyle_303_20}>
                  <Icon
                    name={showPassword ? 'visibility-off' : 'visibility'}
                    size={20}
                    color="#6c757d"
                  />
                </TouchableOpacity>
              </View>
            </View>
            <View style={inlineStyle_312_20}>
              <Text style={inlineStyle_313_22}>Confirmar senha</Text>
              <View style={inlineStyle_314_22}>
                <TextInput
                  style={inlineStyle_316_20}
                  placeholder="Confirmar senha"
                  value={formData.confirmPassword}
                  onChangeText={text => setFormData({...formData, confirmPassword: text})}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(prev => !prev)}
                  style={inlineStyle_327_20}>
                  <Icon
                    name={showConfirmPassword ? 'visibility-off' : 'visibility'}
                    size={20}
                    color="#6c757d"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={inlineStyle_339_16}>
        <TouchableOpacity onPress={onClose} style={inlineStyle_341_14}>
          <Text style={{color: '#64748B', fontWeight: '600'}}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onSave} style={inlineStyle_348_20}>
          <Text style={{color: '#FFFFFF', fontWeight: '600'}}>Salvar</Text>
        </TouchableOpacity>
      </View>
    </View>
  </AnimatedModal>
);

export default UserFormModal;
