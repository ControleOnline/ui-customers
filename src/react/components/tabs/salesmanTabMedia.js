import { resolveFileImageUrl } from '@controleonline/ui-common/src/react/utils/fileUrl';
import { extractId } from './salesmanTabHelpers';

const normalizeCollection = payload => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  if (Array.isArray(payload.member)) return payload.member;
  if (Array.isArray(payload['hydra:member'])) return payload['hydra:member'];
  if (Array.isArray(payload.items)) return payload.items;
  return [];
};

const COMPANY_ICON_MEDIA_TYPES = ['icon'];

const fetchPeopleMediaUrl = async ({ peopleActions, peopleId, mediaType }) => {
  const response = await peopleActions.getPeopleMedia({
    people: `/people/${peopleId}`,
    'mediaType.type': mediaType,
    itemsPerPage: 1,
  });
  const media = normalizeCollection(response)[0];

  return resolveFileImageUrl(media?.file);
};

const fetchPeopleMediaUrls = async ({ peopleActions, mediaTypes, peopleIds }) => {
  const uniqueIds = [...new Set((peopleIds || []).map(extractId).filter(Boolean))];
  const entries = await Promise.all(
    uniqueIds.map(async peopleId => {
      for (const mediaType of mediaTypes) {
        const imageUrl = await fetchPeopleMediaUrl({
          peopleActions,
          peopleId,
          mediaType,
        }).catch(() => '');

        if (imageUrl) {
          return [peopleId, imageUrl];
        }
      }

      return null;
    }),
  );

  return entries
    .filter(Boolean)
    .reduce((accumulator, [peopleId, imageUrl]) => {
      accumulator[peopleId] = imageUrl;
      return accumulator;
    }, {});
};


export { normalizeCollection, fetchPeopleMediaUrl, fetchPeopleMediaUrls, COMPANY_ICON_MEDIA_TYPES };
