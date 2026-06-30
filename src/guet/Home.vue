<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { getNewsList } from '@/http/new.ts'
import { useRouter } from 'vue-router'
import guetPng from '@/assets/guet.png'
import guet0 from '@/assets/guet0.png'
import guet1 from '@/assets/guet1.png'
import guet2 from '@/assets/guet2.jpg'
import guet3 from '@/assets/guet3.jpg'
import guet4 from '@/assets/guet4.png'
import guet5 from '@/assets/guet5.png'

// 使用导入的变量
const images = [guet0, guet1, guet2, guet3, guet4, guet5]
const router = useRouter()

// ===== 轮播图相关 =====
const currentImage = ref(0)

const imageLinks = [
  { text: '数学与计算科学学院举行新进教职...', to: '/Top' },
  { text: '"双法"经济数学与管理数学分会第36...', to: '/Top' },
  { text: '学院举行2024年"榜样七院"暨"七...', to: '/Top' },
  { text: '数学与计算科学学院召开2024届毕业...', to: '/Top' },
  { text: '数学与计算科学学院赴西安、洛阳两所高...', to: '/Top' },
  { text: '喜报！我院学子在全国大学生数学建模竞...', to: '/Top' },
]

let timer: number | null = null

const currentLink = computed(() => imageLinks[currentImage.value])

const goToImage = (index: number) => {
  currentImage.value = index
}

// ===== 新闻数据 =====
const newsList = ref<any[]>([])
const noticeList = ref<any[]>([])      // 通知公告
const academicList = ref<any[]>([])     // 学术活动
const partyList = ref<any[]>([])        // 党建工作
const studentList = ref<any[]>([])      // 学工新闻

// 加载状态

const loading = ref(false)
// 查看返回的数据

const currentUserId = ref<number>(Number(localStorage.getItem('userId')) || 1)

// 截取标题前14个字
const truncateTitle = (title: string) => {
  if (!title) return ''
  return title.length > 14 ? title.substring(0, 14) + '...' : title
}

// 跳转到文章详情
const goToNewsDetail = (id: number) => {
  router.push({ path: '/news/detail', query: { id: id.toString() } })
}

// 获取所有新闻数据
const fetchAllNews = async () => {
  loading.value = true
  try {
    const res: any = await getNewsList(currentUserId.value)
    console.log("res", res)
    let allNews = res?.data || res || []

    // 只显示已通过的新闻
    allNews = allNews.filter((item: any) => item.status === 'APPROVED')

    // 按栏目分类
    noticeList.value = allNews.filter((item: any) => item.category === '通知公告')
    academicList.value = allNews.filter((item: any) => item.category === '学术活动')
    partyList.value = allNews.filter((item: any) => item.category === '党建工作')
    studentList.value = allNews.filter((item: any) => item.category === '学工新闻')

    // 学院新闻取所有类型的前8条
    newsList.value = allNews.slice(0, 8)

    console.log('新闻数据加载成功：', allNews)
  } catch (error) {
    console.error('获取新闻失败：', error)
  } finally {
    loading.value = false
  }
}

