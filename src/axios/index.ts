import axios from "axios";

const instance = axios.create({
    baseURL: "/api",
    timeout: 10000,
});
// 请求拦截器 每次请求前除了登录接口都要携带token 并请求/api/verifyToken接口验证token
instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("AixAdminToken");
        if (token && config.url !== "/login") {
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
            // 处理响应错误
            const { status, data } = error.response;
            console.error(`Error ${status}: ${data.message}`);
        }
        return Promise.reject(error);
    }
);

export default instance;
