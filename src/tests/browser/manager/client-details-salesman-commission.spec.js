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

const sellerDefault = {
  '@id': '/people/40',
  id: 40,
  name: 'VENDEDOR PADRAO',
  alias: 'PADRAO',
  peopleType: 'F',
};

const sellerOverride = {
  '@id': '/people/41',
  id: 41,
  name: 'VENDEDOR OVERRIDE',
  alias: 'OVERRIDE',
  peopleType: 'F',
};

const mockManagerApi = async (page, {roles = ['ROLE_SUPER']} = {}) => {
  await page.route(`${API_ORIGIN}/**`, async route => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname.replace(/^\/+/, '');

    if (request.method() === 'OPTIONS') {
      return route.fulfill({status: 204, headers: CORS_HEADERS, body: ''});
    }

    if (pathname === 'people/29' || pathname === 'people/29/') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(client),
      });
    }

    if (pathname === 'people' || pathname.startsWith('people?')) {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection([client])),
      });
    }

    if (pathname === 'people_links' || pathname.startsWith('people_links')) {
      const query = Object.fromEntries(url.searchParams);
      if (query.linkType === 'sellers-client') {
        return route.fulfill({
          status: 200,
          headers: jsonHeaders(),
          body: JSON.stringify(
            collection([
              {
                '@id': '/people_links/501',
                id: 501,
                company: sellerDefault,
                people: client,
                linkType: 'sellers-client',
                comission: null,
                minimum_comission: null,
              },
              {
                '@id': '/people_links/502',
                id: 502,
                company: sellerOverride,
                people: client,
                linkType: 'sellers-client',
                comission: 15,
                minimum_comission: 5,
              },
            ]),
          ),
        });
      }
      if (query.linkType === 'salesman') {
        return route.fulfill({
          status: 200,
          headers: jsonHeaders(),
          body: JSON.stringify(
            collection([
              {
                '@id': '/people_links/601',
                id: 601,
                company: company,
                people: sellerDefault,
                linkType: 'salesman',
                comission: 10,
                minimum_comission: 2,
              },
              {
                '@id': '/people_links/602',
                id: 602,
                company: company,
                people: sellerOverride,
                linkType: 'salesman',
                comission: 10,
                minimum_comission: 2,
              },
            ]),
          ),
        });
      }
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection([])),
      });
    }

    if (pathname.startsWith('people_links/') && request.method() === 'PUT') {
      const body = request.postDataJSON?.() || {};
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify({
          '@id': `/people_links/${pathname.split('/').pop()}`,
          id: Number(pathname.split('/').pop()),
          ...body,
        }),
      });
    }

    if (pathname.includes('people_media') || pathname.includes('people-media')) {
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
    ({version, roles}) => {
      localStorage.setItem(
        'session',
        JSON.stringify({
          id: 19,
          people: '/people/19',
          api_key: 'test-api-key',
          active: 1,
          mycompany: 2,
          roles,
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
    {version: appVersion, roles},
  );
};

test.describe('manager client salesman commission', () => {
  test('shows default and override commissions; edit for ROLE_SUPER', async ({page}) => {
    await mockManagerApi(page, {roles: ['ROLE_SUPER']});
    await page.goto('/client-details?clientId=29&contextKey=client&initialTab=sellers');

    await expect(page.getByTestId('salesman-commission-501')).toBeVisible({timeout: 15000});
    await expect(page.getByTestId('salesman-commission-label-501')).toContainText('padrão');
    await expect(page.getByTestId('salesman-commission-label-502')).toContainText('override');
    await expect(page.getByTestId('salesman-commission-edit-btn-502')).toBeVisible();
  });

  test('hides edit control for non-owner/non-super roles', async ({page}) => {
    await mockManagerApi(page, {roles: ['ROLE_EMPLOYEE']});
    await page.goto('/client-details?clientId=29&contextKey=client&initialTab=sellers');

    await expect(page.getByTestId('salesman-commission-502')).toBeVisible({timeout: 15000});
    await expect(page.getByTestId('salesman-commission-edit-btn-502')).toHaveCount(0);
  });
});
