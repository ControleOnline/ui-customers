export const routes = [
  {
    path: '/customers/',
    component: () =>  import ('@controleonline/ui-layout/src/layouts/AdminLayout.vue'),
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
      {
        name: "OrderDetails",
        path: "l_costumers",
        component: () => import("../pages/Orders/Lucas_costumers"),
      },      
    ]
  },
];