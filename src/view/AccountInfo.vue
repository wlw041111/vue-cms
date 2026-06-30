<template>
  <div class="account-page">
    <h2>👤 账号信息</h2>

    <div class="info-card">
      <div class="info-row">
        <span class="label">用户 ID</span>
        <span class="value id-val">{{ currentUserId }}</span>
      </div>
      <div class="divider"></div>
      <div class="info-row">
        <span class="label">用户名</span>
        <span class="value">{{ account.username }}</span>
      </div>
      <div class="divider"></div>
      <div class="info-row">
        <span class="label">角色</span>
        <span class="value role-badge" :class="getRoleClass(account.role)">
          {{ account.role || '未分配' }}
        </span>
      </div>
      <div class="divider"></div>
      <div class="info-row">
        <span class="label">创建时间</span>
        <span class="value">{{ formatTime(account.createdTime) }}</span>
      </div>
    </div>

    <button class="btn-edit" @click="openEdit">✏️ 修改账号信息</button>

    <!-- 修改弹窗 -->
    <div v-if="editVisible" class="modal-overlay" @click.self="closeEdit">
      <div class="modal-box">
        <button class="btn-close" @click="closeEdit">✕</button>
        <h3>✏️ 修改账号信息</h3>

        <div class="field">
          <label>用户名</label>
          <input v-model="editForm.username" type="text" placeholder="请输入新用户名" />
        </div>

        <div class="field">
          <label>新密码（留空则不修改）</label>
          <input v-model="editForm.password" type="password" placeholder="留空则保持原密码" />
        </div>

        <div class="field">
          <label>确认新密码</label>
          <input v-model="editForm.confirmPassword" type="password" placeholder="再次输入新密码" />
        </div>

        <button class="btn-save" @click="saveEdit" :disabled="saving">
          {{ saving ? '保存中...' : '确认修改' }}
        </button>
      </div>
    </div>

    <!-- 提示 -->
    <div v-if="msg.visible" class="toast" :class="'toast-' + msg.type">{{ msg.text }}</div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Userdata, updateUser } from '@/http/user'

const currentUserId = ref(Number(localStorage.getItem('userId')) || 1)

const account = reactive({
  username: '',
  role: '',
  createdTime: '',
})

const editVisible = ref(false)
const saving = ref(false)
const editForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
})

const msg = reactive({ visible: false, text: '', type: 'info' })
let msgTimer = null

const showMsg = (text, type = 'info') => {
  if (msgTimer) clearTimeout(msgTimer)
  msg.text = text
  msg.type = type
  msg.visible = true
  msgTimer = setTimeout(() => { msg.visible = false }, 2500)
}

const loadAccount = async () => {
  try {
    const res = await Userdata(currentUserId.value)
    const users = res?.data || res || []
    const user = Array.isArray(users)
      ? users.find(u => u.id === currentUserId.value)
      : null
    if (user) {
      account.username = user.username || ''
      account.role = user.role || ''
      account.createdTime = user.createdTime || ''
    }
  } catch {
    showMsg('加载账号信息失败', 'error')
  }
}

const openEdit = () => {
  editForm.username = account.username
  editForm.password = ''
  editForm.confirmPassword = ''
  editVisible.value = true
}

const closeEdit = () => {
  editVisible.value = false
  saving.value = false
}

const saveEdit = async () => {
  const username = editForm.username.trim()
  if (!username) {
    showMsg('用户名不能为空', 'warning')
    return
  }

  const pw = editForm.password
  if (pw && pw.length < 6) {
    showMsg('密码不能少于6位', 'warning')
    return
  }
  if (pw && pw !== editForm.confirmPassword) {
    showMsg('两次输入的密码不一致', 'warning')
    return
  }

  saving.value = true
  try {
    const data = {
      id: currentUserId.value,
      username,
      role: account.role,
    }
    if (pw) data.password = pw

    await updateUser(currentUserId.value, data)

    // 更新本地存储
    localStorage.setItem('username', username)
    account.username = username
    closeEdit()
    showMsg('账号信息已更新', 'success')
  } catch {
    showMsg('修改失败，请重试', 'error')
  } finally {
    saving.value = false
  }
}

const formatTime = (t) => {
  if (!t) return '-'
  return t.substring(0, 16).replace('T', ' ')
}

const getRoleClass = (role) => {
  const map = {
    '超级管理员': 'role-super',
    '管理员': 'role-admin',
    '店长': 'role-manager',
    '店员': 'role-staff',
  }
  return map[role] || ''
}

onMounted(() => loadAccount())
</script>

<style scoped>
.account-page {
  height: 100%;
  padding: 30px 40px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.account-page h2 {
  font-size: 22px;
  color: #1a2c4a;
  margin: 0;
}

/* 信息卡片 */
.info-card {
  background: #fff;
  border-radius: 16px;
  padding: 28px 32px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  width: 500px;
  max-width: 100%;
}

.info-row {
  display: flex;
  align-items: center;
  padding: 12px 0;
}

.label {
  width: 100px;
  font-size: 14px;
  color: #8899b0;
  flex-shrink: 0;
}

.value {
  font-size: 15px;
  color: #1a2c4a;
  font-weight: 500;
}

.id-val {
  font-family: monospace;
  color: #8899b0;
}

.role-badge {
  padding: 3px 14px;
  border-radius: 20px;
  font-size: 13px;
}

.role-super { background: #fff3cd; color: #856404; }
.role-admin { background: #fde8e8; color: #c0392b; }
.role-manager { background: #e8f5e9; color: #27ae60; }
.role-staff { background: #e8f0fd; color: #1a5cff; }

.divider {
  border-top: 1px solid #eef2f6;
}

.btn-edit {
  padding: 10px 24px;
  background: #0F3C7C;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  width: fit-content;
}

.btn-edit:hover { background: #0a2d5e; }

/* 弹窗 */
.modal-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background: rgba(0,0,0,0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-box {
  background: #fff;
  border-radius: 16px;
  padding: 30px 36px;
  width: 420px;
  max-width: 94%;
  position: relative;
}

.modal-box h3 {
  font-size: 19px;
  color: #1a2c4a;
  margin: 0 0 22px 0;
  padding-bottom: 14px;
  border-bottom: 2px solid #eef2f6;
}

.btn-close {
  position: absolute;
  top: 14px; right: 18px;
  background: none;
  border: none;
  font-size: 20px;
  color: #999;
  cursor: pointer;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 16px;
}

.field label {
  font-size: 13px;
  font-weight: 600;
  color: #4a5568;
}

.field input {
  padding: 9px 14px;
  border: 1px solid #dce3ed;
  border-radius: 8px;
  font-size: 14px;
}

.field input:focus {
  outline: none;
  border-color: #0F3C7C;
}

.btn-save {
  width: 100%;
  padding: 12px;
  background: #0F3C7C;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  cursor: pointer;
  margin-top: 8px;
}

.btn-save:hover { background: #0a2d5e; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

/* Toast */
.toast {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 28px;
  border-radius: 10px;
  color: #fff;
  font-size: 14px;
  z-index: 9999;
}
.toast-success { background: #27ae60; }
.toast-error { background: #e74c3c; }
.toast-warning { background: #f39c12; }
</style>
