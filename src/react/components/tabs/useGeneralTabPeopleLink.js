import {useEffect, useState} from 'react';
import {extractId, resolveSeededLinkType} from './generalTabHelpers';

/**
 * Load people_link id + type for PF contact under a company.
 * Prefers clientLinkType after save so UI does not snap back (#446).
 */
export default function useGeneralTabPeopleLink({
  canEditLinkType,
  getItems,
  contactPeopleIri,
  parentCompanyIri,
  clientLinkType,
  setRegistrationForm,
  setOriginalRegistrationForm,
}) {
  const [peopleLinkId, setPeopleLinkId] = useState('');

  useEffect(() => {
    if (!canEditLinkType || typeof getItems !== 'function') {
      return undefined;
    }

    let cancelled = false;

    getItems({
      people: extractId(contactPeopleIri),
      company: extractId(parentCompanyIri),
    })
      .then(items => {
        if (cancelled || !Array.isArray(items) || items.length === 0) {
          return;
        }

        const link = items[0];
        const nextLinkType = resolveSeededLinkType(
          clientLinkType,
          link?.linkType,
        );
        const nextLinkId = String(link?.id || link?.['@id'] || '').replace(
          /\D/g,
          '',
        );

        setPeopleLinkId(nextLinkId);
        setRegistrationForm(prev => ({...prev, linkType: nextLinkType}));
        setOriginalRegistrationForm(prev => ({
          ...prev,
          linkType: nextLinkType,
        }));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [
    canEditLinkType,
    getItems,
    contactPeopleIri,
    parentCompanyIri,
    clientLinkType,
    setRegistrationForm,
    setOriginalRegistrationForm,
  ]);

  return {peopleLinkId, setPeopleLinkId};
}
