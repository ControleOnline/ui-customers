/**
 * Pure helpers for GeneralTab (registration form, dates, link types).
 * Extracted to keep GeneralTab.js under the absolute 500-line limit.
 */
import { formatDisplayUppercase } from '@controleonline/ui-common/src/react/utils/entityDisplay';

const normalizeText = value => String(value || '').replace(/\s+/g, ' ').trim();
const normalizeIdentityValue = value => formatDisplayUppercase(normalizeText(value));
const extractId = value => String(value || '').replace(/\D/g, '');

const normalizeEnable = value => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === '1' || normalized === 'true';
  }

  return false;
};

const formatYmdToBr = value => {
  if (!value) {
    return '';
  }

  const normalized = String(value).split('T')[0];
  const parts = normalized.split('-');
  if (parts.length !== 3) {
    return '';
  }

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

const formatDateInput = text => {
  const numbers = String(text || '').replace(/\D/g, '').slice(0, 8);
  if (!numbers) {
    return '';
  }

  if (numbers.length <= 2) {
    return numbers;
  }

  if (numbers.length <= 4) {
    return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
  }

  return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4)}`;
};

const parseBrDateToYmd = value => {
  const formatted = formatDateInput(value);
  if (formatted.length !== 10) {
    return null;
  }

  const [day, month, year] = formatted.split('/').map(v => parseInt(v, 10));
  if (!day || !month || !year) {
    return null;
  }

  const candidate = new Date(year, month - 1, day);
  const isValid =
    candidate.getFullYear() === year &&
    candidate.getMonth() === month - 1 &&
    candidate.getDate() === day;

  if (!isValid) {
    return null;
  }

  return `${year.toString().padStart(4, '0')}-${month
    .toString()
    .padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
};

const LINK_TYPE_OPTIONS = [
  { value: 'employee', translationKey: 'employee' },
  { value: 'owner', translationKey: 'owner' },
  { value: 'director', translationKey: 'director' },
  { value: 'manager', translationKey: 'manager' },
  { value: 'courier', translationKey: 'courier' },
];

const normalizeLinkType = value => {
  const normalized = String(value || '').trim().toLowerCase();
  return ['employee', 'owner', 'director', 'manager', 'courier'].includes(normalized)
    ? normalized
    : 'employee';
};

const toPeopleIri = value => {
  const directIri = String(value?.['@id'] || '').trim();
  if (directIri.startsWith('/people/')) {
    return directIri;
  }

  const id = String(value?.id || '').replace(/\D/g, '');
  return id ? `/people/${id}` : '';
};

export {
  normalizeText,
  normalizeIdentityValue,
  extractId,
  normalizeEnable,
  formatYmdToBr,
  formatDateInput,
  parseBrDateToYmd,
  LINK_TYPE_OPTIONS,
  normalizeLinkType,
  toPeopleIri,
};
