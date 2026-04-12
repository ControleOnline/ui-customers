import React, { useMemo } from 'react';
import { Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '@controleonline/../../src/styles/colors';

const ROLE_LABELS = {
  supplier: 'Fornecedor',
  manufacturer: 'Fabricante',
  distributor: 'Distribuidor',
};

const SUPPLY_TYPES = new Set(['component', 'feedstock', 'package']);

const extractId = value => {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') {
    const match = value.match(/(\d+)$/);
    return match ? match[1] : value;
  }
  if (typeof value === 'object') {
    return extractId(value.id || value['@id'] || '');
  }
  return '';
};

const formatMoney = value => {
  if (value === null || value === undefined || value === '') return '';

  const parsed = Number(String(value).replace(',', '.'));
  if (!Number.isFinite(parsed)) {
    return String(value);
  }

  try {
    return parsed.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  } catch (error) {
    return `R$ ${parsed.toFixed(2)}`;
  }
};

const resolveProductContext = product => {
  return SUPPLY_TYPES.has(String(product?.type || '').toLowerCase()) ? 'supplies' : 'products';
};

const getProductName = product =>
  String(product?.product || `Produto #${product?.id || ''}`).trim();

const getProductSubtitle = product => {
  const parts = [];

  if (product?.sku) {
    parts.push(`SKU ${product.sku}`);
  }

  if (product?.type) {
    parts.push(String(product.type).trim());
  }

  return parts.join(' | ');
};

const buildMeta = relation => {
  const items = [];

  if (relation?.costPrice) {
    items.push({ label: 'Custo', value: formatMoney(relation.costPrice) });
  }

  if (relation?.supplierSku) {
    items.push({ label: 'Cod. interno', value: relation.supplierSku });
  }

  if (relation?.leadTimeDays || relation?.leadTimeDays === 0) {
    items.push({
      label: 'Prazo',
      value: `${relation.leadTimeDays} ${Number(relation.leadTimeDays) === 1 ? 'dia' : 'dias'}`,
    });
  }

  if (relation?.priority || relation?.priority === 0) {
    items.push({ label: 'Prioridade', value: String(relation.priority) });
  }

  return items;
};

const ProductsTab = ({ client, customStyles }) => {
  const navigation = useNavigation();

  const relations = useMemo(() => {
    const safeRelations = Array.isArray(client?.productPeople) ? [...client.productPeople] : [];

    return safeRelations.sort((left, right) => {
      const leftPriority = Number(left?.priority ?? 9999);
      const rightPriority = Number(right?.priority ?? 9999);
      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      return getProductName(left?.product)
        .toLowerCase()
        .localeCompare(getProductName(right?.product).toLowerCase());
    });
  }, [client?.productPeople]);

  const openProduct = relation => {
    const productId = extractId(relation?.product?.id || relation?.product?.['@id']);
    if (!productId) {
      return;
    }

    navigation.push('ProductDetails', {
      ProductId: productId,
      context: resolveProductContext(relation?.product),
    });
  };

  return (
    <View style={customStyles.section}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={customStyles.sectionTitle}>Produtos fornecidos</Text>
          <Text style={styles.sectionSubtitle}>
            {relations.length === 1
              ? '1 produto vinculado a este fornecedor'
              : `${relations.length} produtos vinculados a este fornecedor`}
          </Text>
        </View>
      </View>

      {relations.length === 0 ? (
        <Text style={customStyles.emptyText}>
          Nenhum produto vinculado a este fornecedor.
        </Text>
      ) : (
        relations.map(relation => {
          const product = relation?.product || {};
          const metadata = buildMeta(relation);
          const productId = extractId(product?.id || product?.['@id']);

          return (
            <TouchableOpacity
              key={String(relation?.id || `${productId || 'product'}-${relation?.priority || 0}`)}
              style={styles.card}
              onPress={() => openProduct(relation)}
              disabled={!productId}
              activeOpacity={0.85}>
              <View style={styles.cardHeader}>
                <View style={styles.iconWrap}>
                  <Icon name="inventory-2" size={20} color={colors.primary} />
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {getProductName(product)}
                  </Text>

                  {getProductSubtitle(product) ? (
                    <Text style={styles.cardSubtitle} numberOfLines={1}>
                      {getProductSubtitle(product)}
                    </Text>
                  ) : null}
                </View>

                <Icon name="chevron-right" size={18} color="#94A3B8" />
              </View>

              <View style={styles.badgesRow}>
                <View style={styles.primaryBadge}>
                  <Text style={styles.primaryBadgeText}>
                    {ROLE_LABELS[relation?.role] || relation?.role || 'Relacionamento'}
                  </Text>
                </View>

                {product?.price ? (
                  <View style={styles.secondaryBadge}>
                    <Text style={styles.secondaryBadgeText}>
                      {formatMoney(product.price)}
                    </Text>
                  </View>
                ) : null}
              </View>

              {metadata.length > 0 ? (
                <View style={styles.metaWrap}>
                  {metadata.map(item => (
                    <View key={`${relation?.id}-${item.label}`} style={styles.metaPill}>
                      <Text style={styles.metaLabel}>{item.label}</Text>
                      <Text style={styles.metaValue}>{item.value}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    marginBottom: 12,
  },
  sectionSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#64748B',
  },
  card: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#FFFFFF',
    marginTop: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: '#64748B',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  primaryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#DBEAFE',
  },
  primaryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  secondaryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
  },
  secondaryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  metaWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  metaPill: {
    minWidth: 112,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  metaValue: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
});

export default ProductsTab;
