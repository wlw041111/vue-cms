<template>
  <div class="news-editor-container">
    <div class="editor-header">
      <h2>{{ isEditMode ? '编辑新闻' : '发布新闻' }}</h2>
      <button class="btn-back" @click="goBack">返回</button>
    </div>

    <div class="editor-form">
      <div class="form-row">
        <label>新闻标题：</label>
        <input type="text" v-model="title" placeholder="请输入新闻标题" />
      </div>

      <div class="form-row">
        <label>栏目：</label>
        <select v-model="category">
          <option value="党建工作">党建工作</option>
          <option value="通知公告">通知公告</option>
          <option value="学术活动">学术活动</option>
          <option value="学工新闻">学工新闻</option>
        </select>
      </div>

      <div class="form-row">
        <label>供稿人：</label>
        <input type="text" v-model="supplier" placeholder="请输入供稿人" />
      </div>

      <div class="form-row">
        <label>审稿人：</label>
        <input type="text" v-model="reviewer" placeholder="请输入审稿人" />
      </div>
    </div>

    <div style="border: 1px solid #ccc; height: 600px; margin-top: 16px;">
      <Toolbar
          style="border-bottom: 1px solid #ccc"
          :editor="editorRef"
          :defaultConfig="toolbarConfig"
          :mode="mode"
      />
      <Editor
          style="height: 500px;"
          v-model="content"
          :defaultConfig="editorConfig"
          :mode="mode"
          @onCreated="handleCreated"
      />
    </div>

    <div class="editor-actions">
      <button class="btn-cancel" @click="goBack">取消</button>
      <button
          class="btn-save"
          @click="saveNews"
          :class="{ 'btn-disabled': !hasPermission('content:news:audit') }"
          :disabled="!hasPermission('content:news:audit')"
      >
        {{ isEditMode ? '更新' : '保存' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import '@wangeditor/editor/dist/css/style.css'
import { onBeforeUnmount, ref, shallowRef, onMounted } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { SaveNews, getNewsDetail, updateNews, getUserNewsPermissions } from "@/http/new.ts"
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// ==================== 权限 ====================

const currentUserId = ref<number>(Number(localStorage.getItem('userId')) || 1)
const userPermissions = ref<string[]>([])

const hasPermission = (code: string): boolean => {
  return userPermissions.value.includes(code)
}

const fetchUserPermissions = async () => {
  try {
    const res: any = await getUserNewsPermissions(currentUserId.value)
    console.log('新闻-用户权限响应:', res)

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
    console.log('新闻-用户权限列表:', userPermissions.value)
  } catch (error) {
    console.error('获取用户权限失败:', error)
    userPermissions.value = []
  }
}

// ==================== 编辑器 ====================

const editorRef = shallowRef()
const toolbarConfig = {}
const mode = ref("default")
const content = ref('')
const category = ref<string>('党建工作')
const title = ref<string>('')
const supplier = ref<string>('')
const reviewer = ref<string>('')
const newsId = ref<number | null>(null)
const isEditMode = ref(false)

const editorConfig = { placeholder: '请输入内容......' }

const handleCreated = (editor: any) => {
  editorRef.value = editor
}

const loadNewsData = async (id: number) => {
  try {
    const res: any = await getNewsDetail(currentUserId.value, id)
    const data = res?.data || res
    if (data) {
      title.value = data.title || ''
      category.value = data.category || '党建工作'
      supplier.value = data.supplier || ''
      reviewer.value = data.reviewer || ''
      content.value = data.content || ''
      newsId.value = data.id
      isEditMode.value = true
      console.log('加载数据成功：', data)
    }
  } catch (error) {
    console.error('加载新闻数据失败：', error)
    alert('加载新闻数据失败，请重试')
  }
}

const saveNews = async () => {
  if (!hasPermission('content:news:audit')) {
    alert('您没有审核新闻的权限')
    return
  }

  if (!title.value || !title.value.trim()) {
    alert('请输入新闻标题')
    return
  }

  if (!content.value || content.value === '<p><br></p>') {
    alert('请输入新闻内容')
    return
  }

  try {
    const newsData = {
      id: newsId.value,
      title: title.value,
      category: category.value,
      supplier: supplier.value,
      reviewer: reviewer.value,
      content: content.value,
    }

    if (isEditMode.value) {
      await updateNews(currentUserId.value, newsData)
      alert('新闻更新成功！')
    } else {
      await SaveNews(currentUserId.value, newsData)
      alert('新闻发布成功！')
    }

    router.push('/content/news')
  } catch (error) {
    console.error('保存失败：', error)
    alert('保存失败，请重试')
  }
}

const goBack = () => {
  router.back()
}

// ==================== 生命周期 ====================

onMounted(async () => {
  await fetchUserPermissions()

  const id = route.query.id
  const modeParam = route.query.mode

  if (id && modeParam === 'edit') {
    await loadNewsData(Number(id))
  }
})

onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor == null) return
  editor.destroy()
})
</script>

<style scoped>
.news-editor-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 2px solid #e8edf4;
  margin-bottom: 20px;
}

.editor-header h2 {
  font-size: 24px;
  color: #0F3C7C;
  margin: 0;
}

.btn-back {
  padding: 8px 20px;
  border: none;
  border-radius: 6px;
  background: #e8edf4;
  color: #555;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-back:hover {
  background: #d5dce6;
}

.editor-form {
  display: flex;
  flex-wrap: wrap;
  gap: 20px 30px;
  padding: 16px 0;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.form-row label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
}

.form-row input,
.form-row select {
  padding: 8px 14px;
  border: 1px solid #dce3ed;
  border-radius: 6px;
  font-size: 14px;
  min-width: 200px;
}

.form-row input:focus,
.form-row select:focus {
  outline: none;
  border-color: #0F3C7C;
  box-shadow: 0 0 0 3px rgba(15, 60, 124, 0.1);
}

.editor-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e8edf4;
}

.editor-actions button {
  padding: 10px 30px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-cancel {
  background: #e8edf4;
  color: #555;
}

.btn-cancel:hover {
  background: #d5dce6;
}

.btn-save {
  background: #0F3C7C;
  color: #fff;
}

.btn-save:hover {
  background: #0a2d5e;
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

.btn-save.btn-disabled {
  background: #e8edf4 !important;
  color: #999 !important;
  box-shadow: none !important;
}
</style>
