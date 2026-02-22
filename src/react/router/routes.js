import Clients from '@controleonline/ui-customers/src/react/pages';
import Client from '@controleonline/ui-customers/src/react/pages/details';

const customersRoutes = [
  {
    name: 'ClientsIndex',
    component: Clients,
    options: {
      headerShown: true,
      headerBackVisible: true,
      title: 'Clientes',
      
    },
  },
  {
    name: 'ClientDetails',
    component: Client,
    options: {
      headerShown: true,
      headerBackVisible: false,
      title: 'Cliente',
    },
  },
];

export default customersRoutes;
