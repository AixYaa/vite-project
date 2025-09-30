<script setup lang="ts">
import Header from '@/views/Home/Header/HeaderView.vue';
import AsideMenu from '@/views/Home/Aside/AsideMenu.vue';
import { useMenuStore } from '@/stores/Menu';
import { Setting } from '@element-plus/icons-vue';
import router from '@/router';
import Breadcrumb from '@/components/Breadcrumb/BreadcrumbView.vue';
import { RouterView } from 'vue-router';
const menuStore = useMenuStore();
console.log(router.currentRoute.value.matched);

</script>

<template>
    <div class="common-layout">
        <el-container>
            <el-aside style="height:100vh;" :width="menuStore.collapse ? menuStore.miniWidth + 'px' : menuStore.width + 'px'"
                v-if="menuStore.showAside">
                <AsideMenu />
            </el-aside>
            <el-container>
                <el-header v-if="menuStore.showHeader">
                    <Header />
                </el-header>
                <Breadcrumb />
                <el-main style="padding: 0; height: calc(100vh - 140px); overflow: hidden;">
                    <RouterView v-slot="{ Component, route }">
                        <Transition name="fade" mode="out-in">
                            <component :is="Component" :key="route.fullPath" />
                        </Transition>
                    </RouterView>
                    <!-- 设置按钮 -->
                     <div class="setting" @click="menuStore.toggleShowSetting()">
                        <el-icon size="22">
                            <Setting />
                        </el-icon>
                     </div>
                </el-main>
            </el-container>
        </el-container>
    </div>
</template>

<style lang="scss" scoped>
.el-aside {
    transition: width 0.3s cubic-bezier(.77, 0, .18, 1);
    /* 可选：overflow隐藏内容溢出 */
    height: 100vh;
    overflow: hidden;
}

/* 页面主内容淡入淡出动画 */
:deep(.fade-enter-active),
:deep(.fade-leave-active) {
    transition: opacity 0.25s ease, transform 0.25s ease;
}
:deep(.fade-enter-from),
:deep(.fade-leave-to) {
    opacity: 0;
    transform: translateY(6px);
}
.setting {
    z-index: 1000;
    position: absolute;
    bottom: 15vh;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px;
    border-radius: 5px 0 0 5px;
    background-color: var(--bg-color);
    color: var(--text-color);
    opacity: 1;
    cursor: pointer;
    transition: all 0.3s ease;
}
.setting:hover {
    opacity: 0.8;
}
.setting .el-icon {
    animation: rotate 3s linear infinite;
}
@keyframes rotate {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}
</style>