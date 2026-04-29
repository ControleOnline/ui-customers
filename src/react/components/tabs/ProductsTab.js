import React, { useMemo, useCallback } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '@controleonline/../../src/styles/colors';
import styles from './ProductsTab.styles';

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

  const providerPayload = useMemo(
    () => ({
      id: extractId(client?.id || client?.['@id']),
      '@id': client?.['@id'] || (extractId(client?.id || client?.['@id']) ? `/people/${extractId(client?.id || client?.['@id'])}` : ''),
      alias: String(client?.alias || '').trim(),
      name: String(client?.name || '').trim(),
      peopleType: client?.peopleType || '',
    }),
    [client?.id, client?.['@id'], client?.alias, client?.name, client?.peopleType],
  );

  const openCreateProduct = useCallback(() => {
    if (!providerPayload.id) {
      return;
    }

    navigation.push('ProductDetails', {
      context: 'products',
      initialProvider: providerPayload,
    });
  }, [navigation, providerPayload]);

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
        <View style={styles.sectionHeaderCopy}>
          <Text style={customStyles.sectionTitle}>Produtos fornecidos</Text>
          <Text style={styles.sectionSubtitle}>
            {relations.length === 1
              ? '1 produto vinculado a este fornecedor'
              : `${relations.length} produtos vinculados a este fornecedor`}
          </Text>
        </View>

        {providerPayload.id ? (
          <TouchableOpacity
            style={styles.addButton}
            onPress={openCreateProduct}
            activeOpacity={0.85}>
            <Icon name="add" size={18} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Produto</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {relations.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={customStyles.emptyText}>
            Nenhum produto vinculado a este fornecedor.
          </Text>

          {providerPayload.id ? (
            <TouchableOpacity
              style={styles.emptyActionButton}
              onPress={openCreateProduct}
              activeOpacity={0.85}>
              <Icon name="add-box" size={18} color="#FFFFFF" />
              <Text style={styles.emptyActionButtonText}>Adicionar produto</Text>
            </TouchableOpacity>
          ) : null}
        </View>
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

export default ProductsTab;
