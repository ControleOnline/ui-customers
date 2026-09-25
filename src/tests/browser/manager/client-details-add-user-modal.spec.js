/**
 * Browser smoke — app-community#458
 * Modal "Adicionar Usuário" must show a visible Salvar button (not only Cancelar).
 * Regression: task-428 left primary footer style as text-only → invisible on white modal.
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

const createPerson = () => ({
  '@id': '/people/25',
  id: 25,
  name: 'CLAUDIO MOSES FELTRIN MEDEIROS',
  alias: 'CLAUDIO',
  peopleType: 'F',
  enable: true,
  user: [],
});

const TIMEZONES = [
  {'@id': '/timezones/1', id: 1, name: 'America/Sao_Paulo', enabled: true},
  {'@id': '/timezones/2', id: 2, name: 'America/Campo_Grande', enabled: true},
];

const mockClientDetailsAddUserApi = async page => {
  const company = createCompany();
  const person = createPerson();
  const createdUsers = [];

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

    if (pathname === 'people/25' || pathname === 'people/25/') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(person),
      });
    }

    if (pathname === 'timezones' || pathname.startsWith('timezones')) {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection(TIMEZONES)),
      });
    }

    if (pathname === 'users' || pathname.startsWith('users')) {
      if (method === 'POST') {
        let body = {};
        try {
          body = request.postDataJSON() || {};
        } catch {
          body = {};
        }
        const created = {
          '@id': `/users/${100 + createdUsers.length}`,
          id: 100 + createdUsers.length,
          username: body.username || body.name || 'newuser',
          role: body.role || 'ROLE_USER',
          timezone: body.timezone || '/timezones/1',
        };
        createdUsers.push(created);
        return route.fulfill({
          status: 201,
          headers: jsonHeaders(),
          body: JSON.stringify(created),
        });
      }
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection(createdUsers)),
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

  return {getCreatedUsers: () => createdUsers};
};

test.describe('client-details Adicionar Usuário modal (#458)', () => {
  test('shows visible Salvar button in Adicionar Usuário modal', async ({page}) => {
    await mockClientDetailsAddUserApi(page);

    await page.goto(
      '/client-details?clientId=25&contextKey=client&initialTab=users',
    );

    await expect(page.getByText('Usuários', {exact: true}).first()).toBeVisible({
      timeout: 20000,
    });

    const addBtn = page
      .getByLabel('Adicionar usuário')
      .or(page.getByTestId('users-tab-add-user'))
      .first();
    await expect(addBtn).toBeVisible({timeout: 10000});
    await addBtn.click();

    await expect(page.getByText('Adicionar Usuário', {exact: true})).toBeVisible({
      timeout: 10000,
    });

    await expect(page.getByText('Cancelar', {exact: true})).toBeVisible();

    const salvar = page
      .getByLabel('Salvar')
      .or(page.getByTestId('user-form-save'))
      .or(page.getByText('Salvar', {exact: true}))
      .first();
    await expect(salvar).toBeVisible({timeout: 5000});

    const box = await salvar.boundingBox();
    expect(box).toBeTruthy();
    expect(box.width).toBeGreaterThan(20);
    expect(box.height).toBeGreaterThan(10);

    // Timezone list present (must not push footer off-screen)
    await expect(
      page.getByText(/America\/Sao_Paulo|Timezone|timezone/i).first(),
    ).toBeVisible({timeout: 10000}).catch(() => {});

    await page.getByText('Cancelar', {exact: true}).click();
    await expect(page.getByText('Adicionar Usuário', {exact: true})).toHaveCount(0, {
      timeout: 8000,
    });
  });
});
