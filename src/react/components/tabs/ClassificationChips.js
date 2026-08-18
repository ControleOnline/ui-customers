/**
 * Classification chips on General tab (#377).
 * PF: profession + position | PJ: sector + activity_branch
 *
 * No auto-seed on mount (that caused request storms). Catalog names are
 * shown as chips; category rows are created lazily on first select.
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

const contextsForPeopleType = peopleType =>
  String(peopleType || 'J').toUpperCase() === 'F'
    ? ['profession', 'position']
    : ['sector', 'activity_branch'];

const todayYmd = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const normalizeName = name => String(name || '').trim().toLowerCase();

/** Module-level: survive remounts within the same SPA session */
const loadedKeys = new Set();
const cacheByKey = new Map(); // key -> { catalogByContext, associations }

const ClassificationChips = ({ client, companyId: companyIdProp = null }) => {
  const peopleStore = useStore('people');
  const categoriesStore = useStore('categories');
  const peopleCategoryStore = useStore('people_category');
  const { showError, showSuccess } = useMessage?.() || {};

  const clientId = extractId(client?.id || client?.['@id']);
  const peopleType = String(client?.peopleType || 'J').toUpperCase() || 'J';
  const contexts = useMemo(() => contextsForPeopleType(peopleType), [peopleType]);

  const companyFromStore = extractId(
    peopleStore?.getters?.currentCompany?.id ||
      peopleStore?.getters?.currentCompany?.['@id'] ||
      peopleStore?.getters?.currentCompany,
  );
  const companyId = companyIdProp ? extractId(companyIdProp) : companyFromStore;

  const cacheKey =
    clientId && companyId ? `${clientId}:${companyId}:${peopleType}` : null;

  const [catalogByContext, setCatalogByContext] = useState(() => {
    if (cacheKey && cacheByKey.has(cacheKey)) {
      return cacheByKey.get(cacheKey).catalogByContext || {};
    }
    return {};
  });
  const [associations, setAssociations] = useState(() => {
    if (cacheKey && cacheByKey.has(cacheKey)) {
      return cacheByKey.get(cacheKey).associations || [];
    }
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [busyKey, setBusyKey] = useState(null);

  // Stable action refs — avoid effect churn
  const actionsRef = useRef({});
  actionsRef.current = {
    getCategories: categoriesStore?.actions?.getItems,
    saveCategory: categoriesStore?.actions?.save,
    getPeopleCategories: peopleCategoryStore?.actions?.getItems,
    savePeopleCategory: peopleCategoryStore?.actions?.save,
    removePeopleCategory: peopleCategoryStore?.actions?.remove,
  };

  useEffect(() => {
    if (!clientId || !companyId || !cacheKey) return;

    // Already loaded this session for this key — use cache, no network
    if (loadedKeys.has(cacheKey) && cacheByKey.has(cacheKey)) {
      const cached = cacheByKey.get(cacheKey);
      setCatalogByContext(cached.catalogByContext || {});
      setAssociations(cached.associations || []);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      const companyIri = `/people/${companyId}`;
      const { getCategories, getPeopleCategories } = actionsRef.current;
      const nextCatalog = {};

      try {
        for (const ctx of contexts) {
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
            } catch {
              list = [];
            }
          }
          nextCatalog[ctx] = list;
        }

        let rows = [];
        if (getPeopleCategories) {
          try {
            rows = normalizeCollection(
              await getPeopleCategories({
                people: `/people/${clientId}`,
                active: true,
                itemsPerPage: 100,
              }),
            );
          } catch {
            rows = [];
          }
        }

        if (cancelled) return;
        setCatalogByContext(nextCatalog);
        setAssociations(rows);
        loadedKeys.add(cacheKey);
        cacheByKey.set(cacheKey, {
          catalogByContext: nextCatalog,
          associations: rows,
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [clientId, companyId, cacheKey, peopleType]); // contexts derived from peopleType

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

  /** Merge API categories with default names (virtual chips without id) */
  const chipsForContext = useCallback(
    ctx => {
      const fromApi = catalogByContext[ctx] || [];
      const byName = new Map();
      for (const cat of fromApi) {
        byName.set(normalizeName(cat?.name), cat);
      }
      const defaults = DEFAULT_CLASSIFICATION_CATALOG[ctx] || [];
      const chips = [];
      for (const name of defaults) {
        const existing = byName.get(normalizeName(name));
        if (existing) {
          chips.push(existing);
          byName.delete(normalizeName(name));
        } else {
          chips.push({ name, context: ctx, __virtual: true });
        }
      }
      // Keep any extra company categories not in the default list
      for (const cat of byName.values()) {
        chips.push(cat);
      }
      return chips;
    },
    [catalogByContext],
  );

  const persistCache = (nextCatalog, nextAssoc) => {
    if (!cacheKey) return;
    cacheByKey.set(cacheKey, {
      catalogByContext: nextCatalog,
      associations: nextAssoc,
    });
  };

  const ensureCategory = async (ctx, name) => {
    const companyIri = `/people/${companyId}`;
    const { getCategories, saveCategory } = actionsRef.current;
    // Prefer existing from current catalog
    const existing = (catalogByContext[ctx] || []).find(
      c => normalizeName(c?.name) === normalizeName(name),
    );
    if (existing && extractId(existing?.id || existing?.['@id'])) {
      return existing;
    }
    if (saveCategory) {
      try {
        await saveCategory({ name, context: ctx, company: companyIri });
      } catch {
        // may already exist
      }
    }
    if (getCategories) {
      const list = normalizeCollection(
        await getCategories({
          context: ctx,
          company: companyIri,
          itemsPerPage: 100,
        }),
      );
      setCatalogByContext(prev => {
        const next = { ...prev, [ctx]: list };
        persistCache(next, associations);
        return next;
      });
      return (
        list.find(c => normalizeName(c?.name) === normalizeName(name)) || null
      );
    }
    return null;
  };

  const toggle = useCallback(
    async (chip, ctx) => {
      if (!clientId || !companyId) return;
      const label = chip?.name || '';
      const key = `${ctx}:${normalizeName(label)}`;
      setBusyKey(key);
      try {
        let category = chip?.__virtual
          ? await ensureCategory(ctx, label)
          : chip;
        const catId = extractId(category?.id || category?.['@id']);
        if (!catId) {
          showError?.('Não foi possível criar/localizar a categoria. Verifique permissões ou cadastro de categorias.');
          return;
        }
        if (!actionsRef.current.savePeopleCategory && !actionsRef.current.removePeopleCategory) {
          showError?.('Store people_category não registrada no app. Atualize o app.');
          return;
        }

        const existing = associationByCategoryId.get(catId);
        const {
          removePeopleCategory,
          savePeopleCategory,
          getPeopleCategories,
        } = actionsRef.current;

        if (existing) {
          const rowId = extractId(existing?.id || existing?.['@id']);
          if (rowId && removePeopleCategory) {
            await removePeopleCategory(rowId);
          }
        } else if (savePeopleCategory) {
          const payload = {
            people: `/people/${clientId}`,
            category: `/categories/${catId}`,
            startDate: todayYmd(),
            active: true,
          };
          if (ctx === 'position') {
            payload.peopleCompany = `/people/${companyId}`;
          }
          await savePeopleCategory(payload);
        }

        if (getPeopleCategories) {
          const rows = normalizeCollection(
            await getPeopleCategories({
              people: `/people/${clientId}`,
              active: true,
              itemsPerPage: 100,
            }),
          );
          setAssociations(rows);
          persistCache(catalogByContext, rows);
        }
      } catch (e) {
        showError?.(e?.message || e?.error || 'Falha ao associar classificação');
      } finally {
        setBusyKey(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clientId, companyId, associationByCategoryId, catalogByContext],
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
      ) : (
        contexts.map(ctx => {
          const chips = chipsForContext(ctx);
          return (
            <View key={ctx} style={styles.block}>
              <Text style={styles.section}>{CONTEXT_LABELS[ctx] || ctx}</Text>
              <View style={styles.row}>
                {chips.map(chip => {
                  const id = extractId(chip?.id || chip?.['@id']);
                  const selected = id
                    ? associationByCategoryId.has(id)
                    : false;
                  const bKey = `${ctx}:${normalizeName(chip?.name)}`;
                  const busy = busyKey === bKey;
                  return (
                    <TouchableOpacity
                      key={bKey}
                      onPress={() => toggle(chip, ctx)}
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
                        {busy ? '…' : chip?.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
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
