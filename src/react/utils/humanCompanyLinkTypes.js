/**
 * Canonical human↔company link-type catalog for Contatos/Colaboradores.
 * Values stay aligned with ui-people HUMAN_COMPANY_LINK_TYPES.
 * Single source for create/edit/list/filter UI options in ui-customers.
 */
export const HUMAN_COMPANY_LINK_TYPES = [
  'employee',
  'owner',
  'director',
  'manager',
  'salesman',
  'after-sales',
  'courier',
];

export const HUMAN_COMPANY_LINK_TYPE_OPTIONS = HUMAN_COMPANY_LINK_TYPES.map(
  value => ({
    value,
    translationKey: value,
  }),
);

export const isHumanCompanyLinkType = value =>
  HUMAN_COMPANY_LINK_TYPES.includes(
    String(value || '')
      .trim()
      .toLowerCase(),
  );
