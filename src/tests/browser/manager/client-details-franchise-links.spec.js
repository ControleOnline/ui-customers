const {expect, test} = require('playwright/test');
const {API_ORIGIN} = require('../../../../../../../src/tests/browser/apiOrigin');
const {version: appVersion} = require('../../../../../../../package.json');

/**
 * Browser smoke — client-details aba Franquia/Filial (PJ → PJ).
 * Cobre critérios de aceite de app-community#453 / task-453:
 * - abrir client-details de PJ no MANAGER → aba Franquia/Filial
 * - listagem de vínculos franchisee/filial
 * - botão + (vincular) e ações de edição/remoção (MANAGER)
 * - PF não entra na listagem
 * - console/pageerror limpo
 */

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

const collection = member => ({
  member,
  'hydra:member': member,
  totalItems: member.length,
  'hydra:totalItems': member.length,
});

const themeColors = {
  primary: '#1C8FBD',
  secondary: '#0169D9',
  background: '#F3F7FB',
  text: '#0F172A',
  textSecondary: '#6C7787',
  border: '#D7E1EC',
  headerBackground: '#F3F7FB',
  headerBorder: '#D7E1EC',
  headerText: '#0F172A',
  cardBackground: '#FFFFFF',
  cardBorder: '#D7E1EC',
  cardText: '#0F172A',
  cardIcon: '#1C8FBD',
  cardShadow: '#1C8FBD',
  listItemBackground: '#F1F8FB',
  listItemText: '#0F172A',
  listItemSubtitleText: '#6C7787',
  loadingSpinner: '#1C8FBD',
  buttonBackground: '#1C8FBD',
  buttonBorder: '#1C8FBD',
  buttonIcon: '#FFFFFF',
  buttonText: '#FFFFFF',
  buttonShadow: '#1C8FBD',
  buttonBackgroundSecondary: '#FFFFFF',
  buttonBorderSecondary: '#D7E1EC',
  buttonIconSecondary: '#0169D9',
  buttonTextSecondary: '#0169D9',
  buttonDisabledBackground: '#CBD5E1',
  tabBarBackground: '#FFFFFF',
  tabBarBorder: '#D7E1EC',
  menuSelectedBorder: '#1C8FBD',
  menuSelectedText: '#1C8FBD',
  pageBackground: '#F3F7FB',
  modalOverlay: 'rgba(15,23,42,0.45)',
  modalBackground: '#FFFFFF',
  modalText: '#0F172A',
  modalShadow: '#1C8FBD',
  inputBackground: '#FFFFFF',
  inputBorder: '#D7E1EC',
};

const themeCss = `:root { ${Object.entries(themeColors)
  .map(([key, value]) => `--${key}: ${value};`)
  .join(' ')} }`;

const company = {
  '@id': '/people/2',
  id: 2,
  name: 'CONTROLE ONLINE',
  alias: 'CONTROLE ONLINE',
  panel_enabled: true,
  enabled: true,
  commercial_enabled: true,
  theme: {colors: themeColors},
  configs: {},
};

const clientPj = {
  '@id': '/people/29',
  id: 29,
  name: 'LAVE GO FRANQUIAS LTDA',
  alias: 'LAVE-GO',
  peopleType: 'J',
  enable: true,
};

const franchiseePj = {
  '@id': '/people/40',
  id: 40,
  name: 'FRANQUIA SUL LTDA',
  alias: 'FRANQUIA-SUL',
  peopleType: 'J',
  enable: true,
};

const filialPj = {
  '@id': '/people/41',
  id: 41,
  name: 'FILIAL NORTE LTDA',
  alias: 'FILIAL-NORTE',
  peopleType: 'J',
  enable: true,
};

const pfPerson = {
  '@id': '/people/25',
  id: 25,
  name: 'PESSOA FISICA TESTE',
  alias: 'PF-TESTE',
  peopleType: 'F',
  enable: true,
};

const franchiseLink = {
  '@id': '/people_links/501',
  id: 501,
  company: clientPj,
  people: franchiseePj,
  linkType: 'franchisee',
  enable: true,
};

const filialLink = {
  '@id': '/people_links/502',
  id: 502,
  company: clientPj,
  people: filialPj,
  linkType: 'filial',
  enable: true,
};

const pfLinkShouldBeFiltered = {
  '@id': '/people_links/503',
  id: 503,
  company: clientPj,
  people: pfPerson,
  linkType: 'franchisee',
  enable: true,
};

