<template>
  <div class="user-panel">
    <div class="panel-header">
      <h2>用户管理</h2>
      <div class="header-right">
        <input
            class="search-input"
            v-model="searchUsername"
            placeholder="搜索用户名..."
            @keyup.enter="handleSearch"
        />
        <button
            class="btn-add"
            @click="openAdd"
            :class="{ 'btn-disabled': !hasPermission('user:add') }"
            :disabled="!hasPermission('user:add')"
        >
          ＋ 新增用户
        </button>
      </div>
    </div>

    <div class="table-wrapper">
      <table class="user-table">
        <thead>
        <tr>
          <th class="col-id">ID</th>
          <th class="col-name">用户名</th>
          <th class="col-role">角色</th>
          <th class="col-time">创建时间</th>
          <th class="col-actions">操作</th>
        </tr>
        </thead>
        <tbody>
        <tr v-if="loading">
          <td colspan="5" class="loading-state">加载中...</td>
        </tr>
        <tr v-else-if="users.length === 0">
          <td colspan="5" class="empty-state">暂无用户</td>
        </tr>
        <tr v-for="user in users" :key="user.id">
          <td class="col-id"><span class="user-id">{{ user.id }}</span></td>
          <td class="col-name">{{ user.username }}</td>
          <td class="col-role">
              <span class="user-role-badge" :class="getRoleClass(user.role)">
                {{ user.role || '未分配' }}
              </span>
          </td>
          <td class="col-time">{{ formatTime(user.createdTime) }}</td>
          <td class="col-actions">
            <button
                class="btn-edit"
                @click="openEdit(user.id)"
                :class="{ 'btn-disabled': !hasPermission('user:edit') }"
                :disabled="!hasPermission('user:edit')"
            >
              修改
            </button>
            <button
                class="btn-delete"
                @click="confirmDelete(user)"
                :class="{ 'btn-disabled': !hasPermission('user:delete') }"
                :disabled="!hasPermission('user:delete')"
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
            :page-sizes="[10, 20, 50]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 修改弹窗 -->
    <div v-if="editModal.visible" class="modal-overlay" @click.self="closeEdit">
      <div class="modal-box">
        <h3>修改角色 — {{ editModal.currentUsername }}</h3>
        <div class="edit-role-group">
          <div
              v-for="role in ALL_ROLES"
              :key="role"
              class="edit-role-option"
          >
            <input
                type="radio"
                :id="'role-' + role"
                :value="role"
                v-model="editModal.selectedRole"
            />
            <label :for="'role-' + role">{{ role }}</label>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="closeEdit">取消</button>
          <button class="btn-save" @click="saveEdit">确认修改</button>
        </div>
      </div>
    </div>

    <!-- 新增弹窗 -->
    <div v-if="addModal.visible" class="modal-overlay" @click.self="closeAdd">
      <div class="modal-box">
        <h3>新增用户</h3>
        <div class="add-field">
          <label for="addName">用户名</label>
          <input
              id="addName"
              type="text"
              v-model="addModal.username"
              placeholder="请输入用户名"
          />
        </div>
        <div class="add-field">
          <label for="addPwd">密码</label>
          <input
              id="addPwd"
              type="text"
              v-model="addModal.password"
              placeholder="默认密码：123456"
          />
        </div>
        <div class="add-field">
          <label for="addRole">授权角色</label>
          <select id="addRole" v-model="addModal.role">
            <option v-for="role in ALL_ROLES" :key="role" :value="role">
              {{ role }}
            </option>
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="closeAdd">取消</button>
          <button class="btn-save" @click="confirmAdd">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getUserPage,
  updateUser,
  adduser,
  deleteUser,
  getUserRole,
  getUserPermissions
} from '@/http/user'

const currentUserId = ref(Number(localStorage.getItem('userId')) || 11)
const userPermissions = ref([])
let ALL_ROLES = ['超级管理员', '管理员', '店员', '店长']

const users = ref([])
const loading = ref(false)

// 分页状态
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 搜索
const searchUsername = ref('')

const editModal = reactive({
  visible: false,
  userId: null,
  currentUsername: '',
  currentRole: '',
  selectedRole: '',
})

const addModal = reactive({
  visible: false,
  username: '',
  password: '123456',
  role: '店员',
})

