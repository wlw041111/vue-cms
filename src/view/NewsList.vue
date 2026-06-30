<template>
  <div class="news-manage">
    <!-- 头部 -->
    <div class="page-header">
      <h2>📰 新闻管理</h2>
      <div class="header-actions">
        <button
            class="btn-add"
            @click="goCreate"
            :class="{ 'btn-disabled': !hasPermission('content:news:audit') }"
            :disabled="!hasPermission('content:news:audit')"
        >
          ＋ 发布新闻
        </button>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <div class="search-group">
        <label>栏目筛选：</label>
        <select v-model="filterType" @change="onFilterChange">
          <option value="">全部栏目</option>
          <option value="党建工作">党建工作</option>
          <option value="通知公告">通知公告</option>
          <option value="学术活动">学术活动</option>
          <option value="学工新闻">学工新闻</option>
        </select>
      </div>
      <div class="search-group">
        <label>状态筛选：</label>
        <select v-model="filterStatus" @change="onFilterChange">
          <option value="">全部状态</option>
          <option value="PENDING_REVIEW">待审核</option>
          <option value="APPROVED">已通过</option>
          <option value="REJECTED">已驳回</option>
        </select>
      </div>
      <div class="search-group">
        <label>标题搜索：</label>
        <input
            type="text"
            v-model="searchTitle"
            placeholder="输入标题关键词..."
            @input="onSearch"
        />
      </div>
    </div>

    <!-- 表格 -->
    <div class="table-wrapper">
      <table class="news-table">
        <thead>
        <tr>
          <th class="col-id">ID</th>
          <th class="col-title">标题</th>
          <th class="col-type">栏目</th>
          <th class="col-supplier">供稿人</th>
          <th class="col-reviewer">审稿人</th>
          <th class="col-status">状态</th>
          <th class="col-time">创建时间</th>
          <th class="col-actions">操作</th>
        </tr>
        </thead>
        <tbody>
        <tr v-if="loading">
          <td colspan="8" class="loading-state">加载中...</td>
        </tr>
        <tr v-else-if="filteredList.length === 0">
          <td colspan="8" class="empty-state">
            {{ allNews.length === 0 ? '暂无新闻，点击上方按钮发布' : '没有匹配的新闻' }}
          </td>
        </tr>
        <tr v-for="item in pagedList" :key="item.id">
          <td class="col-id"><span class="id-badge">{{ item.id }}</span></td>
          <td class="col-title">
            <span class="title-link" @click="previewNews(item)">{{ item.title }}</span>
          </td>
          <td class="col-type">
            <span class="type-tag" :class="getTypeClass(item.category)">{{ item.category }}</span>
          </td>
          <td class="col-supplier">{{ item.supplier || '-' }}</td>
          <td class="col-reviewer">{{ item.reviewer || '-' }}</td>
          <td class="col-status">
            <span class="status-tag" :class="getStatusClass(item.status)">
              {{ getStatusText(item.status) }}
            </span>
          </td>
          <td class="col-time">{{ formatTime(item.createTime) }}</td>
          <td class="col-actions">
            <button
                class="btn-edit"
                @click="goEdit(item)"
                :disabled="!hasPermission('content:news:audit')"
                :class="{ 'btn-disabled': !hasPermission('content:news:audit') }"
            >
              编辑
            </button>
            <button
                v-if="item.status === 'PENDING_REVIEW'"
                class="btn-pass"
                @click="handleApprove(item)"
                :disabled="!hasPermission('content:news:audit')"
                :class="{ 'btn-disabled': !hasPermission('content:news:audit') }"
            >
              通过
            </button>
            <button
                v-if="item.status === 'APPROVED'"
                class="btn-reject"
                @click="handleReject(item)"
                :disabled="!hasPermission('content:news:audit')"
                :class="{ 'btn-disabled': !hasPermission('content:news:audit') }"
            >
              驳回
            </button>
            <button
                class="btn-delete"
                @click="handleDelete(item)"
                :disabled="!hasPermission('content:news:audit')"
                :class="{ 'btn-disabled': !hasPermission('content:news:audit') }"
            >
              删除
            </button>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- 分页 -->
    <div class="pagination" v-if="totalPages > 1">
      <button :disabled="currentPage === 1" @click="currentPage--">上一页</button>
      <span v-for="p in totalPages" :key="p">
        <button
            :class="{ active: p === currentPage }"
            @click="currentPage = p"
        >{{ p }}</button>
      </span>
      <button :disabled="currentPage === totalPages" @click="currentPage++">下一页</button>
      <span class="page-info">共 {{ filteredList.length }} 条，第 {{ currentPage }}/{{ totalPages }} 页</span>
    </div>

    <!-- 预览弹窗 -->
    <div v-if="previewVisible" class="modal-overlay" @click.self="previewVisible = false">
      <div class="modal-preview">
        <button class="btn-close" @click="previewVisible = false">✕</button>
        <h3>{{ previewData?.title }}</h3>
        <div class="preview-meta">
          <span>栏目：{{ previewData?.category }}</span>
          <span>供稿人：{{ previewData?.supplier || '-' }}</span>
          <span>状态：{{ getStatusText(previewData?.status) }}</span>
          <span>时间：{{ formatTime(previewData?.createTime) }}</span>
        </div>
        <div class="divider"></div>
        <div class="preview-content" v-html="previewData?.content || '<p>暂无内容</p>'"></div>
      </div>
    </div>

    <!-- 确认弹窗 -->
    <div v-if="confirmVisible" class="modal-overlay" @click.self="confirmVisible = false">
      <div class="modal-confirm">
        <h3>{{ confirmTitle }}</h3>
        <p>{{ confirmMessage }}</p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="confirmVisible = false">取消</button>
          <button class="btn-confirm" :class="confirmType" @click="doConfirm">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  getNewsList,
  updateNewsStatus,
  deleteNews,
  getUserNewsPermissions
} from '@/http/new.ts'

