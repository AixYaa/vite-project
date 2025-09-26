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
  if (to.name !== 'login') {
    const token = localStorage.getItem('AixAdminToken');
    if (!token) {
      ElMessage.error('请先登录');
      next({ name: 'login' });
    } else {
      // 调用后端获取用户信息，验证token有效性
      instance.get('/auth/profile').then(() => {
        next();
      }).catch(() => {
        ElMessage.error('登录已过期，请重新登录');
        localStorage.removeItem('AixAdminToken');
        next({ name: 'login' });
      });
    }
  } else {
    next();
  }
});
export default router;
