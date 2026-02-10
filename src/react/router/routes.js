import Clients from '@controleonline/ui-customers/src/react/pages';
import Client from '@controleonline/ui-customers/src/react/pages/details';
import DefaultLayout from '@controleonline/ui-layout/src/react/layouts/DefaultLayout';

import React from 'react';

const WrappedClients = ({navigation, route}) => (
  <DefaultLayout navigation={navigation} route={route}>
    <Clients navigation={navigation} route={route} />
  </DefaultLayout>
);

const WrappedClient = ({navigation, route}) => (
  <Client navigation={navigation} route={route} />
);

const peopleRoutes = [
  {
    name: 'ClientsIndex',
    component: WrappedClients,
    options: {
      headerShown: true,
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
