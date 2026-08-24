/**
 * Browser smoke: client-details franchise commission (ui-customers#10).
 * Covers:
 * 1) superadmin sees editable pencil and can save comission/minimum_comission
 * 2) non-owner non-super sees read-only (no pencil)
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

const createCompany = ({ownerEnabled = true} = {}) => ({
  id: 3,
  name: 'Franqueadora',
  alias: 'FRANQUEADORA',
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
  user: {
    id: 7,
    name: 'Admin',
    owner_enabled: ownerEnabled,
  },
});

const franchiseePerson = {
  '@id': '/people/42',
  id: 42,
  name: 'FRANQUIA SUL',
  alias: 'FRANQUIA SUL',
  peopleType: 'J',
  enable: true,
};

const franchiseeLink = {
  '@id': '/people_links/99',
  id: 99,
  linkType: 'franchisee',
  people: {'@id': '/people/42', id: 42},
  company: {'@id': '/people/3', id: 3},
  comission: 10,
  minimum_comission: 2000,
};

const mockFranchiseCommissionApi = async (
  page,
  {roles = ['ROLE_SUPER'], ownerEnabled = true} = {},
) => {
  const company = createCompany({ownerEnabled});
  let currentLink = {...franchiseeLink};
  const putBodies = [];
  const peopleLinkGetUrls = [];

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

    if (pathname === 'people/42') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(franchiseePerson),
      });
    }

    if (pathname === 'people_links' || pathname.startsWith('people_links/')) {
      if (method === 'GET') {
        peopleLinkGetUrls.push(url.toString());
        const linkTypes = [
          ...url.searchParams.getAll('linkType[]'),
          ...url.searchParams.getAll('linkType[0]'),
        ];
        if (url.searchParams.has('linkType')) {
          return route.fulfill({
            status: 400,
            headers: jsonHeaders(),
            body: JSON.stringify({
              detail: 'Unexpected value for parameter "linkType": expecting "array", got "string".',
            }),
          });
        }
        const people = url.searchParams.get('people') || '';
        if (linkTypes.includes('franchisee') || people === '42') {
          return route.fulfill({
            status: 200,
            headers: jsonHeaders(),
            body: JSON.stringify(collection([currentLink])),
          });
        }
        return route.fulfill({
          status: 200,
          headers: jsonHeaders(),
          body: JSON.stringify(collection([])),
        });
      }

      if (method === 'PUT' || method === 'PATCH') {
        const body = await request.postDataJSON().catch(() => ({}));
        putBodies.push(body);
        if (typeof body.comission === 'number') {
          currentLink = {...currentLink, comission: body.comission};
        }
        if (typeof body.minimum_comission === 'number') {
          currentLink = {
            ...currentLink,
            minimum_comission: body.minimum_comission,
          };
        }
        return route.fulfill({
          status: 200,
          headers: jsonHeaders(),
          body: JSON.stringify(currentLink),
        });
      }

      return route.fulfill({
        status: 405,
        headers: jsonHeaders(),
        body: JSON.stringify({detail: 'Method Not Allowed'}),
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
    ({appVersion, roles, ownerEnabled}) => {
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
          roles,
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
      // seed current company with owner flag for store bootstrap if needed
      setLocalStorageItem(
        'currentCompany',
        JSON.stringify({
          id: 3,
          alias: 'FRANQUEADORA',
          user: {id: 7, owner_enabled: ownerEnabled},
        }),
      );
    },
    {appVersion, roles, ownerEnabled},
  );

  return {
    getPutBodies: () => putBodies,
    getPeopleLinkGetUrls: () => peopleLinkGetUrls,
  };
};

test.describe('client-details franchise commission browser smoke', () => {
  test('superadmin can edit franchise commission and persist', async ({page}) => {
    const api = await mockFranchiseCommissionApi(page, {
      roles: ['ROLE_SUPER'],
      ownerEnabled: false,
    });

    await page.goto('/client-details?clientId=42&contextKey=client');
    await expect(page.getByText(/Comissão da franquia|franchiseCommission/i)).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText(/10%/)).toBeVisible();
    await expect(page.getByText(/2000/)).toBeVisible();
    expect(api.getPeopleLinkGetUrls()).toEqual(
      expect.arrayContaining([expect.stringMatching(/linkType(%5B%5D|%5B0%5D)=franchisee/)]),
    );

    const editBtn = page.getByTestId('edit-franchise-commission');
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    await page.getByTestId('franchise-comission-input').fill('15');
    await page.getByTestId('franchise-minimum-comission-input').fill('2500');
    await page.getByTestId('save-franchise-commission').click();

    await expect.poll(() => api.getPutBodies().length).toBeGreaterThan(0);
    const body = api.getPutBodies()[0];
    expect(body.comission).toBe(15);
    expect(body.minimum_comission).toBe(2500);
  });

  test('non-owner non-super sees read-only commission (no pencil)', async ({
    page,
  }) => {
    await mockFranchiseCommissionApi(page, {
      roles: ['ROLE_MANAGER'],
      ownerEnabled: false,
    });

    await page.goto('/client-details?clientId=42&contextKey=client');
    await expect(page.getByText(/Comissão da franquia|franchiseCommission/i)).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText(/10%/)).toBeVisible();
    await expect(page.getByTestId('edit-franchise-commission')).toHaveCount(0);
  });
});
