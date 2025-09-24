import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiModelStore = defineStore('uiModel',
    () => {
        const uiModel = ref<'day' | 'dark'>('day')
        /**
         * 切换主题
         */
        function toggleUiModel() {
            if (uiModel.value === 'day') {
                uiModel.value = 'dark'
            } else {
                uiModel.value = 'day'
            }
            document.documentElement.setAttribute('data-theme', uiModel.value)
        }
        /**
         * 设置主题
         * @param model 'day'|'dark'
         */
        function setUiModel(model: 'day' | 'dark') {
            uiModel.value = model
            document.documentElement.setAttribute('data-theme', model)
        }


        return { uiModel, setUiModel, toggleUiModel }
    },
    {
        persist: true // 持久化配置
    })