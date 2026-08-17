const {expect, test} = require('playwright/test');
const {API_ORIGIN} = require('../../../../../../../src/tests/browser/apiOrigin');
const {version: appVersion} = require('../../../../../../../package.json');

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers':
    'API-TOKEN, APP-DOMAIN, DEVICE, ACCEPT, CONTENT-TYPE, X-Requested-With',
  'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
};

const collection = (member = [], summary = {}) => ({
  member,
  'hydra:member': member,
  totalItems: member.length,
  'hydra:totalItems': member.length,
  summary,
});

const jsonHeaders = () => ({
  ...CORS_HEADERS,
  'content-type': 'application/ld+json; charset=utf-8',
});

const textHeaders = () => ({
  ...CORS_HEADERS,
  'content-type': 'text/css; charset=utf-8',
});

const createCompany = () => ({
  id: 3,
  name: 'Controle Online',
  alias: 'CONTROLE ONLINE',
  panel_enabled: true,
  enabled: true,
  commercial_enabled: true,
  theme: {
    colors: {
      primary: '#0EA5E9',
      secondary: '#F97316',
    },
  },
  configs: {},
});

const buildMediaType = ({id, type, peopleType}) => ({
  '@id': `/media_types/${id}`,
  id,
  type,
  peopleType,
});

const buildPeopleMedia = ({id, peopleId, mediaType, fileName}) => ({
  '@id': `/people_media/${id}`,
  id,
  people: `/people/${peopleId}`,
  mediaType,
  file: {
    '@id': `/files/${id}`,
    id,
    name: fileName,
    extension: fileName.split('.').pop(),
    url: `https://cdn.example/${fileName}`,
  },
});

const buildPeopleLink = ({id, company, people, linkType = 'employee'}) => ({
  '@id': `/people_links/${id}`,
  id,
  company,
  people,
  linkType,
});

const mockClientDetailsApi = async page => {
  const company = createCompany();
  const personAvatar = buildPeopleMedia({
    id: 102,
    peopleId: 30,
    mediaType: buildMediaType({id: 11, type: 'avatar', peopleType: 'F'}),
    fileName: 'person-avatar.png',
  });
  const peopleById = {
    9: {
      '@id': '/people/9',
      id: 9,
      name: 'CLIENT WITHOUT MEDIA',
      alias: 'CLIENT WITHOUT MEDIA',
      peopleType: 'F',
      enable: true,
      email: 'client-without-media@example.com',
      image: 9,
    },
    29: {
      '@id': '/people/29',
      id: 29,
      name: 'LAVE GO FRANQUIAS LTDA',
      alias: 'LAVE GO',
      peopleType: 'J',
      enable: true,
    },
    30: {
      '@id': '/people/30',
      id: 30,
      name: 'JOAO SILVA',
      alias: 'JOAO SILVA',
      peopleType: 'F',
      enable: true,
      peopleMedia: [personAvatar],
    },
  };

  await page.route(`${API_ORIGIN}/**`, async route => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname.replace(/^\/+/, '');
    const method = request.method().toUpperCase();

    if (method === 'OPTIONS') {
      return route.fulfill({
        status: 204,
        headers: CORS_HEADERS,
        body: '',
      });
    }

    if (pathname === 'themes-colors.css') {
      return route.fulfill({
        status: 200,
        headers: textHeaders(),
        body: ':root { --primary: #0ea5e9; --secondary: #f97316; }',
      });
    }

    if (pathname === 'runtime/ip') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify({ip: '127.0.0.1'}),
      });
    }

    if (pathname === 'people/company/default') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(company),
      });
    }

    if (pathname === 'people/companies/my') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection([company])),
      });
    }

    if (pathname === 'people/9' || pathname === 'people/29' || pathname === 'people/30') {
      const client = peopleById[Number(pathname.split('/')[1])];
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(client),
      });
    }

    if (pathname === 'media_types') {
      const peopleType = String(url.searchParams.get('peopleType') || '').toUpperCase();
      const type = url.searchParams.get('type');

      const mediaTypes =
        peopleType === 'F'
          ? [buildMediaType({id: 11, type: 'avatar', peopleType: 'F'})]
          : [buildMediaType({id: 12, type: 'icon', peopleType: 'J'})];

      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(
          collection(mediaTypes.filter(item => !type || item.type === type)),
        ),
      });
    }

    if (pathname === 'people_links') {
      const companyId = String(url.searchParams.get('company') || '').replace(/\D/g, '');
      const links =
        companyId === '9'
          ? [
              buildPeopleLink({
                id: 201,
                company: peopleById[9],
                people: peopleById[30],
              }),
            ]
          : [];

      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection(links)),
      });
    }

    if (pathname === 'people_media') {
      if (method === 'POST') {
        const body = await request.postDataJSON().catch(() => ({}));
        const peopleId = String(body?.people || '').replace(/\D/g, '') || '30';
        const mediaTypeId = String(body?.mediaType || '').replace(/\D/g, '') || '11';
        const mediaType = buildMediaType({
          id: Number(mediaTypeId),
          type: mediaTypeId === '12' ? 'icon' : 'avatar',
          peopleType: mediaTypeId === '12' ? 'J' : 'F',
        });

        return route.fulfill({
          status: 201,
          headers: jsonHeaders(),
          body: JSON.stringify(
            buildPeopleMedia({
              id: 130,
              peopleId: Number(peopleId),
              mediaType,
              fileName: 'selected-library-image.png',
            }),
          ),
        });
      }

      const people = String(url.searchParams.get('people') || '');
      const mediaType = String(url.searchParams.get('mediaType.type') || '');
      const media =
        people.endsWith('/29') && mediaType === 'icon'
          ? buildPeopleMedia({
              id: 101,
              peopleId: 29,
              mediaType: buildMediaType({id: 12, type: 'icon', peopleType: 'J'}),
              fileName: 'company-icon.png',
            })
          : people.endsWith('/30') && mediaType === 'avatar'
            ? buildPeopleMedia({
                id: 102,
                peopleId: 30,
                mediaType: buildMediaType({id: 11, type: 'avatar', peopleType: 'F'}),
                fileName: 'person-avatar.png',
              })
            : null;

      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection(media ? [media] : [])),
      });
    }

    if (pathname === 'menus-people') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify({modules: {}}),
      });
    }

    if (pathname === 'configs/discovery-configs') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify({configs: {}}),
      });
    }

    return route.fulfill({
      status: 200,
      headers: jsonHeaders(),
      body: JSON.stringify(collection([])),
    });
  });

  await page.addInitScript(
    ({appVersion}) => {
      const setLocalStorageItem = (key, value) => {
        try {
          localStorage.setItem(key, value);
        } catch {
          // Initial documents such as about:blank do not expose storage.
        }
      };

      setLocalStorageItem(
        'session',
        JSON.stringify({
          id: 7,
          people: '/people/7',
          api_key: 'test-api-key',
          active: 1,
          mycompany: 3,
          roles: ['ROLE_SUPER'],
        }),
      );
      setLocalStorageItem('config', JSON.stringify({language: 'pt-br'}));
      setLocalStorageItem('app-type', 'MANAGER');
      setLocalStorageItem(
        'device',
        JSON.stringify({
          id: 'web-manager',
          device: 'web-manager',
          type: 'WEB',
          appName: 'Browser Manager',
          appVersion,
          buildNumber: appVersion,
          systemName: 'web',
          systemVersion: 'web',
          deviceType: 'web',
          metadata: {},
        }),
      );
    },
    {appVersion},
  );
};

