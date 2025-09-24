<template>
    <div
        style="position: fixed; right: 24px; bottom: 24px; z-index: 10000; display: flex; flex-direction: column; gap: 12px;">
        <el-button circle :type="ui === 'day' ? 'primary' : 'info'" size="large" @click="toggleTheme">
            <Transition name="icon" mode="out-in">
                <el-icon v-if="ui === 'day'" key="moon">
                    <Moon />
                </el-icon>
                <el-icon v-else key="sun">
                    <Sunny />
                </el-icon>
            </Transition>
        </el-button>
    </div>
</template>
<script lang="ts" setup>
// import { ElButton, ElIcon } from 'element-plus'
import { Moon, Sunny } from '@element-plus/icons-vue'
import { useUiModelStore } from '@/stores/uiModel'
import { computed } from 'vue'
const uiModelStore = useUiModelStore()
const ui = computed(() => uiModelStore.uiModel)

function toggleTheme(e: MouseEvent) {
    const newUi = ui.value === 'day' ? 'dark' : 'day';
    if (!('startViewTransition' in document)) {
        uiModelStore.setUiModel(newUi);
        (document as Document).documentElement.setAttribute('data-theme', newUi);
        return;
    }
    const transition = (document as any).startViewTransition(() => {
        uiModelStore.setUiModel(newUi);
        document.documentElement.setAttribute('data-theme', newUi);
        // Sync Element Plus dark class for component theming
        document.documentElement.classList.toggle('dark', newUi === 'dark');
        try { localStorage.setItem('ui-theme', newUi); } catch {}
    });
    transition.ready.then(() => {
        const x = e.clientX;
        const y = e.clientY;
        const radius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y)
        );
        const clipPath = [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${radius}px at ${x}px ${y}px)`
        ];
        const isDark = newUi === 'dark';
        const frames = isDark ? [...clipPath].reverse() : clipPath;
        document.documentElement.animate(
            {
                clipPath: frames,
            },
            {
                duration: 500,
                easing: 'ease-in-out',
                fill: 'both',
                pseudoElement: isDark
                    ? '::view-transition-old(root)'
                    : '::view-transition-new(root)',
            }
        );
    });
}
</script>

<style scoped>
:global(::view-transition-old(root)),
:global(::view-transition-new(root)) {
    animation: none;
}

:global(html[data-theme='dark']::view-transition-old(root)) { z-index: 9999; }
:global(html[data-theme='day']::view-transition-new(root)) { z-index: 9999; }

.icon-enter-active,
.icon-leave-active {
    transition: opacity 220ms ease, transform 220ms ease;
}
.icon-enter-from,
.icon-leave-to {
    opacity: 0;
    transform: scale(0.9) rotate(-8deg);
}
.icon-enter-to,
.icon-leave-from {
    opacity: 1;
    transform: scale(1) rotate(0deg);
}
</style>