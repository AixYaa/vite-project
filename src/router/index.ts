import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/Home/HomeView.vue'
import instance from '../axios/index.ts';
import { ElMessage } from 'element-plus';
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('../views/Home/Main/DashboardView.vue'),
          meta: { title: '仪表盘' }
        },
        {
          path: '/roles',
          name: 'roles',
          component: () => import('../views/Home/Main/RolesView.vue'),
          meta: { title: '角色管理' }
        }
      ]
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/login/LoginView.vue')
    }

  ],
})

// 导航守卫
router.beforeEach((to, from, next) => {
  // /api/verifyToken 验证token
  if (to.name !== 'login') {
    const token = localStorage.getItem('AixAdminToken');
    if (!token) {
      ElMessage.error('请先登录');
      console.log('没有token');
      next({ name: 'login' });
    } else {
      // 验证token
      instance.get('/verifyToken', { params: { token } }).then(() => {
        next();
      }).catch(() => {

        ElMessage.error('Token验证失败,请重新登录');
        console.log('验证token失败');
        next({ name: 'login' });
      });
    }
  } else {
    next();
  }
});
export default router;
