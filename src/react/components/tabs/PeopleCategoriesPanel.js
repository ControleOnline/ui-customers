/**
 * PeopleCategoriesPanel — badges + CRUD for person classification timeline.
 * PF: profession, position (cargo requires people_company_id)
 * PJ: sector, activity_branch
 * Issue: ControleOnline/app-community#377
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useStore } from '@store';
import { useMessage } from '@controleonline/ui-common/src/react/components/MessageService';

const PF_CONTEXTS = [
  { value: 'profession', label: 'Profissão' },
  { value: 'position', label: 'Cargo' },
];
const PJ_CONTEXTS = [
  { value: 'sector', label: 'Setor' },
  { value: 'activity_branch', label: 'Ramo de Atividade' },
];

const CONTEXT_LABELS = {
  profession: 'Profissão',
  position: 'Cargo',
  sector: 'Setor',
  activity_branch: 'Ramo de Atividade',
};

function extractId(value) {
  if (value == null) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const m = value.match(/\/(\d+)\s*$/);
    if (m) return Number(m[1]);
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  if (typeof value === 'object') {
    if (value.id != null) return extractId(value.id);
    if (value['@id']) return extractId(value['@id']);
  }
  return null;
}

function toPeopleIri(client) {
  const id = extractId(client);
  return id != null ? `/people/${id}` : null;
}

function formatDateBr(ymd) {
  if (!ymd) return '';
  const s = String(ymd).slice(0, 10);
  const [y, m, d] = s.split('-');
  if (!y || !m || !d) return s;
  return `${d}/${m}/${y}`;
}

function parseBrToYmd(br) {
  if (!br) return null;
  const parts = String(br).trim().split(/[/\-.]/);
  if (parts.length !== 3) return null;
  let d, m, y;
  if (parts[0].length === 4) {
    [y, m, d] = parts;
  } else {
    [d, m, y] = parts;
  }
  if (!y || !m || !d) return null;
  return `${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function categoryName(item) {
  const c = item?.category;
  if (!c) return '—';
  if (typeof c === 'string') return c;
  return c.name || c.label || `#${c.id || ''}`;
}

function categoryContext(item) {
  const c = item?.category;
  if (!c || typeof c === 'string') return '';
  return String(c.context || '').trim();
}

function badgeColor(context, themeColors) {
  const map = {
    profession: '#3B82F6',
    position: '#8B5CF6',
    sector: '#10B981',
    activity_branch: '#F59E0B',
  };
  return map[context] || themeColors?.primary || '#64748B';
}

const emptyForm = () => ({
  context: '',
  categoryId: '',
  categoryName: '',
  startDateBr: '',
  endDateBr: '',
  peopleCompanyId: '',
});

const PeopleCategoriesPanel = ({
  client,
  isEditing = false,
  parentCompanyIri = null,
}) => {
  const { showError, showSuccess } = useMessage();
  const themeStore = useStore('theme');
  const themeColors = themeStore?.getters?.colors || {};
  const categoriesStore = useStore('categories');
  const peopleCategoriesStore = useStore('people_categories');

  const peopleType = String(client?.peopleType || 'J').toUpperCase();
  const isPF = peopleType === 'F';
  const contexts = isPF ? PF_CONTEXTS : PJ_CONTEXTS;
  const peopleIri = useMemo(() => toPeopleIri(client), [client]);
  const peopleId = extractId(client);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const loadItems = useCallback(async () => {
    if (!peopleId || !peopleCategoriesStore?.actions?.getItems) return;
    setLoading(true);
    try {
      const result = await peopleCategoriesStore.actions.getItems({
        people: peopleIri,
        itemsPerPage: 100,
      });
      const list = Array.isArray(result)
        ? result
        : result?.['hydra:member'] || result?.items || peopleCategoriesStore.getters?.items || [];
      setItems(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('[PeopleCategoriesPanel] load failed', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [peopleId, peopleIri, peopleCategoriesStore]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const loadCategoryOptions = useCallback(
    async context => {
      if (!context || !categoriesStore?.actions?.getItems) {
        setCategoryOptions([]);
        return;
      }
      setLoadingCategories(true);
      try {
        const result = await categoriesStore.actions.getItems({
          context,
          itemsPerPage: 200,
        });
        const list = Array.isArray(result)
          ? result
          : result?.['hydra:member'] || result?.items || [];
        setCategoryOptions(Array.isArray(list) ? list : []);
      } catch (err) {
        console.warn('[PeopleCategoriesPanel] categories load failed', err);
        setCategoryOptions([]);
      } finally {
        setLoadingCategories(false);
      }
    },
    [categoriesStore],
  );

  useEffect(() => {
    if (form.context) {
      loadCategoryOptions(form.context);
    } else {
      setCategoryOptions([]);
    }
  }, [form.context, loadCategoryOptions]);

  const openCreate = () => {
    setEditingItem(null);
    const defaultContext = contexts[0]?.value || '';
    setForm({
      ...emptyForm(),
      context: defaultContext,
      startDateBr: formatDateBr(new Date().toISOString().slice(0, 10)),
    });
    setModalVisible(true);
  };

  const openEdit = item => {
    setEditingItem(item);
    const ctx = categoryContext(item);
    const catId = extractId(item.category);
    setForm({
      context: ctx,
      categoryId: catId != null ? String(catId) : '',
      categoryName: categoryName(item),
      startDateBr: formatDateBr(item.startDate),
      endDateBr: formatDateBr(item.endDate),
      peopleCompanyId: extractId(item.peopleCompany) != null ? String(extractId(item.peopleCompany)) : '',
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingItem(null);
    setForm(emptyForm());
  };

  const handleSave = async () => {
    if (!peopleIri) {
      showError?.('Pessoa inválida');
      return;
    }
    const startYmd = parseBrToYmd(form.startDateBr);
    if (!startYmd) {
      showError?.('Data início obrigatória (DD/MM/AAAA)');
      return;
    }
    if (!form.categoryId && !form.categoryName) {
      showError?.('Selecione ou informe a categoria');
      return;
    }
    if (form.context === 'position' && !form.peopleCompanyId && !parentCompanyIri) {
      showError?.('Cargo exige empresa vinculada (people_company_id)');
      return;
    }

    setSaving(true);
    try {
      let categoryIri = form.categoryId ? `/categories/${form.categoryId}` : null;

      if (!categoryIri && form.categoryName && categoriesStore?.actions?.save) {
        const created = await categoriesStore.actions.save({
          name: form.categoryName.trim(),
          context: form.context,
        });
        const newId = extractId(created);
        if (newId) categoryIri = `/categories/${newId}`;
      }

      if (!categoryIri) {
        showError?.('Categoria obrigatória');
        setSaving(false);
        return;
      }

      const payload = {
        people: peopleIri,
        category: categoryIri,
        startDate: startYmd,
        endDate: parseBrToYmd(form.endDateBr) || null,
        active: true,
      };

      if (form.context === 'position') {
        const companyId = form.peopleCompanyId || extractId(parentCompanyIri);
        if (companyId) {
          payload.peopleCompany = `/people/${companyId}`;
        }
      }

      if (editingItem?.id && peopleCategoriesStore?.actions?.save) {
        await peopleCategoriesStore.actions.save({
          ...payload,
          id: editingItem.id,
        });
        showSuccess?.('Categoria atualizada');
      } else if (peopleCategoriesStore?.actions?.save) {
        await peopleCategoriesStore.actions.save(payload);
        showSuccess?.('Categoria adicionada');
      } else {
        showError?.('Store people_categories indisponível');
        setSaving(false);
        return;
      }

      closeModal();
      await loadItems();
    } catch (err) {
      console.error('[PeopleCategoriesPanel] save failed', err);
      showError?.(err?.message || 'Falha ao salvar categoria');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async item => {
    if (!item?.id || !peopleCategoriesStore?.actions?.remove) return;
    setSaving(true);
    try {
      await peopleCategoriesStore.actions.remove(item.id);
      showSuccess?.('Categoria removida');
      await loadItems();
    } catch (err) {
      showError?.(err?.message || 'Falha ao remover');
    } finally {
      setSaving(false);
    }
  };

  const styles = useMemo(
    () => ({
      section: { marginTop: 16, marginBottom: 8, paddingHorizontal: 4 },
      headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
      },
      title: {
        fontSize: 15,
        fontWeight: '600',
        color: themeColors?.text || '#1E293B',
      },
      badgesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
      badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 6,
        marginBottom: 6,
      },
      badgeText: { color: '#fff', fontSize: 12, fontWeight: '600', maxWidth: 160 },
      badgeMeta: { color: 'rgba(255,255,255,0.85)', fontSize: 10, marginLeft: 6 },
      empty: {
        color: themeColors?.textSecondary || '#64748B',
        fontSize: 13,
        fontStyle: 'italic',
      },
      addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: themeColors?.primary || '#3B82F6',
      },
      addBtnText: { color: '#fff', fontSize: 12, fontWeight: '600', marginLeft: 4 },
      modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        padding: 20,
      },
      modalCard: {
        backgroundColor: themeColors?.surface || '#fff',
        borderRadius: 12,
        padding: 16,
        maxHeight: '85%',
      },
      modalTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: themeColors?.text || '#1E293B',
        marginBottom: 12,
      },
      fieldLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: themeColors?.textSecondary || '#64748B',
        marginBottom: 4,
        marginTop: 10,
      },
      input: {
        borderWidth: 1,
        borderColor: themeColors?.border || '#E2E8F0',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: Platform.OS === 'ios' ? 10 : 6,
        color: themeColors?.text || '#1E293B',
        fontSize: 14,
      },
      actionsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 16,
        gap: 10,
      },
      btnSecondary: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: themeColors?.border || '#E2E8F0',
      },
      btnPrimary: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: themeColors?.primary || '#3B82F6',
      },
      btnText: { fontSize: 13, fontWeight: '600' },
    }),
    [themeColors],
  );

  if (!peopleId) return null;

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Classificação / Categorias</Text>
        {isEditing && (
          <TouchableOpacity style={styles.addBtn} onPress={openCreate} activeOpacity={0.85}>
            <Icon name="add" size={16} color="#fff" />
            <Text style={styles.addBtnText}>Adicionar</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="small" color={themeColors?.primary} />
      ) : items.length === 0 ? (
        <Text style={styles.empty}>Nenhuma categoria associada</Text>
      ) : (
        <View style={styles.badgesWrap}>
          {items.map(item => {
            const ctx = categoryContext(item);
            const bg = badgeColor(ctx, themeColors);
            const label = categoryName(item);
            const period = [
              formatDateBr(item.startDate),
              item.endDate ? formatDateBr(item.endDate) : 'atual',
            ]
              .filter(Boolean)
              .join(' → ');
            return (
              <TouchableOpacity
                key={item.id || `${ctx}-${label}`}
                style={[styles.badge, { backgroundColor: bg }]}
                onPress={() => isEditing && openEdit(item)}
                onLongPress={() => isEditing && handleDelete(item)}
                activeOpacity={isEditing ? 0.8 : 1}
              >
                <Text style={styles.badgeText} numberOfLines={1}>
                  {CONTEXT_LABELS[ctx] ? `${CONTEXT_LABELS[ctx]}: ` : ''}
                  {label}
                </Text>
                {period ? <Text style={styles.badgeMeta}>{period}</Text> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>
                {editingItem ? 'Editar categoria' : 'Nova categoria'}
              </Text>

              <Text style={styles.fieldLabel}>Tipo</Text>
              <View style={styles.input}>
                <Picker
                  selectedValue={form.context}
                  onValueChange={value =>
                    setForm(prev => ({
                      ...prev,
                      context: value,
                      categoryId: '',
                      categoryName: '',
                    }))
                  }
                >
                  {contexts.map(c => (
                    <Picker.Item key={c.value} label={c.label} value={c.value} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.fieldLabel}>Categoria</Text>
              {loadingCategories ? (
                <ActivityIndicator size="small" />
              ) : categoryOptions.length > 0 ? (
                <View style={styles.input}>
                  <Picker
                    selectedValue={form.categoryId}
                    onValueChange={value => {
                      const opt = categoryOptions.find(
                        o => String(extractId(o)) === String(value),
                      );
                      setForm(prev => ({
                        ...prev,
                        categoryId: value,
                        categoryName: opt?.name || prev.categoryName,
                      }));
                    }}
                  >
                    <Picker.Item label="— selecione —" value="" />
                    {categoryOptions.map(opt => {
                      const id = extractId(opt);
                      return (
                        <Picker.Item
                          key={id}
                          label={opt.name || `#${id}`}
                          value={String(id)}
                        />
                      );
                    })}
                  </Picker>
                </View>
              ) : (
                <TextInput
                  style={styles.input}
                  placeholder="Nome da nova categoria"
                  value={form.categoryName}
                  onChangeText={text =>
                    setForm(prev => ({ ...prev, categoryName: text, categoryId: '' }))
                  }
                  placeholderTextColor={themeColors?.textSecondary}
                />
              )}

              <Text style={styles.fieldLabel}>Data início (DD/MM/AAAA)</Text>
              <TextInput
                style={styles.input}
                value={form.startDateBr}
                onChangeText={text => setForm(prev => ({ ...prev, startDateBr: text }))}
                placeholder="01/01/2024"
                placeholderTextColor={themeColors?.textSecondary}
              />

              <Text style={styles.fieldLabel}>Data fim (opcional)</Text>
              <TextInput
                style={styles.input}
                value={form.endDateBr}
                onChangeText={text => setForm(prev => ({ ...prev, endDateBr: text }))}
                placeholder="vazio = atual"
                placeholderTextColor={themeColors?.textSecondary}
              />

              {form.context === 'position' && (
                <>
                  <Text style={styles.fieldLabel}>Empresa do cargo (people_company_id)</Text>
                  <TextInput
                    style={styles.input}
                    value={form.peopleCompanyId}
                    onChangeText={text =>
                      setForm(prev => ({ ...prev, peopleCompanyId: text }))
                    }
                    placeholder={
                      parentCompanyIri
                        ? `Padrão: ${extractId(parentCompanyIri)}`
                        : 'ID da empresa'
                    }
                    placeholderTextColor={themeColors?.textSecondary}
                    keyboardType="numeric"
                  />
                </>
              )}

              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.btnSecondary} onPress={closeModal}>
                  <Text style={[styles.btnText, { color: themeColors?.text }]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnPrimary}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={[styles.btnText, { color: '#fff' }]}>Salvar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default PeopleCategoriesPanel;
