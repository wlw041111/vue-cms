



import axios from "axios";
import {useUserStore} from "@/stores/user.ts";
import {ElMessage} from "element-plus";

const instance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 5000, // 1000ms 有点短，容易超时
});

// 请求拦截器
instance.interceptors.request.use((config) => {
    // 【核心】在这里获取 store 实例
    const userStore = useUserStore();

    // 直接从 store 中拿 token
    if (userStore.token) {
        // 按照后端要求的格式塞进请求头，一般是 Authorization 或 token
        config.headers['Authorization'] = `Bearer ${userStore.token}`;
    }
    // 只有当方法不是 GET 时，才强制设置 JSON 格式
    if (config.method?.toLowerCase() !== 'get') {
        config.headers['Content-Type'] = 'application/json;charset=UTF-8';
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});
// 响应拦截器
// 响应拦截器
instance.interceptors.response.use(
    (response) => {
        // 这里的 response.data 就是后端的 Result 对象
        const res = response.data;





        return res;
    },

);

export default (options: any) => instance(options);