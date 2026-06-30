<template>
  <div class="tree-item-wrapper">
    <div class="tree-item" :style="{ paddingLeft: level * 20 + 'px' }">
      <input
          type="checkbox"
          :checked="item.checked"
          :indeterminate="item.indeterminate"
          @change="toggleCheck"
      />
      <span class="node-label">{{ item.name }}</span>
      <span class="node-tag" :class="getTypeClass(item.menuType)">
        {{ getTypeText(item.menuType) }}
      </span>
    </div>
    <div v-if="item.children && item.children.length > 0" class="tree-children">
      <MyTree
          v-for="child in item.children"
          :key="child.id"
          :item="child"
          :level="level + 1"
          @update="$emit('update')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  level: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['update'])

const permissionMap = inject('permissionMap', new Map())

// 获取类型文本
const getTypeText = (menuType: string) => {
  const map: Record<string, string> = {
    'DIRECTORY': '目录',
    'MENU': '菜单',
    'BUTTON': '按钮'
  }
  return map[menuType] || menuType
}

// 获取类型样式
const getTypeClass = (menuType: string) => {
  const map: Record<string, string> = {
    'DIRECTORY': 'type-directory',
    'MENU': 'type-menu',
    'BUTTON': 'type-button'
  }
  return map[menuType] || ''
}

// 查找父节点
const findParent = (obj: any): any => {
  let parent = permissionMap.get(obj)
  if (parent && parent.parentId !== 0) {
    return findParent(parent)
  }
  return parent
}

// 递归设置子节点状态
const setChildrenChecked = (item: any, checked: boolean) => {
  item.checked = checked
  item.indeterminate = false
  if (item.children && item.children.length > 0) {
    item.children.forEach((child: any) => {
      setChildrenChecked(child, checked)
    })
  }
}

// 切换复选框
const toggleCheck = () => {
  const item = props.item
  const newChecked = !item.checked

  // 设置当前节点及所有子节点
  setChildrenChecked(item, newChecked)

  // 更新父节点状态
  updateParentState(item)

  // 触发更新事件
  emit('update')
}

// 更新父节点状态
const updateParentState = (item: any) => {
  const parent = permissionMap.get(item)
  if (!parent) return

  if (parent.children && parent.children.length > 0) {
    let allChecked = true
    let allUnchecked = true

    parent.children.forEach((child: any) => {
      if (child.checked) allUnchecked = false
      else allChecked = false
    })

    if (allChecked) {
      parent.checked = true
      parent.indeterminate = false
    } else if (allUnchecked) {
      parent.checked = false
      parent.indeterminate = false
    } else {
      parent.checked = true
      parent.indeterminate = true
    }

    // 递归更新上层父节点
    updateParentState(parent)
  }
}
</script>

<style scoped>
.tree-item-wrapper {
  margin-bottom: 2px;
}

.tree-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.tree-item:hover {
  background: #f5f7fa;
}

.tree-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  flex-shrink: 0;
}

.node-label {
  font-size: 14px;
  color: #2d3748;
}

.node-tag {
  font-size: 11px;
  padding: 2px 12px;
  border-radius: 10px;
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

.tree-children {
  border-left: 2px dashed #dce3ed;
  margin-left: 8px;
}
</style>