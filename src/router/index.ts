import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import Home from '../views/Home.vue'

Vue.use(VueRouter)
export default function createRouter() {

  const routes: Array<RouteConfig> = [
    {
      path: '/',
      name: 'Home',
      component: () => import('@/views/Home.vue'),
    },
    {
      path: '/edit/:doc',
      name: 'Editor',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('@/views/Editor.vue'),
      props: true,
    },
    {
      path: '/help',
      name: 'Help',
      component: () => import('@/views/Help.vue'),
    }
  ]

  console.log(import.meta.env.BASE_URL);

  const router = new VueRouter({
    mode: 'hash',
    base: import.meta.env.BASE_URL,
    routes
  })

  return router
}
