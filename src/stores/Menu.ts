import { defineStore } from 'pinia'
import { ref } from 'vue'
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
        toggleShowSetting
    }
},
    {
        persist: true // 持久化配置
    })