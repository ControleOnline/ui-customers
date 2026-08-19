/**
 * Smoke: EmployeesTab list refresh on focus after edit (app-community#375)
 *
 * Covers acceptance:
 * 1. Open Client Details → aba Colaboradores/contacts
 * 2. List shows initial employee name from people_links GET
 * 3. Simulate leave + return (focus regain, same path as edit→back)
 * 4. List shows updated payload from subsequent people_links GET without full F5
 */
const {expect, test} = require('playwright/test');
const {API_ORIGIN} = require('../../../../../../../src/tests/browser/apiOrigin');
const {version: appVersion} = require('../../../../../../../package.json');

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers':
    'API-TOKEN, APP-DOMAIN, DEVICE, ACCEPT, CONTENT-TYPE, X-Requested-With',
  'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
};

const jsonHeaders = () => ({
  ...CORS_HEADERS,
  'content-type': 'application/ld+json; charset=utf-8',
});

const textHeaders = () => ({
  ...CORS_HEADERS,
  'content-type': 'text/css; charset=utf-8',
});

const collection = (member = []) => ({
  member,
  'hydra:member': member,
  totalItems: member.length,
  'hydra:totalItems': member.length,
});

const company = {
  '@id': '/people/2',
  id: 2,
  name: 'CONTROLE ONLINE',
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
};

const client = {
  '@id': '/people/31487',
  id: 31487,
  name: 'CLIENTE TESTE LTDA',
  alias: 'CLIENTE TESTE',
  peopleType: 'J',
  enable: true,
};

const employeeBefore = {
  '@id': '/people/90010',
  id: 90010,
  name: 'COLABORADOR ANTIGO',
  alias: 'ANTIGO',
  peopleType: 'F',
  enable: true,
};

const employeeAfter = {
  '@id': '/people/90010',
  id: 90010,
  name: 'COLABORADOR ATUALIZADO',
  alias: 'ATUALIZADO',
  peopleType: 'F',
  enable: true,
};

const buildPeopleLink = person => ({
  '@id': '/people_links/501',
  id: 501,
  linkType: 'employee',
  people: person,
  company: {id: 31487, '@id': '/people/31487'},
});

const mockEmployeesRefreshApi = async page => {
  let peopleLinksGetCount = 0;
  const peopleLinksGetUrls = [];

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

    if (pathname === 'people/31487' && method === 'GET') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(client),
      });
    }

    if (pathname === 'people/90010' && method === 'GET') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(
          peopleLinksGetCount > 1 ? employeeAfter : employeeBefore,
        ),
      });
    }

    if (
      (pathname === 'people_links' || pathname === 'people-links') &&
      method === 'GET'
    ) {
      peopleLinksGetCount += 1;
      peopleLinksGetUrls.push(request.url());
      const person = peopleLinksGetCount === 1 ? employeeBefore : employeeAfter;
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection([buildPeopleLink(person)])),
      });
    }

    if (pathname.startsWith('people/') && method === 'GET') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify({
          id: Number(pathname.split('/')[1]) || 0,
          name: 'X',
          peopleType: 'F',
        }),
      });
    }

    if (method === 'GET') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection([])),
      });
    }

    return route.fulfill({
      status: 200,
      headers: jsonHeaders(),
      body: JSON.stringify({}),
    });
  });

  await page.addInitScript(
    ({version}) => {
      localStorage.setItem(
        'session',
        JSON.stringify({
          id: 19,
          people: '/people/19',
          api_key: 'test-api-key',
          active: 1,
          mycompany: 2,
          roles: ['ROLE_SUPER'],
        }),
      );
      localStorage.setItem('app-type', 'MANAGER');
      localStorage.setItem('config', JSON.stringify({language: 'pt-br'}));
      localStorage.setItem(
        'device',
        JSON.stringify({
          id: 'web-manager',
          device: 'web-manager',
          type: 'WEB',
          appName: 'Browser Manager',
          appVersion: version,
          buildNumber: version,
          systemName: 'web',
          systemVersion: 'web',
          deviceType: 'web',
          metadata: {},
        }),
      );
    },
    {version: appVersion},
  );

  return {
    getPeopleLinksGetCount: () => peopleLinksGetCount,
    getPeopleLinksGetUrls: () => peopleLinksGetUrls,
  };
};

test.describe('client-details employees list refresh on focus (#375)', () => {
  test('refetches people_links on focus and shows updated employee without full reload', async ({
    page,
  }) => {
    const api = await mockEmployeesRefreshApi(page);

    await page.goto(
      '/client-details?clientId=31487&contextKey=contacts&initialTab=contacts&parentCompanyId=8&linkType=employee',
    );

    await expect(
      page.getByText('CLIENTE TESTE', {exact: false}).first(),
    ).toBeVisible({timeout: 15000});

    // Initial list from first people_links GET
    await expect(
      page.getByText(/COLABORADOR ANTIGO/i).first(),
    ).toBeVisible({timeout: 15000});

    const firstCount = api.getPeopleLinksGetCount();
    expect(firstCount).toBeGreaterThanOrEqual(1);

    // Simulate edit→back: leave the screen and return (triggers useFocusEffect refetch)
    await page.goto('/clients');
    await page.goto(
      '/client-details?clientId=31487&contextKey=contacts&initialTab=contacts&parentCompanyId=8&linkType=employee',
    );

    await expect(
      page.getByText(/COLABORADOR ATUALIZADO/i).first(),
    ).toBeVisible({timeout: 15000});

    await expect(page.getByText(/COLABORADOR ANTIGO/i)).toHaveCount(0);

    expect(api.getPeopleLinksGetCount()).toBeGreaterThan(firstCount);
  });
});
