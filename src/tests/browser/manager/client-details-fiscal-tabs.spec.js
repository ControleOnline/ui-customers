/**
 * fluxo: outros
 * flowchartIds: [1]
 * app-community#682 — fiscal tabs load once, no marketplace Provider toast, values persist across sub-tabs.
 *
 * Justificativa fluxo outros: configuração fiscal de empresa (Receita Federal) não é jornada
 * de venda/produção/POS; usa flowchartIds [1] só como âncora admin habilitada.
 */
const fs = require('fs');
const path = require('path');
const {expect, test} = require('playwright/test');
const {API_ORIGIN} = require('../../../../../../../src/tests/browser/apiOrigin');
const {version: appVersion} = require('../../../../../../../package.json');

const FLOW_ID = 'outros';
const FLOWCHART_IDS = [1];
const FLOWCHART_LINKS = FLOWCHART_IDS.map(
  id => `https://admin.controleonline.com/admin/flowcharts/${id}`,
);

const evidenceSteps = [];

const writeEvidence = async (page, outputDir, stepId, title) => {
  fs.mkdirSync(outputDir, {recursive: true});
  const fileName = `${stepId}.png`;
  const filePath = path.join(outputDir, fileName);
  await page.screenshot({path: filePath, fullPage: true});
  evidenceSteps.push({
    id: stepId,
    title,
    screenshot: fileName,
    url: page.url(),
  });
  return filePath;
};

const writeManifest = outputDir => {
  const manifest = {
    fluxo: FLOW_ID,
    flowchartIds: FLOWCHART_IDS,
    flowchartLinks: FLOWCHART_LINKS,
    title:
      'my-company-details fiscal tabs: load once, no Provider toast, values persist',
    issue: 'ControleOnline/app-community#682',
    steps: evidenceSteps,
  };
  fs.writeFileSync(
    path.join(outputDir, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  return manifest;
};

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

const COMPANY_ID = 2;
const COMPANY = {
  '@id': `/people/${COMPANY_ID}`,
  id: COMPANY_ID,
  name: 'EMPRESA FISCAL TESTE LTDA',
  alias: 'EMPRESA FISCAL',
  peopleType: 'J',
  enable: true,
  panel_enabled: true,
  enabled: true,
  commercial_enabled: true,
  theme: {
    colors: {
      primary: '#166534',
      secondary: '#D9A441',
    },
  },
};

const FISCAL_CONFIGS = [
  {
    '@id': '/configs/1',
    id: 1,
    people: `/people/${COMPANY_ID}`,
    configKey: 'receita-federal-tax-regime',
    configValue: '1',
  },
  {
    '@id': '/configs/2',
    id: 2,
    people: `/people/${COMPANY_ID}`,
    configKey: 'receita-federal-ibge-code',
    configValue: '3550308',
  },
  {
    '@id': '/configs/3',
    id: 3,
    people: `/people/${COMPANY_ID}`,
    configKey: 'receita-federal-environment',
    configValue: '2',
  },
  {
    '@id': '/configs/4',
    id: 4,
    people: `/people/${COMPANY_ID}`,
    configKey: 'receita-federal-nfe-enabled',
    configValue: '1',
  },
  {
    '@id': '/configs/5',
    id: 5,
    people: `/people/${COMPANY_ID}`,
    configKey: 'receita-federal-nfe-serie',
    configValue: '1',
  },
  {
    '@id': '/configs/6',
    id: 6,
    people: `/people/${COMPANY_ID}`,
    configKey: 'receita-federal-nfce-enabled',
    configValue: '1',
  },
  {
    '@id': '/configs/7',
    id: 7,
    people: `/people/${COMPANY_ID}`,
    configKey: 'receita-federal-nfce-serie',
    configValue: '1',
  },
];

const mockFiscalCompanyApi = async page => {
  const marketplaceHits = [];
  const configsHits = [];
  const pageErrors = [];

  page.on('pageerror', error => {
    pageErrors.push(String(error?.message || error));
  });

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
        body: ':root { --primary: #166534; --secondary: #d9a441; }',
      });
    }

    if (pathname === 'runtime/ip') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify({ip: '127.0.0.1'}),
      });
    }

    if (pathname === 'company/default' || pathname === 'people/companies/my') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(
          pathname === 'company/default' ? COMPANY : collection([COMPANY]),
        ),
      });
    }

    if (pathname === `people/${COMPANY_ID}`) {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(COMPANY),
      });
    }

    if (pathname === 'configs' || pathname.startsWith('configs')) {
      configsHits.push({method, search: url.search});
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection(FISCAL_CONFIGS)),
      });
    }

    if (pathname.startsWith('marketplace/integrations')) {
      marketplaceHits.push({
        method,
        search: url.search,
        provider_id: url.searchParams.get('provider_id'),
      });
      // Simulate the prod failure the bug reported — pure fiscal must never hit this.
      return route.fulfill({
        status: 404,
        headers: jsonHeaders(),
        body: JSON.stringify({
          code: -1,
          detail: 'Provider not found or access denied',
        }),
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

    if (pathname === 'people_links' || pathname.startsWith('people_links')) {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection([])),
      });
    }

    if (pathname === 'statuses' || pathname.startsWith('statuses')) {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection([])),
      });
    }

    return route.fulfill({
      status: 200,
      headers: jsonHeaders(),
      body: JSON.stringify(collection([])),
    });
  });

  await page.addInitScript(
    ({appVersion, companyId}) => {
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
          mycompany: companyId,
          roles: ['ROLE_SUPER', 'ROLE_ADMIN'],
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
    {appVersion, companyId: COMPANY_ID},
  );

  return {
    getMarketplaceHits: () => marketplaceHits,
    getConfigsHits: () => configsHits,
    getPageErrors: () => pageErrors,
  };
};

