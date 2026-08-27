/**
 * Browser smoke — client-details Contatos: remover colaborador.
 * fluxo: outros
 * flowchartIds: [1]
 * app-community#624
 *
 * Steps:
 * 1. Open Client Details contacts tab
 * 2. Active employee is listed; disabled link is hidden
 * 3. Trash → confirmation dialog
 * 4. Confirm → DELETE /people/{id} → row disappears without F5
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
  theme: {colors: {primary: '#0EA5E9', secondary: '#F97316'}},
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

const employeeActive = {
  '@id': '/people/90010',
  id: 90010,
  name: 'COLABORADOR ATIVO',
  alias: 'ATIVO',
  peopleType: 'F',
  enable: true,
};

const employeeDisabled = {
  '@id': '/people/90011',
  id: 90011,
  name: 'COLABORADOR INATIVO',
  alias: 'INATIVO',
  peopleType: 'F',
  enable: true,
};

const mockUnlinkApi = async page => {
  const deletedPeople = new Set();

  await page.route(`${API_ORIGIN}/**`, async route => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname.replace(/^\/+/, '');
    const method = request.method().toUpperCase();

    if (method === 'OPTIONS') {
      return route.fulfill({status: 204, headers: CORS_HEADERS, body: ''});
    }

    if (pathname === 'people/company/default') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(company),
      });
    }

    if (pathname === 'people/31487' && method === 'GET') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(client),
      });
    }

    if (pathname === 'people/90010' && method === 'DELETE') {
      deletedPeople.add(90010);
      return route.fulfill({status: 204, headers: CORS_HEADERS, body: ''});
    }

    if (
      (pathname === 'people_links' || pathname === 'people-links') &&
      method === 'GET'
    ) {
      const links = [
        {
          '@id': '/people_links/501',
          id: 501,
          enable: 1,
          linkType: 'employee',
          people: employeeActive,
          company: client,
        },
        {
          '@id': '/people_links/502',
          id: 502,
          enable: 0,
          linkType: 'employee',
          people: employeeDisabled,
          company: client,
        },
      ].filter(link => !deletedPeople.has(Number(link.people.id)));

      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection(links)),
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
};

test.describe('client-details employee unlink (#624)', () => {
  test('hides inactive links and removes employee after confirmation', async ({
    page,
  }) => {
    await mockUnlinkApi(page);
    await page.goto(
      '/client-details?clientId=31487&contextKey=client&initialTab=contacts',
    );

    await expect(page.getByText(/COLABORADOR ATIVO/i).first()).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText(/COLABORADOR INATIVO/i)).toHaveCount(0);

    await expect(page.getByTestId('employee-unlink-501')).toBeVisible();
    await page.getByTestId('employee-unlink-501').click();
    await expect(
      page.getByText(/marcado como removido e o vínculo/i),
    ).toBeVisible({timeout: 10000});
    await page.getByText('Remover', {exact: true}).last().click();

    await expect(page.getByTestId('employee-unlink-501')).toHaveCount(0, {
      timeout: 10000,
    });
    await expect(page.getByText(/COLABORADOR ATIVO/i)).toHaveCount(0);
  });
});
