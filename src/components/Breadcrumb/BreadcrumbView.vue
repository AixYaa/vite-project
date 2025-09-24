<template>
    <div>
        <!-- 卡片式的面包屑 -->
        <div class="breadcrumb">
            <div
                v-for="crumb in crumbs"
                :key="crumb.path"
                class="crumb"
                :class="{ active: crumb.path === route.path }"
                @click="go(crumb.path)"
                title="点击跳转"
            >
                <span class="title">{{ crumb.title }}</span>
                <button
                    class="close"
                    aria-label="关闭"
                    title="关闭"
                    @click.stop="closeCrumb(crumb.path)"
                >
                    ×
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { RouteLocationNormalizedLoaded } from 'vue-router';

type Crumb = {
    path: string;
    title: string;
};

const STORAGE_KEY = 'app_breadcrumbs';

const route = useRoute();
const router = useRouter();

const crumbs = ref<Crumb[]>(loadFromStorage());

function loadFromStorage(): Crumb[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as Crumb[];
        // 兜底：确保结构正确
        return Array.isArray(parsed)
            ? parsed.filter((c) => typeof c?.path === 'string' && typeof c?.title === 'string')
            : [];
    } catch {
        return [];
    }
}

function saveToStorage(list: Crumb[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function getTitle(r: RouteLocationNormalizedLoaded): string {
    return (r.meta?.title as string) || (typeof r.name === 'string' ? r.name : '') || r.path;
}

function addOrPromoteCrumb(path: string, title: string) {
    const index = crumbs.value.findIndex((c) => c.path === path);
    if (index !== -1) {
        const [exist] = crumbs.value.splice(index, 1);
        crumbs.value.unshift(exist);
    } else {
        crumbs.value.unshift({ path, title });
    }
    saveToStorage(crumbs.value);
}

function go(path: string) {
    if (path && path !== route.path) {
        router.push(path);
    }
}

function closeCrumb(path: string) {
    const index = crumbs.value.findIndex((c) => c.path === path);
    if (index === -1) return;
    const isActive = path === route.path;
    crumbs.value.splice(index, 1);
    saveToStorage(crumbs.value);
    // 如果关闭的是当前活动面包屑，则跳转到下一个可用的面包屑
    if (isActive) {
        const target = crumbs.value[0];
        if (target) {
            router.push(target.path);
        } else {
            // 没有面包屑了，回到首页或根路径
            router.push('/');
        }
    }
}

// 进入页面时记录/提升当前面包屑
watch(
    () => route.fullPath,
    () => {
        addOrPromoteCrumb(route.path, getTitle(route));
    },
    { immediate: true }
);

// 可选：首次挂载时合并存储中的面包屑，确保当前页在最前
onMounted(() => {
    addOrPromoteCrumb(route.path, getTitle(route));
});
</script>

<style lang="scss" scoped>
.breadcrumb {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: transparent;
}

.crumb {
    display: inline-flex;
    align-items: center;
    max-width: 220px;
    padding: 6px 12px;
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
    cursor: pointer;
    user-select: none;
    transition: all 0.15s ease;

    .title {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 13px;
    }

    .close {
        margin-left: 8px;
        width: 18px;
        height: 18px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: none;
        background: transparent;
        border-radius: 50%;
        cursor: pointer;
        transition: background 0.15s ease, color 0.15s ease;
    }


    &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
    }
}

.crumb.active {
    border-color: #1677ff;
    // background: #f0f6ff;
    .title {
        color: #1677ff;
        font-weight: 600;
    }
}
</style>