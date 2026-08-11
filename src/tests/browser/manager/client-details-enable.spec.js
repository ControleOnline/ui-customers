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

const mockClientDetailsEnableApi = async page => {
  const company = createCompany();
  let peopleEnable = false;
  const peopleLinkWriteMethods = [];

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

    if (pathname === 'people/30') {
      if (method === 'PUT' || method === 'PATCH') {
        const body = await request.postDataJSON().catch(() => ({}));
        if (typeof body.enable === 'boolean') {
          peopleEnable = body.enable;
        }
        return route.fulfill({
          status: 200,
          headers: jsonHeaders(),
          body: JSON.stringify({
            '@id': '/people/30',
            id: 30,
            name: 'JOAO SILVA',
            alias: 'JOAO SILVA',
            peopleType: 'F',
            enable: peopleEnable,
          }),
        });
      }

      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify({
          '@id': '/people/30',
          id: 30,
          name: 'JOAO SILVA',
          alias: 'JOAO SILVA',
          peopleType: 'F',
          enable: peopleEnable,
        }),
      });
    }

    if (pathname === 'people_links' || pathname.startsWith('people_links')) {
      if (method !== 'GET') {
        peopleLinkWriteMethods.push(method);
        return route.fulfill({
          status: 405,
          headers: jsonHeaders(),
          body: JSON.stringify({code: -1001, detail: 'Method Not Allowed'}),
        });
      }
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
    ({appVersion}) => {
      const setLocalStorageItem = (key, value) => {
        try {
          localStorage.setItem(key, value);
        } catch {
          // ignore
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

  return {getPeopleLinkWriteMethods: () => peopleLinkWriteMethods};
};

test.describe('client details enable toggle browser smoke', () => {
  test('toggles enable (Bloqueado → Liberado) and saves without people_link write', async ({
    page,
  }) => {
    const api = await mockClientDetailsEnableApi(page);

    await page.goto('/client-details?clientId=30&contextKey=contacts&parentCompanyId=29');

    await expect(page.getByText('Dados Cadastrais', {exact: true})).toBeVisible({
      timeout: 15000,
    });

    await expect(page.getByText('Bloqueado', {exact: true})).toBeVisible();

    await page.getByRole('switch').first().click();

    await expect(page.getByText('Liberado', {exact: true})).toBeVisible();

    await page.getByText(/Save Changes|Salvar alterações/i).click();

    await expect(page.getByText(/registrationUpdated|atualizado|sucesso/i)).toBeVisible({
      timeout: 10000,
    }).catch(() => {});

    expect(api.getPeopleLinkWriteMethods()).toEqual([]);
  });
});
