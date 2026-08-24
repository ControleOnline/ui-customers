/**
 * Pure helpers for franchise commission (people_link linkType=franchisee).
 * Extracted to keep UI components under the absolute 500-line limit.
 */

const extractId = value => String(value || '').replace(/\D/g, '');

const normalizeNumber = value => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

/**
 * Detect whether a people_link represents a franchisee of the franchisor.
 */
export const isFranchiseeLink = (link, {peopleId = '', companyId = ''} = {}) => {
  if (!link) {
    return false;
  }
  const linkType = String(link?.linkType || '').trim().toLowerCase();
  if (linkType !== 'franchisee') {
    return false;
  }
  const normalizedPeopleId = extractId(peopleId);
  const normalizedCompanyId = extractId(companyId);
  if (normalizedPeopleId) {
    const linkPeopleId = extractId(link?.people?.id || link?.people?.['@id'] || link?.people);
    if (linkPeopleId && linkPeopleId !== normalizedPeopleId) {
      return false;
    }
  }
  if (normalizedCompanyId) {
    const linkCompanyId = extractId(link?.company?.id || link?.company?.['@id'] || link?.company);
    if (linkCompanyId && linkCompanyId !== normalizedCompanyId) {
      return false;
    }
  }
  return true;
};

/**
 * Pick the first franchisee link from a collection payload / array.
 */
export const pickFranchiseeLink = (payload, scope = {}) => {
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.member)
      ? payload.member
      : Array.isArray(payload?.['hydra:member'])
        ? payload['hydra:member']
        : [];

  return items.find(item => isFranchiseeLink(item, scope)) || null;
};

/**
 * superadmin (ROLE_SUPER) or owner of the franchisor (owner_enabled).
 */
export const canEditFranchiseCommission = ({user = null, currentCompany = null} = {}) => {
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  if (roles.includes('ROLE_SUPER')) {
    return true;
  }
  return Boolean(currentCompany?.user?.owner_enabled);
};

/**
 * Build read params for franchisee people_link lookup.
 */
export const buildFranchiseeLinkParams = ({peopleId = '', companyId = ''} = {}) => {
  // API Platform exposes linkType as an array filter on people_links.
  const params = {linkType: ['franchisee']};
  const pid = extractId(peopleId);
  const cid = extractId(companyId);
  if (pid) {
    params.people = pid;
  }
  if (cid) {
    params.company = cid;
  }
  return params;
};

/**
 * Normalize commission form values for display / save.
 */
export const normalizeCommissionFields = (link = {}) => ({
  comission: normalizeNumber(link?.comission ?? link?.commission) ?? 0,
  minimum_comission:
    normalizeNumber(link?.minimum_comission ?? link?.minimumComission) ?? 0,
});

/**
 * Validate commission inputs before save.
 * comission is a percentage (0–100); minimum_comission is a monetary minimum (>= 0).
 */
export const validateCommissionFields = ({comission, minimum_comission} = {}) => {
  const c = normalizeNumber(comission);
  const m = normalizeNumber(minimum_comission);
  if (c === null || c < 0 || c > 100) {
    return {ok: false, error: 'invalidComission'};
  }
  if (m === null || m < 0) {
    return {ok: false, error: 'invalidMinimumComission'};
  }
  return {ok: true, comission: c, minimum_comission: m};
};

/**
 * Format percentage for read-only display.
 */
export const formatPercent = value => {
  const n = normalizeNumber(value);
  if (n === null) {
    return '—';
  }
  return `${n}%`;
};

/**
 * Format monetary minimum for read-only display (raw number, no currency symbol).
 */
export const formatMinimum = value => {
  const n = normalizeNumber(value);
  if (n === null) {
    return '—';
  }
  return String(n);
};

export {extractId, normalizeNumber};
