import axios from "axios";
import router from "@/router";

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
            const { status } = error.response;
            if (status === 401) {
                // 未授权，清理并跳转登录（不刷新整页）
                localStorage.removeItem("AixAdminToken");
                if (router.currentRoute.value.name !== 'login') {
                    router.push({ name: 'login' });
                }
            }
        }
        return Promise.reject(error);
    }
);

export default instance;
