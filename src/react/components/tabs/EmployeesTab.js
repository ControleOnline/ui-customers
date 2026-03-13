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
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useStores } from '@store';
import AnimatedModal from '@controleonline/ui-crm/src/react/components/AnimatedModal';
import { useMessage } from '@controleonline/ui-common/src/react/components/MessageService';
import { colors } from '@controleonline/../../src/styles/colors';

const extractId = value => String(value || '').replace(/\D/g, '');

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

const parseBrDateToYmd = value => {
  const formatted = formatDateInput(value);
  if (formatted.length !== 10) {
    return null;
  }

  const [day, month, year] = formatted.split('/').map(v => parseInt(v, 10));
  if (!day || !month || !year) {
    return null;
  }

  const candidate = new Date(year, month - 1, day);
  const isValid =
    candidate.getFullYear() === year &&
    candidate.getMonth() === month - 1 &&
    candidate.getDate() === day;

  if (!isValid) {
    return null;
  }

  return `${year.toString().padStart(4, '0')}-${month
    .toString()
    .padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
};

const EmployeesTab = ({
  client,
  customStyles,
  title = 'Funcionarios',
  emptyText = 'Nenhum funcionario vinculado',
  errorText = 'Nao foi possivel carregar os funcionarios vinculados.',
  createTitle = 'Adicionar Funcionario',
  requiredErrorText = 'Nome e apelido do funcionario sao obrigatorios.',
  createSuccessText = 'Funcionario cadastrado com sucesso.',
  createErrorText = 'Nao foi possivel cadastrar o funcionario.',
}) => {
  const navigation = useNavigation();
  const { showError, showSuccess } = useMessage();

  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    alias: '',
    foundationDateBr: '',
  });

  const peopleStore = useStores(state => state.people) || {};
  const peopleActions = peopleStore.actions || {};

  const parentPeopleId = useMemo(
    () => extractId(client?.id || client?.['@id']),
    [client?.id, client?.['@id']],
  );

  const fetchEmployees = useCallback(async () => {
    if (!parentPeopleId || !peopleActions?.getItems) {
      setEmployees([]);
      setError('');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await peopleActions.getItems({
        'link.company': `/people/${parentPeopleId}`,
        'link.linkType': ['employee','owner'],
        peopleType: 'F',
        itemsPerPage: 100,
      });

      const items = Array.isArray(response) ? response : [];
      const normalized = items.filter(item => {
        const itemId = extractId(item?.id || item?.['@id']);
        return (
          itemId &&
          itemId !== parentPeopleId &&
          String(item?.peopleType || '').toUpperCase() !== 'J'
        );
      });

      setEmployees(normalized);
    } catch (fetchError) {
      setEmployees([]);
      setError(errorText);
    } finally {
      setIsLoading(false);
    }
  }, [errorText, parentPeopleId, peopleActions]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const resetForm = () => {
    setFormData({
      name: '',
      alias: '',
      foundationDateBr: '',
    });
  };

  const handleOpenModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSaveEmployee = async () => {
    const name = String(formData.name || '').trim();
    const alias = String(formData.alias || '').trim();

    if (!name || !alias) {
      showError(requiredErrorText);
      return;
    }

    let foundationDate;
    if (formData.foundationDateBr) {
      foundationDate = parseBrDateToYmd(formData.foundationDateBr);
      if (!foundationDate) {
        showError('Data invalida. Use o formato DD/MM/AAAA.');
        return;
      }
    }

    if (!peopleActions?.company || !parentPeopleId) {
      showError(createErrorText);
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name,
        alias,
        peopleType: 'F',
        company: `/people/${parentPeopleId}`,
        linkType: 'employee',
        'extra-data': {},
      };

      if (foundationDate) {
        payload.foundationDate = foundationDate;
      }

      await peopleActions.company(payload);
      showSuccess(createSuccessText);
      handleCloseModal();
      fetchEmployees();
    } catch (saveError) {
      showError(saveError?.message || createErrorText);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <View style={customStyles.tabContent}>
        <View style={customStyles.section}>
          <View style={customStyles.sectionHeader}>
            <Text style={customStyles.sectionTitle}>{title}</Text>
            <TouchableOpacity onPress={handleOpenModal}>
              <Icon name="add" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : error ? (
            <Text style={customStyles.emptyText}>{error}</Text>
          ) : employees.length === 0 ? (
            <Text style={customStyles.emptyText}>{emptyText}</Text>
          ) : (
            employees.map(item => (
              <TouchableOpacity
                key={String(item?.id || item?.['@id'])}
                style={customStyles.listItem}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('ClientDetails', { client: item })}>
                <View style={customStyles.itemContent}>
                  <Icon name="person" size={20} color={colors.primary} />
                  <View>
                    <Text style={customStyles.itemText}>
                      {String(item?.name || '-')}
                    </Text>
                    <Text style={customStyles.itemSubtext}>
                      {`ID: ${extractId(item?.id || item?.['@id']) || '-'}`}
                      {item?.alias ? ` - ${String(item.alias)}` : ''}
                    </Text>
                  </View>
                </View>
                <Icon name="chevron-right" size={20} color="#94A3B8" />
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>

      <AnimatedModal
        visible={showModal}
        onRequestClose={handleCloseModal}
        style={{ justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: '#fff',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '85%',
            width: '100%',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
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
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#0F172A' }}>
              {createTitle}
            </Text>
            <TouchableOpacity
              onPress={handleCloseModal}
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
            style={{ padding: 24 }}
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
                Nome *
              </Text>
              <TextInput
                value={formData.name}
                onChangeText={text => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Digite o nome"
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
                Apelido *
              </Text>
              <TextInput
                value={formData.alias}
                onChangeText={text => setFormData(prev => ({ ...prev, alias: text }))}
                placeholder="Digite o apelido"
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

            <View style={{ marginBottom: 8 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#212529',
                  marginBottom: 8,
                }}>
                Data de Nascimento
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
                  value={formData.foundationDateBr}
                  onChangeText={text =>
                    setFormData(prev => ({
                      ...prev,
                      foundationDateBr: formatDateInput(text),
                    }))
                  }
                  placeholder="DD/MM/AAAA"
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
                handleCloseModal();
              }}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#6c757d',
                alignItems: 'center',
              }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#6c757d' }}>
                Cancelar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Keyboard.dismiss();
                handleSaveEmployee();
              }}
              disabled={isSaving}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor: isSaving ? '#6c757d' : colors.primary,
                alignItems: 'center',
              }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </AnimatedModal>
    </>
  );
};

export default EmployeesTab;
