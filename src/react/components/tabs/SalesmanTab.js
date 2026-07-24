import React, { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '@store';
import UserAvatar from '@controleonline/ui-common/src/react/components/UserAvatar';
import {
  buildPeopleLinkReadParams,
  buildSalesmanLinksFromPeopleLinks,
} from './employeeContacts';
import { inlineStyle_46_16 } from './SalesmanTab.styles';
const extractId = value => String(value || '').replace(/\D/g, '');

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
  const getPeopleLinks = peopleLinkStore?.actions?.getItems;

  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const clientId = extractId(client?.id || client?.['@id']);

  useEffect(() => {
    let cancelled = false;

    if (!clientId || !getPeopleLinks) {
      setClients([]);
      setError('');
      return () => {
        cancelled = true;
      };
    }

    setIsLoading(true);
    setError('');

    getPeopleLinks(
      buildPeopleLinkReadParams({
        peopleId: clientId,
        linkType,
      }),
    )
      .then(items => {
        if (!cancelled) {
          setClients(
            buildSalesmanLinksFromPeopleLinks(items, {
              clientId,
              linkType,
            }),
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setClients([]);
          setError(errorText);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [clientId, errorText, getPeopleLinks, linkType]);

  return (
    <View style={customStyles.tabContent}>
      <View style={customStyles.section}>
        {isLoading ? (
          <View style={inlineStyle_46_16}>
            <ActivityIndicator
              size="small"
              color={customStyles.loadingIndicator.color}
            />
          </View>
        ) : error ? (
          <Text style={customStyles.emptyText}>{errorText}</Text>
        ) : !clients || clients?.length === 0 ? (
          <Text style={customStyles.emptyText}>{emptyText}</Text>
        ) : (
          clients.map(item => (
            <TouchableOpacity
              key={String(item?.id || item?.['@id'])}
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
                <UserAvatar
                  name={String(item?.company?.name || '')}
                  size={40}
                  backgroundColor={customStyles.listAvatarBrand.backgroundColor}
                  borderColor={customStyles.listAvatarBrand.borderColor}
                  borderWidth={2}
                  textColor={customStyles.listAvatarText.color}
                  style={customStyles.listAvatar}
                />
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
              <Icon
                name="chevron-right"
                size={20}
                color={customStyles.itemChevronIcon.color}
              />
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );
};

export default SalesmanTab;