const router = useRouter()

// ========== 权限 ==========

const currentUserId = ref<number>(Number(localStorage.getItem('userId')) || 1)
const userPermissions = ref<string[]>([])

const hasPermission = (code: string): boolean => {
  return userPermissions.value.includes(code)
}

const fetchPermissions = async () => {
  try {
    const res: any = await getUserNewsPermissions(currentUserId.value)
    if (Array.isArray(res)) {
      userPermissions.value = res
    } else if (res?.data) {
      userPermissions.value = Array.isArray(res.data) ? res.data : []
    }
  } catch (e) {
    console.error('获取权限失败', e)
  }
}

// ========== 数据 ==========

const allNews = ref<any[]>([])
const loading = ref(false)
const filterType = ref('')
const filterStatus = ref('')
const searchTitle = ref('')
const currentPage = ref(1)
const pageSize = 10

const fetchNewsList = async () => {
  loading.value = true
  try {
    const res: any = await getNewsList(currentUserId.value)
    const data = res?.data || res || []
    allNews.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('获取新闻列表失败', e)
    allNews.value = []
  } finally {
    loading.value = false
  }
}

// ========== 计算属性 ==========

const pendingCount = computed(() =>
    allNews.value.filter((n: any) => n.status === 'PENDING_REVIEW').length
)

const filteredList = computed(() => {
  let list = allNews.value

  if (filterType.value) {
    list = list.filter((n: any) => n.category === filterType.value)
  }
  if (filterStatus.value !== '') {
    list = list.filter((n: any) => n.status === filterStatus.value)
  }
  if (searchTitle.value.trim()) {
    const kw = searchTitle.value.trim().toLowerCase()
    list = list.filter((n: any) => n.title?.toLowerCase().includes(kw))
  }

  // 按创建时间降序
  list = [...list].sort((a, b) => {
    const ta = a.createTime ? new Date(a.createTime).getTime() : 0
    const tb = b.createTime ? new Date(b.createTime).getTime() : 0
    return tb - ta
  })
  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredList.value.length / pageSize)))

const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredList.value.slice(start, start + pageSize)
})

// ========== 操作方法 ==========

const goCreate = () => {
  router.push({ path: '/content/news/edit', query: { mode: 'create' } })
}

const goEdit = (item: any) => {
  router.push({ path: '/content/news/edit', query: { id: item.id, mode: 'edit' } })
}

// 预览
const previewVisible = ref(false)
const previewData = ref<any>(null)
const previewNews = (item: any) => {
  previewData.value = item
  previewVisible.value = true
}

