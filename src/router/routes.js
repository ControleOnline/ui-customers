export const routes = [
  {
    path: '/customers/',
    component: () =>  import ('@controleonline/quasar-layout-ui/src/layouts/AdminLayout.vue'),
    children: [
      {
        name: 'CustomersIndex',
        path: '',
        component: () =>  import ('../pages/Customer')
      },
      {
        name: 'CustomersDetails',
        path: 'id/:id',
        component: () =>  import ('../pages/Customer/Details.vue')
      },
    ]
  },
];