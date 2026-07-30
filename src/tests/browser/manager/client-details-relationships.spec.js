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

const client = {
  '@id': '/people/29',
  id: 29,
  name: 'LAVE GO FRANQUIAS LTDA',
  alias: 'LAVE-GO',
  peopleType: 'J',
  enable: true,
};

const seller = {
  '@id': '/people/6',
  id: 6,
  name: 'VENDEDOR CORRETO',
  alias: 'VENDEDOR',
  peopleType: 'F',
};

const contact = {
  '@id': '/people/25',
  id: 25,
  name: 'CONTATO CORRETO',
  alias: 'CONTATO',
  peopleType: 'F',
};

const mockManagerApi = async page => {
  const relationshipQueries = [];

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
        body: JSON.stringify(client),
      });
    }

    if (pathname === 'people_links') {
      const query = Object.fromEntries(url.searchParams);
      relationshipQueries.push(query);

      const links = query.linkType === 'sellers-client'
        ? [
            {
              '@id': '/people_links/101',
              id: 101,
              company: seller,
              people: client,
              linkType: 'sellers-client',
            },
            {
              '@id': '/people_links/102',
              id: 102,
              company: seller,
              people: {...client, '@id': '/people/11', id: 11},
              linkType: 'sellers-client',
            },
          ]
        : [
            {
              '@id': '/people_links/201',
              id: 201,
              company: client,
              people: contact,
              linkType: 'employee',
            },
            {
              '@id': '/people_links/202',
              id: 202,
              company: {...client, '@id': '/people/31', id: 31},
              people: contact,
              linkType: 'employee',
            },
          ];

      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection(links)),
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

  return relationshipQueries;
};

test.describe('manager client relationship details', () => {
  test('scopes sellers and contacts with numeric people-link filters', async ({page}) => {
    const duplicateKeyWarnings = [];
    page.on('console', message => {
      if (message.text().includes('same key')) {
        duplicateKeyWarnings.push(message.text());
      }
    });

    const relationshipQueries = await mockManagerApi(page);

    await page.goto('/client-details?clientId=29&contextKey=client');

    await expect(
      page.getByText('LAVE GO FRANQUIAS LTDA', {exact: true}).first(),
    ).toBeVisible();

    await expect
      .poll(() => relationshipQueries.length)
      .toBeGreaterThanOrEqual(2);

    expect(relationshipQueries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          people: '29',
          linkType: 'sellers-client',
        }),
        expect.objectContaining({
          company: '29',
        }),
      ]),
    );
    expect(
      relationshipQueries.some(
        query =>
          String(query.people || '').startsWith('/people/') ||
          String(query.company || '').startsWith('/people/'),
      ),
    ).toBe(false);

    await expect(page.getByText('VENDEDOR CORRETO', {exact: true})).toHaveCount(1);
    await expect(page.getByText('CONTATO CORRETO', {exact: true})).toHaveCount(1);
    expect(duplicateKeyWarnings).toEqual([]);
  });
});
