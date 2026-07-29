import React, { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import FeatherIcon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '@store';
import { api } from '@controleonline/ui-common/src/api';
import UserAvatar from '@controleonline/ui-common/src/react/components/UserAvatar';
import { resolveFileImageUrl } from '@controleonline/ui-common/src/react/utils/fileUrl';
import {
  buildPeopleLinkReadParams,
  buildSalesmanLinksFromPeopleLinks,
} from './employeeContacts';
import { inlineStyle_46_16 } from './SalesmanTab.styles';
const extractId = value => String(value || '').replace(/\D/g, '');

const normalizeCollection = payload => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  if (Array.isArray(payload.member)) return payload.member;
  if (Array.isArray(payload['hydra:member'])) return payload['hydra:member'];
  if (Array.isArray(payload.items)) return payload.items;
  return [];
};

const fetchPeopleMediaUrls = async ({mediaType, peopleIds}) => {
  const uniqueIds = [...new Set((peopleIds || []).map(extractId).filter(Boolean))];
  const entries = await Promise.all(
    uniqueIds.map(async peopleId => {
      try {
        const response = await api.fetch('/people_media', {
          params: {
            people: `/people/${peopleId}`,
            'mediaType.type': mediaType,
            itemsPerPage: 1,
          },
        });
        const media = normalizeCollection(response)[0];
        const imageUrl = resolveFileImageUrl(media?.file);

        return imageUrl ? [peopleId, imageUrl] : null;
      } catch {
        return null;
      }
    }),
  );

  return entries
    .filter(Boolean)
    .reduce((accumulator, [peopleId, imageUrl]) => {
      accumulator[peopleId] = imageUrl;
      return accumulator;
    }, {});
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
      .then(async items => {
        if (!cancelled) {
          const nextClients = buildSalesmanLinksFromPeopleLinks(items, {
            clientId,
            linkType,
          });
          const mediaByPeopleId = await fetchPeopleMediaUrls({
            mediaType: 'logo',
            peopleIds: nextClients.map(item => item?.company?.id || item?.company?.['@id']),
          });

          if (!cancelled) {
            setClients(
              nextClients.map(item => ({
                ...item,
                companyLogoUrl:
                  mediaByPeopleId[
                    extractId(item?.company?.id || item?.company?.['@id'])
                  ] || '',
              })),
            );
          }
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
              style={[
                customStyles.listItem,
                customStyles.listItemWithEndAction,
              ]}
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
                  imageUrl={item?.companyLogoUrl}
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
              <View style={customStyles.iconButtonGhost}>
                <FeatherIcon
                  name="edit-2"
                  size={16}
                  color={customStyles.iconButtonGhostIcon.color}
                />
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );
};

export default SalesmanTab;
