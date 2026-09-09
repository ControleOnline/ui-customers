/** Compatibility exports for the shared people detail contract. */

import { buildPeopleDetailTabDefs } from '@controleonline/ui-people/src/react/utils/peopleDetailsHelpers';

export {
  resolveContextKey,
  normalizeCollection,
  PERSON_PHOTO_MEDIA_TYPES,
  COMPANY_ICON_MEDIA_TYPES,
  extractId,
  resolveRouteClientSeed,
  resolveRouteClientId,
  mergeLinkedContactIntoClient,
  resolvePeopleDetailTabIndex as resolveInitialTabIndex,
} from '@controleonline/ui-people/src/react/utils/peopleDetailsHelpers';

/**
 * Client Details must never surface a dedicated Categories tab.
 * Classification stays on General via PeopleCategoriesPanel.
 */
export const buildClientTabDefs = opts =>
  (buildPeopleDetailTabDefs(opts) || []).filter(tab => tab?.key !== 'categories');
