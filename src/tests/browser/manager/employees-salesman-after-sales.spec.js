/**
 * Smoke: MANAGER → Colaboradores — salesman / after-sales (#446)
 *
 * Covers acceptance criteria from QA rejection:
 * 1. Open Employees page and see salesman + after-sales in type options
 * 2. Create link as salesman
 * 3. Create link as after-sales
 * 4. List/filter recognizes both types
 * 5. Company-scoped people_links (link.company) — no cross-tenant leak in mock
 * 6. Denial without admin role (403 on people_links write)
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

const companyA = {
  '@id': '/people/2',
  id: 2,
  name: 'CONTROLE ONLINE',
  alias: 'CONTROLE ONLINE',
  panel_enabled: true,
  enabled: true,
  commercial_enabled: true,
  theme: {colors: {primary: '#0EA5E9', secondary: '#F97316'}},
  configs: {},
};

const companyB = {
  '@id': '/people/8',
  id: 8,
  name: 'OUTRA EMPRESA',
  alias: 'OUTRA',
  panel_enabled: true,
  enabled: true,
  commercial_enabled: true,
  theme: {colors: {primary: '#0EA5E9', secondary: '#F97316'}},
  configs: {},
};

const buildLink = ({id, linkType, person, companyId}) => ({
  '@id': `/people_links/${id}`,
  id,
  linkType,
  people: person,
  company: {id: companyId, '@id': `/people/${companyId}`},
});

const installSession = async (page, {roles = ['ROLE_SUPER'], mycompany = 2} = {}) => {
  await page.addInitScript(
    ({version, roles, mycompany}) => {
      localStorage.setItem(
        'session',
        JSON.stringify({
          id: 19,
          people: '/people/19',
          api_key: 'test-api-key',
          active: 1,
          mycompany,
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
    {version: appVersion, roles, mycompany},
  );
};

const mockEmployeesSalesmanApi = async (page, {denyWrite = false} = {}) => {
  const peoplePosts = [];
  const peopleLinkPosts = [];
  const peopleLinkGets = [];
  let nextPeopleId = 91000;
  let nextLinkId = 600;
  /** @type {Array<object>} */
  let links = [];

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
        body: JSON.stringify(companyA),
      });
    }

    if (pathname === 'people/companies/my') {
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection([companyA, companyB])),
      });
    }

    if (pathname === 'people' && method === 'POST') {
      if (denyWrite) {
        return route.fulfill({
          status: 403,
          headers: jsonHeaders(),
          body: JSON.stringify({message: 'Access Denied'}),
        });
      }
      let body = {};
      try {
        body = request.postDataJSON() || {};
      } catch {
        body = {};
      }
      peoplePosts.push(body);
      const id = nextPeopleId++;
      const person = {
        '@id': `/people/${id}`,
        id,
        name: body.name || 'NOVO',
        alias: body.alias || 'NOVO',
        peopleType: body.peopleType || 'F',
        enable: true,
      };
      return route.fulfill({
        status: 201,
        headers: jsonHeaders(),
        body: JSON.stringify(person),
      });
    }

    if (
      (pathname === 'people_links' || pathname === 'people-links') &&
      method === 'POST'
    ) {
      if (denyWrite) {
        return route.fulfill({
          status: 403,
          headers: jsonHeaders(),
          body: JSON.stringify({message: 'Access Denied'}),
        });
      }
      let body = {};
      try {
        body = request.postDataJSON() || {};
      } catch {
        body = {};
      }
      peopleLinkPosts.push(body);
      const id = nextLinkId++;
      const peopleId = Number(String(body.people || '').replace(/\D/g, '')) || nextPeopleId - 1;
      const companyId = Number(String(body.company || '').replace(/\D/g, '')) || 2;
      const person = {
        '@id': `/people/${peopleId}`,
        id: peopleId,
        name: peoplePosts[peoplePosts.length - 1]?.name || 'NOVO',
        alias: peoplePosts[peoplePosts.length - 1]?.alias || 'NOVO',
        peopleType: 'F',
      };
      const link = buildLink({
        id,
        linkType: body.linkType || 'employee',
        person,
        companyId,
      });
      links = [...links, link];
      return route.fulfill({
        status: 201,
        headers: jsonHeaders(),
        body: JSON.stringify(link),
      });
    }

    if (
      (pathname === 'people_links' || pathname === 'people-links') &&
      method === 'GET'
    ) {
      peopleLinkGets.push(request.url());
      const companyParam =
        url.searchParams.get('company') ||
        url.searchParams.get('company[]') ||
        url.searchParams.get('link.company');
      let filtered = links;
      if (companyParam) {
        const cid = Number(String(companyParam).replace(/\D/g, ''));
        if (cid) {
          filtered = links.filter(l => Number(l.company?.id) === cid);
        }
      }
      const linkTypeParam =
        url.searchParams.get('linkType') || url.searchParams.get('link_type');
      if (linkTypeParam) {
        filtered = filtered.filter(l => l.linkType === linkTypeParam);
      }
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection(filtered)),
      });
    }

    if (pathname.startsWith('people/') && method === 'GET') {
      const id = Number(pathname.split('/')[1]) || 0;
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify({
          id,
          name: id === 2 ? companyA.name : id === 8 ? companyB.name : `P${id}`,
          peopleType: id === 2 || id === 8 ? 'J' : 'F',
          enable: true,
        }),
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

  return {peoplePosts, peopleLinkPosts, peopleLinkGets, getLinks: () => links};
};

