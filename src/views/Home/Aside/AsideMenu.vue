<template>
    <div class="Menus1"> 
        <div class="menu-header">
            Admin
        </div>
        <el-menu class="el-menu-vertical-demo" :collapse="menuStore.collapse" @open="handleOpen" @close="handleClose"
            :default-active="router.currentRoute.value.path" router>
            <el-menu-item :index="'/dashboard'">
                <el-icon><component :is="iconOf('Odometer')" /></el-icon>
                <span>仪表盘</span>
            </el-menu-item>

            <template v-for="group in menuGroups" :key="group.label">
                <el-sub-menu :index="group.label">
                    <template #title>
                        <el-icon><component :is="group.icon" /></el-icon>
                        <span>{{ group.label }}</span>
                    </template>
                    <el-menu-item v-for="item in group.children" :key="item.index" :index="item.index">
                        <el-icon><component :is="item.icon" /></el-icon>
                        <span>{{ item.label }}</span>
                    </el-menu-item>
                </el-sub-menu>
            </template>
        </el-menu>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMenuStore } from '@/stores/Menu'
import router from '@/router'
import * as Icons from '@element-plus/icons-vue'
const menuStore = useMenuStore()

// 构造最终菜单：主导航“管理”下挂后端返回的二级项；无数据时兜底静态默认项
const iconOf = (name?: string) => (Icons as any)[name as string] || (Icons as any).Operation

// 构造“分组 + 二级项”的数据结构用于渲染
const menuGroups = computed(() => {
    const tree = menuStore.menuTree || []
    const groups = tree.filter((n:any) => !n.path)
    if (groups.length) {
        return groups.map((g:any) => ({
            label: g.name,
            icon: iconOf(g.icon),
            children: (Array.isArray(g.children) ? g.children : []).filter((c:any)=>!!c.path).map((m:any)=>({
                index: m.path,
                label: m.name,
                icon: iconOf(m.icon)
            }))
        }))
    }
    // 后端没有分组时兜底为一个“管理”分组
    return [{
        label: '管理',
        icon: iconOf('Setting'),
        children: [
            { index: '/menus', label: '目录管理', icon: iconOf('Menu') },
            { index: '/roles', label: '角色管理', icon: iconOf('User') },
            { index: '/permissions', label: '权限管理', icon: iconOf('Lock') }
        ]
    }]
})

const handleOpen = (key: string, keyPath: string[]) => {
    console.log(key, keyPath)
}
const handleClose = (key: string, keyPath: string[]) => {
    console.log(key, keyPath)
}
</script>

<style scoped lang="scss">
.el-menu {
    height: 100vh;
}
.menu-header {
    height: 60px;
    line-height: 60px;
    text-align: center;
    font-size: 18px;
    font-weight: bold;
    color: #fff;
    background-color: #409eff;
}

.el-menu-vertical-demo:not(.el-menu--collapse) {
    width: 200px;
    min-height: 400px;
}
</style>