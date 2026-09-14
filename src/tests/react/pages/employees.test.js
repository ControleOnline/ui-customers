/* global jest */

const {describe, expect, it, beforeEach, afterEach} = global

jest.mock('@controleonline/ui-people/src/react/pages/People', () => 'People')

const {
  buildEmployeesContext,
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

  it('exposes courier alongside the default employee roles', () => {
    const context = buildEmployeesContext({})

    expect(context.context).toEqual(['all', 'employee', 'owner', 'courier'])
    expect(context.defaultContext).toBe('all')
    expect(context.selectedContext).toBe('all')
    expect(context.defaultPeopleType).toBe('J')
    expect(context.modalTitleByType.courier).toBe('Cadastro de Entregador')
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
})
