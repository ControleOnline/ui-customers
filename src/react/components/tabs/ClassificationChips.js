/**
 * Classification chips on General tab (#377).
 * PF: profession + position | PJ: sector + activity_branch
 * Seeds default catalog once per company+context; toggles people_categories.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const [loadError, setLoadError] = useState('');

  // Prevent re-entry / dependency loops (stores are unstable refs)
  const loadGenRef = useRef(0);
  const seededRef = useRef(new Set()); // `${companyId}:${context}`
  const inFlightRef = useRef(false);

  const loadCatalogAndAssociations = useCallback(async () => {
    if (!clientId || !companyId) return;
    if (inFlightRef.current) return;

    const gen = ++loadGenRef.current;
    inFlightRef.current = true;
    setLoading(true);
    setLoadError('');

    const getCategories = categoriesStore?.actions?.getItems;
    const saveCategory = categoriesStore?.actions?.save;
    const getPeopleCategories = peopleCategoryStore?.actions?.getItems;
    const companyIri = `/people/${companyId}`;

    try {
      const nextCatalog = {};

      for (const ctx of contexts) {
        if (gen !== loadGenRef.current) return;

        let list = [];
        if (getCategories) {
          try {
            list = normalizeCollection(
              await getCategories({
                context: ctx,
                company: companyIri,
                itemsPerPage: 100,
              }),
            );
          } catch (e) {
            list = [];
          }
        }

        const seedKey = `${companyId}:${ctx}`;
        // Seed at most once per company+context per session
        if (list.length === 0 && saveCategory && !seededRef.current.has(seedKey)) {
          seededRef.current.add(seedKey);
          const names = DEFAULT_CLASSIFICATION_CATALOG[ctx] || [];
          for (const name of names) {
            if (gen !== loadGenRef.current) return;
            try {
              await saveCategory({ name, context: ctx, company: companyIri });
            } catch {
              // ignore duplicates / validation
            }
          }
          if (getCategories) {
            try {
              list = normalizeCollection(
                await getCategories({
                  context: ctx,
                  company: companyIri,
                  itemsPerPage: 100,
                }),
              );
            } catch {
              list = [];
            }
          }
        }

        nextCatalog[ctx] = list;
      }

      if (gen !== loadGenRef.current) return;
      setCatalogByContext(nextCatalog);

      if (getPeopleCategories) {
        try {
          const rows = normalizeCollection(
            await getPeopleCategories({
              people: `/people/${clientId}`,
              active: true,
              itemsPerPage: 100,
            }),
          );
          if (gen === loadGenRef.current) setAssociations(rows);
        } catch {
          if (gen === loadGenRef.current) setAssociations([]);
        }
      }
    } catch (e) {
      if (gen === loadGenRef.current) {
        setLoadError(e?.message || 'Falha ao carregar classificação');
        setCatalogByContext({});
        setAssociations([]);
      }
    } finally {
      if (gen === loadGenRef.current) {
        setLoading(false);
        inFlightRef.current = false;
      }
    }
  }, [clientId, companyId, contexts, categoriesStore, peopleCategoryStore]);

  // Only re-run when primitive ids / peopleType change — not store identity
  useEffect(() => {
    loadCatalogAndAssociations();
    return () => {
      loadGenRef.current += 1;
      inFlightRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: stores are unstable
  }, [clientId, companyId, peopleType]);

  const associationByCategoryId = useMemo(() => {
    const map = new Map();
    for (const row of associations) {
      const catId = extractId(
        row?.category?.id || row?.category?.['@id'] || row?.category,
      );
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
        <Text style={styles.hint}>
          Selecione uma empresa para carregar as categorias.
        </Text>
      ) : loading ? (
        <ActivityIndicator style={{ marginVertical: 8 }} />
      ) : loadError ? (
        <Text style={styles.hint}>{loadError}</Text>
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
