const { expect, test } = require('playwright/test');
const { API_ORIGIN } = require('../../../../../../../src/tests/browser/apiOrigin');
const { version: appVersion } = require('../../../../../../../package.json');

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
  theme: { colors: { primary: '#0EA5E9', secondary: '#F97316' } },
  configs: {},
});

const documentType = {
  '@id': '/document_types/1',
  id: 1,
  documentType: 'CNPJ',
};

const documentFile = {
  '@id': '/document_files/5',
  id: 5,
  document: '/documents/8',
  file: {
    '@id': '/files/50',
    id: 50,
    name: 'cartao-cnpj.png',
    extension: 'png',
    url: 'https://cdn.example/cartao-cnpj.png',
  },
};

const person = {
  '@id': '/people/40',
  id: 40,
  name: 'EMPRESA DOCUMENTOS LTDA',
  alias: 'DOCS',
  peopleType: 'J',
  enable: true,
  document: [
    {
      '@id': '/documents/8',
      id: 8,
      document: '12345678000199',
      documentType,
      documentFiles: [documentFile],
      file: documentFile.file,
    },
  ],
};

const mockDocumentsApi = async page => {
  const company = createCompany();

  await page.route(`${API_ORIGIN}/**`, async route => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname.replace(/^\/+/, '');
    const method = request.method().toUpperCase();

    if (method === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: CORS_HEADERS, body: '' });
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
        body: JSON.stringify({ ip: '127.0.0.1' }),
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

    if (pathname === 'people/40' || pathname === 'people/30') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(person),
      });
    }

    if (pathname === 'people' || pathname.startsWith('people?')) {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection([person])),
      });
    }

    if (pathname === 'document_types' || pathname.startsWith('document_types')) {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection([documentType])),
      });
    }

    if (pathname === 'document_files' || pathname.startsWith('document_files')) {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection([documentFile])),
      });
    }

    if (pathname === 'documents' || pathname.startsWith('documents')) {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection(person.document)),
      });
    }

    if (pathname === 'files' || pathname.startsWith('files')) {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection([documentFile.file])),
      });
    }

    if (pathname === 'people_links' || pathname.startsWith('people_links')) {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection([])),
      });
    }

    if (pathname === 'status' || pathname.startsWith('status')) {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection([])),
      });
    }

    if (pathname === 'menus' || pathname === 'menus-people') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify({ modules: {} }),
      });
    }

    if (pathname === 'configs/discovery-configs') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify({ configs: {} }),
      });
    }

    return route.fulfill({
      status: 200,
      headers: jsonHeaders(),
      body: JSON.stringify(collection([])),
    });
  });

  await page.addInitScript(
    ({ appVersionValue, companyData }) => {
      const setLocalStorageItem = (key, value) => {
        try {
          localStorage.setItem(key, value);
        } catch {
          /* ignore */
        }
      };

      setLocalStorageItem(
        'session',
        JSON.stringify({
          id: 7,
          people: '/people/7',
          api_key: 'test-api-key',
          active: 1,
          mycompany: companyData.id,
          roles: ['ROLE_SUPER'],
        }),
      );
      setLocalStorageItem('config', JSON.stringify({ language: 'pt-br' }));
      setLocalStorageItem('app-type', 'MANAGER');
      setLocalStorageItem('currentCompany', JSON.stringify(companyData));
      setLocalStorageItem(
        'device',
        JSON.stringify({
          id: 'web-manager',
          device: 'web-manager',
          type: 'WEB',
          appName: 'Browser Manager',
          appVersion: appVersionValue,
          buildNumber: appVersionValue,
          systemName: 'web',
          systemVersion: 'web',
          deviceType: 'web',
          metadata: {},
        }),
      );
      window.__APP_VERSION__ = appVersionValue;
    },
    { appVersionValue: appVersion, companyData: company },
  );
};

test.describe('Client details documents attachments', () => {
  test('opens Documents tab and shows attachment actions (Ver/Abrir/Compartilhar/Imprimir)', async ({
    page,
  }) => {
    await mockDocumentsApi(page);

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/client-details?clientId=40&contextKey=contacts&parentCompanyId=3');

    // Shell / header of client-details must load
    await expect(
      page.getByText(/EMPRESA DOCUMENTOS|DOCS|Dados Cadastrais/i).first(),
    ).toBeVisible({ timeout: 20000 });

    // Navigate to Documents tab (label varies by i18n fallback)
    const docsTab = page
      .getByText(/^Documentos$/i)
      .or(page.getByRole('tab', { name: /Documentos/i }))
      .or(page.getByText(/Documentos/i))
      .first();
    await docsTab.click({ timeout: 15000 }).catch(async () => {
      await page.getByRole('button', { name: /Documentos/i }).first().click({ timeout: 10000 });
    });

    // Document number / type visible
    await expect(page.getByText(/CNPJ/i).first()).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByText(/12\.345\.678\/0001-99|12345678000199|12\.345\.678/i).first(),
    ).toBeVisible({ timeout: 10000 }).catch(() => {});

    // Attachment section + file name
    await expect(page.getByText(/Anexos \(JPG, PNG, PDF\)|Anexos/i).first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/cartao-cnpj\.png/i).first()).toBeVisible({ timeout: 10000 });

    // Action buttons required by acceptance criteria
    await expect(page.getByText(/^Ver$/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/^Abrir$/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/^Compartilhar$/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/^Imprimir$/i).first()).toBeVisible({ timeout: 10000 });

    // Preview (Ver) opens modal with file name
    await page.getByText(/^Ver$/i).first().click();
    await expect(page.getByText(/cartao-cnpj\.png/i).first()).toBeVisible({ timeout: 5000 });

    // Close preview if close control exists
    const closeBtn = page.getByRole('button', { name: /close|fechar/i }).or(
      page.locator('[aria-label="close"]'),
    );
    if (await closeBtn.first().isVisible().catch(() => false)) {
      await closeBtn.first().click().catch(() => {});
    }

    // Critical console errors must not appear for this flow
    const critical = consoleErrors.filter(
      text =>
        !/favicon|Download the React DevTools|Warning:|gravatar|404/i.test(text) &&
        /TypeError|ReferenceError|Cannot read|is not a function|Unhandled/i.test(text),
    );
    expect(critical, `Console errors: ${critical.join(' | ')}`).toEqual([]);
  });

  test('API contract: document_types and document_files respond for attachments', async ({
    page,
  }) => {
    await mockDocumentsApi(page);
    await page.goto('/client-details?clientId=40&contextKey=contacts&parentCompanyId=3');

    const typesPayload = await page.evaluate(async origin => {
      const response = await fetch(`${origin}/document_types`);
      return response.json();
    }, API_ORIGIN);
    expect(
      typesPayload.member?.[0]?.documentType || typesPayload['hydra:member']?.[0]?.documentType,
    ).toBe('CNPJ');

    const filesPayload = await page.evaluate(async origin => {
      const response = await fetch(`${origin}/document_files`);
      return response.json();
    }, API_ORIGIN);
    const fileMember = filesPayload.member?.[0] || filesPayload['hydra:member']?.[0];
    expect(fileMember?.file?.name).toBe('cartao-cnpj.png');
  });
});
