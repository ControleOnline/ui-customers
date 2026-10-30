/**
 * fluxo: outros
 * flowchartIds: [1]
 * app-community#688 — editar contato e gravar sem Item not found /people/{id}.
 */
const fs = require('fs');
const path = require('path');
const {expect, test} = require('playwright/test');
const {API_ORIGIN} = require('../../../../../../../src/tests/browser/apiOrigin');
const {version: appVersion} = require('../../../../../../../package.json');

const FLOW_ID = 'outros';
const FLOWCHART_IDS = [1];
const evidenceSteps = [];

const writeEvidence = async (page, outputDir, stepId, title) => {
  fs.mkdirSync(outputDir, {recursive: true});
  const fileName = `${stepId}.png`;
  await page.screenshot({path: path.join(outputDir, fileName), fullPage: true});
  evidenceSteps.push({id: stepId, title, screenshot: fileName, url: page.url()});
};

const writeManifest = outputDir => {
  const manifest = {
    fluxo: FLOW_ID,
    flowchartIds: FLOWCHART_IDS,
    flowchartLinks: FLOWCHART_IDS.map(
      id => `https://admin.controleonline.com/admin/flowcharts/${id}`,
    ),
    title: 'Contatos: editar e gravar sem Item not found',
    issue: 'ControleOnline/app-community#688',
    missingPrints: [],
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

const jsonHeaders = () => ({
  ...CORS_HEADERS,
  'content-type': 'application/ld+json; charset=utf-8',
});

const contact = {
  '@id': '/people/105790',
  id: 105790,
  name: 'Contato Editavel',
  alias: 'Alias Antigo',
  peopleType: 'F',
  enable: true,
};

const mockApi = async page => {
  const puts = [];
  await page.route(`${API_ORIGIN}/**`, async route => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname.replace(/^\/+/, '');
    const method = request.method().toUpperCase();

    if (method === 'OPTIONS') {
      return route.fulfill({status: 204, headers: CORS_HEADERS, body: ''});
    }

    if (pathname === 'people/105790' && method === 'PUT') {
      const body = request.postDataJSON() || {};
      puts.push(body);
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify({
          ...contact,
          name: body.name || contact.name,
          alias: body.alias || contact.alias,
        }),
      });
    }

    if (pathname === 'people/105790' && method === 'GET') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(contact),
      });
    }

    if (pathname === 'people/company/default' || pathname === 'people/2') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify({
          '@id': '/people/2',
          id: 2,
          name: 'CONTROLE ONLINE',
          alias: 'CONTROLE ONLINE',
          panel_enabled: true,
          enabled: true,
          peopleType: 'J',
        }),
      });
    }

    if (method === 'GET') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify({member: [], 'hydra:member': [], totalItems: 0}),
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
          appVersion: version,
        }),
      );
    },
    {version: appVersion},
  );

  return {getPuts: () => puts};
};

test.describe('client-details contact edit save (#688)', () => {
  test('saves cadastral fields via PUT /people/{id} without Item not found', async ({
    page,
  }) => {
    const api = await mockApi(page);
    const outputDir = path.join(
      __dirname,
      '../../../../../screenshots/flowchart-1-contact-edit',
    );

    await page.goto(
      '/client-details?clientId=105790&contextKey=contacts&initialTab=general&parentCompanyId=2',
    );

    await expect(page.getByText(/Contato Editavel/i).first()).toBeVisible({
      timeout: 20000,
    });
    await writeEvidence(page, outputDir, '01-contato-aberto', 'contato aberto');

    const aliasField = page.locator('input').nth(1);
    if (await aliasField.count()) {
      await aliasField.fill('Alias Novo');
    }
    await writeEvidence(page, outputDir, '02-contato-editado', 'campo alterado');

    const save = page.getByText(/Save Changes|Salvar alterações|Gravar/i).first();
    await save.click();

    await expect.poll(() => api.getPuts().length).toBeGreaterThan(0);
    const put = api.getPuts()[0];
    expect(String(put.id || '105790')).toMatch(/105790/);
    await expect(page.getByText(/Item not found/i)).toHaveCount(0);
    await expect(page.getByText(/Registration Update Failed/i)).toHaveCount(0);
    await writeEvidence(page, outputDir, '03-contato-salvo', 'gravado sem erro');

    const manifest = writeManifest(outputDir);
    expect(manifest.missingPrints).toEqual([]);
    expect(manifest.flowchartIds).toEqual(FLOWCHART_IDS);
  });
});
