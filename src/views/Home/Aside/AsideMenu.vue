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
                <!-- 有子菜单的显示为下拉菜单 -->
                <el-sub-menu v-if="group.children && group.children.length > 0" :index="group.label">
                    <template #title>
                        <el-icon><component :is="group.icon" /></el-icon>
                        <span>{{ group.label }}</span>
                    </template>
                    <el-menu-item v-for="item in group.children" :key="item.index" :index="item.index">
                        <el-icon><component :is="item.icon" /></el-icon>
                        <span>{{ item.label }}</span>
                    </el-menu-item>
                </el-sub-menu>
                <!-- 没有子菜单的显示为普通菜单项 -->
                <el-menu-item v-else :index="(group as any).path || group.label">
                    <el-icon><component :is="group.icon" /></el-icon>
                    <span>{{ group.label }}</span>
                </el-menu-item>
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

// 构造菜单数据结构用于渲染
const menuGroups = computed(() => {
    const tree = menuStore.menuTree || []
    
    if (tree.length === 0) {
        // 如果没有任何菜单数据，使用兜底数据
        return [{
            label: '管理',
            icon: iconOf('Setting'),
            children: [
                { index: '/menus', label: '目录管理', icon: iconOf('Menu') },
                { index: '/roles', label: '角色管理', icon: iconOf('User') },
                { index: '/permissions', label: '权限管理', icon: iconOf('Lock') }
            ]
        }]
    }
    
    // 处理所有菜单项
    return tree.map((item: any) => {
        // 如果有子菜单，处理为下拉菜单
        if (Array.isArray(item.children) && item.children.length > 0) {
            return {
                label: item.name,
                icon: iconOf(item.icon),
                children: item.children.filter((c: any) => !!c.path).map((child: any) => ({
                    index: child.path,
                    label: child.name,
                    icon: iconOf(child.icon)
                }))
            }
        }
        // 如果没有子菜单但有路径，处理为独立菜单项
        else if (item.path) {
            return {
                label: item.name,
                icon: iconOf(item.icon),
                path: item.path,
                children: []
            }
        }
        // 如果没有子菜单也没有路径，跳过
        return null
    }).filter((item): item is NonNullable<typeof item> => item !== null)
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