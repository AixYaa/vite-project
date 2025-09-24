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
                <el-button type="primary" @click="handleLogin(formRef)">登录</el-button>
                <el-button @click="handleLogin(formRef)">重置</el-button>
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
            // 使用mock登录接口
            instance.post('/login', formData).then((response) => {
                if (response.data.code === 200) {
                    ElMessage.success('登录成功');
                    const {token} = response.data.data;                    
                    localStorage.setItem('AixAdminToken', token);
                    router.push({ name: 'home' });

                } else {
                    ElMessage.error(response.data.message);
                }
            }).catch((error) => {
                console.error(error);
            });
        } else {
            ElMessage.error('表单验证失败');
        }
    });
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