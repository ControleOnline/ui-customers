import Clients from '@controleonline/ui-customers/src/react/pages';
import Client from '@controleonline/ui-customers/src/react/pages/details';
import { env } from '@env';

const customersRoutes = [
  {
    name: 'ClientsIndex',
    component: Clients,
    options: {
      headerShown: true,
      headerBackVisible: true,
      title: 'Clientes',
      showBottomToolBar: env.APP_TYPE === 'CRM',
    },
  },
  {
    name: 'ClientDetails',
    component: Client,
    options: {
      headerShown: true,
      headerBackVisible: true,
      title: 'Cliente',
      showBottomToolBar: env.APP_TYPE === 'CRM',
    },
  },
];

export default customersRoutes;
