<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { Notice } from '@/types'
import { api } from '@/lib/api'
import Card from '../components/Card.vue'
import GlassModal from '../components/GlassModal.vue'
import { Plus, Edit2, Trash2 } from 'lucide-vue-next'

const notices = ref<Notice[]>([])
const loading = ref(false)
const saving = ref(false)
const deletingId = ref<string | null>(null)
const errorMsg = ref<string | null>(null)

const showModal = ref(false)
const isEdit = ref(false)
const form = ref({
  noticeId: '',
  title: '',
  content: '',
  isPinned: true,
})

function resetForm() {
  form.value = {
    noticeId: '',
    title: '',
    content: '',
    isPinned: true,
  }
}

async function loadNotices() {
  loading.value = true
  errorMsg.value = null
  try {
    notices.value = await api.listNotices()
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : '加载公告失败'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  isEdit.value = false
  resetForm()
  showModal.value = true
}

function openEdit(notice: Notice) {
  isEdit.value = true
  form.value = {
    noticeId: notice.id,
    title: notice.title,
    content: notice.content,
    isPinned: notice.isPinned,
  }
  showModal.value = true
}

async function saveNotice() {
  if (!form.value.title.trim() || !form.value.content.trim()) {
    errorMsg.value = '标题和内容不能为空'
    return
  }

  saving.value = true
  errorMsg.value = null
  try {
    if (isEdit.value) {
      await api.updateNotice({
        noticeId: form.value.noticeId,
        title: form.value.title.trim(),
        content: form.value.content.trim(),
        isPinned: form.value.isPinned,
      })
    } else {
      await api.createNotice({
        title: form.value.title.trim(),
        content: form.value.content.trim(),
        isPinned: form.value.isPinned,
      })
    }
    showModal.value = false
    resetForm()
    await loadNotices()
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : '保存公告失败'
  } finally {
    saving.value = false
  }
}

async function deleteNotice(noticeId: string) {
  if (!window.confirm('确认删除该公告？')) return

  deletingId.value = noticeId
  errorMsg.value = null
  try {
    await api.deleteNotice(noticeId)
    await loadNotices()
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : '删除公告失败'
  } finally {
    deletingId.value = null
  }
}

onMounted(loadNotices)
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold text-white tracking-tight">公告管理</h1>
      <button @click="openCreate" class="glass-btn flex items-center gap-2">
        <Plus class="w-5 h-5" /> 发布公告
      </button>
    </div>

    <div v-if="errorMsg" class="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
      {{ errorMsg }}
    </div>

    <Card no-padding class="overflow-hidden">
      <table class="glass-table">
        <thead>
          <tr>
            <th>标题</th>
            <th>内容摘要</th>
            <th>状态</th>
            <th>发布时间</th>
            <th class="text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="5" class="py-8 text-center text-white/40">加载中...</td>
          </tr>
          <tr v-else-if="notices.length === 0">
            <td colspan="5" class="py-8 text-center text-white/40">暂无公告</td>
          </tr>
          <tr v-for="notice in notices" :key="notice.id" class="group">
            <td class="font-bold text-white">{{ notice.title }}</td>
            <td class="text-white/60 max-w-xs truncate">{{ notice.content }}</td>
            <td>
              <span :class="['glass-badge', notice.isPinned ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/30' : 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30']">
                {{ notice.isPinned ? '置顶' : '普通' }}
              </span>
            </td>
            <td class="text-white/40 text-sm">{{ new Date(notice.createdAt).toLocaleString() }}</td>
            <td class="text-right space-x-2">
              <button @click="openEdit(notice)" class="p-2 hover:bg-white/10 rounded-lg text-cyan-400 transition-colors">
                <Edit2 class="w-4 h-4" />
              </button>
              <button
                class="p-2 hover:bg-white/10 rounded-lg text-red-400 transition-colors disabled:opacity-40"
                :disabled="deletingId === notice.id"
                @click="deleteNotice(notice.id)"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </Card>

    <GlassModal v-model="showModal" :title="isEdit ? '编辑公告' : '发布公告'">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-white/60 mb-1">标题</label>
          <input v-model="form.title" type="text" class="glass-input" placeholder="输入公告标题" />
        </div>
        <div>
          <label class="block text-sm font-medium text-white/60 mb-1">内容</label>
          <textarea v-model="form.content" class="glass-input h-32 resize-none" placeholder="输入公告内容..."></textarea>
        </div>
        <div class="flex items-center gap-2">
          <input v-model="form.isPinned" type="checkbox" class="w-4 h-4 rounded bg-white/10 border-white/20 text-cyan-500" />
          <span class="text-white/80">立即发布</span>
        </div>
      </div>
      <template #footer>
        <button @click="showModal = false" class="glass-btn-secondary" :disabled="saving">取消</button>
        <button @click="saveNotice" class="glass-btn" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</button>
      </template>
    </GlassModal>
  </div>
</template>
