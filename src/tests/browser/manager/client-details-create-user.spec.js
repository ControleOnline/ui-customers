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

/**
 * Browser smoke for ControleOnline/app-community#369:
 * create user on Client Details with contextKey=employee without
 * HTTP 500 "Authentication required".
 */
const mockClientDetailsCreateUserApi = async page => {
  const company = createCompany();
  const createdUsers = [];
  const postUsersRequests = [];

  const employee = {
    '@id': '/people/106218',
    id: 106218,
    name: 'Funcionario Teste',
    alias: 'FUNC TESTE',
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

    if (pathname === 'people/106218') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify({
          ...employee,
          user: createdUsers.map(u => ({
            '@id': `/users/${u.id}`,
            id: u.id,
            username: u.username,
            apiKey: u.apiKey || '',
          })),
        }),
      });
    }

    // POST /users — must receive API-TOKEN (auth) and not return 500
    if (pathname === 'users' && method === 'POST') {
      const headers = request.headers();
      const apiToken =
        headers['api-token'] || headers['API-TOKEN'] || headers['api_token'] || '';
      let body = {};
      try {
        body = request.postDataJSON() || {};
      } catch {
        body = {};
      }

      postUsersRequests.push({
        apiToken,
        body,
        method,
        pathname,
      });

      // Simulate the fixed backend: ROLE_HUMAN + valid token → 201
      if (!apiToken) {
        return route.fulfill({
          status: 401,
          headers: jsonHeaders(),
          body: JSON.stringify({message: 'Authentication required'}),
        });
      }

      const newUser = {
        '@id': `/users/${9000 + createdUsers.length}`,
        id: 9000 + createdUsers.length,
        username: body.username || 'new-user',
        apiKey: 'ak-test-' + Date.now(),
        people: body.people || '/people/106218',
      };
      createdUsers.push(newUser);

      return route.fulfill({
        status: 201,
        headers: jsonHeaders(),
        body: JSON.stringify(newUser),
      });
    }

    if (pathname === 'users' || pathname.startsWith('users/')) {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection(createdUsers)),
      });
    }

    if (pathname === 'people_links') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection([])),
      });
    }

    if (pathname.startsWith('statuses') || pathname.startsWith('categories')) {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection([])),
      });
    }

    // Default empty collection for other GETs
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
          token: 'test-api-key',
          active: 1,
          mycompany: 3,
          roles: ['ROLE_SUPER', 'ROLE_HUMAN'],
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

  return {
    getPostUsersRequests: () => postUsersRequests,
    getCreatedUsers: () => createdUsers,
  };
};

test.describe('client details create user browser smoke (#369)', () => {
  test('creates user on contextKey=employee without Authentication required 500', async ({
    page,
  }) => {
    const api = await mockClientDetailsCreateUserApi(page);

    await page.goto(
      '/client-details?clientId=106218&contextKey=employee&initialTab=users',
    );

    // Page / tab shell should load
    await expect(
      page.getByText(/Dados Cadastrais|Usuários|Users|Geral/i).first(),
    ).toBeVisible({timeout: 15000});

    // Open create-user modal (Users tab with isEditing=true always in details)
    const addUserTrigger = page
      .getByText(/Adicionar Usuário|Adicionar|Add user|Novo usuário/i)
      .first();
    await expect(addUserTrigger).toBeVisible({timeout: 15000});
    await addUserTrigger.click();

    await expect(page.getByText(/Adicionar Usuário/i)).toBeVisible({
      timeout: 10000,
    });

    // Fill form — username + password + confirm
    const usernameInput = page.locator('input').first();
    await usernameInput.fill('employee.user.369');

    const passwordInputs = page.locator('input[type="password"], input');
    // Prefer password-type fields; fall back to remaining inputs
    const count = await passwordInputs.count();
    if (count >= 3) {
      await passwordInputs.nth(1).fill('Secret123!');
      await passwordInputs.nth(2).fill('Secret123!');
    } else {
      // Modal fields: username already filled; next two are password/confirm
      const allInputs = page.locator('input');
      const inputCount = await allInputs.count();
      if (inputCount >= 3) {
        await allInputs.nth(1).fill('Secret123!');
        await allInputs.nth(2).fill('Secret123!');
      }
    }

    // Save
    await page.getByText(/^Salvar$/i).click();

    // Success path: no 500 Authentication required; user appears or success toast
    await expect(
      page.getByText(/Usuário criado com sucesso|employee\.user\.369|sucesso/i),
    ).toBeVisible({timeout: 15000});

    const posts = api.getPostUsersRequests();
    expect(posts.length).toBeGreaterThanOrEqual(1);

    const lastPost = posts[posts.length - 1];
    // Auth header must be present (session api_key injected by ui-common)
    expect(String(lastPost.apiToken || '').length).toBeGreaterThan(0);
    // people IRI must be sent
    expect(String(lastPost.body?.people || '')).toMatch(/people\/106218/);
    expect(lastPost.body?.username).toBe('employee.user.369');

    // Created user should be in mock store / list
    const created = api.getCreatedUsers();
    expect(created.some(u => u.username === 'employee.user.369')).toBeTruthy();
  });
});
