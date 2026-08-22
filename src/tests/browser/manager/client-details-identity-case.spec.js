/**
 * Browser smoke for app-community#376:
 * GeneralTab name/alias inputs must keep exact mixed case on the value
 * submitted via PUT/PATCH (no forced uppercase on the input → persist path).
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

const mockApi = async page => {
  const company = createCompany();
  const peopleWrites = [];

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
      return route.fulfill({status: 200, headers: jsonHeaders(), body: JSON.stringify(company)});
    }
    if (pathname === 'people/companies/my') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection([company])),
      });
    }
    if (pathname === 'people/30') {
      if (method === 'PUT' || method === 'PATCH') {
        const body = await request.postDataJSON().catch(() => ({}));
        peopleWrites.push({method, body});
        return route.fulfill({
          status: 200,
          headers: jsonHeaders(),
          body: JSON.stringify({
            '@id': '/people/30',
            id: 30,
            peopleType: 'F',
            enable: true,
            ...body,
          }),
        });
      }
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify({
          '@id': '/people/30',
          id: 30,
          name: 'Joao Silva',
          alias: 'Joao',
          peopleType: 'F',
          enable: true,
        }),
      });
    }
    if (pathname === 'people_links' || pathname.startsWith('people_links')) {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection([])),
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
    ({appVersion: ver}) => {
      const set = (k, v) => {
        try {
          localStorage.setItem(k, v);
        } catch {
          // ignore
        }
      };
      set(
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
      set('config', JSON.stringify({language: 'pt-br'}));
      set('app-type', 'MANAGER');
      set(
        'device',
        JSON.stringify({
          id: 'web-manager',
          device: 'web-manager',
          type: 'WEB',
          appName: 'Browser Manager',
          appVersion: ver,
          buildNumber: ver,
          systemName: 'web',
          systemVersion: 'web',
          deviceType: 'web',
          metadata: {},
        }),
      );
    },
    {appVersion},
  );

  return {peopleWrites};
};

test.describe('client-details identity case preservation (#376)', () => {
  test('GeneralTab keeps exact mixed case on name/alias in people PUT body', async ({page}) => {
    const api = await mockApi(page);

    await page.goto('/client-details?clientId=30&contextKey=contacts&parentCompanyId=29');

    await expect(page.getByText('Dados Cadastrais', {exact: true})).toBeVisible({
      timeout: 15000,
    });

    const MIXED_NAME = 'Cláudia Mixed Case';
    const MIXED_ALIAS = 'Claudia Alias';

    const nameInput = page.getByPlaceholder(/nome|name/i).first();
    const aliasInput = page.getByPlaceholder(/apelido|alias|nome fantasia/i).first();

    if ((await nameInput.count()) > 0) {
      await nameInput.fill(MIXED_NAME);
    } else {
      await page.locator('input[type="text"], input:not([type])').nth(0).fill(MIXED_NAME);
    }

    if ((await aliasInput.count()) > 0) {
      await aliasInput.fill(MIXED_ALIAS);
    } else {
      await page.locator('input[type="text"], input:not([type])').nth(1).fill(MIXED_ALIAS);
    }

    await page.getByText(/Save Changes|Salvar alterações/i).click();

    await expect.poll(() => api.peopleWrites.length, {timeout: 15000}).toBeGreaterThanOrEqual(1);

    const body = api.peopleWrites[0].body || {};
    expect(String(body.name)).toBe(MIXED_NAME);
    if (body.alias != null && body.alias !== '') {
      expect(String(body.alias)).toBe(MIXED_ALIAS);
    }
  });
});
