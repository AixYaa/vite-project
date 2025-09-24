<template>
    <div>
        <div class="menu-header">
            Admin
        </div>
        <el-menu class="el-menu-vertical-demo" :collapse="menuStore.collapse" @open="handleOpen" @close="handleClose"
            :default-active="router.currentRoute.value.path" router>
            <el-menu-item v-for="item in menuList" :key="item.index" :index="item.index">
                <el-icon>
                    <component :is="item.icon" />
                </el-icon>
                <span>{{ item.label }}</span>
            </el-menu-item>
        </el-menu>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useMenuStore } from '@/stores/Menu'
import router from '@/router'
import { Odometer,Operation } from '@element-plus/icons-vue'

const menuList = [
    { index: '/dashboard', label: '仪表盘', icon: Odometer },
    { index: '/roles', label: '角色管理', icon: Operation }
]
const menuStore = useMenuStore()

const handleOpen = (key: string, keyPath: string[]) => {
    console.log(key, keyPath)
}
const handleClose = (key: string, keyPath: string[]) => {
    console.log(key, keyPath)
}
</script>

<style scoped lang="scss">
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