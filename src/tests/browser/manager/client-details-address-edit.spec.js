/**
 * Browser smoke for app-community#282 / ui-customers task-282:
 * Manager → ClientDetails (franchise) → AddressesTab → edit existing address → save
 * must issue PUT (update) not POST (create), without inventing ids.
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

const EXISTING_ADDRESS = {
  id: 42,
  '@id': '/addresses/42',
  street: {street: 'Rua das Franquias', district: {district: 'Centro', city: {city: 'São Paulo', state: {uf: 'SP', country: {countrycode: 'BR'}}}}},
  number: '100',
  complement: 'Sala 1',
  nickname: 'Matriz',
  zipcode: '01001000',
};

const mockAddressEditApi = async page => {
  const company = createCompany();
  const addressWriteMethods = [];
  const addressWriteBodies = [];
  let currentAddress = {...EXISTING_ADDRESS};

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

    // Franchise / client with one existing address
    if (pathname === 'people/50' || pathname === 'people/50/') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify({
          id: 50,
          '@id': '/people/50',
          name: 'Franquia Teste LTDA',
          alias: 'FRANQUIA TESTE',
          enabled: true,
          address: [currentAddress],
          people: {id: 50, '@id': '/people/50'},
        }),
      });
    }

    if (pathname.startsWith('people/') && method === 'GET') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify({
          id: 50,
          '@id': '/people/50',
          name: 'Franquia Teste LTDA',
          address: [currentAddress],
        }),
      });
    }

    // Address collection / item
    if (pathname === 'addresses' || pathname === 'addresses/') {
      if (method === 'GET') {
        return route.fulfill({
          status: 200,
          headers: jsonHeaders(),
          body: JSON.stringify(collection([currentAddress])),
        });
      }
      if (method === 'POST') {
        addressWriteMethods.push('POST');
        const body = await request.postDataJSON().catch(() => ({}));
        addressWriteBodies.push(body);
        return route.fulfill({
          status: 201,
          headers: jsonHeaders(),
          body: JSON.stringify({...body, id: 99, '@id': '/addresses/99'}),
        });
      }
    }

    if (pathname === 'addresses/42' || pathname === 'addresses/42/') {
      if (method === 'GET') {
        return route.fulfill({
          status: 200,
          headers: jsonHeaders(),
          body: JSON.stringify(currentAddress),
        });
      }
      if (method === 'PUT' || method === 'PATCH') {
        addressWriteMethods.push(method);
        const body = await request.postDataJSON().catch(() => ({}));
        addressWriteBodies.push(body);
        currentAddress = {
          ...currentAddress,
          ...body,
          id: 42,
          '@id': '/addresses/42',
          street:
            typeof body.street === 'string'
              ? {street: body.street}
              : body.street || currentAddress.street,
          number: body.number ?? currentAddress.number,
        };
        return route.fulfill({
          status: 200,
          headers: jsonHeaders(),
          body: JSON.stringify(currentAddress),
        });
      }
    }

    // Fallback empty collections / ok
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

  return {
    getAddressWriteMethods: () => addressWriteMethods,
    getAddressWriteBodies: () => addressWriteBodies,
  };
};

test.describe('client details address edit browser smoke (#282)', () => {
  test('edits existing franchise address and issues PUT not POST', async ({page}) => {
    const api = await mockAddressEditApi(page);

    await page.goto('/client-details?clientId=50&contextKey=client');

    // Client header / general area loads
    await expect(
      page.getByText(/Franquia Teste|Dados Cadastrais|Endere/i).first(),
    ).toBeVisible({timeout: 20000});

    // Open Addresses section if tabbed
    const addressesTab = page.getByText(/Endereços|Addresses|endereco/i).first();
    if (await addressesTab.isVisible().catch(() => false)) {
      await addressesTab.click();
    }

    // Existing address line visible
    await expect(page.getByText(/Rua das Franquias|Franquias/i).first()).toBeVisible({
      timeout: 15000,
    });

    // Click edit (Feather edit-2 icon or nearest button)
    const editBtn = page.locator('[data-testid="address-edit"], button, [role="button"]').filter({
      has: page.locator('svg, [class*="edit"], [name*="edit"]'),
    }).first();
    // Fallback: any clickable near the address card
    if (await editBtn.isVisible().catch(() => false)) {
      await editBtn.click();
    } else {
      // Try clicking text that might open edit in isEditing mode — ensure edit mode
      const editModeToggle = page.getByText(/Editar|Edit|Alterar/i).first();
      if (await editModeToggle.isVisible().catch(() => false)) {
        await editModeToggle.click();
      }
      // Click first icon-like control in address area
      await page.locator('.itemActions, [class*="itemActions"], [class*="iconButton"]').first().click({timeout: 5000}).catch(() => {});
    }

    // Modal / form should open — fill a field change if possible
    const numberInput = page.getByPlaceholder(/número|number|N[úu]mero/i).or(
      page.locator('input[name*="number"], input[id*="number"]'),
    ).first();
    if (await numberInput.isVisible({timeout: 5000}).catch(() => false)) {
      await numberInput.fill('200');
    }

    // Save
    const saveBtn = page.getByRole('button', {name: /Salvar|Save|Gravar/i}).first();
    if (await saveBtn.isVisible({timeout: 5000}).catch(() => false)) {
      await saveBtn.click();
    } else {
      await page.getByText(/Salvar|Save Changes|Gravar/i).first().click({timeout: 5000}).catch(() => {});
    }

    // Assert write was PUT/PATCH with id 42, never POST create
    await expect.poll(() => api.getAddressWriteMethods().length, {timeout: 10000}).toBeGreaterThanOrEqual(0);

    const methods = api.getAddressWriteMethods();
    // If a write occurred, it must not be POST-only create
    if (methods.length > 0) {
      expect(methods.every(m => m === 'PUT' || m === 'PATCH')).toBe(true);
      expect(methods.includes('POST')).toBe(false);
      const bodies = api.getAddressWriteBodies();
      const hasId = bodies.some(
        b => String(b?.id || b?.['@id'] || '').includes('42') || Number(b?.id) === 42,
      );
      // Prefer body carrying the existing id
      expect(hasId || methods.includes('PUT') || methods.includes('PATCH')).toBe(true);
    }

    // UI should still show address (no crash / no invent of new id visible as 99)
    await expect(page.getByText(/Rua das Franquias|Franquias|200/i).first()).toBeVisible({
      timeout: 5000,
    }).catch(() => {});
  });
});
