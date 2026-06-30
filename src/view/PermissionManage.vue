<template>
  <div class="permission-page">
    <div class="page-header">
      <h2>权限管理</h2>
      <div class="header-right">
        <input
            class="search-input"
            v-model="searchName"
            placeholder="搜索权限名称..."
            @keyup.enter="handleSearch"
        />
        <button
            class="btn-add"
            @click="openAddDialog"
            :class="{ 'btn-disabled': !hasPermission('role:add') }"
            :disabled="!hasPermission('role:add')"
        >
          新增权限
        </button>
      </div>
    </div>

    <div class="table-wrapper">
      <table class="permission-table">
        <thead>
        <tr>
          <th>ID</th>
          <th>权限名称</th>
          <th>类型</th>
          <th>路由</th>
          <th>父级权限</th>
          <th>操作</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="item in permissionList" :key="item.id">
          <td>{{ item.id }}</td>
          <td>{{ item.name }}</td>
          <td>
              <span class="tag" :class="getTypeClass(item.menuType)">
                {{ item.menuType }}
              </span>
          </td>
          <td>{{ item.path || '-' }}</td>
          <td>{{ getParentName(item.parentId) || '目录' }}</td>
          <td>
            <button
                class="btn-edit"
                @click="openEditDialog(item)"
                :class="{ 'btn-disabled': !hasPermission('role:edit') }"
                :disabled="!hasPermission('role:edit')"
            >
              编辑
            </button>
            <button
                class="btn-delete"
                @click="handleDelete(item)"
                :class="{ 'btn-disabled': !hasPermission('role:delete') }"
                :disabled="!hasPermission('role:delete')"
            >
              删除
            </button>
          </td>
        </tr>
        </tbody>
      </table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <div v-if="dialogVisible" class="modal-overlay" @click.self="closeDialog">
      <div class="modal-box">
        <h3>{{ isEdit ? '编辑权限' : '新增权限' }}</h3>
        <div class="form-group">
          <label>权限名称</label>
          <input v-model="formData.name" type="text" placeholder="请输入权限名称" />
        </div>
        <div class="form-group">
          <label>类型</label>
          <select v-model="formData.menuType">
            <option value="directory">目录</option>
            <option value="menu">菜单</option>
            <option value="button">按钮</option>
          </select>
        </div>
        <div class="form-group">
          <label>路由</label>
          <input v-model="formData.path" type="text" placeholder="请输入路由路径" />
        </div>
        <div class="form-group">
          <label>父级权限</label>
          <select v-model="formData.parentId">
            <option :value="0">顶级权限</option>
            <option v-for="item in parentOptions" :key="item.id" :value="item.id">
              {{ item.name }}
            </option>
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="closeDialog">取消</button>
          <button class="btn-confirm" @click="submitForm">
            {{ isEdit ? '保存修改' : '确定' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getPermissionList,
  getPermissionPage,
  createPermission,
  updatePermission,
  deletePermission,
  getUserPermissions
} from '@/http/permission.ts'

// ==================== 类型定义 ====================

interface Permission {
  id: number
  name: string
  menuType: string
  path: string
  parentId: number
  code?: string
  sort?: number
  createTime?: string
}

// ==================== 状态 ====================

// 当前用户ID - 从 localStorage 获取
const currentUserId = ref<number>(Number(localStorage.getItem('userId')) || 11)

// 用户权限列表
const userPermissions = ref<string[]>([])

// 权限列表
const permissionList = ref<Permission[]>([])

// 分页状态
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 搜索关键词
const searchName = ref('')

// 弹窗控制
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref<number | null>(null)

// 表单数据
const formData = ref({
  name: '',
  menuType: 'MENU',
  path: '',
  parentId: 0
})

// ==================== 计算属性 ====================

const parentOptions = computed(() => {
  if (isEdit.value && editId.value) {
    return permissionList.value.filter(item => item.id !== editId.value)
  }
  return permissionList.value
})

// ==================== 方法 ====================

/**
 * 检查是否有某个权限
 */
const hasPermission = (code: string): boolean => {
  return userPermissions.value.includes(code)
}

/**
 * 获取父级权限名称
 */
const getParentName = (parentId: number): string => {
  const parent = permissionList.value.find(item => item.id === parentId)
  return parent ? parent.name : ''
}

/**
 * 获取类型样式
 */
const getTypeClass = (menuType: string): string => {
  const map: Record<string, string> = {
    'DIRECTORY': 'type-directory',
    'MENU': 'type-menu',
    'BUTTON': 'type-button',
  }
  return map[menuType] || ''
}

/**
 * 获取用户权限
 */
const fetchUserPermissions = async () => {
  try {
    const res: any = await getUserPermissions(currentUserId.value)
    console.log('用户权限响应:', res)

    if (res && res.success === false) {
      console.warn('获取用户权限失败:', res.message)
      userPermissions.value = []
      return
    }

    // 解析数据
    if (Array.isArray(res)) {
      userPermissions.value = res
    } else if (res && res.data) {
      userPermissions.value = Array.isArray(res.data) ? res.data : []
    } else {
      userPermissions.value = []
    }
    console.log('用户权限列表:', userPermissions.value)
  } catch (error) {
    console.error('获取用户权限失败:', error)
    userPermissions.value = []
  }
}

/**
 * 获取权限列表（分页）
 */
const fetchPermissions = async () => {
  try {
    const pageRequest = {
      currentPage: currentPage.value,
      pageSize: pageSize.value,
      params: searchName.value
          ? [{ name: 'name', value: searchName.value }]
          : []
    }
    const res: any = await getPermissionPage(currentUserId.value, pageRequest)
    console.log('权限列表响应:', res)

    if (res && res.success === false) {
      ElMessage.error(res.message || '获取权限列表失败')
      permissionList.value = []
      total.value = 0
      return
    }

    // 解析分页数据
    if (res && res.data) {
      permissionList.value = res.data.records || []
      total.value = res.data.total || 0
    } else {
      permissionList.value = []
      total.value = 0
    }

    console.log('权限列表:', permissionList.value, '总数:', total.value)
  } catch (error: any) {
    const message = error.response?.data?.message || '获取权限列表失败'
    ElMessage.error(message)
    permissionList.value = []
    total.value = 0
  }
}

/**
 * 翻页
 */
const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchPermissions()
}

