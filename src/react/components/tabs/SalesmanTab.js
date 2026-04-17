import React, { useEffect, useMemo } from 'react';

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

const SalesmanTab = ({
  client,
  customStyles,
  title,
  linkType,
  emptyText,
  errorText,
}) => {
  const navigation = useNavigation();

  const peopleLinkStore = useStore('people_link');

  const clients = peopleLinkStore.getters.items;
  const isLoading = peopleLinkStore.getters.isLoading;
  const error = peopleLinkStore.getters.error;



  useEffect(() => {
    peopleLinkStore.actions.getItems({
      people: client?.['@id'],
      linkType: linkType,
      itemsPerPage: 100,
    });
  }, []);


  return (
    <View style={customStyles.tabContent}>
      <View style={customStyles.section}>
        {isLoading ? (
          <View style={inlineStyle_46_16}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : error ? (
          <Text style={customStyles.emptyText}>{errorText}</Text>
        ) : !clients || clients?.length === 0 ? (
          <Text style={customStyles.emptyText}>{emptyText}</Text>
        ) : (
          clients.map(item => (
            <TouchableOpacity
              key={String(item?.company?.id || item?.company?.['@id'])}
              style={customStyles.listItem}
              activeOpacity={0.8}
              onPress={() =>
                navigation.push('ClientDetails', { client: item?.company })
              }>
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
