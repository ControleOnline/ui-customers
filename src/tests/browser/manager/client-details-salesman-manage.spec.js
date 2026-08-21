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

const sellerLinked = {
  '@id': '/people/40',
  id: 40,
  name: 'VENDEDOR VINCULADO',
  alias: 'VINC',
  peopleType: 'F',
};

const sellerAvailable = {
  '@id': '/people/42',
  id: 42,
  name: 'VENDEDOR DISPONIVEL',
  alias: 'DISP',
  peopleType: 'F',
};

/**
 * Stateful mock for manage CRUD: list, create, update, delete people_links.
 */
const mockManagerApi = async (page, {appType = 'MANAGER', roles = ['ROLE_SUPER']} = {}) => {
  const linksState = [
    {
      '@id': '/people_links/501',
      id: 501,
      company: sellerLinked,
      people: client,
      linkType: 'sellers-client',
      comission: 10,
      minimum_comission: 2,
    },
  ];
  let nextId = 600;

  await page.route(`${API_ORIGIN}/**`, async route => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname.replace(/^\/+/, '');
    const method = request.method();

    if (method === 'OPTIONS') {
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
      const query = Object.fromEntries(url.searchParams);
      // Available salesmen for company (link.linkType=salesman)
      if (query['link.linkType'] === 'salesman' || query.linkType === 'salesman') {
        return route.fulfill({
          status: 200,
          headers: jsonHeaders(),
          body: JSON.stringify(collection([sellerLinked, sellerAvailable])),
        });
      }
      return route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(collection([client])),
      });
    }

    if (pathname === 'people_links' || pathname.startsWith('people_links')) {
      const query = Object.fromEntries(url.searchParams);

      if (method === 'GET') {
        if (query.linkType === 'sellers-client') {
          return route.fulfill({
            status: 200,
            headers: jsonHeaders(),
            body: JSON.stringify(collection([...linksState])),
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
                  company,
                  people: sellerLinked,
                  linkType: 'salesman',
                  comission: 8,
                  minimum_comission: 1,
                },
                {
                  '@id': '/people_links/602',
                  id: 602,
                  company,
                  people: sellerAvailable,
                  linkType: 'salesman',
                  comission: 12,
                  minimum_comission: 3,
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

      if (method === 'POST') {
        let body = {};
        try {
          body = JSON.parse(request.postData() || '{}');
        } catch (_) {
          body = {};
        }
        const sellerIri =
          typeof body.company === 'string'
            ? body.company
            : body.company?.['@id'] || body.company?.id;
        const seller =
          sellerIri === sellerAvailable['@id'] || sellerIri === 42 || sellerIri === '42'
            ? sellerAvailable
            : sellerLinked;
        nextId += 1;
        const created = {
          '@id': `/people_links/${nextId}`,
          id: nextId,
          company: seller,
          people: client,
          linkType: body.linkType || 'sellers-client',
          comission: body.comission ?? body.commission ?? null,
          minimum_comission:
            body.minimum_comission ?? body.minimumComission ?? null,
        };
        linksState.push(created);
        return route.fulfill({
          status: 201,
          headers: jsonHeaders(),
          body: JSON.stringify(created),
        });
      }

      if (method === 'PUT' || method === 'PATCH') {
        const idMatch = pathname.match(/people_links\/(\d+)/);
        const id = idMatch ? Number(idMatch[1]) : null;
        let body = {};
        try {
          body = JSON.parse(request.postData() || '{}');
        } catch (_) {
          body = {};
        }
        const idx = linksState.findIndex(l => l.id === id);
        if (idx >= 0) {
          linksState[idx] = {
            ...linksState[idx],
            comission:
              body.comission ?? body.commission ?? linksState[idx].comission,
            minimum_comission:
              body.minimum_comission ??
              body.minimumComission ??
              linksState[idx].minimum_comission,
          };
          return route.fulfill({
            status: 200,
            headers: jsonHeaders(),
            body: JSON.stringify(linksState[idx]),
          });
        }
        return route.fulfill({
          status: 404,
          headers: jsonHeaders(),
          body: JSON.stringify({detail: 'Not found'}),
        });
      }

      if (method === 'DELETE') {
        const idMatch = pathname.match(/people_links\/(\d+)/);
        const id = idMatch ? Number(idMatch[1]) : null;
        const idx = linksState.findIndex(l => l.id === id);
        if (idx >= 0) {
          linksState.splice(idx, 1);
        }
        return route.fulfill({
          status: 204,
          headers: CORS_HEADERS,
          body: '',
        });
      }
    }

    if (pathname.startsWith('people_media') || pathname === 'medias') {
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
    ({version, roles, appType}) => {
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
      localStorage.setItem('app-type', appType);
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
    {version: appVersion, roles, appType},
  );
};

test.describe('manager client salesman manage CRUD', () => {
  test('MANAGER: shows add button, opens modal, links new salesman', async ({
    page,
  }) => {
    await mockManagerApi(page, {appType: 'MANAGER', roles: ['ROLE_SUPER']});
    await page.goto(
      '/client-details?clientId=29&contextKey=client&initialTab=sellers',
    );

    await expect(page.getByTestId('salesman-manage-add-btn')).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText('VENDEDOR VINCULADO', {exact: false})).toBeVisible({
      timeout: 10000,
    });

    await page.getByTestId('salesman-manage-add-btn').click();
    await expect(page.getByTestId('salesman-manage-modal')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByTestId('salesman-manage-modal-title')).toContainText(
      'Vincular',
    );

    // Select available seller via native select (Picker web renders as select)
    const picker = page.getByTestId('salesman-manage-seller-picker');
    await expect(picker).toBeVisible();
    // RN-web Picker often exposes a select inside
    const select = picker.locator('select').first();
    if (await select.count()) {
      await select.selectOption({value: '/people/42'});
    } else {
      // Fallback: click option text if custom picker
      await page.getByText('VENDEDOR DISPONIVEL', {exact: false}).first().click();
    }

    await page.getByTestId('salesman-manage-commission-input').fill('18');
    await page.getByTestId('salesman-manage-minimum-input').fill('4');
    await page.getByTestId('salesman-manage-save-btn').click();

    await expect(page.getByTestId('salesman-manage-modal')).toHaveCount(0, {
      timeout: 10000,
    });
    await expect(
      page.getByText('VENDEDOR DISPONIVEL', {exact: false}),
    ).toBeVisible({timeout: 10000});
  });

  test('MANAGER: edit and delete row actions present for linked salesman', async ({
    page,
  }) => {
    await mockManagerApi(page, {appType: 'MANAGER', roles: ['ROLE_SUPER']});
    await page.goto(
      '/client-details?clientId=29&contextKey=client&initialTab=sellers',
    );

    await expect(page.getByTestId('salesman-manage-edit-501')).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByTestId('salesman-manage-delete-501')).toBeVisible();

    await page.getByTestId('salesman-manage-edit-501').click();
    await expect(page.getByTestId('salesman-manage-modal')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByTestId('salesman-manage-modal-title')).toContainText(
      'Editar',
    );
    await page.getByTestId('salesman-manage-commission-input').fill('22');
    await page.getByTestId('salesman-manage-save-btn').click();
    await expect(page.getByTestId('salesman-manage-modal')).toHaveCount(0, {
      timeout: 10000,
    });

    // Delete — MessageService showDialog (custom UI confirm)
    await page.getByTestId('salesman-manage-delete-501').click();
    await expect(
      page.getByText(/Deseja realmente remover este vendedor/i),
    ).toBeVisible({timeout: 10000});
    await page.getByText('Remover', {exact: true}).last().click();
    // After delete the edit control for 501 should disappear
    await expect(page.getByTestId('salesman-manage-edit-501')).toHaveCount(0, {
      timeout: 10000,
    });
  });

  test('non-MANAGER: no administrative CRUD controls', async ({page}) => {
    await mockManagerApi(page, {appType: 'SHOP', roles: ['ROLE_EMPLOYEE']});
    await page.goto(
      '/client-details?clientId=29&contextKey=client&initialTab=sellers',
    );

    // List may still render linked salesmen, but manage controls must be absent
    await page.waitForTimeout(2000);
    await expect(page.getByTestId('salesman-manage-add-btn')).toHaveCount(0);
    await expect(page.getByTestId('salesman-manage-edit-501')).toHaveCount(0);
    await expect(page.getByTestId('salesman-manage-delete-501')).toHaveCount(0);
    await expect(page.getByTestId('salesman-manage-modal')).toHaveCount(0);
  });
});
