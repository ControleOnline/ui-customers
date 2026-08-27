/**
 * Canonical human↔company link types for Contatos create, edit and list.
 * Keep values aligned with ui-people HUMAN_COMPANY_LINK_TYPES.
 * Refs: ControleOnline/app-community#649
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

export const EMPLOYEE_CONTACT_LINK_TYPES = HUMAN_COMPANY_LINK_TYPES;

export const LINK_TYPE_OPTIONS = HUMAN_COMPANY_LINK_TYPES.map(value => ({
  value,
  translationKey: value,
}));

export const normalizeHumanCompanyLinkTypeStrict = value => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();

  return HUMAN_COMPANY_LINK_TYPES.includes(normalized) ? normalized : '';
};

export const normalizeHumanCompanyLinkType = value =>
  normalizeHumanCompanyLinkTypeStrict(value) || 'employee';
