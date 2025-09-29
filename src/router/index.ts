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
router.beforeEach(async (to, from, next) => {
  if (to.name !== 'login') {
    const token = localStorage.getItem('AixAdminToken');
    if (!token) {
      ElMessage.error('请先登录');
      next({ name: 'login' });
    } else {
      try {
        // 调用后端获取用户信息，验证token有效性
        await instance.get('/auth/profile');
        const menuStore = useMenuStore();
        
        // 加载并注入动态菜单对应的路由，仅执行一次
        await menuStore.loadMyMenus();
        
        // 检查用户是否有访问当前路由的权限
        if (to.path !== '/dashboard' && to.path !== '/') {
          const hasPermission = await checkRoutePermission(to.path, menuStore.menuTree);
          if (!hasPermission) {
            ElMessage.error('您没有访问此页面的权限');
            next({ name: 'dashboard' }); // 重定向到仪表盘
            return;
          }
        }
        
        next();
      } catch {
        ElMessage.error('登录已过期，请重新登录');
        localStorage.removeItem('AixAdminToken');
        next({ name: 'login' });
      }
    }
  } else {
    next();
  }
});

// 检查路由权限的函数
type MenuNode = { path?: string; children?: MenuNode[] };

const checkRoutePermission = async (path: string, menuTree: MenuNode[]): Promise<boolean> => {
  // 递归检查菜单树中是否包含该路径
  const checkInTree = (items: MenuNode[]): boolean => {
    for (const item of items) {
      if (item.path === path) {
        return true;
      }
      if (item.children && item.children.length > 0) {
        if (checkInTree(item.children)) {
          return true;
        }
      }
    }
    return false;
  };
  
  return checkInTree(menuTree);
};
export default router;
