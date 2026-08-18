/**
 * CategoriesTab — classificação de pessoas (PF: profession/position; PJ: sector/activity_branch)
 * com badges e período (start_date / end_date). Issue #377.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useStore } from '@store';
import { useMessage } from '@controleonline/ui-common/src/react/components/MessageService';

const normalizeCollection = payload => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  if (Array.isArray(payload.member)) return payload.member;
  if (Array.isArray(payload['hydra:member'])) return payload['hydra:member'];
  if (Array.isArray(payload.items)) return payload.items;
  return [];
};

const extractId = value => {
  if (!value && value !== 0) return null;
  if (typeof value === 'number') return value;
  const raw = typeof value === 'string' ? value : value?.id || value?.['@id'];
  if (!raw) return null;
  const match = String(raw).match(/(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
};

const PF_CONTEXTS = [
  { key: 'profession', label: 'Profissão' },
  { key: 'position', label: 'Cargo' },
];
const PJ_CONTEXTS = [
  { key: 'sector', label: 'Setor' },
  { key: 'activity_branch', label: 'Ramo de Atividade' },
];

const formatDate = value => {
  if (!value) return '—';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('pt-BR');
  } catch {
    return String(value);
  }
};

const CategoriesTab = ({ client }) => {
  const peopleCategoryStore = useStore('people_category');
  const categoryStore = useStore('category');
  const { showError, showSuccess } = useMessage?.() || {};
  const clientId = extractId(client?.id || client?.['@id']);
  const peopleType = String(client?.peopleType || 'J').trim().toUpperCase() || 'J';
  const isPF = peopleType === 'F';
  const contexts = isPF ? PF_CONTEXTS : PJ_CONTEXTS;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const load = useCallback(async () => {
    if (!clientId || !peopleCategoryStore?.actions?.getItems) return;
    setLoading(true);
    try {
      const res = await peopleCategoryStore.actions.getItems({
        people: `/people/${clientId}`,
        active: true,
      });
      setItems(normalizeCollection(res));
    } catch (e) {
      showError?.(e?.message || 'Falha ao carregar categorias');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [clientId, peopleCategoryStore, showError]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRemove = useCallback(
    async row => {
      const id = extractId(row?.id || row?.['@id']);
      if (!id || !peopleCategoryStore?.actions?.remove) return;
      setRemovingId(id);
      try {
        await peopleCategoryStore.actions.remove(id);
        showSuccess?.('Categoria removida.');
        await load();
      } catch (e) {
        showError?.(e?.message || 'Falha ao remover categoria');
      } finally {
        setRemovingId(null);
      }
    },
    [peopleCategoryStore, load, showError, showSuccess],
  );

  const badgeLabel = row => {
    const cat = row?.category;
    const name = cat?.name || cat?.['@id'] || 'Categoria';
    const ctx = cat?.context || '';
    const ctxLabel = contexts.find(c => c.key === ctx)?.label || ctx;
    return ctxLabel ? `${name} · ${ctxLabel}` : name;
  };

  if (!clientId) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>Selecione uma pessoa para ver categorias.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Classificação</Text>
      <Text style={styles.subtitle}>
        {isPF
          ? 'Profissão e cargo (com período).'
          : 'Setor e ramo de atividade (com período).'}
      </Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 16 }} />
      ) : items.length === 0 ? (
        <Text style={styles.muted}>Nenhuma categoria associada.</Text>
      ) : (
        <View style={styles.badgeList}>
          {items.map(row => {
            const id = extractId(row?.id || row?.['@id']);
            return (
              <View key={id || Math.random()} style={styles.badge}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.badgeText}>{badgeLabel(row)}</Text>
                  <Text style={styles.dates}>
                    {formatDate(row?.startDate || row?.start_date)} →{' '}
                    {formatDate(row?.endDate || row?.end_date)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemove(row)}
                  disabled={removingId === id}
                  style={styles.removeBtn}
                >
                  <Text style={styles.removeText}>
                    {removingId === id ? '…' : 'Remover'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      <Text style={[styles.muted, { marginTop: 16 }]}>
        Para adicionar: use o cadastro de categorias (context{' '}
        {contexts.map(c => c.key).join(', ')}) e associe via API{' '}
        <Text style={{ fontFamily: 'monospace' }}>/people_categories</Text> com
        start_date / end_date
        {isPF ? ' e people_company_id no cargo.' : '.'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#64748B', marginBottom: 12 },
  muted: { fontSize: 13, color: '#94A3B8' },
  badgeList: { gap: 8 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  badgeText: { fontSize: 14, fontWeight: '500', color: '#312E81' },
  dates: { fontSize: 12, color: '#6366F1', marginTop: 2 },
  removeBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  removeText: { color: '#DC2626', fontSize: 13 },
});

export default CategoriesTab;
