<script setup lang="ts">

import {onMounted, ref} from "vue";
import router from "@/router";
import {useUserStore} from "@/stores/user.ts";
const userStore = useUserStore();
const menuData = ref([
  {id:1111,name:"首页",url:"/dashboard/welcome",children:[],},
  {id:2222,name:'账号管理',children:[
      {id:22220,name:"用户管理",url:'/userManage'},

    ]},
  {id:3333,name:"角色管理" ,children:[
      {id:33330,name:"角色信息",url:'/roleInfo'},
    ]},
  {id:5555,name:"订单管理" ,children:[
      {id:55550,name:"我的订单",url:'/roleInfo'},
    ]},
  {id:6666,name:"发票管理" ,children:[
      {id:66660,name:"发票查询",url:'/roleInfo'},
    ]},
  {id:8888,name:'使用记录',children:[
      {id:88880,name:"数据统计",url:'/roleInfo'},
      {id:88881,name:"我的信息",url:'/roleInfo'},
      {id:88882,name:"我的数据",url:'/roleInfo'},
    ]},

])
//
// onMounted(()=>{
//
// })

onMounted(()=>{
  const userInfo=localStorage.getItem('userInfo')
  // console.log("这是:",JSON.parse(userInfo).data.menuTree);
  console.log("cccccc",userStore.userInfo)
  menuData.value=userStore.userInfo.menuTree;

   // menuData.value=JSON.parse(userInfo).data.menuTree;

})

const activeIndex = ref(0);
const toggleMenu = (menu,idx:number) => {
  if (activeIndex.value==idx)
    activeIndex.value=0;
  else
  activeIndex.value=idx;
  if(menu.url)
   router.push(menu.url);

}
const SecondactiveIndex = ref(0);
const toggleSecondMenu = (id:number) => {

    SecondactiveIndex.value=id;


}
</script>

<template>

  <div class="aside">
      <ul class="menu">

        <!-- 首页 -->
        <li v-for="(menu,idx) in menuData" :key="menu.id"  >
          <div class="menu-title " v-bind:class="{active:activeIndex==idx}" @click="toggleMenu(menu,idx)">
            <div class="left">
              <div class="icon"></div>
             {{menu.name}}
            </div>


            <i v-if="menu.children.length>0" class="arrow"></i>
          </div>
          <ul v-if="menu.children.length>0" class="submenu" :class="{show:activeIndex==idx} ">
          <li v-for="secondMenu in menu.children" :key="secondMenu.id" v-bind:class="{active: SecondactiveIndex==secondMenu.id}" @click="toggleSecondMenu(secondMenu.id) ">


            <router-link :to="secondMenu.path">
              

              {{secondMenu.name}}
            </router-link>
          </li>
        </ul>
        </li>
      </ul>
    </div>
</template>

<style scoped>
.aside{
  width: 15%;
  height: 100%;
  background: white;
border-right: black solid 1px ;
  overflow-y: auto;

}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
  "PingFang SC", "Microsoft YaHei", sans-serif;
  background: #f5f7fa;
}

.sidebar {
  width: 260px;
  background: #fff;
  border-right: 1px solid #e5e6eb;
  height: 100vh;
  overflow-y: auto;
}

.menu {
  list-style: none;
  padding: 0;
  margin: 0;
}

.menu > li {
  border-bottom: 1px solid #eee;
}

.menu-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  cursor: pointer;
  color: #333;

  user-select: none ;

}

.menu-title:hover{
  color:#cfb676;
}
.menu-title.active {
  color: #1677ff;
}

.menu-title .left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon {
  width: 18px;
  height: 18px;
  background: #999;
  border-radius: 3px;
  opacity: 0.85;
}


.arrow {
  /* 完全替换原来的箭头代码 */
  display: inline-block;
  width: 8px;
  height: 8px;
  border-right: 2px solid #666;
  border-bottom: 2px solid #666;
  transform: rotate(45deg);
  transition: all 0.3s;


}
.menu-title.active .arrow {
  transform: rotate(-135deg);
  border-color: #1677ff;
}
.menu-title.active .arrow {
  transform: rotate(-135deg);
  border-color: #1677ff;
}

.submenu {
  list-style: none;
  padding-left: 32px;
  margin: 0;
  display: none;
  position: relative;

}

.submenu::before {
  content: "";
  position: absolute;
  left: 18px;
  top: 0;
  bottom: 0;
  border-left: 1px dotted #c0c4cc;
}

.submenu li {
  padding: 10px 0 10px 20px;
  color: #666;

  position: relative;
  cursor: pointer;
}
.submenu a{
  text-decoration: none;
  color: #333;
}

.submenu li::before {
  content: "";
  position: absolute;
  left: -2px;
  top: 50%;
  width: 12px;
  border-top: 1px dotted #c0c4cc;
}

.submenu li a:hover {
  color: #1677ff;
}
.menu-title:hover .icon{

  background: #cfb676;
}

.menu-title.active .icon{
  background:  #1677ff;
}
.submenu li.active a{
  color: #1677ff;
}
.submenu.show {
  display: block;
}

</style>