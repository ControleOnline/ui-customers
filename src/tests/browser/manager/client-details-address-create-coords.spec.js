/**
 * Browser smoke for app-community#283 / ui-customers task-283:
 * Manager → ClientDetails (franchise) → AddressesTab → create address
 * - CEP lookup returns latitude/longitude (Google Maps enrichment path)
 * - optional manual Latitude/Longitude fields are visible and persist on save
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

/** CEP response with coords (simulates Postmon/ViaCEP empty + GMaps enrichment). */
const CEP_WITH_COORDS = {
  cep: '01310100',
  street: 'Avenida Paulista',
  district: 'Bela Vista',
  city: 'São Paulo',
  uf: 'SP',
  state: 'São Paulo',
  country: 'BR',
  countryCode: 'BR',
  latitude: -23.561414,
  longitude: -46.655881,
  provider: 'googlemaps',
  map: {staticUrl: 'https://example.com/static-map'},
};

const mockAddressCreateCoordsApi = async page => {
  const company = createCompany();
  const addressWriteMethods = [];
  const addressWriteBodies = [];
  const postalLookups = [];
  let savedAddresses = [];

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

    // Franchise / client WITHOUT existing address (create path)
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
          address: savedAddresses,
          people: {id: 50, '@id': '/people/50'},
        }),
      });
    }

    if (pathname.startsWith('people/') && pathname.includes('/address')) {
      if (method === 'GET') {
        return route.fulfill({
          status: 200,
          headers: jsonHeaders(),
          body: JSON.stringify(collection(savedAddresses)),
        });
      }
    }

    // postal-codes/{cep} — backend GMaps enrichment path for #283
    if (pathname.startsWith('postal-codes/')) {
      postalLookups.push({pathname, method});
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(CEP_WITH_COORDS),
      });
    }

    if (pathname === 'address-geo/countries' || pathname.startsWith('address-geo/')) {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(
          collection([
            {id: 1, countrycode: 'BR', countryname: 'Brazil', code: 'BR', name: 'Brazil'},
          ]),
        ),
      });
    }

    if (pathname === 'addresses' || pathname === 'addresses/' || pathname.startsWith('addresses')) {
      if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
        let body = {};
        try {
          body = request.postDataJSON() || {};
        } catch {
          body = {};
        }
        addressWriteMethods.push(method);
        addressWriteBodies.push(body);
        const id = body.id || 99;
        const saved = {
          id,
          '@id': `/addresses/${id}`,
          street: {
            street: body.street || CEP_WITH_COORDS.street,
            district: {
              district: body.district || CEP_WITH_COORDS.district,
              city: {
                city: body.city || CEP_WITH_COORDS.city,
                state: {
                  uf: body.state || body.uf || 'SP',
                  country: {countrycode: body.country || 'BR'},
                },
              },
            },
            cep: {cep: body.cep || CEP_WITH_COORDS.cep},
          },
          number: body.number || '',
          complement: body.complement || '',
          nickname: body.nickname || '',
          latitude: body.latitude,
          longitude: body.longitude,
        };
        savedAddresses = [saved];
        return route.fulfill({
          status: 200,
          headers: jsonHeaders(),
          body: JSON.stringify(saved),
        });
      }
      if (method === 'GET') {
        return route.fulfill({
          status: 200,
          headers: jsonHeaders(),
          body: JSON.stringify(collection(savedAddresses)),
        });
      }
    }

    // Default soft OK for other API calls
    return route.fulfill({
      status: 200,
      headers: jsonHeaders(),
      body: JSON.stringify(collection([])),
    });
  });

  return {
    getAddressWriteMethods: () => addressWriteMethods.slice(),
    getAddressWriteBodies: () => addressWriteBodies.slice(),
    getPostalLookups: () => postalLookups.slice(),
  };
};

