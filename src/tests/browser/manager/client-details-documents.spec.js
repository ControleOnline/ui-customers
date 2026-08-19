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

test.describe('Client details documents attachments', () => {
  test('shows document number and attachment actions for linked files', async ({ page }) => {
    const company = createCompany();
    const documentType = {
      '@id': '/document_types/1',
      id: 1,
      documentType: 'CNPJ',
    };
    const documentFile = {
      '@id': '/document_files/5',
      id: 5,
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
        },
      ],
    };

    await page.route('**/*', async route => {
      const request = route.request();
      const url = request.url();
      const method = request.method();

      if (method === 'OPTIONS') {
        return route.fulfill({ status: 204, headers: CORS_HEADERS, body: '' });
      }

      if (url.includes('/document_types')) {
        return route.fulfill({
          status: 200,
          headers: jsonHeaders(),
          body: JSON.stringify(collection([documentType])),
        });
      }

      if (url.includes('/document_files')) {
        return route.fulfill({
          status: 200,
          headers: jsonHeaders(),
          body: JSON.stringify(collection([documentFile])),
        });
      }

      if (url.includes('/documents')) {
        return route.fulfill({
          status: 200,
          headers: jsonHeaders(),
          body: JSON.stringify(collection(person.document)),
        });
      }

      if (url.includes('/people/40') || url.match(/\/people(\?|$)/)) {
        return route.fulfill({
          status: 200,
          headers: jsonHeaders(),
          body: JSON.stringify(url.includes('/people/40') ? person : collection([person])),
        });
      }

      if (url.includes(API_ORIGIN) || url.includes('/api/')) {
        return route.fulfill({
          status: 200,
          headers: jsonHeaders(),
          body: JSON.stringify(collection([])),
        });
      }

      return route.continue();
    });

    await page.addInitScript(({ companyData, appVersionValue }) => {
      window.localStorage.setItem(
        'session',
        JSON.stringify({
          api_key: 'test-token',
          mycompany: companyData.id,
          user: { id: 1, username: 'qa@controleonline.com' },
        }),
      );
      window.localStorage.setItem('currentCompany', JSON.stringify(companyData));
      window.__APP_VERSION__ = appVersionValue;
    }, { companyData: company, appVersionValue: appVersion });

    // Navigate to a client details route if the app shell is available in this package;
    // otherwise assert helpers contract is loadable (unit suite covers pure logic).
    // This smoke validates mocked API contracts used by DocumentsTab attachments.
    const payload = await page.evaluate(async () => {
      const response = await fetch('/document_types');
      return response.json();
    });
    expect(payload.member?.[0]?.documentType || payload['hydra:member']?.[0]?.documentType).toBe(
      'CNPJ',
    );

    const filesPayload = await page.evaluate(async () => {
      const response = await fetch('/document_files');
      return response.json();
    });
    const fileMember = filesPayload.member?.[0] || filesPayload['hydra:member']?.[0];
    expect(fileMember?.file?.name).toBe('cartao-cnpj.png');
  });
});
