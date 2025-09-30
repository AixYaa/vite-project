<template>
    <div>
        <!-- 卡片式的面包屑 -->
        <div class="breadcrumb">
            <el-scrollbar ref="scrollbarRef">
                <el-segmented v-model="segmented" :options="headerList" size="large" @change="handleSegmentChange"
                    ref="segmentedRef">
                    <template #default="scope">
                        <el-tooltip content="双击关闭" placement="bottom" :show-after="1000">
                            <div class="segmented_item" @dblclick.stop.prevent="close(scope.item.value)">
                                <el-icon size="18">
                                    <component :is="getIcon(scope.item.value)" />
                                </el-icon>
                                <span>{{ scope.item.label }}</span>
                                <el-icon size="18" v-show="headerList.length != 1"
                                    @click.stop.prevent="close(scope.item.value)" class="close-icon">
                                    <Close />
                                </el-icon>
                            </div>
                        </el-tooltip>
                    </template>
                </el-segmented>
            </el-scrollbar>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Close } from '@element-plus/icons-vue';
import { useMenuStore } from '@/stores/Menu'
import type { RouteLocationNormalizedLoaded } from 'vue-router';
import type { ScrollbarInstance, SegmentedInstance } from 'element-plus';

const menuStore = useMenuStore()

// 定义头部导航项类型
interface HeaderItem {
    label: string;
    value: string;
}

const STORAGE_KEY = 'app_breadcrumbs';
const HISTORY_KEY = 'app_breadcrumb_history';

const route = useRoute();
const router = useRouter();

// 当前激活的分段选项
const segmented = ref<string>(route.path);
// 头部导航列表
const headerList = ref<HeaderItem[]>(loadFromStorage());
// 路由访问历史记录
const routeHistory = ref<string[]>(loadHistoryFromStorage());
// 滚动条引用
const scrollbarRef = ref<ScrollbarInstance>();
// 分段组件引用
const segmentedRef = ref<SegmentedInstance>();
let animationFrameId: number | null = null;

// 支持正负号、空格、小数的正则
const regex = /translateX\(\s*([+-]?\d+\.?\d*)\s*px\)/;
function getIcon(value: string) {
    // 先根据路径查找菜单项
    let icon = '';
    menuStore.menuTree.forEach(item => {
        // 先查找子项匹配路由的图标
        item?.children?.find((child: { path: string; icon: any; }) => {
            if (child.path === value) {
                icon = child.icon || '';
            }
        })
        // 如果子项没有匹配，再查找父项匹配路由的图标
        if (icon == '' && item.path == value) {
            icon = item.icon || '';
        }
    })
    return icon || 'Odometer'; // 兜底图标 仪表盘默认图标
}
// 从localStorage加载头部导航列表
function loadFromStorage(): HeaderItem[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as HeaderItem[];
        // 兜底：确保结构正确
        return Array.isArray(parsed)
            ? parsed.filter((item) => typeof item?.value === 'string' && typeof item?.label === 'string')
            : [];
    } catch {
        return [];
    }
}

