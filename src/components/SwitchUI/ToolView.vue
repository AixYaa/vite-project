<template>
    <div>
        <el-switch 
        ref="switchRef"
        v-model="isDark" 
        :active-action-icon="Moon" 
        :inactive-action-icon="Sunny" 
        active-color="#409EFF"
        inactive-color="#222" 
        @change="onSwitchChange" />
    </div>
</template>
<script lang="ts" setup>
// import { ElButton, ElIcon } from 'element-plus'
import { ref, computed } from 'vue'
import { Moon, Sunny } from '@element-plus/icons-vue'
import { useUiModelStore } from '@/stores/uiModel'
const switchRef = ref()
const uiModelStore = useUiModelStore()
const ui = computed(() => uiModelStore.uiModel)
// const isDark = ref(ui.value === 'dark')
const isDark = computed({
  get: () => ui.value === 'dark',
  set: (val: boolean) => {
    uiModelStore.setUiModel(val ? 'dark' : 'day')
  }
})

function onSwitchChange(val: boolean) {
    const newUi = val ? 'dark' : 'day';
     const rect = switchRef.value.$el.getBoundingClientRect();
    if (!('startViewTransition' in document)) {
        uiModelStore.setUiModel(newUi);
        (document as Document).documentElement.setAttribute('data-theme', newUi);
        (document as Document).documentElement.classList.toggle('dark', newUi === 'dark');
        try { localStorage.setItem('ui-theme', newUi); } catch { }
        return;
    }
    // 用中心点做动画
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const radius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
    );
    const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${radius}px at ${x}px ${y}px)`
    ];
    const isDarkTheme = newUi === 'dark';
    const frames = isDarkTheme ? [...clipPath].reverse() : clipPath;
    const transition = document.startViewTransition(() => {
        uiModelStore.setUiModel(newUi);
        document.documentElement.setAttribute('data-theme', newUi);
        document.documentElement.classList.toggle('dark', newUi === 'dark');
        try { localStorage.setItem('ui-theme', newUi); } catch { }
    });
    transition.ready.then(() => {
        document.documentElement.animate(
            {
                clipPath: frames,
            },
            {
                duration: 500,
                easing: 'ease-in-out',
                fill: 'both',
                pseudoElement: isDarkTheme
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

:global(html[data-theme='dark']::view-transition-old(root)) {
    z-index: 9999;
}

:global(html[data-theme='day']::view-transition-new(root)) {
    z-index: 9999;
}

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