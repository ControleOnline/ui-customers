const {describe, expect, it} = global

const {
  HUMAN_COMPANY_LINK_TYPES,
  HUMAN_COMPANY_LINK_TYPE_OPTIONS,
  isHumanCompanyLinkType,
} = require('../../../react/utils/humanCompanyLinkTypes')

const {LINK_TYPE_OPTIONS} = require('../../../react/components/tabs/employeesTabHelpers')
const {
  LINK_TYPE_OPTIONS: GENERAL_LINK_TYPE_OPTIONS,
} = require('../../../react/components/tabs/generalTabHelpers')

describe('humanCompanyLinkTypes catalog', () => {
  const required = [
    'employee',
    'owner',
    'director',
    'manager',
    'salesman',
    'after-sales',
    'courier',
  ]

  it('contains the canonical human company link types without duplicates', () => {
    expect(HUMAN_COMPANY_LINK_TYPES).toEqual(required)
    expect(new Set(HUMAN_COMPANY_LINK_TYPES).size).toBe(
      HUMAN_COMPANY_LINK_TYPES.length,
    )
  })

  it('exposes reusable UI options with matching values and translation keys', () => {
    expect(HUMAN_COMPANY_LINK_TYPE_OPTIONS.map(option => option.value)).toEqual(
      required,
    )
    expect(
      HUMAN_COMPANY_LINK_TYPE_OPTIONS.every(
        option => option.translationKey === option.value,
      ),
    ).toBe(true)
    expect(isHumanCompanyLinkType('salesman')).toBe(true)
    expect(isHumanCompanyLinkType('AFTER-SALES')).toBe(true)
    expect(isHumanCompanyLinkType('client')).toBe(false)
  })

  it('is the single source used by Contatos/Colaboradores helpers', () => {
    expect(LINK_TYPE_OPTIONS).toBe(HUMAN_COMPANY_LINK_TYPE_OPTIONS)
    expect(GENERAL_LINK_TYPE_OPTIONS).toBe(HUMAN_COMPANY_LINK_TYPE_OPTIONS)
  })
})
