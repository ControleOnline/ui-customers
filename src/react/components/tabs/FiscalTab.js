import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useStore } from '@store';
import { api } from '@controleonline/ui-common/src/api';
import useToastMessage from '@controleonline/ui-crm/src/react/hooks/useToastMessage';
import styles from './FiscalTab.styles';

const TAX_REGIME_OPTIONS = [
  { value: '1', label: 'Simples Nacional' },
  { value: '2', label: 'Simples Nacional - excesso sublimite' },
  { value: '3', label: 'Regime Normal' },
];

const FISCAL_KEYS = [
  {
    key: 'receita-federal-tax-regime',
    label: 'Regime tributario',
    type: 'select',
    options: TAX_REGIME_OPTIONS,
  },
  {
    key: 'receita-federal-serie',
    label: 'Serie da NF',
    placeholder: 'Ex.: 1',
  },
  {
    key: 'receita-federal-last-nf',
    label: 'Ultima NF / proximo numero',
    placeholder: 'Ex.: 100',
  },
  {
    key: 'receita-federal-ibge-code',
    label: 'Codigo IBGE (municipio)',
    placeholder: 'Ex.: 3550308',
  },
  {
    key: 'receita-federal-certificate-file',
    label: 'Certificado digital (IRI / id do arquivo)',
    placeholder: 'Identificador do .pfx no gerenciador da empresa',
  },
  {
    key: 'receita-federal-certificate-password',
    label: 'Senha do certificado',
    placeholder: 'Senha do certificado',
    secureTextEntry: true,
  },
];

/**
 * Atalho para as mesmas configuracoes fiscais basicas usadas no Configurador /
 * Integracao Receita Federal (#347). Mesmas chaves de company config — sem
 * duplicar regra de negocio.
 */
export default function FiscalTab({ client }) {
  const companyId = client?.id;
  const { showError, showSuccess } = useToastMessage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState({});

  const loadConfigs = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await api.fetch('/configs', {
        params: {
          company: companyId,
          'configKey[]': FISCAL_KEYS.map(item => item.key),
        },
      });
      const members = Array.isArray(response)
        ? response
        : response?.member || response?.['hydra:member'] || [];
      const map = {};
      members.forEach(item => {
        const key = item?.configKey || item?.key;
        if (key) {
          map[key] = item?.configValue ?? item?.value ?? '';
        }
      });
      // Fallback: company.configs object if present
      const fromClient = client?.configs || {};
      FISCAL_KEYS.forEach(({ key }) => {
        if (map[key] === undefined || map[key] === '') {
          map[key] = fromClient[key] ?? '';
        }
      });
      setValues(map);
    } catch (error) {
      showError(error?.message || 'Nao foi possivel carregar configuracoes fiscais.');
    } finally {
      setLoading(false);
    }
  }, [client?.configs, companyId, showError]);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  const updateField = (key, value) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!companyId || saving) return;
    setSaving(true);
    try {
      await Promise.all(
        FISCAL_KEYS.map(field =>
          api.fetch('/configs', {
            method: 'POST',
            body: {
              company: `/people/${companyId}`,
              configKey: field.key,
              configValue: String(values[field.key] ?? ''),
            },
          }),
        ),
      );
      showSuccess('Configuracoes fiscais salvas.');
    } catch (error) {
      showError(error?.message || 'Nao foi possivel salvar configuracoes fiscais.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#166534" />
        <Text style={styles.centerText}>Carregando configuracoes fiscais...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Configuracoes Fiscais</Text>
      <Text style={styles.subtitle}>
        Mesmos campos da integracao Receita Federal / Configurador Geral. Alteracoes
        refletem em todas as telas que usam essas chaves de configuracao da empresa.
      </Text>

      {FISCAL_KEYS.map(field => (
        <View key={field.key} style={styles.fieldGroup}>
          <Text style={styles.label}>{field.label}</Text>
          {field.type === 'select' ? (
            <View style={styles.selectList}>
              {(field.options || []).map(option => {
                const selected = String(values[field.key] || '') === String(option.value);
                return (
                  <TouchableOpacity
                    key={String(option.value)}
                    style={[styles.selectOption, selected && styles.selectOptionActive]}
                    activeOpacity={0.85}
                    onPress={() => updateField(field.key, String(option.value))}>
                    <Text style={[styles.selectOptionText, selected && styles.selectOptionTextActive]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <TextInput
              style={styles.input}
              value={String(values[field.key] || '')}
              onChangeText={value => updateField(field.key, value)}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={Boolean(field.secureTextEntry)}
              placeholder={field.placeholder}
            />
          )}
        </View>
      ))}

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        disabled={saving}
        activeOpacity={0.9}
        onPress={handleSave}>
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Icon name="save" size={16} color="#FFFFFF" />
        )}
        <Text style={styles.saveButtonText}>Salvar configuracoes fiscais</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
