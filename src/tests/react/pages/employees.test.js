/* global jest */

const {describe, expect, it, beforeEach, afterEach} = global

jest.mock('@controleonline/ui-people/src/react/pages/People', () => 'People')

jest.mock('@controleonline/ui-people/src/react/utils/peopleLinkFilters', () => ({
  HUMAN_COMPANY_LINK_TYPES: [
    'employee',
    'owner',
    'director',
    'manager',
    'salesman',
    'after-sales',
    'courier',
  ],
}))

const {
  buildEmployeesContext,
  DEFAULT_EMPLOYEE_CONTEXT_TYPES,
} = require('../../../react/pages/employees')

describe('employees page context', () => {
  const originalTranslator = global.t

  beforeEach(() => {
    global.t = {
      t: (scope, group, key) => `${scope}.${group}.${key}`,
    }
  })

  afterEach(() => {
    global.t = originalTranslator
  })

  it('exposes all human company roles including salesman and after-sales', () => {
    const context = buildEmployeesContext({})

    expect(context.context).toEqual(DEFAULT_EMPLOYEE_CONTEXT_TYPES)
    expect(context.context).toEqual(
      expect.arrayContaining(['employee', 'owner', 'director', 'manager', 'salesman', 'after-sales', 'courier']),
    )
    expect(context.defaultContext).toBe('employee')
    expect(context.selectedContext).toBe('employee')
    expect(context.defaultPeopleType).toBe('F')
    expect(context.modalTitleByType.courier).toBe('Cadastro de Entregador')
    expect(context.modalTitleByType.salesman).toBe('Cadastro de Vendedor')
    expect(context.modalTitleByType['after-sales']).toBe('Cadastro de Pos-venda')
  })

  it('keeps courier as the default physical-person role when selected directly', () => {
    const context = buildEmployeesContext({
      selectedContext: 'courier',
    })

    expect(context.context).toEqual(['courier'])
    expect(context.defaultContext).toBe('courier')
    expect(context.selectedContext).toBe('courier')
    expect(context.defaultPeopleType).toBe('F')
  })

  it('defaults salesman and after-sales to pessoa fisica on create', () => {
    expect(buildEmployeesContext({selectedContext: 'salesman'}).defaultPeopleType).toBe('F')
    expect(buildEmployeesContext({selectedContext: 'after-sales'}).defaultPeopleType).toBe('F')
  })

  it('keeps owner as default peopleType J when selected directly', () => {
    const context = buildEmployeesContext({
      selectedContext: 'owner',
    })

    expect(context.defaultContext).toBe('owner')
    expect(context.defaultPeopleType).toBe('J')
  })
})
