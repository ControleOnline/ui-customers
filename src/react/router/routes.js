import Clients from '@controleonline/ui-customers/src/react/pages/clients';
import Employees from '@controleonline/ui-customers/src/react/pages/employees';
import Providers from '@controleonline/ui-customers/src/react/pages/provider';
import Prospects from '@controleonline/ui-customers/src/react/pages/prospects';
import Client from '@controleonline/ui-customers/src/react/pages/details';

const customersRoutes = [
  {
    name: 'ProvidersIndex',
    component: Providers,
    options: {
      showCompanyFilter: true,
      headerShown: true,
      headerBackVisible: true,
      companyFilterMode: 'icon',
      title: global.t?.t('people', 'title', 'fornecedores') || 'Fornecedores',
      showBottomToolBar: true,
    },
  },
  {
    name: 'ClientsIndex',
    component: Clients,
    options: {
      showCompanyFilter: true,
      headerShown: true,
      headerBackVisible: true,
      companyFilterMode: 'icon',
      title: global.t?.t('people', 'title', 'clientes'),
      showBottomToolBar: true,
    },
  },
  {
    name: 'EmployeesIndex',
    component: Employees,
    options: {
      showCompanyFilter: true,
      headerShown: true,
      headerBackVisible: true,
      companyFilterMode: 'icon',
      title: global.t?.t('people', 'label', 'employee'),
      showBottomToolBar: true,
    },
  },
  {
    name: 'ProspectsIndex',
    component: Prospects,
    options: {
      showCompanyFilter: true,
      headerShown: true,
      headerBackVisible: true,
      companyFilterMode: 'icon',
      title: global.t?.t('people', 'title', 'prospects'),
      showBottomToolBar: true,
    },
  },
  {
    name: 'ClientDetails',
    component: Client,
    options: {
      headerShown: true,
      headerBackVisible: true,
      title: global.t?.t('people', 'title', 'client'),
      showBottomToolBar: true,
    },
  },
];

export default customersRoutes;