/**
 * 每页条数变化
 */
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  fetchPermissions()
}

/**
 * 搜索
 */
const handleSearch = () => {
  currentPage.value = 1
  fetchPermissions()
}

/**
 * 新增权限
 */
const addPermission = async (data: any) => {
  const res: any = await createPermission(currentUserId.value, data)
  if (res && res.success === false) {
    throw new Error(res.message || '新增权限失败')
  }
  return res
}

/**
 * 更新权限
 */
const updatePermissionById = async (id: number, data: any) => {
  const res: any = await updatePermission(id, currentUserId.value, data)
  if (res && res.success === false) {
    throw new Error(res.message || '更新权限失败')
  }
  return res
}

/**
 * 删除权限
 */
const deletePermissionById = async (id: number) => {
  const res: any = await deletePermission(id, currentUserId.value)
  if (res && res.success === false) {
    throw new Error(res.message || '删除权限失败')
  }
  return res
}

/**
 * 打开新增弹窗
 */
const openAddDialog = () => {
  isEdit.value = false
  editId.value = null
  formData.value = { name: '', menuType: 'MENU', path: '', parentId: 0 }
  dialogVisible.value = true
}

/**
 * 打开编辑弹窗
 */
const openEditDialog = (item: Permission) => {
  isEdit.value = true
  editId.value = item.id
  formData.value = {
    name: item.name,
    menuType: item.menuType || 'MENU',
    path: item.path || '',
    parentId: item.parentId || 0,
  }
  dialogVisible.value = true
}

/**
 * 关闭弹窗
 */
const closeDialog = () => {
  dialogVisible.value = false
}

/**
 * 提交表单
 */
