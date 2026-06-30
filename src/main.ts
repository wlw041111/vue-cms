import { createApp } from 'vue'
import App from './App.vue'
import router from './router'


import {createPinia} from "pinia";
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import './css/guet01.css'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'//持久化插件
const pinia =createPinia()
pinia.use(piniaPluginPersistedstate) // 注册持久化插件
const app = createApp(App)

const elementLocale = {
    ...zhCn,
    el: {
        ...zhCn.el,
        pagination: {
            ...zhCn.el.pagination,
            goto: '跳转到',
            pagesize: '/页',
            total: '共 {total}',
        },
    },
}


app.use(pinia)
app.use(router)
app.use(ElementPlus, { locale: elementLocale })
app.mount('#app')

