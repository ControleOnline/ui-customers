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

export const buildEmployeeContactsFromPeopleLinks = (
  payload,
  {parentPeopleId = '', allowedLinkTypes = EMPLOYEE_CONTACT_LINK_TYPES} = {},
) => {
  const companyId = extractId(parentPeopleId)
  const normalizedAllowedLinkTypes = Array.isArray(allowedLinkTypes)
    ? allowedLinkTypes.map(normalizeEmployeeLinkTypeStrict).filter(Boolean)
    : EMPLOYEE_CONTACT_LINK_TYPES

  return extractPeopleLinkItems(payload)
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

      if (!normalizedLinkType || !normalizedAllowedLinkTypes.includes(normalizedLinkType)) {
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
