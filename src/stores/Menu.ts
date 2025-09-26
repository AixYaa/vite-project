import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchMyMenus } from '@/axios/menus'
import router from '@/router'
export const useMenuStore = defineStore('menu', () => {

    const showAside = ref<boolean>(true); // 是否显示侧边栏
    const showHeader = ref<boolean>(true); // 是否显示头部
    const collapse = ref<boolean>(true); // 侧边栏是否折叠
    const width = ref<number>(200); // 侧边栏宽度
    const miniWidth = ref<number>(64);
    const showSetting = ref<boolean>(false); // 菜单配置
    const showCollapseBtn = ref<boolean>(true); // 是否显示折叠按钮
    const AdminTitle = ref<string>('AixAdmin'); // 系统名称
    const toggleCollapseBtn = () => {
        showCollapseBtn.value = !showCollapseBtn.value;
    }

    const toggleCollapse = () => {
        collapse.value = !collapse.value;
    }

    const toggleShowSetting = () => {
        showSetting.value = !showSetting.value;
    }

    // 动态菜单与路由
    const dynamicAdded = ref<boolean>(false)
    const menuTree = ref<any[]>([])

    const mapRoute = (item: any) => {
        // 仅示范：把后端的 path 直接挂在 Home 的 children 下，由视图组件自己解析
        return {
            path: item.path,
            name: item.path.replace(/\//g, '_') || 'menu_' + Math.random().toString(36).slice(2),
            component: () => import('@/views/Home/Main/DashboardView.vue'),
            meta: { title: item.name }
        }
    }

    const addRoutesByMenus = (list: any[]) => {
        const routes: any[] = []
        const dfs = (items: any[]) => {
            for (const it of items) {
                if (it.path) routes.push(mapRoute(it))
                if (it.children?.length) dfs(it.children)
            }
        }
        dfs(Array.isArray(list) ? list : [])
        const parent = router.getRoutes().find(r => r.name === 'home')
        if (parent) {
            for (const r of routes) {
                if (!router.hasRoute(r.name)) {
                    router.addRoute('home', r)
                }
            }
        }
        dynamicAdded.value = true
    }

    const loadMyMenus = async () => {
        try {
            const { data } = await fetchMyMenus()
            if (data.success) {
                const items = Array.isArray(data.data) ? data.data : []
                const isTree = items.some((i:any) => Array.isArray(i.children))
                if (isTree) {
                    menuTree.value = items
                } else {
                    const groups = items.filter((n:any) => !n.path)
                    const leaves = items.filter((n:any) => !!n.path && !n.parentId)
                    const grouped = groups.map((g:any) => ({
                        ...g,
                        children: items.filter((n:any) => n.parentId === g._id && !!n.path)
                    }))
                    menuTree.value = [...grouped, ...leaves]
                }

                if (!dynamicAdded.value) addRoutesByMenus(menuTree.value)
            }
        } catch {
            // ignore
        }
    }

    return {
        // Define your state, getters, and actions here
        showAside,
        showHeader,
        collapse,
        width,
        miniWidth,
        showSetting,
        showCollapseBtn,
        AdminTitle,
        toggleCollapseBtn,
        toggleCollapse,
        toggleShowSetting,
        // dynamic
        menuTree,
        loadMyMenus
    }
},
    {
        persist: true // 持久化配置
    })