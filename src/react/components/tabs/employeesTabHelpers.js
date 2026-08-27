import { resolveFileImageUrl } from '@controleonline/ui-common/src/react/utils/fileUrl';
import {
  } from '@controleonline/ui-common/src/react/utils/entityDisplay';
import { normalizeEmployeeLinkType } from './employeeContacts';
import { LINK_TYPE_OPTIONS } from './humanCompanyLinkCatalog';

export { LINK_TYPE_OPTIONS } from './humanCompanyLinkCatalog';

export const extractId = value => String(value || '').replace(/\D/g, '');
export const normalizeIdentityValue = value => String(value);

export const normalizeCollection = payload => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  if (Array.isArray(payload.member)) return payload.member;
  if (Array.isArray(payload['hydra:member'])) return payload['hydra:member'];
  if (Array.isArray(payload.items)) return payload.items;
  return [];
};

export const extractPeopleMediaUrl = (person, mediaType = 'avatar') => {
  if (!person || typeof person !== 'object') {
    return '';
  }

  const collection = normalizeCollection(
    person.peopleMedia || person.people_media || person.media,
  );
  const wanted = String(mediaType || '').trim().toLowerCase();
  const match =
    collection.find(item => {
      const type = String(
        item?.mediaType?.type || item?.mediaType || item?.type || '',
      )
        .trim()
        .toLowerCase();
      return wanted ? type === wanted : Boolean(type);
    }) || collection[0];

  return resolveFileImageUrl(match?.file) || '';
};

export const fetchPeopleMediaUrls = async ({ peopleActions, mediaType, peopleIds }) => {
  const uniqueIds = [...new Set((peopleIds || []).map(extractId).filter(Boolean))];
  if (uniqueIds.length === 0) {
    return {};
  }

  const buildMapFromCollection = response => {
    const byPeopleId = {};
    for (const media of normalizeCollection(response)) {
      const peopleId = extractId(
        media?.people?.['@id'] || media?.people?.id || media?.people,
      );
      if (!peopleId || byPeopleId[peopleId]) {
        continue;
      }
      const imageUrl = resolveFileImageUrl(media?.file);
      if (imageUrl) {
        byPeopleId[peopleId] = imageUrl;
      }
    }
    return byPeopleId;
  };

  // Batch: uma chamada people_media com people[] (SearchFilter exact multi-valor).
  try {
    const response = await peopleActions.getPeopleMedia({
      people: uniqueIds.map(id => `/people/${id}`),
      'mediaType.type': mediaType,
      itemsPerPage: Math.max(uniqueIds.length, 1),
    });
    return buildMapFromCollection(response);
  } catch {
    // Fallback: N chamadas só se o filtro batch não for aceito pelo backend.
    const entries = await Promise.all(
      uniqueIds.map(async peopleId => {
        try {
          const response = await peopleActions.getPeopleMedia({
            people: `/people/${peopleId}`,
            'mediaType.type': mediaType,
            itemsPerPage: 1,
          });
          const media = normalizeCollection(response)[0];
          const imageUrl = resolveFileImageUrl(media?.file);
          return imageUrl ? [peopleId, imageUrl] : null;
        } catch {
          return null;
        }
      }),
    );

    return entries
      .filter(Boolean)
      .reduce((accumulator, [peopleId, imageUrl]) => {
        accumulator[peopleId] = imageUrl;
        return accumulator;
      }, {});
  }
};

export const formatDateInput = text => {
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

export const parseBrDateToYmd = value => {
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

export const resolveEmployeeLinkType = employee =>
  normalizeEmployeeLinkType(
    employee?.linkType ||
      employee?.link?.linkType ||
      employee?.peopleLink?.linkType ||
      (Array.isArray(employee?.link) ? employee.link[0]?.linkType : ''),
  );


/**
 * Builds ClientDetails navigation params when opening an employee from
 * EmployeesTab (juridical client). Always opens on the "general" tab so the
 * PF detail does not land on contracts/contacts by mistake.
 * Refs: ControleOnline/app-community#9
 */
export const buildEmployeeDetailNavParams = ({
  employee,
  parentPeopleId,
}) => {
  const clientId = extractId(employee?.id || employee?.['@id']);
  if (!clientId) {
    return null;
  }

  return {
    clientId,
    contextKey: 'contacts',
    initialTab: 'general',
    parentCompanyId: parentPeopleId,
    linkType: resolveEmployeeLinkType(employee),
  };
};

export const resolveEmployeeContactLinkType = employee =>
  String(
    employee?.peopleLink?.linkType ||
      employee?.linkType ||
      employee?.link?.linkType ||
      (Array.isArray(employee?.link) ? employee.link[0]?.linkType : '') ||
      '',
  ).trim();

export const formatEmployeeContactTitle = employee => {
  const name = String(employee?.name || '').replace(/\s+/g, ' ').trim() || '-';
  const alias = String(employee?.alias || '').replace(/\s+/g, ' ').trim();

  return alias ? `${name} / ${alias}` : name;
};

export const formatEmployeeContactMeta = employee => {
  const id = extractId(employee?.id || employee?.['@id']) || '-';
  const linkType = resolveEmployeeContactLinkType(employee);

  return linkType ? `ID: ${id} / ${linkType}` : `ID: ${id}`;
};

export const buildEmployeeCreatePayload = ({
  name,
  alias,
  foundationDate,
  linkType,
  parentPeopleId,
}) => {
  const payload = {
    name,
    alias,
    peopleType: 'F',
    company: `/people/${parentPeopleId}`,
    linkType: normalizeEmployeeLinkType(linkType),
    'extra-data': {},
  };

  if (foundationDate) {
    payload.foundationDate = foundationDate;
  }

  return payload;
};
