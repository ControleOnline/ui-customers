const EMPLOYEE_CONTACT_LINK_TYPES = ['employee', 'owner', 'director', 'manager', 'salesman', 'after-sales', 'courier']

const extractId = value => String(value || '').replace(/\D/g, '')

/** Resolve people/company id whether the field is an object or a plain IRI string. */
const extractEntityId = value => {
  if (value == null || value === '') {
    return ''
  }
  if (typeof value === 'string' || typeof value === 'number') {
    return extractId(value)
  }
  if (typeof value === 'object') {
    return extractId(value.id || value['@id'] || value)
  }
  return ''
}

const normalizeEmployeeLinkTypeStrict = value => {
  const normalized = String(value || '').trim().toLowerCase()

  return EMPLOYEE_CONTACT_LINK_TYPES.includes(normalized)
    ? normalized
    : ''
}

export const normalizeEmployeeLinkType = value => {
  return normalizeEmployeeLinkTypeStrict(value) || 'employee'
}

export const extractPeopleLinkItems = payload => {
  if (Array.isArray(payload)) {
    return payload
  }

  if (Array.isArray(payload?.member)) {
    return payload.member
  }

  if (Array.isArray(payload?.['hydra:member'])) {
    return payload['hydra:member']
  }

  return []
}

export const buildPeopleLinkReadParams = ({
  companyId = '',
  peopleId = '',
  linkType = '',
  itemsPerPage = 100,
} = {}) => {
  const params = {}
  const normalizedCompanyId = extractId(companyId)
  const normalizedPeopleId = extractId(peopleId)
  const normalizedLinkType = String(linkType || '').trim()

  if (normalizedCompanyId) {
    params.company = normalizedCompanyId
  }

  if (normalizedPeopleId) {
    params.people = normalizedPeopleId
  }

  if (normalizedLinkType) {
    // The people_links API declares linkType as an array filter. Keeping the
    // value scalar makes API Platform reject the whole request with HTTP 400.
    params.linkType = [normalizedLinkType]
  }

  if (itemsPerPage) {
    params.itemsPerPage = itemsPerPage
  }

  return params
}

export const filterPeopleLinksByScope = (
  payload,
  {companyId = '', peopleId = '', linkTypes = []} = {},
) => {
  const normalizedCompanyId = extractId(companyId)
  const normalizedPeopleId = extractId(peopleId)
  const normalizedLinkTypes = Array.isArray(linkTypes)
    ? linkTypes
        .map(value => String(value || '').trim().toLowerCase())
        .filter(Boolean)
    : []

  return extractPeopleLinkItems(payload).filter(link => {
    const linkCompanyId = extractEntityId(link?.company)
    const linkPeopleId = extractEntityId(link?.people)
    const linkType = String(link?.linkType || '').trim().toLowerCase()

    if (normalizedCompanyId && linkCompanyId !== normalizedCompanyId) {
      return false
    }

    if (normalizedPeopleId && linkPeopleId !== normalizedPeopleId) {
      return false
    }

    if (normalizedLinkTypes.length > 0 && !normalizedLinkTypes.includes(linkType)) {
      return false
    }

    return true
  })
}

export const buildSalesmanLinksFromPeopleLinks = (
  payload,
  {clientId = '', linkType = 'sellers-client'} = {},
) => {
  return filterPeopleLinksByScope(payload, {
    peopleId: clientId,
    linkTypes: [linkType],
  }).filter(link => extractEntityId(link?.company))
}

export const buildEmployeeContactsFromPeopleLinks = (
  payload,
  {parentPeopleId = '', allowedLinkTypes = EMPLOYEE_CONTACT_LINK_TYPES} = {},
) => {
  const companyId = extractId(parentPeopleId)
  const normalizedAllowedLinkTypes = Array.isArray(allowedLinkTypes)
    ? allowedLinkTypes.map(normalizeEmployeeLinkTypeStrict).filter(Boolean)
    : EMPLOYEE_CONTACT_LINK_TYPES

  return filterPeopleLinksByScope(payload, {
    companyId,
    linkTypes: normalizedAllowedLinkTypes,
  })
    .map(link => {
      const personRaw = link?.people
      const personId = extractEntityId(personRaw)
      const normalizedLinkType = normalizeEmployeeLinkTypeStrict(link?.linkType)

      if (!personId || (companyId && personId === companyId)) {
        return null
      }

      const person =
        personRaw && typeof personRaw === 'object'
          ? personRaw
          : { id: personId, '@id': `/people/${personId}` }

      if (String(person?.peopleType || '').toUpperCase() === 'J') {
        return null
      }

      return {
        ...person,
        id: person.id || personId,
        '@id': person['@id'] || `/people/${personId}`,
        linkType: normalizedLinkType,
        peopleLink: link,
      }
    })
    .filter(Boolean)
}

export default buildEmployeeContactsFromPeopleLinks
