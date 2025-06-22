import Clients from '@controleonline/ui-customers/src/react/pages';
import CrmLayout from '@controleonline/ui-layout/src/react/layouts/CrmLayout';

import React from 'react';

const WrappedProfile = ({navigation, route}) => (
  <CrmLayout navigation={navigation} route={route}>
    <Clients navigation={navigation} route={route} />
  </CrmLayout>
);

const peopleRoutes = [
  {
    name: 'ClientsIndex',
    component: WrappedProfile,
    options: {
      headerShown: true,
      title: 'Clientes',
      headerBackButtonMenuEnabled: false,
    },
  },
];

export default peopleRoutes;