// 生命周期：组件挂载时获取数据
onMounted(() => {
  // 获取新闻数据
  fetchAllNews()

  // 轮播图自动播放
  timer = setInterval(() => {
    currentImage.value = (currentImage.value + 1) % images.length
  }, 3000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="rectangle-horizontal">
    <!-- 大图 -->
    <div class="TUPIAN">
      <img src="@/assets/guet.png">
    </div>

    <!-- 学院新闻 -->
    <div class="NEW">
      <div class="NEW-First">
        <li>学院新闻</li>
      </div>
      <div class="NEW-Second"></div>
      <div class="NEW-block-big">
        <div class="NEW-block"
             v-for="(item, index) in newsList"
             :key="index"
             @click="goToNewsDetail(item.id)">
          <router-link :to="`/news/detail?id=${item.id}`">
            {{ truncateTitle(item.title) }}
          </router-link>
          <span class="NEW-Data">{{ item.createTime ? item.createTime.substring(5, 10) : '' }}</span>
        </div>
        <!-- 如果没有数据，显示占位 -->
        <div v-if="newsList.length === 0" class="NEW-block">
          <span style="color: #999;">暂无学院新闻</span>
        </div>
      </div>
    </div>

    <!-- 轮播图 -->
    <div class="TUPIAN1">
      <div class="TUPIAN1-First">
        <router-link :to="currentLink.to">
          <img :src="images[currentImage]" alt="轮播图">
        </router-link>
        <div class="TUPIAN1-First-1"
             :class="{ active: currentImage === 0 }"
             @click="goToImage(0)">
          <li>1</li>
        </div>
        <div class="TUPIAN1-First-2"
             :class="{ active: currentImage === 1 }"
             @click="goToImage(1)">
          <li>2</li>
        </div>
        <div class="TUPIAN1-First-3"
             :class="{ active: currentImage === 2 }"
             @click="goToImage(2)">
          <li>3</li>
        </div>
        <div class="TUPIAN1-First-4"
             :class="{ active: currentImage === 3 }"
             @click="goToImage(3)">
          <li>4</li>
        </div>
        <div class="TUPIAN1-First-5"
             :class="{ active: currentImage === 4 }"
             @click="goToImage(4)">
          <li>5</li>
        </div>
        <div class="TUPIAN1-First-6"
             :class="{ active: currentImage === 5 }"
             @click="goToImage(5)">
          <li>6</li>
        </div>
      </div>
      <div class="TUPIAN1-Second">
        <router-link :to="currentLink.to">{{ currentLink.text }}</router-link>
      </div>
    </div>

    <!-- 通知公告 -->
    <div class="TONGZI">
      <div class="NEW-First">
        <li>通知公告</li>
      </div>
      <div class="NEW-Second"></div>
      <div class="NEW-block-big">
        <div class="NEW-block"
             v-for="(item, index) in noticeList.slice(0, 8)"
             :key="index"
             @click="goToNewsDetail(item.id)">
          <router-link :to="`/news/detail?id=${item.id}`">
            {{ truncateTitle(item.title) }}
          </router-link>
          <span class="NEW-Data">{{ item.createTime ? item.createTime.substring(5, 10) : '' }}</span>
        </div>
        <!-- 如果没有数据，显示占位 -->
        <div v-if="noticeList.length === 0" class="NEW-block">
          <span style="color: #999;">暂无通知公告</span>
        </div>
      </div>
    </div>

    <!-- 学术活动 -->
    <div class="STUDY">
      <div class="NEW-First">
        <li>学术活动</li>
      </div>
      <div class="NEW-Second"></div>
      <div class="NEW-block-big">
        <div class="NEW-block"
             v-for="(item, index) in academicList.slice(0, 8)"
             :key="index"
             @click="goToNewsDetail(item.id)">
          <router-link :to="`/news/detail?id=${item.id}`">
            {{ truncateTitle(item.title) }}
          </router-link>
          <span class="NEW-Data">{{ item.createTime ? item.createTime.substring(5, 10) : '' }}</span>
        </div>
        <div v-if="academicList.length === 0" class="NEW-block">
          <span style="color: #999;">暂无学术活动</span>
        </div>
      </div>
    </div>

    <!-- 党建工作 -->
    <div class="PARTY">
      <div class="NEW-First">
        <li>党建工作</li>
      </div>
      <div class="NEW-Second"></div>
      <div class="NEW-block-big">
        <div class="NEW-block"
             v-for="(item, index) in partyList.slice(0, 8)"
             :key="index"
             @click="goToNewsDetail(item.id)">
          <router-link :to="`/news/detail?id=${item.id}`">
            {{ truncateTitle(item.title) }}
          </router-link>
          <span class="NEW-Data">{{ item.createTime ? item.createTime.substring(5, 10) : '' }}</span>
        </div>
        <div v-if="partyList.length === 0" class="NEW-block">
          <span style="color: #999;">暂无党建工作</span>
        </div>
      </div>
    </div>

    <!-- 学工新闻 -->
    <div class="STUDENT">
      <div class="NEW-First">
        <li>学工新闻</li>
      </div>
      <div class="NEW-Second"></div>
      <div class="NEW-block-big">
        <div class="NEW-block"
             v-for="(item, index) in studentList.slice(0, 8)"
             :key="index"
             @click="goToNewsDetail(item.id)">
          <router-link :to="`/news/detail?id=${item.id}`">
            {{ truncateTitle(item.title) }}
          </router-link>
          <span class="NEW-Data">{{ item.createTime ? item.createTime.substring(5, 10) : '' }}</span>
        </div>
        <div v-if="studentList.length === 0" class="NEW-block">
          <span style="color: #999;">暂无学工新闻</span>
        </div>
      </div>
    </div>
  </div>

  <!-- 底部 -->
  <ul class="PITURE2">
    <ul class="PITURE2-First">
      <li>学院风采</li>
    </ul>
    <ul class="PITURE2-Second"></ul>
    <ul class="PITURE2-Third"></ul>
  </ul>

  <ul class="END-LINK">
    <ul class="END-LINK-First">友情链接</ul>
    <ul class="END-LINK-Second"></ul>
  </ul>
</template>//

<style scoped>
/* 这里保持你原有的样式不变 */

</style>