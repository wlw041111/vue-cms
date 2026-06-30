<template>
  <div class="news-detail-container">
    <div class="news-detail-card">
      <!-- 标题 -->
      <h1 class="news-title">{{ newsData?.title || '加载中...' }}</h1>

      <!-- 发布时间 -->
      <div class="news-meta">
        <span>发布时间：{{ newsData?.createTime || '' }}</span>
        <span>类型：{{ newsData?.category || '' }}</span>
      </div>

      <!-- 分割线 -->
      <div class="divider"></div>

      <!-- 内容 -->
      <div class="news-content" v-html="newsData?.content || '<p>暂无内容</p>'">
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getNewsDetail } from '@/http/new.ts'

const route = useRoute()
const newsData = ref<any>(null)
const loading = ref(true)

const currentUserId = ref<number>(Number(localStorage.getItem('userId')) || 1)

const fetchNewsDetail = async () => {
  const id = route.query.id
  if (!id) {
    loading.value = false
    return
  }

  try {
    const res: any = await getNewsDetail(currentUserId.value, Number(id))
    // 响应拦截器返回 Result 对象 {success, message, data}
    newsData.value = res?.data || res
    console.log('新闻详情：', newsData.value)
  } catch (error) {
    console.error('获取新闻详情失败：', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchNewsDetail()
})
</script>

<style scoped>
.news-detail-container {
  max-width: 1000px;
  margin: 30px auto;
  padding: 0 20px;
}

.news-detail-card {
  background: #fff;
  border-radius: 8px;
  padding: 40px 50px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.news-title {
  text-align: center;
  font-size: 28px;
  font-weight: bold;
  color: #1a1a1a;
  margin-bottom: 20px;
  line-height: 1.4;
}

.news-meta {
  text-align: center;
  color: #999;
  font-size: 14px;
  margin-bottom: 20px;
}

.news-meta span {
  margin: 0 15px;
}

.divider {
  border: none;
  border-top: 1px solid #e8e8e8;
  margin: 20px 0 30px;
}

.news-content {
  font-size: 16px;
  line-height: 1.8;
  color: #333;
}

.news-content :deep(p) {
  margin-bottom: 16px;
}

.news-content :deep(img) {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 20px auto;
}

.news-content :deep(h1),
.news-content :deep(h2),
.news-content :deep(h3) {
  margin: 20px 0 10px;
}

/* 加载状态 */
.loading-text {
  text-align: center;
  color: #999;
  padding: 40px 0;
}
</style>