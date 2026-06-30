<template>
  <div class="role-page">
    <div class="page-header">
      <h2>角色管理</h2>
    </div>

    <div class="table-wrapper">
      <table class="user-table">
        <thead>
        <tr>
          <th>ID</th>
          <th>用户名</th>
          <th>角色</th>
          <th>创建时间</th>
          <th>操作</th>
        </tr>
        </thead>
        <tbody>
        <tr v-if="loading"><td colspan="5" class="center">加载中...</td></tr>
        <tr v-else-if="users.length === 0"><td colspan="5" class="center">暂无数据</td></tr>
        <tr v-for="user in users" :key="user.id">
          <td>{{ user.id }}</td>
          <td>{{ user.username }}</td>
          <td>
            <span class="role-badge" :class="getRoleClass(user.role)">
              {{ user.role || '未分配' }}
            </span>
          </td>
          <td>{{ formatTime(user.createdTime) }}</td>
          <td>
            <button
                class="btn-auth"
                @click="handleAuthorize(user)"
                :class="{ 'btn-disabled': !user.role || !hasPermission('role:assign-permission') }"
                :disabled="!user.role || !hasPermission('role:assign-permission')"
            >
              授权
            </button>
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- 授权弹窗 -->
    <div v-if="authVisible" class="modal-overlay" @click.self="authVisible = false">
      <div class="modal-box">
        <h3>角色授权 — {{ authRoleName }}（{{ authUsername }}）</h3>
        <div class="tree-wrapper">
          <MyTree
              v-for="p in permissionTree"
              :key="p.id"
              :item="p"
              @update="handleTreeUpdate"
          />
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="authVisible = false">取消</button>
          <button class="btn-confirm" @click="saveAuthorize">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, provide } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getRoleInfoPage,
  getPermissionTree,
  getRolePermissionIds,
  authorizeRole,
  getUserRolePermissions
} from '@/http/role.ts'
import { Userdata } from '@/http/user.ts'
import MyTree from '@/view/MyTree.vue'

const currentUserId = ref(Number(localStorage.getItem('userId')) || 11)
const userPermissions = ref<string[]>([])
const users = ref<any[]>([])
const loading = ref(false)

// 授权弹窗
const authVisible = ref(false)
const authUsername = ref('')
const authRoleName = ref('')
const authRoleId = ref<number | null>(null)
const permissionTree = ref<any[]>([])
const permissionIds = ref<number[]>([])
const permMap = ref<Map<any, any>>(new Map())

provide('permissionMap', permMap.value)

const hasPermission = (code: string) => userPermissions.value.includes(code)

const fetchPerms = async () => {
  try {
    const res: any = await getUserRolePermissions(currentUserId.value)
    if (Array.isArray(res)) userPermissions.value = res
    else if (res?.data) userPermissions.value = Array.isArray(res.data) ? res.data : []
  } catch { userPermissions.value = [] }
}

const fetchUsers = async () => {
  loading.value = true
  try {
    const res: any = await Userdata(currentUserId.value)
    users.value = (res?.data || []).map((u: any) => ({
      id: u.id, username: u.username, role: u.role || '', createdTime: u.createdTime
    }))
  } catch { ElMessage.error('加载失败') }
  finally { loading.value = false }
}

// ==================== 授权 ====================

const buildMap = (list: any[], parent: any = null) => {
  list.forEach((item: any) => {
    if (parent) permMap.value.set(item.id, parent)
    if (item.children?.length) buildMap(item.children, item)
  })
}

const handleAuthorize = async (user: any) => {
  if (!user.role) { ElMessage.warning('该用户未分配角色'); return }

  // 用角色名查找角色ID
  const roleRes: any = await getRoleInfoPage(currentUserId.value, { currentPage: 1, pageSize: 9999, params: [] })
  const roles: any[] = roleRes?.data?.records || []
  const role = roles.find((r: any) => r.name === user.role)
  if (!role) { ElMessage.warning('角色不存在'); return }

  authUsername.value = user.username
  authRoleName.value = user.role
  authRoleId.value = role.id
  authVisible.value = true

  try {
    const treeRes: any = await getPermissionTree(currentUserId.value)
    if (treeRes?.success === false) { ElMessage.error(treeRes.message); return }
    permissionTree.value = (treeRes.data || []).map((item: any) => ({ ...item, checked: false, indeterminate: false }))
    buildMap(permissionTree.value, null)

    const permRes: any = await getRolePermissionIds(role.id, currentUserId.value)
    if (permRes?.success === false) { ElMessage.error(permRes.message); return }
    permissionIds.value = permRes.data || []
    setChecked(permissionTree.value)
    calcIndeterminate(permissionTree.value)
  } catch { ElMessage.error('获取权限失败') }
}

