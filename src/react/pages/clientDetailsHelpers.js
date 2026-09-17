/** Compatibility exports for the shared people detail contract. */

export {
  resolveContextKey,
  normalizeCollection,
  PERSON_PHOTO_MEDIA_TYPES,
  COMPANY_ICON_MEDIA_TYPES,
  extractId,
  resolveRouteClientSeed,
  resolveRouteClientId,
  mergeLinkedContactIntoClient,
} from '@controleonline/ui-people/src/react/utils/peopleDetailsHelpers';

export {
  resolvePeopleDetailTabIndex as resolveInitialTabIndex,
  buildPeopleDetailTabDefs as buildClientTabDefs,
} from '@controleonline/ui-people/src/react/utils/peopleDetailsHelpers';
