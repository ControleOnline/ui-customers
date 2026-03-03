import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AnimatedModal from '@controleonline/ui-crm/src/react/components/AnimatedModal';
import {useMessage} from '@controleonline/ui-common/src/react/components/MessageService';

const toBrDateString = date => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  return `${day}/${month}/${year}`;
};

const AddCompanyModal = ({ visible, onClose, onSave }) => {
  const {showError} = useMessage();
  const defaultDate = new Date();
  const [formData, setFormData] = useState({
    name: '',
    alias: '',
    foundationDate: defaultDate,
    foundationDateInput: toBrDateString(defaultDate),
    peopleType: 'J',
    firstEmployeeName: '',
    firstEmployeeAlias: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const isPessoaFisica = formData.peopleType === 'F';
  const isPessoaJuridica = formData.peopleType === 'J';
  const nameLabel = isPessoaFisica ? 'Nome *' : 'Raz\u00E3o Social *';
  const namePlaceholder = isPessoaFisica
    ? 'Digite o nome'
    : 'Digite a raz\u00E3o social';
  const aliasLabel = isPessoaFisica ? 'Apelido *' : 'Nome Fantasia *';
  const aliasPlaceholder = isPessoaFisica
    ? 'Digite o apelido'
    : 'Digite o nome fantasia';
  const dateLabel = isPessoaFisica
    ? 'Data de Nascimento'
    : 'Data de Funda\u00E7\u00E3o';
  const modalTitle = isPessoaFisica ? 'Nova Pessoa' : 'Nova Empresa';

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.alias.trim()) {
      showError(
        isPessoaFisica
          ? 'Nome e apelido s\u00E3o obrigat\u00F3rios'
          : 'Raz\u00E3o social e nome fantasia s\u00E3o obrigat\u00F3rios',
      );
      return;
    }

    if (isPessoaJuridica) {
      if (
        !String(formData.firstEmployeeName || '').trim() ||
        !String(formData.firstEmployeeAlias || '').trim()
      ) {
        showError('Para cadastrar empresa, informe nome e apelido de um funcionario.');
        return;
      }
    }

    setIsLoading(true);
    try {
      let parsedFoundationDate = formData.foundationDate;
      if (formData.foundationDateInput) {
        const normalized = formatDateInput(formData.foundationDateInput);
        if (normalized.length !== 10) {
          showError('Informe uma data valida no formato DD/MM/AAAA.');
          setIsLoading(false);
          return;
        }

        const [day, month, year] = normalized
          .split('/')
          .map(part => parseInt(part, 10));
        const candidate = new Date(year, month - 1, day);
        const validDate =
          candidate.getFullYear() === year &&
          candidate.getMonth() === month - 1 &&
          candidate.getDate() === day;

        if (!validDate) {
          showError('Informe uma data valida no formato DD/MM/AAAA.');
          setIsLoading(false);
          return;
        }

        parsedFoundationDate = candidate;
      }

      const companyData = {
        name: formData.name.trim(),
        alias: formData.alias.trim(),
        foundationDate: parsedFoundationDate.toISOString().split('T')[0],
        peopleType: formData.peopleType,
        link_type: 'client',
        'extra-data': {},
      };

      if (isPessoaJuridica) {
        companyData.firstEmployee = {
          name: String(formData.firstEmployeeName || '').trim(),
          alias: String(formData.firstEmployeeAlias || '').trim(),
        };
      }

      await onSave(companyData);
      handleClose();
    } catch (error) {
      showError(error?.message || 'Erro ao criar empresa');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    const resetDate = new Date();
    setFormData({
      name: '',
      alias: '',
      foundationDate: resetDate,
      foundationDateInput: toBrDateString(resetDate),
      peopleType: 'J',
      firstEmployeeName: '',
      firstEmployeeAlias: '',
    });
    onClose();
  };

  const formatDateInput = text => {
    const numbers = String(text || '').replace(/\D/g, '').slice(0, 8);
    if (!numbers) {
      return '';
    }

    if (numbers.length <= 2) {
      return numbers;
    }

    if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    }

    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4)}`;
  };

  const handleDateChange = text => {
    const formatted = formatDateInput(text);
    setFormData(prev => ({ ...prev, foundationDateInput: formatted }));

    if (formatted.length === 10) {
      const parts = formatted.split('/');
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);

      if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 1900) {
        const newDate = new Date(year, month, day);
        if (!isNaN(newDate.getTime())) {
          setFormData(prev => ({
            ...prev,
            foundationDate: newDate,
          }));
        }
      }
    }
  };

  return (
    <AnimatedModal
      visible={visible}
      onRequestClose={handleClose}
      style={{ justifyContent: 'flex-end' }}>
      <View
        style={{
          backgroundColor: '#fff',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          maxHeight: '90%',
          width: '100%',
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -4,
          },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 10,
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            paddingVertical: 20,
            borderBottomWidth: 1,
            borderBottomColor: '#F1F5F9',
          }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: '#0F172A',
            }}>
            {modalTitle}
          </Text>
          <TouchableOpacity
            onPress={handleClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: '#F1F5F9',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Icon name="close" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ padding: 20 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#212529',
                marginBottom: 8,
              }}>
              {nameLabel}
            </Text>
            <TextInput
              value={formData.name}
              onChangeText={text => setFormData(prev => ({ ...prev, name: text }))}
              placeholder={namePlaceholder}
              style={{
                borderWidth: 1,
                borderColor: '#e9ecef',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                backgroundColor: '#f8f9fa',
              }}
              placeholderTextColor="#6c757d"
            />
          </View>

          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#212529',
                marginBottom: 8,
              }}>
              {aliasLabel}
            </Text>
            <TextInput
              value={formData.alias}
              onChangeText={text => setFormData(prev => ({ ...prev, alias: text }))}
              placeholder={aliasPlaceholder}
              style={{
                borderWidth: 1,
                borderColor: '#e9ecef',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                backgroundColor: '#f8f9fa',
              }}
              placeholderTextColor="#6c757d"
            />
          </View>

          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#212529',
                marginBottom: 8,
              }}>
              Tipo de Pessoa
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() =>
                  setFormData(prev => ({
                    ...prev,
                    peopleType: 'F',
                    firstEmployeeName: '',
                    firstEmployeeAlias: '',
                  }))
                }
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor:
                    formData.peopleType === 'F' ? '#007bff' : '#e9ecef',
                  backgroundColor:
                    formData.peopleType === 'F' ? '#e7f3ff' : '#f8f9fa',
                }}>
                <Icon
                  name="person"
                  size={20}
                  color={formData.peopleType === 'F' ? '#007bff' : '#6c757d'}
                />
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 16,
                    color:
                      formData.peopleType === 'F' ? '#007bff' : '#6c757d',
                    fontWeight: formData.peopleType === 'F' ? '600' : '400',
                  }}>
                  {'F\u00EDsica'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setFormData(prev => ({ ...prev, peopleType: 'J' }))}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor:
                    formData.peopleType === 'J' ? '#007bff' : '#e9ecef',
                  backgroundColor:
                    formData.peopleType === 'J' ? '#e7f3ff' : '#f8f9fa',
                }}>
                <Icon
                  name="business"
                  size={20}
                  color={formData.peopleType === 'J' ? '#007bff' : '#6c757d'}
                />
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 16,
                    color:
                      formData.peopleType === 'J' ? '#007bff' : '#6c757d',
                    fontWeight: formData.peopleType === 'J' ? '600' : '400',
                  }}>
                  {'Jur\u00EDdica'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {isPessoaJuridica && (
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#212529',
                  marginBottom: 8,
                }}>
                Funcionario vinculado (obrigatorio)
              </Text>

              <View style={{ marginBottom: 12 }}>
                <TextInput
                  value={formData.firstEmployeeName}
                  onChangeText={text =>
                    setFormData(prev => ({ ...prev, firstEmployeeName: text }))
                  }
                  placeholder="Nome do funcionario *"
                  style={{
                    borderWidth: 1,
                    borderColor: '#e9ecef',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontSize: 16,
                    backgroundColor: '#f8f9fa',
                  }}
                  placeholderTextColor="#6c757d"
                />
              </View>

              <View style={{ marginBottom: 12 }}>
                <TextInput
                  value={formData.firstEmployeeAlias}
                  onChangeText={text =>
                    setFormData(prev => ({ ...prev, firstEmployeeAlias: text }))
                  }
                  placeholder="Apelido do funcionario *"
                  style={{
                    borderWidth: 1,
                    borderColor: '#e9ecef',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontSize: 16,
                    backgroundColor: '#f8f9fa',
                  }}
                  placeholderTextColor="#6c757d"
                />
              </View>

            </View>
          )}

          <View style={{ marginBottom: 30 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#212529',
                marginBottom: 8,
              }}>
              {dateLabel}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#e9ecef',
                borderRadius: 12,
                paddingHorizontal: 16,
                backgroundColor: '#f8f9fa',
              }}>
              <Icon name="calendar-today" size={20} color="#6c757d" />
              <TextInput
                placeholder="DD/MM/AAAA"
                value={formData.foundationDateInput}
                onChangeText={handleDateChange}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  fontSize: 16,
                  color: '#212529',
                }}
                placeholderTextColor="#6c757d"
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
          </View>
        </ScrollView>

        <View
          style={{
            flexDirection: 'row',
            padding: 20,
            gap: 12,
            borderTopWidth: 1,
            borderTopColor: '#e9ecef',
          }}>
          <TouchableOpacity
            onPress={() => {
              Keyboard.dismiss();
              handleClose();
            }}
            style={{
              flex: 1,
              paddingVertical: 14,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#6c757d',
              alignItems: 'center',
            }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#6c757d',
              }}>
              Cancelar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Keyboard.dismiss();
              handleSave();
            }}
            disabled={isLoading}
            style={{
              flex: 1,
              paddingVertical: 14,
              borderRadius: 12,
              backgroundColor: isLoading ? '#6c757d' : '#007bff',
              alignItems: 'center',
            }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#fff',
              }}>
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </AnimatedModal>
  );
};

export default AddCompanyModal;