// 确认弹窗
const confirmVisible = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmType = ref('')
let pendingAction: (() => Promise<void>) | null = null

const showConfirm = (title: string, msg: string, type: string, action: () => Promise<void>) => {
  confirmTitle.value = title
  confirmMessage.value = msg
  confirmType.value = type
  pendingAction = action
  confirmVisible.value = true
}

const doConfirm = async () => {
  if (pendingAction) await pendingAction()
  confirmVisible.value = false
  pendingAction = null
}

const handleApprove = (item: any) => {
  showConfirm('通过审核', `确定通过「${item.title}」？`, 'pass', async () => {
    await updateNewsStatus(currentUserId.value, item.id, 'APPROVED')
    await fetchNewsList()
  })
}

const handleReject = (item: any) => {
  showConfirm('驳回新闻', `确定驳回「${item.title}」？`, 'reject', async () => {
    await updateNewsStatus(currentUserId.value, item.id, 'REJECTED')
    await fetchNewsList()
  })
}

const handleDelete = (item: any) => {
  showConfirm('删除新闻', `确定删除「${item.title}」？此操作不可恢复！`, 'delete', async () => {
    await deleteNews(currentUserId.value, item.id)
    await fetchNewsList()
  })
}

const onSearch = () => {
  currentPage.value = 1
}

const onFilterChange = () => {
  currentPage.value = 1
}

// ========== 工具函数 ==========

const getStatusText = (s: string): string => {
  if (s === 'PENDING_REVIEW') return '待审核'
  if (s === 'APPROVED') return '已通过'
  if (s === 'REJECTED') return '已驳回'
  return s || '未知'
}

const getStatusClass = (s: string): string => {
  if (s === 'PENDING_REVIEW') return 'status-pending'
  if (s === 'APPROVED') return 'status-pass'
  if (s === 'REJECTED') return 'status-reject'
  return ''
}

const getTypeClass = (type: string): string => {
  const map: Record<string, string> = {
    '党建工作': 'type-party',
    '通知公告': 'type-notice',
    '学术活动': 'type-academic',
    '学工新闻': 'type-student',
  }
  return map[type] || ''
}

const formatTime = (t: string): string => {
  if (!t) return '-'
  return t.substring(0, 16)
}

// ========== 生命周期 ==========

onMounted(async () => {
  await fetchPermissions()
  await fetchNewsList()
})
</script>

<style scoped>
/* ===== 整体布局 ===== */
.news-manage {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ===== 头部 ===== */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  padding: 20px 28px;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.page-header h2 {
  font-size: 22px;
  color: #1a2c4a;
  margin: 0;
}
.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}
.btn-add {
  padding: 10px 24px;
  background: #0F3C7C;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-add:hover {
  background: #0a2d5e;
}

/* ===== 搜索栏 ===== */
.search-bar {
  display: flex;
  gap: 24px;
  background: #fff;
  padding: 14px 28px;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  flex-wrap: wrap;
}
.search-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.search-group label {
  font-size: 13px;
  color: #666;
  white-space: nowrap;
  font-weight: 500;
}
.search-group select,
.search-group input {
  padding: 7px 12px;
  border: 1px solid #dce3ed;
  border-radius: 6px;
  font-size: 13px;
  background: #fff;
  min-width: 120px;
}
.search-group input {
  min-width: 180px;
}
.search-group select:focus,
.search-group input:focus {
  outline: none;
  border-color: #0F3C7C;
  box-shadow: 0 0 0 2px rgba(15,60,124,0.1);
}

