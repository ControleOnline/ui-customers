const {describe, expect, it} = global

const {
  buildEmployeeContactsFromPeopleLinks,
  buildPeopleLinkReadParams,
  buildSalesmanLinksFromPeopleLinks,
  extractPeopleLinkItems,
  filterPeopleLinksByScope,
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
    expect(normalizeEmployeeLinkType('SALESMAN')).toBe('salesman')
    expect(normalizeEmployeeLinkType('after-sales')).toBe('after-sales')
    expect(normalizeEmployeeLinkType('unknown')).toBe('employee')
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

  it('maps people links to PF and PJ contacts for the customer details tab', () => {
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
        id: 33,
        '@id': '/people/33',
        name: 'Filial',
        alias: 'Filial',
        peopleType: 'J',
        linkType: 'employee',
        peopleLink: expect.objectContaining({
          id: 32,
          linkType: 'employee',
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
  it('excludes soft-deleted people and disabled people_links', () => {
    expect(
      buildEmployeeContactsFromPeopleLinks(
        {
          member: [
            {
              id: 50,
              linkType: 'employee',
              enable: 1,
              company: {'@id': '/people/31'},
              people: {
                id: 51,
                '@id': '/people/51',
                name: 'Ativo',
                peopleType: 'F',
                deleted: false,
              },
            },
            {
              id: 52,
              linkType: 'employee',
              enable: 1,
              company: {'@id': '/people/31'},
              people: {
                id: 53,
                '@id': '/people/53',
                name: 'Removido',
                peopleType: 'F',
                deleted: true,
              },
            },
            {
              id: 54,
              linkType: 'manager',
              enable: 0,
              company: {'@id': '/people/31'},
              people: {
                id: 55,
                '@id': '/people/55',
                name: 'Desvinculado',
                peopleType: 'F',
                deleted: false,
              },
            },
          ],
        },
        {parentPeopleId: '31'},
      ),
    ).toEqual([
      expect.objectContaining({
        id: 51,
        linkType: 'employee',
        peopleLinkId: '50',
      }),
    ])
  })
})
