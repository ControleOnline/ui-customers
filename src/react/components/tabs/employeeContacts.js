import {HUMAN_COMPANY_LINK_TYPES} from '../../utils/humanCompanyLinkTypes';

export const EMPLOYEE_CONTACT_LINK_TYPES = HUMAN_COMPANY_LINK_TYPES;

const extractId = value => {
  if (value == null || value === '') {
    return '';
  }
  if (typeof value === 'object') {
    return extractId(value.id ?? value['@id'] ?? '');
  }
  return String(value).replace(/\D/g, '');
};

const normalizeEmployeeLinkTypeStrict = value => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();

  return EMPLOYEE_CONTACT_LINK_TYPES.includes(normalized) ? normalized : '';
};

export const normalizeEmployeeLinkType = value => {
  return normalizeEmployeeLinkTypeStrict(value) || 'employee';
};

export const extractPeopleLinkItems = payload => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.member)) {
    return payload.member;
  }

  if (Array.isArray(payload?.['hydra:member'])) {
    return payload['hydra:member'];
  }

  return [];
};

/**
 * Build GET /people_links query params.
 * - company/people as numeric ids
 * - linkType as array (API Platform SearchFilter)
 * - itemsPerPage to avoid truncating contacts on large companies (#636)
 */
export const buildPeopleLinkReadParams = ({
  companyId = '',
  peopleId = '',
  linkType = '',
  linkTypes = [],
  itemsPerPage,
} = {}) => {
  const params = {};
  const normalizedCompanyId = extractId(companyId);
  const normalizedPeopleId = extractId(peopleId);
  const normalizedLinkType = String(linkType || '').trim();
  const normalizedLinkTypes = Array.isArray(linkTypes)
    ? linkTypes
        .map(value => String(value || '').trim())
        .filter(Boolean)
    : [];

  if (normalizedCompanyId) {
    params.company = normalizedCompanyId;
  }

  if (normalizedPeopleId) {
    params.people = normalizedPeopleId;
  }

  if (normalizedLinkType) {
    // Scalar becomes a one-element array — API Platform rejects bare scalars here.
    params.linkType = [normalizedLinkType];
  } else if (normalizedLinkTypes.length > 0) {
    params.linkType = normalizedLinkTypes;
  }

  const pageSize = Number(itemsPerPage);
  if (Number.isFinite(pageSize) && pageSize > 0) {
    params.itemsPerPage = pageSize;
  }

  return params;
};

export const filterPeopleLinksByScope = (
  payload,
  {companyId = '', peopleId = '', linkTypes = []} = {},
) => {
  const normalizedCompanyId = extractId(companyId);
  const normalizedPeopleId = extractId(peopleId);
  const normalizedLinkTypes = Array.isArray(linkTypes)
    ? linkTypes
        .map(value => String(value || '').trim().toLowerCase())
        .filter(Boolean)
    : [];

  return extractPeopleLinkItems(payload).filter(link => {
    // Accept embedded object or plain IRI string (/people/123).
    const linkCompanyId = extractId(
      link?.company?.id || link?.company?.['@id'] || link?.company,
    );
    const linkPeopleId = extractId(
      link?.people?.id || link?.people?.['@id'] || link?.people,
    );
    const linkType = String(link?.linkType || '')
      .trim()
      .toLowerCase();

    if (normalizedCompanyId && linkCompanyId !== normalizedCompanyId) {
      return false;
    }

    if (normalizedPeopleId && linkPeopleId !== normalizedPeopleId) {
      return false;
    }

    if (
      normalizedLinkTypes.length > 0 &&
      !normalizedLinkTypes.includes(linkType)
    ) {
      return false;
    }

    return true;
  });
};

export const buildSalesmanLinksFromPeopleLinks = (
  payload,
  {clientId = '', linkType = 'sellers-client'} = {},
) => {
  return filterPeopleLinksByScope(payload, {
    peopleId: clientId,
    linkTypes: [linkType],
  }).filter(link =>
    extractId(link?.company?.id || link?.company?.['@id'] || link?.company),
  );
};

export const buildEmployeeContactsFromPeopleLinks = (
  payload,
  {parentPeopleId = '', allowedLinkTypes = EMPLOYEE_CONTACT_LINK_TYPES} = {},
) => {
  const companyId = extractId(parentPeopleId);
  const normalizedAllowedLinkTypes = Array.isArray(allowedLinkTypes)
    ? allowedLinkTypes.map(normalizeEmployeeLinkTypeStrict).filter(Boolean)
    : EMPLOYEE_CONTACT_LINK_TYPES;

  return filterPeopleLinksByScope(payload, {
    companyId,
    linkTypes: normalizedAllowedLinkTypes,
  })
    .map(link => {
      const person = link?.people;
      const personId = extractId(
        typeof person === 'string' || typeof person === 'number'
          ? person
          : person?.id || person?.['@id'],
      );
      const normalizedLinkType = normalizeEmployeeLinkTypeStrict(link?.linkType);

      if (!personId || (companyId && personId === companyId)) {
        return null;
      }

      if (
        person &&
        typeof person === 'object' &&
        String(person?.peopleType || '').toUpperCase() === 'J'
      ) {
        return null;
      }

      const base =
        person && typeof person === 'object'
          ? {...person}
          : {id: personId, '@id': `/people/${personId}`};

      return {
        ...base,
        // Prefer numeric id when the payload provided one; otherwise digits-only string.
        id: base.id != null && base.id !== '' ? base.id : personId,
        linkType: normalizedLinkType,
        peopleLink: link,
      };
    })
    .filter(Boolean);
};

export default buildEmployeeContactsFromPeopleLinks;
