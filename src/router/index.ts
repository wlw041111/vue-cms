import {createRouter, createWebHistory} from 'vue-router'
import Index from "@/nav/index.vue";
import UserManage from "@/view/UserManage.vue";
import Login from "@/view/Login.vue";
import RoleInfo from "@/view/RoleInfo.vue";
import Welcome from "@/view/Welcome.vue";
import PermissionManage from "@/view/PermissionManage.vue";
import User from "@/view/User.vue";
import New from "@/view/New.vue";
import NewsList from "@/view/NewsList.vue";
import Guet from "@/guet/Guet.vue";
import Home from "@/guet/Home.vue";
import NewsPass from "@/guet/pass.vue";
import NewsDetail from "@/guet/Newtext.vue"


const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {path: '/', component: Login, children: []},

        { path: '/content/notice',
            component: Guet,
            children: [

                { path: '/content/notice', component: Home },
                {
                    path: '/news/detail',
                    component: NewsDetail
                }


            ]

        },

        {path: '/dashboard',
            component: Index,
            redirect: '/dashboard/welcome',
            children:
            [   {path:'/content/news',component: NewsList},
                {path:'/content/news/edit',component: New},
                {path: '/account/user',component: User},
                {path: '/permission/list', name: 'PermissionManage', component: PermissionManage},
                {path:'welcome',component: Welcome, },
                {path: 'userManage', component: UserManage,},
                {path: '/role/list', component: RoleInfo},
                {path: '/content/newspass',component: NewsPass,}
            ]

                },


    ],
})


export default router
