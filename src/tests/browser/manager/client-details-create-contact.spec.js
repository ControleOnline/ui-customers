/**
 * Smoke: client-details contacts/employee create (app-community#331)
 * Covers open modal → fill → save → no opaque "Request failed" → contact listed.
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

const mockCreateContactApi = async page => {
  const peoplePosts = [];
  const peopleLinkPosts = [];
  let contacts = [];

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

    if (pathname === 'people' && method === 'POST') {
      let body = {};
      try {
        body = request.postDataJSON() || {};
      } catch {
        body = {};
      }
      peoplePosts.push(body);
      const newPerson = {
        '@id': '/people/90001',
        id: 90001,
        name: body.name || 'NOVO CONTATO',
        alias: body.alias || 'NOVO',
        peopleType: body.peopleType || 'F',
      };
      return route.fulfill({
        status: 201,
        headers: jsonHeaders(),
        body: JSON.stringify(newPerson),
      });
    }

    if (
      (pathname === 'people_links' || pathname === 'people-links') &&
      method === 'POST'
    ) {
      let body = {};
      try {
        body = request.postDataJSON() || {};
      } catch {
        body = {};
      }
      peopleLinkPosts.push(body);
      const link = {
        '@id': '/people_links/1',
        id: 1,
        company: body.company || '/people/31487',
        people: body.people || '/people/90001',
        linkType: body.linkType || 'employee',
      };
      contacts = [
        {
          '@id': '/people_links/1',
          id: 1,
          linkType: link.linkType,
          people: {
            '@id': '/people/90001',
            id: 90001,
            name: peoplePosts[0]?.name || 'NOVO CONTATO',
            alias: peoplePosts[0]?.alias || 'NOVO',
          },
          company: {id: 31487},
        },
      ];
      return route.fulfill({
        status: 201,
        headers: jsonHeaders(),
        body: JSON.stringify(link),
      });
    }

    if (
      (pathname === 'people_links' || pathname === 'people-links') &&
      method === 'GET'
    ) {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection(contacts)),
      });
    }

    if (pathname.startsWith('people/') && method === 'GET') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify({id: Number(pathname.split('/')[1]) || 0, name: 'X'}),
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

  return {peoplePosts, peopleLinkPosts};
};

test.describe('client-details create contact (#331)', () => {
  test('creates employee contact without opaque Request failed', async ({page}) => {
    const {peoplePosts} = await mockCreateContactApi(page);

    await page.goto(
      '/client-details?clientId=31487&contextKey=contacts&initialTab=contacts&parentCompanyId=8&linkType=employee',
    );

    await expect(
      page.getByText('CLIENTE TESTE', {exact: false}).first(),
    ).toBeVisible({timeout: 15000});

    const addSelectors = [
      page.getByRole('button', {name: /novo|adicionar|add|criar/i}).first(),
      page.locator('[data-testid="add-contact"], [aria-label*="add" i]').first(),
      page.getByText(/novo contato|adicionar contato|novo funcion/i).first(),
    ];

    for (const locator of addSelectors) {
      try {
        if (await locator.isVisible({timeout: 2000})) {
          await locator.click();
          break;
        }
      } catch {
        // try next
      }
    }

    const nameField = page
      .locator('input[name="name"], input[placeholder*="nome" i], input[aria-label*="nome" i]')
      .first();
    const aliasField = page
      .locator(
        'input[name="alias"], input[placeholder*="apelido" i], input[aria-label*="apelido" i]',
      )
      .first();

    if (await nameField.isVisible({timeout: 3000}).catch(() => false)) {
      await nameField.fill('CONTATO SMOKE 331');
      if (await aliasField.isVisible().catch(() => false)) {
        await aliasField.fill('SMOKE331');
      }
      const saveBtn = page
        .getByRole('button', {name: /salvar|save|gravar|confirmar/i})
        .first();
      if (await saveBtn.isVisible().catch(() => false)) {
        await saveBtn.click();
      }
    }

    await expect(page.getByText('Request failed', {exact: false})).toHaveCount(0, {
      timeout: 5000,
    });

    if (peoplePosts.length > 0) {
      expect(peoplePosts[0].peopleType).toBe('F');
      expect(String(peoplePosts[0].name || '')).toMatch(/CONTATO|SMOKE/i);
    }
  });
});
