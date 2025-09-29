import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/Home/HomeView.vue'
import instance from '../axios/index.ts';
import { useMenuStore } from '@/stores/Menu'
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
        ,
        {
          path: '/permissions',
          name: 'permissions',
          component: () => import('../views/Home/Main/PermissionsView.vue'),
          meta: { title: '权限管理' }
        }
        ,
        {
          path: '/menus',
          name: 'menus',
          component: () => import('../views/Home/Main/MenusView.vue'),
          meta: { title: '目录管理' }
        },
        {
          path: '/users',
          name: 'users',
          component: () => import('../views/Home/Main/UsersView.vue'),
          meta: { title: '用户管理' }
        }
      ]
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/login/LoginView.vue')
    },
    {
      path: '/404',
      name: '404',
      component: () => import('../views/404/NotFoundView.vue'),
      meta: { title: '页面未找到' }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('../views/404/NotFoundView.vue'),
      meta: { title: '页面未找到' }
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
      instance.get('/auth/profile').then(async () => {
        const menuStore = useMenuStore()
        // 加载并注入动态菜单对应的路由，仅执行一次
        await menuStore.loadMyMenus()
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
