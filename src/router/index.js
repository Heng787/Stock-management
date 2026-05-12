import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('../views/MainLayout.vue'),
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('../views/DashboardView.vue'),
        },
        {
          path: 'inventory',
          name: 'inventory',
          component: () => import('../views/InventoryView.vue'),
        },
        {
          path: 'sales',
          name: 'sales',
          component: () => import('../views/SalesView.vue'),
        },
        {
          path: 'purchases',
          name: 'purchases',
          component: () => import('../views/PurchasesView.vue'),
        },
        {
          path: 'customers',
          name: 'customers',
          component: () => import('../views/CustomersView.vue'),
        },
        {
          path: 'warehouses',
          name: 'warehouses',
          component: () => import('../views/WarehousesView.vue'),
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('../views/SettingsView.vue'),
        },
        {
          path: 'suppliers',
          name: 'suppliers',
          component: () => import('../views/SuppliersView.vue'),
        },
        {
          path: 'staff',
          name: 'staff',
          component: () => import('../views/UsersView.vue'),
        },
        {
          path: 'transactions',
          name: 'transactions',
          component: () => import('../views/TransactionsView.vue'),
        },
        {
          path: 'logs',
          name: 'logs',
          component: () => import('../views/LogsView.vue'),
        },
        {
          path: 'analytics',
          name: 'analytics',
          component: () => import('../views/AnalyticsView.vue'),
        },
      ],
    },
  ],
})

export default router
