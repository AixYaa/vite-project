import axios from "axios";
import router from "@/router";
import { ElMessage } from "element-plus";

const instance = axios.create({
    baseURL: "/api",
    timeout: 10000,
});
// 请求拦截器 每次请求前除了登录接口都要携带token 并请求/api/verifyToken接口验证token
instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("AixAdminToken");
        if (token) {
            if (config.headers) {
                config.headers["Authorization"] = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);
// 响应拦截器
instance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response) {
            const { status, data } = error.response;
            if (status === 401) {
                const message = data?.message || '';
                
                // 区分token过期和权限不足
                if (message.includes('无效的访问令牌') || 
                    message.includes('令牌已失效') || 
                    message.includes('请提供访问令牌') ||
                    message.includes('权限验证失败') ||
                    message === '') {
                    // token过期或无效，跳转登录
                    localStorage.removeItem("AixAdminToken");
                    if (router.currentRoute.value.name !== 'login') {
                        router.push({ name: 'login' });
                    }
                } else if (message.includes('缺少权限') || 
                          message.includes('权限不足') ||
                          message.includes('角色不存在')) {
                    // 权限不足，只显示错误提示，不跳转登录
                    console.warn('权限不足:', message);
                    ElMessage.error(message);
                } else {
                    // 其他401错误，也跳转登录
                    localStorage.removeItem("AixAdminToken");
                    if (router.currentRoute.value.name !== 'login') {
                        router.push({ name: 'login' });
                    }
                }
            }
        }
        return Promise.reject(error);
    }
);

export default instance;