// ==================== 权限控制 ====================

const hasPermission = (code) => {
  return userPermissions.value.includes(code)
}

const fetchUserPermissions = async () => {
  try {
    const res = await getUserPermissions(currentUserId.value)
    if (res && res.success === false) {
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
  } catch (error) {
    userPermissions.value = []
  }
}

// ==================== 数据获取 ====================

async function fetchUsers() {
  loading.value = true
  try {
    const pageRequest = {
      currentPage: currentPage.value,
      pageSize: pageSize.value,
      params: searchUsername.value
          ? [{ name: 'username', value: searchUsername.value }]
          : []
    }
    const res = await getUserPage(currentUserId.value, pageRequest)
    if (res && res.success === false) {
      ElMessage.error(res.message || '获取用户列表失败')
      users.value = []
      total.value = 0
      return
    }
    if (res && res.data) {
      users.value = res.data.records || []
      total.value = res.data.total || 0
    } else {
      users.value = []
      total.value = 0
    }
  } catch (error) {
    ElMessage.error('获取用户列表失败')
    users.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handlePageChange(page) {
  currentPage.value = page
  fetchUsers()
}

function handleSizeChange(size) {
  pageSize.value = size
  currentPage.value = 1
  fetchUsers()
}

function handleSearch() {
  currentPage.value = 1
  fetchUsers()
}

// ==================== 生命周期 ====================

onMounted(async () => {
  await fetchUserPermissions()
  await fetchUsers()
  const roleRes = await getUserRole(currentUserId.value)
  ALL_ROLES = roleRes.data || []
})

// ==================== 编辑 ====================

function openEdit(userId) {
  if (!hasPermission('user:edit')) {
    ElMessage.warning('您没有修改用户的权限')
    return
  }
  const user = users.value.find((u) => u.id === userId)
  if (!user) return
  editModal.userId = userId
  editModal.currentUsername = user.username
  editModal.currentRole = user.role || ''
  editModal.selectedRole = user.role || ALL_ROLES[0] || ''
  editModal.visible = true
}

function closeEdit() {
  editModal.visible = false
  editModal.userId = null
}

async function saveEdit() {
  if (!editModal.userId) return
  if (!editModal.selectedRole) {
    ElMessage.warning('请选择一个角色')
    return
  }
  try {
    await updateUser(currentUserId.value, {
      id: editModal.userId,
      role: editModal.selectedRole
    })
    ElMessage.success('角色更新成功')
    closeEdit()
    await fetchUsers()
  } catch (error) {
    ElMessage.error('更新失败，请重试')
  }
}

// ==================== 新增 ====================

function openAdd() {
  if (!hasPermission('user:add')) {
    ElMessage.warning('您没有新增用户的权限')
    return
  }
  addModal.username = ''
  addModal.password = '123456'
  addModal.role = ALL_ROLES.length > 0 ? ALL_ROLES[0] : '店员'
  addModal.visible = true
}

function closeAdd() {
  addModal.visible = false
}

async function confirmAdd() {
  const username = addModal.username.trim()
  if (!username) {
    ElMessage.warning('请输入用户名')
    return
  }
  if (!addModal.role) {
    ElMessage.warning('请选择授权角色')
    return
  }
  const password = addModal.password.trim() || '123456'

  try {
    const newUser = {
      username: username,
      password: password,
      role: addModal.role,
      createdTime: new Date().toISOString(),
      updatedTime: new Date().toISOString()
    }

    await adduser(currentUserId.value, newUser)

    ElMessage.success('用户新增成功')
    closeAdd()
    await fetchUsers()
  } catch (error) {
    ElMessage.error('添加失败，请重试')
  }
}

// ==================== 删除 ====================

const confirmDelete = async (user) => {
  if (!hasPermission('user:delete')) {
    ElMessage.warning('您没有删除用户的权限')
    return
  }
  try {
    await ElMessageBox.confirm(`确定要删除用户 "${user.username}" 吗？`, '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteUser(currentUserId.value, { id: user.id })
    ElMessage.success('用户已删除')
    await fetchUsers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败，请重试')
    }
  }
}

// ==================== 工具函数 ====================

function getRoleClass(role) {
  const roleMap = {
    '超级管理员': 'role-super',
    '管理员': 'role-admin',
    '店员': 'role-staff',
    '店长': 'role-manager',
  }
  return roleMap[role] || ''
}

function formatTime(t) {
  return t ? new Date(t).toLocaleString('zh-CN') : '-'
}
</script>

<style scoped>
* { margin: 0; padding: 0; box-sizing: border-box; }

.user-panel {
  height: 100%;
  padding: 24px;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}

.panel-header h2 {
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
  padding: 8px 14px;
  border: 1px solid #dce3ed;
  border-radius: 6px;
  font-size: 13px;
  width: 180px;
  outline: none;
  background: #fff;
}

.search-input:focus {
  border-color: #0F3C7C;
  box-shadow: 0 0 0 2px rgba(15,60,124,0.1);
}

.btn-add {
  padding: 8px 20px;
  background: #0F3C7C;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-add:hover { background: #0a2d5e; }

.table-wrapper {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  overflow: auto;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}

.user-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.user-table thead { background: #f5f7fa; }

.user-table th {
  padding: 14px 16px;
  text-align: left;
  font-weight: 600;
  color: #4a5568;
  border-bottom: 2px solid #e5e6eb;
}

.user-table td {
  padding: 14px 16px;
  border-bottom: 1px solid #e5e6eb;
  color: #2d3748;
}

.user-table tbody tr:hover { background: #f7fafc; }

.col-id { width: 80px; }
.col-name { min-width: 120px; }
.col-role { width: 160px; }
.col-time { width: 160px; white-space: nowrap; }
.col-actions { width: 160px; text-align: right; }

.user-id {
  font-weight: 600;
  color: #8899b0;
  background: #eef2f6;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-family: monospace;
}

.user-role-badge {
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}

.role-super { background: #fff3cd; color: #856404; }
.role-admin { background: #fde8e8; color: #c0392b; }
.role-manager { background: #e8f5e9; color: #27ae60; }
.role-staff { background: #e8f0fd; color: #1a5cff; }

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding-top: 18px;
  margin-top: 8px;
  border-top: 1px solid #eef2f8;
}

.loading-state, .empty-state {
  text-align: center;
  color: #8899b0;
  padding: 40px;
}

/* 操作按钮 */
.col-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.btn-edit {
  padding: 6px 16px;
  background: #3498db;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-edit:hover { background: #2980b9; }

.btn-delete {
  padding: 6px 16px;
  background: #95a5a6;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-delete:hover { background: #7f8c8d; }

.btn-disabled {
  opacity: 0.5;
  cursor: not-allowed !important;
  pointer-events: none;
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0,0,0,0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.modal-box {
  background: #fff;
  border-radius: 12px;
  padding: 28px 36px;
  width: 440px;
  max-width: 92%;
  box-shadow: 0 8px 40px rgba(0,0,0,0.2);
}

.modal-box h3 {
  font-size: 18px;
  color: #1f2d3d;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e5e6eb;
}

.edit-role-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.edit-role-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-radius: 6px;
  background: #f8faff;
  border: 1px solid #e5e6eb;
  cursor: pointer;
  transition: background 0.15s;
}

.edit-role-option:hover { background: #eef2f8; }

.edit-role-option input[type='radio'] {
  width: 16px; height: 16px;
  accent-color: #0F3C7C;
  cursor: pointer;
}

.edit-role-option label {
  font-size: 15px;
  color: #1f2d3d;
  cursor: pointer;
}

.add-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.add-field label {
  font-size: 14px;
  font-weight: 500;
  color: #1f2d3d;
}

.add-field input,
.add-field select {
  padding: 10px 14px;
  border: 1px solid #dce3ed;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  background: #fff;
}

.add-field input:focus,
.add-field select:focus {
  border-color: #0F3C7C;
  box-shadow: 0 0 0 2px rgba(15,60,124,0.1);
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 14px;
  border-top: 1px solid #e5e6eb;
}

.modal-actions button {
  padding: 10px 28px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.btn-cancel { background: #e5e6eb; color: #4a5568; }
.btn-cancel:hover { background: #d5d6db; }
.btn-save { background: #0F3C7C; color: #fff; }
.btn-save:hover { background: #0a2d5e; }
</style>