const setChecked = (list: any[]) => {
  list.forEach((item: any) => {
    if (permissionIds.value.includes(item.id)) item.checked = true
    if (item.children?.length) setChecked(item.children)
  })
}

const calcIndeterminate = (list?: any[]): number => {
  if (!list) return 1
  let total = 0, checked = 0
  list.forEach((item: any) => {
    if (item.children?.length) {
      const r = calcIndeterminate(item.children)
      if (r === 0) { item.checked = true; item.indeterminate = false }
      else if (r === 2) { item.checked = true; item.indeterminate = true }
      else item.indeterminate = false
    }
    total++; if (item.checked) checked++
  })
  if (total === checked) return 0
  if (checked === 0) return 1
  return 2
}

const handleTreeUpdate = () => calcIndeterminate(permissionTree.value)

const getCheckedIds = (list: any[]): number[] => {
  let ids: number[] = []
  list.forEach((item: any) => {
    if (item.checked || item.indeterminate) ids.push(item.id)
    if (item.children?.length) ids = ids.concat(getCheckedIds(item.children))
  })
  return ids
}

const saveAuthorize = async () => {
  if (!authRoleId.value) return
  try {
    await authorizeRole(currentUserId.value, {
      roleId: authRoleId.value,
      permissionIds: getCheckedIds(permissionTree.value)
    })
    ElMessage.success('授权已保存')
    authVisible.value = false
  } catch { ElMessage.error('保存失败') }
}

// ==================== 工具 ====================

const formatTime = (t: string) => t ? new Date(t).toLocaleString('zh-CN') : '-'

const getRoleClass = (role: string) => {
  const map: Record<string, string> = {
    '超级管理员': 'role-super', '管理员': 'role-admin',
    '店长': 'role-manager', '店员': 'role-staff'
  }
  return map[role] || ''
}

onMounted(async () => { await fetchPerms(); await fetchUsers() })
</script>

<style scoped>
* { margin: 0; padding: 0; box-sizing: border-box; }
.role-page { height: 100%; padding: 24px; background: #f5f7fa; display: flex; flex-direction: column; }
.page-header { padding: 20px 24px; background: #fff; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
.page-header h2 { font-size: 22px; color: #1f2d3d; font-weight: 600; }
.table-wrapper { flex: 1; background: #fff; border-radius: 8px; padding: 20px; overflow: auto; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
.user-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.user-table thead { background: #f5f7fa; }
.user-table th { padding: 14px 16px; text-align: left; font-weight: 600; color: #4a5568; border-bottom: 2px solid #e5e6eb; }
.user-table td { padding: 14px 16px; border-bottom: 1px solid #e5e6eb; color: #2d3748; }
.user-table tbody tr:hover { background: #f7fafc; }
.center { text-align: center; color: #8899b0; padding: 40px; }

.role-badge { padding: 4px 14px; border-radius: 20px; font-size: 13px; font-weight: 500; }
.role-super { background: #fff3cd; color: #856404; }
.role-admin { background: #fde8e8; color: #c0392b; }
.role-manager { background: #e8f5e9; color: #27ae60; }
.role-staff { background: #e8f0fd; color: #1a5cff; }

.btn-auth { padding: 6px 18px; background: #27ae60; color: #fff; border: none; border-radius: 4px; font-size: 13px; cursor: pointer; transition: background 0.3s; }
.btn-auth:hover { background: #219a52; }
.btn-disabled { opacity: 0.5; cursor: not-allowed !important; pointer-events: none; background: #e8edf4 !important; color: #999 !important; }

/* 弹窗 */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.45); display: flex; justify-content: center; align-items: center; z-index: 9999; }
.modal-box { background: #fff; border-radius: 12px; padding: 28px 36px; width: 560px; max-width: 92%; max-height: 80vh; display: flex; flex-direction: column; box-shadow: 0 8px 40px rgba(0,0,0,0.2); }
.modal-box h3 { font-size: 18px; color: #1f2d3d; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid #e5e6eb; flex-shrink: 0; }
.tree-wrapper { flex: 1; overflow-y: auto; padding: 4px 0; min-height: 0; }
.modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 14px; padding-top: 14px; border-top: 1px solid #e5e6eb; flex-shrink: 0; }
.modal-actions button { padding: 10px 28px; border: none; border-radius: 6px; font-size: 14px; font-weight: 500; cursor: pointer; }
.btn-cancel { background: #e5e6eb; color: #4a5568; }
.btn-cancel:hover { background: #d5d6db; }
.btn-confirm { background: #0F3C7C; color: #fff; }
.btn-confirm:hover { background: #0a2d5e; }
</style>
