/**
 * Classification chips on General tab (#377).
 * PF: profession + position | PJ: sector + activity_branch
 * Ensures default catalog categories exist per company, then toggle association via people_categories.
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

const toIri = (resource, id) => {
  const n = extractId(id);
  return n ? `/${resource}/${n}` : null;
};

/** Default catalog (context → names) — seeded once per company when empty */
export const DEFAULT_CLASSIFICATION_CATALOG = {
  profession: [
    'Administrador',
    'Advogado',
    'Contador',
    'Engenheiro',
    'Médico',
    'Vendedor',
    'Técnico',
    'Outros',
  ],
  position: [
    'Diretor',
    'Gerente',
    'Coordenador',
    'Supervisor',
    'Analista',
    'Assistente',
    'Estagiário',
  ],
  sector: [
    'Comércio',
    'Indústria',
    'Serviços',
    'Tecnologia',
    'Saúde',
    'Educação',
    'Alimentação',
    'Construção',
  ],
  activity_branch: [
    'Varejo',
    'Atacado',
    'Restaurante',
    'Consultoria',
    'Software',
    'Transporte',
    'Logística',
    'Agronegócio',
  ],
};

const CONTEXT_LABELS = {
  profession: 'Profissão',
  position: 'Cargo',
  sector: 'Setor',
  activity_branch: 'Ramo de atividade',
};

const contextsForPeopleType = peopleType => {
  const t = String(peopleType || 'J').toUpperCase();
  return t === 'F' ? ['profession', 'position'] : ['sector', 'activity_branch'];
};

const todayYmd = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

const ClassificationChips = ({ client, companyId: companyIdProp = null }) => {
  const peopleStore = useStore('people');
  const categoriesStore = useStore('categories');
  const peopleCategoryStore = useStore('people_category');

  const clientId = extractId(client?.id || client?.['@id']);
  const peopleType = String(client?.peopleType || 'J').toUpperCase() || 'J';
  const contexts = useMemo(() => contextsForPeopleType(peopleType), [peopleType]);

  const companyId = useMemo(() => {
    if (companyIdProp) return extractId(companyIdProp);
    const cc = peopleStore?.getters?.currentCompany;
    return extractId(cc?.id || cc?.['@id'] || cc);
  }, [companyIdProp, peopleStore?.getters?.currentCompany]);

  const [catalogByContext, setCatalogByContext] = useState({});
  const [associations, setAssociations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyKey, setBusyKey] = useState(null);

  const ensureDefaults = useCallback(
    async context => {
      const getItems = categoriesStore?.actions?.getItems;
      const save = categoriesStore?.actions?.save;
      if (!getItems || !save || !companyId) return [];

      const companyIri = `/people/${companyId}`;
      let list = normalizeCollection(
        await getItems({ context, company: companyIri, itemsPerPage: 100 }),
      );

      if (list.length === 0) {
        const names = DEFAULT_CLASSIFICATION_CATALOG[context] || [];
        for (const name of names) {
          try {
            await save({
              name,
              context,
              company: companyIri,
            });
          } catch {
            // ignore duplicate / race
          }
        }
        list = normalizeCollection(
          await getItems({ context, company: companyIri, itemsPerPage: 100 }),
        );
      }

      return list;
    },
    [categoriesStore, companyId],
  );

  const load = useCallback(async () => {
    if (!clientId || !companyId) return;
    setLoading(true);
    try {
      const nextCatalog = {};
      for (const ctx of contexts) {
        nextCatalog[ctx] = await ensureDefaults(ctx);
      }
      setCatalogByContext(nextCatalog);

      const getPc = peopleCategoryStore?.actions?.getItems;
      if (getPc) {
        const rows = normalizeCollection(
          await getPc({
            people: `/people/${clientId}`,
            active: true,
            itemsPerPage: 100,
          }),
        );
        setAssociations(rows);
      }
    } catch {
      setCatalogByContext({});
      setAssociations([]);
    } finally {
      setLoading(false);
    }
  }, [clientId, companyId, contexts, ensureDefaults, peopleCategoryStore]);

  useEffect(() => {
    load();
  }, [load]);

  const associationByCategoryId = useMemo(() => {
    const map = new Map();
    for (const row of associations) {
      const catId = extractId(row?.category?.id || row?.category?.['@id'] || row?.category);
      if (catId) map.set(catId, row);
    }
    return map;
  }, [associations]);

  const toggle = useCallback(
    async category => {
      const catId = extractId(category?.id || category?.['@id']);
      if (!catId || !clientId) return;
      const key = String(catId);
      setBusyKey(key);
      try {
        const existing = associationByCategoryId.get(catId);
        if (existing) {
          const rowId = extractId(existing?.id || existing?.['@id']);
          if (rowId && peopleCategoryStore?.actions?.remove) {
            await peopleCategoryStore.actions.remove(rowId);
          }
        } else {
          const payload = {
            people: `/people/${clientId}`,
            category: `/categories/${catId}`,
            startDate: todayYmd(),
            active: true,
          };
          // Cargo (position) vinculado à empresa logada
          if (String(category?.context || '') === 'position' && companyId) {
            payload.peopleCompany = `/people/${companyId}`;
          }
          if (peopleCategoryStore?.actions?.save) {
            await peopleCategoryStore.actions.save(payload);
          }
        }
        const getPc = peopleCategoryStore?.actions?.getItems;
        if (getPc) {
          const rows = normalizeCollection(
            await getPc({
              people: `/people/${clientId}`,
              active: true,
              itemsPerPage: 100,
            }),
          );
          setAssociations(rows);
        }
      } finally {
        setBusyKey(null);
      }
    },
    [associationByCategoryId, clientId, companyId, peopleCategoryStore],
  );

  if (!clientId) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Classificação</Text>
      {!companyId ? (
        <Text style={styles.hint}>Selecione uma empresa para carregar as categorias.</Text>
      ) : loading ? (
        <ActivityIndicator style={{ marginVertical: 8 }} />
      ) : (
        contexts.map(ctx => {
          const list = catalogByContext[ctx] || [];
          return (
            <View key={ctx} style={styles.block}>
              <Text style={styles.section}>{CONTEXT_LABELS[ctx] || ctx}</Text>
              <View style={styles.row}>
                {list.length === 0 ? (
                  <Text style={styles.hint}>Nenhuma categoria cadastrada.</Text>
                ) : (
                  list.map(cat => {
                    const id = extractId(cat?.id || cat?.['@id']);
                    const selected = associationByCategoryId.has(id);
                    const busy = busyKey === String(id);
                    return (
                      <TouchableOpacity
                        key={id || cat?.name}
                        onPress={() => toggle(cat)}
                        disabled={!!busyKey}
                        style={[
                          styles.chip,
                          selected ? styles.chipOn : styles.chipOff,
                          busy && styles.chipBusy,
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            selected ? styles.chipTextOn : styles.chipTextOff,
                          ]}
                        >
                          {busy ? '…' : cat?.name || `#${id}`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            </View>
          );
        })
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginTop: 16, marginBottom: 8 },
  title: { fontSize: 15, fontWeight: '600', color: '#0F172A', marginBottom: 8 },
  block: { marginBottom: 12 },
  section: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  chipOn: { backgroundColor: '#DBEAFE', borderColor: '#3B82F6' },
  chipOff: { backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' },
  chipBusy: { opacity: 0.6 },
  chipText: { fontSize: 13 },
  chipTextOn: { color: '#1E40AF', fontWeight: '600' },
  chipTextOff: { color: '#475569' },
  hint: { fontSize: 12, color: '#94A3B8' },
});

export default ClassificationChips;
