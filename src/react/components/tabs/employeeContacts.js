const EMPLOYEE_CONTACT_LINK_TYPES = ['employee', 'owner', 'director', 'manager', 'courier']

const extractId = value => String(value || '').replace(/\D/g, '')

export const normalizeEmployeeLinkType = value => {
  const normalized = String(value || '').trim().toLowerCase()

  return EMPLOYEE_CONTACT_LINK_TYPES.includes(normalized)
    ? normalized
    : 'employee'
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
  {parentPeopleId = ''} = {},
) => {
  const companyId = extractId(parentPeopleId)

  return extractPeopleLinkItems(payload)
    .map(link => {
      const person = link?.people
      const personId = extractId(person?.id || person?.['@id'])

      if (!personId || (companyId && personId === companyId)) {
        return null
      }

      if (String(person?.peopleType || '').toUpperCase() === 'J') {
        return null
      }

      return {
        ...(person || {}),
        linkType: normalizeEmployeeLinkType(link?.linkType),
        peopleLink: link,
      }
    })
    .filter(Boolean)
}

export default buildEmployeeContactsFromPeopleLinks
