import React, { useEffect, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '@store';
import { colors } from '@controleonline/../../src/styles/colors';
import { inlineStyle_46_16 } from './SalesmanTab.styles';

const extractId = value => String(value || '').replace(/\D/g, '');

const toPeopleIri = value => {
  const directIri = String(value?.['@id'] || '').trim();
  if (directIri.startsWith('/people/')) {
    return directIri;
  }

  const id = extractId(value?.id);
  return id ? `/people/${id}` : '';
};

const normalizeSalesLinks = (items, clientIri, requiredLinkType) => {
  const clientId = extractId(clientIri);
  const normalizedRequiredLinkType = String(requiredLinkType || '')
    .trim()
    .toLowerCase();
  const seenCompanyIds = new Set();

  return (Array.isArray(items) ? items : []).reduce((acc, item) => {
    const companyId = extractId(item?.company?.id || item?.company?.['@id']);
    const peopleId = extractId(item?.people?.id || item?.people?.['@id']);
    const itemLinkType = String(item?.linkType || '').trim().toLowerCase();

    if (
      !companyId ||
      !peopleId ||
      !clientId ||
      peopleId !== clientId ||
      itemLinkType !== normalizedRequiredLinkType ||
      companyId === clientId ||
      seenCompanyIds.has(companyId)
    ) {
      return acc;
    }

    seenCompanyIds.add(companyId);
    acc.push(item);
    return acc;
  }, []);
};

const SalesmanTab = ({
  client,
  customStyles,
  linkType,
  emptyText,
  errorText,
}) => {
  const navigation = useNavigation();

  const peopleStore = useStore('people');
  const peopleLinkStore = useStore('people_link');
  const peopleActions = peopleStore?.actions || {};
  const peopleLinkActions = peopleLinkStore?.actions || {};

  const clientIri = useMemo(() => toPeopleIri(client), [client]);
  const [salesmen, setSalesmen] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    if (!clientIri || !linkType || !peopleLinkActions?.getItems) {
      setSalesmen([]);
      setError('');
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setIsLoading(true);
    setError('');

    peopleLinkActions
      .getItems({
        people: clientIri,
        linkType,
        itemsPerPage: 100,
      })
      .then(items => {
        if (cancelled) {
          return;
        }

        setSalesmen(normalizeSalesLinks(items, clientIri, linkType));
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setSalesmen([]);
        setError(errorText);
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [clientIri, errorText, linkType, peopleLinkActions]);

  return (
    <View style={customStyles.tabContent}>
      <View style={customStyles.section}>
        {isLoading ? (
          <View style={inlineStyle_46_16}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : error ? (
          <Text style={customStyles.emptyText}>{error}</Text>
        ) : salesmen.length === 0 ? (
          <Text style={customStyles.emptyText}>{emptyText}</Text>
        ) : (
          salesmen.map(item => (
            <TouchableOpacity
              key={String(item?.id || `${item?.company?.id || item?.company?.['@id']}`)}
              style={customStyles.listItem}
              activeOpacity={0.8}
              onPress={() => {
                const clientId = extractId(item?.company?.id || item?.company?.['@id']);
                if (!clientId) {
                  return;
                }

                peopleActions?.setItem?.(item?.company);
                navigation.push('ClientDetails', { clientId });
              }}>
              <View style={customStyles.itemContent}>
                <Icon name="people" size={20} color={colors.primary} />
                <View>
                  <Text style={customStyles.itemText}>
                    {String(item?.company?.name || '-')}
                  </Text>
                  <Text style={customStyles.itemSubtext}>
                    {`ID: ${extractId(item?.company?.id || item?.company?.['@id']) || '-'}`}
                    {item?.company?.alias ? ` - ${String(item?.company?.alias)}` : ''}
                  </Text>
                </View>
              </View>
              <Icon name="chevron-right" size={20} color="#94A3B8" />
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );
};

export default SalesmanTab;
