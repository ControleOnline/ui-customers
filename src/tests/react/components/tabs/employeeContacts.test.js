const {describe, expect, it} = global

const {
  buildEmployeeContactsFromPeopleLinks,
  buildPeopleLinkReadParams,
  buildSalesmanLinksFromPeopleLinks,
  extractPeopleLinkItems,
  filterPeopleLinksByScope,
  normalizeEmployeeLinkType,
  EMPLOYEE_CONTACT_LINK_TYPES,
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
    expect(normalizeEmployeeLinkType('salesman')).toBe('salesman')
    expect(normalizeEmployeeLinkType('after-sales')).toBe('after-sales')
    expect(normalizeEmployeeLinkType('unknown')).toBe('employee')
  })

  it('exports the same catalog used by create and edit pickers', () => {
    expect(EMPLOYEE_CONTACT_LINK_TYPES).toEqual([
      'employee',
      'owner',
      'director',
      'manager',
      'salesman',
      'after-sales',
      'courier',
    ])
  })

  it('builds numeric relationship filters for collection reads', () => {
    expect(
      buildPeopleLinkReadParams({
        companyId: '/people/29',
        peopleId: '/people/31',
        linkType: 'sellers-client',
      }),
    ).toEqual({
      company: '29',
      people: '31',
      linkType: ['sellers-client'],
    })
  })

  it('accepts linkTypes allowlist and itemsPerPage for contact reads (#636/#649)', () => {
    expect(
      buildPeopleLinkReadParams({
        companyId: 3,
        linkTypes: EMPLOYEE_CONTACT_LINK_TYPES,
        itemsPerPage: 100,
      }),
    ).toEqual({
      company: '3',
      linkType: EMPLOYEE_CONTACT_LINK_TYPES,
      itemsPerPage: 100,
    })
  })

  it('maps employee contacts when people is a plain IRI string (#636)', () => {
    expect(
      buildEmployeeContactsFromPeopleLinks(
        {
          member: [
            {
              id: 3229,
              linkType: 'employee',
              company: '/people/3',
              people: '/people/105789',
            },
            {
              id: 7,
              linkType: 'owner',
              company: {id: 3},
              people: {
                id: 7,
                name: 'Owner',
                peopleType: 'F',
              },
            },
          ],
        },
        {parentPeopleId: '3'},
      ),
    ).toEqual([
      expect.objectContaining({
        id: '105789',
        linkType: 'employee',
        peopleLink: expect.objectContaining({id: 3229}),
      }),
      expect.objectContaining({
        id: 7,
        linkType: 'owner',
        name: 'Owner',
      }),
    ])
  })

  it('keeps salesman and after-sales contacts in the company list (#649)', () => {
    expect(
      buildEmployeeContactsFromPeopleLinks(
        {
          member: [
            {
              id: 80,
              linkType: 'salesman',
              company: {id: 3},
              people: {id: 81, name: 'Vendedor', peopleType: 'F'},
            },
            {
              id: 82,
              linkType: 'after-sales',
              company: {id: 3},
              people: {id: 83, name: 'Pos Venda', peopleType: 'F'},
            },
          ],
        },
        {parentPeopleId: '3'},
      ),
    ).toEqual([
      expect.objectContaining({id: 81, linkType: 'salesman'}),
      expect.objectContaining({id: 83, linkType: 'after-sales'}),
    ])
  })

  it('rejects links returned outside the requested relationship scope', () => {
    const requestedLink = {
      id: 11,
      company: {id: 29},
      people: {id: 31},
      linkType: 'employee',
    }
    const unrelatedLink = {
      id: 12,
      company: {id: 2},
      people: {id: 31},
      linkType: 'employee',
    }

    expect(
      filterPeopleLinksByScope([requestedLink, unrelatedLink], {
        companyId: 29,
        peopleId: 31,
        linkTypes: ['employee'],
      }),
    ).toEqual([requestedLink])
  })

  it('keeps only salesman links whose client matches the open details page', () => {
    const requestedLink = {
      id: 21,
      company: {id: 6, name: 'Alexandre'},
      people: {id: 29},
      linkType: 'sellers-client',
    }
    const unrelatedLink = {
      id: 22,
      company: {id: 6, name: 'Alexandre'},
      people: {id: 11},
      linkType: 'sellers-client',
    }

    expect(
      buildSalesmanLinksFromPeopleLinks([requestedLink, unrelatedLink], {
        clientId: 29,
      }),
    ).toEqual([requestedLink])
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
          {
            id: 36,
            linkType: 'employee',
            company: {'@id': '/people/99'},
            people: {
              id: 37,
              '@id': '/people/37',
              name: 'Contato de outra empresa',
              alias: 'Outra',
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

  it('filters unsupported link types when an allowlist is provided', () => {
    expect(
      buildEmployeeContactsFromPeopleLinks(
        {
          member: [
            {
              id: 40,
              linkType: 'employee',
              company: {'@id': '/people/31'},
              people: {
                id: 41,
                '@id': '/people/41',
                name: 'Marina',
                alias: 'Mari',
                peopleType: 'F',
              },
            },
            {
              id: 42,
              linkType: 'client',
              company: {'@id': '/people/31'},
              people: {
                id: 43,
                '@id': '/people/43',
                name: 'Visitante',
                alias: 'Visit',
                peopleType: 'F',
              },
            },
          ],
        },
        {
          parentPeopleId: '31',
          allowedLinkTypes: ['employee', 'owner'],
        },
      ),
    ).toEqual([
      expect.objectContaining({
        id: 41,
        linkType: 'employee',
      }),
    ])
  })
})
