import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
// 页面组件稍后补充
const Home = () => import('@/pages/Home.vue')
const ModelPage = () => import('@/pages/ModelPage.vue')
const MaterialSphere = () => import('@/pages/MaterialSphere.vue')

const routes: Array<RouteRecordRaw> = [
  { path: '/', name: 'Home', component: Home },
  { path: '/model/:name', name: 'ModelPage', component: ModelPage, props: true },
  { path: '/material-sphere', name: 'MaterialSphere', component: MaterialSphere }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 