// 从localStorage加载路由历史
function loadHistoryFromStorage(): string[] {
    try {
        const raw = localStorage.getItem(HISTORY_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as string[];
        // 兜底：确保结构正确
        return Array.isArray(parsed)
            ? parsed.filter((item) => typeof item === 'string')
            : [];
    } catch {
        return [];
    }
}

// 保存头部导航列表到localStorage
function saveToStorage(list: HeaderItem[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// 保存路由历史到localStorage
function saveHistoryToStorage(list: string[]): void {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
}

// 获取路由标题
function getTitle(r: RouteLocationNormalizedLoaded): string {
    return (r.meta?.title as string) || (typeof r.name === 'string' ? r.name : '') || r.path;
}

// 初始化页面
onMounted(() => {
    // 添加初始路由到头部导航
    const initialItem: HeaderItem = {
        label: getTitle(route),
        value: route.path
    };
    // 设置鼠标滚轮滚动触发滚动条
    // 获取滚动容器元素
    const scrollWrapper = scrollbarRef.value?.wrapRef || document.body;
    // 添加CSS过渡效果使滚动更丝滑
    scrollWrapper.style.transition = 'scroll-left 0.1s ease-out';
    // 监听鼠标滚轮事件
    scrollWrapper.addEventListener('wheel', handleWheel);

    if (!headerList.value.some(item => item.value === initialItem.value)) {
        headerList.value.push(initialItem);
        segmented.value = initialItem.value;
        updateRouteHistory(initialItem.value);
        saveToStorage(headerList.value);

        // 初始化滚动到选中项
        setTimeout(() => {
            scrollToSelected();
        }, 100);
    }
});
onUnmounted(() => {
    // 清理事件监听和动画帧
    const scrollWrapper = scrollbarRef.value?.wrapRef || document.body;
    if (scrollWrapper) {
        scrollWrapper.removeEventListener('wheel', handleWheel);
    }
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
});
// 带惯性效果的滚动处理函数
const handleWheel = (e: { preventDefault: () => void; deltaY: number; }) => {
    e.preventDefault();
    const scrollWrapper = scrollbarRef.value?.wrapRef || document.body;

    // 基础滚动速度 (可根据需要调整)
    const baseSpeed = 1.2;
    // 计算滚动距离
    let scrollDistance = e.deltaY * baseSpeed;

    // 惯性滚动效果
    const startScrollLeft = scrollWrapper.scrollLeft;
    const startTime = performance.now();
    const duration = 300; // 惯性持续时间(ms)

    // 如果已有动画帧，先取消
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }

    // 平滑滚动动画
    const smoothScroll = (timestamp: number) => {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // 缓动函数 - 使滚动先快后慢，更自然
        const easeOut = 1 - Math.pow(1 - progress, 3);

        scrollWrapper.scrollLeft = startScrollLeft + scrollDistance * easeOut;

        if (progress < 1) {
            animationFrameId = requestAnimationFrame(smoothScroll);
        } else {
            animationFrameId = null;
        }
    };

    animationFrameId = requestAnimationFrame(smoothScroll);
};
// 监听路由变化
watch(() => route.path, async (newPath) => {
    const newItem: HeaderItem = {
        label: getTitle(route),
        value: newPath
    };

    // 更新当前激活项
    segmented.value = newItem.value;

    // 如果不在头部列表中，则添加
    if (!headerList.value.some(item => item.value === newItem.value)) {
        headerList.value.push(newItem);
        saveToStorage(headerList.value);
    }

    // 更新访问历史
    updateRouteHistory(newItem.value);

    // 等待 DOM 更新完成
    await nextTick();

    // 滚动到当前选中项
    scrollToSelected();
});

// 滚动到选中项
function scrollToSelected() {
    if (segmentedRef.value && scrollbarRef.value) {
        const el = segmentedRef.value.$el;
        const selectedEl = el.querySelector('.el-segmented__item-selected');
        if (selectedEl && selectedEl.style.transform) {
            let transform = selectedEl.style.transform;
            const match = transform.match(regex);
            if (match && match[1]) {
                const scrollLeft = Number(match[1]);
                scrollbarRef.value.setScrollLeft(scrollLeft);
            }
        }
    }
}

// 处理分段选择变化
const handleSegmentChange = (value: string): void => {
    if (value && value !== route.path) {
        router.push(value);
        updateRouteHistory(value);
    }
};

// 关闭当前选项
const close = (value: string): void => {
    // 确保列表长度大于1
    if (headerList.value.length <= 1) return;

    // 过滤掉要关闭的项
    const newHeaderList = headerList.value.filter(item => item.value !== value);
    // 如果关闭的是当前激活项，需要跳转
    if (segmented.value === value) {
        // 找到历史记录中最后一个存在于新列表中的项
        const lastValidHistory = routeHistory.value
            .filter(item => item !== value);
        const lastpath = lastValidHistory[lastValidHistory.length - 1];

        // 如果有有效的历史记录项
        if (lastpath) {
            const targetItem = newHeaderList.find(item => item.value === lastpath);
            if (targetItem) {
                router.push(targetItem.value);
                segmented.value = lastpath;
            }
        }
        // 如果没有历史记录但还有其他项，跳转第一个
        else if (newHeaderList.length > 0) {
            const firstItem = newHeaderList[0];
            router.push(firstItem.value);
            segmented.value = firstItem.value;
        }
        // 如果所有项都被关闭，跳转默认页
        else {
            const defaultPath = '/dashboard';
            router.push(defaultPath);
            const defaultItem: HeaderItem = {
                label: '仪表盘',
                value: defaultPath
            };
            newHeaderList.push(defaultItem);
            segmented.value = defaultPath;
        }
    }
    // 更新头部列表
    headerList.value = newHeaderList;
    saveToStorage(newHeaderList);

    // 更新历史记录（移除关闭的项）
    routeHistory.value = routeHistory.value.filter(item => item !== value);
    saveHistoryToStorage(routeHistory.value);
};

// 更新路由访问历史
const updateRouteHistory = (value: string): void => {
    // 移除已存在的相同项
    routeHistory.value = routeHistory.value.filter(item => item !== value);
    // 添加到历史记录末尾
    routeHistory.value.push(value);
    // 保存到localStorage
    saveHistoryToStorage(routeHistory.value);
};
</script>

<style lang="scss" scoped>
.breadcrumb {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 8px;
    padding: 8px 20px;

    .el-scrollbar {
        width: 100%;

        :deep(.el-scrollbar__wrap) {
            overflow-x: auto;
            overflow-y: hidden;

            :deep(.el-scrollbar__view) {
                display: inline-flex;
            }
        }
    }

    .el-segmented {
        padding: 0;
        background-color: initial;
        :deep(.el-segmented__group) {
            gap: 15px;
        }
        .el-segmented__item {
            &:hover {
                .close-icon {
                    transform: translateX(0);
                }
            }
        }
    }

    .segmented_item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        column-gap: 5px;
        padding: 0 5px;
        min-height: 40px;

        .el-icon {
            margin-top: 2px;
        }

        .close-icon {
            cursor: pointer;
            transition: all 0.2s;
            transform: translateX(20px);

            &:hover {
                color: #ff4d4f;
            }
        }
    }
}
</style>