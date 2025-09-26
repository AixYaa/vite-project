<template>
    <div class="headerView">
        <div class="collapse" v-if="menuStore.showCollapseBtn" @click="menuStore.toggleCollapse">
            <el-icon>
                <Menu />
            </el-icon>
        </div>
        <div>
            <span>{{ menuStore.AdminTitle }}</span>
        </div>
        <div class="user-info">
            <el-icon @click="handleSetting">
                <Setting />
            </el-icon>
            <ToolView />
            <el-avatar src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
            <span class="usesrname">Username</span>
        </div>
    </div>
    <el-drawer v-model="menuStore.showSetting" title="I am the title" :with-header="false">
        <span>设置</span>
        <el-form>
            <el-form-item label="主题">
                <ToolView />
            </el-form-item>
            <el-form-item label="侧边栏显示">
                <el-switch v-model="menuStore.showAside" active-color="#13ce66" inactive-color="#ff4949" />
            </el-form-item>
            <el-form-item label="Admin标题">
                <el-input v-model="menuStore.AdminTitle" />
            </el-form-item>
        </el-form>
        <template #footer>
            <div style="text-align: right; margin: 10px 0;">
                <el-button size="small" @click="logout">退出登录</el-button>
            </div>
        </template>
    </el-drawer>
</template>

<script setup lang="ts">
import ToolView from '@/components/SwitchUI/ToolView.vue';
import { Menu, Setting } from '@element-plus/icons-vue';
import { useMenuStore } from '@/stores/Menu';
import { ElMessage } from 'element-plus';
import router from '@/router';
import instance from '@/axios/index';
const menuStore = useMenuStore();

const handleSetting = () => {
    // 打开设置抽屉
    menuStore.toggleShowSetting();
};

const logout = async () => {
    try {
        // 调用后端登出，服务端会清理Redis会话并加入黑名单
        await instance.post('/auth/logout');
    } catch (e) {
        // 忽略登出错误，继续本地清理
    }
    // 本地清理并跳转
    localStorage.removeItem('AixAdminToken');
    menuStore.showSetting = false;
    router.replace('/login');
    ElMessage.success('退出登录成功');
}
</script>

<style lang="scss" scoped>
.headerView {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;

    .user-info {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 5px 10px;

        .username {
            font-weight: 500;
        }
    }
}
</style>