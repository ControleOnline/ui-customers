import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AnimatedModal from '@controleonline/ui-common/src/react/components/AnimatedModal';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useStores} from '@store';
import {
  extractCollectionItems,
  extractId,
  toTimezoneItem,
} from './usersTabHelpers';
import {
  PASSWORD_HELP_LINES,
} from '@controleonline/ui-common/src/react/utils/passwordPolicy';
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
  timezoneListStyle,
  timezoneOptionStyle,
  timezoneOptionTextStyle,
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
}) => {
  const timezonesStore = useStores(state => state.timezones) || {};
  const timezonesActions = timezonesStore.actions || {};
  const timezoneFilters = timezonesStore.getters?.filters || {enabled: true};

  const [timezones, setTimezones] = useState([]);
  const [loadingTimezones, setLoadingTimezones] = useState(false);

  useEffect(() => {
    if (!visible || editingItem) {
      return undefined;
    }

    let cancelled = false;
    setLoadingTimezones(true);

    const load = async () => {
      try {
        if (typeof timezonesActions.getItems !== 'function') {
          if (!cancelled) setTimezones([]);
          return;
        }
        const response = await timezonesActions.getItems(timezoneFilters);
        if (cancelled) return;
        const items = extractCollectionItems(response)
          .map(toTimezoneItem)
          .filter(Boolean);
        setTimezones(items);
      } catch {
        if (!cancelled) setTimezones([]);
      } finally {
        if (!cancelled) setLoadingTimezones(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [visible, editingItem, timezonesActions, timezoneFilters]);

  const selectedTimezoneId = extractId(formData?.timezoneId || formData?.timezone);

  const timezoneOptions = useMemo(
    () =>
      timezones.map(tz => ({
        id: tz.id,
        label: tz.displayName || tz.name || tz.id,
      })),
    [timezones],
  );

  return (
    <AnimatedModal visible={visible} onRequestClose={onClose} style={inlineStyle_174_6}>
      <View style={inlineStyle_175_12}>
        <View style={inlineStyle_188_14}>
          <Text style={inlineStyle_197_16}>
            {editingItem ? 'Editar Senha do Usuário' : 'Adicionar Usuário'}
          </Text>
          <TouchableOpacity onPress={onClose} style={inlineStyle_200_49}>
            <Icon name="close" size={20} color="#64748B" />
          </TouchableOpacity>

          <View style={{marginBottom: 12, padding: 10, borderRadius: 8, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0'}}>
            <Text style={{fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 4}}>
              Requisitos da senha
            </Text>
            {PASSWORD_HELP_LINES.map(line => (
              <Text key={line} style={{fontSize: 12, color: '#64748B', lineHeight: 18}}>
                • {line}
              </Text>
            ))}
          </View>
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
                <Text style={inlineStyle_276_22}>Nome de usuário *</Text>
                <TextInput
                  style={inlineStyle_216_18}
                  placeholder="Nome de usuário"
                  value={formData.username}
                  onChangeText={text => setFormData({...formData, username: text})}
                  autoCapitalize="none"
                />
              </View>
              <View style={inlineStyle_288_20}>
                <Text style={inlineStyle_289_22}>Senha *</Text>
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
                <Text style={inlineStyle_313_22}>Confirmar senha *</Text>
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

              <View style={inlineStyle_275_20}>
                <Text style={inlineStyle_276_22}>Timezone *</Text>
                {loadingTimezones ? (
                  <ActivityIndicator size="small" color="#0F172A" />
                ) : (
                  <View style={timezoneListStyle}>
                    {timezoneOptions.length === 0 ? (
                      <Text style={[timezoneOptionTextStyle, {padding: 12}]}>
                        Nenhum timezone disponível. Tente novamente.
                      </Text>
                    ) : (
                      timezoneOptions.map((opt, index) => {
                        const selected = opt.id === selectedTimezoneId;
                        const isLast = index === timezoneOptions.length - 1;
                        return (
                          <TouchableOpacity
                            key={opt.id}
                            style={[
                              timezoneOptionStyle,
                              isLast && {borderBottomWidth: 0},
                              selected && {backgroundColor: '#E0F2FE'},
                            ]}
                            onPress={() => setFormData({...formData, timezoneId: opt.id})}>
                            <Text
                              style={[
                                timezoneOptionTextStyle,
                                selected && {color: '#0369A1', fontWeight: '600'},
                              ]}>
                              {opt.label}
                            </Text>
                            {selected ? <Icon name="check" size={18} color="#0284C7" /> : null}
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </View>
                )}
                {!selectedTimezoneId && !loadingTimezones ? (
                  <Text style={{color: '#DC2626', marginTop: 6, fontSize: 13}}>
                    Selecione um timezone (obrigatório).
                  </Text>
                ) : null}
              </View>
            </View>
          )}
        </ScrollView>

        <View style={inlineStyle_339_16}>
          <TouchableOpacity
            onPress={onClose}
            style={inlineStyle_341_14}
            accessibilityLabel="Cancelar"
            accessibilityRole="button"
            testID="user-form-cancel">
            <Text style={{color: '#64748B', fontWeight: '600'}}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onSave}
            style={inlineStyle_348_20}
            accessibilityLabel="Salvar"
            accessibilityRole="button"
            testID="user-form-save">
            <Text style={{color: '#FFFFFF', fontWeight: '600'}}>Salvar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </AnimatedModal>
  );
};

export default UserFormModal;