test.describe('client details media browser smoke', () => {
  test('loads contact avatars from people_links without contact people_media requests', async ({page}) => {
    const contactMediaRequests = [];

    page.on('request', request => {
      const url = new URL(request.url());

      if (
        url.pathname.replace(/^\/+/, '') === 'people_media' &&
        decodeURIComponent(url.search).includes('/people/30')
      ) {
        contactMediaRequests.push(request.url());
      }
    });

    await mockClientDetailsApi(page);

    await page.goto('/client-details?clientId=9&contextKey=client&initialTab=contacts');

    await expect(page.getByText('Contatos', {exact: true})).toBeVisible({timeout: 15000});
    await expect(page.getByText('JOAO SILVA', {exact: true})).toBeVisible();
    expect(contactMediaRequests).toEqual([]);
  });

  test('loads valid client details without media as initials only', async ({page}) => {
    const avatarRequests = [];

    page.on('request', request => {
      const url = request.url();

      if (/gravatar\.com\/avatar|\/files\/9\/download/i.test(url)) {
        avatarRequests.push(url);
      }
    });

    await mockClientDetailsApi(page);

    await page.goto('/client-details?clientId=9&contextKey=client');

    await expect(page.getByText('CLIENT WITHOUT MEDIA', {exact: true})).toBeVisible({timeout: 15000});
    await expect(page.getByText('Documentos', {exact: true})).toBeVisible();
    await expect(page.getByText('Not Found', {exact: true})).toHaveCount(0);
    expect(avatarRequests).toEqual([]);
  });

  test('shows company icon upload controls for pessoa juridica', async ({page}) => {
    await mockClientDetailsApi(page);

    await page.goto('/client-details?clientId=29&contextKey=client');

    await expect(page.getByText('Documentos', {exact: true})).toBeVisible({timeout: 15000});
    await page.getByText('Media', {exact: true}).click();
    const managerButton = page.getByText('Gerenciar icon', {exact: true});
    await expect(managerButton).toBeVisible();
    await managerButton.click();

    const uploadButton = page.getByText('Enviar nova', {exact: true});
    await expect(uploadButton).toBeVisible();

    const fileChooserPromise = page.waitForEvent('filechooser');
    await uploadButton.click();
    await expect(fileChooserPromise).resolves.toBeTruthy();
  });

  test('shows personal avatar upload controls for pessoa fisica', async ({page}) => {
    await mockClientDetailsApi(page);

    await page.goto('/client-details?clientId=30&contextKey=client');

    await expect(page.getByText('Documentos', {exact: true})).toBeVisible({timeout: 15000});
    await page.getByText('Media', {exact: true}).click();
    const managerButton = page.getByText('Gerenciar avatar', {exact: true});
    await expect(managerButton).toBeVisible();
    await managerButton.click();

    const uploadButton = page.getByText('Enviar nova', {exact: true});
    await expect(uploadButton).toBeVisible();

    const fileChooserPromise = page.waitForEvent('filechooser');
    await uploadButton.click();
    await expect(fileChooserPromise).resolves.toBeTruthy();
  });
});
