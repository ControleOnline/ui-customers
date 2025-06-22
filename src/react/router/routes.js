import Clients from '@controleonline/ui-customers/src/react/pages';
import Client from '@controleonline/ui-customers/src/react/pages/details';
import CrmLayout from '@controleonline/ui-layout/src/react/layouts/CrmLayout';

import React from 'react';

const WrappedClients = ({navigation, route}) => (
  <CrmLayout navigation={navigation} route={route}>
    <Clients navigation={navigation} route={route} />
  </CrmLayout>
);

const WrappedClient = ({navigation, route}) => (
  <Client navigation={navigation} route={route} />
);

const peopleRoutes = [
  {
    name: 'ClientsIndex',
    component: WrappedClients,
    options: {
      headerShown: false,
      title: 'Clientes',
      headerBackButtonMenuEnabled: false,
    },
  },
  {
    name: 'ClientDetails',
    component: WrappedClient,
    options: {
      headerShown: true,
      title: 'Cliente',
      headerBackButtonMenuEnabled: false,
    },
  },
];

export default peopleRoutes;