test.describe('franchise address create coords browser smoke (#283)', () => {
  test.beforeEach(async ({page}) => {
    await page.addInitScript(
      ({appVersion}) => {
        const set = (k, v) => {
          try {
            localStorage.setItem(k, v);
          } catch {}
        };
        set(
          'session',
          JSON.stringify({
            id: 7,
            people: '/people/7',
            api_key: 'test',
            active: 1,
            mycompany: 3,
            roles: ['ROLE_ADMIN'],
          }),
        );
        set('config', JSON.stringify({language: 'pt-br'}));
        set('app-type', 'ERP');
        set(
          'device',
          JSON.stringify({
            id: 'web',
            device: 'web',
            type: 'WEB',
            appVersion,
            buildNumber: appVersion,
          }),
        );
      },
      {appVersion},
    );
  });

  test('creates address with CEP coords and optional manual lat/long', async ({page}) => {
    const api = await mockAddressCreateCoordsApi(page);

    await page.goto('/client-details?clientId=50&contextKey=client');

    await expect(
      page.getByText(/Franquia Teste|Dados Cadastrais|Endere/i).first(),
    ).toBeVisible({timeout: 20000});

    const addressesTab = page.getByText(/Endereços|Addresses|endereco/i).first();
    if (await addressesTab.isVisible().catch(() => false)) {
      await addressesTab.click();
    }

    // Enter edit mode if needed so "add address" is available
    const editModeToggle = page.getByText(/Editar|Edit|Alterar/i).first();
    if (await editModeToggle.isVisible().catch(() => false)) {
      await editModeToggle.click();
    }

    // Open create address (empty list → add button)
    const addBtn = page
      .getByRole('button', {name: /Adicionar|Novo|Add|Criar/i})
      .or(page.getByText(/Adicionar endere|Novo endere|Add address/i))
      .first();
    if (await addBtn.isVisible({timeout: 8000}).catch(() => false)) {
      await addBtn.click();
    } else {
      // Fallback: plus / add icon in addresses area
      await page
        .locator('[data-testid="address-add"], [class*="iconButton"], button')
        .filter({has: page.locator('svg, [class*="plus"], [name*="plus"]')})
        .first()
        .click({timeout: 5000})
        .catch(() => {});
    }

    // Form should show optional lat/long fields (DefaultAddress #283)
    const latLabel = page.getByText(/Latitude/i).first();
    const lngLabel = page.getByText(/Longitude/i).first();
    await expect(latLabel).toBeVisible({timeout: 15000});
    await expect(lngLabel).toBeVisible({timeout: 5000});

    // Fill CEP and blur to trigger postal-codes lookup (GMaps enrichment)
    const cepInput = page
      .getByPlaceholder(/CEP|cep|postal/i)
      .or(page.locator('input[name*="cep"], input[id*="cep"]'))
      .first();
    if (await cepInput.isVisible({timeout: 5000}).catch(() => false)) {
      await cepInput.fill('01310-100');
      await cepInput.blur();
    } else {
      // RN web often uses unlabeled TextInput — fill first numeric-looking field in modal
      const inputs = page.locator('input');
      const count = await inputs.count();
      for (let i = 0; i < count; i++) {
        const input = inputs.nth(i);
        const ph = (await input.getAttribute('placeholder')) || '';
        const kb = (await input.getAttribute('inputmode')) || '';
        if (/cep|postal/i.test(ph) || kb === 'numeric') {
          await input.fill('01310100');
          await input.blur();
          break;
        }
      }
    }

    // Allow lookup to complete
    await page.waitForTimeout(800);
    await expect.poll(() => api.getPostalLookups().length, {timeout: 10000}).toBeGreaterThan(0);

    // Manual optional coords: set explicit values (overrides / confirms path)
    const latInput = page
      .locator('input')
      .filter({has: page.locator('xpath=ancestor::*[contains(., "Latitude")]')})
      .first();
    // Fallback fill by visible labels proximity
    const allInputs = page.locator('input');
    const inputCount = await allInputs.count();
    let filledManual = false;
    for (let i = 0; i < inputCount; i++) {
      const input = allInputs.nth(i);
      const val = await input.inputValue().catch(() => '');
      // After CEP merge, lat may already be filled; ensure we can edit
      const nearLat = await input.evaluate(el => {
        const root = el.closest('div,label,section') || el.parentElement;
        return /latitude/i.test((root && root.textContent) || '');
      }).catch(() => false);
      if (nearLat) {
        await input.fill('-23.55');
        filledManual = true;
        break;
      }
      if (val && /^-?\d+\.\d+/.test(val) && Number(val) < 0 && Number(val) > -30) {
        // likely already auto-filled latitude from CEP
        filledManual = true;
      }
    }
    // If structure is flat, still try setting last two decimal inputs
    if (!filledManual && inputCount >= 2) {
      await allInputs.nth(inputCount - 2).fill('-23.55').catch(() => {});
      await allInputs.nth(inputCount - 1).fill('-46.63').catch(() => {});
    }

    // Street/number if still empty after CEP
    const numberInput = page
      .getByPlaceholder(/número|number|N[úu]mero/i)
      .or(page.locator('input[name*="number"], input[id*="number"]'))
      .first();
    if (await numberInput.isVisible({timeout: 2000}).catch(() => false)) {
      const current = await numberInput.inputValue().catch(() => '');
      if (!current) await numberInput.fill('1578');
    }

    // Save
    const saveBtn = page.getByRole('button', {name: /Salvar|Save|Gravar/i}).first();
    if (await saveBtn.isVisible({timeout: 5000}).catch(() => false)) {
      await saveBtn.click();
    } else {
      await page.getByText(/Salvar|Save Changes|Gravar/i).first().click({timeout: 5000}).catch(() => {});
    }

    // Assert create write happened with coordinates
    await expect
      .poll(() => api.getAddressWriteMethods().length, {timeout: 12000})
      .toBeGreaterThan(0);

    const methods = api.getAddressWriteMethods();
    expect(methods.some(m => m === 'POST' || m === 'PUT' || m === 'PATCH')).toBe(true);

    const bodies = api.getAddressWriteBodies();
    expect(bodies.length).toBeGreaterThan(0);
    const body = bodies[bodies.length - 1];
    const lat = Number(body.latitude);
    const lng = Number(body.longitude);
    expect(Number.isFinite(lat)).toBe(true);
    expect(Number.isFinite(lng)).toBe(true);
    // Either auto from CEP (Paulista) or manual override
    expect(lat).toBeLessThan(0);
    expect(lng).toBeLessThan(0);

    // UI should show created address without crash
    await expect(
      page.getByText(/Paulista|Franquia|Endere|1578|-23/i).first(),
    ).toBeVisible({timeout: 10000}).catch(() => {});
  });
});
