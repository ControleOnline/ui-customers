/**
 * Classification on General tab (#377).
 * Shows only associations already linked to the person (chip + X to remove).
 * "+" opens search modal to add from existing categories (can be hundreds).
 * Does NOT create categories — catalog is managed by admin / discoveryCategory.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
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
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
};

const categoryName = row =>
  row?.category?.name || row?.name || `#${extractId(row?.category || row) || '?'}`;

const categoryContext = row =>
  row?.category?.context || row?.context || '';

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

  const [associations, setAssociations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);

  // Add modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContext, setModalContext] = useState(null);
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [addingId, setAddingId] = useState(null);

  const actionsRef = useRef({});
  actionsRef.current = {
    getCategories: categoriesStore?.actions?.getItems,
    getPeopleCategories: peopleCategoryStore?.actions?.getItems,
    savePeopleCategory: peopleCategoryStore?.actions?.save,
    removePeopleCategory: peopleCategoryStore?.actions?.remove,
  };

  const loadAssociations = useCallback(async () => {
    if (!clientId) return;
    const getPc = actionsRef.current.getPeopleCategories;
    if (!getPc) {
      setAssociations([]);
      return;
    }
    setLoading(true);
    try {
      const rows = normalizeCollection(
        await getPc({
          people: `/people/${clientId}`,
          active: true,
          itemsPerPage: 100,
        }),
      );
      // Keep only contexts relevant to this people type
      const allowed = new Set(contexts);
      setAssociations(
        rows.filter(r => {
          const ctx = categoryContext(r);
          return !ctx || allowed.has(ctx);
        }),
      );
    } catch (e) {
      showError?.(e?.message || 'Falha ao carregar classificação');
      setAssociations([]);
    } finally {
      setLoading(false);
    }
  }, [clientId, contexts, showError]);

  useEffect(() => {
    loadAssociations();
  }, [loadAssociations]);

  const associationsByContext = useMemo(() => {
    const map = {};
    for (const ctx of contexts) map[ctx] = [];
    for (const row of associations) {
      const ctx = categoryContext(row);
      if (ctx && map[ctx]) map[ctx].push(row);
      else if (contexts[0]) map[contexts[0]].push(row);
    }
    return map;
  }, [associations, contexts]);

  const associatedCategoryIds = useMemo(() => {
    const set = new Set();
    for (const row of associations) {
      const id = extractId(row?.category?.id || row?.category?.['@id'] || row?.category);
      if (id) set.add(id);
    }
    return set;
  }, [associations]);

  const removeAssociation = async row => {
    const rowId = extractId(row?.id || row?.['@id']);
    if (!rowId) return;
    const remove = actionsRef.current.removePeopleCategory;
    if (!remove) {
      showError?.('Store people_category não disponível. Atualize o app.');
      return;
    }
    setBusyId(rowId);
    try {
      await remove(rowId);
      setAssociations(prev => prev.filter(r => extractId(r?.id || r?.['@id']) !== rowId));
      showSuccess?.('Classificação removida');
    } catch (e) {
      showError?.(e?.message || 'Falha ao remover classificação');
    } finally {
      setBusyId(null);
    }
  };

  const openAddModal = ctx => {
    setModalContext(ctx);
    setSearch('');
    setOptions([]);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalContext(null);
    setSearch('');
    setOptions([]);
  };

  // Debounced search of existing categories (no create)
  useEffect(() => {
    if (!modalOpen || !modalContext || !companyId) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      const getCategories = actionsRef.current.getCategories;
      if (!getCategories) {
        showError?.('Store categories não disponível.');
        return;
      }
      setOptionsLoading(true);
      try {
        const params = {
          context: modalContext,
          company: `/people/${companyId}`,
          itemsPerPage: 30,
        };
        const q = String(search || '').trim();
        if (q) params.name = q;

        const list = normalizeCollection(await getCategories(params));
        if (cancelled) return;
        // Exclude already associated
        setOptions(
          list.filter(c => {
            const id = extractId(c?.id || c?.['@id']);
            return id && !associatedCategoryIds.has(id);
          }),
        );
      } catch (e) {
        if (!cancelled) {
          setOptions([]);
          showError?.(e?.message || 'Falha ao buscar categorias');
        }
      } finally {
        if (!cancelled) setOptionsLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [modalOpen, modalContext, companyId, search, associatedCategoryIds, showError]);

  const addCategory = async cat => {
    const catId = extractId(cat?.id || cat?.['@id']);
    if (!catId || !clientId) return;
    const save = actionsRef.current.savePeopleCategory;
    if (!save) {
      showError?.('Store people_category não disponível. Atualize o app.');
      return;
    }
    setAddingId(catId);
    try {
      const payload = {
        people: `/people/${clientId}`,
        category: `/categories/${catId}`,
        startDate: todayYmd(),
        active: true,
      };
      if (modalContext === 'position' && companyId) {
        payload.peopleCompany = `/people/${companyId}`;
      }
      await save(payload);
      closeModal();
      await loadAssociations();
      showSuccess?.('Classificação adicionada');
    } catch (e) {
      showError?.(e?.message || 'Falha ao adicionar classificação');
    } finally {
      setAddingId(null);
    }
  };

  if (!clientId) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Classificação</Text>
      {!companyId ? (
        <Text style={styles.hint}>Selecione uma empresa para gerenciar a classificação.</Text>
      ) : loading ? (
        <ActivityIndicator style={{ marginVertical: 8 }} />
      ) : (
        contexts.map(ctx => {
          const rows = associationsByContext[ctx] || [];
          return (
            <View key={ctx} style={styles.block}>
              <Text style={styles.section}>{CONTEXT_LABELS[ctx] || ctx}</Text>
              <View style={styles.row}>
                {rows.map(row => {
                  const rowId = extractId(row?.id || row?.['@id']);
                  const busy = busyId === rowId;
                  return (
                    <View key={rowId || categoryName(row)} style={[styles.chip, styles.chipOn]}>
                      <Text style={[styles.chipText, styles.chipTextOn]} numberOfLines={1}>
                        {busy ? '…' : categoryName(row)}
                      </Text>
                      <TouchableOpacity
                        onPress={() => removeAssociation(row)}
                        disabled={!!busyId}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityLabel="Remover classificação"
                        style={styles.chipX}
                      >
                        <Text style={styles.chipXText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
                <TouchableOpacity
                  onPress={() => openAddModal(ctx)}
                  style={[styles.chip, styles.chipAdd]}
                  accessibilityLabel={`Adicionar ${CONTEXT_LABELS[ctx] || ctx}`}
                >
                  <Text style={styles.chipAddText}>+</Text>
                </TouchableOpacity>
              </View>
              {rows.length === 0 && (
                <Text style={styles.hintEmpty}>Nenhuma classificação. Use + para adicionar.</Text>
              )}
            </View>
          );
        })
      )}

      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Adicionar {CONTEXT_LABELS[modalContext] || 'categoria'}
              </Text>
              <TouchableOpacity onPress={closeModal} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.modalClose}>×</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar categoria…"
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
              autoFocus
            />
            {optionsLoading ? (
              <ActivityIndicator style={{ marginVertical: 16 }} />
            ) : (
              <FlatList
                data={options}
                keyExtractor={item => String(extractId(item?.id || item?.['@id']) || item?.name)}
                keyboardShouldPersistTaps="handled"
                style={styles.optionsList}
                ListEmptyComponent={
                  <Text style={styles.hint}>
                    {search.trim()
                      ? 'Nenhuma categoria encontrada.'
                      : 'Digite para buscar ou aguarde a lista.'}
                  </Text>
                }
                renderItem={({ item }) => {
                  const id = extractId(item?.id || item?.['@id']);
                  const busy = addingId === id;
                  return (
                    <TouchableOpacity
                      style={styles.optionRow}
                      onPress={() => addCategory(item)}
                      disabled={!!addingId}
                    >
                      <Text style={styles.optionText}>{busy ? '…' : item?.name}</Text>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>
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
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
    borderWidth: 1,
    maxWidth: '100%',
  },
  chipOn: { backgroundColor: '#DBEAFE', borderColor: '#3B82F6' },
  chipAdd: {
    backgroundColor: '#F8FAFC',
    borderColor: '#94A3B8',
    borderStyle: 'dashed',
    paddingHorizontal: 12,
    paddingLeft: 12,
    paddingRight: 12,
  },
  chipText: { fontSize: 13, maxWidth: 180 },
  chipTextOn: { color: '#1E40AF', fontWeight: '600' },
  chipX: { marginLeft: 4, paddingHorizontal: 4 },
  chipXText: { fontSize: 18, lineHeight: 18, color: '#1E40AF', fontWeight: '600' },
  chipAddText: { fontSize: 18, lineHeight: 20, color: '#475569', fontWeight: '600' },
  hint: { fontSize: 12, color: '#94A3B8', paddingVertical: 8 },
  hintEmpty: { fontSize: 11, color: '#94A3B8', marginTop: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: '70%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 16, fontWeight: '600', color: '#0F172A', flex: 1 },
  modalClose: { fontSize: 28, lineHeight: 28, color: '#64748B', paddingLeft: 12 },
  searchInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 8,
  },
  optionsList: { maxHeight: 320 },
  optionRow: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  optionText: { fontSize: 14, color: '#0F172A' },
});

export default ClassificationChips;