/* ===== 表格 ===== */
.table-wrapper {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  padding: 0;
  overflow: auto;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.news-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.news-table thead {
  background: #f8faff;
  position: sticky;
  top: 0;
  z-index: 5;
}
.news-table th {
  padding: 14px 16px;
  text-align: left;
  font-weight: 600;
  color: #4a5568;
  border-bottom: 2px solid #e5e6eb;
}
.news-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #eef2f8;
  vertical-align: middle;
}
.news-table tbody tr {
  transition: background 0.15s;
}
.news-table tbody tr:hover {
  background: #f8faff;
}
.col-id { width: 60px; }
.col-title { min-width: 200px; }
.col-type { width: 120px; }
.col-supplier { width: 90px; color: #666; font-size: 13px; }
.col-reviewer { width: 90px; color: #666; font-size: 13px; }
.col-status { width: 90px; }
.col-time { width: 130px; white-space: nowrap; }
.col-actions { width: 240px; text-align: right; }

.id-badge {
  font-weight: 600;
  color: #8899b0;
  background: #eef2f6;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-family: monospace;
}
.title-link {
  color: #1a2c4a;
  cursor: pointer;
  font-weight: 500;
}
.title-link:hover {
  color: #0F3C7C;
  text-decoration: underline;
}

/* 类型标签 */
.type-tag {
  padding: 3px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}
.type-party { background: #fde8e8; color: #c0392b; }
.type-notice { background: #fff3cd; color: #856404; }
.type-academic { background: #e8f0fd; color: #1a5cff; }
.type-student { background: #e8f5e9; color: #27ae60; }

/* 状态标签 */
.status-tag {
  padding: 3px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}
.status-pending { background: #fff3e0; color: #e67e22; }
.status-pass { background: #d4edda; color: #155724; }
.status-reject { background: #f8d7da; color: #721c24; }

/* 操作按钮 */
.col-actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}
.col-actions button {
  padding: 5px 14px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.btn-edit { background: #3498db; color: #fff; }
.btn-edit:hover { background: #2980b9; }
.btn-pass { background: #27ae60; color: #fff; }
.btn-pass:hover { background: #219a52; }
.btn-reject { background: #e74c3c; color: #fff; }
.btn-reject:hover { background: #c0392b; }
.btn-delete { background: #95a5a6; color: #fff; }
.btn-delete:hover { background: #7f8c8d; }

/* 分页 */
.pagination {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  padding: 14px 0;
}
.pagination button {
  padding: 6px 14px;
  border: 1px solid #dce3ed;
  background: #fff;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  color: #333;
}
.pagination button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.pagination button.active {
  background: #0F3C7C;
  color: #fff;
  border-color: #0F3C7C;
}
.page-info {
  font-size: 13px;
  color: #999;
  margin-left: 10px;
}

/* 加载 & 空状态 */
.loading-state, .empty-state {
  text-align: center;
  padding: 60px 0;
  color: #999;
  font-size: 15px;
}

/* ===== 弹窗 ===== */
.modal-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background: rgba(0,0,0,0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: fadeIn 0.2s ease;
}
.modal-preview {
  background: #fff;
  border-radius: 12px;
  padding: 32px 40px;
  width: 800px;
  max-width: 94%;
  max-height: 85vh;
  overflow-y: auto;
  position: relative;
}
.modal-preview h3 {
  font-size: 22px;
  color: #1a2c4a;
  margin: 0 0 12px 0;
  padding-right: 30px;
}
.preview-meta {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #999;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.divider {
  border-top: 1px solid #e8e8e8;
  margin: 14px 0;
}
.preview-content {
  font-size: 15px;
  line-height: 1.8;
  color: #333;
}
.preview-content :deep(img) { max-width: 100%; }
.btn-close {
  position: absolute;
  top: 12px; right: 16px;
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
}
.btn-close:hover { color: #333; }

.modal-confirm {
  background: #fff;
  border-radius: 12px;
  padding: 30px 40px;
  width: 420px;
  max-width: 92%;
  text-align: center;
}
.modal-confirm h3 {
  font-size: 20px;
  color: #1a2c4a;
  margin-bottom: 10px;
}
.modal-confirm p {
  font-size: 14px;
  color: #666;
  margin-bottom: 24px;
}
.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
.modal-actions button {
  padding: 9px 28px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}
.btn-cancel { background: #e8edf4; color: #555; }
.btn-cancel:hover { background: #d5dce6; }
.btn-confirm { color: #fff; }
.btn-confirm.pass { background: #27ae60; }
.btn-confirm.pass:hover { background: #219a52; }
.btn-confirm.reject { background: #e74c3c; }
.btn-confirm.reject:hover { background: #c0392b; }
.btn-confirm.delete { background: #95a5a6; }
.btn-confirm.delete:hover { background: #7f8c8d; }

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ===== 禁用按钮 ===== */
.btn-disabled {
  opacity: 0.5;
  cursor: not-allowed !important;
  pointer-events: none;
}
</style>