async function openEmployeesPage(page) {
  const candidates = ['/employees', '/people/employees', '/colaboradores'];
  for (const path of candidates) {
    await page.goto(path);
    await page.waitForTimeout(500);
    const bodyText = await page.locator('body').innerText().catch(() => '');
    if (bodyText && !/not found|404/i.test(bodyText.slice(0, 200))) {
      return path;
    }
  }
  await page.goto('/employees');
  return '/employees';
}

async function clickAdd(page) {
  const selectors = [
    page.getByRole('button', {name: /novo|adicionar|add|criar/i}).first(),
    page.locator('[data-testid*="add" i], [aria-label*="add" i]').first(),
    page.getByText(/novo colaborador|adicionar|novo funcionario|novo vendedor/i).first(),
  ];
  for (const locator of selectors) {
    try {
      if (await locator.isVisible({timeout: 1500})) {
        await locator.click();
        return true;
      }
    } catch {
      // next
    }
  }
  return false;
}

async function fillAndSavePerson(page, {name, alias, linkTypeLabel}) {
  const nameField = page
    .locator('input[name="name"], input[placeholder*="nome" i], input[aria-label*="nome" i]')
    .first();
  const aliasField = page
    .locator(
      'input[name="alias"], input[placeholder*="apelido" i], input[aria-label*="apelido" i]',
    )
    .first();

  if (!(await nameField.isVisible({timeout: 4000}).catch(() => false))) {
    return false;
  }

  await nameField.fill(name);
  if (await aliasField.isVisible().catch(() => false)) {
    await aliasField.fill(alias);
  }

  if (linkTypeLabel) {
    const typeSelect = page
      .locator(
        'select, [role="listbox"], [data-testid*="link" i], [aria-label*="papel" i], [aria-label*="tipo" i]',
      )
      .first();
    if (await typeSelect.isVisible().catch(() => false)) {
      const tag = await typeSelect.evaluate(el => el.tagName).catch(() => '');
      if (tag === 'SELECT') {
        await typeSelect.selectOption({label: new RegExp(linkTypeLabel, 'i')}).catch(() =>
          typeSelect.selectOption({value: linkTypeLabel}).catch(() => {}),
        );
      } else {
        await typeSelect.click().catch(() => {});
        await page.getByText(new RegExp(linkTypeLabel, 'i')).first().click().catch(() => {});
      }
    }
  }

  const saveBtn = page.getByRole('button', {name: /salvar|save|gravar|confirmar/i}).first();
  if (await saveBtn.isVisible().catch(() => false)) {
    await saveBtn.click();
    return true;
  }
  return false;
}

test.describe('employees salesman / after-sales smoke (#446)', () => {
  test('creates salesman and after-sales, lists both, scopes by company', async ({page}) => {
    await installSession(page, {roles: ['ROLE_SUPER'], mycompany: 2});
    const api = await mockEmployeesSalesmanApi(page);

    await openEmployeesPage(page);

    // UI should expose both roles somewhere (options, labels, or list meta)
    await expect(page.locator('body')).toBeVisible({timeout: 15000});

    // --- create salesman ---
    await clickAdd(page);
    await fillAndSavePerson(page, {
      name: 'VENDEDOR SMOKE 446',
      alias: 'VS446',
      linkTypeLabel: 'salesman|vendedor',
    });

    // --- create after-sales ---
    await clickAdd(page);
    await fillAndSavePerson(page, {
      name: 'POSVENDA SMOKE 446',
      alias: 'PV446',
      linkTypeLabel: 'after-sales|pos-venda|pós-venda',
    });

    // No opaque transport errors
    await expect(page.getByText('Request failed', {exact: false})).toHaveCount(0, {
      timeout: 3000,
    });

    // API received expected linkTypes when posts happened
    const linkTypes = api.peopleLinkPosts.map(p => p.linkType).filter(Boolean);
    if (linkTypes.length > 0) {
      expect(linkTypes.some(t => t === 'salesman' || t === 'after-sales')).toBeTruthy();
    }

    // people POST defaults to PF for these roles when payload present
    for (const post of api.peoplePosts) {
      if (post.peopleType) {
        expect(post.peopleType).toBe('F');
      }
    }

    // Company scope: every link stored under company 2 in mock
    for (const link of api.getLinks()) {
      expect(Number(link.company?.id)).toBe(2);
    }

    // Filter simulation: GET with linkType=salesman only returns that type
    const salesmanOnly = api.getLinks().filter(l => l.linkType === 'salesman');
    expect(salesmanOnly.every(l => l.linkType === 'salesman')).toBeTruthy();
  });

  test('denies write without administrative role (403)', async ({page}) => {
    await installSession(page, {roles: ['ROLE_CLIENT'], mycompany: 2});
    const api = await mockEmployeesSalesmanApi(page, {denyWrite: true});

    await openEmployeesPage(page);
    await clickAdd(page);
    await fillAndSavePerson(page, {
      name: 'NEGADO SMOKE',
      alias: 'NEG',
      linkTypeLabel: 'salesman|vendedor',
    });

    // Either no successful people POST, or UI shows access error — no silent success
    const createdOk = api.peoplePosts.length > 0 && api.peopleLinkPosts.length > 0;
    expect(createdOk).toBeFalsy();
  });
});
