const EMPLOYEE_CONTACT_LINK_TYPES = ['employee', 'owner', 'director', 'manager', 'courier']

const extractId = value => String(value || '').replace(/\D/g, '')
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
    params.linkType = normalizedLinkType
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
    const linkCompanyId = extractId(link?.company?.id || link?.company?.['@id'])
    const linkPeopleId = extractId(link?.people?.id || link?.people?.['@id'])
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
  }).filter(link => extractId(link?.company?.id || link?.company?.['@id']))
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
      const person = link?.people
      const personId = extractId(person?.id || person?.['@id'])
      const normalizedLinkType = normalizeEmployeeLinkTypeStrict(link?.linkType)

      if (!personId || (companyId && personId === companyId)) {
        return null
      }

      if (String(person?.peopleType || '').toUpperCase() === 'J') {
        return null
      }

      return {
        ...(person || {}),
        linkType: normalizedLinkType,
        peopleLink: link,
      }
    })
    .filter(Boolean)
}

export default buildEmployeeContactsFromPeopleLinks