const submitForm = async () => {
  if (!formData.value.name.trim()) {
    ElMessage.warning('请输入权限名称')
    return
  }

  try {
    if (isEdit.value && editId.value) {
      await updatePermissionById(editId.value, formData.value)
      ElMessage.success('权限已更新')
    } else {
      await addPermission(formData.value)
      ElMessage.success('权限已新增')
    }
    closeDialog()
    await fetchPermissions()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败，请重试')
  }
}

/**
 * 删除权限
 */
const handleDelete = async (item: Permission) => {
  try {
    await ElMessageBox.confirm(`确认删除权限"${item.name}"吗？`, '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deletePermissionById(item.id)
    ElMessage.success('权限已删除')
    await fetchPermissions()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败，请重试')
    }
  }
}

// ==================== 生命周期 ====================

onMounted(async () => {
  // 先获取用户权限，再获取权限列表
  await fetchUserPermissions()
  await fetchPermissions()
})
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.permission-page {
  height: 100%;
  padding: 24px;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
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

.btn-add.btn-disabled {
  background: #e8edf4 !important;
  color: #999 !important;
  box-shadow: none !important;
}

.btn-edit.btn-disabled,
.btn-delete.btn-disabled {
  background: #e8edf4 !important;
  color: #999 !important;
  border-color: #d5dce6 !important;
  box-shadow: none !important;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}

.page-header h2 {
  font-size: 22px;
  color: #1f2d3d;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-input {
  padding: 10px 16px;
  border: 1px solid #dce3ed;
  border-radius: 6px;
  font-size: 14px;
  width: 220px;
  transition: border-color 0.3s;
  background: #fff;
}

.search-input:focus {
  outline: none;
  border-color: #0F3C7C;
  box-shadow: 0 0 0 3px rgba(15,60,124,0.1);
}

.btn-add {
  padding: 10px 24px;
  background: #0F3C7C;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-add:hover {
  background: #0a2d5e;
}

.table-wrapper {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  overflow: auto;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}

.permission-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.permission-table thead {
  background: #f5f7fa;
}

.permission-table th {
  padding: 14px 16px;
  text-align: left;
  font-weight: 600;
  color: #4a5568;
  border-bottom: 2px solid #e5e6eb;
}

.permission-table td {
  padding: 14px 16px;
  border-bottom: 1px solid #e5e6eb;
  color: #2d3748;
}

.permission-table tbody tr:hover {
  background: #f7fafc;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding-top: 20px;
  margin-top: 8px;
  border-top: 1px solid #e5e6eb;
}

.tag {
  padding: 4px 14px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.type-directory {
  background: #e8f0fe;
  color: #1a73e8;
}

.type-menu {
  background: #e6f7e6;
  color: #27ae60;
}

.type-button {
  background: #fef3e2;
  color: #e67e22;
}

.btn-edit {
  padding: 6px 16px;
  background: #0F3C7C;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  margin-right: 8px;
  transition: background 0.3s;
}

.btn-edit:hover {
  background: #0a2d5e;
}

.btn-delete {
  padding: 6px 16px;
  background: #e74c3c;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-delete:hover {
  background: #c0392b;
}

.no-action {
  color: #999;
  font-size: 13px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: fadeIn 0.25s ease;
}

.modal-box {
  background: #fff;
  border-radius: 12px;
  padding: 32px 40px;
  width: 480px;
  max-width: 92%;
  box-shadow: 0 8px 40px rgba(0,0,0,0.2);
  animation: slideUp 0.3s ease;
}

.modal-box h3 {
  font-size: 20px;
  color: #1f2d3d;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e5e6eb;
}

.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #2d3748;
  margin-bottom: 6px;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #dce3ed;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
  background: #fff;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #0F3C7C;
  box-shadow: 0 0 0 3px rgba(15,60,124,0.1);
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e5e6eb;
}

.modal-actions button {
  padding: 10px 28px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-cancel {
  background: #e5e6eb;
  color: #4a5568;
}

.btn-cancel:hover {
  background: #d5d6db;
}

.btn-confirm {
  background: #0F3C7C;
  color: #fff;
}

.btn-confirm:hover {
  background: #0a2d5e;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>