const mockManagerApi = async page => {
  const peopleLinkQueries = [];
  const pageErrors = [];

  page.on('pageerror', err => {
    pageErrors.push(String(err?.message || err));
  });

  await page.route(`${API_ORIGIN}/**`, async route => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname.replace(/^\/+/, '');

    if (request.method().toUpperCase() === 'OPTIONS') {
      return route.fulfill({status: 204, headers: CORS_HEADERS, body: ''});
    }

    if (pathname === 'themes-colors.css') {
      return route.fulfill({
        status: 200,
        headers: textHeaders(),
        body: themeCss,
      });
    }

    if (pathname === 'runtime/ip') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify({ip: '127.0.0.1'}),
      });
    }

    if (pathname === 'people/companies/my') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection([company])),
      });
    }

    if (pathname === 'people/company/default') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(company),
      });
    }

    if (pathname === 'people/29') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(clientPj),
      });
    }

    if (pathname === 'people' || pathname.startsWith('people?')) {
      // candidates for picker (PJ only)
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection([franchiseePj, filialPj, pfPerson])),
      });
    }

    if (pathname === 'people_links' || pathname.startsWith('people_links')) {
      const query = Object.fromEntries(url.searchParams);
      peopleLinkQueries.push(query);

      if (request.method().toUpperCase() === 'POST') {
        return route.fulfill({
          status: 201,
          headers: jsonHeaders(),
          body: JSON.stringify({
            ...franchiseLink,
            id: 599,
            '@id': '/people_links/599',
          }),
        });
      }

      if (request.method().toUpperCase() === 'PUT' || request.method().toUpperCase() === 'PATCH') {
        return route.fulfill({
          status: 200,
          headers: jsonHeaders(),
          body: JSON.stringify(franchiseLink),
        });
      }

      if (request.method().toUpperCase() === 'DELETE') {
        return route.fulfill({
          status: 204,
          headers: CORS_HEADERS,
          body: '',
        });
      }

      // GET list — include PF link to assert helper filters it out
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(
          collection([franchiseLink, filialLink, pfLinkShouldBeFiltered]),
        ),
      });
    }

    return route.fulfill({
      status: 200,
      headers: jsonHeaders(),
      body: JSON.stringify(collection([])),
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

  return {peopleLinkQueries, pageErrors};
};

test.describe('manager client-details franchise/filial links', () => {
  test('lists PJ franchisee/filial links and exposes MANAGER CRUD controls', async ({
    page,
  }) => {
    const {peopleLinkQueries, pageErrors} = await mockManagerApi(page);

    await page.goto('/client-details?clientId=29&contextKey=client');

    await expect(
      page.getByText('LAVE GO FRANQUIAS LTDA', {exact: true}).first(),
    ).toBeVisible({timeout: 15000});

    // Open Franquia/Filial tab
    const franchiseTab = page.getByText(/Franquia\/Filial|Franquia/i).first();
    await expect(franchiseTab).toBeVisible({timeout: 10000});
    await franchiseTab.click();

    // Listagem: PJ franchisee + filial; PF filtrado
    await expect(page.getByText('FRANQUIA SUL LTDA', {exact: true})).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText('FILIAL NORTE LTDA', {exact: true})).toBeVisible();
    await expect(page.getByText('PESSOA FISICA TESTE', {exact: true})).toHaveCount(0);

    // MANAGER: botão vincular + ações de edição/remoção
    await expect(page.getByTestId('franchise-links-add-btn')).toBeVisible();
    await expect(page.getByTestId('franchise-links-edit-501')).toBeVisible();
    await expect(page.getByTestId('franchise-links-delete-501')).toBeVisible();
    await expect(page.getByTestId('franchise-link-row-501')).toBeVisible();
    await expect(page.getByTestId('franchise-link-row-502')).toBeVisible();

    // Abrir modal de vincular
    await page.getByTestId('franchise-links-add-btn').click();
    await expect(page.getByTestId('franchise-link-people-picker')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.getByTestId('franchise-link-type-picker')).toBeVisible();
    await expect(page.getByTestId('franchise-link-save-btn')).toBeVisible();

    // people_links foi consultado com company do cliente
    await expect.poll(() => peopleLinkQueries.length).toBeGreaterThanOrEqual(1);
    expect(
      peopleLinkQueries.some(
        q => String(q.company || '') === '29' || String(q.company || '').includes('29'),
      ),
    ).toBe(true);

    expect(pageErrors).toEqual([]);
  });
});
