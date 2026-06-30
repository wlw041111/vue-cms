<template>
  <div class="audit-container">
    <div class="audit-box">
      <div class="audit-header">
        <h2>新闻审核</h2>
        <div class="header-right">
          <span class="audit-count">待审核：{{ pendingList.length }} 条</span>
          <button class="btn-exit" @click="$router.back()">退出</button>
        </div>
      </div>

      <div class="audit-list" v-if="!loading">
        <div v-if="pendingList.length > 0" class="audit-section">
          <div class="section-title">
            <span class="badge pending">待审核</span>
            <span class="count">{{ pendingList.length }} 条</span>
          </div>
          <div
              class="audit-item pending-item"
              v-for="item in pendingList"
              :key="item.id"
          >
            <div class="news-info">
              <span class="news-title">{{ item.title }}</span>
              <span class="news-type">{{ item.category }}</span>
              <span class="news-time">{{ item.createTime ? item.createTime.substring(0, 16) : '' }}</span>
            </div>
            <div class="action-buttons">
              <button
                  class="btn-reject"
                  @click="handleReject(item)"
                  :class="{ 'btn-disabled': !hasPermission('content:news:audit') }"
                  :disabled="!hasPermission('content:news:audit')"
              >
                驳回
              </button>
              <button
                  class="btn-pass"
                  @click="handlePass(item)"
                  :class="{ 'btn-disabled': !hasPermission('content:news:audit') }"
                  :disabled="!hasPermission('content:news:audit')"
              >
                通过
              </button>
              <button
                  class="btn-edit"
                  @click="handleEdit(item)"
                  :class="{ 'btn-disabled': !hasPermission('content:news:audit') }"
                  :disabled="!hasPermission('content:news:audit')"
              >
                编辑
              </button>
              <button
                  class="btn-delete"
                  @click="handleDelete(item)"
                  :class="{ 'btn-disabled': !hasPermission('content:news:audit') }"
                  :disabled="!hasPermission('content:news:audit')"
              >
                删除
              </button>
            </div>
          </div>
        </div>

        <div v-if="approvedList.length > 0" class="audit-section">
          <div class="section-title">
            <span class="badge approved">已审核</span>
            <span class="count">{{ approvedList.length }} 条</span>
          </div>
          <div
              class="audit-item approved-item"
              v-for="item in approvedList"
              :key="item.id"
          >
            <div class="news-info">
              <span class="news-title">{{ item.title }}</span>
              <span class="news-type">{{ item.category }}</span>
              <span class="news-time">{{ item.createTime ? item.createTime.substring(0, 16) : '' }}</span>
              <span class="status-badge" :class="item.status === 'APPROVED' ? 'status-pass' : 'status-reject'">
                {{ item.status === 'APPROVED' ? '已通过' : '已驳回' }}
              </span>
            </div>
            <div class="action-buttons">
              <button
                  class="btn-reject"
                  @click="handleReject(item)"
                  v-if="item.status === 'APPROVED'"
                  :class="{ 'btn-disabled': !hasPermission('content:news:audit') }"
                  :disabled="!hasPermission('content:news:audit')"
              >
                驳回
              </button>
              <button
                  class="btn-pass"
                  @click="handlePass(item)"
                  v-if="item.status === 'REJECTED'"
                  :class="{ 'btn-disabled': !hasPermission('content:news:audit') }"
                  :disabled="!hasPermission('content:news:audit')"
              >
                通过
              </button>
              <button
                  class="btn-edit"
                  @click="handleEdit(item)"
                  :class="{ 'btn-disabled': !hasPermission('content:news:audit') }"
                  :disabled="!hasPermission('content:news:audit')"
              >
                编辑
              </button>
              <button
                  class="btn-delete"
                  @click="handleDelete(item)"
                  :class="{ 'btn-disabled': !hasPermission('content:news:audit') }"
                  :disabled="!hasPermission('content:news:audit')"
              >
                删除
              </button>
            </div>
          </div>
        </div>

        <div v-if="pendingList.length === 0 && approvedList.length === 0" class="empty-state">
          <span>暂无新闻数据</span>
        </div>
      </div>

      <div v-else class="loading-state">
        <span>加载中...</span>
      </div>
    </div>
  </div>

  <!-- 弹窗 -->
  <div v-if="dialogVisible" class="modal-overlay" @click.self="closeDialog">
    <div class="modal-box">
      <h3>{{ dialogTitle }}</h3>
      <p>{{ dialogMessage }}</p>
      <div class="modal-actions">
        <button class="modal-btn cancel" @click="closeDialog">取消</button>
        <button class="modal-btn confirm" :class="dialogType" @click="confirmAction">确定</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getNewsList, updateNewsStatus, deleteNews, getUserNewsPermissions } from '@/http/new.ts'
