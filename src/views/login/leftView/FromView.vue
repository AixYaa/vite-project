<template>
    <div class="fromView">
        <h2>登录</h2>
        <el-form ref="formRef" style="max-width: 600px" :model="formData" label-position="top" label-width="auto"
            class="demo-ruleForm">
            <el-form-item label="用户名" prop="username" :rules="[{ required: true, message: '用户名是必填项' }]">
                <el-input v-model="formData.username" type="text" autocomplete="off" />
            </el-form-item>
            <el-form-item label="密码" prop="password" :rules="[{ required: true, message: '密码是必填项' }]">
                <el-input v-model="formData.password" type="password" autocomplete="off" />
            </el-form-item>
            <el-form-item>
                <el-button type="primary" native-type="button" @click="handleLogin(formRef)">登录</el-button>
                <el-button native-type="button" @click="resetForm(formRef)">重置</el-button>
            </el-form-item>
        </el-form>
    </div>
</template>

<script lang="ts" setup>
import router from '@/router';
import instance from '../../../axios/index';
import { ElMessage, type FormInstance } from 'element-plus';
import { reactive, ref } from 'vue';

const formRef = ref<FormInstance>();
type FormData = {
    username: string;
    password: string;
    remember: boolean;
}

const formData = reactive<FormData>({
    username: '',
    password: '',
    remember: false
});

const handleLogin = (formRef: FormInstance | undefined) => {
    if (!formRef) return;
    formRef.validate((valid) => {
        if (valid) {
            // 接入后端登录接口
            instance.post('/auth/login', formData).then((response) => {
                const { success, data, message } = response.data;
                if (success) {
                    ElMessage.success('登录成功');
                    const { accessToken } = data;
                    localStorage.setItem('AixAdminToken', accessToken);
                    router.push({ name: 'home' });
                } else {
                    ElMessage.error(message || '登录失败');
                }
            }).catch((error) => {
                ElMessage.error(error?.response?.data?.message || '登录失败');
            });
        } else {
            ElMessage.error('表单验证失败');
        }
    });
};

const resetForm = (formRef: FormInstance | undefined) => {
    if (!formRef) return;
    formRef.resetFields();
};
</script>

<style lang="scss" scoped>
.fromView {
    padding: 0 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
}
</style>