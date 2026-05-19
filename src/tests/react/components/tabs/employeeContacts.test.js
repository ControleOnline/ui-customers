const {describe, expect, it} = global

const {
  buildEmployeeContactsFromPeopleLinks,
  extractPeopleLinkItems,
  normalizeEmployeeLinkType,
} = require('../../../../react/components/tabs/employeeContacts')

describe('employeeContacts', () => {
  it('reads collection members from hydra payloads', () => {
    expect(
      extractPeopleLinkItems({
        'hydra:member': [{id: 1}],
      }),
    ).toEqual([{id: 1}])
  })

  it('normalizes supported link types and falls back to employee', () => {
    expect(normalizeEmployeeLinkType('OWNER')).toBe('owner')
    expect(normalizeEmployeeLinkType('courier')).toBe('courier')
    expect(normalizeEmployeeLinkType('unknown')).toBe('employee')
  })

  it('maps people links to physical contacts for the customer details tab', () => {
    expect(
      buildEmployeeContactsFromPeopleLinks(
        {
          member: [
            {
              id: 31,
              linkType: 'owner',
              company: {'@id': '/people/31'},
              people: {
                id: 30,
                '@id': '/people/30',
                name: 'Claudia',
                alias: 'Claudia',
                peopleType: 'F',
              },
            },
          {
            id: 32,
            linkType: 'employee',
            company: {'@id': '/people/31'},
            people: {
              id: 33,
              '@id': '/people/33',
              name: 'Filial',
              alias: 'Filial',
              peopleType: 'J',
            },
          },
          {
            id: 34,
            linkType: 'courier',
            company: {'@id': '/people/31'},
            people: {
              id: 35,
              '@id': '/people/35',
              name: 'Rafael',
              alias: 'Rafa',
              peopleType: 'F',
            },
          },
        ],
      },
      {parentPeopleId: '31'},
    ),
    ).toEqual([
      expect.objectContaining({
        id: 30,
        '@id': '/people/30',
        name: 'Claudia',
        alias: 'Claudia',
        peopleType: 'F',
        linkType: 'owner',
        peopleLink: expect.objectContaining({
          id: 31,
          linkType: 'owner',
        }),
      }),
      expect.objectContaining({
        id: 35,
        '@id': '/people/35',
        name: 'Rafael',
        alias: 'Rafa',
        peopleType: 'F',
        linkType: 'courier',
        peopleLink: expect.objectContaining({
          id: 34,
          linkType: 'courier',
        }),
      }),
    ])
  })
})
