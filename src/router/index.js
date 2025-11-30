import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'screen',
        name: 'StockScreen',
        component: () => import('../views/StockScreen.vue')
      },
      {
        path: 'suggestions',
        name: 'TradingSuggestions',
        component: () => import('../views/TradingSuggestions.vue')
      },
      {
        path: 'kline',
        name: 'StockKLine',
        component: () => import('../views/StockKLine.vue')
      },
      {
        path: 'stockpool',
        name: 'stockpool',
        component: () => import('../views/StockStrategy.vue')
      },
      {
        path: 'strategydisplay',
        name: 'strategydisplay',
        component: () => import('../views/StrategyDisplay.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router 