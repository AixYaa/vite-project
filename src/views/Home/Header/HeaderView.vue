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
            <el-avatar :src="profile.avatar || defaultAvatar" @click="openProfileDialog" style="cursor: pointer;" />
            <span class="username">{{ profile.username || 'User' }}</span>
        </div>
    </div>
    <el-drawer v-model="profileDrawerVisible" title="编辑个人资料" :with-header="true" size="420px">
        <el-form :model="editForm" label-width="80px">
            <el-form-item label="用户名">
                <el-input v-model="editForm.username" placeholder="请输入用户名" />
            </el-form-item>
            <el-form-item label="头像">
                <div style="display:flex; align-items:center; gap:12px; flex-wrap: wrap;">
                    <el-upload
                        :show-file-list="false"
                        :auto-upload="false"
                        :on-change="handleSelectFile"
                        :limit="1"
                        accept="image/*"
                    >
                        <el-button type="primary" plain>选择图片</el-button>
                    </el-upload>
                    <!-- <el-input v-model="editForm.avatar" placeholder="或粘贴图片URL/Base64" style="width: 240px;" /> -->
                    <el-avatar :src="editForm.avatar || defaultAvatar" size="large" />
                </div>
            </el-form-item>
        </el-form>
        <template #footer>
            <div style="text-align:right; width:100%;">
                <el-button @click="profileDrawerVisible = false">取消</el-button>
                <el-button type="primary" :loading="saving" @click="saveProfile">保存</el-button>
            </div>
        </template>
    </el-drawer>
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
import { getProfile, updateProfile, uploadAvatar } from '@/axios/auth';
import { ref, onMounted } from 'vue';
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

// 用户资料
const defaultAvatar = 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
const profile = ref<{ username?: string; avatar?: string }>({})
const profileDrawerVisible = ref(false)
const saving = ref(false)
const editForm = ref<{ username?: string; avatar?: string }>({})
const selectedFile = ref<File | null>(null)

const handleSelectFile = (file: any) => {
    const raw: File | null = file?.raw || null
    if (!raw) return
    const isLt2M = raw.size / 1024 / 1024 < 2
    if (!isLt2M) {
        ElMessage.error('选择图片大小不能超过 2MB!')
        return
    }
    selectedFile.value = raw
    const reader = new FileReader()
    reader.onload = () => {
        editForm.value.avatar = String(reader.result || '')
        ElMessage.success('已选择图片，预览已更新')
    }
    reader.readAsDataURL(raw)
}

const loadProfile = async () => {
    try {
        const res = await getProfile()
        if (res.data?.success) {
            profile.value = {
                username: res.data.data.username,
                avatar: res.data.data.avatar
            }
        }
    } catch (e) {
        // ignore
    }
}

const openProfileDialog = () => {
    editForm.value = { ...profile.value }
    profileDrawerVisible.value = true
}

const saveProfile = async () => {
    try {
        saving.value = true
        let avatarUrl = editForm.value.avatar
        if (selectedFile.value) {
            const up = await uploadAvatar(selectedFile.value)
            if (up.data?.success) {
                avatarUrl = up.data.data.url
            } else {
                throw new Error('上传失败')
            }
        }

        const res = await updateProfile({
            username: editForm.value.username,
            avatar: avatarUrl
        })
        if (res.data?.success) {
            profile.value = {
                username: res.data.data.username,
                avatar: res.data.data.avatar
            }
            ElMessage.success('保存成功')
            profileDrawerVisible.value = false
            selectedFile.value = null
        }
    } catch (e) {
        ElMessage.error('保存失败')
    } finally {
        saving.value = false
    }
}

onMounted(() => {
    loadProfile()
})
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