import { useRouter } from 'vue-router'

const router = useRouter()

// ==================== 权限 ====================

const currentUserId = ref<number>(Number(localStorage.getItem('userId')) || 11)
const userPermissions = ref<string[]>([])

const hasPermission = (code: string): boolean => {
  return userPermissions.value.includes(code)
}

const fetchUserPermissions = async () => {
  try {
    const res: any = await getUserNewsPermissions(currentUserId.value)
    console.log('新闻审核-用户权限响应:', res)

    if (res && res.success === false) {
      console.warn('获取用户权限失败:', res.message)
      userPermissions.value = []
      return
    }

    if (Array.isArray(res)) {
      userPermissions.value = res
    } else if (res && res.data) {
      userPermissions.value = Array.isArray(res.data) ? res.data : []
    } else {
      userPermissions.value = []
    }
    console.log('新闻审核-用户权限列表:', userPermissions.value)
  } catch (error) {
    console.error('获取用户权限失败:', error)
    userPermissions.value = []
  }
}

// ==================== 数据 ====================

const loading = ref(false)
const allNews = ref<any[]>([])

const dialogVisible = ref(false)
const dialogTitle = ref('')
const dialogMessage = ref('')
const dialogType = ref('')
let pendingAction: any = null

const pendingList = computed(() => {
  return allNews.value.filter((item: any) => item.status === 'PENDING_REVIEW')
})

const approvedList = computed(() => {
  return allNews.value.filter((item: any) => item.status === 'APPROVED' || item.status === 'REJECTED')
})

const fetchNewsList = async () => {
  loading.value = true
  try {
    const res: any = await getNewsList(currentUserId.value)
    allNews.value = res.data || res || []
    console.log('获取新闻列表成功：', allNews.value)
  } catch (error) {
    console.error('获取新闻列表失败：', error)
    showToast('获取新闻列表失败', 'error')
  } finally {
    loading.value = false
  }
}

const showDialog = (title: string, message: string, type: string, action: Function) => {
  dialogTitle.value = title
  dialogMessage.value = message
  dialogType.value = type
  pendingAction = action
  dialogVisible.value = true
}

const closeDialog = () => {
  dialogVisible.value = false
  pendingAction = null
}

const confirmAction = async () => {
  if (pendingAction) {
    await pendingAction()
  }
  closeDialog()
}

const handlePass = (item: any) => {
  if (item.status !== 'PENDING_REVIEW') {
    showToast('只有待审核的新闻才能通过', 'warning')
    return
  }

  showDialog(
      '通过审核',
      `确定要通过新闻"${item.title}"的审核吗？`,
      'pass',
      async () => {
        try {
          await updateNewsStatus(currentUserId.value, item.id, 'APPROVED')
          showToast('审核通过成功！', 'success')
          await fetchNewsList()
        } catch (error) {
          console.error('通过审核失败：', error)
          showToast('操作失败，请重试', 'error')
        }
      }
  )
}

const handleReject = (item: any) => {
  if (item.status === 'REJECTED') {
    showToast('该新闻已被驳回', 'warning')
    return
  }

  showDialog(
      '驳回审核',
      `确定要驳回新闻"${item.title}"吗？`,
      'reject',
      async () => {
        try {
          await updateNewsStatus(currentUserId.value, item.id, 'REJECTED')
          showToast('已驳回该新闻', 'warning')
          await fetchNewsList()
        } catch (error) {
          console.error('驳回审核失败：', error)
          showToast('操作失败，请重试', 'error')
        }
      }
  )
}

