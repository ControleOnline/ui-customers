/**
 * Pure helpers for SalesmanTab commission display, override precedence and edit permission.
 *
 * Business rules (see docs/technical/Cliente-Vendedor-Vinculo-e-Permissoes.md):
 * - franchisee link: franchisee pays franchisor
 * - salesman / sellers-client: company pays salesman (salesman receives)
 * - Precedence: client↔salesman commission (if filled) overrides salesman↔company default
 */

const extractId = value => String(value || '').replace(/\D/g, '');

const EDITABLE_COMMISSION_ROLES = ['ROLE_SUPER', 'ROLE_OWNER'];

/**
 * A commission field is "filled" when it is present (including 0).
 * null / undefined / '' are treated as absent (fall through to default).
 */
export const isCommissionFilled = value => {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === 'string' && value.trim() === '') {
    return false;
  }
  return true;
};

export const toCommissionNumber = value => {
  if (!isCommissionFilled(value)) {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

/**
 * Resolve effective commission for a client↔salesman link.
 *
 * @param {object|null} clientLink - people_link sellers-client (company=salesman, people=client)
 * @param {object|null} defaultLink - people_link salesman (company=empresa, people=salesman)
 * @returns {{
 *   comission: number|null,
 *   minimumComission: number|null,
 *   isOverride: boolean,
 *   source: 'client'|'default'|'none'
 * }}
 */
export const resolveEffectiveCommission = (clientLink, defaultLink = null) => {
  const clientComission = toCommissionNumber(clientLink?.comission);
  const clientMinimum = toCommissionNumber(
    clientLink?.minimum_comission ?? clientLink?.minimumComission,
  );
  const defaultComission = toCommissionNumber(defaultLink?.comission);
  const defaultMinimum = toCommissionNumber(
    defaultLink?.minimum_comission ?? defaultLink?.minimumComission,
  );

  const clientHasComission = isCommissionFilled(clientLink?.comission);
  const clientHasMinimum = isCommissionFilled(
    clientLink?.minimum_comission ?? clientLink?.minimumComission,
  );

  const hasClientOverride = clientHasComission || clientHasMinimum;

  return {
    comission: clientHasComission ? clientComission : defaultComission,
    minimumComission: clientHasMinimum ? clientMinimum : defaultMinimum,
    isOverride: hasClientOverride,
    source: hasClientOverride
      ? 'client'
      : defaultComission !== null || defaultMinimum !== null
        ? 'default'
        : 'none',
  };
};

/**
 * Format a commission percentage for display (pt-BR friendly).
 */
export const formatCommissionPercent = value => {
  const numeric = toCommissionNumber(value);
  if (numeric === null) {
    return '—';
  }
  const fixed = Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(2);
  return `${fixed}%`;
};

/**
 * Build a short subtitle describing effective commission + override/default.
 */
export const formatCommissionSubtitle = effective => {
  if (!effective || effective.source === 'none') {
    return 'Comissão: —';
  }

  const main = formatCommissionPercent(effective.comission);
  const min =
    effective.minimumComission !== null
      ? ` (mín. ${formatCommissionPercent(effective.minimumComission)})`
      : '';
  const tag = effective.isOverride ? 'override' : 'padrão';

  return `Comissão: ${main}${min} · ${tag}`;
};

/**
 * Edit permission for commission fields on client SalesmanTab.
 * Same criterion as franchisee commission (#10): ROLE_SUPER or ROLE_OWNER.
 */
export const canEditSalesmanCommission = (user = null, currentCompany = null) => {
  const roles = Array.isArray(user?.roles)
    ? user.roles
    : Array.isArray(user?.role)
      ? user.role
      : [];

  return (
    roles.some(role => EDITABLE_COMMISSION_ROLES.includes(String(role))) ||
    Boolean(currentCompany?.user?.owner_enabled)
  );
};

/**
 * Commission fields are only shown in MANAGER (and ADMIN) app types.
 * CRM and other views must not expose commission values.
 */
export const shouldDisplayCommission = (appType = '') => {
  const normalized = String(appType || '')
    .trim()
    .toUpperCase();
  return normalized === 'MANAGER' || normalized === 'ADMIN';
};

/**
 * Map of salesman people id → default people_link (linkType=salesman).
 */
export const indexDefaultSalesmanLinksByPeopleId = (payload = []) => {
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.member)
      ? payload.member
      : Array.isArray(payload?.['hydra:member'])
        ? payload['hydra:member']
        : [];

  return items.reduce((acc, link) => {
    const peopleId = extractId(link?.people?.id || link?.people?.['@id'] || link?.people);
    if (!peopleId) {
      return acc;
    }
    acc[peopleId] = link;
    return acc;
  }, {});
};

/**
 * Build save payload for people_link commission update.
 */
export const buildCommissionSavePayload = (link, {comission, minimumComission}) => {
  const id = extractId(link?.id || link?.['@id']);
  if (!id) {
    return null;
  }

  return {
    id,
    comission: toCommissionNumber(comission) ?? 0,
    minimum_comission: toCommissionNumber(minimumComission) ?? 0,
  };
};

export {extractId, EDITABLE_COMMISSION_ROLES};