test.describe('client details fiscal tabs browser smoke (#682)', () => {
  test('fiscal sub-tabs load once, skip marketplace, keep values visible', async ({
    page,
  }) => {
    const outputDir = path.join(
      process.cwd(),
      'test-results',
      'client-details-fiscal-tabs',
    );
    evidenceSteps.length = 0;

    const api = await mockFiscalCompanyApi(page);

    await page.goto(
      `/my-company-details?clientId=${COMPANY_ID}&contextKey=company`,
    );

    await expect(
      page.getByText(/EMPRESA FISCAL|Configurações Fiscais|Dados Cadastrais/i).first(),
    ).toBeVisible({timeout: 20000});

    await writeEvidence(page, outputDir, '01-company-details', 'Company details loaded');

    // Open Fiscal tab (label from helpers: Configurações Fiscais)
    const fiscalTab = page.getByText(/Configurações Fiscais|Configuracoes Fiscais|Fiscal/i).first();
    await expect(fiscalTab).toBeVisible({timeout: 15000});
    await fiscalTab.click();

    // Gerais is the default sub-tab
    await expect(page.getByText(/Gerais/i).first()).toBeVisible({timeout: 15000});
    await expect(page.getByText(/Regime tributario|Regime tributário/i).first()).toBeVisible({
      timeout: 10000,
    });

    await writeEvidence(page, outputDir, '02-fiscal-gerais', 'Fiscal tab Gerais visible');

    const configsAfterOpen = api.getConfigsHits().length;

    // Switch to NF-e
    await page.getByText(/NF-e \(produtos\)|NF-e/i).first().click();
    await expect(page.getByText(/Habilitar NF-e/i).first()).toBeVisible({timeout: 10000});
    await expect(page.getByText(/Serie NF-e|Série NF-e/i).first()).toBeVisible({
      timeout: 5000,
    });

    await writeEvidence(page, outputDir, '03-fiscal-nfe', 'Fiscal tab NF-e visible');

    // Switch to NFC-e
    await page.getByText(/NFC-e|Cupom/i).first().click();
    await expect(page.getByText(/Habilitar NFC-e/i).first()).toBeVisible({timeout: 10000});

    await writeEvidence(page, outputDir, '04-fiscal-nfce', 'Fiscal tab NFC-e visible');

    // Back to Gerais — values must still be present without re-fetch cascade
    await page.getByText(/Gerais/i).first().click();
    await expect(page.getByText(/Regime tributario|Regime tributário/i).first()).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/Codigo IBGE|Código IBGE/i).first()).toBeVisible({
      timeout: 5000,
    });

    await writeEvidence(
      page,
      outputDir,
      '05-fiscal-gerais-return',
      'Back to Gerais — values still visible',
    );

    // Core acceptance: never called marketplace/integrations for pure fiscal
    expect(api.getMarketplaceHits()).toEqual([]);

    // Configs load should not explode on every tab switch (load-once)
    const configsAfterTabs = api.getConfigsHits().length;
    expect(configsAfterTabs - configsAfterOpen).toBeLessThanOrEqual(1);

    // No Provider toast / page error from marketplace
    await expect(page.getByText(/Provider not found or access denied/i)).toHaveCount(0);
    const relevantErrors = api
      .getPageErrors()
      .filter(msg => /provider not found|maximum update depth/i.test(msg));
    expect(relevantErrors).toEqual([]);

    const manifest = writeManifest(outputDir);
    expect(manifest.fluxo).toBe(FLOW_ID);
    expect(manifest.flowchartIds).toEqual(FLOWCHART_IDS);
    expect(manifest.steps.length).toBeGreaterThanOrEqual(5);

    for (const step of manifest.steps) {
      const pngPath = path.join(outputDir, step.screenshot);
      expect(fs.existsSync(pngPath)).toBe(true);
    }
  });
});