const handleEdit = (item: any) => {
  router.push({
    path: '/content/news/edit',
    query: { id: String(item.id), mode: 'edit' }
  })
}

const handleDelete = (item: any) => {
  showDialog(
      '删除新闻',
      `确定要删除新闻"${item.title}"吗？此操作不可恢复！`,
      'delete',
      async () => {
        try {
          await deleteNews(currentUserId.value, item.id)
          showToast('删除成功！', 'success')
          await fetchNewsList()
        } catch (error) {
          console.error('删除失败：', error)
          showToast('删除失败，请重试', 'error')
        }
      }
  )
}

const showToast = (message: string, type: string = 'info') => {
  const toast = document.createElement('div')
  toast.className = `toast toast-${type}`
  toast.textContent = message
  toast.style.cssText = `
    position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
    padding: 12px 24px; border-radius: 8px; color: #fff; font-size: 14px;
    z-index: 9999; font-family: 'Microsoft YaHei';
    background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : type === 'warning' ? '#f39c12' : '#3498db'};
    box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: fadeInDown 0.3s ease;
  `
  document.body.appendChild(toast)
  setTimeout(() => {
    toast.style.opacity = '0'
    toast.style.transition = 'opacity 0.3s'
    setTimeout(() => toast.remove(), 300)
  }, 2000)
}

// ==================== 生命周期 ====================

onMounted(async () => {
  await fetchUserPermissions()
  await fetchNewsList()
})
</script>

<style scoped>
.audit-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 100vh;
  padding: 40px 20px;
  background: #f5f7fa;
}

.audit-box {
  margin-top: 20px;
  margin-left: 20px;
  width: 80vw;
  min-height: 800px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  padding: 30px;
  display: flex;
  flex-direction: column;
}

/* ===== 标题 ===== */
.audit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 2px solid #e8edf4;
  margin-bottom: 20px;
}

.audit-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #0F3C7C;
  margin: 0;
  padding-left: 16px;
  position: relative;
}

.audit-header h2::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 28px;
  background: #0F3C7C;
  border-radius: 2px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.audit-count {
  font-size: 14px;
  color: #666;
  background: #f0f4f8;
  padding: 6px 16px;
  border-radius: 20px;
}

.btn-exit {
  padding: 8px 20px;
  background: #e8edf4;
  color: #555;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-exit:hover {
  background: #d5dce6;
}

/* ===== 列表 ===== */
.audit-list {
  flex: 1;
  overflow-y: auto;
  max-height: 600px;
}

.audit-list::-webkit-scrollbar {
  width: 6px;
}

.audit-list::-webkit-scrollbar-thumb {
  background: #c1d6ed;
  border-radius: 3px;
}

.audit-list::-webkit-scrollbar-track {
  background: #f5f7fa;
  border-radius: 3px;
}

.audit-section {
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding: 8px 0;
}

.badge {
  font-size: 14px;
  font-weight: 600;
  padding: 4px 14px;
  border-radius: 20px;
}

.badge.pending {
  background: #fff3e0;
  color: #e67e22;
}

.badge.approved {
  background: #e8f5e9;
  color: #27ae60;
}

.count {
  font-size: 13px;
  color: #999;
}

/* ===== 新闻条目 ===== */
.audit-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  margin-bottom: 10px;
  border-radius: 8px;
  transition: all 0.3s;
  border: 1px solid #e8edf4;
  background: #fafbfc;
}

.audit-item:hover {
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.audit-item.pending-item {
  border-left: 4px solid #f39c12;
  background: #fffdf7;
}

.audit-item.approved-item {
  border-left: 4px solid #2ecc71;
  background: #f8fdf9;
}

.news-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
  flex-wrap: wrap;
}

.news-title {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 280px;
}

.news-type {
  font-size: 12px;
  color: #666;
  background: #e8edf4;
  padding: 2px 12px;
  border-radius: 12px;
  white-space: nowrap;
  flex-shrink: 0;
}

.news-time {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
  flex-shrink: 0;
}

