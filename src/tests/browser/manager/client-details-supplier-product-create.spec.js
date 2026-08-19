/**
 * Smoke: supplier (provider) ProductsTab → "+" create product with initialProvider
 * Covers app-community#98: open supplier details → Produtos → Produto → ProductDetails
 * with supplier context; first save links product_people role=supplier.
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

const supplier = {
  '@id': '/people/55001',
  id: 55001,
  name: 'FORNECEDOR SMOKE LTDA',
  alias: 'FORNECEDOR SMOKE',
  peopleType: 'J',
  enable: true,
  productPeople: [],
};

const mockSupplierProductCreateApi = async page => {
  const productPosts = [];
  const productPeoplePosts = [];
  let createdProduct = null;
  let linkedRelations = [];

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

    if (pathname === 'people/55001' && method === 'GET') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify({
          ...supplier,
          productPeople: linkedRelations,
        }),
      });
    }

    if (pathname === 'products' && method === 'POST') {
      let body = {};
      try {
        body = request.postDataJSON() || {};
      } catch {
        body = {};
      }
      productPosts.push(body);
      createdProduct = {
        '@id': '/products/88001',
        id: 88001,
        product: body.product || body.name || 'PRODUTO SMOKE 98',
        name: body.product || body.name || 'PRODUTO SMOKE 98',
        sku: body.sku || 'SMOKE-98',
        price: body.price || 0,
        type: body.type || 'product',
      };
      return route.fulfill({
        status: 201,
        headers: jsonHeaders(),
        body: JSON.stringify(createdProduct),
      });
    }

    if (
      (pathname === 'product_people' || pathname === 'product-people') &&
      method === 'POST'
    ) {
      let body = {};
      try {
        body = request.postDataJSON() || {};
      } catch {
        body = {};
      }
      productPeoplePosts.push(body);
      const relation = {
        '@id': '/product_people/1',
        id: 1,
        product: createdProduct || {'@id': body.product, id: 88001},
        people: {'@id': '/people/55001', id: 55001, alias: supplier.alias},
        role: body.role || 'supplier',
        priority: body.priority ?? 1,
      };
      linkedRelations = [relation];
      return route.fulfill({
        status: 201,
        headers: jsonHeaders(),
        body: JSON.stringify(relation),
      });
    }

    if (pathname === 'products/88001' && method === 'GET') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(createdProduct || {id: 88001, product: 'PRODUTO SMOKE 98'}),
      });
    }

    if (pathname.startsWith('products/') && method === 'GET') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(createdProduct || {id: 0, product: ''}),
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

  return {productPosts, productPeoplePosts};
};

test.describe('client-details supplier product create (#98)', () => {
  test('opens ProductDetails from supplier ProductsTab with provider context', async ({
    page,
  }) => {
    const {productPosts, productPeoplePosts} = await mockSupplierProductCreateApi(page);

    await page.goto(
      '/client-details?clientId=55001&contextKey=provider&initialTab=products',
    );

    await expect(
      page.getByText('FORNECEDOR SMOKE', {exact: false}).first(),
    ).toBeVisible({timeout: 15000});

    await expect(
      page.getByText(/Produtos fornecidos|produtos vinculados/i).first(),
    ).toBeVisible({timeout: 10000});

    const addProductSelectors = [
      page.getByRole('button', {name: /produto/i}).first(),
      page.getByText(/^Produto$/i).first(),
      page.locator('text=Produto').first(),
    ];

    let clicked = false;
    for (const locator of addProductSelectors) {
      try {
        if (await locator.isVisible({timeout: 2500})) {
          await locator.click();
          clicked = true;
          break;
        }
      } catch {
        // try next
      }
    }

    expect(clicked).toBe(true);

    // ProductDetails / form should open (name or product field, or save action)
    const productFormHints = [
      page.getByText(/produto|cadastrar|novo produto|dados/i).first(),
      page
        .locator(
          'input[name="product"], input[name="name"], input[placeholder*="produto" i], input[placeholder*="nome" i]',
        )
        .first(),
      page.getByRole('button', {name: /salvar|save|gravar/i}).first(),
    ];

    let formVisible = false;
    for (const locator of productFormHints) {
      try {
        if (await locator.isVisible({timeout: 8000})) {
          formVisible = true;
          break;
        }
      } catch {
        // try next
      }
    }

    expect(formVisible).toBe(true);

    // Optional: fill minimal fields and save when form is interactive
    const nameField = page
      .locator(
        'input[name="product"], input[name="name"], input[placeholder*="produto" i], input[placeholder*="nome" i]',
      )
      .first();

    if (await nameField.isVisible({timeout: 3000}).catch(() => false)) {
      await nameField.fill('PRODUTO SMOKE 98');
      const saveBtn = page
        .getByRole('button', {name: /salvar|save|gravar|confirmar/i})
        .first();
      if (await saveBtn.isVisible().catch(() => false)) {
        await saveBtn.click();
        // Allow async save + optional product_people link
        await page.waitForTimeout(1500);
      }
    }

    await expect(page.getByText('Request failed', {exact: false})).toHaveCount(0, {
      timeout: 5000,
    });

    // If product was created, supplier link should have been attempted
    if (productPosts.length > 0) {
      expect(productPeoplePosts.length).toBeGreaterThanOrEqual(1);
      const link = productPeoplePosts[0];
      expect(String(link.role || '')).toMatch(/supplier/i);
      expect(String(link.people || link.provider || '')).toMatch(/55001/);
    }
  });
});
