import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  formatDateInput,
  LINK_TYPE_OPTIONS,
  PEOPLE_TYPE_OPTIONS,
  normalizePeopleType,
} from './employeesTabHelpers';
import {
  inlineStyle_281_10,
  inlineStyle_294_12,
  inlineStyle_303_18,
  inlineStyle_308_14,
  inlineStyle_321_12,
  inlineStyle_324_18,
  inlineStyle_326_16,
  inlineStyle_338_16,
  inlineStyle_351_18,
  inlineStyle_353_16,
  inlineStyle_365_16,
  inlineStyle_378_18,
  inlineStyle_380_16,
  inlineStyle_389_16,
  inlineStyle_408_18,
  inlineStyle_422_18,
  inlineStyle_424_16,
  inlineStyle_433_16,
  inlineStyle_446_18,
  inlineStyle_460_12,
  inlineStyle_472_14,
  inlineStyle_480_20,
} from './EmployeesTab.styles';

/**
 * Create-collaborator form fields for EmployeesTab modal (app-community#625).
 */
const EmployeeCreateFormFields = ({
  formData,
  setFormData,
  linkTypeOptions,
  isSaving,
  onClose,
  onSave,
  title,
}) => {
  const pickerMode = Platform.OS === 'android' ? 'dropdown' : undefined;
  const isPJ = normalizePeopleType(formData.peopleType) === 'J';

  return (
    <View style={inlineStyle_281_10}>
      <View style={inlineStyle_294_12}>
        <Text style={inlineStyle_303_18}>{title}</Text>
        <TouchableOpacity onPress={onClose} style={inlineStyle_308_14}>
          <Icon name="close" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={inlineStyle_321_12}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">
        <View style={inlineStyle_324_18}>
          <Text style={inlineStyle_326_16}>
            {isPJ ? 'Razão Social *' : 'Nome *'}
          </Text>
          <TextInput
            value={formData.name}
            onChangeText={text =>
              setFormData(prev => ({ ...prev, name: text }))
            }
            placeholder="Digite o nome"
            style={inlineStyle_338_16}
            placeholderTextColor="#6c757d"
          />
        </View>

        <View style={inlineStyle_351_18}>
          <Text style={inlineStyle_353_16}>
            {isPJ ? 'Nome Fantasia *' : 'Apelido *'}
          </Text>
          <TextInput
            value={formData.alias}
            onChangeText={text =>
              setFormData(prev => ({ ...prev, alias: text }))
            }
            placeholder="Digite o apelido"
            style={inlineStyle_365_16}
            placeholderTextColor="#6c757d"
          />
        </View>

        <View style={inlineStyle_378_18}>
          <Text style={inlineStyle_380_16}>Tipo *</Text>
          <View style={inlineStyle_389_16}>
            <Picker
              selectedValue={normalizePeopleType(formData.peopleType)}
              onValueChange={value =>
                setFormData(prev => ({
                  ...prev,
                  peopleType: normalizePeopleType(value),
                }))
              }
              mode={pickerMode}
              style={inlineStyle_408_18}>
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

        <View style={inlineStyle_378_18}>
          <Text style={inlineStyle_380_16}>
            {isPJ ? 'Data de Fundação' : 'Data de Nascimento'}
          </Text>
          <View style={inlineStyle_389_16}>
            <Icon name="calendar-today" size={20} color="#6c757d" />
            <TextInput
              value={formData.foundationDateBr}
              onChangeText={text =>
                setFormData(prev => ({
                  ...prev,
                  foundationDateBr: formatDateInput(text),
                }))
              }
              placeholder="DD/MM/AAAA"
              style={inlineStyle_408_18}
              placeholderTextColor="#6c757d"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={inlineStyle_422_18}>
          <Text style={inlineStyle_424_16}>Tipo de vínculo</Text>
          <View style={inlineStyle_433_16}>
            <Picker
              selectedValue={formData.linkType}
              onValueChange={value =>
                setFormData(prev => ({ ...prev, linkType: value }))
              }
              mode={pickerMode}
              style={inlineStyle_408_18}>
              {(linkTypeOptions.length
                ? linkTypeOptions
                : LINK_TYPE_OPTIONS.map(o => ({ value: o.value, label: o.value }))
              ).map(option => (
                <Picker.Item
                  key={option.value}
                  label={option.label || option.value}
                  value={option.value}
                />
              ))}
            </Picker>
          </View>
        </View>
      </ScrollView>

      <View style={inlineStyle_446_18}>
        <TouchableOpacity
          onPress={onClose}
          disabled={isSaving}
          style={inlineStyle_460_12}>
          <Text style={inlineStyle_472_14}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onSave}
          disabled={isSaving}
          style={inlineStyle_480_20}>
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '600' }}>Salvar</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default EmployeeCreateFormFields;
