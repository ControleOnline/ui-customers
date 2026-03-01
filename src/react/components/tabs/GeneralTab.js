import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useMessage} from '@controleonline/ui-common/src/react/components/MessageService';
import { colors } from '@controleonline/../../src/styles/colors';
import ContactTab from './ContactTab';
import DocumentsTab from './DocumentsTab';
import AddressesTab from './AddressesTab';

const normalizeText = value => String(value || '').replace(/\s+/g, ' ').trim();

const formatYmdToBr = value => {
  if (!value) {
    return '';
  }

  const normalized = String(value).split('T')[0];
  const parts = normalized.split('-');
  if (parts.length !== 3) {
    return '';
  }

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
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

const GeneralTab = ({
  client,
  customStyles,
  isEditing,
  onUpdateClient,
  onSaveClientData,
}) => {
  const {showError, showSuccess} = useMessage();
  const [isSavingRegistration, setIsSavingRegistration] = useState(false);
  const [registrationForm, setRegistrationForm] = useState({
    name: '',
    alias: '',
    dateBr: '',
    peopleType: 'J',
  });
  const [originalRegistrationForm, setOriginalRegistrationForm] = useState({
    name: '',
    alias: '',
    dateBr: '',
    peopleType: 'J',
  });

  useEffect(() => {
    const initial = {
      name: normalizeText(client?.name),
      alias: normalizeText(client?.alias),
      dateBr: formatYmdToBr(client?.foundationDate),
      peopleType: String(client?.peopleType || 'J').toUpperCase(),
    };

    setRegistrationForm(initial);
    setOriginalRegistrationForm(initial);
  }, [client?.id, client?.name, client?.alias, client?.foundationDate, client?.peopleType]);

  const isPessoaFisica = registrationForm.peopleType === 'F';
  const nameLabel = isPessoaFisica ? 'Nome' : 'Razao Social';
  const aliasLabel = isPessoaFisica ? 'Apelido' : 'Nome Fantasia';
  const dateLabel = isPessoaFisica ? 'Data de Nascimento' : 'Data de Fundacao';

  const hasRegistrationChanges = useMemo(() => {
    return (
      normalizeText(registrationForm.name) !== normalizeText(originalRegistrationForm.name) ||
      normalizeText(registrationForm.alias) !== normalizeText(originalRegistrationForm.alias) ||
      String(registrationForm.dateBr || '') !== String(originalRegistrationForm.dateBr || '')
    );
  }, [registrationForm, originalRegistrationForm]);

  const saveRegistration = async () => {
    if (!isEditing || isSavingRegistration || !hasRegistrationChanges) {
      return;
    }

    const name = normalizeText(registrationForm.name);
    const alias = normalizeText(registrationForm.alias);

    if (!name || !alias) {
      showError?.('Nome e apelido sao obrigatorios.');
      return;
    }

    let foundationDate;
    if (registrationForm.dateBr) {
      foundationDate = parseBrDateToYmd(registrationForm.dateBr);
      if (!foundationDate) {
        showError?.('Data invalida. Use o formato DD/MM/AAAA.');
        return;
      }
    }

    if (!onSaveClientData) {
      showError?.('Salvamento indisponivel nesta tela.');
      return;
    }

    setIsSavingRegistration(true);
    try {
      const payload = {
        name,
        alias,
      };

      if (foundationDate) {
        payload.foundationDate = foundationDate;
      }

      await onSaveClientData(payload);

      onUpdateClient?.('name', name);
      onUpdateClient?.('alias', alias);
      if (foundationDate) {
        onUpdateClient?.('foundationDate', foundationDate);
      }

      const updated = {
        ...registrationForm,
        name,
        alias,
        dateBr: foundationDate ? formatYmdToBr(foundationDate) : registrationForm.dateBr,
      };

      setRegistrationForm(updated);
      setOriginalRegistrationForm(updated);
      showSuccess?.('Dados cadastrais atualizados com sucesso.');
    } catch (error) {
      showError?.('Nao foi possivel salvar os dados cadastrais.');
    } finally {
      setIsSavingRegistration(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fff' }}
      contentContainerStyle={{ paddingBottom: 80 }}
      nestedScrollEnabled
      showsVerticalScrollIndicator={false}>
      <View style={customStyles.section}>
        <View style={customStyles.sectionHeader}>
          <Text style={customStyles.sectionTitle}>Dados Cadastrais</Text>
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 6 }}>
            {nameLabel}
          </Text>
          <TextInput
            value={registrationForm.name}
            onChangeText={text => setRegistrationForm(prev => ({ ...prev, name: text }))}
            placeholder={nameLabel}
            style={{
              borderWidth: 1,
              borderColor: '#E2E8F0',
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 15,
              color: '#0F172A',
              backgroundColor: '#F8FAFC',
            }}
            placeholderTextColor="#94A3B8"
          />
        </View>

        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 6 }}>
            {aliasLabel}
          </Text>
          <TextInput
            value={registrationForm.alias}
            onChangeText={text => setRegistrationForm(prev => ({ ...prev, alias: text }))}
            placeholder={aliasLabel}
            style={{
              borderWidth: 1,
              borderColor: '#E2E8F0',
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 15,
              color: '#0F172A',
              backgroundColor: '#F8FAFC',
            }}
            placeholderTextColor="#94A3B8"
          />
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 6 }}>
            {dateLabel}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#E2E8F0',
              borderRadius: 10,
              backgroundColor: '#F8FAFC',
            }}>
            <Icon name="event" size={18} color={colors.primary} style={{ marginLeft: 10 }} />
            <TextInput
              value={registrationForm.dateBr}
              onChangeText={text =>
                setRegistrationForm(prev => ({
                  ...prev,
                  dateBr: formatDateInput(text),
                }))
              }
              placeholder="DD/MM/AAAA"
              keyboardType="numeric"
              maxLength={10}
              style={{
                flex: 1,
                paddingHorizontal: 10,
                paddingVertical: 10,
                fontSize: 15,
                color: '#0F172A',
              }}
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>

        {isEditing && (
          <TouchableOpacity
            onPress={saveRegistration}
            disabled={!hasRegistrationChanges || isSavingRegistration}
            activeOpacity={0.85}
            style={{
              height: 42,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor:
                !hasRegistrationChanges || isSavingRegistration
                  ? '#CBD5E1'
                  : colors.primary,
            }}>
            {isSavingRegistration ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>
                Salvar alteracoes
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <ContactTab
        client={client}
        customStyles={customStyles}
        isEditing={isEditing}
        onUpdateClient={onUpdateClient}
      />
      <DocumentsTab
        client={client}
        customStyles={customStyles}
        isEditing={isEditing}
        onUpdateClient={onUpdateClient}
      />
      <AddressesTab
        client={client}
        customStyles={customStyles}
        isEditing={isEditing}
        onUpdateClient={onUpdateClient}
      />
    </ScrollView>
  );
};

export default GeneralTab;
