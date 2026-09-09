const {expect, test} = require('playwright/test');
const {API_ORIGIN} = require('../../../../../../../src/tests/browser/apiOrigin');
const {version: appVersion} = require('../../../../../../../package.json');

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers':
    'API-TOKEN, APP-DOMAIN, DEVICE, ACCEPT, CONTENT-TYPE, X-Requested-With',
  'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
};

const collection = (member = []) => ({
  member,
  'hydra:member': member,
  totalItems: member.length,
  'hydra:totalItems': member.length,
});

const jsonHeaders = () => ({
  ...CORS_HEADERS,
  'content-type': 'application/ld+json; charset=utf-8',
});

/**
 * Browser smoke for ControleOnline/app-community#759:
 * opening Users tab must fire GET /users?people=/people/{id}.
 */
const mockClientDetailsUsersTabApi = async page => {
  const company = {
    id: 3,
    name: 'Controle Online',
    alias: 'CONTROLE ONLINE',
    panel_enabled: true,
    enabled: true,
    commercial_enabled: true,
    theme: {colors: {primary: '#0EA5E9', secondary: '#F97316'}},
    configs: {},
  };
  const getUsersRequests = [];
  const listedUsers = [
    {
      '@id': '/users/501',
      id: 501,
      username: 'user.31468',
      people: '/people/31468',
    },
  ];

  const person = {
    '@id': '/people/31468',
    id: 31468,
    name: 'Pessoa Users Tab',
    alias: 'PESSOA USERS',
    peopleType: 'F',
    enabled: true,
    user: [],
  };

  await page.route(`${API_ORIGIN}/**`, async route => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname.replace(/^\/+/, '');
    const method = request.method().toUpperCase();

    if (method === 'OPTIONS') {
      return route.fulfill({status: 204, headers: CORS_HEADERS, body: ''});
    }

    if (pathname === 'themes-colors.css') {
      return route.fulfill({
        status: 200,
        headers: {...CORS_HEADERS, 'content-type': 'text/css; charset=utf-8'},
        body: ':root { --primary: #0ea5e9; }',
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

    if (pathname === 'people/31468') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(person),
      });
    }

    if (pathname === 'users' && method === 'GET') {
      getUsersRequests.push({
        people: url.searchParams.get('people'),
        itemsPerPage: url.searchParams.get('itemsPerPage'),
        company: url.searchParams.get('company'),
      });
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection(listedUsers)),
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
      try {
        localStorage.setItem(
          'session',
          JSON.stringify({
            id: 7,
            people: '/people/7',
            api_key: 'test-api-key',
            token: 'test-api-key',
            active: 1,
            mycompany: 3,
            roles: ['ROLE_SUPER', 'ROLE_HUMAN'],
          }),
        );
        localStorage.setItem('config', JSON.stringify({language: 'pt-br'}));
        localStorage.setItem('app-type', 'MANAGER');
        localStorage.setItem(
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
      } catch {
        // ignore
      }
    },
    {appVersion},
  );

  return {getUsersRequests};
};

test.describe('client details Users tab load browser smoke (#759)', () => {
  test('opening Users tab requests GET /users?people=/people/{id}', async ({
    page,
  }) => {
    const api = await mockClientDetailsUsersTabApi(page);

    await page.goto(
      '/client-details?clientId=31468&contextKey=employee&initialTab=users',
    );

    await expect(page.getByText(/Usuários|Users|Dados Cadastrais/i).first()).toBeVisible({
      timeout: 15000,
    });

    await expect.poll(() => api.getUsersRequests.length, {timeout: 15000}).toBeGreaterThan(0);

    const last = api.getUsersRequests[api.getUsersRequests.length - 1];
    expect(String(last.people || '')).toMatch(/\/people\/31468/);
    expect(String(last.itemsPerPage || '')).toBe('100');
    expect(last.company).toBeNull();

    await expect(page.getByText('user.31468')).toBeVisible({timeout: 15000});
  });
});
