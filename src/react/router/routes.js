import Clients from '@controleonline/ui-customers/src/react/pages';
import Client from '@controleonline/ui-customers/src/react/pages/details';

const customersRoutes = [
  {
    name: 'ClientsIndex',
    component: Clients,
    options: {
      headerShown: true,
      title: 'Clientes',
      headerBackButtonMenuEnabled: false,
    },
  },
  {
    name: 'ClientDetails',
    component: Client,
    options: {
      headerShown: true,
      title: 'Cliente',
      headerBackButtonMenuEnabled: false,
    },
  },
];

export default customersRoutes;
