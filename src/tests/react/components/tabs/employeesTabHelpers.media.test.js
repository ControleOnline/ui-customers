import {
  extractPeopleMediaUrl,
  fetchPeopleMediaUrls,
} from '../../../../react/components/tabs/employeesTabHelpers';

jest.mock('@controleonline/ui-common/src/react/utils/fileUrl', () => ({
  resolveFileImageUrl: file => (file?.url ? file.url : file?.['@id'] || ''),
}));

describe('fetchPeopleMediaUrls batch', () => {
  it('issues a single getPeopleMedia call for multiple people ids', async () => {
    const getPeopleMedia = jest.fn().mockResolvedValue([
      { people: { '@id': '/people/10' }, file: { url: 'https://cdn/a.png' } },
      { people: { id: 20 }, file: { url: 'https://cdn/b.png' } },
    ]);

    const result = await fetchPeopleMediaUrls({
      peopleActions: { getPeopleMedia },
      mediaType: 'avatar',
      peopleIds: [10, '20', '/people/10'],
    });

    expect(getPeopleMedia).toHaveBeenCalledTimes(1);
    expect(getPeopleMedia).toHaveBeenCalledWith({
      people: ['/people/10', '/people/20'],
      'mediaType.type': 'avatar',
      itemsPerPage: 2,
    });
    expect(result).toEqual({
      '10': 'https://cdn/a.png',
      '20': 'https://cdn/b.png',
    });
  });

  it('falls back to per-id calls when batch rejects', async () => {
    const getPeopleMedia = jest
      .fn()
      .mockRejectedValueOnce(new Error('batch unsupported'))
      .mockResolvedValueOnce([{ people: { id: 1 }, file: { url: 'https://cdn/1.png' } }])
      .mockResolvedValueOnce([{ people: { id: 2 }, file: { url: 'https://cdn/2.png' } }]);

    const result = await fetchPeopleMediaUrls({
      peopleActions: { getPeopleMedia },
      mediaType: 'avatar',
      peopleIds: [1, 2],
    });

    expect(getPeopleMedia).toHaveBeenCalledTimes(3);
    expect(result).toEqual({
      '1': 'https://cdn/1.png',
      '2': 'https://cdn/2.png',
    });
  });
});

describe('extractPeopleMediaUrl from people_links payload', () => {
  it('reads avatar file from embedded peopleMedia', () => {
    const url = extractPeopleMediaUrl({
      id: 10,
      peopleMedia: [
        {
          mediaType: { type: 'avatar' },
          file: { id: 99, url: 'https://cdn/avatar.png' },
        },
      ],
    });
    expect(url).toBe('https://cdn/avatar.png');
  });

  it('returns empty string when peopleMedia is missing', () => {
    expect(extractPeopleMediaUrl({ id: 10 })).toBe('');
    expect(extractPeopleMediaUrl(null)).toBe('');
  });
});