.status-badge {
  font-size: 12px;
  padding: 2px 12px;
  border-radius: 12px;
  white-space: nowrap;
  flex-shrink: 0;
}

.status-badge.status-pass {
  background: #d4edda;
  color: #155724;
}

.status-badge.status-reject {
  background: #f8d7da;
  color: #721c24;
}

/* ===== 按钮 ===== */
.action-buttons {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  margin-left: 12px;
}

.action-buttons button {
  font-size: 13px;
  padding: 5px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
  white-space: nowrap;
}

.btn-pass {
  background: #27ae60;
  color: #fff;
}

.btn-pass:hover {
  background: #219a52;
  transform: scale(1.05);
}

.btn-reject {
  background: #e74c3c;
  color: #fff;
}

.btn-reject:hover {
  background: #c0392b;
  transform: scale(1.05);
}

.btn-edit {
  background: #3498db;
  color: #fff;
}

.btn-edit:hover {
  background: #2980b9;
  transform: scale(1.05);
}

.btn-delete {
  background: #95a5a6;
  color: #fff;
}

.btn-delete:hover {
  background: #7f8c8d;
  transform: scale(1.05);
}

.action-buttons button:active {
  transform: scale(0.95);
}

/* ===== 空状态 / 加载 ===== */
.empty-state,
.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #999;
  font-size: 16px;
}

/* ===== 自定义弹窗 ===== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9998;
  animation: fadeIn 0.2s ease;
}

.modal-box {
  background: #fff;
  border-radius: 12px;
  padding: 30px 40px;
  max-width: 420px;
  width: 90%;
  box-shadow: 0 8px 40px rgba(0,0,0,0.2);
  animation: scaleIn 0.25s ease;
}

.modal-box h3 {
  margin: 0 0 12px 0;
  font-size: 20px;
  color: #333;
}

.modal-box p {
  margin: 0 0 24px 0;
  font-size: 15px;
  color: #555;
  line-height: 1.6;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.modal-btn {
  padding: 8px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.modal-btn.cancel {
  background: #e8edf4;
  color: #555;
}

.modal-btn.cancel:hover {
  background: #d5dce6;
}

.modal-btn.confirm {
  color: #fff;
}

.modal-btn.confirm.pass {
  background: #27ae60;
}

.modal-btn.confirm.pass:hover {
  background: #219a52;
}

.modal-btn.confirm.reject {
  background: #e74c3c;
}

.modal-btn.confirm.reject:hover {
  background: #c0392b;
}

.modal-btn.confirm.delete {
  background: #95a5a6;
}

.modal-btn.confirm.delete:hover {
  background: #7f8c8d;
}

/* ===== 动画 ===== */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes fadeInDown {
  from { opacity: 0; transform: translate(-50%, -20px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}

/* ===== 响应式 ===== */
@media (max-width: 860px) {
  .audit-box {
    width: 100%;
    padding: 20px;
  }

  .audit-item {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .news-title {
    max-width: 100%;
    white-space: normal;
  }

  .action-buttons {
    margin-left: 0;
    justify-content: flex-end;
  }
}
/* ===== 禁用按钮样式 ===== */
.btn-disabled {
  opacity: 0.5;
  cursor: not-allowed !important;
  pointer-events: none;
  background: #e8edf4 !important;
  color: #999 !important;
  border-color: #d5dce6 !important;
  box-shadow: none !important;
  transform: none !important;
}

.btn-disabled:hover {
  background: #e8edf4 !important;
  color: #999 !important;
  box-shadow: none !important;
  transform: none !important;
}

.btn-pass.btn-disabled,
.btn-reject.btn-disabled,
.btn-edit.btn-disabled,
.btn-delete.btn-disabled {
  background: #e8edf4 !important;
  color: #999 !important;
  border-color: #d5dce6 !important;
  box-shadow: none !important;
}
@media (max-width: 480px) {
  .audit-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .action-buttons {
    flex-wrap: wrap;
  }

  .action-buttons button {
    flex: 1;
    min-width: 60px;
    font-size: 12px;
    padding: 5px 10px;
  }

  .modal-box {
    padding: 20px;
  }
}
</style>
