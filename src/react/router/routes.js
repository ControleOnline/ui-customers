import Clients from '@controleonline/ui-customers/src/react/pages/clients';
import Prospects from '@controleonline/ui-customers/src/react/pages/prospects';
import Client from '@controleonline/ui-customers/src/react/pages/details';
import { env } from '@env';

const customersRoutes = [
  {
    name: 'ClientsIndex',
    component: Clients,
    options: {
      showCompanyFilter: true,
      headerShown: true,
      headerBackVisible: true,
      companyFilterMode: 'icon',
      title: 'Clientes',
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
      title: 'Prospects',
      showBottomToolBar: true,
    },
  },
  {
    name: 'ClientDetails',
    component: Client,
    options: {
      headerShown: true,
      headerBackVisible: true,
      title: 'Cliente',
      showBottomToolBar: true,
    },
  },
];

export default customersRoutes;
